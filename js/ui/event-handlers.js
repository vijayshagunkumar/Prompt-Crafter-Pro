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
  setupCardMaximizeHandlers();
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
  const recommendationEl = document.getElementById('bestToolRecommendation');
  if (!recommendationEl) return;
  
  if (!text.trim()) {
    recommendationEl.textContent = 'Generate a prompt to see recommendations';
    return;
  }
  
  try {
    const tool = getRecommendedTool(taskType, text);
    recommendationEl.textContent = `${tool.name} - ${tool.description}`;
    
    // Update recommendation banner icon
    const iconEl = document.querySelector('.recommendation-icon i');
    if (iconEl && tool.icon) {
      iconEl.className = tool.icon;
    }
  } catch (error) {
    console.error('Failed to get tool recommendation:', error);
    recommendationEl.textContent = 'Analyzing best tool for your task...';
  }
}

/**
 * Setup tool handlers
 */
function setupToolHandlers() {
  // Tool click handlers are handled by ai-tools.js (called from app.js)
  
  // Refresh tools button
  const refreshBtn = document.getElementById('refreshToolsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const requirementEl = document.getElementById('requirement');
      const outputEl = document.getElementById('output');
      const text = outputEl.value.trim() || requirementEl.value.trim();
      const context = detectContextFromText(text);
      
      updateAIToolsGrid(context.taskType, text, !!outputEl.value.trim());
      showNotification('AI tools refreshed');
      
      // Add animation
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      setTimeout(() => {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
      }, 500);
    });
  }
  
  // Launch all button
  const launchAllBtn = document.getElementById('launchAllBtn');
  if (launchAllBtn) {
    launchAllBtn.addEventListener('click', async () => {
      const outputEl = document.getElementById('output');
      const prompt = outputEl.value.trim();
      
      if (!prompt) {
        showError('Generate a prompt first');
        return;
      }
      
      showNotification('Launching all compatible tools...');
      // This would be implemented to open multiple tabs
      // For now, just copy to clipboard
      await copyPromptToClipboard(prompt);
      showSuccess('Prompt copied. You can paste it into any AI tool.');
    });
  }
}

/**
 * Setup modal handlers
 */
function setupModalHandlers() {
  const openTemplatesBtn = document.getElementById('templatesBtn');
  const openHistoryBtn = document.getElementById('historyBtn');
  const templatesGrid = document.getElementById('templatesGrid');
  const historyList = document.getElementById('historyList');

  // Templates modal
  if (openTemplatesBtn) {
    openTemplatesBtn.addEventListener('click', () => {
      templatesGrid.innerHTML = renderTemplatesGrid();
      openModal('templatesModal');
    });
  }

  // History modal
  if (openHistoryBtn) {
    openHistoryBtn.addEventListener('click', () => {
      historyList.innerHTML = renderHistoryList();
      openModal('historyModal');
    });
  }

  // Export button
  const exportBtn = document.getElementById('exportBtn');
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
}

/**
 * Setup voice handlers
 */
function setupVoiceHandlers() {
  const voiceBtn = document.getElementById('voiceBtn');
  const requirementEl = document.getElementById('requirement');
  
  if (voiceBtn && requirementEl) {
    if (!isVoiceSupported()) {
      voiceBtn.disabled = true;
      voiceBtn.title = 'Voice input not supported in your browser';
      voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      voiceBtn.classList.add('disabled');
      return;
    }
    
    setupVoiceButton(voiceBtn, requirementEl, (transcript, error) => {
      if (error) {
        showError(error);
      } else if (transcript) {
        showSuccess('Voice input captured');
        
        // Update context after voice input
        const contextChipsRow = document.getElementById('contextChipsRow');
        handleRequirementInput(requirementEl, contextChipsRow);
      }
    });
  }
}

/**
 * Setup general UI handlers
 */
function setupUIHandlers() {
  updateUsageCount();
  updateInputStats();
  updateOutputStats();
  
  // Theme selector in sidebar
  const themeSelect = document.querySelector('.theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      setTheme(e.target.value);
    });
  }
  
  // Update initial tool states
  updateLaunchButtons(false);
}

/**
 * Setup settings handlers
 */
function setupSettingsHandlers() {
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettingsModal);
  }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to convert
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const convertBtn = document.getElementById('convertBtn');
      if (convertBtn && !convertBtn.disabled) {
        convertBtn.click();
      }
    }
    
    // Ctrl/Cmd + S to save as template
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const saveTemplateBtn = document.getElementById('saveTemplateBtn');
      if (saveTemplateBtn) {
        saveTemplateBtn.click();
      }
    }
    
    // Ctrl/Cmd + C to copy output
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      const outputEl = document.getElementById('output');
      if (outputEl && outputEl.value.trim() && document.activeElement !== outputEl) {
        e.preventDefault();
        copyPromptToClipboard(outputEl.value.trim());
        showSuccess('Prompt copied to clipboard');
      }
    }
    
    // Escape to close modals or maximize
    if (e.key === 'Escape') {
      const activeModal = modalManager.getActiveModal();
      if (activeModal) {
        closeModal(activeModal);
      } else {
        // Check if any card is maximized
        const maximizedCard = document.querySelector('.step-card.is-maximized');
        if (maximizedCard) {
          const btn = maximizedCard.querySelector('.card-max-btn');
          if (btn) btn.click();
        }
      }
    }
  });
}

/**
 * Update launch buttons state
 * @param {boolean} enabled - Whether buttons should be enabled
 */
function updateLaunchButtons(enabled) {
  const toolCards = document.querySelectorAll('.tool-card, .ai-tool-card');
  const launchAllBtn = document.getElementById('launchAllBtn');
  
  toolCards.forEach(card => {
    if (enabled) {
      card.classList.remove('disabled');
      card.disabled = false;
    } else {
      card.classList.add('disabled');
      card.disabled = true;
    }
  });
  
  if (launchAllBtn) {
    if (enabled) {
      launchAllBtn.disabled = false;
      launchAllBtn.classList.remove('disabled');
    } else {
      launchAllBtn.disabled = true;
      launchAllBtn.classList.add('disabled');
    }
  }
}

/**
 * Update input stats
 * @param {string} text - Input text
 */
function updateInputStats(text = '') {
  const inputStats = document.getElementById('inputStats');
  const requirementEl = document.getElementById('requirement');
  const textToMeasure = text || (requirementEl ? requirementEl.value : '');
  
  if (inputStats) {
    const chars = textToMeasure.length;
    const words = textToMeasure.trim().split(/\s+/).filter(word => word.length > 0).length;
    inputStats.textContent = `${chars} chars • ${words} words`;
  }
}

/**
 * Update output stats
 */
function updateOutputStats() {
  const outputEl = document.getElementById('output');
  const outputStats = document.getElementById('outputStats');
  
  if (outputStats && outputEl) {
    const text = outputEl.value;
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const lines = text.split('\n').filter(line => line.trim().length > 0).length;
    outputStats.textContent = `${chars} chars • ${words} words • ${lines} lines`;
  }
}

/**
 * Update usage count display
 */
function updateUsageCount() {
  const usageElement = document.getElementById('usageCount');
  if (usageElement) {
    usageElement.innerHTML = `<i class="fas fa-bolt"></i> ${appState.usageCount} prompts generated`;
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
    appState.updateTemplate(appState.editingTemplateId, { name, description, content, category });
    appState.editingTemplateId = null;
    showSuccess('Template updated');
  } else {
    appState.addTemplate({ name, description, category, content });
    showSuccess('Template saved');
  }
}

/**
 * Setup card maximize / restore handlers (Card 1 + Card 2)
 */
function setupCardMaximizeHandlers() {
  const backdrop = getOrCreateCardMaxBackdrop();
  const buttons = Array.from(document.querySelectorAll('[data-maximize-card]'));
  if (!buttons.length) return;

  let activeCardId = null;

  const setBtnState = (cardId, isMax) => {
    const btn = document.querySelector(`[data-maximize-card="${cardId}"]`);
    if (!btn) return;
    btn.title = isMax ? 'Restore' : 'Maximize';
    const icon = btn.querySelector('i');
    if (!icon) return;
    icon.classList.toggle('fa-expand', !isMax);
    icon.classList.toggle('fa-compress', isMax);
  };

  const restoreActive = () => {
    if (!activeCardId) return;
    const card = document.getElementById(activeCardId);
    if (card) card.classList.remove('is-maximized');
    setBtnState(activeCardId, false);
    activeCardId = null;
    document.body.classList.remove('card-max-open');
  };

  const maximize = (cardId) => {
    if (!cardId) return;

    if (activeCardId === cardId) {
      restoreActive();
      return;
    }

    if (activeCardId && activeCardId !== cardId) {
      restoreActive();
    }

    const card = document.getElementById(cardId);
    if (!card) return;

    card.classList.add('is-maximized');
    document.body.classList.add('card-max-open');
    setBtnState(cardId, true);
    activeCardId = cardId;

    const focusEl = card.querySelector('textarea');
    if (focusEl) setTimeout(() => focusEl.focus(), 0);
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      maximize(btn.getAttribute('data-maximize-card'));
    });
  });

  backdrop.addEventListener('click', () => {
    restoreActive();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    try {
      if (modalManager && typeof modalManager.getActiveModal === 'function') {
        const activeModal = modalManager.getActiveModal();
        if (activeModal) return;
      }
    } catch (_) {}

    restoreActive();
  });
}

function getOrCreateCardMaxBackdrop() {
  let backdrop = document.getElementById('cardMaxBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'cardMaxBackdrop';
    backdrop.className = 'card-max-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);
  }
  return backdrop;
}

// Export helper functions for app.js
export {
  updateUsageCount,
  updateInputStats,
  updateOutputStats,
  updateLaunchButtons
};
