// History Manager - Complete
class HistoryManager {
    constructor() {
        this.storage = new StorageService();
        this.history = this.loadHistory();
        this.maxItems = 50;
    }

    loadHistory() {
        return this.storage.loadHistory() || [];
    }

    saveHistory(history) {
        this.history = history;
        return this.storage.saveHistory(history);
    }

    add(item) {
        const historyItem = {
            id: Date.now().toString(),
            ...item,
            timestamp: new Date().toISOString()
        };
        
        this.history.unshift(historyItem);
        
        if (this.history.length > this.maxItems) {
            this.history = this.history.slice(0, this.maxItems);
        }
        
        this.saveHistory(this.history);
        return historyItem;
    }

    getById(id) {
        return this.history.find(item => item.id === id);
    }

    getAll() {
        return this.history;
    }

    getRecent(limit = 10) {
        return this.history.slice(0, limit);
    }

    update(id, updates) {
        const index = this.history.findIndex(item => item.id === id);
        if (index === -1) return null;
        
        this.history[index] = { ...this.history[index], ...updates };
        this.saveHistory(this.history);
        return this.history[index];
    }

    delete(id) {
        const index = this.history.findIndex(item => item.id === id);
        if (index === -1) return false;
        
        this.history.splice(index, 1);
        this.saveHistory(this.history);
        return true;
    }

    clear() {
        this.history = [];
        this.saveHistory(this.history);
        return true;
    }

    search(query) {
        const searchTerm = query.toLowerCase();
        return this.history.filter(item => 
            (item.input && item.input.toLowerCase().includes(searchTerm)) ||
            (item.prompt && item.prompt.toLowerCase().includes(searchTerm)) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    getStats() {
        return {
            total: this.history.length,
            today: this.getTodayCount(),
            thisWeek: this.getThisWeekCount(),
            byModel: this.getCountByModel()
        };
    }

    getTodayCount() {
        const today = new Date().toDateString();
        return this.history.filter(item => 
            new Date(item.timestamp).toDateString() === today
        ).length;
    }

    getThisWeekCount() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return this.history.filter(item => 
            new Date(item.timestamp) >= oneWeekAgo
        ).length;
    }

    getCountByModel() {
        const counts = {};
        this.history.forEach(item => {
            const model = item.model || 'unknown';
            counts[model] = (counts[model] || 0) + 1;
        });
        return counts;
    }

    renderHistoryList(container, onSelect) {
        if (!container) return;
        
        if (this.history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-history"></i>
                    </div>
                    <h3>No History Yet</h3>
                    <p>Your prompt history will appear here after you generate prompts.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        this.history.forEach(item => {
            const historyEl = document.createElement('div');
            historyEl.className = 'history-item';
            historyEl.dataset.id = item.id;
            
            const date = new Date(item.timestamp);
            const timeAgo = this.getTimeAgo(date);
            
            historyEl.innerHTML = `
                <div class="history-content">
                    <div class="history-text">${this.truncateText(item.input || '', 100)}</div>
                    <div class="history-details">
                        <span class="history-time">
                            <i class="fas fa-clock"></i>
                            ${timeAgo}
                        </span>
                        <span class="history-model">
                            <i class="fas fa-robot"></i>
                            ${item.model || 'Local'}
                        </span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn" title="Load this prompt">
                        <i class="fas fa-upload"></i>
                    </button>
                    <button class="history-action-btn" title="Copy this prompt">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            `;
            
            const loadBtn = historyEl.querySelector('.history-action-btn:nth-child(1)');
            const copyBtn = historyEl.querySelector('.history-action-btn:nth-child(2)');
            
            loadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.app && window.app.loadFromHistory) {
                    window.app.loadFromHistory(item.id);
                }
            });
            
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (item.prompt) {
                    navigator.clipboard.writeText(item.prompt)
                        .then(() => {
                            if (window.app && window.app.services && window.app.services.notification) {
                                window.app.services.notification.success('Copied from history');
                            }
                        });
                }
            });
            
            historyEl.addEventListener('click', () => {
                if (onSelect) {
                    onSelect(item);
                }
            });
            
            container.appendChild(historyEl);
        });
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
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
