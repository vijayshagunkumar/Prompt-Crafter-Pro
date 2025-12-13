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
          copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
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

  // Regenerate button
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', async () => {
      await handleConvert(true);
    });
  }

  // Improve button
  if (improveBtn) {
    improveBtn.addEventListener('click', () => {
      showNotification('Improve feature coming soon!');
    });
  }

  // Shorten button
  if (shortenBtn) {
    shortenBtn.addEventListener('click', () => {
      showNotification('Shorten feature coming soon!');
    });
  }

  // Lengthen button
  if (lengthenBtn) {
    lengthenBtn.addEventListener('click', () => {
      showNotification('Expand feature coming soon!');
    });
  }
}

/**
 * Handle convert button click
 */
async function handleConvert(isRegenerate = false) {
  const requirementEl = document.getElementById('requirement');
  const outputEl = document.getElementById('output');
  const convertBtn = document.getElementById('convertBtn');
  const convertedBadge = document.getElementById('convertedBadge');
  const regenerateBtn = document.getElementById('regenerateBtn');
  
  const raw = requirementEl.value.trim();
  if (!raw) {
    showError('Please enter a requirement first');
    return;
  }

  // Disable button and show loading
  const originalText = convertBtn.innerHTML;
  convertBtn.disabled = true;
  convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
  
  if (regenerateBtn) {
    regenerateBtn.disabled = true;
  }

  try {
    const result = await generatePrompt(raw);
    
    if (result.success) {
      outputEl.value = result.prompt;
      
      // Show converted badge
      if (convertedBadge) {
        convertedBadge.style.display = 'inline-flex';
        if (isRegenerate) {
          convertedBadge.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerated';
        }
      }
      
      // Update UI
      updateOutputStats();
      updateLaunchButtons(true);
      
      // Update AI tools with new context
      const context = detectContextFromText(raw);
      updateAIToolsGrid(context.taskType, result.prompt, true);
      
      // Update recommendation
      updateToolRecommendation(raw, context.taskType);
      
      // Show success message
      showSuccess(isRegenerate ? 'Prompt regenerated!' : 'Prompt generated successfully');
      
      // Add to usage count
      appState.incrementUsageCount();
      updateUsageCount();
    } else {
      showError('Generation failed, using offline mode');
      outputEl.value = result.prompt;
      updateOutputStats();
      updateLaunchButtons(true);
      
      // Still update AI tools
      const context = detectContextFromText(raw);
      updateAIToolsGrid(context.taskType, result.prompt, true);
    }

    // Update app state
    appState.isConverted = true;
    appState.lastConvertedText = raw;

  } catch (error) {
    console.error('Conversion error:', error);
    showError('Failed to generate prompt: ' + error.message);
  } finally {
    // Restore buttons
    convertBtn.disabled = false;
    convertBtn.innerHTML = originalText;
    
    if (regenerateBtn) {
      regenerateBtn.disabled = false;
    }
  }
}

/**
 * Update tool recommendation banner
 * @param {string} text - Input text
 * @param {string} taskType - Task type
 */
function updateToolRecommendation(text, taskType) {
  const recommendation = getRecommendedTool(taskType);
  const banner = document.getElementById('toolRecommendationBanner');
  const toolName = document.getElementById('recommendedToolName');
  const toolDesc = document.getElementById('recommendedToolDesc');
  
  if (!banner || !toolName || !toolDesc) return;
  
  if (recommendation && text.trim()) {
    toolName.textContent = recommendation.name;
    toolDesc.textContent = recommendation.description;
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

/**
 * Setup tool handlers (AI tools grid)
 */
function setupToolHandlers() {
  setupToolClickHandlers();
}

/**
 * Setup modal handlers
 */
function setupModalHandlers() {
  modalManager.initialize();
}

/**
 * Setup voice handlers
 */
function setupVoiceHandlers() {
  const voiceBtn = document.getElementById('voiceBtn');
  const requirementEl = document.getElementById('requirement');
  
  if (voiceBtn && requirementEl) {
    setupVoiceButton(voiceBtn, requirementEl);
    
    // Show/hide voice button based on support
    if (!isVoiceSupported()) {
      voiceBtn.style.display = 'none';
    }
  }
}

/**
 * Setup general UI handlers
 */
function setupUIHandlers() {
  // Templates tab
  const templatesTabBtn = document.getElementById('templatesTabBtn');
  if (templatesTabBtn) {
    templatesTabBtn.addEventListener('click', () => {
      renderTemplatesGrid();
    });
  }

  // History tab
  const historyTabBtn = document.getElementById('historyTabBtn');
  if (historyTabBtn) {
    historyTabBtn.addEventListener('click', () => {
      renderHistoryList();
    });
  }
}

/**
 * Setup Settings handlers
 */
function setupSettingsHandlers() {
  const settingsBtn = document.getElementById('openSettingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => openSettingsModal());
  }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter -> Convert
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const convertBtn = document.getElementById('convertBtn');
      if (convertBtn && !convertBtn.disabled) {
        convertBtn.click();
      }
    }

    // Escape -> Close modal
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

/* ===========================================
   HELPERS (Existing functions referenced above)
   =========================================== */

function updateInputStats(text) {
  const wordCountEl = document.getElementById('inputWordCount');
  const charCountEl = document.getElementById('inputCharCount');
  if (!wordCountEl || !charCountEl) return;

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  wordCountEl.textContent = words.toString();
  charCountEl.textContent = text.length.toString();
}

function updateOutputStats() {
  const outputEl = document.getElementById('output');
  const wordCountEl = document.getElementById('outputWordCount');
  const charCountEl = document.getElementById('outputCharCount');
  if (!outputEl || !wordCountEl || !charCountEl) return;

  const text = outputEl.value || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  wordCountEl.textContent = words.toString();
  charCountEl.textContent = text.length.toString();
}

function updateLaunchButtons(enabled) {
  const launchBtns = document.querySelectorAll('[data-launch-tool]');
  launchBtns.forEach(btn => {
    btn.disabled = !enabled;
  });
}

function updateUsageCount() {
  const el = document.getElementById('usageCount');
  if (!el) return;
  el.textContent = String(appState.usageCount || 0);
}

function showTemplateSaveDialog(content) {
  showNotification('Save template dialog coming soon!');
}
