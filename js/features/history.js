import { appState } from '../core/app-state.js';
import { notifications } from '../ui/notifications.js';

export class HistoryManager {
  constructor() {
    this.history = appState.history || [];
    this.setup();
  }
  
  setup() {
    // Toggle history panel
    const toggleBtn = document.getElementById('toggleHistoryBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleHistoryPanel());
    }
    
    // Clear history
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearHistory());
    }
    
    // Load initial history
    this.renderHistory();
  }
  
  add(input, output, title = null) {
    const entry = {
      id: Date.now().toString(),
      title: title || this.generateTitle(input),
      input: input.substring(0, 200),
      output: output,
      timestamp: Date.now(),
      charCount: output.length,
      wordCount: output.split(/\s+/).length
    };
    
    // Add to beginning of history
    this.history.unshift(entry);
    
    // Keep only last 50 entries
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }
    
    // Save to state and localStorage
    appState.history = this.history;
    localStorage.setItem('promptHistory', JSON.stringify(this.history));
    
    // Update UI
    this.renderHistory();
    
    return entry;
  }
  
  generateTitle(input) {
    if (!input) return 'Untitled Prompt';
    
    const words = input.trim().split(/\s+/);
    if (words.length <= 5) {
      return input.substring(0, 40) + (input.length > 40 ? '...' : '');
    }
    
    // Take first 3-4 words
    const titleWords = words.slice(0, Math.min(4, words.length));
    return titleWords.join(' ') + (words.length > 4 ? '...' : '');
  }
  
  toggleHistoryPanel() {
    const panel = document.getElementById('historyPanel');
    if (!panel) return;
    
    if (panel.style.display === 'block') {
      panel.style.display = 'none';
    } else {
      panel.style.display = 'block';
      this.renderHistory();
    }
  }
  
  clearHistory() {
    if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      return;
    }
    
    this.history = [];
    appState.history = [];
    localStorage.removeItem('promptHistory');
    
    this.renderHistory();
    notifications.info('History cleared');
  }
  
  renderHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    if (this.history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-history"></i>
          <p>No history yet. Generate some prompts!</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.history.map(entry => `
      <div class="history-entry" onclick="historyManager.loadEntry('${entry.id}')">
        <div class="history-entry-header">
          <span class="history-entry-title">${entry.title}</span>
          <span class="history-entry-time">${this.formatTime(entry.timestamp)}</span>
        </div>
        <div class="history-entry-preview">
          ${entry.input.substring(0, 80)}${entry.input.length > 80 ? '...' : ''}
        </div>
        <div class="history-entry-meta">
          <span><i class="fas fa-font"></i> ${entry.charCount} chars</span>
          <span><i class="fas fa-file-word"></i> ${entry.wordCount} words</span>
          <button class="btn-ghost-small delete-history" onclick="event.stopPropagation(); historyManager.deleteEntry('${entry.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }
  
  loadEntry(entryId) {
    const entry = this.history.find(e => e.id === entryId);
    if (!entry) return;
    
    // Load into output
    document.getElementById('output').value = entry.output;
    
    // Enable launch buttons
    document.querySelectorAll('.launch-btn').forEach(btn => {
      btn.disabled = false;
    });
    
    // Show success badge
    const badge = document.getElementById('convertedBadge');
    if (badge) {
      badge.style.display = 'flex';
    }
    
    // Update counters
    this.updateCounters();
    
    notifications.success('Loaded from history');
    this.toggleHistoryPanel();
  }
  
  deleteEntry(entryId) {
    this.history = this.history.filter(e => e.id !== entryId);
    appState.history = this.history;
    localStorage.setItem('promptHistory', JSON.stringify(this.history));
    
    this.renderHistory();
    notifications.info('Entry deleted');
  }
  
  updateCounters() {
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');
    const lineCount = document.getElementById('lineCount');
    const output = document.getElementById('output').value;
    
    if (charCount) {
      charCount.textContent = `${output.length} chars`;
    }
    
    if (wordCount) {
      wordCount.textContent = `${output.split(/\s+/).filter(w => w.length > 0).length} words`;
    }
    
    if (lineCount) {
      lineCount.textContent = `${output.split('\n').length} lines`;
    }
  }
}

export const historyManager = new HistoryManager();
