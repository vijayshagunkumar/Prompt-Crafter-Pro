// COMPLETE HistoryManager.js - READY TO USE
class HistoryManager {
    constructor() {
        this.storage = new StorageService();
        this.history = this.loadHistory();
        this.maxItems = 50;
        this.init();
    }

    init() {
        // Setup event listeners
        this.setupEventListeners();
        console.log('History Manager initialized with', this.history.length, 'items');
    }

    loadHistory() {
        try {
            const saved = this.storage.get('prompt_history', []);
            // Validate and clean history
            return saved.filter(item => 
                item && 
                item.id && 
                item.timestamp && 
                (item.input || item.prompt)
            );
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    saveHistory(history) {
        this.history = history;
        return this.storage.set('prompt_history', history);
    }

    add(input, prompt, model = 'gemini-1.5-flash', metadata = {}) {
        try {
            const historyItem = {
                id: Date.now().toString(),
                input: input.substring(0, 500), // Limit input length
                prompt: prompt.substring(0, 5000), // Limit prompt length
                model: model,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                time: new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                tags: this.extractTags(input),
                ...metadata
            };
            
            // Add to beginning
            this.history.unshift(historyItem);
            
            // Limit items
            if (this.history.length > this.maxItems) {
                this.history = this.history.slice(0, this.maxItems);
            }
            
            this.saveHistory(this.history);
            
            // Dispatch event
            this.dispatchHistoryUpdate();
            
            return historyItem;
            
        } catch (error) {
            console.error('Error adding to history:', error);
            return null;
        }
    }

    getAll() {
        return [...this.history];
    }

    getById(id) {
        return this.history.find(item => item.id === id);
    }

    getRecent(limit = 10) {
        return this.history.slice(0, limit);
    }

    getByModel(model) {
        return this.history.filter(item => item.model === model);
    }

    search(query) {
        const searchTerm = query.toLowerCase();
        return this.history.filter(item => 
            (item.input && item.input.toLowerCase().includes(searchTerm)) ||
            (item.prompt && item.prompt.toLowerCase().includes(searchTerm)) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    delete(id) {
        const index = this.history.findIndex(item => item.id === id);
        if (index !== -1) {
            this.history.splice(index, 1);
            this.saveHistory(this.history);
            this.dispatchHistoryUpdate();
            return true;
        }
        return false;
    }

    deleteAll() {
        this.history = [];
        this.saveHistory(this.history);
        this.dispatchHistoryUpdate();
        return true;
    }

    clear() {
        return this.deleteAll();
    }

    getStats() {
        const today = new Date().toDateString();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return {
            total: this.history.length,
            today: this.history.filter(item => 
                new Date(item.timestamp).toDateString() === today
            ).length,
            thisWeek: this.history.filter(item => 
                new Date(item.timestamp) >= oneWeekAgo
            ).length,
            byModel: this.history.reduce((acc, item) => {
                acc[item.model] = (acc[item.model] || 0) + 1;
                return acc;
            }, {})
        };
    }

    extractTags(text) {
        const tags = [];
        const textLower = text.toLowerCase();
        
        // Common tags
        if (/(email|message|letter)/i.test(text)) tags.push('email');
        if (/(code|programming|function|debug)/i.test(text)) tags.push('code');
        if (/(write|creative|story|content)/i.test(text)) tags.push('writing');
        if (/(research|analysis|data|report)/i.test(text)) tags.push('research');
        if (/(business|strategy|plan|proposal)/i.test(text)) tags.push('business');
        if (/(learn|teach|explain|tutorial)/i.test(text)) tags.push('education');
        if (/(urgent|quick|fast|asap)/i.test(text)) tags.push('urgent');
        
        return tags;
    }

    renderHistoryList(container) {
        if (!container) return;
        
        if (this.history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-history"></i>
                    </div>
                    <h3>No History Yet</h3>
                    <p>Your generated prompts will appear here</p>
                    <p class="empty-state-hint">Generate a prompt to see it in history</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        this.history.forEach(item => {
            const historyEl = this.createHistoryElement(item);
            container.appendChild(historyEl);
        });
    }

    createHistoryElement(item) {
        const historyEl = document.createElement('div');
        historyEl.className = 'history-item';
        historyEl.dataset.id = item.id;
        
        const truncatedInput = this.truncateText(item.input || 'No input', 80);
        const truncatedPrompt = this.truncateText(item.prompt || '', 60);
        
        historyEl.innerHTML = `
            <div class="history-content">
                <div class="history-text" title="${this.escapeHtml(item.input || '')}">
                    ${this.escapeHtml(truncatedInput)}
                </div>
                <div class="history-preview">
                    <i class="fas fa-chevron-right"></i>
                    ${this.escapeHtml(truncatedPrompt)}
                </div>
                <div class="history-details">
                    <span class="history-time">
                        <i class="fas fa-clock"></i>
                        ${item.time} • ${item.date}
                    </span>
                    <span class="history-model">
                        <i class="fas fa-robot"></i>
                        ${item.model || 'Unknown'}
                    </span>
                    ${item.tags && item.tags.length > 0 ? `
                        <span class="history-tags">
                            ${item.tags.slice(0, 2).map(tag => 
                                `<span class="history-tag">${tag}</span>`
                            ).join('')}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="history-actions">
                <button class="history-action-btn" data-action="load" title="Load this prompt">
                    <i class="fas fa-upload"></i>
                </button>
                <button class="history-action-btn" data-action="copy" title="Copy prompt">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="history-action-btn" data-action="delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        this.setupHistoryElementEvents(historyEl, item);
        
        return historyEl;
    }

    setupHistoryElementEvents(element, item) {
        const buttons = element.querySelectorAll('.history-action-btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                
                switch(action) {
                    case 'load':
                        this.loadItem(item);
                        break;
                    case 'copy':
                        this.copyItem(item);
                        break;
                    case 'delete':
                        this.deleteItem(item.id);
                        break;
                }
            });
        });
        
        // Click on item loads it
        element.addEventListener('click', (e) => {
            if (!e.target.closest('.history-action-btn')) {
                this.loadItem(item);
            }
        });
    }

    loadItem(item) {
        // Dispatch load event
        const event = new CustomEvent('history:load', {
            detail: { item }
        });
        document.dispatchEvent(event);
    }

    copyItem(item) {
        if (item.prompt) {
            navigator.clipboard.writeText(item.prompt)
                .then(() => {
                    this.showNotification('Prompt copied to clipboard!', 'success');
                })
                .catch(() => {
                    this.showNotification('Failed to copy', 'error');
                });
        }
    }

    deleteItem(id) {
        if (confirm('Delete this history item?')) {
            this.delete(id);
            this.showNotification('History item deleted', 'info');
        }
    }

    setupEventListeners() {
        // Listen for new prompt events
        document.addEventListener('prompt:generated', (e) => {
            const { input, prompt, model } = e.detail;
            if (input && prompt) {
                this.add(input, prompt, model);
            }
        });
        
        // Listen for clear events
        document.addEventListener('app:clear', () => {
            // Don't clear history on app reset
        });
    }

    dispatchHistoryUpdate() {
        const event = new CustomEvent('history:updated', {
            detail: { history: this.history }
        });
        document.dispatchEvent(event);
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return this.escapeHtml(text);
        return this.escapeHtml(text.substring(0, maxLength)) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        const event = new CustomEvent('notification', {
            detail: { type, message }
        });
        document.dispatchEvent(event);
    }

    // Export/Import functionality
    exportHistory(format = 'json') {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            count: this.history.length,
            history: this.history
        };
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(data.history);
        }
        return data;
    }

    importHistory(data) {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            
            if (parsed.history && Array.isArray(parsed.history)) {
                // Validate each item
                const validItems = parsed.history.filter(item => 
                    item && 
                    (item.input || item.prompt) &&
                    item.timestamp
                );
                
                // Add to existing history
                validItems.forEach(item => {
                    if (!this.history.some(h => h.id === item.id)) {
                        this.history.push(item);
                    }
                });
                
                // Sort by timestamp
                this.history.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                
                // Limit items
                if (this.history.length > this.maxItems) {
                    this.history = this.history.slice(0, this.maxItems);
                }
                
                this.saveHistory(this.history);
                this.dispatchHistoryUpdate();
                
                return {
                    success: true,
                    imported: validItems.length,
                    skipped: parsed.history.length - validItems.length
                };
            }
            
            return { success: false, error: 'Invalid format' };
            
        } catch (error) {
            console.error('Import error:', error);
            return { success: false, error: error.message };
        }
    }

    convertToCSV(history) {
        const headers = ['Timestamp', 'Input', 'Prompt', 'Model', 'Tags'];
        const rows = history.map(item => [
            item.timestamp,
            `"${(item.input || '').replace(/"/g, '""')}"`,
            `"${(item.prompt || '').replace(/"/g, '""')}"`,
            item.model || '',
            item.tags ? item.tags.join(', ') : ''
        ]);
        
        return [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
} else {
    window.HistoryManager = HistoryManager;
}
