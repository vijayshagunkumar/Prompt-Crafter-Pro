/**
 * Storage Service
 * Handles localStorage with prefixing and error handling
 */
class StorageService {
    constructor() {
        this.prefix = 'promptcraft_';
    }

    // Core methods
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    clear(prefix = null) {
        try {
            if (prefix) {
                const keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith(this.prefix + prefix)) {
                        keys.push(key);
                    }
                }
                keys.forEach(key => localStorage.removeItem(key));
            } else {
                const keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith(this.prefix)) {
                        keys.push(key);
                    }
                }
                keys.forEach(key => localStorage.removeItem(key));
            }
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    // App-specific methods
    saveSettings(settings) {
        return this.set('settings', settings);
    }

    loadSettings() {
        return this.get('settings', {});
    }

    saveTheme(theme) {
        return this.set('theme', theme);
    }

    loadTheme(defaultValue = 'dark') {
        return this.get('theme', defaultValue);
    }

    saveModel(model) {
        return this.set('model', model);
    }

    loadModel(defaultValue = 'gemini-1.5-flash') {
        return this.get('model', defaultValue);
    }

    saveVoiceLanguage(language) {
        return this.set('voice_language', language);
    }

    loadVoiceLanguage(defaultValue = 'en-US') {
        return this.get('voice_language', defaultValue);
    }

    saveHistory(history) {
        return this.set('prompt_history', history);
    }

    loadHistory(defaultValue = []) {
        return this.get('prompt_history', defaultValue);
    }

    saveTemplates(templates) {
        return this.set('templates', templates);
    }

    loadTemplates(defaultValue = []) {
        return this.get('templates', defaultValue);
    }

    saveAutoDelay(delay) {
        return this.set('auto_delay', delay);
    }

    loadAutoDelay(defaultValue = 0) {
        return this.get('auto_delay', defaultValue);
    }

    // Voice settings
    getVoiceSettings() {
        return {
            inputLanguage: this.get('voice_input_lang', 'en-US'),
            outputLanguage: this.get('voice_output_lang', 'en-US'),
            enabled: this.get('voice_enabled', true)
        };
    }

    saveVoiceSettings(settings) {
        this.set('voice_input_lang', settings.inputLanguage);
        this.set('voice_output_lang', settings.outputLanguage);
        this.set('voice_enabled', settings.enabled);
        return true;
    }

    // App state
    saveAppState(state) {
        return this.set('app_state', state);
    }

    loadAppState(defaultValue = {}) {
        return this.get('app_state', defaultValue);
    }

    // Recent items
    saveRecentItems(items) {
        return this.set('recent_items', items);
    }

    loadRecentItems(defaultValue = []) {
        return this.get('recent_items', defaultValue);
    }

    // User preferences
    savePreferences(prefs) {
        return this.set('preferences', prefs);
    }

    loadPreferences(defaultValue = {}) {
        return this.get('preferences', defaultValue);
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
} else {
    window.StorageService = StorageService;
}
