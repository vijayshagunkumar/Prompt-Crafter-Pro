import { templateManager } from '../features/templates.js';
import { settingsManager } from './settings-manager.js';
import { cardExpander } from '../features/card-expander.js';

export class ModalManager {
  constructor() {
    this.setupModals();
  }
  
  setupModals() {
    this.setupSettingsModal();
    this.setupTemplateModal();
  }
  
  setupSettingsModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const resetSizesBtn = document.getElementById('resetSizesBtn');
    const autoConvertDelay = document.getElementById('autoConvertDelay');
    const delayValue = document.getElementById('delayValue');
    const settingsModal = document.getElementById('settingsModal');
    
    if (!settingsBtn || !settingsModal) return;
    
    // Open settings
    settingsBtn.addEventListener('click', () => {
      settingsModal.style.display = 'flex';
    });
    
    // Close settings
    closeSettingsBtn?.addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });
    
    // Save settings
    saveSettingsBtn?.addEventListener('click', () => {
      settingsManager.save();
      settingsModal.style.display = 'none';
    });
    
    // Clear data
    clearDataBtn?.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all data? This will delete all templates, history, and settings.')) {
        settingsManager.clearAllData();
      }
    });
    
    // Reset sizes
    resetSizesBtn?.addEventListener('click', () => {
      cardExpander.resetSizes();
    });
    
    // Delay slider
    if (autoConvertDelay && delayValue) {
      autoConvertDelay.addEventListener('input', () => {
        delayValue.textContent = `Current: ${autoConvertDelay.value} seconds`;
      });
    }
    
    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
      }
    });
  }
  
  setupTemplateModal() {
    const templateModal = document.getElementById('templateModal');
    const closeTemplateBtn = document.getElementById('closeTemplateBtn');
    const cancelTemplateBtn = document.getElementById('cancelTemplateBtn');
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    
    if (!templateModal) return;
    
    // Close template modal
    const closeTemplateModal = () => {
      templateModal.style.display = 'none';
      templateManager.editingTemplateId = null;
    };
    
    closeTemplateBtn?.addEventListener('click', closeTemplateModal);
    cancelTemplateBtn?.addEventListener('click', closeTemplateModal);
    
    // Save template
    saveTemplateBtn?.addEventListener('click', () => {
      templateManager.saveTemplate();
    });
    
    // Close modal when clicking outside
    templateModal.addEventListener('click', (e) => {
      if (e.target === templateModal) {
        closeTemplateModal();
      }
    });
  }
}

// Singleton instance
export const modalManager = new ModalManager();
