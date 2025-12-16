// prompt-generator.js – Core Prompt Generation Engine

import { OPENAI_API_URL, OPENAI_MODEL } from '../core/constants.js';
import { PRESETS, localFormatter } from './presets.js';
import { getRoleAndPreset } from '../features/context-detective.js';
import appState from '../core/app-state.js';

/**
 * Sanitize generated output
 */
function sanitizePrompt(text = '') {
  let cleaned = text;

  cleaned = cleaned.replace(/^```[^\n]*\n?/g, '');
  cleaned = cleaned.replace(/```$/g, '');

  const forbidden =
    /(prompt generator|generate a prompt|rewrite .*prompt|convert .*requirement)/i;

  cleaned = cleaned
    .split('\n')
    .filter(line => !forbidden.test(line.trim()))
    .join('\n');

  return cleaned.trim();
}

/**
 * Main generation function
 */
export async function generatePrompt(rawRequirement) {
  if (!rawRequirement) {
    return { success: false, prompt: '' };
  }

  const { role, preset: autoPreset, label } =
    getRoleAndPreset(rawRequirement);

  // Auto preset selection unless locked
  if (!appState.userPresetLocked && PRESETS[autoPreset]) {
    appState.currentPreset = autoPreset;
    appState.lastPresetSource = 'auto';
  }

  appState.lastTaskLabel = label;
  appState.lastRole = role;

  const apiKey = localStorage.getItem('OPENAI_API_KEY')?.trim();
  let finalPrompt = '';

  try {
    if (!apiKey) {
      // OFFLINE MODE
      finalPrompt = localFormatter(
        appState.currentPreset,
        role,
        rawRequirement
      );
    } else {
      // API MODE (same logic as old app.js)
      const templateSkeleton =
        PRESETS[appState.currentPreset]('[ROLE]', '[REQUIREMENT]');

      const systemPrompt = `
You write structured task instructions for AI models.

Using the TEMPLATE below:
- Replace [ROLE] with "${role}"
- Replace [REQUIREMENT] with the user requirement
- Return ONLY the filled template

TEMPLATE:
${templateSkeleton}

Rules:
- Do NOT mention prompts or prompt generation
- The AI must directly perform the task
`.trim();

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `User requirement: "${rawRequirement}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 700
        })
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      finalPrompt =
        data.choices?.[0]?.message?.content ||
        localFormatter(appState.currentPreset, role, rawRequirement);
    }
  } catch (err) {
    finalPrompt = localFormatter(
      appState.currentPreset,
      role,
      rawRequirement
    );
  }

  finalPrompt = sanitizePrompt(finalPrompt);

  // Update state
  appState.isConverted = true;
  appState.lastConvertedText = rawRequirement;

  return {
    success: true,
    prompt: finalPrompt
  };
}

/**
 * Clipboard helper (used by UI)
 */
export async function copyPromptToClipboard(text) {
  await navigator.clipboard.writeText(text);
  return true;
}

/**
 * Export helper
 */
export function exportPromptToFile(text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prompt.txt';
  a.click();
  URL.revokeObjectURL(url);
}
