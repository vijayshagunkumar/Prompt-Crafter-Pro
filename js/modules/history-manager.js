// history-manager.js - History management
(function() {
    'use strict';
    
    class HistoryManager {
        constructor() {
            this.storage = new StorageService();
            this.history = [];
            this.maxItems = 25;
        }
        
        async load() {
            const saved = this.storage.get('history', []);
            this.history = saved.slice(0, this.maxItems);
            return this.history;
        }
        
        save(input, output, metadata = {}) {
            const historyItem = {
                id: 'prompt_' + Date.now(),
                timestamp: new Date().toISOString(),
                input: input,
                output: output,
                metadata: {
                    ...metadata,
                    length: output.length,
                    wordCount: output.split(/\s+/).length
                }
            };
            
            // Add to beginning of array
            this.history.unshift(historyItem);
            
            // Keep only maxItems
            if (this.history.length > this.maxItems) {
                this.history = this.history.slice(0, this.maxItems);
            }
            
            // Save to storage
            this.storage.set('history', this.history);
            
            return historyItem;
        }
        
        getAll() {
            return this.history;
        }
        
        getById(id) {
            return this.history.find(item => item.id === id);
        }
        
        getRecent(count = 5) {
            return this.history.slice(0, count);
        }
        
        delete(id) {
            const index = this.history.findIndex(item => item.id === id);
            if (index !== -1) {
                this.history.splice(index, 1);
                this.storage.set('history', this.history);
                return true;
            }
            return false;
        }
        
        clear() {
            this.history = [];
            this.storage.remove('history');
        }
        
        search(query) {
            const searchTerm = query.toLowerCase();
            return this.history.filter(item => 
                item.input.toLowerCase().includes(searchTerm) ||
                item.output.toLowerCase().includes(searchTerm) ||
                item.metadata.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        exportHistory() {
            const data = {
                version: '1.0',
                exportDate: new Date().toISOString(),
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
        
        setMaxItems(max) {
            this.maxItems = max;
            if (this.history.length > max) {
                this.history = this.history.slice(0, max);
                this.storage.set('history', this.history);
            }
        }
    }
    
    // Export to global scope
    window.HistoryManager = HistoryManager;
    
})();
