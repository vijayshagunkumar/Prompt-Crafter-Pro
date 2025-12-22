import { APP_CONFIG } from './constants.js';

// Central application state management
class AppState {
  constructor() {
    this.currentPreset = 'default';
    this.userPresetLocked = false;
    this.lastPresetSource = 'auto';
    this.lastTaskLabel = 'General';
    this.lastRole = 'expert assistant';
    
    this.autoConvertEnabled = true;
    this.autoConvertDelay = 60;
    this.usageCount = 0;
    this.isConverted = false;
    this.lastConvertedText = '';
    
    this.templates = [];
    this.historyItems = [];
    
    this.textareaSizes = {
      requirement: { height: 140 },
      output: { height: 200 }
    };
    
    this.autoConvertTimer = null;
    this.countdownInterval = null;
    this.autoConvertCountdown = 60;
    
    this.editingTemplateId = null;
    
    // NEW: Clear/Undo button state
    this.lastClearedText = "";
    this.isUndoState = false;
    
    // NEW: Textarea expansion state
    this.isInputExpanded = false;
    this.isOutputExpanded = false;
    
    this.loadState();
  }
  
  loadState() {
    // Load from localStorage
    this.usageCount = parseInt(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USAGE)) || 0;
    
    // Load templates
    const savedTemplates = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TEMPLATES);
    if (savedTemplates) {
      this.templates = JSON.parse(savedTemplates);
    } else {
      this.templates = APP_CONFIG.DEFAULT_TEMPLATES;
      this.saveTemplates();
    }
    
    // Load history
    const savedHistory = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.HISTORY);
    if (savedHistory) {
      this.historyItems = JSON.parse(savedHistory);
    }
    
    // Load textarea sizes
    const savedSizes = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SIZES);
    if (savedSizes) {
      this.textareaSizes = JSON.parse(savedSizes);
    }
    
    // Load settings
    const savedSettings = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        this.autoConvertEnabled = settings.autoConvertEnabled ?? true;
        this.autoConvertDelay = settings.autoConvertDelay ?? 60;
        this.autoConvertCountdown = this.autoConvertDelay;
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }
  
  saveState() {
    this.saveTemplates();
    this.saveHistory();
    this.saveSettings();
  }
  
  saveTemplates() {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TEMPLATES, JSON.stringify(this.templates));
  }
  
  saveHistory() {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(this.historyItems));
  }
  
  saveSettings() {
    const settings = {
      autoConvertEnabled: this.autoConvertEnabled,
      autoConvertDelay: this.autoConvertDelay,
      currentPreset: this.currentPreset,
      userPresetLocked: this.userPresetLocked
    };
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
  
  saveSizes() {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SIZES, JSON.stringify(this.textareaSizes));
  }
  
  incrementUsage() {
    this.usageCount++;
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USAGE, this.usageCount.toString());
  }
  
  addHistoryItem(requirement, prompt) {
    const item = {
      id: Date.now(),
      requirement,
      prompt,
      createdAt: new Date().toISOString()
    };
    
    this.historyItems.unshift(item);
    this.historyItems = this.historyItems.slice(0, 20); // Keep last 20 items
    this.saveHistory();
    
    return item;
  }
  
  clearHistory() {
    this.historyItems = [];
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.HISTORY);
  }
  
  resetTextareaSizes() {
    this.textareaSizes = {
      requirement: { height: 140 },
      output: { height: 200 }
    };
    this.saveSizes();
  }
  
  clearAllData() {
    localStorage.clear();
    this.loadState(); // Reload defaults
  }
}

// Singleton instance
export const appState = new AppState();
