// prompt-generator.js - Prompt Generation Logic

import { OPENAI_API_URL, OPENAI_MODEL } from '../core/constants.js';
import { PRESETS, localFormatter } from './presets.js';
import { detectContextFromText, buildContextAwareRequirement, getRoleAndPreset } from '../features/context-detective.js';
import appState from '../core/app-state.js';

/**
 * Generate prompt using OpenAI API or local formatter
 * @param {string} rawRequirement - User's raw requirement
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generation result
 */
export async function generatePrompt(rawRequirement, options = {}) {
  const {
    apiKey = localStorage.getItem('OPENAI_API_KEY')?.trim(),
    preset = appState.currentPreset,
    useAI = true
  } = options;

  // Detect context
  const context = detectContextFromText(rawRequirement);
  const requirementWithContext = buildContextAwareRequirement(rawRequirement, context);
  
  // Get role and preset
  const { role, preset: autoPreset, label } = getRoleAndPreset(rawRequirement);
  
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

  try {
    if (useAI && apiKey) {
      // Use OpenAI API
      generatedPrompt = await generateWithOpenAI(
        rawRequirement, 
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
      source = 'local';
    }

    // Update app state
    appState.isConverted = true;
    appState.lastConvertedText = rawRequirement;
    appState.incrementUsageCount();

    // Add to history
    appState.addHistoryItem({
      role,
      presetLabel: label,
      raw: rawRequirement,
      prompt: generatedPrompt
    });

    return {
      success: true,
      prompt: generatedPrompt,
      source,
      context,
      role,
      preset: appState.currentPreset
    };

  } catch (error) {
    console.error('Generation error:', error);
    
    // Fallback to local formatter
    generatedPrompt = localFormatter(
      requirementWithContext, 
      role, 
      preset, 
      getRoleAndPreset
    );

    return {
      success: false,
      prompt: generatedPrompt,
      source: 'local-fallback',
      context,
      role,
      preset: appState.currentPreset,
      error: error.message
    };
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
  const templateSkeleton = PRESETS[preset]("[ROLE]", "[REQUIREMENT]");

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

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1,
      max_tokens: 700
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

/**
 * Export prompt to file
 * @param {string} prompt - Generated prompt
 * @param {string} filename - Filename (optional)
 */
export function exportPromptToFile(prompt, filename = "prompt.txt") {
  const blob = new Blob([prompt], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Copy prompt to clipboard
 * @param {string} prompt - Generated prompt
 * @returns {Promise<boolean>} Success status
 */
export async function copyPromptToClipboard(prompt) {
  try {
    await navigator.clipboard.writeText(prompt);
    return true;
  } catch (error) {
    console.error('Clipboard error:', error);
    
    // Fallback method
    try {
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
    } catch (fallbackError) {
      console.error('Fallback clipboard error:', fallbackError);
      return false;
    }
  }
}

/**
 * Validate API key format
 * @param {string} apiKey - OpenAI API key
 * @returns {boolean} True if valid format
 */
export function validateApiKey(apiKey) {
  if (!apiKey) return false;
  // Basic validation - OpenAI keys typically start with 'sk-'
  return apiKey.trim().startsWith('sk-');
}
