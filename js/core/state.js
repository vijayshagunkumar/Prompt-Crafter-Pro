// js/state.js
class StorageService {
    constructor() {
        this.prefix = 'promptcraft_';
    }

    save(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    clear() {
        Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .forEach(key => localStorage.removeItem(key));
    }

    // Specific methods for common data
    saveSettings(settings) {
        return this.save('settings', settings);
    }

    loadSettings(defaultSettings = {}) {
        return this.load('settings', defaultSettings);
    }

    saveHistory(history) {
        return this.save('history', history);
    }

    loadHistory() {
        return this.load('history', []);
    }

    saveTemplates(templates) {
        return this.save('templates', templates);
    }

    loadTemplates() {
        return this.load('templates', []);
    }

    saveTheme(theme) {
        return this.save('theme', theme);
    }

    loadTheme(defaultTheme = 'dark') {
        return this.load('theme', defaultTheme);
    }

    saveModel(model) {
        return this.save('model', model);
    }

    loadModel(defaultModel = 'gemini') {
        return this.load('model', defaultModel);
    }

    saveVoiceLanguage(lang) {
        return this.save('voice_lang', lang);
    }

    loadVoiceLanguage(defaultLang = 'en-US') {
        return this.load('voice_lang', defaultLang);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
} else {
    window.StorageService = StorageService;
}
