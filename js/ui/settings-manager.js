// settings-manager.js - Settings Management System
import { STORAGE_KEYS } from '../core/constants.js';
import { showNotification, showSuccess, showError, showInfo } from './notifications.js';
import modalManager from './modal-manager.js';
import themeManager from './theme-manager.js';
import appState from '../core/app-state.js';

/**
 * Settings Manager Class
 */
class SettingsManager {
    constructor() {
        this.settings = {
            // Appearance
            theme: 'professional-blue',
            fontSize: 'medium',
            reduceAnimations: false,
            highContrast: false,
            
            // AI Configuration
            openaiApiKey: '',
            useLocalMode: true,
            autoConvert: true,
            autoConvertDelay: 60,
            
            // Language & Voice
            voiceLanguage: 'en-US',
            uiLanguage: 'en',
            translateToEnglish: true,
            
            // Privacy
            saveHistory: true,
            maxHistoryItems: 200,
            exportOnExit: false,
            analytics: false,
            
            // Advanced
            developerMode: false,
            debugLogging: false,
            experimentalFeatures: false
        };
        
        this.modalInitialized = false;
        this.init();
    }
    
    /**
     * Initialize settings manager
     */
    init() {
        this.loadSettings();
        this.createSettingsModal();
        console.log('⚙️ Settings manager initialized');
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.settings);
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
            
            // Load API key separately for security
            const apiKey = localStorage.getItem('OPENAI_API_KEY');
            if (apiKey) {
                this.settings.openaiApiKey = apiKey;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const { openaiApiKey, ...settingsToSave } = this.settings;
            localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settingsToSave));
            
            // Save API key separately
            if (openaiApiKey) {
                localStorage.setItem('OPENAI_API_KEY', openaiApiKey);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }
    
    /**
     * Create settings modal
     */
    createSettingsModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('settingsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div class="modal-backdrop" id="settingsBackdrop" style="display: none;">
                <div class="modal settings-modal" id="settingsModal" style="display: none;">
                    <div class="modal-header">
                        <h3><i class="fas fa-cog"></i> Settings</h3>
                        <button class="modal-close" id="settingsCloseBtn">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="settings-tabs">
                            <div class="tab-header">
                                <button class="tab-button active" data-tab="appearance">
                                    <i class="fas fa-palette"></i> Appearance
                                </button>
                                <button class="tab-button" data-tab="ai">
                                    <i class="fas fa-robot"></i> AI Configuration
                                </button>
                                <button class="tab-button" data-tab="language">
                                    <i class="fas fa-language"></i> Language & Voice
                                </button>
                                <button class="tab-button" data-tab="privacy">
                                    <i class="fas fa-shield-alt"></i> Privacy
                                </button>
                                <button class="tab-button" data-tab="advanced">
                                    <i class="fas fa-tools"></i> Advanced
                                </button>
                            </div>
                            
                            <div class="tab-content active" id="appearanceTab">
                                <div class="setting-group">
                                    <h4><i class="fas fa-paint-brush"></i> Theme</h4>
                                    <div class="theme-preview-grid" id="themePreviewGrid">
                                        <!-- Themes will be injected here -->
                                    </div>
                                </div>
                                
                                <div class="setting-group">
                                    <h4><i class="fas fa-font"></i> Text Size</h4>
                                    <div class="setting-options">
                                        <label class="option-radio">
                                            <input type="radio" name="fontSize" value="small">
                                            <span class="radio-label">Small</span>
                                        </label>
                                        <label class="option-radio">
                                            <input type="radio" name="fontSize" value="medium" checked>
                                            <span class="radio-label">Medium</span>
                                        </label>
                                        <label class="option-radio">
                                            <input type="radio" name="fontSize" value="large">
                                            <span class="radio-label">Large</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="setting-group">
                                    <label class="setting-toggle">
                                        <input type="checkbox" id="reduceAnimations">
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-label">Reduce animations</span>
                                    </label>
                                    
                                    <label class="setting-toggle">
                                        <input type="checkbox" id="highContrast">
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-label">High contrast mode</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="tab-content" id="aiTab">
                                <div class="setting-group">
                                    <h4><i class="fab fa-openai"></i> OpenAI API Key</h4>
                                    <div class="api-key-input">
                                        <input type="password" 
                                               id="openaiApiKey" 
                                               placeholder="sk-..." 
                                               value="${this.settings.openaiApiKey ? '••••••••' : ''}">
                                        <button class="btn-sm" id="toggleApiKey" type="button">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <p class="setting-hint">
                                        <i class="fas fa-info-circle"></i>
                                        Your API key is stored locally and never sent to our servers
                                    </p>
                                </div>
                                
                                <div class="setting-group">
                                    <label class="setting-toggle">
                                        <input type="checkbox" id="useLocalMode" ${this.settings.useLocalMode ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-label">Use local mode (no API required)</span>
                                    </label>
                                    
                                    <label class="setting-toggle">
                                        <input type="checkbox" id="autoConvert" ${this.settings.autoConvert ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-label">Auto-convert as you type</span>
                                    </label>
                                </div>
                                
                                <div class="setting-group">
                                    <h4><i class="fas fa-clock"></i> Auto-convert Delay</h4>
                                    <div class="slider-container">
                                        <input type="range" 
                                               id="autoConvertDelay" 
                                               min="1" 
                                               max="120" 
                                               value="${this.settings.autoConvertDelay}">
                                        <span class="slider-value" id="delayValue">${this.settings.autoConvertDelay}s</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="tab-content" id="languageTab">
                                <div class="setting-group">
                                    <h4><i class="fas fa-microphone"></i> Voice Input Language</h4>
                                    <select id="voiceLanguage" class="setting-select">
                                        <option value="en-US">English (US)</option>
                                        <option value="en-GB">English (UK)</option>
                                        <option value="hi-IN">Hindi (India)</option>
                                        <option value="es-ES">Spanish</option>
                                        <option value="fr-FR">French</option>
                                        <option value="de-DE">German</option>
                                        <option value="ja-JP">Japanese</option>
                                        <option value="ko-KR">Korean</option>
                                    </select>
                                </div>
                                
                                <div class="setting-group">
                                    <h4><i class="fas fa-globe"></i> Interface Language</h4>
                                    <select id="uiLanguage" class="setting-select">
                                        <option value="en">English</option>
                                        <option value="hi">Hindi</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                    </select>
                                </div>
                                
                                <div class="setting-group">
                                    <label class="setting-toggle">
                                        <input type="checkbox" id="translateToEnglish" ${this.settings.translateToEnglish ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-label">Always translate to English</span>
                                    </label>
                                    <p class="setting-hint">
                                        Automatically translate non-English input to English before processing
                                    </p>
                                </div>
                            </div>
                            
                            <div class="tab-content" id="privacyTab">
                                <div class="setting-group">
                                    <label class="setting-toggle">
                                        <input type="checkbox" id="saveHistory" ${this.settings.saveHistory ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-label">Save prompt history</span>
                                    </label>
                                    
                                    <div class="setting-subgroup">
                                        <h4>Maximum history items</h4>
                                        <select id="maxHistoryItems" class="setting-select">
                                            <option value="50">50 items</option>
                                            <option value="100">100 items</option>
                                            <option value="200" selected>200 items</option>
                                            <option value="500">500 items</option>
                                            <option value="1000">1000 items</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="setting-group">
                                    <label class="setting-toggle">
                                        <input type="checkbox" id="exportOnExit" ${this.settings.exportOnExit ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-label">Export data on exit</span>
                                    </label>
                                    
                                    <label class="setting-toggle">
                                        <input type="checkbox" id="analytics" ${this.settings.analytics ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-label">Anonymous usage analytics</span>
                                    </label>
                                </div>
                                
                                <div class="setting-group">
                                    <h4><i class="fas fa-database"></i> Data Management</h4>
                                    <div class="setting-buttons">
                                        <button class="btn-secondary" id="exportSettingsBtn" type="button">
                                            <i class="fas fa-download"></i> Export Settings
                                        </button>
                                        <button class="btn-secondary" id="importSettingsBtn" type="button">
                                            <i class="fas fa-upload"></i> Import Settings
                                        </button>
                                        <button class="btn-danger" id="clearDataBtn" type="button">
                                            <i class="fas fa-trash"></i> Clear All Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="tab-content" id="advancedTab">
                                <div class="setting-group">
                                    <label class="setting-toggle">
                                        <input type="checkbox" id="developerMode" ${this.settings.developerMode ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-label">Developer mode</span>
                                    </label>
                                    <p class="setting-hint">
                                        Shows additional debugging information and tools
                                    </p>
                                </div>
                                
                                <div class="setting-group">
                                    <label class="setting-toggle">
                                        <input type="checkbox" id="debugLogging" ${this.settings.debugLogging ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-label">Debug logging</span>
                                    </label>
                                    
                                    <label class="setting-toggle">
                                        <input type="checkbox" id="experimentalFeatures" ${this.settings.experimentalFeatures ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                        <span class="toggle-label">Experimental features</span>
                                    </label>
                                </div>
                                
                                <div class="setting-group">
                                    <h4><i class="fas fa-code"></i> Keyboard Shortcuts</h4>
                                    <div class="shortcuts-list">
                                        <div class="shortcut-item">
                                            <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                                            <span>Convert prompt</span>
                                        </div>
                                        <div class="shortcut-item">
                                            <kbd>Ctrl</kbd> + <kbd>S</kbd>
                                            <span>Save as template</span>
                                        </div>
                                        <div class="shortcut-item">
                                            <kbd>Ctrl</kbd> + <kbd>C</kbd>
                                            <span>Copy prompt</span>
                                        </div>
                                        <div class="shortcut-item">
                                            <kbd>Esc</kbd>
                                            <span>Close modal/maximize</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="setting-group">
                                    <h4><i class="fas fa-bug"></i> Diagnostics</h4>
                                    <div class="setting-buttons">
                                        <button class="btn-secondary" id="runDiagnosticsBtn" type="button">
                                            <i class="fas fa-stethoscope"></i> Run Diagnostics
                                        </button>
                                        <button class="btn-secondary" id="exportLogsBtn" type="button">
                                            <i class="fas fa-file-export"></i> Export Logs
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-secondary" id="resetSettingsBtn" type="button">
                            <i class="fas fa-undo"></i> Reset to Defaults
                        </button>
                        <button class="btn-primary" id="saveSettingsBtn" type="button">
                            <i class="fas fa-save"></i> Save Settings
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Insert modal HTML
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Initialize the UI components
        setTimeout(() => {
            this.initializeSettingsUI();
            this.modalInitialized = true;
            console.log('⚙️ Settings modal initialized');
        }, 100);
    }
    
    /**
     * Initialize settings UI components
     */
    initializeSettingsUI() {
        try {
            // Load current values
            this.loadCurrentValues();
            
            // Setup tab switching
            this.setupTabs();
            
            // Setup theme previews
            this.setupThemePreviews();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup modal close handlers
            this.setupModalHandlers();
        } catch (error) {
            console.error('Error initializing settings UI:', error);
        }
    }
    
    /**
     * Setup modal close handlers
     */
    setupModalHandlers() {
        const modal = document.getElementById('settingsModal');
        const backdrop = document.getElementById('settingsBackdrop');
        const closeBtn = document.getElementById('settingsCloseBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.closeModal();
                }
            });
        }
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen()) {
                this.closeModal();
            }
        });
    }
    
    /**
     * Check if modal is open
     */
    isModalOpen() {
        const modal = document.getElementById('settingsModal');
        return modal && modal.style.display === 'block';
    }
    
    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('settingsModal');
        const backdrop = document.getElementById('settingsBackdrop');
        
        if (modal) {
            modal.style.display = 'none';
        }
        
        if (backdrop) {
            backdrop.style.display = 'none';
        }
    }
    
    /**
     * Load current values into form
     */
    loadCurrentValues() {
        try {
            // Font size
            const fontSizeInput = document.querySelector(`input[name="fontSize"][value="${this.settings.fontSize}"]`);
            if (fontSizeInput) {
                fontSizeInput.checked = true;
            }
            
            // Checkboxes
            this.setCheckboxValue('reduceAnimations', this.settings.reduceAnimations);
            this.setCheckboxValue('highContrast', this.settings.highContrast);
            this.setCheckboxValue('useLocalMode', this.settings.useLocalMode);
            this.setCheckboxValue('autoConvert', this.settings.autoConvert);
            this.setCheckboxValue('translateToEnglish', this.settings.translateToEnglish);
            this.setCheckboxValue('saveHistory', this.settings.saveHistory);
            this.setCheckboxValue('exportOnExit', this.settings.exportOnExit);
            this.setCheckboxValue('analytics', this.settings.analytics);
            this.setCheckboxValue('developerMode', this.settings.developerMode);
            this.setCheckboxValue('debugLogging', this.settings.debugLogging);
            this.setCheckboxValue('experimentalFeatures', this.settings.experimentalFeatures);
            
            // Selects
            this.setSelectValue('voiceLanguage', this.settings.voiceLanguage);
            this.setSelectValue('uiLanguage', this.settings.uiLanguage);
            this.setSelectValue('maxHistoryItems', this.settings.maxHistoryItems);
            
            // Slider
            const delaySlider = document.getElementById('autoConvertDelay');
            const delayValue = document.getElementById('delayValue');
            if (delaySlider && delayValue) {
                delaySlider.value = this.settings.autoConvertDelay;
                delayValue.textContent = `${this.settings.autoConvertDelay}s`;
            }
        } catch (error) {
            console.error('Error loading current values:', error);
        }
    }
    
    /**
     * Helper: Set checkbox value
     */
    setCheckboxValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.checked = value;
        }
    }
    
    /**
     * Helper: Set select value
     */
    setSelectValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    }
    
    /**
     * Setup tab switching
     */
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // Update active button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active content
                tabContents.forEach(content => content.classList.remove('active'));
                const targetTab = document.getElementById(`${tabId}Tab`);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });
    }
    
    /**
     * Setup theme previews
     */
    setupThemePreviews() {
        const themeGrid = document.getElementById('themePreviewGrid');
        if (!themeGrid) return;
        
        const themes = themeManager.getAllThemes();
        const themeOrder = themeManager.getThemeOrder();
        
        themeGrid.innerHTML = themeOrder.map(themeId => {
            const theme = themes[themeId];
            const isActive = themeManager.getCurrentTheme() === themeId;
            
            return `
                <div class="theme-option ${isActive ? 'active' : ''}" data-theme="${themeId}">
                    <div class="theme-preview" style="background: ${theme.colors.background};">
                        <div class="theme-colors">
                            <span class="color-dot" style="background: ${theme.colors.primary};"></span>
                            <span class="color-dot" style="background: ${theme.colors.secondary};"></span>
                        </div>
                        <div class="theme-icon">
                            <i class="${theme.icon}"></i>
                        </div>
                    </div>
                    <div class="theme-name">${theme.name}</div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        themeGrid.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeId = option.dataset.theme;
                themeManager.setTheme(themeId);
                
                // Update active state
                themeGrid.querySelectorAll('.theme-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
                
                // Update setting
                this.settings.theme = themeId;
            });
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // API key toggle
        const apiKeyInput = document.getElementById('openaiApiKey');
        const toggleApiKeyBtn = document.getElementById('toggleApiKey');
        
        if (toggleApiKeyBtn && apiKeyInput) {
            toggleApiKeyBtn.addEventListener('click', () => {
                const type = apiKeyInput.type === 'password' ? 'text' : 'password';
                apiKeyInput.type = type;
                toggleApiKeyBtn.innerHTML = type === 'password' ? 
                    '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            });
        }
        
        // Delay slider
        const delaySlider = document.getElementById('autoConvertDelay');
        const delayValue = document.getElementById('delayValue');
        
        if (delaySlider && delayValue) {
            delaySlider.addEventListener('input', (e) => {
                delayValue.textContent = `${e.target.value}s`;
            });
        }
        
        // Save settings
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCurrentSettings();
            });
        }
        
        // Reset settings
        const resetBtn = document.getElementById('resetSettingsBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all settings to default?')) {
                    this.resetToDefaults();
                }
            });
        }
        
        // Export settings
        const exportBtn = document.getElementById('exportSettingsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportSettings();
            });
        }
        
        // Import settings
        const importBtn = document.getElementById('importSettingsBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importSettings();
            });
        }
        
        // Clear data
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
        
        // Diagnostics
        const diagnosticsBtn = document.getElementById('runDiagnosticsBtn');
        if (diagnosticsBtn) {
            diagnosticsBtn.addEventListener('click', () => {
                this.runDiagnostics();
            });
        }
        
        // Export logs
        const exportLogsBtn = document.getElementById('exportLogsBtn');
        if (exportLogsBtn) {
            exportLogsBtn.addEventListener('click', () => {
                this.exportLogs();
            });
        }
    }
    
    /**
     * Save current settings from form
     */
    saveCurrentSettings() {
        try {
            // Get values from form
            this.settings.theme = themeManager.getCurrentTheme();
            
            const fontSizeInput = document.querySelector('input[name="fontSize"]:checked');
            this.settings.fontSize = fontSizeInput ? fontSizeInput.value : 'medium';
            
            this.settings.reduceAnimations = document.getElementById('reduceAnimations')?.checked || false;
            this.settings.highContrast = document.getElementById('highContrast')?.checked || false;
            
            // AI settings
            const apiKeyInput = document.getElementById('openaiApiKey');
            if (apiKeyInput && apiKeyInput.value !== '••••••••') {
                this.settings.openaiApiKey = apiKeyInput.value;
            }
            
            this.settings.useLocalMode = document.getElementById('useLocalMode')?.checked || false;
            this.settings.autoConvert = document.getElementById('autoConvert')?.checked || true;
            
            const delaySlider = document.getElementById('autoConvertDelay');
            this.settings.autoConvertDelay = delaySlider ? parseInt(delaySlider.value) : 60;
            
            // Language settings
            this.settings.voiceLanguage = document.getElementById('voiceLanguage')?.value || 'en-US';
            this.settings.uiLanguage = document.getElementById('uiLanguage')?.value || 'en';
            this.settings.translateToEnglish = document.getElementById('translateToEnglish')?.checked || true;
            
            // Privacy settings
            this.settings.saveHistory = document.getElementById('saveHistory')?.checked || true;
            
            const maxHistorySelect = document.getElementById('maxHistoryItems');
            this.settings.maxHistoryItems = maxHistorySelect ? parseInt(maxHistorySelect.value) : 200;
            
            this.settings.exportOnExit = document.getElementById('exportOnExit')?.checked || false;
            this.settings.analytics = document.getElementById('analytics')?.checked || false;
            
            // Advanced settings
            this.settings.developerMode = document.getElementById('developerMode')?.checked || false;
            this.settings.debugLogging = document.getElementById('debugLogging')?.checked || false;
            this.settings.experimentalFeatures = document.getElementById('experimentalFeatures')?.checked || false;
            
            // Save to localStorage
            if (this.saveSettings()) {
                // Update app state
                appState.autoConvertEnabled = this.settings.autoConvert;
                appState.autoConvertDelay = this.settings.autoConvertDelay;
                
                // Apply settings
                this.applySettings();
                
                showSuccess('Settings saved successfully');
                setTimeout(() => {
                    this.closeModal();
                }, 1000);
            } else {
                showError('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showError('Error saving settings');
        }
    }
    
    /**
     * Apply settings to app
     */
    applySettings() {
        // Apply theme
        themeManager.setTheme(this.settings.theme, false);
        
        // Apply font size
        document.documentElement.style.fontSize = 
            this.settings.fontSize === 'small' ? '14px' :
            this.settings.fontSize === 'large' ? '18px' : '16px';
        
        // Apply animations
        if (this.settings.reduceAnimations) {
            document.documentElement.classList.add('reduce-animations');
        } else {
            document.documentElement.classList.remove('reduce-animations');
        }
        
        // Apply high contrast
        if (this.settings.highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
        
        // Dispatch settings changed event
        document.dispatchEvent(new CustomEvent('settings:changed', {
            detail: { settings: this.settings }
        }));
    }
    
    /**
     * Reset to default settings
     */
    resetToDefaults() {
        const defaults = {
            theme: 'professional-blue',
            fontSize: 'medium',
            reduceAnimations: false,
            highContrast: false,
            openaiApiKey: '',
            useLocalMode: true,
            autoConvert: true,
            autoConvertDelay: 60,
            voiceLanguage: 'en-US',
            uiLanguage: 'en',
            translateToEnglish: true,
            saveHistory: true,
            maxHistoryItems: 200,
            exportOnExit: false,
            analytics: false,
            developerMode: false,
            debugLogging: false,
            experimentalFeatures: false
        };
        
        this.settings = { ...defaults };
        this.loadCurrentValues();
        showInfo('Settings reset to defaults');
    }
    
    /**
     * Export settings to file
     */
    exportSettings() {
        const settingsToExport = {
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            settings: this.settings
        };
        
        const blob = new Blob([JSON.stringify(settingsToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `promptcraft-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showSuccess('Settings exported successfully');
    }
    
    /**
     * Import settings from file
     */
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.settings) {
                        this.settings = { ...this.settings, ...data.settings };
                        this.loadCurrentValues();
                        showSuccess('Settings imported successfully');
                    } else {
                        showError('Invalid settings file format');
                    }
                } catch (error) {
                    console.error('Error importing settings:', error);
                    showError('Failed to import settings');
                }
            };
            
            reader.onerror = () => {
                showError('Failed to read settings file');
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    /**
     * Clear all app data
     */
    clearAllData() {
        if (confirm('Are you sure you want to clear ALL app data? This cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
    }
    
    /**
     * Run diagnostics
     */
    runDiagnostics() {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            browser: navigator.userAgent,
            platform: navigator.platform,
            localStorage: !!window.localStorage,
            speechRecognition: !!window.SpeechRecognition || !!window.webkitSpeechRecognition,
            clipboard: !!navigator.clipboard,
            themes: Object.keys(themeManager.getAllThemes()).length,
            settings: Object.keys(this.settings).length,
            appState: {
                usageCount: appState.usageCount,
                templates: appState.templates.length,
                history: appState.historyItems.length
            }
        };
        
        console.log('🔍 Diagnostics:', diagnostics);
        
        // Show results
        const results = `
            <strong>Diagnostics Results:</strong><br>
            • Browser: ${diagnostics.browser.split(' ')[0]}<br>
            • Platform: ${diagnostics.platform}<br>
            • LocalStorage: ${diagnostics.localStorage ? '✅' : '❌'}<br>
            • Voice Input: ${diagnostics.speechRecognition ? '✅' : '❌'}<br>
            • Clipboard API: ${diagnostics.clipboard ? '✅' : '❌'}<br>
            • Themes: ${diagnostics.themes}<br>
            • Prompts Generated: ${diagnostics.appState.usageCount}<br>
            <br>
            <small>Full results in console (F12)</small>
        `;
        
        showNotification(results, 'INFO', 5000);
    }
    
    /**
     * Export logs
     */
    exportLogs() {
        const logs = {
            timestamp: new Date().toISOString(),
            settings: this.settings,
            appState: appState.export(),
            localStorage: {
                keys: Object.keys(localStorage),
                totalSize: JSON.stringify(localStorage).length
            }
        };
        
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `promptcraft-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showSuccess('Logs exported successfully');
    }
    
    /**
     * Get a setting value
     * @param {string} key - Setting key
     * @returns {any} Setting value
     */
    getSetting(key) {
        return this.settings[key];
    }
    
    /**
     * Update a setting value
     * @param {string} key - Setting key
     * @param {any} value - New value
     */
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
    }
    
    /**
     * Open settings modal
     */
    openModal() {
        // If modal doesn't exist or isn't initialized, create it
        if (!document.getElementById('settingsModal') || !this.modalInitialized) {
            this.createSettingsModal();
            
            // Wait for modal to be initialized
            setTimeout(() => {
                this.showModal();
            }, 200);
        } else {
            this.showModal();
        }
    }
    
    /**
     * Show the modal
     */
    showModal() {
        const modal = document.getElementById('settingsModal');
        const backdrop = document.getElementById('settingsBackdrop');
        
        if (modal && backdrop) {
            // Refresh theme previews
            this.setupThemePreviews();
            
            // Load current values
            this.loadCurrentValues();
            
            // Show modal
            backdrop.style.display = 'block';
            modal.style.display = 'block';
            
            // Add animation
            modal.style.animation = 'modalSlideIn 0.3s ease';
            
            console.log('⚙️ Settings modal opened');
        } else {
            console.error('Settings modal elements not found');
        }
    }
}

// Create and export singleton instance
const settingsManager = new SettingsManager();

// Export functions
export function initializeSettings() {
    return settingsManager.init();
}

export function openSettingsModal() {
    return settingsManager.openModal();
}

export function getSetting(key) {
    return settingsManager.getSetting(key);
}

export function updateSetting(key, value) {
    return settingsManager.updateSetting(key, value);
}

export function saveSettings() {
    return settingsManager.saveSettings();
}

// Default export
export default settingsManager;
