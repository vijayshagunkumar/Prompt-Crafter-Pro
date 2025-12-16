import { PRESETS } from './presets.js';
import { analyzeText } from '../features/context-detective.js';

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-3.5-turbo";

export class PromptGenerator {
  constructor(apiKey = '') {
    this.apiKey = apiKey;
  }
  
  // Main generation function
  async generate(requirement, presetId = 'default', useOpenAI = true) {
    if (!requirement.trim()) {
      throw new Error('Requirement is empty');
    }
    
    const { role } = analyzeText(requirement);
    const preset = PRESETS[presetId] || PRESETS.default;
    
    if (useOpenAI && this.apiKey) {
      return await this.generateWithOpenAI(requirement, role, presetId);
    } else {
      return this.generateLocally(requirement, role, presetId);
    }
  }
  
  // Local generation (fallback)
  generateLocally(requirement, role, presetId) {
    const preset = PRESETS[presetId] || PRESETS.default;
    let prompt = preset(role, requirement);
    return this.sanitize(prompt);
  }
  
  // OpenAI API generation
  async generateWithOpenAI(requirement, role, presetId) {
    try {
      const presetTemplate = PRESETS[presetId]("[ROLE]", "[REQUIREMENT]");
      
      const systemPrompt = `
You write structured task instructions for AI models.

Using the TEMPLATE below, replace [ROLE] with an appropriate expert role (for example: "${role}")
and [REQUIREMENT] with the user's requirement. Return ONLY the completed template and nothing else.

TEMPLATE:
${presetTemplate}

Important:
- The template you return must tell the AI to directly perform the task and return the final result.
- Do NOT mention prompts, prompt generation, or rewriting instructions in your output.
`.trim();

      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.apiKey
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `User requirement: "${requirement}"` }
          ],
          temperature: 0.1,
          max_tokens: 700
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedPrompt = data.choices?.[0]?.message?.content?.trim() || '';
      return this.sanitize(generatedPrompt);
      
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      // Fall back to local generation
      return this.generateLocally(requirement, role, presetId);
    }
  }
  
  // Clean up the prompt
  sanitize(text) {
    if (!text) return "";
    
    let cleaned = text;
    // Remove code blocks
    cleaned = cleaned.replace(/^```[^\n]*\n?/g, "");
    cleaned = cleaned.replace(/```$/g, "");
    
    // Remove forbidden phrases
    const forbiddenLineRegex =
      /(prompt generator|generate a prompt|convert .*requirement .*prompt|rewrite .*prompt|rewrite .*requirement)/i;
    
    cleaned = cleaned
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        if (/^```/.test(trimmed)) return false;
        if (forbiddenLineRegex.test(trimmed)) return false;
        return true;
      })
      .join("\n");
    
    // Replace remaining forbidden terms
    cleaned = cleaned.replace(/prompt generator/gi, "assistant");
    cleaned = cleaned.replace(
      /generate a prompt/gi,
      "perform the task and return the final answer"
    );
    
    return cleaned.trim();
  }
}
