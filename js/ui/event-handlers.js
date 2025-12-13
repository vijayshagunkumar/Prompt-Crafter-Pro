// event-handlers.js - UI Event Handlers (UPDATED & COMPLETE)

import appState from '../core/app-state.js';
import { detectContextFromText, createContextChipsHTML } from '../features/context-detective.js';
import { generatePrompt } from '../ai/prompt-generator.js';
import { updateAIToolsGrid, setupToolClickHandlers, getRecommendedTool } from '../ai/ai-tools.js';
import { showNotification, showSuccess, showError, showInfo } from './notifications.js';
import modalManager, { openModal, closeModal } from './modal-manager.js';
import { setupVoiceButton, isVoiceSupported } from '../features/voice.js';
import { renderTemplatesGrid } from '../features/templates.js';
import { renderHistoryList } from '../features/history.js';
import { copyPromptToClipboard, exportPromptToFile } from '../ai/prompt-generator.js';
import { setTheme } from './theme-manager.js';
import { openSettingsModal } from './settings-manager.js';

/**
 * Initialize all event handlers
 */
export function initializeEventHandlers() {
  console.log('🔧 Initializing event handlers...');
  
  setupRequirementHandlers();
  setupOutputHandlers();
  setupToolHandlers();
  setupModalHandlers();
  setupVoiceHandlers();
  setupUIHandlers();
  setupSettingsHandlers();
  setupKeyboardShortcuts();
  
  console.log('✅ Event handlers initialized');
}

/**
 * Setup requirement textarea handlers
 */
function setupRequirementHandlers() {
  const requirementEl = document.getElementById('requirement');
  const clearBtn = document.getElementById('clearRequirementBtn');
  const autoConvertCheckbox = document.getElementById('autoConvert');
  const presetSelect = document.getElementById('presetSelect');
  const lockPresetCheckbox = document.getElementById('lockPreset');
  const contextChipsRow = document.getElementById('contextChipsRow');

  if (!requirementEl) {
    console.warn('Requirement textarea not found');
    return;
  }

  // Input handler with debouncing
  let inputTimeout;
  requirementEl.addEventListener('input', () => {
    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(() => {
      handleRequirementInput(requirementEl, contextChipsRow);
    }, 300);
    
    // Update stats immediately
    updateInputStats(requirementEl.value);
  });

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      requirementEl.value = '';
      requirementEl.focus();
      handleRequirementInput(requirementEl, contextChipsRow);
      showInfo('Input cleared');
      
      // Clear output if it exists
      const outputEl = document.getElementById('output');
      if (outputEl) {
        outputEl.value = '';
        updateOutputStats();
      }
    });
  }

  // Auto-convert toggle
  if (autoConvertCheckbox) {
    autoConvertCheckbox.addEventListener('change', (e) => {
      appState.autoConvertEnabled = e.target.checked;
      localStorage.setItem('autoConvertEnabled', e.target.checked);
      showNotification(`Auto-convert ${e.target.checked ? 'enabled' : 'disabled'}`);
      
      if (!appState.autoConvertEnabled) {
        appState.clearAutoConvertTimers();
      }
    });
  }

  // Preset selection
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      appState.currentPreset = e.target.value;
      appState.userPresetLocked = lockPresetCheckbox?.checked || false;
      appState.lastPresetSource = "manual";
      
      // If there's text, update context and AI tools
      if (requirementEl.value.trim()) {
        const context = detectContextFromText(requirementEl.value);
        updateAIToolsGrid(context.taskType, requirementEl.value, false);
      }
      
      showNotification(`Preset changed to ${e.target.options[e.target.selectedIndex].text}`);
    });
  }

  // Lock preset
  if (lockPresetCheckbox) {
    lockPresetCheckbox.addEventListener('change', (e) => {
      appState.userPresetLocked = e.target.checked;
      showNotification(`Preset lock ${e.target.checked ? 'enabled' : 'disabled'}`);
    });
  }

  // Initial setup
  handleRequirementInput(requirementEl, contextChipsRow);
}

/**
 * Handle requirement input
 * @param {HTMLElement} requirementEl - Requirement textarea
 * @param {HTMLElement} contextChipsRow - Context chips container
 */
function handleRequirementInput(requirementEl, contextChipsRow) {
  const text = requirementEl.value;
  const convertBtn = document.getElementById('convertBtn');
  const outputEl = document.getElementById('output');

  // Update context chips
  if (contextChipsRow) {
    const context = detectContextFromText(text);
    if (context && context.taskType && text.trim()) {
      contextChipsRow.innerHTML = createContextChipsHTML(context);
      contextChipsRow.style.display = 'flex';
      
      // Update AI tools based on context
      updateAIToolsGrid(context.taskType, text, false);
      
      // Update recommendation banner
      updateToolRecommendation(text, context.taskType);
    } else {
      contextChipsRow.innerHTML = '';
      contextChipsRow.style.display = 'none';
    }
  }

  // Clear output if user is typing new requirement
  if (appState.isConverted && text !== appState.lastConvertedText) {
    if (outputEl) {
      outputEl.value = '';
      appState.isConverted = false;
      
      const convertedBadge = document.getElementById('convertedBadge');
      if (convertedBadge) convertedBadge.style.display = 'none';
      
      updateLaunchButtons(false);
      updateOutputStats();
    }
  }

  // Update convert button state
  if (convertBtn) {
    convertBtn.disabled = !text.trim();
  }

  // Update input stats
  updateInputStats(text);
}

/**
 * Setup output handlers
 */
function setupOutputHandlers() {
  const copyBtn = document.getElementById('copyOutputBtn');
  const exportBtn = document.getElementById('exportBtn');
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');
  const convertBtn = document.getElementById('convertBtn');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const improveBtn = document.getElementById('improveBtn');
  const shortenBtn = document.getElementById('shortenBtn');
  const lengthenBtn = document.getElementById('lengthenBtn');

  // Copy to clipboard
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const outputEl = document.getElementById('output');
      const prompt = outputEl.value.trim();
      
      if (!prompt) {
        showError('No prompt to copy');
        return;
      }

      const success = await copyPromptToClipboard(prompt);

      if (success) {
        showSuccess('Prompt copied to clipboard');
        
        // Add animation feedback
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          copyBtn.innerHTML = '<i
