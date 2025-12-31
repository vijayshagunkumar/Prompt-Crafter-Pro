// History Manager - Complete Fixed Version
class HistoryManager {
    constructor() {
        this.storage = new StorageService();
        this.history = this.loadHistory();
        this.maxItems = 50;
    }

    loadHistory() {
        try {
            return this.storage.get('prompt_history', []);
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    saveHistory(history) {
        this.history = history;
        return this.storage.set('prompt_history', history);
    }

    add(input, prompt, model = 'local') {
        const historyItem = {
            id: Date.now().toString(),
            input: input,
            prompt: prompt,
            model: model,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        };
        
        // Add to beginning
        this.history.unshift(historyItem);
        
        // Limit items
        if (this.history.length > this.maxItems) {
            this.history = this.history.slice(0, this.maxItems);
        }
        
        this.saveHistory(this.history);
        return historyItem;
    }

    getAll() {
        return this.history;
    }

    clear() {
        this.history = [];
        this.saveHistory(this.history);
        return true;
    }

    getStats() {
        return {
            total: this.history.length,
            today: this.history.filter(item => 
                new Date(item.timestamp).toDateString() === new Date().toDateString()
            ).length
        };
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
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        this.history.forEach(item => {
            const historyEl = document.createElement('div');
            historyEl.className = 'history-item';
            historyEl.dataset.id = item.id;
            
            historyEl.innerHTML = `
                <div class="history-content">
                    <div class="history-text">${this.truncateText(item.input, 80)}</div>
                    <div class="history-details">
                        <span class="history-time">
                            <i class="fas fa-clock"></i>
                            ${item.time} • ${item.date}
                        </span>
                        <span class="history-model">
                            <i class="fas fa-robot"></i>
                            ${item.model}
                        </span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn" title="Load this prompt" data-action="load">
                        <i class="fas fa-upload"></i>
                    </button>
                    <button class="history-action-btn" title="Copy this prompt" data-action="copy">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="history-action-btn" title="Delete" data-action="delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners to buttons
            const buttons = historyEl.querySelectorAll('.history-action-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    
                    switch(action) {
                        case 'load':
                            this.loadItem(item.id);
                            break;
                        case 'copy':
                            this.copyItem(item.id);
                            break;
                        case 'delete':
                            this.deleteItem(item.id);
                            break;
                    }
                });
            });
            
            // Click on item loads it
            historyEl.addEventListener('click', () => {
                this.loadItem(item.id);
            });
            
            container.appendChild(historyEl);
        });
    }

    loadItem(id) {
        const item = this.history.find(h => h.id === id);
        if (item && window.app) {
            window.app.loadFromHistory(item);
        }
    }

    copyItem(id) {
        const item = this.history.find(h => h.id === id);
        if (item && item.prompt) {
            navigator.clipboard.writeText(item.prompt)
                .then(() => {
                    if (window.app && window.app.showNotification) {
                        window.app.showNotification('Copied to clipboard!', 'success');
                    }
                });
        }
    }

    deleteItem(id) {
        const index = this.history.findIndex(item => item.id === id);
        if (index !== -1) {
            this.history.splice(index, 1);
            this.saveHistory(this.history);
            this.renderHistoryList(document.getElementById('historyList'));
            
            if (window.app && window.app.showNotification) {
                window.app.showNotification('History item deleted', 'info');
            }
        }
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
}

window.HistoryManager = HistoryManager;
