// LocalStorage wrapper with TTL support
class StorageService {
    constructor() {
        this.prefix = 'promptcraft_';
        this.memoryCache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    // Basic CRUD operations
    set(key, value, ttl = null) {
        const storageKey = this.prefix + key;
        const item = {
            data: value,
            timestamp: Date.now(),
            ttl: ttl
        };
        
        try {
            localStorage.setItem(storageKey, JSON.stringify(item));
            this.memoryCache.set(storageKey, item);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            // Fallback to memory cache if localStorage fails
            this.memoryCache.set(storageKey, item);
            return false;
        }
    }

    get(key, defaultValue = null) {
        const storageKey = this.prefix + key;
        
        // Check memory cache first
        const cached = this.memoryCache.get(storageKey);
        if (cached && this.isValid(cached)) {
            return cached.data;
        }
        
        try {
            const itemStr = localStorage.getItem(storageKey);
            if (!itemStr) return defaultValue;
            
            const item = JSON.parse(itemStr);
            
            // Check if item is expired
            if (!this.isValid(item)) {
                this.remove(key);
                return defaultValue;
            }
            
            // Update memory cache
            this.memoryCache.set(storageKey, item);
            
            return item.data;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    remove(key) {
        const storageKey = this.prefix + key;
        
        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
        
        this.memoryCache.delete(storageKey);
    }

    clear(prefix = null) {
        const targetPrefix = prefix ? this.prefix + prefix : this.prefix;
        
        try {
            // Get all keys
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(targetPrefix)) {
                    keys.push(key);
                }
            }
            
            // Remove matching keys
            keys.forEach(key => localStorage.removeItem(key));
            
        } catch (error) {
            console.error('Storage clear error:', error);
        }
        
        // Clear memory cache
        if (prefix) {
            for (const key of this.memoryCache.keys()) {
                if (key.startsWith(targetPrefix)) {
                    this.memoryCache.delete(key);
                }
            }
        } else {
            this.memoryCache.clear();
        }
    }

    keys(prefix = null) {
        const targetPrefix = prefix ? this.prefix + prefix : this.prefix;
        const keys = [];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(targetPrefix)) {
                    keys.push(key.replace(targetPrefix, ''));
                }
            }
        } catch (error) {
            console.error('Storage keys error:', error);
        }
        
        return keys;
    }

    // Check if storage item is valid (not expired)
    isValid(item) {
        if (!item || !item.timestamp) return false;
        
        const now = Date.now();
        const age = now - item.timestamp;
        
        // Check TTL if set
        if (item.ttl && age > item.ttl) {
            return false;
        }
        
        return true;
    }

    // Specific app data methods
    saveSettings(settings) {
        return this.set('settings', settings);
    }

    loadSettings(defaultSettings = {}) {
        return this.get('settings', defaultSettings);
    }

    saveTemplates(templates) {
        return this.set('templates', templates);
    }

    loadTemplates(defaultTemplates = []) {
        return this.get('templates', defaultTemplates);
    }

    saveHistory(history) {
        return this.set('history', history);
    }

    loadHistory(defaultHistory = []) {
        return this.get('history', defaultHistory);
    }

    saveTheme(theme) {
        return this.set('theme', theme);
    }

    loadTheme(defaultTheme = 'dark') {
        return this.get('theme', defaultTheme);
    }

    saveModel(model) {
        return this.set('model', model);
    }

    loadModel(defaultModel = 'gemini-1.5-flash') {
        return this.get('model', defaultModel);
    }

    // Usage statistics
    incrementUsageCount() {
        const count = this.get('usage_count', 0);
        this.set('usage_count', count + 1);
        return count + 1;
    }

    getUsageCount() {
        return this.get('usage_count', 0);
    }

    // Export/import all data
    exportData() {
        const data = {};
        const keys = this.keys();
        
        keys.forEach(key => {
            data[key] = this.get(key);
        });
        
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: data
        };
    }

    importData(exportData, overwrite = false) {
        if (!exportData || !exportData.data) {
            throw new Error('Invalid export data');
        }
        
        const importedKeys = Object.keys(exportData.data);
        let importedCount = 0;
        
        importedKeys.forEach(key => {
            if (overwrite || !this.get(key)) {
                this.set(key, exportData.data[key]);
                importedCount++;
            }
        });
        
        return importedCount;
    }

    // Storage quota management
    getQuotaInfo() {
        try {
            let used = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    used += localStorage.getItem(key).length;
                }
            }
            
            // Convert to KB
            used = Math.round((used / 1024) * 100) / 100;
            
            // Note: localStorage quota varies by browser (usually 5-10MB)
            return {
                usedKB: used,
                percentage: Math.min(100, (used / 5120) * 100) // Assuming 5MB quota
            };
        } catch (error) {
            return { usedKB: 0, percentage: 0 };
        }
    }

    // Cleanup expired items
    cleanupExpired() {
        const keys = this.keys();
        let cleaned = 0;
        
        keys.forEach(key => {
            const item = this.get(key, null, false); // Don't auto-remove
            if (item === null) {
                this.remove(key);
                cleaned++;
            }
        });
        
        return cleaned;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
} else {
    window.StorageService = StorageService;
}
