import { appState } from '../core/app-state.js';
import { formatDate, truncateText } from '../core/utilities.js';

export class HistoryManager {
  constructor() {
    this.historyItems = appState.historyItems;
  }
  
  getAll() {
    return [...this.historyItems];
  }
  
  add(requirement, prompt) {
    const item = appState.addHistoryItem(requirement, prompt);
    this.historyItems = appState.historyItems;
    return item;
  }
  
  clear() {
    appState.clearHistory();
    this.historyItems = [];
  }
  
  getRecent(limit = 10) {
    return this.historyItems.slice(0, limit);
  }
  
  findById(id) {
    return this.historyItems.find(item => item.id === id);
  }
  
  renderTo(elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    if (!this.historyItems.length) {
      container.innerHTML = `<div class="history-item-meta">No history yet.</div>`;
      return;
    }
    
    container.innerHTML = this.historyItems.map(item => `
      <div class="history-item" data-id="${item.id}">
        <div class="history-item-title">
          ${truncateText(item.requirement || "", 80)}
        </div>
        <div class="history-item-meta">
          ${formatDate(item.createdAt)}
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id);
        this.loadItem(id);
      });
    });
  }
  
  loadItem(id) {
    const item = this.findById(id);
    if (!item) return;
    
    // Load into textareas
    document.getElementById('requirement').value = item.requirement;
    document.getElementById('output').value = item.prompt;
    
    // Update stats
    this.updateStats(item.prompt);
    
    // Update UI state
    document.getElementById('convertedBadge').style.display = 'inline-flex';
    
    // Notify
    import('../ui/notifications.js').then(module => {
      module.notifications.success('Loaded from history');
    });
  }
  
  updateStats(prompt) {
    import('../core/utilities.js').then(module => {
      module.updateStats(prompt, 'outputCharCount', 'outputWordCount', 'outputLineCount');
    });
  }
}

// Singleton instance
export const historyManager = new HistoryManager();
