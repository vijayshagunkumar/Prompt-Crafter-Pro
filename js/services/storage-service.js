// storage-service.js - localStorage wrapper
(function() {
    'use strict';
    
    class StorageService {
        constructor() {
            this.prefix = 'promptCraft_';
        }
        
        set(key, value) {
            try {
                const storageKey = this.prefix + key;
                const serializedValue = JSON.stringify(value);
                localStorage.setItem(storageKey, serializedValue);
                return true;
            } catch (e) {
                console.error('Failed to set storage item:', e);
                return false;
            }
        }
        
        get(key, defaultValue = null) {
            try {
                const storageKey = this.prefix + key;
                const item = localStorage.getItem(storageKey);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Failed to get storage item:', e);
                return defaultValue;
            }
        }
        
        remove(key) {
            try {
                const storageKey = this.prefix + key;
                localStorage.removeItem(storageKey);
                return true;
            } catch (e) {
                console.error('Failed to remove storage item:', e);
                return false;
            }
        }
        
        clear() {
            try {
                // Only remove items with our prefix
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith(this.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
                return true;
            } catch (e) {
                console.error('Failed to clear storage:', e);
                return false;
            }
        }
        
        exists(key) {
            const storageKey = this.prefix + key;
            return localStorage.getItem(storageKey) !== null;
        }
        
        getAll() {
            const items = {};
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith(this.prefix)) {
                        const cleanKey = key.substring(this.prefix.length);
                        items[cleanKey] = JSON.parse(localStorage.getItem(key));
                    }
                }
            } catch (e) {
                console.error('Failed to get all storage items:', e);
            }
            return items;
        }
        
        // Specific methods for our app
        saveSettings(settings) {
            return this.set('settings', settings);
        }
        
        loadSettings() {
            return this.get('settings', {});
        }
        
        saveHistory(history) {
            return this.set('history', history);
        }
        
        loadHistory() {
            return this.get('history', []);
        }
        
        saveTemplates(templates) {
            return this.set('templates', templates);
        }
        
        loadTemplates() {
            return this.get('templates', []);
        }
        
        // Session storage methods (temporary data)
        setSession(key, value) {
            try {
                const storageKey = this.prefix + key;
                const serializedValue = JSON.stringify(value);
                sessionStorage.setItem(storageKey, serializedValue);
                return true;
            } catch (e) {
                console.error('Failed to set session item:', e);
                return false;
            }
        }
        
        getSession(key, defaultValue = null) {
            try {
                const storageKey = this.prefix + key;
                const item = sessionStorage.getItem(storageKey);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Failed to get session item:', e);
                return defaultValue;
            }
        }
        
        // Utility methods
        getStorageInfo() {
            const totalBytes = this.estimateStorageSize();
            const usedBytes = this.estimateUsedStorage();
            const availableBytes = totalBytes - usedBytes;
            
            return {
                total: this.formatBytes(totalBytes),
                used: this.formatBytes(usedBytes),
                available: this.formatBytes(availableBytes),
                percentage: Math.round((usedBytes / totalBytes) * 100),
                itemsCount: Object.keys(this.getAll()).length
            };
        }
        
        estimateStorageSize() {
            // Most browsers allow ~5MB per domain
            return 5 * 1024 * 1024; // 5MB in bytes
        }
        
        estimateUsedStorage() {
            let total = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                total += key.length + value.length;
            }
            return total * 2; // Each character is 2 bytes in UTF-16
        }
        
        formatBytes(bytes, decimals = 2) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }
        
        // Backup and restore
        backup() {
            const data = this.getAll();
            data._backupDate = new Date().toISOString();
            data._version = '1.0';
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `promptcraft-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        async restore(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        // Clear existing data
                        this.clear();
                        
                        // Restore data
                        Object.keys(data).forEach(key => {
                            if (key !== '_backupDate' && key !== '_version') {
                                this.set(key, data[key]);
                            }
                        });
                        
                        resolve({
                            success: true,
                            itemsRestored: Object.keys(data).length - 2, // Exclude metadata
                            backupDate: data._backupDate
                        });
                    } catch (error) {
                        reject(new Error('Invalid backup file format'));
                    }
                };
                
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
        }
    }
    
    // Export to global scope
    window.StorageService = StorageService;
    
})();
