// settings-service.js - Settings management service
export class SettingsService {
    constructor() {
        this.defaultSettings = {
            theme: 'dark',
            voiceLanguage: 'en-US',
            autoConvert: true,
            autoConvertDelay: 5000,
            promptStyle: 'detailed',
            maxHistoryItems: 25,
            notificationDuration: 3000,
            uiDensity: 'comfortable'
        };
    }

    load() {
        try {
            const saved = localStorage.getItem('promptCraftSettings');
            if (saved) {
                return { ...this.defaultSettings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
        return this.defaultSettings;
    }

    save(settings) {
        try {
            localStorage.setItem('promptCraftSettings', JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
        }
    }

    reset() {
        try {
            localStorage.removeItem('promptCraftSettings');
            return this.defaultSettings;
        } catch (e) {
            console.error('Failed to reset settings:', e);
            return this.defaultSettings;
        }
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

    importSettings(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate imported data
                    if (!data.settings) {
                        throw new Error('Invalid settings file format');
                    }

                    // Merge with defaults
                    const importedSettings = { ...this.defaultSettings, ...data.settings };
                    
                    // Save imported settings
                    this.save(importedSettings);
                    resolve(importedSettings);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    validateSettings(settings) {
        const validSettings = { ...this.defaultSettings };
        
        // Only copy valid properties
        Object.keys(settings).forEach(key => {
            if (key in this.defaultSettings) {
                validSettings[key] = settings[key];
            }
        });

        return validSettings;
    }

    getSettingsSchema() {
        return {
            theme: {
                type: 'select',
                options: ['dark', 'light', 'cyberpunk', 'sunset', 'aurora'],
                label: 'Theme',
                description: 'Application visual theme'
            },
            voiceLanguage: {
                type: 'select',
                options: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR'],
                label: 'Voice Language',
                description: 'Language for voice input/output'
            },
            autoConvert: {
                type: 'boolean',
                label: 'Auto-Convert',
                description: 'Automatically generate prompts'
            },
            autoConvertDelay: {
                type: 'number',
                min: 0,
                max: 30000,
                step: 1000,
                label: 'Auto-Convert Delay',
                description: 'Delay before auto-conversion (ms)'
            },
            promptStyle: {
                type: 'select',
                options: ['detailed', 'concise', 'creative', 'professional'],
                label: 'Prompt Style',
                description: 'Default prompt generation style'
            },
            maxHistoryItems: {
                type: 'number',
                min: 0,
                max: 100,
                step: 5,
                label: 'Max History Items',
                description: 'Maximum prompts to save in history'
            },
            notificationDuration: {
                type: 'number',
                min: 0,
                max: 10000,
                step: 500,
                label: 'Notification Duration',
                description: 'How long notifications display (ms)'
            },
            uiDensity: {
                type: 'select',
                options: ['comfortable', 'compact', 'spacious'],
                label: 'UI Density',
                description: 'Spacing and sizing of UI elements'
            }
        };
    }

    migrateSettings() {
        const saved = localStorage.getItem('promptCraftSettings');
        if (!saved) return this.defaultSettings;

        try {
            const oldSettings = JSON.parse(saved);
            const migratedSettings = { ...this.defaultSettings, ...oldSettings };
            
            // Remove any deprecated settings
            const validKeys = Object.keys(this.defaultSettings);
            Object.keys(migratedSettings).forEach(key => {
                if (!validKeys.includes(key)) {
                    delete migratedSettings[key];
                }
            });

            this.save(migratedSettings);
            return migratedSettings;
        } catch (e) {
            console.error('Failed to migrate settings:', e);
            return this.defaultSettings;
        }
    }
}
