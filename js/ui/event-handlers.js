// event-handlers.js - UI Event Handlers

import appState from '../core/app-state.js';
import { detectContextFromText, createContextChipsHTML } from '../features/context-detective.js';
import { generatePrompt } from '../ai/prompt-generator.js';
import { updateAIToolsGrid, setupToolClickHandlers } from '../ai/ai-tools.js';
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
 * Setup requirement textarea handlers
 */
function setupRequirementHandlers() {
  const requirementEl = document.getElementById('requirement');
  const clearBtn = document.getElementById('clearRequirementBtn');
  const autoConvertCheckbox = document.getElementById('autoConvert');
  const presetSelect = document.getElementById('presetSelect');
  const lockPresetCheckbox = document.getElementById('lockPreset');
  const contextChipsRow = document.getElementById('contextChipsRow');

  if (!requirementEl) return;

  // Input handler with debouncing
  let inputTimeout;
  requirementEl.addEventListener('input', () => {
    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(() => {
      handleRequirementInput(requirementEl, contextChipsRow);
    }, 300);
  });

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      requirementEl.value = '';
      handleRequirementInput(requirementEl, contextChipsRow);
      showInfo('Input cleared');
    });
  }

  // Auto-convert toggle
  if (autoConvertCheckbox) {
    autoConvertCheckbox.addEventListener('change', (e) => {
      appState.autoConvertEnabled = e.target.checked;
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
    });
  }

  // Lock preset
  if (lockPresetCheckbox) {
    lockPresetCheckbox.addEventListener('change', (e) => {
      appState.userPresetLocked = e.target.checked;
    });
  }
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
    } else {
      contextChipsRow.innerHTML = '';
      contextChipsRow.style.display = 'none';
    }
  }

  // Clear output if user is typing new requirement
  if (appState.isConverted && text !== appState.lastConvertedText) {
    outputEl.value = '';
    appState.isConverted = false;
    
    const convertedBadge = document.getElementById('convertedBadge');
    if (convertedBadge) convertedBadge.style.display = 'none';
    
    updateLaunchButtons(false);
  }

  // Update convert button state
  if (convertBtn) {
    convertBtn.disabled = !text.trim();
  }

  // Update stats
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
      } else {
        showError('Failed to copy to clipboard');
      }
    });
  }

  // Export prompt
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const outputEl = document.getElementById('output');
      const prompt = outputEl.value.trim();
      
      if (!prompt) {
        showError('No prompt to export');
        return;
      }

      exportPromptToFile(prompt);
      showSuccess('Prompt exported as prompt.txt');
    });
  }

  // Save as template
  if (saveTemplateBtn) {
    saveTemplateBtn.addEventListener('click', () => {
      const requirementEl = document.getElementById('requirement');
      const content = requirementEl.value.trim();
      
      if (!content) {
        showError('Type something to save as a template');
        return;
      }

      showTemplateSaveDialog(content);
    });
  }

  // Convert button
  if (convertBtn) {
    convertBtn.addEventListener('click', async () => {
      await handleConvert();
    });
  }
}

/**
 * Handle convert button click
 */
async function handleConvert() {
  const requirementEl = document.getElementById('requirement');
  const outputEl = document.getElementById('output');
  const convertBtn = document.getElementById('convertBtn');
  const convertedBadge = document.getElementById('convertedBadge');
  
  const raw = requirementEl.value.trim();
  if (!raw) {
    showError('Please enter a requirement first');
    return;
  }

  // Disable button and show loading
  convertBtn.disabled = true;
  const originalText = convertBtn.innerHTML;
  convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

  try {
    const result = await generatePrompt(raw);
    
    if (result.success) {
      outputEl.value = result.prompt;
      
      // Show converted badge
      if (convertedBadge) {
        convertedBadge.style.display = 'inline-flex';
      }
      
      // Update UI
      updateOutputStats();
      updateLaunchButtons(true);
      
      // Update AI tools with new context
      const context = detectContextFromText(raw);
      updateAIToolsGrid(context.taskType, result.prompt, true);
      
      showSuccess('Prompt generated successfully');
    } else {
      showError('Generation failed, using offline mode');
      outputEl.value = result.prompt;
      updateOutputStats();
      updateLaunchButtons(true);
      
      // Still update AI tools
      const context = detectContextFromText(raw);
      updateAIToolsGrid(context.taskType, result.prompt, true);
    }
  } catch (error) {
    console.error('Conversion error:', error);
    showError('Failed to generate prompt');
  } finally {
    // Restore button
    convertBtn.disabled = false;
    convertBtn.innerHTML = originalText;
  }
}

/**
 * Setup tool handlers
 */
function setupToolHandlers() {
  // Tool click handlers are now handled by ai-tools.js
  // setupToolClickHandlers is called from app.js
}

/**
 * Setup modal handlers
 */
function setupModalHandlers() {
  const openTemplatesBtn = document.getElementById('openTemplatesBtn');
  const closeTemplatesBtn = document.getElementById('closeTemplatesBtn');
  const openHistoryBtn = document.getElementById('openHistoryBtn');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const templatesGrid = document.getElementById('templatesGrid');
  const historyList = document.getElementById('historyList');

  // Templates modal
  if (openTemplatesBtn) {
    openTemplatesBtn.addEventListener('click', () => {
      templatesGrid.innerHTML = renderTemplatesGrid();
      openModal('templatesModal');
    });
  }

  if (closeTemplatesBtn) {
    closeTemplatesBtn.addEventListener('click', () => {
      closeModal('templatesModal');
    });
  }

  // History modal
  if (openHistoryBtn) {
    openHistoryBtn.addEventListener('click', () => {
      historyList.innerHTML = renderHistoryList();
      openModal('historyModal');
    });
  }

  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', () => {
      closeModal('historyModal');
    });
  }

  // Register modals
  const templatesModal = document.getElementById('templatesModal');
  const historyModal = document.getElementById('historyModal');

  if (templatesModal) {
    modalManager.register('templatesModal', templatesModal);
  }

  if (historyModal) {
    modalManager.register('historyModal', historyModal);
  }
}

/**
 * Setup voice handlers
 */
function setupVoiceHandlers() {
  const voiceBtn = document.getElementById('voiceBtn');
  const requirementEl = document.getElementById('requirement');
  
  if (voiceBtn && requirementEl) {
    setupVoiceButton(voiceBtn, requirementEl, (transcript, error) => {
      if (error) {
        showError(error);
      } else if (transcript) {
        showSuccess('Voice input captured');
      }
    });
  }
}

/**
 * Setup general UI handlers
 */
function setupUIHandlers() {
  // Update usage count display
  updateUsageCount();
}

/**
 * Update AI tools grid
 * @param {string} taskType - Task type
 * @param {string} promptText - Prompt text
 * @param {boolean} isConverted - Whether prompt is generated
 */
function updateAIToolsGrid(taskType, promptText, isConverted) {
  updateAIToolsGrid(taskType, promptText, isConverted);
}

/**
 * Update launch buttons state
 * @param {boolean} enabled - Whether buttons should be enabled
 */
function updateLaunchButtons(enabled) {
  const toolCards = document.querySelectorAll('.tool-card');
  toolCards.forEach(card => {
    if (enabled) {
      card.classList.remove('tool-card-disabled');
      card.disabled = false;
    } else {
      card.classList.add('tool-card-disabled');
      card.disabled = true;
    }
  });
}

/**
 * Update input stats
 * @param {string} text - Input text
 */
function updateInputStats(text) {
  const inputStats = document.getElementById('inputStats');
  if (inputStats) {
    inputStats.textContent = `${text.length} chars`;
  }
}

/**
 * Update output stats
 */
function updateOutputStats() {
  const outputEl = document.getElementById('output');
  const outputStats = document.getElementById('outputStats');
  if (outputStats && outputEl) {
    outputStats.textContent = `${outputEl.value.length} chars`;
  }
}

/**
 * Update usage count display
 */
function updateUsageCount() {
  const usageElement = document.getElementById('usageCount');
  if (usageElement) {
    usageElement.innerHTML = `<i class="fas fa-bolt"></i>${appState.usageCount} prompts generated`;
  }
}

/**
 * Show template save dialog
 * @param {string} content - Template content
 */
function showTemplateSaveDialog(content) {
  const name = prompt('Template name:');
  if (!name) return;

  const description = prompt('Short description (optional):') || 'Custom template';
  const category = 'other';

  if (appState.editingTemplateId) {
    // Update existing template
    appState.updateTemplate(appState.editingTemplateId, { name, description, content, category });
    appState.editingTemplateId = null;
    showSuccess('Template updated');
  } else {
    // Create new template
    appState.addTemplate({ name, description, category, content });
    showSuccess('Template saved');
  }
}
