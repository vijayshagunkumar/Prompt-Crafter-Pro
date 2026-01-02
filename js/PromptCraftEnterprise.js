console.log('📦 Loading PromptCraftEnterprise...');

// Check if all dependencies are available
function checkDependencies() {
    const deps = ['Utils', 'Settings', 'SpeechService', 'Platforms'];
    const missing = [];
    
    for (const dep of deps) {
        if (typeof window[dep] === 'undefined') {
            missing.push(dep);
        }
    }
    
    if (missing.length > 0) {
        console.error('❌ Missing dependencies:', missing);
        console.log('Available window objects:', Object.keys(window).filter(k => /^[A-Z]/.test(k)));
        return false;
    }
    
    console.log('✅ All dependencies loaded');
    return true;
}

// Run check before defining class
if (!checkDependencies()) {
    console.error('Cannot load PromptCraftEnterprise - missing dependencies');
} else {
    class PromptCraftEnterprise {
        constructor() {
            console.log('🔍 Initializing PromptCraftEnterprise...');
            
            // Add safety checks
            if (typeof Utils === 'undefined') {
                throw new Error('Utils not loaded');
            }
            if (typeof Settings === 'undefined') {
                throw new Error('Settings not loaded');
            }
            if (typeof SpeechService === 'undefined') {
                throw new Error('SpeechService not loaded');
            }
            if (typeof Platforms === 'undefined') {
                throw new Error('Platforms not loaded');
            }
            if (typeof API === 'undefined' && typeof apiService === 'undefined') {
                console.warn('API service not loaded, using fallback');
            }
            
            this.utils = new Utils();
            this.settingsManager = new Settings();
            this.speechManager = new SpeechService();
            this.platformsManager = new Platforms();
            
            // Handle API or apiService
            if (typeof API !== 'undefined') {
                this.api = new API();
            } else if (typeof apiService !== 'undefined') {
                this.api = apiService;
            } else {
                console.warn('No API service found, using fallback');
                this.api = { 
                    testConnection: () => Promise.resolve({ online: false }),
                    generatePrompt: () => Promise.resolve({ 
                        success: true, 
                        content: 'Fallback prompt (API not available)',
                        model: 'fallback'
                    }),
                    getModelDisplayName: (model) => model,
                    generateFallbackPrompt: (input, style) => `Fallback prompt for: ${input}`
                };
            }
            
            this.state = {
                currentStep: 1,
                isEditorOpen: false,
                currentEditor: null,
                selectedPlatform: null,
                originalPrompt: null,
                promptModified: false,
                hasGeneratedPrompt: false,
                inspirationPanelOpen: false,
                promptHistory: [],
                suggestions: [],
                undoStack: [],
                redoStack: [],
                apiStatus: 'checking',
                useFallback: false,
                currentModel: 'gemini-3-flash-preview',
                generationStats: {
                    totalRequests: 0,
                    successfulRequests: 0,
                    failedRequests: 0,
                    averageResponseTime: 0
                },
                isMaximized: false,
                maximizedSection: null,
                isRecording: false,
                recognition: null,
                originalInputContent: '',
                originalOutputContent: '',
                originalMaximizeButtons: {},
                settingsChanged: false,
                lastInput: ''
            };
            
            this.settings = this.settingsManager.load();
            this.init();
        }

        // Bind all UI elements
        bindElements() {
            console.log('🔗 Binding UI elements...');
            
            this.elements = {
                userInput: document.getElementById('userInput'),
                micBtn: document.getElementById('micBtn'),
                undoBtn: document.getElementById('undoBtn'),
                maximizeInputBtn: document.getElementById('maximizeInputBtn'),
                clearBtn: document.getElementById('clearBtn'),
                charCounter: document.getElementById('charCounter'),
                needInspirationBtn: document.getElementById('needInspirationBtn'),
                closeInspirationBtn: document.getElementById('closeInspirationBtn'),
                inspirationPanel: document.getElementById('inspirationPanel'),
                outputSection: document.getElementById('outputSection'),
                outputArea: document.getElementById('outputArea'),
                outputCard: document.getElementById('outputCard'),
                speakBtn: document.getElementById('speakBtn'),
                copyBtn: document.getElementById('copyBtn'),
                exportBtn: document.getElementById('exportBtn'),
                maximizeOutputBtn: document.getElementById('maximizeOutputBtn'),
                savePromptBtn: document.getElementById('savePromptBtn'),
                suggestionsPanel: document.getElementById('suggestionsPanel'),
                suggestionsList: document.getElementById('suggestionsList'),
                platformsGrid: document.getElementById('platformsGrid'),
                platformsEmptyState: document.getElementById('platformsEmptyState'),
                historySection: document.getElementById('historySection'),
                historyList: document.getElementById('historyList'),
                historyBtn: document.getElementById('historyBtn'),
                closeHistoryBtn: document.getElementById('closeHistoryBtn'),
                settingsBtn: document.getElementById('settingsBtn'),
                settingsModal: document.getElementById('settingsModal'),
                closeSettingsBtn: document.getElementById('closeSettingsBtn'),
                cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
                saveSettingsBtn: document.getElementById('saveSettingsBtn'),
                fullScreenEditor: document.getElementById('fullScreenEditor'),
                editorTextarea: document.getElementById('editorTextarea'),
                editorMicBtn: document.getElementById('editorMicBtn'),
                editorUndoBtn: document.getElementById('editorUndoBtn'),
                closeEditorBtn: document.getElementById('closeEditorBtn'),
                editorPrepareBtn: document.getElementById('editorPrepareBtn'),
                editorTitle: document.getElementById('editorTitle'),
                apiStatusIndicator: document.getElementById('apiStatusIndicator'),
                headerApiStatus: document.getElementById('headerApiStatus'),
                apiInfoPanel: document.getElementById('apiInfoPanel'),
                apiStatusMessage: document.getElementById('apiStatusMessage'),
                apiDetails: document.getElementById('apiDetails'),
                stickyPrepareBtn: document.getElementById('stickyPrepareBtn'),
                stickyResetBtn: document.getElementById('stickyResetBtn'),
                generationInfo: document.getElementById('generationInfo'),
                generatedModel: document.getElementById('generatedModel'),
                generationTime: document.getElementById('generationTime'),
                tokenCount: document.getElementById('tokenCount'),
                generationMode: document.getElementById('generationMode'),
                currentModel: document.getElementById('currentModel'),
                currentTheme: document.getElementById('currentTheme'),
                currentLanguage: document.getElementById('currentLanguage'),
                statusText: document.getElementById('statusText'),
                rateLimitDisplay: document.getElementById('rateLimitDisplay'),
                rateLimitText: document.getElementById('rateLimitText')
            };
            
            const criticalElements = ['userInput', 'outputArea', 'stickyPrepareBtn'];
            for (const elementId of criticalElements) {
                if (!this.elements[elementId]) {
                    console.warn(`⚠️ Critical element not found: ${elementId}`);
                }
            }
            
            console.log(`✅ Bound ${Object.keys(this.elements).length} UI elements`);
            return this.elements;
        }

        async init() {
            this.bindElements();
            this.bindEvents();
            this.applyTheme();
            this.applyUIDensity();
            this.updateProgress();
            this.setupKeyboardShortcuts();
            this.loadHistory();
            this.updateFooterInfo();
            
            await this.checkAPIStatus();
            this.updateCurrentModel();
            this.updateButtonStates();
            this.initVoiceRecognition();
            this.storeOriginalMaximizeButtons();
        }

        storeOriginalMaximizeButtons() {
            if (this.elements.maximizeInputBtn) {
                this.state.originalMaximizeButtons.maximizeInputBtn = this.elements.maximizeInputBtn.innerHTML;
            }
            if (this.elements.maximizeOutputBtn) {
                this.state.originalMaximizeButtons.maximizeOutputBtn = this.elements.maximizeOutputBtn.innerHTML;
            }
        }

        bindEvents() {
            console.log('🔗 Setting up event listeners...');
            
            if (this.elements.stickyPrepareBtn) {
                this.elements.stickyPrepareBtn.addEventListener('click', () => this.preparePrompt());
            }
            
            if (this.elements.stickyResetBtn) {
                this.elements.stickyResetBtn.addEventListener('click', () => this.resetApp());
            }
            
            if (this.elements.copyBtn) {
                this.elements.copyBtn.addEventListener('click', () => this.copyPrompt());
            }
            
            if (this.elements.exportBtn) {
                this.elements.exportBtn.addEventListener('click', () => this.exportPrompt());
            }
            
            if (this.elements.settingsBtn) {
                this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
            }
            
            if (this.elements.saveSettingsBtn) {
                this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
            }
            
            if (this.elements.closeSettingsBtn) {
                this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
            }
            
            if (this.elements.cancelSettingsBtn) {
                this.elements.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
            }
            
            if (this.elements.maximizeInputBtn) {
                this.elements.maximizeInputBtn.addEventListener('click', () => this.maximizeSection('input'));
            }
            
            if (this.elements.maximizeOutputBtn) {
                this.elements.maximizeOutputBtn.addEventListener('click', () => this.maximizeSection('output'));
            }
            
            if (this.elements.clearBtn) {
                this.elements.clearBtn.addEventListener('click', () => this.clearInput());
            }
            
            if (this.elements.needInspirationBtn) {
                const icon = this.elements.needInspirationBtn.querySelector('i');
                const tooltip = this.elements.needInspirationBtn.querySelector('.action-btn-tooltip');
                if (icon && !tooltip) {
                    this.elements.needInspirationBtn.innerHTML = '<i class="fas fa-lightbulb"></i><span class="action-btn-tooltip">Need Inspiration?</span>';
                }
                this.elements.needInspirationBtn.addEventListener('click', () => this.toggleInspirationPanel());
            }
            
            if (this.elements.closeInspirationBtn) {
                this.elements.closeInspirationBtn.addEventListener('click', () => this.closeInspirationPanel());
            }
            
            if (this.elements.undoBtn) {
                this.elements.undoBtn.addEventListener('click', () => this.undo());
            }
            
            if (this.elements.editorUndoBtn) {
                this.elements.editorUndoBtn.addEventListener('click', () => this.undo());
            }
            
            if (this.elements.micBtn) {
                this.elements.micBtn.addEventListener('click', () => this.toggleVoiceInput());
            }
            
            if (this.elements.speakBtn) {
                this.elements.speakBtn.addEventListener('click', () => this.toggleVoiceOutput());
            }
            
            if (this.elements.closeEditorBtn) {
                this.elements.closeEditorBtn.addEventListener('click', () => this.closeEditor());
            }
            
            if (this.elements.editorPrepareBtn) {
                this.elements.editorPrepareBtn.addEventListener('click', () => {
                    if (this.state.maximizedSection === 'input') {
                        this.elements.userInput.value = this.elements.editorTextarea.value;
                        this.closeEditor();
                        this.preparePrompt();
                    }
                });
            }
            
            if (this.elements.savePromptBtn) {
                this.elements.savePromptBtn.addEventListener('click', () => this.savePrompt());
            }
            
            if (this.elements.userInput) {
                this.elements.userInput.addEventListener('input', () => this.handleInputChange());
                this.elements.userInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
            }
            
            if (this.elements.editorTextarea) {
                this.elements.editorTextarea.addEventListener('input', () => this.handleEditorInputChange());
            }
            
            this.bindSettingsEvents();
            
            if (this.elements.platformsGrid) {
                this.elements.platformsGrid.addEventListener('click', (e) => {
                    const platformCard = e.target.closest('.platform-card');
                    if (platformCard) {
                        const platformId = platformCard.dataset.platform;
                        this.handlePlatformClick(platformId);
                    }
                });
            }
            
            console.log('✅ Event listeners set up');
        }
        
        bindSettingsEvents() {
            const settingsInputs = [
                'theme', 'interfaceLanguage', 'uiDensity', 'defaultModel', 
                'promptStyle', 'maxHistoryItems', 'speechRate', 'speechPitch', 
                'speechVolume', 'autoConvertDelay', 'notificationDuration',
                'textareaSize', 'debugMode', 'autoSave'
            ];
            
            settingsInputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('change', () => {
                        this.state.settingsChanged = true;
                        this.enableSaveSettingsButton();
                    });
                }
            });
        }
        
        applyTheme() {
            const theme = this.settings.theme || 'dark';
            document.body.classList.remove('light-theme', 'dark-theme', 'auto-theme');
            document.body.classList.add(theme === 'auto' ? 'dark-theme' : `${theme}-theme`);
        }

        applyUIDensity() {
            const density = this.settings.uiDensity || 'comfortable';
            document.body.setAttribute('data-ui-density', density);
        }

        updateProgress() {
            const progressFill = document.getElementById('progressFill');
            if (!progressFill) return;
            
            const progress = (this.state.currentStep / 3) * 100;
            progressFill.style.width = `${progress}%`;
        }

        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.preparePrompt();
                }
                
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.savePrompt();
                }
                
                if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                }
                
                if (e.key === 'Escape') {
                    if (this.state.isMaximized) {
                        this.closeEditor();
                    }
                    if (this.elements.settingsModal && this.elements.settingsModal.style.display === 'block') {
                        this.closeSettings();
                    }
                    if (this.elements.inspirationPanel && this.elements.inspirationPanel.style.display === 'block') {
                        this.closeInspirationPanel();
                    }
                }
            });
        }

        loadHistory() {
            try {
                const savedHistory = localStorage.getItem('promptcraft_history');
                if (savedHistory) {
                    this.state.promptHistory = JSON.parse(savedHistory);
                    console.log(`📚 Loaded ${this.state.promptHistory.length} history items`);
                }
            } catch (error) {
                console.warn('Failed to load history:', error);
                this.state.promptHistory = [];
            }
        }

        updateFooterInfo() {
            if (this.elements.currentModel) {
                this.elements.currentModel.textContent = this.state.currentModel;
            }
            
            if (this.elements.currentTheme) {
                const theme = this.settings.theme || 'dark';
                this.elements.currentTheme.textContent = theme === 'auto' ? 'Auto' : theme.charAt(0).toUpperCase() + theme.slice(1);
            }
            
            if (this.elements.currentLanguage) {
                const lang = this.settings.interfaceLanguage || 'en';
                this.elements.currentLanguage.textContent = this.getLanguageName(lang);
            }
        }

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
            return languages[code] || 'English';
        }

        async checkAPIStatus() {
            try {
                this.showNotification('Checking API connection...', 'info');
                
                const status = await this.api.testConnection();
                
                this.state.apiStatus = status.online ? 'online' : 'offline';
                this.state.useFallback = !status.online;
                
                this.updateAPIStatusIndicator();
                
                if (status.online) {
                    console.log('API Status:', status);
                    this.showNotification(`API connected: ${status.models.length} models available`, 'success');
                    this.updateAvailableModels(status.models);
                } else {
                    console.warn('API offline, using fallback mode');
                    this.showNotification('API unavailable, using offline mode', 'warning');
                }
                
            } catch (error) {
                console.error('API status check failed:', error);
                this.state.apiStatus = 'offline';
                this.state.useFallback = true;
                this.updateAPIStatusIndicator();
            }
        }

        updateAPIStatusIndicator() {
            const statusIndicator = document.getElementById('apiStatusIndicator');
            const statusText = document.getElementById('statusText');
            const headerApiStatus = document.getElementById('headerApiStatus');
            
            if (statusIndicator && statusText) {
                const statusConfig = {
                    checking: { 
                        class: 'checking', 
                        text: 'Checking...',
                        color: '#f59e0b'
                    },
                    online: { 
                        class: 'online', 
                        text: 'Online',
                        color: '#10b981'
                    },
                    offline: { 
                        class: 'offline', 
                        text: 'Offline',
                        color: '#ef4444'
                    }
                };
                
                const config = statusConfig[this.state.apiStatus] || statusConfig.checking;
                
                statusIndicator.className = `status-indicator ${config.class}`;
                statusIndicator.style.backgroundColor = config.color;
                statusText.textContent = config.text;
            }
            
            if (headerApiStatus) {
                const statusIndicator = headerApiStatus.querySelector('.status-indicator');
                const statusText = headerApiStatus.querySelector('.api-status-text');
                
                if (statusIndicator && statusText) {
                    const config = {
                        checking: { class: 'checking', text: 'Checking API...', color: '#f59e0b' },
                        online: { class: 'online', text: 'API Online', color: '#10b981' },
                        offline: { class: 'offline', text: 'API Offline', color: '#ef4444' }
                    };
                    
                    const currentConfig = config[this.state.apiStatus] || config.checking;
                    
                    statusIndicator.className = `status-indicator ${currentConfig.class}`;
                    statusIndicator.style.backgroundColor = currentConfig.color;
                    statusText.textContent = currentConfig.text;
                    headerApiStatus.className = `api-status-indicator ${currentConfig.class}`;
                }
            }
        }

        updateAvailableModels(availableModels) {
            const modelSelect = document.getElementById('defaultAiModel');
            if (!modelSelect) return;
            
            modelSelect.innerHTML = '';
            
            availableModels.forEach(modelId => {
                const displayName = this.api.getModelDisplayName ? this.api.getModelDisplayName(modelId) : modelId;
                const option = document.createElement('option');
                option.value = modelId;
                option.textContent = displayName;
                
                if (modelId === 'gemini-3-flash-preview') {
                    option.selected = true;
                    this.state.currentModel = modelId;
                }
                
                modelSelect.appendChild(option);
            });
        }

        updateCurrentModel() {
            const modelSelect = document.getElementById('defaultAiModel');
            if (modelSelect) {
                this.state.currentModel = modelSelect.value;
            }
        }

        async preparePrompt() {
            const inputText = this.elements.userInput.value.trim();
            
            if (!inputText) {
                this.showNotification('Please describe your task first', 'error');
                return;
            }
            
            if (inputText.length < 10) {
                this.showNotification('Please provide more details for better results', 'warning');
                return;
            }
            
            this.state.generationStats.totalRequests++;
            this.showLoading(true);
            this.showNotification('Crafting your perfect prompt...', 'info');
            
            const startTime = Date.now();
            
            try {
                let result;
                const modelToUse = this.getModelForGeneration();
                
                if (this.state.apiStatus === 'online' && !this.state.useFallback) {
                    result = await this.api.generatePrompt(inputText, {
                        model: modelToUse,
                        style: this.settings.promptStyle || 'detailed',
                        temperature: 0.4,
                        max_tokens: 700
                    });
                    
                    if (result.success) {
                        this.state.generationStats.successfulRequests++;
                    } else {
                        this.state.generationStats.failedRequests++;
                        throw new Error(result.error || 'API request failed');
                    }
                    
                } else {
                    result = {
                        success: true,
                        content: this.api.generateFallbackPrompt ? 
                            this.api.generateFallbackPrompt(inputText, this.settings.promptStyle || 'detailed') :
                            `Optimized prompt for: ${inputText}\n\nInstructions:\n1. ${inputText}\n2. Provide detailed steps\n3. Include examples if applicable`,
                        model: 'fallback',
                        provider: 'local',
                        fallbackUsed: true
                    };
                    this.state.generationStats.failedRequests++;
                }
                
                const responseTime = Date.now() - startTime;
                this.updateAverageResponseTime(responseTime);
                
                this.elements.outputArea.style.cssText = `
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    max-height: none;
                    min-height: 300px;
                    overflow-y: auto;
                    padding: 20px;
                    font-size: 16px;
                    line-height: 1.6;
                `;
                
                this.elements.outputArea.textContent = result.content;
                this.state.originalPrompt = result.content;
                this.state.promptModified = false;
                this.state.hasGeneratedPrompt = true;
                this.elements.outputSection.style.display = 'grid';
                this.updatePlatformCards();
                this.state.currentStep = 2;
                this.updateProgress();
                this.updateButtonStates();
                this.generateSuggestions();
                
                this.saveToHistory(inputText, result.content, {
                    model: result.model,
                    provider: result.provider,
                    responseTime: responseTime,
                    fallback: result.fallbackUsed || false
                });
                
                let successMessage = `Prompt generated using ${this.api.getModelDisplayName ? this.api.getModelDisplayName(result.model) : result.model}`;
                
                if (result.fallbackUsed) {
                    successMessage += ' (offline mode)';
                    this.showNotification(successMessage, 'warning');
                } else {
                    successMessage += ` (${responseTime}ms)`;
                    this.showNotification(successMessage, 'success');
                }
                
                setTimeout(() => {
                    this.elements.outputSection.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }, 300);
                
            } catch (error) {
                console.error('Prompt generation error:', error);
                this.state.generationStats.failedRequests++;
                
                try {
                    const fallbackPrompt = this.api.generateFallbackPrompt ? 
                        this.api.generateFallbackPrompt(inputText, this.settings.promptStyle || 'detailed') :
                        `Optimized prompt for: ${inputText}\n\nInstructions:\n1. ${inputText}\n2. Provide detailed steps\n3. Include examples if applicable`;
                    
                    this.elements.outputArea.textContent = fallbackPrompt;
                    this.state.originalPrompt = fallbackPrompt;
                    this.state.hasGeneratedPrompt = true;
                    this.elements.outputSection.style.display = 'grid';
                    this.updatePlatformCards();
                    this.updateButtonStates();
                    
                    this.showNotification('Generated offline (API unavailable)', 'warning');
                } catch (fallbackError) {
                    this.showNotification('Failed to generate prompt', 'error');
                }
            } finally {
                this.showLoading(false);
            }
        }

        getModelForGeneration() {
            const modelMap = {
                'gemini-3-flash-preview': 'gemini-3-flash-preview',
                'gpt-4o-mini': 'gpt-4o-mini',
                'llama-3.1-8b-instant': 'llama-3.1-8b-instant'
            };
            
            return modelMap[this.state.currentModel] || 'gemini-3-flash-preview';
        }

        updateAverageResponseTime(newTime) {
            const { averageResponseTime, successfulRequests } = this.state.generationStats;
            
            if (successfulRequests === 1) {
                this.state.generationStats.averageResponseTime = newTime;
            } else {
                this.state.generationStats.averageResponseTime = 
                    (averageResponseTime * (successfulRequests - 1) + newTime) / successfulRequests;
            }
        }

        saveToHistory(input, output, metadata = {}) {
            const maxItems = this.settings.maxHistoryItems || 50;
            if (maxItems <= 0) return;
            
            const historyItem = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
                output: output.substring(0, 200) + (output.length > 200 ? '...' : ''),
                fullInput: input,
                fullOutput: output,
                metadata: {
                    model: metadata.model || 'unknown',
                    provider: metadata.provider || 'unknown',
                    responseTime: metadata.responseTime || 0,
                    fallback: metadata.fallback || false,
                    apiStatus: this.state.apiStatus,
                    ...metadata
                }
            };
            
            this.state.promptHistory.unshift(historyItem);
            
            if (this.state.promptHistory.length > maxItems) {
                this.state.promptHistory = this.state.promptHistory.slice(0, maxItems);
            }
            
            this.saveHistoryToStorage();
        }

        saveHistoryToStorage() {
            try {
                localStorage.setItem('promptcraft_history', JSON.stringify(this.state.promptHistory));
            } catch (error) {
                console.warn('Failed to save history:', error);
            }
        }

        updatePlatformCards() {
            if (!this.elements.platformsGrid) return;
            
            this.elements.platformsGrid.innerHTML = '';
            
            if (this.state.hasGeneratedPrompt) {
                const platforms = this.platformsManager.getAllPlatforms();
                platforms.forEach(platform => {
                    const platformCard = this.createPlatformCard(platform);
                    this.elements.platformsGrid.appendChild(platformCard);
                });
            } else {
                this.elements.platformsEmptyState.style.display = 'block';
                this.elements.platformsGrid.appendChild(this.elements.platformsEmptyState.cloneNode(true));
            }
        }

        createPlatformCard(platform) {
            const card = document.createElement('div');
            card.className = 'platform-card';
            card.dataset.platform = platform.id;
            card.innerHTML = `
                <div class="platform-icon">
                    <i class="${platform.icon}"></i>
                </div>
                <div class="platform-info">
                    <h4 class="platform-name">${platform.name}</h4>
                    <p class="platform-desc">${platform.description}</p>
                </div>
                <div class="platform-actions">
                    <button class="platform-action-btn" data-action="copy" title="Copy prompt for ${platform.name}">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="platform-action-btn" data-action="open" title="Open ${platform.name}">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
            `;
            
            const copyBtn = card.querySelector('[data-action="copy"]');
            const openBtn = card.querySelector('[data-action="open"]');
            
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyPromptForPlatform(platform);
            });
            
            openBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openPlatform(platform);
            });
            
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.platform-action-btn')) {
                    this.handlePlatformClick(platform);
                }
            });
            
            return card;
        }

        copyPromptForPlatform(platform) {
            const prompt = this.elements.outputArea.textContent;
            if (!prompt) return;
            
            const formattedPrompt = this.formatPromptForPlatform(prompt, platform);
            
            navigator.clipboard.writeText(formattedPrompt).then(() => {
                this.showNotification(`Prompt copied for ${platform.name}`, 'success');
            }).catch(err => {
                console.error('Copy failed:', err);
                this.showNotification('Failed to copy to clipboard', 'error');
            });
        }

        openPlatform(platform) {
            if (platform.launchUrl) {
                window.open(platform.launchUrl, '_blank');
                this.showNotification(`Opening ${platform.name}...`, 'info');
            } else {
                this.showNotification(`No URL configured for ${platform.name}`, 'warning');
            }
        }

        handlePlatformClick(platform) {
            const prompt = this.elements.outputArea.textContent;
            if (!prompt) return;
            
            navigator.clipboard.writeText(prompt).then(() => {
                this.showNotification(`Prompt copied! Opening ${platform.name}...`, 'success');
                if (platform.launchUrl) {
                    window.open(platform.launchUrl, '_blank');
                }
            }).catch(err => {
                console.error('Copy failed:', err);
                this.showNotification('Failed to copy prompt', 'error');
            });
        }

        formatPromptForPlatform(prompt, platform) {
            switch (platform.id) {
                case 'chatgpt':
                    return prompt + "\n\n[ChatGPT Mode: Be conversational and helpful]";
                case 'claude':
                    return prompt + "\n\n[Claude Mode: Be detailed and thorough]";
                case 'gemini':
                    return prompt + "\n\n[Gemini Mode: Be creative and expansive]";
                case 'perplexity':
                    return prompt + "\n\n[Search Mode: Include sources and citations]";
                default:
                    return prompt;
            }
        }

        generateSuggestions() {
            if (!this.elements.suggestionsList) return;
            
            this.elements.suggestionsList.innerHTML = '';
            
            const prompt = this.elements.outputArea.textContent;
            if (!prompt) return;
            
            const suggestions = [
                { text: 'Make it more concise', action: 'concise' },
                { text: 'Add more technical details', action: 'technical' },
                { text: 'Make it more conversational', action: 'conversational' },
                { text: 'Add examples', action: 'examples' },
                { text: 'Make it more formal', action: 'formal' },
                { text: 'Shorten the prompt', action: 'shorten' }
            ];
            
            suggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.className = 'suggestion-item';
                li.innerHTML = `
                    <span>${suggestion.text}</span>
                    <button class="suggestion-apply-btn" data-action="${suggestion.action}">Apply</button>
                `;
                
                li.querySelector('.suggestion-apply-btn').addEventListener('click', () => {
                    this.applySuggestion(suggestion.action);
                });
                
                this.elements.suggestionsList.appendChild(li);
            });
            
            this.elements.suggestionsPanel.style.display = 'block';
        }

        applySuggestion(action) {
            const currentPrompt = this.elements.outputArea.textContent;
            let modifiedPrompt = currentPrompt;
            
            switch (action) {
                case 'concise':
                    modifiedPrompt = currentPrompt.replace(/\s+/g, ' ').trim();
                    modifiedPrompt = modifiedPrompt.replace(/\s+\./g, '.');
                    break;
                case 'technical':
                    modifiedPrompt = currentPrompt + "\n\n[Include specific technical details and requirements]";
                    break;
                case 'conversational':
                    modifiedPrompt = currentPrompt.replace(/\./g, '...').replace(/Please/g, 'Could you please');
                    break;
                case 'examples':
                    modifiedPrompt = currentPrompt + "\n\n[Add 2-3 concrete examples]";
                    break;
                case 'formal':
                    modifiedPrompt = currentPrompt.replace(/can you/gi, 'could you').replace(/please/gi, 'kindly');
                    break;
                case 'shorten':
                    const sentences = currentPrompt.split(/[.!?]+/);
                    if (sentences.length > 3) {
                        modifiedPrompt = sentences.slice(0, 3).join('. ') + '.';
                    }
                    break;
            }
            
            this.elements.outputArea.textContent = modifiedPrompt;
            this.state.promptModified = true;
            this.showNotification('Suggestion applied', 'success');
            
            this.state.undoStack.push(currentPrompt);
            this.state.redoStack = [];
            this.updateButtonStates();
        }

        copyPrompt() {
            const prompt = this.elements.outputArea.textContent;
            if (!prompt) {
                this.showNotification('No prompt to copy', 'warning');
                return;
            }
            
            navigator.clipboard.writeText(prompt).then(() => {
                this.showNotification('Prompt copied to clipboard', 'success');
            }).catch(err => {
                console.error('Copy failed:', err);
                this.showNotification('Failed to copy to clipboard', 'error');
            });
        }

        resetApp() {
            if (this.elements.userInput) {
                this.elements.userInput.value = '';
                this.handleInputChange();
            }
            
            if (this.elements.outputArea) {
                this.elements.outputArea.textContent = '';
            }
            
            if (this.elements.outputSection) {
                this.elements.outputSection.style.display = 'none';
            }
            
            this.closeInspirationPanel();
            
            this.state.currentStep = 1;
            this.state.hasGeneratedPrompt = false;
            this.state.promptModified = false;
            this.state.originalPrompt = null;
            this.state.undoStack = [];
            this.state.redoStack = [];
            
            this.updateProgress();
            this.updateButtonStates();
            this.updatePlatformCards();
            
            if (this.elements.suggestionsList) {
                this.elements.suggestionsList.innerHTML = '';
                this.elements.suggestionsPanel.style.display = 'none';
            }
            
            this.showNotification('Application reset', 'info');
        }

        showLoading(show) {
            const loadingScreen = document.getElementById('loading-screen');
            const app = document.getElementById('app');
            
            if (loadingScreen && app) {
                if (show) {
                    loadingScreen.style.display = 'flex';
                    app.style.display = 'none';
                } else {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        app.style.display = 'block';
                    }, 500);
                }
            }
        }

        showNotification(message, type = 'info') {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            let container = document.getElementById('notificationContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notificationContainer';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 400px;
                `;
                document.body.appendChild(container);
            }
            
            const existingNotifications = container.querySelectorAll('.notification');
            for (let notif of existingNotifications) {
                if (notif.textContent.includes(message)) {
                    return;
                }
            }
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
                padding: 12px 20px;
                background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : type === 'warning' ? '#ff9800' : '#2196F3'};
                color: white;
                border-radius: 4px;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                animation: slideIn 0.3s ease;
                max-width: 100%;
                word-wrap: break-word;
            `;
            notification.textContent = message;
            
            container.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 3000);
        }

        updateButtonStates() {
            const hasInput = this.elements.userInput && this.elements.userInput.value.trim().length > 0;
            const hasOutput = this.state.hasGeneratedPrompt;
            
            if (this.elements.stickyPrepareBtn) {
                this.elements.stickyPrepareBtn.disabled = !hasInput;
                this.elements.stickyPrepareBtn.classList.toggle('disabled', !hasInput);
            }
            
            if (this.elements.stickyResetBtn) {
                this.elements.stickyResetBtn.disabled = !hasInput && !hasOutput;
                this.elements.stickyResetBtn.classList.toggle('disabled', !hasInput && !hasOutput);
            }
            
            if (this.elements.copyBtn) {
                this.elements.copyBtn.disabled = !hasOutput;
                this.elements.copyBtn.classList.toggle('disabled', !hasOutput);
            }
            
            if (this.elements.speakBtn) {
                this.elements.speakBtn.disabled = !hasOutput;
                this.elements.speakBtn.classList.toggle('disabled', !hasOutput);
            }
            
            if (this.elements.clearBtn) {
                this.elements.clearBtn.disabled = !hasInput;
                this.elements.clearBtn.classList.toggle('disabled', !hasInput);
            }
            
            if (this.elements.undoBtn) {
                this.elements.undoBtn.disabled = this.state.undoStack.length === 0;
                this.elements.undoBtn.classList.toggle('disabled', this.state.undoStack.length === 0);
            }
            
            if (this.elements.editorUndoBtn) {
                this.elements.editorUndoBtn.disabled = this.state.undoStack.length === 0;
                this.elements.editorUndoBtn.classList.toggle('disabled', this.state.undoStack.length === 0);
            }
            
            if (this.elements.stickyPrepareBtn && this.elements.stickyResetBtn) {
                if (hasOutput) {
                    this.elements.stickyPrepareBtn.classList.add('hidden');
                    this.elements.stickyResetBtn.classList.remove('hidden');
                } else {
                    this.elements.stickyPrepareBtn.classList.remove('hidden');
                    this.elements.stickyResetBtn.classList.add('hidden');
                }
            }
        }

        handleInputChange() {
            const text = this.elements.userInput.value;
            
            if (this.elements.charCounter) {
                const charCount = text.length;
                this.elements.charCounter.textContent = `${charCount} characters`;
                this.elements.charCounter.style.color = charCount > 4000 ? '#f59e0b' : charCount > 5000 ? '#ef4444' : 'inherit';
            }
            
            this.updateButtonStates();
            
            if (text !== this.state.lastInput) {
                if (this.state.lastInput !== '') {
                    this.state.undoStack.push(this.state.lastInput);
                }
                this.state.lastInput = text;
                this.state.redoStack = [];
            }
        }

        handleEditorInputChange() {
            const text = this.elements.editorTextarea.value;
            
            if (this.elements.editorPrepareBtn) {
                this.elements.editorPrepareBtn.disabled = text.trim().length === 0;
            }
        }

        handleInputKeydown(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.preparePrompt();
            }
        }
        
        maximizeSection(section) {
            console.log(`Maximize section: ${section}, Currently maximized: ${this.state.isMaximized}`);
            
            if (this.state.isMaximized && this.state.maximizedSection === section) {
                this.closeEditor();
            } else {
                this.openEditor(section);
            }
        }
        
        openEditor(section) {
            this.state.isMaximized = true;
            this.state.maximizedSection = section;
            
            if (section === 'input') {
                this.state.originalInputContent = this.elements.userInput.value;
                this.elements.editorTextarea.value = this.state.originalInputContent;
                this.elements.editorTitle.innerHTML = '<i class="fas fa-edit"></i><span>Edit Input</span>';
                this.elements.editorPrepareBtn.style.display = 'block';
                this.elements.editorPrepareBtn.textContent = 'Generate Prompt';
            } else if (section === 'output') {
                this.state.originalOutputContent = this.elements.outputArea.textContent;
                this.elements.editorTextarea.value = this.state.originalOutputContent;
                this.elements.editorTitle.innerHTML = '<i class="fas fa-edit"></i><span>Edit Output</span>';
                this.elements.editorPrepareBtn.style.display = 'none';
            }
            
            this.elements.fullScreenEditor.style.display = 'flex';
            this.elements.fullScreenEditor.classList.add('active');
            
            setTimeout(() => {
                this.elements.editorTextarea.focus();
                this.elements.editorTextarea.select();
            }, 100);
            
            this.updateMaximizeButtons(true);
        }
        
        closeEditor() {
            if (this.state.maximizedSection === 'input') {
                this.elements.userInput.value = this.elements.editorTextarea.value;
                this.handleInputChange();
            } else if (this.state.maximizedSection === 'output') {
                this.elements.outputArea.textContent = this.elements.editorTextarea.value;
            }
            
            this.elements.fullScreenEditor.style.display = 'none';
            this.elements.fullScreenEditor.classList.remove('active');
            
            this.state.isMaximized = false;
            this.state.maximizedSection = null;
            this.elements.editorTextarea.value = '';
            this.updateMaximizeButtons(false);
            this.updateButtonStates();
        }
        
        updateMaximizeButtons(isMaximized) {
            if (this.elements.maximizeInputBtn) {
                if (isMaximized && this.state.maximizedSection === 'input') {
                    this.elements.maximizeInputBtn.innerHTML = '<i class="fas fa-compress"></i><span class="action-btn-tooltip">Minimize</span>';
                } else {
                    this.elements.maximizeInputBtn.innerHTML = '<i class="fas fa-expand"></i><span class="action-btn-tooltip">Maximize</span>';
                }
            }
            
            if (this.elements.maximizeOutputBtn) {
                if (isMaximized && this.state.maximizedSection === 'output') {
                    this.elements.maximizeOutputBtn.innerHTML = '<i class="fas fa-compress"></i><span class="action-btn-tooltip">Minimize</span>';
                } else {
                    this.elements.maximizeOutputBtn.innerHTML = '<i class="fas fa-expand"></i><span class="action-btn-tooltip">Maximize</span>';
                }
            }
        }
        
        clearInput() {
            if (this.elements.userInput) {
                this.elements.userInput.value = '';
                this.handleInputChange();
            }
            
            if (this.elements.outputArea) {
                this.elements.outputArea.textContent = '';
            }
            
            if (this.elements.outputSection) {
                this.elements.outputSection.style.display = 'none';
            }
            
            this.closeInspirationPanel();
            this.state.hasGeneratedPrompt = false;
            this.state.promptModified = false;
            this.state.originalPrompt = null;
            this.state.undoStack = [];
            this.state.redoStack = [];
            this.state.lastInput = '';
            this.updateButtonStates();
            this.updatePlatformCards();
            
            if (this.elements.suggestionsList) {
                this.elements.suggestionsList.innerHTML = '';
                this.elements.suggestionsPanel.style.display = 'none';
            }
            
            this.showNotification('Cleared input', 'info');
        }
        
        toggleInspirationPanel() {
            const panel = this.elements.inspirationPanel;
            const isExpanded = panel.style.display === 'block';
            
            if (isExpanded) {
                this.closeInspirationPanel();
            } else {
                this.openInspirationPanel();
            }
        }
        
        openInspirationPanel() {
            this.elements.inspirationPanel.style.display = 'block';
            this.elements.needInspirationBtn.setAttribute('aria-expanded', 'true');
            
            const inspirationItems = this.elements.inspirationPanel.querySelectorAll('.inspiration-item');
            inspirationItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.applyInspirationTemplate(item.dataset.type);
                });
            });
        }
        
        closeInspirationPanel() {
            this.elements.inspirationPanel.style.display = 'none';
            this.elements.needInspirationBtn.setAttribute('aria-expanded', 'false');
        }
        
        applyInspirationTemplate(type) {
            const templates = {
                email: `Write a professional business email to [Recipient Name] about [Subject]. Include:
1. Clear subject line
2. Professional greeting
3. Main purpose/request
4. Supporting details
5. Call to action
6. Professional closing

Tone: Professional, clear, and respectful`,
                code: `Create a [Programming Language] function that [Function Purpose]. Requirements:
1. Input parameters: [List parameters]
2. Return type: [Expected return]
3. Error handling: [How to handle errors]
4. Performance considerations: [Any performance requirements]
5. Include comments explaining key logic

Example usage should be provided.`,
                analysis: `Analyze [Dataset/Report Name] and provide insights on:
1. Key trends and patterns observed
2. Statistical summary (mean, median, mode, standard deviation)
3. Significant outliers or anomalies
4. Comparative analysis (if applicable)
5. Recommendations based on findings
6. Visualizations needed (charts, graphs)

Focus on actionable insights.`,
                creative: `Write a [Creative Piece Type - story/poem/article] about [Topic/Theme]. Include:
1. Engaging opening/hook
2. Character/context development (if applicable)
3. Core narrative or message
4. Emotional tone: [Specify tone]
5. Vivid descriptions and imagery
6. Satisfying conclusion

Length: Approximately [Number] words.`,
                strategy: `Develop a business strategy for [Company/Project] to achieve [Goal]. Consider:
1. Current market position
2. SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
3. Target audience/market
4. Competitive advantage
5. Implementation timeline (short-term/long-term)
6. Key performance indicators (KPIs)
7. Risk mitigation strategies`,
                research: `Summarize research on [Topic] focusing on:
1. Key findings from major studies
2. Methodology overview
3. Conflicting viewpoints (if any)
4. Gaps in current research
5. Practical applications/implications
6. Future research directions

Format: Academic but accessible, with citations where appropriate.`
            };
            
            if (templates[type]) {
                this.elements.userInput.value = templates[type];
                this.handleInputChange();
                this.closeInspirationPanel();
                this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} template applied`, 'success');
                
                setTimeout(() => {
                    this.elements.userInput.focus();
                    this.elements.userInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }
        
        initVoiceRecognition() {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.state.recognition = new SpeechRecognition();
                
                this.state.recognition.continuous = false;
                this.state.recognition.interimResults = true;
                this.state.recognition.lang = this.settings.interfaceLanguage || 'en-US';
                
                this.state.recognition.onresult = (event) => {
                    let transcript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            transcript += event.results[i][0].transcript;
                        }
                    }
                    
                    if (transcript) {
                        if (this.state.isMaximized) {
                            this.elements.editorTextarea.value += transcript + ' ';
                        } else {
                            this.elements.userInput.value += transcript + ' ';
                            this.handleInputChange();
                        }
                    }
                };
                
                this.state.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    this.state.isRecording = false;
                    this.updateVoiceButton();
                    
                    if (event.error === 'not-allowed') {
                        this.showNotification('Microphone access denied. Please enable microphone permissions.', 'error');
                    } else if (event.error === 'no-speech') {
                        this.showNotification('No speech detected. Please try again.', 'warning');
                    }
                };
                
                this.state.recognition.onend = () => {
                    this.state.isRecording = false;
                    this.updateVoiceButton();
                };
            }
        }
        
        async toggleVoiceInput() {
            if (!this.state.recognition) {
                this.showNotification('Voice input is not supported in your browser', 'warning');
                return;
            }
            
            if (this.state.isRecording) {
                this.stopVoiceRecording();
            } else {
                await this.startVoiceRecording();
            }
        }
        
        async startVoiceRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
                
                this.state.isRecording = true;
                this.updateVoiceButton();
                this.state.recognition.start();
                
                this.showNotification('Listening... Speak now', 'info');
            } catch (error) {
                console.error('Microphone access error:', error);
                this.showNotification('Microphone access denied. Please enable microphone permissions.', 'error');
            }
        }
        
        stopVoiceRecording() {
            if (this.state.recognition && this.state.isRecording) {
                this.state.recognition.stop();
                this.state.isRecording = false;
                this.updateVoiceButton();
                this.showNotification('Voice input stopped', 'info');
            }
        }
        
        updateVoiceButton() {
            if (this.state.isMaximized) {
                if (this.elements.editorMicBtn) {
                    this.elements.editorMicBtn.classList.toggle('recording', this.state.isRecording);
                    this.elements.editorMicBtn.innerHTML = this.state.isRecording ? 
                        '<i class="fas fa-stop"></i><span class="action-btn-tooltip">Stop Recording</span>' :
                        '<i class="fas fa-microphone"></i><span class="action-btn-tooltip">Voice Input</span>';
                }
            } else {
                if (this.elements.micBtn) {
                    this.elements.micBtn.classList.toggle('recording', this.state.isRecording);
                    this.elements.micBtn.innerHTML = this.state.isRecording ? 
                        '<i class="fas fa-stop"></i><span class="action-btn-tooltip">Stop Recording</span>' :
                        '<i class="fas fa-microphone"></i><span class="action-btn-tooltip">Voice Input</span>';
                }
            }
        }
        
        toggleVoiceOutput() {
            const prompt = this.elements.outputArea.textContent;
            if (!prompt) return;
            
            this.speechManager.speak(prompt, {
                rate: this.settings.speechRate || 1,
                pitch: this.settings.speechPitch || 1,
                volume: this.settings.speechVolume || 1,
                lang: this.settings.interfaceLanguage || 'en-US'
            });
        }
        
        openSettings() {
            if (this.elements.settingsModal) {
                this.populateSettingsForm();
                this.elements.settingsModal.style.display = 'block';
                this.elements.settingsModal.classList.add('active');
                this.state.settingsChanged = false;
                this.disableSaveSettingsButton();
            }
        }
        
        closeSettings() {
            if (this.elements.settingsModal) {
                this.elements.settingsModal.style.display = 'none';
                this.elements.settingsModal.classList.remove('active');
            }
        }
        
        populateSettingsForm() {
            // Get elements once - NO DUPLICATE DECLARATIONS
            const speechRate = document.getElementById('speechRate');
            const speechPitch = document.getElementById('speechPitch');
            const speechVolume = document.getElementById('speechVolume');

            [speechRate, speechPitch, speechVolume].forEach(input => {
                if (input) {
                    const valueId = input.id + 'Value';
                    const valueSpan = document.getElementById(valueId);
                    
                    if (valueSpan) {
                        valueSpan.textContent = input.value;
                        input.addEventListener('input', () => {
                            valueSpan.textContent = input.value;
                            this.state.settingsChanged = true;
                            this.enableSaveSettingsButton();
                        });
                    }
                }
            });
            
            const settings = this.settings;
            
            const themeSelect = document.getElementById('themeSelect');
            if (themeSelect) themeSelect.value = settings.theme || 'dark';
            
            const languageSelect = document.getElementById('interfaceLanguage');
            if (languageSelect) languageSelect.value = settings.interfaceLanguage || 'en';
            
            const densitySelect = document.getElementById('uiDensity');
            if (densitySelect) densitySelect.value = settings.uiDensity || 'comfortable';
            
            const modelSelect = document.getElementById('defaultAiModel');
            if (modelSelect) modelSelect.value = settings.defaultAiModel || 'gemini-3-flash-preview';
            
            const promptStyleSelect = document.getElementById('promptStyle');
            if (promptStyleSelect) promptStyleSelect.value = settings.promptStyle || 'detailed';
            
            const historyItemsInput = document.getElementById('maxHistoryItems');
            if (historyItemsInput) historyItemsInput.value = settings.maxHistoryItems || 50;
            
            if (speechRate) speechRate.value = settings.speechRate || 1;
            if (speechPitch) speechPitch.value = settings.speechPitch || 1;
            if (speechVolume) speechVolume.value = settings.speechVolume || 1;
            
            const autoSave = document.getElementById('autoSave');
            if (autoSave) autoSave.checked = settings.autoSave || true;
            
            const apiEndpoint = document.getElementById('apiEndpoint');
            if (apiEndpoint) apiEndpoint.value = settings.apiEndpoint || 'https://promptcraft-api.vijay-shagunkumar.workers.dev';
            
            const apiMode = document.getElementById('apiMode');
            if (apiMode) apiMode.value = settings.apiMode || 'auto';
            
            const defaultPlatform = document.getElementById('defaultPlatform');
            if (defaultPlatform) defaultPlatform.value = settings.defaultPlatform || 'gemini';
            
            const voiceInputLanguage = document.getElementById('voiceInputLanguage');
            if (voiceInputLanguage) voiceInputLanguage.value = settings.voiceInputLanguage || 'en-US';
            
            const voiceOutputLanguage = document.getElementById('voiceOutputLanguage');
            if (voiceOutputLanguage) voiceOutputLanguage.value = settings.voiceOutputLanguage || 'en-US';
            
            const autoConvertDelay = document.getElementById('autoConvertDelay');
            if (autoConvertDelay) autoConvertDelay.value = settings.autoConvertDelay || 0;
            
            const notificationDuration = document.getElementById('notificationDuration');
            if (notificationDuration) notificationDuration.value = settings.notificationDuration || 3000;
            
            const textareaSize = document.getElementById('textareaSize');
            if (textareaSize) textareaSize.value = settings.textareaSize || 'auto';
            
            const debugMode = document.getElementById('debugMode');
            if (debugMode) debugMode.value = settings.debugMode || 'off';
        }
        
        enableSaveSettingsButton() {
            if (this.elements.saveSettingsBtn) {
                this.elements.saveSettingsBtn.disabled = false;
                this.elements.saveSettingsBtn.classList.remove('disabled');
            }
        }
        
        disableSaveSettingsButton() {
            if (this.elements.saveSettingsBtn) {
                this.elements.saveSettingsBtn.disabled = true;
                this.elements.saveSettingsBtn.classList.add('disabled');
            }
        }
        
        saveSettings() {
            try {
                const settings = {
                    theme: document.getElementById('themeSelect')?.value || 'dark',
                    interfaceLanguage: document.getElementById('interfaceLanguage')?.value || 'en',
                    uiDensity: document.getElementById('uiDensity')?.value || 'comfortable',
                    defaultAiModel: document.getElementById('defaultAiModel')?.value || 'gemini-3-flash-preview',
                    promptStyle: document.getElementById('promptStyle')?.value || 'detailed',
                    maxHistoryItems: parseInt(document.getElementById('maxHistoryItems')?.value) || 50,
                    speechRate: parseFloat(document.getElementById('speechRate')?.value) || 1,
                    speechPitch: parseFloat(document.getElementById('speechPitch')?.value) || 1,
                    speechVolume: parseFloat(document.getElementById('speechVolume')?.value) || 1,
                    autoSave: document.getElementById('autoSave')?.checked || true,
                    apiEndpoint: document.getElementById('apiEndpoint')?.value || 'https://promptcraft-api.vijay-shagunkumar.workers.dev',
                    apiMode: document.getElementById('apiMode')?.value || 'auto',
                    defaultPlatform: document.getElementById('defaultPlatform')?.value || 'gemini',
                    voiceInputLanguage: document.getElementById('voiceInputLanguage')?.value || 'en-US',
                    voiceOutputLanguage: document.getElementById('voiceOutputLanguage')?.value || 'en-US',
                    autoConvertDelay: parseInt(document.getElementById('autoConvertDelay')?.value) || 0,
                    notificationDuration: parseInt(document.getElementById('notificationDuration')?.value) || 3000,
                    textareaSize: document.getElementById('textareaSize')?.value || 'auto',
                    debugMode: document.getElementById('debugMode')?.value || 'off'
                };
                
                if (!settings.defaultAiModel) {
                    throw new Error('Default AI model is required');
                }
                
                this.settingsManager.save(settings);
                this.settings = settings;
                this.applyTheme();
                this.applyUIDensity();
                this.state.currentModel = settings.defaultAiModel;
                this.updateCurrentModel();
                this.updateFooterInfo();
                
                if (this.state.recognition) {
                    this.state.recognition.lang = settings.voiceInputLanguage || 'en-US';
                }
                
                this.closeSettings();
                this.showNotification('Settings saved successfully', 'success');
                this.disableSaveSettingsButton();
                
            } catch (error) {
                console.error('Failed to save settings:', error);
                this.showNotification(`Failed to save settings: ${error.message}`, 'error');
            }
        }
        
        undo() {
            if (this.state.undoStack.length > 0) {
                const current = this.state.isMaximized ? 
                    this.elements.editorTextarea.value : 
                    this.elements.userInput.value;
                
                this.state.redoStack.push(current);
                const previous = this.state.undoStack.pop();
                
                if (this.state.isMaximized) {
                    this.elements.editorTextarea.value = previous;
                } else {
                    this.elements.userInput.value = previous;
                    this.handleInputChange();
                }
                
                this.updateButtonStates();
                this.showNotification('Undo applied', 'info');
            }
        }
        
        redo() {
            if (this.state.redoStack.length > 0) {
                const current = this.state.isMaximized ? 
                    this.elements.editorTextarea.value : 
                    this.elements.userInput.value;
                
                this.state.undoStack.push(current);
                const next = this.state.redoStack.pop();
                
                if (this.state.isMaximized) {
                    this.elements.editorTextarea.value = next;
                } else {
                    this.elements.userInput.value = next;
                    this.handleInputChange();
                }
                
                this.updateButtonStates();
                this.showNotification('Redo applied', 'info');
            }
        }
        
        savePrompt() {
            const prompt = this.elements.outputArea.textContent;
            if (!prompt) {
                this.showNotification('No prompt to save', 'warning');
                return;
            }
            
            try {
                const blob = new Blob([prompt], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `prompt-${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showNotification('Prompt saved as text file', 'success');
            } catch (error) {
                console.error('Failed to save prompt:', error);
                this.showNotification('Failed to save prompt', 'error');
            }
        }
        
        exportPrompt() {
            const prompt = this.elements.outputArea.textContent;
            if (!prompt) {
                this.showNotification('No prompt to export', 'warning');
                return;
            }
            
            this.savePrompt();
        }
    }

    // Export the class globally
    window.PromptCraftEnterprise = PromptCraftEnterprise;
    console.log('✅ PromptCraftEnterprise loaded successfully');
}
