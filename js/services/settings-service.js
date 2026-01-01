// js/services/settings-service.js
(function() {
    'use strict';
    
    class SettingsService {
        constructor() {
            this.defaultSettings = {
                theme: 'dark',
                density: 'comfortable',
                aiModel: 'gemini-3-flash-preview',
                autoConvert: true,
                autoConvertDelay: 5000,
                promptStyle: 'detailed',
                voiceLanguage: 'en-US'
            };
            
            this.settings = this.loadSettings();
            this.listeners = [];
            
            console.log('[SettingsService] Initialized with:', this.settings);
        }
        
        loadSettings() {
            try {
                const saved = localStorage.getItem('promptcraft_settings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Merge with defaults to ensure all properties exist
                    return { ...this.defaultSettings, ...parsed };
                }
            } catch (error) {
                console.error('[SettingsService] Error loading settings:', error);
            }
            
            return { ...this.defaultSettings };
        }
        
        saveSettings() {
            try {
                localStorage.setItem('promptcraft_settings', JSON.stringify(this.settings));
                console.log('[SettingsService] Settings saved:', this.settings);
                
                // Notify listeners
                this.notifyListeners();
                
                return true;
            } catch (error) {
                console.error('[SettingsService] Error saving settings:', error);
                return false;
            }
        }
        
        get(key) {
            return this.settings[key];
        }
        
        set(key, value) {
            const oldValue = this.settings[key];
            if (oldValue !== value) {
                this.settings[key] = value;
                console.log(`[SettingsService] Setting updated: ${key} = ${value}`);
                return true;
            }
            return false;
        }
        
        updateMultiple(updates) {
            let changed = false;
            for (const [key, value] of Object.entries(updates)) {
                if (this.set(key, value)) {
                    changed = true;
                }
            }
            
            if (changed) {
                this.saveSettings();
            }
            
            return changed;
        }
        
        resetToDefaults() {
            this.settings = { ...this.defaultSettings };
            this.saveSettings();
            console.log('[SettingsService] Reset to defaults');
            return true;
        }
        
        getAll() {
            return { ...this.settings };
        }
        
        addListener(callback) {
            this.listeners.push(callback);
        }
        
        removeListener(callback) {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        }
        
        notifyListeners() {
            this.listeners.forEach(callback => {
                try {
                    callback(this.settings);
                } catch (error) {
                    console.error('[SettingsService] Listener error:', error);
                }
            });
        }
        
        // Helper method to get model display name
        getModelDisplayName(modelValue) {
            const modelNames = {
                'gemini-3-flash-preview': 'Google Gemini 3 Flash Preview',
                'gpt-4o-mini': 'OpenAI GPT-4o Mini',
                'llama-3.1-8b-instant': 'Meta Llama 3.1 8B (via Groq)',
                'gemini-1.5-flash-latest': 'Google Gemini 1.5 Flash Latest',
                'gemini-1.5-flash': 'Google Gemini 1.5 Flash'
            };
            
            return modelNames[modelValue] || modelValue;
        }
    }
    
    // Export to global scope
    window.SettingsService = SettingsService;
    
})();
