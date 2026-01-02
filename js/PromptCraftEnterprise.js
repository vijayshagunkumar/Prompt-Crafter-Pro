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

    /**
     * Check API status and update UI
     */
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

    /**
     * Update API status indicator in UI
     */
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

    /**
     * Update rate limit display
     */
    updateRateLimitDisplay(rateLimit) {
        // You can add a rate limit display in the footer or settings
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

    /**
     * Update available models in settings dropdown
     */
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

    /**
     * Update current model based on settings
     */
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

    /**
     * Determine which model to use for generation
     */
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

    /**
     * Update average response time
     */
    updateAverageResponseTime(newTime) {
        const { averageResponseTime, successfulRequests } = this.state.generationStats;
        
        if (successfulRequests === 1) {
            this.state.generationStats.averageResponseTime = newTime;
        } else {
            this.state.generationStats.averageResponseTime = 
                (averageResponseTime * (successfulRequests - 1) + newTime) / successfulRequests;
        }
    }

    /**
     * Enhanced save to history with API metadata
     */
    saveToHistory(input, output, metadata = {}) {
        const maxItems = this.settings.maxHistoryItems;
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

    // ... rest of the methods remain similar with minor updates
}

export default PromptCraftEnterprise;
