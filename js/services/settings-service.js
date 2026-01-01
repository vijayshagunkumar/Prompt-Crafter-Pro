// settings-service.js - Settings management
(function() {
    'use strict';
    
    class SettingsService {
        constructor() {
            this.defaultSettings = {
                theme: 'dark',
                voiceLanguage: 'en-US',
                autoConvert: true,
                autoConvertDelay: 5000,
                promptStyle: 'detailed',
                maxHistoryItems: 25,
                notificationDuration: 3000,
                uiDensity: 'comfortable',
                defaultModel: 'gemini',
                interfaceLanguage: 'en'
            };
            
            this.storage = new StorageService();
        }
        
        load() {
            const saved = this.storage.get('settings');
            if (saved) {
                return { ...this.defaultSettings, ...saved };
            }
            return this.defaultSettings;
        }
        
        save(settings) {
            return this.storage.set('settings', settings);
        }
        
        reset() {
            this.storage.remove('settings');
            return this.defaultSettings;
        }
        
        update(key, value) {
            const current = this.load();
            const updated = { ...current, [key]: value };
            this.save(updated);
            return updated;
        }
        
        get(key) {
            const settings = this.load();
            return settings[key];
        }
        
        exportSettings() {
            const settings = this.load();
            const data = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                settings: settings
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `promptcraft-settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
    
    // Export to global scope
    window.SettingsService = SettingsService;
    
})();
