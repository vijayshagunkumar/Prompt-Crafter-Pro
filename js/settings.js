import Config from './config.js';

/**
 * Settings management for PromptCraft Pro
 * FIXED VERSION - Updated to match settings keys used in PromptCraftEnterprise.js
 */

class SettingsManager {
    constructor() {
        this.defaultSettings = {
            // Appearance
            theme: 'dark',
            uiDensity: 'comfortable',
            
            // Language
            interfaceLanguage: 'en',
            voiceInputLanguage: 'en-US',
            voiceOutputLanguage: 'en-US',
            
            // AI Preferences
            defaultAiModel: 'gemini-3-flash-preview', // Changed from defaultModel to defaultAiModel
            defaultPlatform: 'gemini',
            promptStyle: 'detailed',
            
            // API Settings
            apiMode: 'auto',
            apiEndpoint: 'https://promptcraft-api.vijay-shagunkumar.workers.dev', // Fixed URL
            enableRealApi: true,
            
            // Editor
            autoConvertDelay: 0,
            textareaSize: 'auto',
            enableSpellCheck: true,
            
            // History
            maxHistoryItems: 50, // Increased from 25 to 50
            enableHistory: true,
            autoSaveHistory: true,
            
            // Notifications
            notificationDuration: 3000,
            enableSounds: false,
            
            // Speech
            speechRate: 1,
            speechPitch: 1,
            speechVolume: 1,
            
            // Advanced
            debugMode: 'off',
            enableAnalytics: false,
            enableTelemetry: false,
            
            // User preferences
            autoCopyToClipboard: false,
            autoOpenPlatform: false,
            enableKeyboardShortcuts: true,
            
            // Auto-save
            autoSave: true
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
                console.log('✅ Settings loaded from localStorage');
                return true;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        
        console.log('⚙️ Using default settings');
        return false;
    }

    /**
     * Save settings to localStorage
     */
    save(settings = null) {
        try {
            if (settings) {
                this.currentSettings = { ...this.currentSettings, ...settings };
            }
            localStorage.setItem('promptcraft_settings', JSON.stringify(this.currentSettings));
            console.log('💾 Settings saved to localStorage');
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    /**
     * Save specific settings object
     */
    saveSettings(settings) {
        return this.save(settings);
    }

    /**
     * Migrate settings from older versions
     */
    migrateSettings() {
        // Migration for v1 to v2 - key name changes
        if (this.currentSettings.defaultModel && !this.currentSettings.defaultAiModel) {
            this.currentSettings.defaultAiModel = this.currentSettings.defaultModel;
            delete this.currentSettings.defaultModel;
        }
        
        if (this.currentSettings.theme === 'system') {
            this.currentSettings.theme = 'auto';
        }
        
        // Migration for model names
        if (this.currentSettings.defaultAiModel === 'gemini-flash') {
            this.currentSettings.defaultAiModel = 'gemini-3-flash-preview';
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
            version: '4.3',
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
            document.body.classList.toggle('light-theme', !prefersDark);
        } else {
            document.body.classList.toggle('dark-theme', theme === 'dark');
            document.body.classList.toggle('light-theme', theme === 'light');
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
        return [
            { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', provider: 'Google' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
            { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', provider: 'Groq' }
        ];
    }

    /**
     * Get model display name
     */
    getModelDisplayName(modelId) {
        const models = {
            'gemini-3-flash-preview': 'Gemini 3 Flash',
            'gpt-4o-mini': 'GPT-4o Mini',
            'llama-3.1-8b-instant': 'Llama 3.1',
            'gpt-4': 'GPT-4',
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'claude-3-haiku': 'Claude 3 Haiku',
            'claude-3-sonnet': 'Claude 3 Sonnet',
            'gemini-1.5-flash-latest': 'Gemini 1.5 Flash',
            'deepseek-coder': 'DeepSeek Coder',
            'deepseek-chat': 'DeepSeek Chat',
            'fallback': 'Offline Mode'
        };
        return models[modelId] || modelId;
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
        
        // Validate speech settings
        const speechRate = this.get('speechRate');
        const speechPitch = this.get('speechPitch');
        const speechVolume = this.get('speechVolume');
        
        if (typeof speechRate !== 'number' || speechRate < 0.5 || speechRate > 2) {
            errors.push('Speech rate must be between 0.5 and 2');
        }
        
        if (typeof speechPitch !== 'number' || speechPitch < 0.5 || speechPitch > 2) {
            errors.push('Speech pitch must be between 0.5 and 2');
        }
        
        if (typeof speechVolume !== 'number' || speechVolume < 0 || speechVolume > 1) {
            errors.push('Speech volume must be between 0 and 1');
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
        try {
            localStorage.removeItem('promptcraft_settings');
            localStorage.removeItem('promptcraft_history');
            localStorage.removeItem('promptcraft_cache');
            this.currentSettings = { ...this.defaultSettings };
            console.log('🧹 Settings cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear settings:', error);
            return false;
        }
    }

    /**
     * Get storage usage
     */
    getStorageUsage() {
        let total = 0;
        
        try {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += (localStorage.getItem(key).length + key.length) * 2; // UTF-16 uses 2 bytes per char
                }
            }
        } catch (error) {
            console.error('Failed to calculate storage usage:', error);
        }
        
        return {
            bytes: total,
            kilobytes: (total / 1024).toFixed(2),
            megabytes: (total / (1024 * 1024)).toFixed(4),
            readable: total < 1024 ? `${total} bytes` : 
                     total < 1024 * 1024 ? `${(total / 1024).toFixed(2)} KB` : 
                     `${(total / (1024 * 1024)).toFixed(2)} MB`
        };
    }

    /**
     * Test API connection
     */
    async testApiConnection() {
        const endpoint = this.get('apiEndpoint');
        
        try {
            const response = await fetch(`${endpoint}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            return {
                success: response.ok,
                status: response.status,
                online: response.ok
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                online: false
            };
        }
    }

    /**
     * Get system information
     */
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            online: navigator.onLine,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            colorDepth: window.screen.colorDepth,
            localStorageAvailable: typeof localStorage !== 'undefined',
            sessionStorageAvailable: typeof sessionStorage !== 'undefined'
        };
    }
}

export default SettingsManager;
