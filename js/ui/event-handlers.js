// event-handlers.js - UI Event Handlers

import appState from '../core/app-state.js';
import { detectContextFromText, createContextChipsHTML } from '../features/context-detective.js';
import { generatePrompt } from '../ai/prompt-generator.js';
import { updateAIToolsGrid as renderAIToolsGrid, setupToolClickHandlers } from '../ai/ai-tools.js';
import { showNotification, showSuccess, showError, showInfo } from './notifications.js';
import modalManager, { openModal, closeModal } from './modal-manager.js';
import { setupVoiceButton } from '../features/voice.js';
import { renderTemplatesGrid } from '../features/templates.js';
import { renderHistoryList } from '../features/history.js';
import { copyPromptToClipboard, exportPromptToFile } from '../ai/prompt-generator.js';

/**
 * Initialize all event handlers
 */
export function initializeEventHandlers() {
  setupRequirementHandlers();
  setupOutputHandlers();
  setupToolHandlers();
  setupModalHandlers();
  setupVoiceHandlers();
  setupUIHandlers();
}

/**
 * Setup requirement section handlers
 */
function setupRequirementHandlers() {
  const requirementEl = document.getElementById('requirement');
  const contextChipsEl = document.getElementById('contextChips');
  const contextBadgeEl = document.getElementById('contextBadge');

  if (!requirementEl) return;

  // Input handler with debouncing
  let inputTimeout;
  requirementEl.addEventListener('input', (e) => {
    clearTimeout(inputTimeout);

    const text = e.target.value.trim();
    appState.setState({ userInput: text });

    inputTimeout = setTimeout(() => {
      if (text.length < 10) {
        contextChipsEl.innerHTML = '';
        contextBadgeEl.textContent = '-';
        appState.setState({ detectedContext: null });
        return;
      }

      // Detect context
      const context = detectContextFromText(text);
      appState.setState({ detectedContext: context });

      // Update UI
      if (context) {
        contextChipsEl.innerHTML = createContextChipsHTML(context.chips);
        contextBadgeEl.textContent = context.taskType;
        renderAIToolsGrid(context.taskType, text, false);
      } else {
        contextChipsEl.innerHTML = '';
        contextBadgeEl.textContent = '-';
      }
    }, 500);
  });

  // Convert button handler
  const convertBtn = document.getElementById('convertBtn');
  if (convertBtn) {
    convertBtn.addEventListener('click', async () => {
      const requirementText = requirementEl.value.trim();
      if (!requirementText) {
        showError('Please enter a requirement first.');
        return;
      }

      convertBtn.disabled = true;
      convertBtn.classList.add('loading');

      try {
        const context = appState.getState().detectedContext || detectContextFromText(requirementText);
        if (!context) {
          showInfo('No context detected — generating a general prompt.');
        } else {
          appState.setState({ detectedContext: context });
        }

        const result = await generatePrompt(requirementText, context);

        // Update output area
        const outputEl = document.getElementById('outputPrompt');
        if (outputEl) outputEl.value = result.prompt;

        // Update stats
        updateOutputStats(result.prompt);

        // Save to history
        appState.addToHistory({
          input: requirementText,
          prompt: result.prompt,
          context: context?.taskType || 'general',
          timestamp: new Date().toISOString(),
        });

        // Update tools grid after prompt generation
        if (context) {
          renderAIToolsGrid(context.taskType, result.prompt, true);
        }

        // Render history and templates
        renderHistoryList();
        renderTemplatesGrid();

        showSuccess('Prompt generated successfully!');
      } catch (err) {
        console.error(err);
        showError('Failed to generate prompt. Please try again.');
      } finally {
        convertBtn.disabled = false;
        convertBtn.classList.remove('loading');
      }
    });
  }
}

/**
 * Setup output section handlers
 */
function setupOutputHandlers() {
  const copyBtn = document.getElementById('copyBtn');
  const exportBtn = document.getElementById('exportBtn');
  const outputEl = document.getElementById('outputPrompt');

  if (copyBtn && outputEl) {
    copyBtn.addEventListener('click', async () => {
      const text = outputEl.value.trim();
      if (!text) {
        showInfo('Nothing to copy yet.');
        return;
      }
      const ok = await copyPromptToClipboard(text);
      ok ? showSuccess('Copied to clipboard!') : showError('Copy failed. Try again.');
    });
  }

  if (exportBtn && outputEl) {
    exportBtn.addEventListener('click', () => {
      const text = outputEl.value.trim();
      if (!text) {
        showInfo('Nothing to export yet.');
        return;
      }
      exportPromptToFile(text);
      showSuccess('Export started.');
    });
  }
}

/**
 * Setup tool handlers
 */
function setupToolHandlers() {
  setupToolClickHandlers();

  // If there is a detected context, render tools grid on load
  const state = appState.getState();
  if (state?.detectedContext?.taskType) {
    renderAIToolsGrid(state.detectedContext.taskType, state.userInput || '', false);
  }
}

/**
 * Setup modal handlers
 */
function setupModalHandlers() {
  // Delegated modal open/close (if any)
  document.addEventListener('click', (e) => {
    const openTarget = e.target.closest('[data-open-modal]');
    if (openTarget) {
      const modalId = openTarget.getAttribute('data-open-modal');
      if (modalId) openModal(modalId);
      return;
    }

    const closeTarget = e.target.closest('[data-close-modal]');
    if (closeTarget) {
      const modalId = closeTarget.getAttribute('data-close-modal');
      if (modalId) closeModal(modalId);
      return;
    }
  });

  // ESC to close top modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalManager.closeTopModal();
    }
  });
}

/**
 * Setup voice handlers
 */
function setupVoiceHandlers() {
  // Voice button is wired through features/voice.js
  setupVoiceButton();
}

/**
 * Setup UI handlers
 */
function setupUIHandlers() {
  // Any additional UI wiring can be added here.
}

/**
 * Update output stats
 */
function updateOutputStats(text) {
  const wordCountEl = document.getElementById('wordCount');
  const charCountEl = document.getElementById('charCount');
  const usageCountEl = document.getElementById('usageCount');

  if (!text) {
    if (wordCountEl) wordCountEl.textContent = '0';
    if (charCountEl) charCountEl.textContent = '0';
    return;
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  const chars = text.length;

  if (wordCountEl) wordCountEl.textContent = String(words.length);
  if (charCountEl) charCountEl.textContent = String(chars);

  // Optional: update usage count if you track it
  if (usageCountEl) {
    // If appState tracks usage count, reflect it
    const usage = appState.getState()?.usageCount ?? null;
    if (usage !== null) usageCountEl.textContent = String(usage);
  }
}
