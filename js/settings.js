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
