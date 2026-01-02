import Utils from './utils.js';
import SettingsManager from './settings.js';
import SpeechManager from './speech.js';
import PlatformsManager from './platforms.js';
import apiService from './api.js';

class PromptCraftEnterprise {
    constructor() {
        this.utils = new Utils();
        this.settingsManager = new SettingsManager();
        this.speechManager = new SpeechManager();
        this.platformsManager = new PlatformsManager();
        this.api = apiService;
        
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
            // Track maximize state
            isMaximized: false,
            maximizedSection: null,
            // Voice recording state
            isRecording: false,
            recognition: null,
            // Editor state
            originalInputContent: '',
            originalOutputContent: ''
        };
        
        this.settings = this.settingsManager.load();
        this.init();
    }

    // Bind all UI elements - UPDATED
    bindElements() {
        console.log('🔗 Binding UI elements...');
        
        this.elements = {
            // Input Section
            userInput: document.getElementById('userInput'),
            micBtn: document.getElementById('micBtn'),
            undoBtn: document.getElementById('undoBtn'),
            maximizeInputBtn: document.getElementById('maximizeInputBtn'),
            clearBtn: document.getElementById('clearBtn'),
            charCounter: document.getElementById('charCounter'),
            needInspirationBtn: document.getElementById('needInspirationBtn'),
            closeInspirationBtn: document.getElementById('closeInspirationBtn'),
            inspirationPanel: document.getElementById('inspirationPanel'),
            
            // Output Section
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
            
            // Platforms
            platformsGrid: document.getElementById('platformsGrid'),
            platformsEmptyState: document.getElementById('platformsEmptyState'),
            
            // History
            historySection: document.getElementById('historySection'),
            historyList: document.getElementById('historyList'),
            historyBtn: document.getElementById('historyBtn'),
            closeHistoryBtn: document.getElementById('closeHistoryBtn'),
            
            // Settings
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            
            // Editor
            fullScreenEditor: document.getElementById('fullScreenEditor'),
            editorTextarea: document.getElementById('editorTextarea'),
            editorMicBtn: document.getElementById('editorMicBtn'),
            editorUndoBtn: document.getElementById('editorUndoBtn'),
            closeEditorBtn: document.getElementById('closeEditorBtn'),
            editorPrepareBtn: document.getElementById('editorPrepareBtn'),
            editorTitle: document.getElementById('editorTitle'),
            
            // API Status
            apiStatusIndicator: document.getElementById('apiStatusIndicator'),
            headerApiStatus: document.getElementById('headerApiStatus'),
            apiInfoPanel: document.getElementById('apiInfoPanel'),
            apiStatusMessage: document.getElementById('apiStatusMessage'),
            apiDetails: document.getElementById('apiDetails'),
            
            // CTA Buttons
            stickyPrepareBtn: document.getElementById('stickyPrepareBtn'),
            stickyResetBtn: document.getElementById('stickyResetBtn'),
            
            // Generation Info
            generationInfo: document.getElementById('generationInfo'),
            generatedModel: document.getElementById('generatedModel'),
            generationTime: document.getElementById('generationTime'),
            tokenCount: document.getElementById('tokenCount'),
            generationMode: document.getElementById('generationMode'),
            
            // Footer
            currentModel: document.getElementById('currentModel'),
            currentTheme: document.getElementById('currentTheme'),
            currentLanguage: document.getElementById('currentLanguage'),
            statusText: document.getElementById('statusText'),
            rateLimitDisplay: document.getElementById('rateLimitDisplay'),
            rateLimitText: document.getElementById('rateLimitText')
        };
        
        // Verify critical elements exist
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
        
        // Test API connection on startup
        await this.checkAPIStatus();
        
        // Initialize with current model
        this.updateCurrentModel();
        
        // Initialize button states
        this.updateButtonStates();
        
        // Initialize voice recognition if available
        this.initVoiceRecognition();
    }

    bindEvents() {
        console.log('🔗 Setting up event listeners...');
        
        // Prepare Prompt button
        if (this.elements.stickyPrepareBtn) {
            this.elements.stickyPrepareBtn.addEventListener('click', () => this.preparePrompt());
        }
        
        // Reset button
        if (this.elements.stickyResetBtn) {
            this.elements.stickyResetBtn.addEventListener('click', () => this.resetApp());
        }
        
        // Copy button
        if (this.elements.copyBtn) {
            this.elements.copyBtn.addEventListener('click', () => this.copyPrompt());
        }
        
        // Settings button
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        }
        
        // Save Settings button
        if (this.elements.saveSettingsBtn) {
            this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        
        // Close settings button
        if (this.elements.closeSettingsBtn) {
            this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        }
        
        // Cancel settings button
        if (this.elements.cancelSettingsBtn) {
            this.elements.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
        }
        
        // Maximize buttons
        if (this.elements.maximizeInputBtn) {
            this.elements.maximizeInputBtn.addEventListener('click', () => this.maximizeSection('input'));
        }
        
        if (this.elements.maximizeOutputBtn) {
            this.elements.maximizeOutputBtn.addEventListener('click', () => this.maximizeSection('output'));
        }
        
        // Clear button
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => this.clearInput());
        }
        
        // Need Inspiration button
        if (this.elements.needInspirationBtn) {
            this.elements.needInspirationBtn.addEventListener('click', () => this.toggleInspirationPanel());
        }
        
        if (this.elements.closeInspirationBtn) {
            this.elements.closeInspirationBtn.addEventListener('click', () => this.closeInspirationPanel());
        }
        
        // Voice buttons
        if (this.elements.micBtn) {
            this.elements.micBtn.addEventListener('click', () => this.toggleVoiceInput());
        }
        
        if (this.elements.speakBtn) {
            this.elements.speakBtn.addEventListener('click', () => this.toggleVoiceOutput());
        }
        
        // Editor buttons
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
        
        // Text input events
        if (this.elements.userInput) {
            this.elements.userInput.addEventListener('input', () => this.handleInputChange());
            this.elements.userInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        }
        
        // Editor textarea events
        if (this.elements.editorTextarea) {
            this.elements.editorTextarea.addEventListener('input', () => this.handleEditorInputChange());
        }
        
        // Settings change detection
        this.bindSettingsEvents();
        
        console.log('✅ Event listeners set up');
    }
    
    bindSettingsEvents() {
        // Theme selector
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.settings.theme = e.target.value;
                this.applyTheme();
            });
        }
        
        // Language selector
        const languageSelect = document.getElementById('interfaceLanguage');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.settings.interfaceLanguage = e.target.value;
                this.updateFooterInfo();
            });
        }
        
        // UI Density selector
        const densitySelect = document.getElementById('uiDensity');
        if (densitySelect) {
            densitySelect.addEventListener('change', (e) => {
                this.settings.uiDensity = e.target.value;
                this.applyUIDensity();
            });
        }
        
        // Model selector
        const modelSelect = document.getElementById('defaultModel');
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                this.settings.defaultModel = e.target.value;
                this.state.currentModel = e.target.value;
                this.updateCurrentModel();
            });
        }
        
        // History size input
        const historySizeInput = document.getElementById('maxHistoryItems');
        if (historySizeInput) {
            historySizeInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                this.settings.maxHistoryItems = isNaN(value) || value < 0 ? 50 : value;
            });
        }
    }
    
    // ========== CORE METHODS ==========
    
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
            // Ctrl/Cmd + Enter to generate prompt
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.preparePrompt();
            }
            
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.savePrompt();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                if (this.state.isMaximized) {
                    this.closeEditor();
                }
                if (this.elements.settingsModal && this.elements.settingsModal.style.display !== 'none') {
                    this.closeSettings();
                }
                if (this.elements.inspirationPanel.classList.contains('expanded')) {
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
        // Update model display
        if (this.elements.currentModel) {
            this.elements.currentModel.textContent = this.state.currentModel;
        }
        
        // Update theme display
        if (this.elements.currentTheme) {
            const theme = this.settings.theme || 'dark';
            this.elements.currentTheme.textContent = theme === 'auto' ? 'Auto' : theme.charAt(0).toUpperCase() + theme.slice(1);
        }
        
        // Update language display
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
            
            // Update UI indicators
            this.updateAPIStatusIndicator();
            
            if (status.online) {
                console.log('API Status:', status);
                this.showNotification(`API connected: ${status.models.length} models available`, 'success');
                
                // Update available models in settings if needed
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
        
        if (!statusIndicator || !statusText) return;
        
        const statusConfig = {
            checking: { 
                class: 'checking', 
                text: 'Checking...',
                color: 'var(--warning)'
            },
            online: { 
                class: 'online', 
                text: 'Online',
                color: 'var(--success)'
            },
            offline: { 
                class: 'offline', 
                text: 'Offline',
                color: 'var(--danger)'
            },
            degraded: { 
                class: 'degraded', 
                text: 'Degraded',
                color: 'var(--warning)'
            }
        };
        
        const config = statusConfig[this.state.apiStatus] || statusConfig.checking;
        
        statusIndicator.className = `status-indicator ${config.class}`;
        statusIndicator.style.backgroundColor = config.color;
        statusText.textContent = config.text;
        
        // Update rate limit display if available
        if (this.state.apiStatus === 'online') {
            const rateLimit = this.api.getRateLimitStatus();
            this.updateRateLimitDisplay(rateLimit);
        }
    }

    updateRateLimitDisplay(rateLimit) {
        const rateElement = document.getElementById('rateLimitDisplay');
        if (rateElement) {
            rateElement.innerHTML = `
                <small>
                    Rate: ${rateLimit.minuteRemaining}/${rateLimit.minuteLimit} min, 
                    ${rateLimit.used}/${rateLimit.dailyLimit} daily
                </small>
            `;
        }
    }

    updateAvailableModels(availableModels) {
        const modelSelect = document.getElementById('defaultModel');
        if (!modelSelect) return;
        
        // Clear existing options except the first
        while (modelSelect.options.length > 0) {
            modelSelect.remove(0);
        }
        
        // Add available models
        availableModels.forEach(modelId => {
            const displayName = this.api.getModelDisplayName(modelId);
            const option = document.createElement('option');
            option.value = modelId;
            option.textContent = displayName;
            
            // Mark Gemini 3 as default/recommended
            if (modelId === 'gemini-3-flash-preview') {
                option.selected = true;
                this.state.currentModel = modelId;
            }
            
            modelSelect.appendChild(option);
        });
    }

    updateCurrentModel() {
        const modelSelect = document.getElementById('defaultModel');
        if (modelSelect) {
            this.state.currentModel = modelSelect.value;
        }
    }

    // ========== PROMPT GENERATION ==========

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
        
        // Update generation stats
        this.state.generationStats.totalRequests++;
        
        // Show loading state
        this.showLoading(true);
        this.showNotification('Crafting your perfect prompt...', 'info');
        
        const startTime = Date.now();
        
        try {
            let result;
            
            // Determine which model to use
            const modelToUse = this.getModelForGeneration();
            
            if (this.state.apiStatus === 'online' && !this.state.useFallback) {
                // Use real API
                result = await this.api.generatePrompt(inputText, {
                    model: modelToUse,
                    style: this.settings.promptStyle,
                    temperature: 0.4,
                    max_tokens: 700,
                    retryCount: 0
                });
                
                if (result.success) {
                    this.state.generationStats.successfulRequests++;
                    
                    // Update rate limit info
                    if (result.rateLimit) {
                        this.api.rateLimitInfo = {
                            ...this.api.rateLimitInfo,
                            ...result.rateLimit
                        };
                    }
                } else {
                    this.state.generationStats.failedRequests++;
                    throw new Error(result.error || 'API request failed');
                }
                
            } else {
                // Use fallback
                result = {
                    success: true,
                    content: this.api.generateFallbackPrompt(inputText, this.settings.promptStyle),
                    model: 'fallback',
                    provider: 'local',
                    fallbackUsed: true
                };
                this.state.generationStats.failedRequests++; // Count as fallback
            }
            
            // Calculate response time
            const responseTime = Date.now() - startTime;
            this.updateAverageResponseTime(responseTime);
            
            // Update output
            this.elements.outputArea.textContent = result.content;
            this.state.originalPrompt = result.content;
            this.state.promptModified = false;
            this.state.hasGeneratedPrompt = true;
            
            // Show output section
            this.elements.outputSection.hidden = false;
            this.elements.outputSection.classList.add('visible');
            
            // Update UI
            this.updatePlatformCards();
            this.updateProgress();
            this.updateButtonStates();
            this.generateSuggestions();
            
            // Save to history
            this.saveToHistory(inputText, result.content, {
                model: result.model,
                provider: result.provider,
                responseTime: responseTime,
                fallback: result.fallbackUsed || false
            });
            
            // Show success message
            let successMessage = `Prompt generated using ${this.api.getModelDisplayName(result.model)}`;
            
            if (result.fallbackUsed) {
                successMessage += ' (offline mode)';
                this.showNotification(successMessage, 'warning');
            } else {
                successMessage += ` (${responseTime}ms)`;
                this.showNotification(successMessage, 'success');
            }
            
            // Scroll to output
            setTimeout(() => {
                this.elements.outputSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }, 300);
            
        } catch (error) {
            console.error('Prompt generation error:', error);
            this.state.generationStats.failedRequests++;
            
            // Try fallback
            try {
                const fallbackPrompt = this.api.generateFallbackPrompt(inputText, this.settings.promptStyle);
                this.elements.outputArea.textContent = fallbackPrompt;
                this.state.originalPrompt = fallbackPrompt;
                this.state.hasGeneratedPrompt = true;
                this.elements.outputSection.classList.add('visible');
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
        // Map frontend model selection to backend model IDs
        const modelMap = {
            'gemini': 'gemini-3-flash-preview',
            'chatgpt': 'gpt-4o-mini',
            'claude': 'gemini-3-flash-preview', // Map to Gemini as fallback
            'perplexity': 'gemini-3-flash-preview',
            'deepseek': 'gemini-3-flash-preview',
            'copilot': 'gpt-4o-mini',
            'grok': 'gemini-3-flash-preview'
        };
        
        return modelMap[this.settings.defaultModel] || 'gemini-3-flash-preview';
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
        
        // Limit history size
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

    // ========== PLATFORM MANAGEMENT ==========

    updatePlatformCards() {
        if (!this.elements.platformsGrid) return;
        
        // Clear existing content except empty state
        this.elements.platformsGrid.innerHTML = '';
        
        // Show platforms only if we have a generated prompt
        if (this.state.hasGeneratedPrompt) {
            const platforms = this.platformsManager.getAllPlatforms();
            platforms.forEach(platform => {
                const platformCard = this.createPlatformCard(platform);
                this.elements.platformsGrid.appendChild(platformCard);
            });
        } else {
            // Show empty state
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
        
        // Add click handlers for action buttons
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
        
        card.addEventListener('click', () => this.handlePlatformClick(platform));
        return card;
    }

    copyPromptForPlatform(platform) {
        const prompt = this.elements.outputArea.textContent;
        if (!prompt) return;
        
        // Format prompt for specific platform if needed
        const formattedPrompt = this.formatPromptForPlatform(prompt, platform);
        
        navigator.clipboard.writeText(formattedPrompt).then(() => {
            this.showNotification(`Prompt copied for ${platform.name}`, 'success');
        }).catch(err => {
            this.showNotification('Failed to copy to clipboard', 'error');
        });
    }

    openPlatform(platform) {
        if (platform.url) {
            window.open(platform.url, '_blank');
        } else {
            this.showNotification(`No URL configured for ${platform.name}`, 'warning');
        }
    }

    handlePlatformClick(platform) {
        const prompt = this.elements.outputArea.textContent;
        if (!prompt) return;
        
        this.showNotification(`${platform.name} prompt ready`, 'info');
    }

    formatPromptForPlatform(prompt, platform) {
        // Add platform-specific formatting
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

    // ========== SUGGESTIONS ==========

    generateSuggestions() {
        if (!this.elements.suggestionsList) return;
        
        // Clear existing suggestions
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
        
        // Push to undo stack
        this.state.undoStack.push(currentPrompt);
        this.state.redoStack = [];
        this.updateButtonStates();
    }

    // ========== UTILITY METHODS ==========

    copyPrompt() {
        const prompt = this.elements.outputArea.textContent;
        if (!prompt) {
            this.showNotification('No prompt to copy', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(prompt).then(() => {
            this.showNotification('Prompt copied to clipboard', 'success');
        }).catch(err => {
            this.showNotification('Failed to copy to clipboard', 'error');
        });
    }

    resetApp() {
        // Clear input
        if (this.elements.userInput) {
            this.elements.userInput.value = '';
            this.handleInputChange();
        }
        
        // Clear output
        if (this.elements.outputArea) {
            this.elements.outputArea.textContent = '';
        }
        
        // Hide output section
        if (this.elements.outputSection) {
            this.elements.outputSection.hidden = true;
            this.elements.outputSection.classList.remove('visible');
        }
        
        // Close inspiration panel if open
        this.closeInspirationPanel();
        
        // Reset state
        this.state.currentStep = 1;
        this.state.hasGeneratedPrompt = false;
        this.state.promptModified = false;
        this.state.originalPrompt = null;
        this.state.undoStack = [];
        this.state.redoStack = [];
        
        // Update UI
        this.updateProgress();
        this.updateButtonStates();
        this.updatePlatformCards();
        
        // Clear suggestions
        if (this.elements.suggestionsList) {
            this.elements.suggestionsList.innerHTML = '';
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
        
        // Create notification container if it doesn't exist
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
        
        // Auto-remove after 3 seconds
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
        
        // Update prepare button
        if (this.elements.stickyPrepareBtn) {
            this.elements.stickyPrepareBtn.disabled = !hasInput;
            this.elements.stickyPrepareBtn.classList.toggle('disabled', !hasInput);
        }
        
        // Update reset button
        if (this.elements.stickyResetBtn) {
            this.elements.stickyResetBtn.disabled = !hasInput && !hasOutput;
            this.elements.stickyResetBtn.classList.toggle('disabled', !hasInput && !hasOutput);
        }
        
        // Update copy button
        if (this.elements.copyBtn) {
            this.elements.copyBtn.disabled = !hasOutput;
            this.elements.copyBtn.classList.toggle('disabled', !hasOutput);
        }
        
        // Update speak button
        if (this.elements.speakBtn) {
            this.elements.speakBtn.disabled = !hasOutput;
            this.elements.speakBtn.classList.toggle('disabled', !hasOutput);
        }
        
        // Update clear button
        if (this.elements.clearBtn) {
            this.elements.clearBtn.disabled = !hasInput;
            this.elements.clearBtn.classList.toggle('disabled', !hasInput);
        }
        
        // Update undo/redo buttons
        if (this.elements.undoBtn) {
            this.elements.undoBtn.disabled = this.state.undoStack.length === 0;
        }
        
        if (this.elements.editorUndoBtn) {
            this.elements.editorUndoBtn.disabled = this.state.undoStack.length === 0;
        }
    }

    handleInputChange() {
        const text = this.elements.userInput.value;
        
        // Update character counter
        if (this.elements.charCounter) {
            this.elements.charCounter.textContent = `${text.length} characters`;
            this.elements.charCounter.classList.toggle('warning', text.length > 4000);
            this.elements.charCounter.classList.toggle('danger', text.length > 5000);
        }
        
        // Update button states
        this.updateButtonStates();
        
        // Push to undo stack if not already tracking
        if (this.state.undoStack.length === 0 || this.state.undoStack[this.state.undoStack.length - 1] !== text) {
            this.state.undoStack.push(text);
            this.state.redoStack = [];
        }
    }

    handleEditorInputChange() {
        const text = this.elements.editorTextarea.value;
        
        // Push to undo stack if not already tracking
        if (this.state.undoStack.length === 0 || this.state.undoStack[this.state.undoStack.length - 1] !== text) {
            this.state.undoStack.push(text);
            this.state.redoStack = [];
        }
    }

    handleInputKeydown(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            this.preparePrompt();
        }
    }

    // ========== MAXIMIZE/EDITOR FUNCTIONALITY ==========
    
    maximizeSection(section) {
        if (this.state.isMaximized && this.state.maximizedSection === section) {
            this.restoreNormalView();
        } else {
            this.enterMaximizeMode(section);
        }
    }
    
    enterMaximizeMode(section) {
        this.state.isMaximized = true;
        this.state.maximizedSection = section;
        
        // Store original content
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
        
        // Show full screen editor
        this.elements.fullScreenEditor.style.display = 'flex';
        this.elements.fullScreenEditor.classList.add('active');
        this.elements.editorTextarea.focus();
        
        // Update button states
        this.updateMaximizeButtons();
        
        // Update undo stack
        this.state.undoStack = [this.elements.editorTextarea.value];
        this.state.redoStack = [];
    }
    
    restoreNormalView() {
        if (!this.state.isMaximized) return;
        
        // Restore content if modified
        if (this.state.maximizedSection === 'input') {
            this.elements.userInput.value = this.elements.editorTextarea.value;
        } else if (this.state.maximizedSection === 'output') {
            this.elements.outputArea.textContent = this.elements.editorTextarea.value;
        }
        
        // Close editor
        this.closeEditor();
    }
    
    closeEditor() {
        this.elements.fullScreenEditor.style.display = 'none';
        this.elements.fullScreenEditor.classList.remove('active');
        this.state.isMaximized = false;
        this.state.maximizedSection = null;
        this.updateMaximizeButtons();
        
        // Clear editor content
        this.elements.editorTextarea.value = '';
        
        // Update button states
        this.updateButtonStates();
    }
    
    updateMaximizeButtons() {
        const isInputMaximized = this.state.isMaximized && this.state.maximizedSection === 'input';
        const isOutputMaximized = this.state.isMaximized && this.state.maximizedSection === 'output';
        
        if (this.elements.maximizeInputBtn) {
            this.elements.maximizeInputBtn.innerHTML = isInputMaximized ? 
                '<i class="fas fa-compress"></i><span class="action-btn-tooltip">Minimize</span>' :
                '<i class="fas fa-expand"></i><span class="action-btn-tooltip">Maximize</span>';
        }
        
        if (this.elements.maximizeOutputBtn) {
            this.elements.maximizeOutputBtn.innerHTML = isOutputMaximized ? 
                '<i class="fas fa-compress"></i><span class="action-btn-tooltip">Minimize</span>' :
                '<i class="fas fa-expand"></i><span class="action-btn-tooltip">Maximize</span>';
        }
    }
    
    // ========== CLEAR INPUT FUNCTIONALITY ==========
    
    clearInput() {
        if (this.elements.userInput) {
            this.elements.userInput.value = '';
            this.handleInputChange();
        }
        
        // Also clear output if exists
        if (this.elements.outputArea) {
            this.elements.outputArea.textContent = '';
        }
        
        // Hide output section
        if (this.elements.outputSection) {
            this.elements.outputSection.hidden = true;
            this.elements.outputSection.classList.remove('visible');
        }
        
        // Close inspiration panel
        this.closeInspirationPanel();
        
        // Reset generation state
        this.state.hasGeneratedPrompt = false;
        this.state.promptModified = false;
        this.state.originalPrompt = null;
        this.state.undoStack = [];
        this.state.redoStack = [];
        
        // Update UI
        this.updateButtonStates();
        this.updatePlatformCards();
        
        // Clear suggestions
        if (this.elements.suggestionsList) {
            this.elements.suggestionsList.innerHTML = '';
        }
        
        this.showNotification('Cleared input', 'info');
    }
    
    // ========== INSPIRATION PANEL ==========
    
    toggleInspirationPanel() {
        const panel = this.elements.inspirationPanel;
        const isExpanded = panel.classList.contains('expanded');
        
        if (isExpanded) {
            this.closeInspirationPanel();
        } else {
            panel.classList.add('expanded');
            this.elements.needInspirationBtn.setAttribute('aria-expanded', 'true');
            this.elements.needInspirationBtn.innerHTML = '<i class="fas fa-times"></i><span class="inspiration-btn-text">Close Inspiration</span>';
            
            // Add click handlers for inspiration items
            const inspirationItems = panel.querySelectorAll('.inspiration-item');
            inspirationItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.applyInspirationTemplate(item.dataset.type);
                });
            });
        }
    }
    
    closeInspirationPanel() {
        this.elements.inspirationPanel.classList.remove('expanded');
        this.elements.needInspirationBtn.setAttribute('aria-expanded', 'false');
        this.elements.needInspirationBtn.innerHTML = '<i class="fas fa-lightbulb"></i><span class="inspiration-btn-text">Need Inspiration?</span>';
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
            
            // Scroll to input and focus
            setTimeout(() => {
                this.elements.userInput.focus();
                this.elements.userInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }
    
    // ========== VOICE FUNCTIONALITY ==========
    
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
            // Check microphone permission
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
    
    // ========== SETTINGS MANAGEMENT ==========
    
    openSettings() {
        if (this.elements.settingsModal) {
            // Populate settings form with current values
            this.populateSettingsForm();
            this.elements.settingsModal.style.display = 'block';
            this.elements.settingsModal.classList.add('active');
        }
    }
    
    closeSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'none';
            this.elements.settingsModal.classList.remove('active');
        }
    }
    
    populateSettingsForm() {
        const settings = this.settings;
        
        // Set theme
        const themeSelect = document.getElementById('theme');
        if (themeSelect) themeSelect.value = settings.theme || 'dark';
        
        // Set language
        const languageSelect = document.getElementById('interfaceLanguage');
        if (languageSelect) languageSelect.value = settings.interfaceLanguage || 'en';
        
        // Set UI density
        const densitySelect = document.getElementById('uiDensity');
        if (densitySelect) densitySelect.value = settings.uiDensity || 'comfortable';
        
        // Set default model
        const modelSelect = document.getElementById('defaultModel');
        if (modelSelect) modelSelect.value = settings.defaultModel || 'gemini';
        
        // Set prompt style
        const promptStyleSelect = document.getElementById('promptStyle');
        if (promptStyleSelect) promptStyleSelect.value = settings.promptStyle || 'balanced';
        
        // Set history items
        const historyItemsInput = document.getElementById('maxHistoryItems');
        if (historyItemsInput) historyItemsInput.value = settings.maxHistoryItems || 50;
        
        // Set speech settings
        const speechRate = document.getElementById('speechRate');
        if (speechRate) speechRate.value = settings.speechRate || 1;
        
        const speechPitch = document.getElementById('speechPitch');
        if (speechPitch) speechPitch.value = settings.speechPitch || 1;
        
        const speechVolume = document.getElementById('speechVolume');
        if (speechVolume) speechVolume.value = settings.speechVolume || 1;
        
        // Set auto-save
        const autoSave = document.getElementById('autoSave');
        if (autoSave) autoSave.checked = settings.autoSave || true;
    }
    
    saveSettings() {
        try {
            // Collect settings from form
            const settings = {
                theme: document.getElementById('theme').value,
                interfaceLanguage: document.getElementById('interfaceLanguage').value,
                uiDensity: document.getElementById('uiDensity').value,
                defaultModel: document.getElementById('defaultModel').value,
                promptStyle: document.getElementById('promptStyle').value,
                maxHistoryItems: parseInt(document.getElementById('maxHistoryItems').value) || 50,
                speechRate: parseFloat(document.getElementById('speechRate').value) || 1,
                speechPitch: parseFloat(document.getElementById('speechPitch').value) || 1,
                speechVolume: parseFloat(document.getElementById('speechVolume').value) || 1,
                autoSave: document.getElementById('autoSave').checked
            };
            
            // Save settings
            this.settingsManager.save(settings);
            this.settings = settings;
            
            // Apply settings
            this.applyTheme();
            this.applyUIDensity();
            this.updateCurrentModel();
            this.updateFooterInfo();
            
            // Update voice recognition language
            if (this.state.recognition) {
                this.state.recognition.lang = settings.interfaceLanguage || 'en-US';
            }
            
            this.closeSettings();
            this.showNotification('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }
    
    // ========== UNDO/REDO FUNCTIONALITY ==========
    
    undo() {
        if (this.state.undoStack.length > 1) {
            const current = this.state.undoStack.pop();
            this.state.redoStack.push(current);
            
            const previous = this.state.undoStack[this.state.undoStack.length - 1];
            
            if (this.state.isMaximized) {
                this.elements.editorTextarea.value = previous;
            } else {
                this.elements.userInput.value = previous;
                this.handleInputChange();
            }
            
            this.updateButtonStates();
        }
    }
    
    redo() {
        if (this.state.redoStack.length > 0) {
            const next = this.state.redoStack.pop();
            this.state.undoStack.push(next);
            
            if (this.state.isMaximized) {
                this.elements.editorTextarea.value = next;
            } else {
                this.elements.userInput.value = next;
                this.handleInputChange();
            }
            
            this.updateButtonStates();
        }
    }
    
    // ========== SAVE PROMPT ==========
    
    savePrompt() {
        const prompt = this.elements.outputArea.textContent;
        if (!prompt) {
            this.showNotification('No prompt to save', 'warning');
            return;
        }
        
        try {
            // Create a blob and download
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
    
    // ========== EXPORT FUNCTIONALITY ==========
    
    exportPrompt(format = 'text') {
        const prompt = this.elements.outputArea.textContent;
        if (!prompt) {
            this.showNotification('No prompt to export', 'warning');
            return;
        }
        
        switch (format) {
            case 'json':
                this.exportAsJSON(prompt);
                break;
            case 'html':
                this.exportAsHTML(prompt);
                break;
            case 'markdown':
                this.exportAsMarkdown(prompt);
                break;
            default:
                this.savePrompt(); // Default to text
        }
    }
    
    exportAsJSON(prompt) {
        const data = {
            prompt: prompt,
            metadata: {
                generatedAt: new Date().toISOString(),
                model: this.state.currentModel,
                apiStatus: this.state.apiStatus,
                modified: this.state.promptModified
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, `prompt-${Date.now()}.json`);
        this.showNotification('Prompt exported as JSON', 'success');
    }
    
    exportAsHTML(prompt) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI Prompt - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        .prompt { background: #f5f5f5; padding: 20px; border-radius: 5px; white-space: pre-wrap; }
        .metadata { color: #666; font-size: 0.9em; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>AI Prompt</h1>
    <div class="prompt">${prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <div class="metadata">
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Model: ${this.state.currentModel}</p>
    </div>
</body>
</html>`;
        
        const blob = new Blob([html], { type: 'text/html' });
        this.downloadBlob(blob, `prompt-${Date.now()}.html`);
        this.showNotification('Prompt exported as HTML', 'success');
    }
    
    exportAsMarkdown(prompt) {
        const markdown = `# AI Prompt

## Prompt
${prompt}

## Metadata
- **Generated**: ${new Date().toLocaleString()}
- **Model**: ${this.state.currentModel}
- **API Status**: ${this.state.apiStatus}
- **Modified**: ${this.state.promptModified ? 'Yes' : 'No'}`;
        
        const blob = new Blob([markdown], { type: 'text/markdown' });
        this.downloadBlob(blob, `prompt-${Date.now()}.md`);
        this.showNotification('Prompt exported as Markdown', 'success');
    }
    
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Export the class
export default PromptCraftEnterprise;
