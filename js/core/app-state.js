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
    
    // NEW: Card expander states
    this.maximizedCardId = null;
    this.minimizedCardIds = [];
    this.cardStates = {}; // For individual card state
    
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
    
    // NEW: Load card expander states
    this.loadCardStates();
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
   * NEW: Save card expander states
   */
  saveCardStates() {
    const cardState = {
      maximizedCardId: this.maximizedCardId,
      minimizedCardIds: this.minimizedCardIds,
      cardStates: this.cardStates
    };
    localStorage.setItem(STORAGE_KEYS.cardExpander, JSON.stringify(cardState));
  }
  
  /**
   * NEW: Load card expander states
   */
  loadCardStates() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.cardExpander);
      if (saved) {
        const state = JSON.parse(saved);
        this.maximizedCardId = state.maximizedCardId || null;
        this.minimizedCardIds = state.minimizedCardIds || [];
        this.cardStates = state.cardStates || {};
      }
    } catch (e) {
      console.error('Failed to load card states:', e);
      this.maximizedCardId = null;
      this.minimizedCardIds = [];
      this.cardStates = {};
    }
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
   * NEW: Save card state
   * @param {string} cardId - Card ID (card-1, card-2)
   * @param {string} state - State to save ('maximized', 'minimized', 'restored')
   */
  saveCardState(cardId, state) {
    if (state === 'maximized') {
      this.maximizedCardId = cardId;
      // Remove from minimized if present
      this.minimizedCardIds = this.minimizedCardIds.filter(id => id !== cardId);
    } else if (state === 'minimized') {
      if (!this.minimizedCardIds.includes(cardId)) {
        this.minimizedCardIds.push(cardId);
      }
      // Remove from maximized if present
      if (this.maximizedCardId === cardId) {
        this.maximizedCardId = null;
      }
    } else if (state === 'restored') {
      if (this.maximizedCardId === cardId) {
        this.maximizedCardId = null;
      }
      this.minimizedCardIds = this.minimizedCardIds.filter(id => id !== cardId);
    }
    
    // Update individual card state
    this.cardStates[cardId] = {
      lastState: state,
      timestamp: new Date().toISOString()
    };
    
    this.saveCardStates();
  }
  
  /**
   * NEW: Get current card states
   * @returns {Object} Card states object
   */
  getCardStates() {
    return {
      maximizedCardId: this.maximizedCardId,
      minimizedCardIds: this.minimizedCardIds,
      cardStates: this.cardStates
    };
  }
  
  /**
   * NEW: Get maximized card ID
   * @returns {string|null} Maximized card ID or null
   */
  getMaximizedCard() {
    return this.maximizedCardId;
  }
  
  /**
   * NEW: Get minimized card IDs
   * @returns {Array} Array of minimized card IDs
   */
  getMinimizedCards() {
    return this.minimizedCardIds;
  }
  
  /**
   * NEW: Check if any card is maximized
   * @returns {boolean} True if a card is maximized
   */
  hasMaximizedCard() {
    return this.maximizedCardId !== null;
  }
  
  /**
   * NEW: Check if card is minimized
   * @param {string} cardId - Card ID to check
   * @returns {boolean} True if card is minimized
   */
  isCardMinimized(cardId) {
    return this.minimizedCardIds.includes(cardId);
  }
  
  /**
   * NEW: Clear all card states
   */
  clearCardStates() {
    this.maximizedCardId = null;
    this.minimizedCardIds = [];
    this.cardStates = {};
    this.saveCardStates();
  }
  
  /**
   * NEW: Get card statistics
   * @returns {Object} Card statistics
   */
  getCardStats() {
    return {
      totalCards: 2, // Card 1 and Card 2
      maximized: this.maximizedCardId ? 1 : 0,
      minimized: this.minimizedCardIds.length,
      normal: 2 - (this.maximizedCardId ? 1 : 0) - this.minimizedCardIds.length
    };
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
    
    // NEW: Clear card states on reset
    this.clearCardStates();
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
      lastDetectedContext: this.lastDetectedContext,
      // NEW: Include card states in export
      cardStats: this.getCardStats(),
      maximizedCardId: this.maximizedCardId,
      minimizedCardIds: this.minimizedCardIds
    };
  }
}

// Update STORAGE_KEYS in constants.js to include:
// Add this to your constants.js file:
// STORAGE_KEYS.cardExpander = 'promptcraft_card_expander_state';

// Create singleton instance
const appState = new AppState();

// Export singleton instance
export default appState;
