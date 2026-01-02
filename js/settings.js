import Config from './config.js';

/**
 * Settings management for PromptCraft Pro
 */

class SettingsManager {
    constructor() {
        this.defaultSettings = {
            // Appearance
            theme: 'dark',
            uiDensity: 'comfortable',
            animations: true,
            
            // Language
            interfaceLanguage: 'en',
            voiceInputLanguage: 'en-US',
            voiceOutputLanguage: 'en-US',
            
            // AI Preferences
            defaultModel: Config.API.DEFAULT_MODEL,
            defaultPlatform: 'gemini',
            promptStyle: 'detailed',
            
            // API Settings
            apiMode: 'auto',
            apiEndpoint: Config.getApiUrl(),
            enableRealApi: true,
            
            // Editor
            autoConvertDelay: 0,
            textareaSize: 'auto',
            enableSpellCheck: true,
            
            // History
            maxHistoryItems: 25,
            enableHistory: true,
            autoSaveHistory: true,
            
            // Notifications
            notificationDuration: 3000,
            enableSounds: false,
            
            // Advanced
            debugMode: 'off',
            enableAnalytics: false,
            enableTelemetry: false,
            
            // User preferences
            autoCopyToClipboard: false,
            autoOpenPlatform: false,
            enableKeyboardShortcuts: true
        };
        
        this.currentSettings = { ...this.defaultSettings };
        this.load();
    }

    /**
     * Load settings from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem('promptcraft_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.currentSettings = { ...this.defaultSettings, ...parsed };
                this.migrateSettings();
                return true;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        
        return false;
    }

    /**
     * Save settings to localStorage
     */
    save() {
        try {
            localStorage.setItem('promptcraft_settings', JSON.stringify(this.currentSettings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    /**
     * Migrate settings from older versions
     */
    migrateSettings() {
        // Migration for v1 to v2
        if (this.currentSettings.theme === 'system') {
            this.currentSettings.theme = 'auto';
        }
        
        // Migration for model names
        if (this.currentSettings.defaultModel === 'gemini-flash') {
            this.currentSettings.defaultModel = 'gemini-3-flash-preview';
        }
        
        // Ensure all default settings exist
        Object.keys(this.defaultSettings).forEach(key => {
            if (this.currentSettings[key] === undefined) {
                this.currentSettings[key] = this.defaultSettings[key];
            }
        });
    }

    /**
     * Get a setting value
     */
    get(key) {
        return this.currentSettings[key] !== undefined 
            ? this.currentSettings[key] 
            : this.defaultSettings[key];
    }

    /**
     * Set a setting value
     */
    set(key, value) {
        this.currentSettings[key] = value;
        return this.save();
    }

    /**
     * Set multiple settings at once
     */
    setMultiple(settings) {
        Object.keys(settings).forEach(key => {
            this.currentSettings[key] = settings[key];
        });
        return this.save();
    }

    /**
     * Reset all settings to defaults
     */
    reset() {
        this.currentSettings = { ...this.defaultSettings };
        return this.save();
    }

    /**
     * Reset specific setting to default
     */
    resetSetting(key) {
        if (this.defaultSettings[key] !== undefined) {
            this.currentSettings[key] = this.defaultSettings[key];
            return this.save();
        }
        return false;
    }

    /**
     * Get all settings
     */
    getAll() {
        return { ...this.currentSettings };
    }

    /**
     * Get settings as JSON string
     */
    toJSON() {
        return JSON.stringify(this.currentSettings, null, 2);
    }

    /**
     * Export settings to file
     */
    exportSettings() {
        const data = {
            version: Config.FRONTEND.VERSION,
            exportDate: new Date().toISOString(),
            settings: this.currentSettings
        };
        
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import settings from file
     */
    importSettings(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.settings) {
                this.currentSettings = { ...this.defaultSettings, ...data.settings };
                this.migrateSettings();
                this.save();
                return true;
            }
        } catch (error) {
            console.error('Failed to import settings:', error);
        }
        
        return false;
    }

    /**
     * Get settings diff from defaults
     */
    getChangedSettings() {
        const changed = {};
        
        Object.keys(this.currentSettings).forEach(key => {
            if (this.currentSettings[key] !== this.defaultSettings[key]) {
                changed[key] = {
                    current: this.currentSettings[key],
                    default: this.defaultSettings[key]
                };
            }
        });
        
        return changed;
    }

    /**
     * Check if setting is different from default
     */
    isChanged(key) {
        return this.currentSettings[key] !== this.defaultSettings[key];
    }

    /**
     * Apply theme to document
     */
    applyTheme() {
        const theme = this.get('theme');
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.toggle('dark-theme', prefersDark);
        } else {
            document.body.classList.toggle('dark-theme', theme === 'dark');
        }
    }

    /**
     * Apply UI density
     */
    applyUIDensity() {
        const density = this.get('uiDensity');
        const root = document.documentElement;
        
        const densities = {
            comfortable: {
                '--spacing-xs': '0.25rem',
                '--spacing-sm': '0.5rem',
                '--spacing-md': '0.75rem',
                '--spacing-lg': '1rem',
                '--spacing-xl': '1.5rem',
                '--spacing-2xl': '2rem',
                '--font-size-base': '1rem'
            },
            compact: {
                '--spacing-xs': '0.125rem',
                '--spacing-sm': '0.25rem',
                '--spacing-md': '0.5rem',
                '--spacing-lg': '0.75rem',
                '--spacing-xl': '1rem',
                '--spacing-2xl': '1.5rem',
                '--font-size-base': '0.875rem'
            },
            spacious: {
                '--spacing-xs': '0.5rem',
                '--spacing-sm': '1rem',
                '--spacing-md': '1.5rem',
                '--spacing-lg': '2rem',
                '--spacing-xl': '3rem',
                '--spacing-2xl': '4rem',
                '--font-size-base': '1.125rem'
            }
        };
        
        const vars = densities[density] || densities.comfortable;
        Object.entries(vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }

    /**
     * Get language display name
     */
    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'hi': 'Hindi',
            'te': 'Telugu',
            'kn': 'Kannada',
            'ru': 'Russian',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese'
        };
        
        return languages[code] || code;
    }

    /**
     * Get model display name
     */
    getModelDisplayName(modelId) {
        return Config.getModelDisplayName(modelId);
    }

    /**
     * Get available themes
     */
    getAvailableThemes() {
        return [
            { id: 'auto', name: 'Auto (System)' },
            { id: 'light', name: 'Light' },
            { id: 'dark', name: 'Dark' }
        ];
    }

    /**
     * Get available UI densities
     */
    getAvailableUIDensities() {
        return [
            { id: 'comfortable', name: 'Comfortable' },
            { id: 'compact', name: 'Compact' },
            { id: 'spacious', name: 'Spacious' }
        ];
    }

    /**
     * Get available prompt styles
     */
    getAvailablePromptStyles() {
        return [
            { id: 'detailed', name: 'Detailed & Structured' },
            { id: 'concise', name: 'Concise & Direct' },
            { id: 'creative', name: 'Creative & Engaging' },
            { id: 'analytical', name: 'Analytical & Technical' },
            { id: 'professional', name: 'Professional & Formal' }
        ];
    }

    /**
     * Get available API modes
     */
    getAvailableApiModes() {
        return [
            { id: 'auto', name: 'Auto (Online with fallback)' },
            { id: 'online', name: 'Online only' },
            { id: 'offline', name: 'Offline only' }
        ];
    }

    /**
     * Get available models
     */
    getAvailableModels() {
        const models = Config.API.MODELS;
        return Object.keys(models).map(id => ({
            id,
            name: models[id].name,
            provider: models[id].provider
        }));
    }

    /**
     * Validate settings
     */
    validate() {
        const errors = [];
        
        // Validate API endpoint
        const apiEndpoint = this.get('apiEndpoint');
        try {
            new URL(apiEndpoint);
        } catch (error) {
            errors.push('Invalid API endpoint URL');
        }
        
        // Validate max history items
        const maxHistoryItems = this.get('maxHistoryItems');
        if (typeof maxHistoryItems !== 'number' || maxHistoryItems < 0 || maxHistoryItems > 1000) {
            errors.push('Max history items must be between 0 and 1000');
        }
        
        // Validate notification duration
        const notificationDuration = this.get('notificationDuration');
        if (typeof notificationDuration !== 'number' || notificationDuration < 0) {
            errors.push('Notification duration must be a positive number');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Clear all settings (reset to defaults and clear storage)
     */
    clear() {
        localStorage.removeItem('promptcraft_settings');
        localStorage.removeItem('promptcraft_history');
        localStorage.removeItem('promptcraft_cache');
        this.currentSettings = { ...this.defaultSettings };
        return true;
    }

    /**
     * Get storage usage
     */
    getStorageUsage() {
        let total = 0;
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage.getItem(key).length * 2; // UTF-16 uses 2 bytes per char
            }
        }
        
        return {
            bytes: total,
            kilobytes: (total / 1024).toFixed(2),
            megabytes: (total / (1024 * 1024)).toFixed(4)
        };
    }
}

export default SettingsManager;
