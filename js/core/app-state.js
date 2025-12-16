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
    
    this.templates = [];
    this.historyItems = [];
    
    this.textareaSizes = {
      requirement: { height: 140 },
      output: { height: 200 }
    };
    
    this.loadState();
  }
  
  loadState() {
    // Load from localStorage
    this.usageCount = parseInt(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.USAGE)) || 0;
    
    const savedTemplates = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.TEMPLATES);
    this.templates = savedTemplates ? JSON.parse(savedTemplates) : [];
    
    const savedHistory = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.HISTORY);
    this.historyItems = savedHistory ? JSON.parse(savedHistory) : [];
    
    const savedSizes = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SIZES);
    if (savedSizes) {
      this.textareaSizes = JSON.parse(savedSizes);
    }
    
    const savedSettings = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.autoConvertEnabled = settings.autoConvertEnabled ?? true;
      this.autoConvertDelay = settings.autoConvertDelay ?? 60;
    }
  }
  
  saveState() {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USAGE, this.usageCount.toString());
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.TEMPLATES, JSON.stringify(this.templates));
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(this.historyItems));
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SIZES, JSON.stringify(this.textareaSizes));
    
    const settings = {
      autoConvertEnabled: this.autoConvertEnabled,
      autoConvertDelay: this.autoConvertDelay
    };
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
  
  incrementUsage() {
    this.usageCount++;
    this.saveState();
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
    this.saveState();
    
    return item;
  }
  
  clearHistory() {
    this.historyItems = [];
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.HISTORY);
  }
}

// Singleton instance
export const appState = new AppState();
