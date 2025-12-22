import { appState } from '../core/app-state.js';
import { analyzeText } from '../features/context-detective.js';
import { getPresetName } from '../ai/presets.js';
import { notifications } from './notifications.js';
import { templateManager } from '../features/templates.js';
import { historyManager } from '../features/history.js';
import { cardExpander } from '../features/card-expander.js';
import { aiToolsManager } from '../ai/ai-tools.js';

export class EventHandlers {
  constructor(app) {
    this.app = app;
    this.autoConvertTimer = null;
    this.countdownInterval = null;
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.setupRequirementInput();
    this.setupConvertButton();
    this.setupPresetButtons();
    this.setupExampleButtons();
    this.setupAutoConvertToggle();
    this.setupClearUndoButton();
    this.setupExportButton();
    this.setupHistoryToggle();
    this.setupTemplateToggle();
    this.setupVoiceButtons();
  }
  
  setupRequirementInput() {
    const requirementEl = document.getElementById('requirement');
    if (!requirementEl) return;
    
    requirementEl.addEventListener('input', (e) => this.handleRequirementInput(e));
    requirementEl.addEventListener('keyup', (e) => this.handleRequirementInput(e));
  }
  
  handleRequirementInput(event) {
    const text = event.target.value;
    
    // Update stats
    this.updateInputStats(text);
    
    // Clear output if user is typing new requirement
    if (appState.isConverted && text !== appState.lastConvertedText) {
      document.getElementById('output').value = '';
      appState.isConverted = false;
      document.getElementById('convertedBadge').style.display = 'none';
      aiToolsManager.setToolsEnabled(false);
    }
    
    appState.isConverted = false;
    document.getElementById('convertedBadge').style.display = 'none';
    document.getElementById('convertBtn').disabled = !text.trim();
    
    aiToolsManager.setToolsEnabled(false);
    
    // Auto-detect context
    if (text.trim() && !appState.userPresetLocked) {
      const { role, preset, label } = analyzeText(text);
      appState.lastRole = role;
      appState.lastTaskLabel = label;
      
      if (preset && preset !== appState.currentPreset) {
        appState.lastPresetSource = 'auto';
        this.setPreset(preset);
      }
    }
    
    this.updatePresetInfo();
    
    // Auto-convert timer
    if (appState.autoConvertEnabled) {
      this.resetAutoConvertTimer();
    }
  }
  
  setupConvertButton() {
    const convertBtn = document.getElementById('convertBtn');
    if (!convertBtn) return;
    
    convertBtn.addEventListener('click', () => this.app.generatePrompt());
  }
  
  setupPresetButtons() {
    document.querySelectorAll('.preset-option').forEach(option => {
      option.addEventListener('click', () => {
        const presetId = option.dataset.preset;
        appState.userPresetLocked = true;
        appState.lastPresetSource = 'manual';
        this.setPreset(presetId);
        
        // Clear output when preset changes
        if (appState.isConverted) {
          document.getElementById('output').value = '';
          appState.isConverted = false;
          document.getElementById('convertedBadge').style.display = 'none';
          aiToolsManager.setToolsEnabled(false);
        }
        
        const requirement = document.getElementById('requirement').value.trim();
        if (requirement && appState.isConverted) {
          appState.isConverted = false;
          this.app.generatePrompt();
        } else {
          this.updatePresetInfo();
        }
      });
    });
  }
  
  setupExampleButtons() {
    document.querySelectorAll('.example-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const requirementEl = document.getElementById('requirement');
        requirementEl.value = btn.dataset.example;
        requirementEl.focus();
        
        appState.isConverted = false;
        document.getElementById('output').value = '';
        document.getElementById('convertBtn').disabled = false;
        document.getElementById('convertedBadge').style.display = 'none';
        aiToolsManager.setToolsEnabled(false);
        
        // Update stats
        this.updateInputStats(requirementEl.value);
        
        // Auto-generate if there's text
        if (requirementEl.value.trim()) {
          this.app.generatePrompt();
        }
      });
    });
  }
  
  setupAutoConvertToggle() {
    const autoConvert = document.getElementById('autoConvert');
    if (!autoConvert) return;
    
    autoConvert.checked = appState.autoConvertEnabled;
    
    autoConvert.addEventListener('change', (e) => {
      appState.autoConvertEnabled = e.target.checked;
      if (!appState.autoConvertEnabled) {
        this.clearAutoConvertTimer();
      } else {
        const requirement = document.getElementById('requirement').value.trim();
        if (requirement && !appState.isConverted) {
          this.resetAutoConvertTimer();
        }
      }
    });
  }
  
  setupClearUndoButton() {
    const clearBtn = document.getElementById('clearInputBtn');
    const requirementEl = document.getElementById('requirement');
    
    if (!clearBtn || !requirementEl) return;
    
    clearBtn.addEventListener('click', () => {
      const icon = clearBtn.querySelector('i');
      
      if (!appState.isUndoState) {
        // First click: CLEAR text
        if (requirementEl.value.trim()) {
          appState.lastClearedText = requirementEl.value;
          requirementEl.value = '';
          requirementEl.focus();
          
          // Clear output when clearing requirement
          document.getElementById('output').value = '';
          document.getElementById('convertedBadge').style.display = 'none';
          aiToolsManager.setToolsEnabled(false);
          
          // Change button to UNDO state
          appState.isUndoState = true;
          clearBtn.classList.add('undo-state');
          clearBtn.title = 'Undo clear';
          icon.className = 'fas fa-undo';
          
          // Update stats and state
          this.updateInputStats('');
          appState.isConverted = false;
          document.getElementById('convertBtn').disabled = true;
          document.getElementById('convertedBadge').style.display = 'none';
          aiToolsManager.setToolsEnabled(false);
          
          // Clear timers
          this.clearAutoConvertTimer();
          
          notifications.success('Text cleared. Click undo to restore.');
        }
      } else {
        // Second click: UNDO (restore text)
        requirementEl.value = appState.lastClearedText;
        requirementEl.focus();
        
        // Change button back to CLEAR state
        appState.isUndoState = false;
        clearBtn.classList.remove('undo-state');
        clearBtn.title = 'Clear text';
        icon.className = 'fas fa-broom';
        
        // Update stats and state
        this.updateInputStats(appState.lastClearedText);
        document.getElementById('convertBtn').disabled = !appState.lastClearedText.trim();
        
        // Reset if there's text
        if (appState.lastClearedText.trim()) {
          appState.isConverted = false;
          document.getElementById('convertedBadge').style.display = 'none';
          aiToolsManager.setToolsEnabled(false);
          
          // Reset auto-convert timer if enabled
          if (appState.autoConvertEnabled) {
            this.resetAutoConvertTimer();
          }
        }
        
        notifications.success('Text restored');
        appState.lastClearedText = '';
      }
    });
    
    // Reset undo state when user starts typing
    requirementEl.addEventListener('input', () => {
      if (appState.isUndoState) {
        appState.isUndoState = false;
        clearBtn.classList.remove('undo-state');
        clearBtn.title = 'Clear text';
        clearBtn.querySelector('i').className = 'fas fa-broom';
        appState.lastClearedText = '';
      }
    });
  }
  
  setupExportButton() {
    const exportBtn = document.getElementById('exportBtn');
    if (!exportBtn) return;
    
    exportBtn.addEventListener('click', () => {
      const outputEl = document.getElementById('output');
      const prompt = outputEl.value.trim();
      
      if (!prompt) {
        notifications.error('No prompt to export');
        return;
      }
      
      const blob = new Blob([prompt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      notifications.success('Prompt exported');
    });
  }
  
  setupHistoryToggle() {
    const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const historyPanel = document.getElementById('historyPanel');
    
    if (!toggleHistoryBtn || !historyPanel) return;
    
    toggleHistoryBtn.addEventListener('click', () => {
      historyPanel.style.display = historyPanel.style.display === 'none' ? 'block' : 'none';
      if (historyPanel.style.display === 'block') {
        historyManager.renderTo('historyList');
      }
    });
    
    clearHistoryBtn?.addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        historyManager.clear();
        historyManager.renderTo('historyList');
        notifications.success('History cleared');
      }
    });
  }
  
  setupTemplateToggle() {
    const toggleTemplatesBtn = document.getElementById('toggleTemplatesBtn');
    const newTemplateBtn = document.getElementById('newTemplateBtn');
    const templateSearch = document.getElementById('templateSearch');
    const templatesPanel = document.getElementById('templatesPanel');
    
    if (!toggleTemplatesBtn || !templatesPanel) return;
    
    toggleTemplatesBtn.addEventListener('click', () => {
      const eyeIcon = toggleTemplatesBtn.querySelector('.template-toggle-eye i');
      
      if (templatesPanel.style.display === 'none') {
        templatesPanel.style.display = 'block';
        if (eyeIcon) {
          eyeIcon.className = 'fas fa-eye-slash';
        }
        templateManager.renderCategories('templateCategories');
        templateManager.renderTemplates('templatesGrid');
      } else {
        templatesPanel.style.display = 'none';
        if (eyeIcon) {
          eyeIcon.className = 'fas fa-eye';
        }
      }
    });
    
    newTemplateBtn?.addEventListener('click', () => {
      templateManager.editingTemplateId = null;
      document.getElementById('templateName').value = '';
      document.getElementById('templateDescription').value = '';
      document.getElementById('templateContent').value = document.getElementById('output').value || '';
      document.getElementById('templateCategory').value = 'communication';
      document.getElementById('templateExample').value = document.getElementById('requirement').value || '';
      document.getElementById('templateModal').style.display = 'flex';
    });
    
    templateSearch?.addEventListener('input', () => {
      const activeCategory = document.querySelector('.template-category.active')?.dataset.category || 'all';
      templateManager.filterTemplates(activeCategory);
    });
  }
  
  setupVoiceButtons() {
    // Voice input button
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    if (voiceInputBtn) {
      voiceInputBtn.addEventListener('click', () => {
        if (window.voiceFeatures) {
          window.voiceFeatures.startVoiceInput();
        } else {
          notifications.info('Voice features not available');
        }
      });
    }
    
    // Voice output button
    const voiceOutputBtn = document.getElementById('voiceOutputBtn');
    if (voiceOutputBtn) {
      voiceOutputBtn.addEventListener('click', () => {
        const output = document.getElementById('output').value;
        if (output && window.voiceFeatures) {
          window.voiceFeatures.speakText(output);
        } else {
          notifications.info('No text to read or voice features not available');
        }
      });
    }
  }
  
  setPreset(presetId) {
    if (!presetId) return;
    
    appState.currentPreset = presetId;
    
    // Update UI
    document.querySelectorAll('.preset-option').forEach((o) => {
      o.classList.toggle('active', o.dataset.preset === presetId);
    });
    
    this.updatePresetInfo();
  }
  
  updatePresetInfo() {
    const el = document.getElementById('presetInfo');
    if (!el) return;
    
    const nicePreset = getPresetName(appState.currentPreset);
    el.textContent = `${appState.lastTaskLabel} • ${nicePreset} (${appState.lastPresetSource})`;
  }
  
  updateInputStats(text) {
    import('../core/utilities.js').then(module => {
      module.updateStats(text, 'charCount', 'wordCount', 'lineCount');
    });
  }
  
  resetAutoConvertTimer() {
    this.clearAutoConvertTimer();
    
    const requirement = document.getElementById('requirement').value.trim();
    if (appState.autoConvertEnabled && requirement && !appState.isConverted) {
      appState.autoConvertCountdown = appState.autoConvertDelay;
      const timerValue = document.getElementById('timerValue');
      const timerDisplay = document.getElementById('timerDisplay');
      
      if (timerValue) timerValue.textContent = `${appState.autoConvertCountdown}s`;
      if (timerDisplay) timerDisplay.style.display = 'inline-flex';
      
      this.countdownInterval = setInterval(() => {
        appState.autoConvertCountdown--;
        if (timerValue) timerValue.textContent = `${appState.autoConvertCountdown}s`;
        
        if (appState.autoConvertCountdown <= 0) {
          clearInterval(this.countdownInterval);
          if (timerDisplay) timerDisplay.style.display = 'none';
          const currentRequirement = document.getElementById('requirement').value.trim();
          if (currentRequirement && currentRequirement !== appState.lastConvertedText) {
            this.app.generatePrompt();
          }
        }
      }, 1000);
      
      this.autoConvertTimer = setTimeout(() => {
        const currentRequirement = document.getElementById('requirement').value.trim();
        if (currentRequirement && currentRequirement !== appState.lastConvertedText) {
          this.app.generatePrompt();
        }
      }, appState.autoConvertDelay * 1000);
    }
  }
  
  clearAutoConvertTimer() {
    clearTimeout(this.autoConvertTimer);
    clearInterval(this.countdownInterval);
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) timerDisplay.style.display = 'none';
  }
}

export const eventHandlers = new EventHandlers();
