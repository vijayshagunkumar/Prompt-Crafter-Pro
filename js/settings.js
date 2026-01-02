/**
 * Settings Management for PromptCraft Pro
 */

class Settings {
    constructor() {
        this.defaultSettings = {
            // API Settings
            apiEndpoint: 'https://promptcraft-api.vijay-shagunkumar.workers.dev',
            apiMode: 'auto',
            defaultAiModel: 'gemini-3-flash-preview',
            
            // Language Settings
            interfaceLanguage: 'en',
            voiceInputLanguage: 'en-US',
            voiceOutputLanguage: 'en-US',
            
            // Appearance
            themeSelect: 'auto',
            uiDensity: 'comfortable',
            
            // AI Preferences
            defaultPlatform: 'gemini',
            promptStyle: 'detailed',
            
            // Speech Settings
            speechRate: 1,
            speechPitch: 1,
            speechVolume: 1,
            
            // Advanced Settings
            autoConvertDelay: '0',
            notificationDuration: '3000',
            textareaSize: 'auto',
            maxHistoryItems: 50,
            debugMode: 'off',
            autoSave: true
        };
        
        this.currentSettings = { ...this.defaultSettings };
        this.loadSettings();
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('promptCraftSettings');
            if (saved) {
                const loadedSettings = JSON.parse(saved);
                this.currentSettings = { ...this.defaultSettings, ...loadedSettings };
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('promptCraftSettings', JSON.stringify(this.currentSettings));
            this.dispatchEvent('settingssaved', { settings: this.currentSettings });
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
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
        if (key in this.defaultSettings) {
            this.currentSettings[key] = value;
            return true;
        }
        return false;
    }
    
    /**
     * Get all current settings
     */
    getAll() {
        return { ...this.currentSettings };
    }
    
    /**
     * Get default settings
     */
    getDefaults() {
        return { ...this.defaultSettings };
    }
    
    /**
     * Update multiple settings
     */
    update(settings) {
        let changed = false;
        
        Object.keys(settings).forEach(key => {
            if (key in this.defaultSettings && this.currentSettings[key] !== settings[key]) {
                this.currentSettings[key] = settings[key];
                changed = true;
            }
        });
        
        if (changed) {
            this.saveSettings();
        }
        
        return changed;
    }
    
    /**
     * Reset to default settings
     */
    reset() {
        this.currentSettings = { ...this.defaultSettings };
        this.saveSettings();
        return true;
    }
    
    /**
     * Reset specific setting to default
     */
    resetSetting(key) {
        if (key in this.defaultSettings) {
            this.currentSettings[key] = this.defaultSettings[key];
            this.saveSettings();
            return true;
        }
        return false;
    }
    
    /**
     * Apply settings to the application
     */
    applySettings() {
        // Apply theme
        this.applyTheme();
        
        // Apply UI density
        this.applyUIDensity();
        
        // Apply textarea size
        this.applyTextareaSize();
        
        // Apply other settings as needed
        this.dispatchEvent('settingsapplied', { settings: this.currentSettings });
    }
    
    /**
     * Apply theme setting
     */
    applyTheme() {
        const theme = this.get('themeSelect');
        const html = document.documentElement;
        
        if (theme === 'auto') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.classList.toggle('dark-theme', prefersDark);
            html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            html.classList.toggle('dark-theme', theme === 'dark');
            html.setAttribute('data-theme', theme);
        }
    }
    
    /**
     * Apply UI density
     */
    applyUIDensity() {
        const density = this.get('uiDensity');
        document.body.setAttribute('data-ui-density', density);
    }
    
    /**
     * Apply textarea size
     */
    applyTextareaSize() {
        const size = this.get('textareaSize');
        const textarea = document.getElementById('userInput');
        if (textarea) {
            textarea.setAttribute('data-size', size);
        }
    }
    
    /**
     * Get settings for a specific category
     */
    getCategorySettings(category) {
        const categories = {
            api: ['apiEndpoint', 'apiMode', 'defaultAiModel'],
            language: ['interfaceLanguage', 'voiceInputLanguage', 'voiceOutputLanguage'],
            appearance: ['themeSelect', 'uiDensity'],
            ai: ['defaultPlatform', 'promptStyle'],
            speech: ['speechRate', 'speechPitch', 'speechVolume'],
            advanced: ['autoConvertDelay', 'notificationDuration', 'textareaSize', 'maxHistoryItems', 'debugMode', 'autoSave']
        };
        
        if (!categories[category]) return {};
        
        const result = {};
        categories[category].forEach(key => {
            result[key] = this.get(key);
        });
        
        return result;
    }
    
    /**
     * Validate settings
     */
    validate() {
        const errors = [];
        
        // Validate API endpoint
        const apiEndpoint = this.get('apiEndpoint');
        if (!apiEndpoint || !apiEndpoint.startsWith('http')) {
            errors.push('API endpoint must be a valid URL');
        }
        
        // Validate max history items
        const maxHistory = this.get('maxHistoryItems');
        if (typeof maxHistory !== 'number' || maxHistory < 0 || maxHistory > 1000) {
            errors.push('Max history items must be between 0 and 1000');
        }
        
        // Validate speech settings
        const speechRate = this.get('speechRate');
        if (speechRate < 0.5 || speechRate > 2) {
            errors.push('Speech rate must be between 0.5 and 2');
        }
        
        const speechPitch = this.get('speechPitch');
        if (speechPitch < 0.5 || speechPitch > 2) {
            errors.push('Speech pitch must be between 0.5 and 2');
        }
        
        const speechVolume = this.get('speechVolume');
        if (speechVolume < 0 || speechVolume > 1) {
            errors.push('Speech volume must be between 0 and 1');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Export settings to JSON
     */
    exportToJSON() {
        return {
            settings: this.currentSettings,
            defaults: this.defaultSettings,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
    }
    
    /**
     * Import settings from JSON
     */
    importFromJSON(json) {
        try {
            const data = typeof json === 'string' ? JSON.parse(json) : json;
            
            if (data.settings) {
                this.update(data.settings);
                return {
                    success: true,
                    message: 'Settings imported successfully',
                    imported: Object.keys(data.settings).length
                };
            }
            
            return {
                success: false,
                message: 'No settings found in import data'
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to import settings: ${error.message}`
            };
        }
    }
    
    /**
     * Get settings as form data
     */
    getFormData() {
        const formData = new FormData();
        Object.keys(this.currentSettings).forEach(key => {
            formData.append(key, this.currentSettings[key]);
        });
        return formData;
    }
    
    /**
     * Check if setting has been changed from default
     */
    isChanged(key) {
        if (!(key in this.defaultSettings)) return false;
        return this.currentSettings[key] !== this.defaultSettings[key];
    }
    
    /**
     * Get changed settings
     */
    getChangedSettings() {
        const changed = {};
        Object.keys(this.defaultSettings).forEach(key => {
            if (this.isChanged(key)) {
                changed[key] = {
                    current: this.currentSettings[key],
                    default: this.defaultSettings[key]
                };
            }
        });
        return changed;
    }
    
    /**
     * Dispatch custom events
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`settings:${eventName}`, { 
            detail: { ...detail, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Get settings for display in UI
     */
    getDisplaySettings() {
        const display = { ...this.currentSettings };
        
        // Format values for display
        if (display.speechRate) {
            display.speechRateDisplay = display.speechRate.toFixed(1);
        }
        
        if (display.speechPitch) {
            display.speechPitchDisplay = display.speechPitch.toFixed(1);
        }
        
        if (display.speechVolume) {
            display.speechVolumeDisplay = display.speechVolume.toFixed(1);
        }
        
        return display;
    }
}

// Create singleton instance
const settings = new Settings();

// Make globally available
window.Settings = Settings;
window.settings = settings;

// Export for module usage
export default Settings;
