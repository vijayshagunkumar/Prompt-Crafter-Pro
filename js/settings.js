/**
 * Settings Management for PromptCraft Pro
 * --------------------------------------
 * Enterprise-ready singleton settings manager
 * - Typed defaults
 * - LocalStorage persistence
 * - Validation
 * - UI application hooks
 * - Event-driven updates
 */

class Settings {
    constructor() {
        this.defaultSettings = {
            // API
            apiEndpoint: 'https://promptcraft-api.vijay-shagunkumar.workers.dev',
            apiMode: 'auto', // auto | manual
            defaultAiModel: 'gemini-3-flash-preview',

            // Language
            interfaceLanguage: 'en',
            voiceInputLanguage: 'en-US',
            voiceOutputLanguage: 'en-US',

            // Appearance
            themeSelect: 'auto', // auto | light | dark
            uiDensity: 'comfortable', // compact | comfortable | spacious
            textareaSize: 'auto', // auto | small | medium | large

            // AI Preferences
            defaultPlatform: 'gemini', // gemini | chatgpt | claude | etc
            promptStyle: 'detailed', // brief | detailed | structured

            // Speech
            speechRate: 1,    // 0.5 – 2
            speechPitch: 1,   // 0.5 – 2
            speechVolume: 1,  // 0 – 1

            // Advanced
            autoConvertDelay: 0,        // ms
            notificationDuration: 3000, // ms
            maxHistoryItems: 50,
            autoSave: true,
            debugMode: 'off' // off | on
        };

        this.currentSettings = { ...this.defaultSettings };
        this.loadSettings();
        this.applySettings();
    }

    /* ------------------------------------------------------------------
       Storage
    ------------------------------------------------------------------ */

    loadSettings() {
        try {
            const saved = localStorage.getItem('promptCraftSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.currentSettings = { ...this.defaultSettings, ...parsed };
            }
        } catch (err) {
            console.warn('[Settings] Failed to load settings:', err);
            this.currentSettings = { ...this.defaultSettings };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem(
                'promptCraftSettings',
                JSON.stringify(this.currentSettings)
            );
            this.dispatchEvent('saved', { settings: this.currentSettings });
            return true;
        } catch (err) {
            console.error('[Settings] Failed to save settings:', err);
            return false;
        }
    }

    /* ------------------------------------------------------------------
       Getters / Setters
    ------------------------------------------------------------------ */

    get(key) {
        return key in this.currentSettings
            ? this.currentSettings[key]
            : this.defaultSettings[key];
    }

    set(key, value) {
        if (!(key in this.defaultSettings)) return false;

        this.currentSettings[key] = value;
        return true;
    }

    update(settings = {}) {
        let changed = false;

        Object.keys(settings).forEach(key => {
            if (
                key in this.defaultSettings &&
                this.currentSettings[key] !== settings[key]
            ) {
                this.currentSettings[key] = settings[key];
                changed = true;
            }
        });

        if (changed) {
            this.saveSettings();
            this.applySettings();
        }

        return changed;
    }

    reset() {
        this.currentSettings = { ...this.defaultSettings };
        this.saveSettings();
        this.applySettings();
        return true;
    }

    resetSetting(key) {
        if (!(key in this.defaultSettings)) return false;

        this.currentSettings[key] = this.defaultSettings[key];
        this.saveSettings();
        this.applySettings();
        return true;
    }

    /* ------------------------------------------------------------------
       UI Application
    ------------------------------------------------------------------ */

    applySettings() {
        this.applyTheme();
        this.applyUIDensity();
        this.applyTextareaSize();

        this.dispatchEvent('applied', { settings: this.currentSettings });
    }

    applyTheme() {
        const theme = this.get('themeSelect');
        const html = document.documentElement;

        if (theme === 'auto') {
            const prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches;
            html.dataset.theme = prefersDark ? 'dark' : 'light';
        } else {
            html.dataset.theme = theme;
        }
    }

    applyUIDensity() {
        document.body.dataset.uiDensity = this.get('uiDensity');
    }

    applyTextareaSize() {
        const size = this.get('textareaSize');
        document
            .querySelectorAll('[data-textarea]')
            .forEach(el => el.dataset.size = size);
    }

    /* ------------------------------------------------------------------
       Validation
    ------------------------------------------------------------------ */

    validate() {
        const errors = [];

        if (!this.get('apiEndpoint')?.startsWith('http')) {
            errors.push('API endpoint must be a valid URL');
        }

        const maxHistory = this.get('maxHistoryItems');
        if (!Number.isInteger(maxHistory) || maxHistory < 0 || maxHistory > 1000) {
            errors.push('Max history items must be between 0 and 1000');
        }

        ['speechRate', 'speechPitch'].forEach(key => {
            const val = this.get(key);
            if (val < 0.5 || val > 2) {
                errors.push(`${key} must be between 0.5 and 2`);
            }
        });

        const volume = this.get('speechVolume');
        if (volume < 0 || volume > 1) {
            errors.push('Speech volume must be between 0 and 1');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /* ------------------------------------------------------------------
       Utilities
    ------------------------------------------------------------------ */

    isChanged(key) {
        return key in this.defaultSettings &&
               this.currentSettings[key] !== this.defaultSettings[key];
    }

    getChangedSettings() {
        const diff = {};
        Object.keys(this.defaultSettings).forEach(key => {
            if (this.isChanged(key)) {
                diff[key] = {
                    current: this.currentSettings[key],
                    default: this.defaultSettings[key]
                };
            }
        });
        return diff;
    }

    exportToJSON() {
        return {
            settings: this.currentSettings,
            defaults: this.defaultSettings,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
    }

    importFromJSON(data) {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            if (!parsed.settings) {
                return { success: false, message: 'No settings found' };
            }

            this.update(parsed.settings);
            return {
                success: true,
                imported: Object.keys(parsed.settings).length
            };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    dispatchEvent(name, detail = {}) {
        window.dispatchEvent(
            new CustomEvent(`settings:${name}`, {
                detail: { ...detail, timestamp: Date.now() }
            })
        );
    }
}

/* ------------------------------------------------------------------
   Singleton Export
------------------------------------------------------------------ */


window.Settings = Settings;
window.settings = new Settings();
