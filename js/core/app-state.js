// app-state.js - Application State Management

import { STORAGE_KEYS, DEFAULTS } from './constants.js';
import { loadJSON } from './utilities.js';

// Application State
class AppState {
  constructor() {
    this.currentPreset = "default";
    this.userPresetLocked = false;
    this.lastPresetSource = "auto";
    this.lastTaskLabel = "General";
    this.lastRole = "expert assistant";
    
    this.autoConvertEnabled = true;
    this.autoConvertDelay = DEFAULTS.autoConvertDelay;
    this.usageCount = 0;
    this.lastConvertedText = "";
    this.isConverted = false;
    
    this.autoConvertTimer = null;
    this.autoConvertCountdown = this.autoConvertDelay;
    this.countdownInterval = null;
    
    this.editingTemplateId = null;
    this.templates = [];
    this.historyItems = [];
    
    this.lastDetectedContext = null;
    
    // Initialize state from storage
    this.init();
  }
  
  /**
   * Initialize state from localStorage
   */
  init() {
    this.usageCount = parseInt(localStorage.getItem(STORAGE_KEYS.usageCount) || "0", 10);
    this.templates = loadJSON(STORAGE_KEYS.templates, []);
    this.historyItems = loadJSON(STORAGE_KEYS.history, []);
  }
  
  /**
   * Save templates to storage
   */
  saveTemplates() {
    localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(this.templates));
  }
  
  /**
   * Save history to storage
   */
  saveHistory() {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(this.historyItems));
  }
  
  /**
   * Increment usage count and save
   */
  incrementUsageCount() {
    this.usageCount++;
    localStorage.setItem(STORAGE_KEYS.usageCount, this.usageCount.toString());
    return this.usageCount;
  }
  
  /**
   * Add item to history
   * @param {Object} item - History item
   */
  addHistoryItem(item) {
    const historyItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...item
    };
    
    this.historyItems.unshift(historyItem);
    this.historyItems = this.historyItems.slice(0, 200); // Keep only last 200 items
    this.saveHistory();
  }
  
  /**
   * Add template
   * @param {Object} template - Template object
   */
  addTemplate(template) {
    const newTemplate = {
      id: Date.now().toString(),
      ...template
    };
    
    this.templates.push(newTemplate);
    this.saveTemplates();
    return newTemplate;
  }
  
  /**
   * Update template
   * @param {string} id - Template ID
   * @param {Object} updates - Template updates
   */
  updateTemplate(id, updates) {
    const index = this.templates.findIndex(t => t.id === id);
    if (index !== -1) {
      this.templates[index] = { ...this.templates[index], ...updates };
      this.saveTemplates();
      return this.templates[index];
    }
    return null;
  }
  
  /**
   * Delete template
   * @param {string} id - Template ID
   */
  deleteTemplate(id) {
    this.templates = this.templates.filter(t => t.id !== id);
    this.saveTemplates();
  }
  
  /**
   * Get template by ID
   * @param {string} id - Template ID
   * @returns {Object|null} Template or null
   */
  getTemplate(id) {
    return this.templates.find(t => t.id === id) || null;
  }
  
  /**
   * Clear auto-convert timers
   */
  clearAutoConvertTimers() {
    if (this.autoConvertTimer) {
      clearTimeout(this.autoConvertTimer);
      this.autoConvertTimer = null;
    }
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
  
  /**
   * Reset auto-convert timer
   */
  resetAutoConvertTimer() {
    this.clearAutoConvertTimers();
    
    if (this.autoConvertEnabled && !this.isConverted) {
      this.autoConvertCountdown = this.autoConvertDelay;
      // Timer logic would be implemented in the UI layer
    }
  }
  
  /**
   * Reset all state
   */
  reset() {
    this.currentPreset = "default";
    this.userPresetLocked = false;
    this.lastPresetSource = "auto";
    this.lastTaskLabel = "General";
    this.lastRole = "expert assistant";
    
    this.autoConvertEnabled = true;
    this.lastConvertedText = "";
    this.isConverted = false;
    
    this.clearAutoConvertTimers();
    this.autoConvertCountdown = this.autoConvertDelay;
    
    this.editingTemplateId = null;
    this.lastDetectedContext = null;
  }
  
  /**
   * Export state as JSON (for debugging)
   * @returns {Object} State object
   */
  export() {
    return {
      currentPreset: this.currentPreset,
      userPresetLocked: this.userPresetLocked,
      autoConvertEnabled: this.autoConvertEnabled,
      usageCount: this.usageCount,
      isConverted: this.isConverted,
      templatesCount: this.templates.length,
      historyCount: this.historyItems.length,
      lastDetectedContext: this.lastDetectedContext
    };
  }
}

// Create singleton instance
const appState = new AppState();

// Export singleton instance
export default appState;
