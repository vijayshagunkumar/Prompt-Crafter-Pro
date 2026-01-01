// history-manager.js - History system management
export class HistoryManager {
    constructor() {
        this.maxItems = 25;
        this.history = this.loadHistory();
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('promptCraftHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load history:', e);
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('promptCraftHistory', JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }

    add(input, output) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            input: this.truncateText(input, 100),
            output: this.truncateText(output, 200),
            fullInput: input,
            fullOutput: output
        };

        this.history.unshift(historyItem);

        // Limit history size
        if (this.history.length > this.maxItems) {
            this.history = this.history.slice(0, this.maxItems);
        }

        this.saveHistory();
        return historyItem;
    }

    getAll() {
        return this.history;
    }

    getById(id) {
        return this.history.find(item => item.id === id);
    }

    getByDateRange(startDate, endDate) {
        return this.history.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= startDate && itemDate <= endDate;
        });
    }

    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.history.filter(item => 
            item.input.toLowerCase().includes(lowerQuery) ||
            item.output.toLowerCase().includes(lowerQuery)
        );
    }

    clear() {
        this.history = [];
        this.saveHistory();
        return true;
    }

    delete(id) {
        const index = this.history.findIndex(item => item.id === id);
        if (index !== -1) {
            const deleted = this.history.splice(index, 1);
            this.saveHistory();
            return deleted[0];
        }
        return null;
    }

    updateMaxItems(max) {
        this.maxItems = max;
        if (this.history.length > max) {
            this.history = this.history.slice(0, max);
            this.saveHistory();
        }
    }

    getStats() {
        return {
            total: this.history.length,
            lastUsed: this.history.length > 0 ? new Date(this.history[0].timestamp) : null,
            oldest: this.history.length > 0 ? new Date(this.history[this.history.length - 1].timestamp) : null
        };
    }

    exportHistory() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            itemCount: this.history.length,
            items: this.history
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `promptcraft-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importHistory(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate imported data
                    if (!data.items || !Array.isArray(data.items)) {
                        throw new Error('Invalid history file format');
                    }

                    // Merge with existing history
                    const newItems = data.items.filter(newItem => 
                        !this.history.some(existingItem => 
                            existingItem.id === newItem.id || 
                            (existingItem.fullInput === newItem.fullInput && 
                             existingItem.fullOutput === newItem.fullOutput)
                        )
                    );

                    this.history = [...newItems, ...this.history];
                    
                    // Apply max items limit
                    if (this.history.length > this.maxItems) {
                        this.history = this.history.slice(0, this.maxItems);
                    }

                    this.saveHistory();
                    resolve(newItems.length);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hr ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }
}
