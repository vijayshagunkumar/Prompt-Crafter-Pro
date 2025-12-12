// history.js - History Management

import appState from '../core/app-state.js';
import { formatDate, truncateText } from '../core/utilities.js';

/**
 * Load history into app state
 */
export function loadHistory() {
  // Already loaded in appState.init()
  return appState.historyItems;
}

/**
 * Render history list
 * @returns {string} HTML for history list
 */
export function renderHistoryList() {
  if (appState.historyItems.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-clock-rotate-left"></i>
        <p>No history yet. Your converted prompts will appear here.</p>
      </div>
    `;
  }

  return appState.historyItems.map(item => {
    const date = formatDate(item.timestamp);
    const truncatedRaw = truncateText(item.raw, 80);
    const truncatedPrompt = truncateText(item.prompt, 120);
    
    return `
      <article class="history-item" data-id="${item.id}">
        <header class="history-item-header">
          <div>
            <h4>${item.presetLabel || "Prompt"}</h4>
            <p class="history-meta">${date}</p>
          </div>
          <button class="icon-btn history-insert" title="Insert this prompt">
            <i class="fas fa-arrow-turn-up"></i>
          </button>
        </header>
        <div class="history-item-body">
          <p class="history-raw"><strong>Idea:</strong> ${truncatedRaw}</p>
          <pre class="history-prompt">${truncatedPrompt}</pre>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Add item to history
 * @param {Object} item - History item data
 */
export function addToHistory(item) {
  appState.addHistoryItem(item);
}

/**
 * Clear all history
 */
export function clearHistory() {
  appState.historyItems = [];
  appState.saveHistory();
}

/**
 * Get history item by ID
 * @param {string} id - History item ID
 * @returns {Object|null} History item or null
 */
export function getHistoryItem(id) {
  return appState.historyItems.find(item => item.id === id) || null;
}

/**
 * Delete history item
 * @param {string} id - History item ID
 * @returns {boolean} Success status
 */
export function deleteHistoryItem(id) {
  const initialLength = appState.historyItems.length;
  appState.historyItems = appState.historyItems.filter(item => item.id !== id);
  
  if (appState.historyItems.length < initialLength) {
    appState.saveHistory();
    return true;
  }
  return false;
}

/**
 * Search history by keyword
 * @param {string} keyword - Search keyword
 * @returns {Array} Filtered history items
 */
export function searchHistory(keyword) {
  const searchTerm = keyword.toLowerCase();
  return appState.historyItems.filter(item => 
    item.raw.toLowerCase().includes(searchTerm) ||
    item.prompt.toLowerCase().includes(searchTerm) ||
    item.presetLabel?.toLowerCase().includes(searchTerm) ||
    item.role?.toLowerCase().includes(searchTerm)
  );
}

/**
 * Filter history by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered history items
 */
export function filterHistoryByDate(startDate, endDate) {
  return appState.historyItems.filter(item => {
    const itemDate = new Date(item.timestamp);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

/**
 * Export history as JSON file
 */
export function exportHistory() {
  const historyData = {
    exportedAt: new Date().toISOString(),
    count: appState.historyItems.length,
    items: appState.historyItems
  };

  const blob = new Blob([JSON.stringify(historyData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `promptcraft-history-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Import history from JSON file
 * @param {File} file - JSON file
 * @returns {Promise<Object>} Import result
 */
export async function importHistory(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (data.items && Array.isArray(data.items)) {
          // Merge imported items
          appState.historyItems = [...data.items, ...appState.historyItems];
          appState.saveHistory();
          
          resolve({
            success: true,
            count: data.items.length,
            message: `Successfully imported ${data.items.length} history items`
          });
        } else {
          reject(new Error('Invalid history file format'));
        }
      } catch (error) {
        reject(new Error('Failed to parse history file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
