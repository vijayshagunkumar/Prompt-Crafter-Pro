import { appState } from '../core/app-state.js';

export class HistoryManager {
  constructor() {
    this.historyItems = appState.historyItems;
  }
  
  getAll() {
    return [...this.historyItems];
  }
  
  add(requirement, prompt) {
    const item = appState.addHistoryItem(requirement, prompt);
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
          ${(item.requirement || "").slice(0, 80)}${item.requirement.length > 80 ? "..." : ""}
        </div>
        <div class="history-item-meta">
          ${new Date(item.createdAt).toLocaleString()}
        </div>
      </div>
    `).join('');
  }
}

// Singleton instance
export const historyManager = new HistoryManager();
