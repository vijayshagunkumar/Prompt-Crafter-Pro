// js/modules/history-manager.js
(function() {
    'use strict';
    
    class HistoryManager {
        constructor() {
            this.storageKey = 'promptcraft_history';
            this.maxItems = 50; // Maximum number of history items to store
            this.history = this.loadHistory();
            
            console.log('[HistoryManager] Initialized with', this.history.length, 'items');
        }
        
        loadHistory() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch (error) {
                console.error('[HistoryManager] Error loading history:', error);
            }
            
            return [];
        }
        
        saveHistory() {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.history));
                return true;
            } catch (error) {
                console.error('[HistoryManager] Error saving history:', error);
                return false;
            }
        }
        
        add(item) {
            // Add timestamp if not present
            if (!item.timestamp) {
                item.timestamp = new Date().toISOString();
            }
            
            // Add ID if not present
            if (!item.id) {
                item.id = Date.now();
            }
            
            // Add to beginning of array (newest first)
            this.history.unshift(item);
            
            // Limit to max items
            if (this.history.length > this.maxItems) {
                this.history = this.history.slice(0, this.maxItems);
            }
            
            this.saveHistory();
            console.log('[HistoryManager] Added item:', item.id);
            
            return item.id;
        }
        
        get(id) {
            return this.history.find(item => item.id == id);
        }
        
        getAll() {
            return [...this.history];
        }
        
        remove(id) {
            const initialLength = this.history.length;
            this.history = this.history.filter(item => item.id != id);
            
            if (this.history.length < initialLength) {
                this.saveHistory();
                console.log('[HistoryManager] Removed item:', id);
                return true;
            }
            
            return false;
        }
        
        clear() {
            this.history = [];
            this.saveHistory();
            console.log('[HistoryManager] Cleared all history');
            return true;
        }
        
        update(id, updates) {
            const item = this.get(id);
            if (item) {
                Object.assign(item, updates);
                this.saveHistory();
                console.log('[HistoryManager] Updated item:', id);
                return true;
            }
            return false;
        }
        
        // Search history by input text
        search(query) {
            const searchTerm = query.toLowerCase();
            return this.history.filter(item => 
                item.input.toLowerCase().includes(searchTerm) ||
                item.prompt.toLowerCase().includes(searchTerm)
            );
        }
        
        // Get recent items
        getRecent(limit = 10) {
            return this.history.slice(0, limit);
        }
        
        // Get count
        count() {
            return this.history.length;
        }
        
        // Export history
        export() {
            return JSON.stringify(this.history, null, 2);
        }
        
        // Import history
        import(jsonString) {
            try {
                const imported = JSON.parse(jsonString);
                if (Array.isArray(imported)) {
                    this.history = imported;
                    this.saveHistory();
                    console.log('[HistoryManager] Imported', imported.length, 'items');
                    return true;
                }
            } catch (error) {
                console.error('[HistoryManager] Error importing history:', error);
            }
            return false;
        }
    }
    
    // Export to global scope
    window.HistoryManager = HistoryManager;
    
})();
