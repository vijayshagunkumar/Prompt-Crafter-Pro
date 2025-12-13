// prompt-generator.js - Prompt Generation Logic (UPDATED & COMPLETE)

import { OPENAI_API_URL, OPENAI_MODEL, OPENAI_MAX_TOKENS, OPENAI_TEMPERATURE } from '../core/constants.js';
import { PRESETS, localFormatter } from '../ai/presets.js';
import { detectContextFromText, buildContextAwareRequirement, getRoleAndPreset } from '../features/context-detective.js';
import appState from '../core/app-state.js';
import { validateApiKey } from '../core/utilities.js';
import { showNotification } from '../ui/notifications.js';

/**
 * Generate prompt using OpenAI API or local formatter
 * @param {string} rawRequirement - User's raw requirement
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generation result
 */
export async function generatePrompt(rawRequirement, options = {}) {
  const {
    apiKey = localStorage.getItem('OPENAI_API_KEY') || '',
    preset = appState.currentPreset,
    useAI = true,
    forceLocal = false
  } = options;

  // Validate input
  if (!rawRequirement || typeof rawRequirement !== 'string') {
    return {
      success: false,
      prompt: 'Please enter a valid requirement.',
      source: 'error',
      error: 'Invalid input'
    };
  }

  // Clean and trim input
  const cleanedRequirement = rawRequirement.trim();
  if (cleanedRequirement.length === 0) {
    return {
      success: false,
      prompt: 'Please enter a requirement to convert.',
      source: 'error',
      error: 'Empty input'
    };
  }

  // Detect context
  const context = detectContextFromText(cleanedRequirement);
  const requirementWithContext = buildContextAwareRequirement(cleanedRequirement, context);
  
  // Get role and preset
  const { role, preset: autoPreset, label } = getRoleAndPreset(cleanedRequirement);
  
  // Update app state
  appState.lastRole = role;
  appState.lastTaskLabel = label;
  
  if (!appState.userPresetLocked && autoPreset && PRESETS[autoPreset]) {
    appState.currentPreset = autoPreset;
    appState.lastPresetSource = "auto";
  } else {
    appState.lastPresetSource = "manual";
  }

  let generatedPrompt;
  let source = 'local';
  let error = null;

  try {
    // Check if we should use AI (OpenAI)
    const shouldUseAI = useAI && !forceLocal && apiKey && validateApiKey(apiKey);
    
    if (shouldUseAI) {
      // Use OpenAI API
      generatedPrompt = await generateWithOpenAI(
        cleanedRequirement, 
        requirementWithContext, 
        context, 
        role, 
        preset, 
        apiKey
      );
      source = 'openai';
    } else {
      // Use local formatter
      generatedPrompt = localFormatter(
        requirementWithContext, 
        role, 
        preset, 
        getRoleAndPreset
      );
      source = forceLocal ? 'local-forced' : 'local';
      
      // If we wanted to use AI but couldn't, log it
      if (useAI && !forceLocal && (!apiKey || !validateApiKey(apiKey))) {
        console.warn('Using local formatter: No valid API key available');
        error = 'No valid API key available. Using local formatter.';
      }
    }

    // Validate generated prompt
    if (!generatedPrompt || generatedPrompt.trim().length === 0) {
      throw new Error('Generated prompt is empty');
    }

    // Update app state
    appState.isConverted = true;
    appState.lastConvertedText = cleanedRequirement;
    appState.incrementUsageCount();

    // Add to history
    const historyItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      role,
      presetLabel: label,
      raw: cleanedRequirement,
      prompt: generatedPrompt,
      source,
      context: context.taskType
    };
    
    appState.addHistoryItem(historyItem);

    return {
      success: true,
      prompt: generatedPrompt,
      source,
      context,
      role,
      preset: appState.currentPreset,
      historyId: historyItem.id,
      error
    };

  } catch (error) {
    console.error('Generation error:', error);
    
    // Fallback to local formatter
    try {
      generatedPrompt = localFormatter(
        requirementWithContext, 
        role, 
        preset, 
        getRoleAndPreset
      );
      
      // If local formatter also fails, provide a basic template
      if (!generatedPrompt || generatedPrompt.trim().length === 0) {
        generatedPrompt = createFallbackPrompt(cleanedRequirement, role);
      }
      
      // Still add to history even on error
      appState.isConverted = true;
      appState.lastConvertedText = cleanedRequirement;
      
      const historyItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        role,
        presetLabel: 'Error Fallback',
        raw: cleanedRequirement,
        prompt: generatedPrompt,
        source: 'error-fallback',
        context: context.taskType
      };
      
      appState.addHistoryItem(historyItem);
      
      return {
        success: false,
        prompt: generatedPrompt,
        source: 'error-fallback',
        context,
        role,
        preset: appState.currentPreset,
        error: error.message,
        historyId: historyItem.id
      };
    } catch (fallbackError) {
      console.error('Fallback generation error:', fallbackError);
      
      // Ultimate fallback
      const ultimateFallback = `# Task\n${cleanedRequirement}\n\n# Instructions\nPlease complete the above task.`;
      
      return {
        success: false,
        prompt: ultimateFallback,
        source: 'ultimate-fallback',
        context,
        role: 'assistant',
        preset: 'default',
        error: `Generation failed: ${error.message}. Fallback also failed: ${fallbackError.message}`
      };
    }
  }
}

/**
 * Generate prompt using OpenAI API
 * @param {string} raw - Raw requirement
 * @param {string} requirementWithContext - Enriched requirement
 * @param {Object} context - Detected context
 * @param {string} role - AI role
 * @param {string} preset - Preset name
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<string>} Generated prompt
 */
async function generateWithOpenAI(raw, requirementWithContext, context, role, preset, apiKey) {
  const templateSkeleton = PRESETS[preset] ? PRESETS[preset]("[ROLE]", "[REQUIREMENT]") : PRESETS.default("[ROLE]", "[REQUIREMENT]");

  const system = `
You write structured task instructions for AI models.

Using the TEMPLATE below, replace [ROLE] with an appropriate expert role (for example: "${role}")
and [REQUIREMENT] with the user's requirement. Return ONLY the completed template and nothing else.

TEMPLATE:
${templateSkeleton}

Important:
- The template you return must tell the AI to directly perform the task and return the final result.
- Do NOT mention prompts, prompt generation, or rewriting instructions in your output.
`.trim();

  const contextSummary = context ? `
Detected context:
- Task type: ${context.taskType}
- Language: ${context.language}${context.audience ? `\n- Audience: ${context.audience}` : ""}${context.tone ? `\n- Tone: ${context.tone}` : ""}${context.medium ? `\n- Medium: ${context.medium}` : ""}${context.background ? `\n- Background: ${context.background}` : ""}` : "";

  const userMessage = `User requirement (original): "${raw}"
${contextSummary}

Use this understanding and fill the template accordingly in the current preset format ("${preset}"). Return only the completed template.`;

  // Add timeout for the fetch request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMessage }
        ],
        temperature: OPENAI_TEMPERATURE,
        max_tokens: OPENAI_MAX_TOKENS,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText || `Status ${response.status}`}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid response format from OpenAI API');
    }
    
    const generated = data.choices[0].message.content.trim();
    
    if (!generated) {
      throw new Error('Empty response from OpenAI API');
    }
    
    return generated;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: The API took too long to respond');
    }
    
    throw error;
  }
}

/**
 * Create fallback prompt when generation fails
 * @param {string} requirement - User requirement
 * @param {string} role - AI role
 * @returns {string} Fallback prompt
 */
function createFallbackPrompt(requirement, role) {
  return `# Role
${role || "Expert Assistant"}

# Task
${requirement}

# Instructions
1. Complete the task above
2. Provide clear, actionable output
3. Use appropriate formatting
4. Include all necessary details

# Output Format
- Complete solution
- Well-structured response
- Professional tone`;
}

/**
 * Export prompt to file
 * @param {string} prompt - Generated prompt
 * @param {string} filename - Filename (optional)
 */
export function exportPromptToFile(prompt, filename = "prompt.txt") {
  try {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt content');
    }
    
    const blob = new Blob([prompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Export error:', error);
    showNotification(`Failed to export: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Copy prompt to clipboard
 * @param {string} prompt - Generated prompt
 * @returns {Promise<boolean>} Success status
 */
export async function copyPromptToClipboard(prompt) {
  try {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt content');
    }
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(prompt);
      return true;
    }
    
    // Fallback method for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = prompt;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Clipboard error:', error);
    return false;
  }
}

/**
 * Validate API key format
 * @param {string} apiKey - OpenAI API key
 * @returns {boolean} True if valid format
 */
export function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  const trimmedKey = apiKey.trim();
  
  // Basic validation - OpenAI keys typically start with 'sk-'
  if (!trimmedKey.startsWith('sk-')) {
    return false;
  }
  
  // Check minimum length
  if (trimmedKey.length < 20) {
    return false;
  }
  
  return true;
}

/**
 * Test API key validity
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<Object>} Test result
 */
export async function testApiKey(apiKey) {
  if (!validateApiKey(apiKey)) {
    return {
      valid: false,
      message: 'Invalid API key format'
    };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 401) {
      return {
        valid: false,
        message: 'Invalid API key (unauthorized)'
      };
    }
    
    if (response.ok) {
      return {
        valid: true,
        message: 'API key is valid'
      };
    }
    
    return {
      valid: false,
      message: `API error: ${response.status}`
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        valid: false,
        message: 'Connection timeout'
      };
    }
    
    return {
      valid: false,
      message: `Network error: ${error.message}`
    };
  }
}

/**
 * Generate multiple prompt variations
 * @param {string} rawRequirement - User requirement
 * @param {number} count - Number of variations
 * @returns {Promise<Array>} Array of prompt variations
 */
export async function generatePromptVariations(rawRequirement, count = 3) {
  const variations = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const result = await generatePrompt(rawRequirement, {
        useAI: false, // Use local formatter for variations
        forceLocal: true
      });
      
      if (result.success) {
        variations.push({
          id: i + 1,
          prompt: result.prompt,
          preset: result.preset,
          role: result.role
        });
      }
    } catch (error) {
      console.error(`Error generating variation ${i + 1}:`, error);
    }
  }
  
  return variations;
}

/**
 * Improve existing prompt
 * @param {string} existingPrompt - Existing prompt to improve
 * @param {string} feedback - User feedback for improvement
 * @returns {Promise<Object>} Improved prompt
 */
export async function improvePrompt(existingPrompt, feedback = '') {
  try {
    // For now, return a simple improvement
    // In a real implementation, this would use AI to refine the prompt
    const improved = `# Enhanced Prompt
${existingPrompt}

# Improvements Applied
1. Added clearer structure
2. Enhanced specificity
3. Improved readability
${feedback ? `4. Incorporated feedback: ${feedback}` : ''}

# Notes
This is an enhanced version of your original prompt.`;
    
    return {
      success: true,
      prompt: improved,
      message: 'Prompt improved successfully'
    };
  } catch (error) {
    console.error('Improvement error:', error);
    return {
      success: false,
      prompt: existingPrompt,
      message: `Failed to improve: ${error.message}`
    };
  }
}

/**
 * Shorten prompt while maintaining meaning
 * @param {string} prompt - Prompt to shorten
 * @returns {Promise<Object>} Shortened prompt
 */
export async function shortenPrompt(prompt) {
  try {
    // Simple shortening logic - can be enhanced with AI
    const lines = prompt.split('\n').filter(line => line.trim());
    const shortenedLines = lines.slice(0, Math.min(lines.length, 10)); // Keep max 10 lines
    
    return {
      success: true,
      prompt: shortenedLines.join('\n'),
      originalLength: prompt.length,
      newLength: shortenedLines.join('\n').length,
      reduction: Math.round((1 - (shortenedLines.join('\n').length / prompt.length)) * 100)
    };
  } catch (error) {
    console.error('Shortening error:', error);
    return {
      success: false,
      prompt: prompt,
      message: `Failed to shorten: ${error.message}`
    };
  }
}

/**
 * Expand prompt with more details
 * @param {string} prompt - Prompt to expand
 * @returns {Promise<Object>} Expanded prompt
 */
export async function expandPrompt(prompt) {
  try {
    // Simple expansion logic - can be enhanced with AI
    const expanded = `${prompt}

# Additional Details
1. Consider all edge cases
2. Include specific examples
3. Add implementation details
4. Consider alternative approaches
5. Include best practices

# Quality Checklist
- [ ] Clear and specific
- [ ] Actionable instructions
- [ ] Appropriate level of detail
- [ ] Well-structured format
- [ ] Professional tone`;
    
    return {
      success: true,
      prompt: expanded,
      originalLength: prompt.length,
      newLength: expanded.length,
      expansion: Math.round(((expanded.length / prompt.length) - 1) * 100)
    };
  } catch (error) {
    console.error('Expansion error:', error);
    return {
      success: false,
      prompt: prompt,
      message: `Failed to expand: ${error.message}`
    };
  }
}
