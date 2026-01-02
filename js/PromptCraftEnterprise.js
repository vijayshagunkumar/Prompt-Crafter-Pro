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
            apiStatus: 'checking', // checking, online, offline, degraded
            useFallback: false,
            currentModel: 'gemini-3-flash-preview',
            generationStats: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0
            }
        };
        
        this.settings = this.settingsManager.load();
        this.init();
    }

    // Bind all UI elements
    bindElements() {
        console.log('🔗 Binding UI elements...');
        
        this.elements = {
            // Input Section
            userInput: document.getElementById('userInput'),
            micBtn: document.getElementById('micBtn'),
            undoBtn: document.getElementById('undoBtn'),
            maximizeInputBtn: document.getElementById('maximizeInputBtn'),
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
        
        // Close settings button
        if (this.elements.closeSettingsBtn) {
            this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        }
        
        // Text input events
        if (this.elements.userInput) {
            this.elements.userInput.addEventListener('input', () => this.handleInputChange());
            this.elements.userInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        }
        
        console.log('✅ Event listeners set up');
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
                if (this.state.isEditorOpen) {
                    this.closeEditor();
                }
                if (this.elements.settingsModal && this.elements.settingsModal.style.display !== 'none') {
                    this.closeSettings();
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

    updatePlatformCards() {
        if (!this.elements.platformsGrid) return;
        
        // Clear existing content except empty state
        this.elements.platformsGrid.innerHTML = '';
        
        // Show platforms only if we have a generated prompt
        if (this.state.hasGeneratedPrompt) {
            const platforms = this.platformsManager.getPlatforms();
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
        
        card.addEventListener('click', () => this.handlePlatformClick(platform));
        return card;
    }

    handlePlatformClick(platform) {
        const prompt = this.elements.outputArea.textContent;
        if (!prompt) return;
        
        // Copy prompt to clipboard
        navigator.clipboard.writeText(prompt).then(() => {
            this.showNotification(`Prompt copied for ${platform.name}`, 'success');
            
            // Open platform URL in new tab
            if (platform.url) {
                window.open(platform.url, '_blank');
            }
        }).catch(err => {
            this.showNotification('Failed to copy to clipboard', 'error');
        });
    }

    updateButtonStates() {
        // Update reset button visibility
        if (this.elements.stickyResetBtn) {
            if (this.state.hasGeneratedPrompt) {
                this.elements.stickyResetBtn.classList.remove('hidden');
            } else {
                this.elements.stickyResetBtn.classList.add('hidden');
            }
        }
    }

    generateSuggestions() {
        if (!this.elements.suggestionsList) return;
        
        // Clear existing suggestions
        this.elements.suggestionsList.innerHTML = '';
        
        const prompt = this.elements.outputArea.textContent;
        if (!prompt) return;
        
        // Simple suggestion logic (you can enhance this)
        const suggestions = [
            { text: 'Make it more concise', action: 'concise' },
            { text: 'Add more technical details', action: 'technical' },
            { text: 'Make it more conversational', action: 'conversational' },
            { text: 'Add examples', action: 'examples' }
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
        }
        
        this.elements.outputArea.textContent = modifiedPrompt;
        this.state.promptModified = true;
        this.showNotification('Suggestion applied', 'success');
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
            this.showNotification('Failed to copy to clipboard', 'error');
        });
    }

    resetApp() {
        // Clear input
        if (this.elements.userInput) {
            this.elements.userInput.value = '';
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
        
        // Reset state
        this.state.currentStep = 1;
        this.state.hasGeneratedPrompt = false;
        this.state.promptModified = false;
        this.state.originalPrompt = null;
        
        // Update UI
        this.updateProgress();
        this.updateButtonStates();
        this.updatePlatformCards();
        
        this.showNotification('Application reset', 'info');
    }

    openSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'block';
        }
    }

    closeSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'none';
        }
    }

    handleInputChange() {
        const text = this.elements.userInput.value;
        const charCount = text.length;
        
        // Update character counter
        if (this.elements.charCounter) {
            this.elements.charCounter.textContent = `${charCount}/5000`;
            
            // Change color based on length
            if (charCount > 4500) {
                this.elements.charCounter.style.color = 'var(--danger)';
            } else if (charCount > 3000) {
                this.elements.charCounter.style.color = 'var(--warning)';
            } else {
                this.elements.charCounter.style.color = 'var(--text-secondary)';
            }
        }
    }

    handleInputKeydown(e) {
        // Save for undo (simple implementation)
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            // Basic undo functionality
            if (this.state.undoStack.length > 0) {
                const previous = this.state.undoStack.pop();
                this.state.redoStack.push(this.elements.userInput.value);
                this.elements.userInput.value = previous;
            }
        }
        
        // Redo
        if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (this.state.redoStack.length > 0) {
                const next = this.state.redoStack.pop();
                this.state.undoStack.push(this.elements.userInput.value);
                this.elements.userInput.value = next;
            }
        }
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
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        // Add to notification container or body
        const container = document.getElementById('notificationContainer') || document.body;
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
}

export default PromptCraftEnterprise;
