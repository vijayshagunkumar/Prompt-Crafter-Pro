/**
 * Main Application Class - PromptCraft Pro
 */

class PromptCraftApp {
    constructor() {
        // State management
        this.state = {
            currentStep: 1,
            userInput: '',
            generatedPrompt: '',
            currentModel: 'gemini-3-flash-preview',
            apiStatus: 'checking',
            isListening: false,
            isSpeaking: false,
            isMaximized: false,
            inspirationPanelOpen: false,
            undoStack: [],
            redoStack: [],
            lastInput: '',
            generationStats: {
                time: 0,
                model: '',
                tokens: 0
            }
        };
        
        // Elements cache
        this.elements = {};
        
        // Don't store service references - use window globals directly
        // This prevents timing issues when services load
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        console.log('Initializing PromptCraftApp...');
        
        try {
            this.cacheElements();
            this.bindEvents();
            this.loadSettings();
            this.checkAPIStatus();
            this.updateUI();
            
            console.log('✓ PromptCraftApp initialized successfully');
            
            // Show welcome notification if available
            if (window.showNotification) {
                setTimeout(() => {
                    window.showNotification('PromptCraft Pro ready!', 'success', 3000);
                }, 1000);
            }
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            throw error;
        }
    }
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Input section
        this.elements.userInput = document.getElementById('userInput');
        this.elements.clearInputBtn = document.getElementById('clearInputBtn');
        this.elements.maximizeInputBtn = document.getElementById('maximizeInputBtn');
        this.elements.voiceInputBtn = document.getElementById('voiceInputBtn');
        this.elements.undoBtn = document.getElementById('undoBtn');
        this.elements.speakInputBtn = document.getElementById('speakInputBtn');
        this.elements.charCount = document.getElementById('charCount');
        
        // Inspiration
        this.elements.inspirationBtn = document.getElementById('inspirationBtn');
        this.elements.inspirationPanel = document.getElementById('inspirationPanel');
        this.elements.closeInspirationBtn = document.getElementById('closeInspirationBtn');
        this.elements.inspirationItems = document.querySelectorAll('.inspiration-item');
        
        // Output section
        this.elements.outputArea = document.getElementById('outputArea');
        this.elements.maximizeOutputBtn = document.getElementById('maximizeOutputBtn');
        this.elements.copyOutputBtn = document.getElementById('copyOutputBtn');
        this.elements.speakOutputBtn = document.getElementById('speakOutputBtn');
        this.elements.savePromptBtn = document.getElementById('savePromptBtn');
        this.elements.generationInfo = document.getElementById('generationInfo');
        this.elements.generationTime = document.getElementById('generationTime');
        this.elements.usedModel = document.getElementById('usedModel');
        this.elements.tokenCount = document.getElementById('tokenCount');
        
        // Step cards
        this.elements.step1Card = document.querySelector('.step-1');
        this.elements.step2Card = document.querySelector('.step-2');
        this.elements.step3Card = document.querySelector('.step-3');
        
        // Action buttons
        this.elements.generateBtn = document.getElementById('generateBtn');
        this.elements.resetBtn = document.getElementById('resetBtn');
        
        // API status
        this.elements.apiStatusIndicator = document.getElementById('apiStatusIndicator');
        this.elements.apiStatusText = document.getElementById('apiStatusText');
        this.elements.apiDot = document.getElementById('apiDot');
        this.elements.apiMessage = document.getElementById('apiMessage');
        this.elements.apiDetails = document.getElementById('apiDetails');
        this.elements.apiEndpoint = document.getElementById('apiEndpoint');
        this.elements.apiStatusDetail = document.getElementById('apiStatusDetail');
        
        // Platform cards
        this.elements.platformCards = document.querySelectorAll('.platform-card');
        
        // Settings
        this.elements.settingsBtn = document.getElementById('settingsBtn');
        this.elements.settingsModal = document.getElementById('settingsModal');
        this.elements.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.elements.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.elements.cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        
        // Fullscreen editor
        this.elements.fullScreenEditor = document.getElementById('fullScreenEditor');
        this.elements.editorTextarea = document.getElementById('editorTextarea');
        this.elements.generateFromEditorBtn = document.getElementById('generateFromEditorBtn');
        this.elements.exitFullScreenBtn = document.getElementById('exitFullScreenBtn');
        
        // Footer
        this.elements.currentModel = document.getElementById('currentModel');
        this.elements.rateLimit = document.getElementById('rateLimit');
        
        console.log(`✓ Cached ${Object.keys(this.elements).length} elements`);
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Input events
        if (this.elements.userInput) {
            this.elements.userInput.addEventListener('input', (e) => this.handleInputChange(e));
            this.elements.userInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        }
        
        // Input buttons
        if (this.elements.clearInputBtn) {
            this.elements.clearInputBtn.addEventListener('click', () => this.clearInput());
        }
        
        if (this.elements.maximizeInputBtn) {
            this.elements.maximizeInputBtn.addEventListener('click', () => this.maximizeInput());
        }
        
        if (this.elements.voiceInputBtn) {
            this.elements.voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
        }
        
        if (this.elements.undoBtn) {
            this.elements.undoBtn.addEventListener('click', () => this.undo());
        }
        
        if (this.elements.speakInputBtn) {
            this.elements.speakInputBtn.addEventListener('click', () => this.speakInput());
        }
        
        // Inspiration panel
        if (this.elements.inspirationBtn) {
            this.elements.inspirationBtn.addEventListener('click', () => this.toggleInspirationPanel());
        }
        
        if (this.elements.closeInspirationBtn) {
            this.elements.closeInspirationBtn.addEventListener('click', () => this.closeInspirationPanel());
        }
        
        if (this.elements.inspirationItems) {
            this.elements.inspirationItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const template = e.currentTarget.dataset.template;
                    this.applyTemplate(template);
                });
            });
        }
        
        // Action buttons
        if (this.elements.generateBtn) {
            this.elements.generateBtn.addEventListener('click', () => this.generatePrompt());
        }
        
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.resetApp());
        }
        
        // Output buttons
        if (this.elements.maximizeOutputBtn) {
            this.elements.maximizeOutputBtn.addEventListener('click', () => this.maximizeOutput());
        }
        
        if (this.elements.copyOutputBtn) {
            this.elements.copyOutputBtn.addEventListener('click', () => this.copyOutput());
        }
        
        if (this.elements.speakOutputBtn) {
            this.elements.speakOutputBtn.addEventListener('click', () => this.speakOutput());
        }
        
        if (this.elements.savePromptBtn) {
            this.elements.savePromptBtn.addEventListener('click', () => this.savePrompt());
        }
        
        // Platform cards
        if (this.elements.platformCards) {
            this.elements.platformCards.forEach(card => {
                card.addEventListener('click', (e) => {
                    const platform = e.currentTarget.dataset.platform;
                    this.openPlatform(platform);
                });
            });
        }
        
        // Settings modal
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        }
        
        if (this.elements.closeSettingsBtn) {
            this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        }
        
        if (this.elements.cancelSettingsBtn) {
            this.elements.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
        }
        
        if (this.elements.saveSettingsBtn) {
            this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        
        // Fullscreen editor
        if (this.elements.generateFromEditorBtn) {
            this.elements.generateFromEditorBtn.addEventListener('click', () => this.generateFromEditor());
        }
        
        if (this.elements.exitFullScreenBtn) {
            this.elements.exitFullScreenBtn.addEventListener('click', () => this.exitFullScreen());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        console.log('✓ Event listeners bound');
    }
    
    /**
     * Handle input changes
     */
    handleInputChange(e) {
        const text = this.elements.userInput.value;
        this.state.userInput = text;
        
        // Update character count
        if (this.elements.charCount) {
            this.elements.charCount.textContent = text.length;
            this.elements.charCount.style.color = text.length > 4000 ? '#F59E0B' : '#64748B';
        }
        
        // Update undo/redo stacks
        if (text !== this.state.lastInput) {
            if (this.state.lastInput !== '') {
                this.state.undoStack.push(this.state.lastInput);
            }
            this.state.lastInput = text;
            this.state.redoStack = [];
        }
        
        // Update button states
        this.updateButtonStates();
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter to generate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.generatePrompt();
        }
        
        // Escape to close panels
        if (e.key === 'Escape') {
            if (this.state.inspirationPanelOpen) {
                this.closeInspirationPanel();
            }
            if (this.state.isMaximized) {
                this.exitFullScreen();
            }
            if (this.elements.settingsModal && this.elements.settingsModal.style.display === 'block') {
                this.closeSettings();
            }
        }
    }
    
    /**
     * Handle input keydown
     */
    handleInputKeydown(e) {
        // Ctrl/Cmd + Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }
        
        // Ctrl/Cmd + Shift + Z for redo
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
            e.preventDefault();
            this.redo();
        }
    }
    
    /**
     * Clear input textarea
     */
    clearInput() {
        this.elements.userInput.value = '';
        this.handleInputChange();
        this.showNotification('Input cleared', 'info');
    }
    
    /**
     * Undo last change
     */
    undo() {
        if (this.state.undoStack.length > 0) {
            const current = this.elements.userInput.value;
            this.state.redoStack.push(current);
            
            const previous = this.state.undoStack.pop();
            this.elements.userInput.value = previous;
            this.handleInputChange();
            
            this.showNotification('Undo applied', 'info');
        }
    }
    
    /**
     * Redo last undo
     */
    redo() {
        if (this.state.redoStack.length > 0) {
            const current = this.elements.userInput.value;
            this.state.undoStack.push(current);
            
            const next = this.state.redoStack.pop();
            this.elements.userInput.value = next;
            this.handleInputChange();
            
            this.showNotification('Redo applied', 'info');
        }
    }
    
    /**
     * Maximize input editor
     */
    maximizeInput() {
        this.state.isMaximized = true;
        this.elements.editorTextarea.value = this.state.userInput;
        this.elements.fullScreenEditor.style.display = 'flex';
        
        // Focus and select text
        setTimeout(() => {
            this.elements.editorTextarea.focus();
            this.elements.editorTextarea.select();
        }, 100);
    }
    
    /**
     * Maximize output editor
     */
    maximizeOutput() {
        this.state.isMaximized = true;
        this.elements.editorTextarea.value = this.state.generatedPrompt;
        this.elements.fullScreenEditor.style.display = 'flex';
        
        // Hide generate button for output
        this.elements.generateFromEditorBtn.style.display = 'none';
        
        // Focus and select text
        setTimeout(() => {
            this.elements.editorTextarea.focus();
            this.elements.editorTextarea.select();
        }, 100);
    }
    
    /**
     * Exit fullscreen editor
     */
    exitFullScreen() {
        this.state.isMaximized = false;
        this.elements.fullScreenEditor.style.display = 'none';
        
        // Show generate button again
        this.elements.generateFromEditorBtn.style.display = 'flex';
    }
    
    /**
     * Generate from fullscreen editor
     */
    generateFromEditor() {
        const text = this.elements.editorTextarea.value;
        this.elements.userInput.value = text;
        this.handleInputChange();
        this.exitFullScreen();
        this.generatePrompt();
    }
    
    /**
     * Toggle voice input
     */
    toggleVoiceInput() {
        if (!window.speechService) {
            this.showNotification('Voice input not available', 'error');
            return;
        }
        
        if (this.state.isListening) {
            window.speechService.stopListening();
            this.state.isListening = false;
            this.elements.voiceInputBtn.classList.remove('active');
        } else {
            if (window.speechService.startListening()) {
                this.state.isListening = true;
                this.elements.voiceInputBtn.classList.add('active');
                this.showNotification('Listening... Speak now', 'info');
            } else {
                this.showNotification('Voice input not available', 'error');
            }
        }
    }
    
    /**
     * Handle voice input result
     */
    handleVoiceInput(transcript) {
        this.elements.userInput.value += ' ' + transcript;
        this.handleInputChange();
        this.showNotification('Voice input added', 'success');
    }
    
    /**
     * Handle voice input error
     */
    handleVoiceError(error) {
        this.showNotification(`Voice input error: ${error}`, 'error');
    }
    
    /**
     * Speak input text
     */
    speakInput() {
        const text = this.elements.userInput.value.trim();
        if (!text) {
            this.showNotification('No text to speak', 'warning');
            return;
        }
        
        if (window.speechService && window.speechService.speak(text)) {
            this.state.isSpeaking = true;
            this.elements.speakInputBtn.classList.add('active');
            this.showNotification('Speaking input text...', 'info');
        } else {
            this.showNotification('Speech output not available', 'error');
        }
    }
    
    /**
     * Speak output text
     */
    speakOutput() {
        const text = this.state.generatedPrompt.trim();
        if (!text) {
            this.showNotification('No output to speak', 'warning');
            return;
        }
        
        if (window.speechService && window.speechService.speak(text)) {
            this.state.isSpeaking = true;
            this.elements.speakOutputBtn.classList.add('active');
            this.showNotification('Speaking output text...', 'info');
        } else {
            this.showNotification('Speech output not available', 'error');
        }
    }
    
    /**
     * Toggle inspiration panel
     */
    toggleInspirationPanel() {
        if (this.state.inspirationPanelOpen) {
            this.closeInspirationPanel();
        } else {
            this.openInspirationPanel();
        }
    }
    
    /**
     * Open inspiration panel
     */
    openInspirationPanel() {
        this.state.inspirationPanelOpen = true;
        this.elements.inspirationPanel.style.display = 'block';
        this.elements.inspirationBtn.classList.add('active');
    }
    
    /**
     * Close inspiration panel
     */
    closeInspirationPanel() {
        this.state.inspirationPanelOpen = false;
        this.elements.inspirationPanel.style.display = 'none';
        this.elements.inspirationBtn.classList.remove('active');
    }
    
    /**
     * Apply template from inspiration panel
     */
    applyTemplate(template) {
        const templates = {
            email: `Write a professional email to [Recipient] about [Subject].\n\nInclude:\n- Clear subject line\n- Professional greeting\n- Main purpose\n- Supporting details\n- Call to action\n- Professional closing\n\nTone: Professional and respectful`,
            
            code: `Write a [Language] function that [Purpose].\n\nRequirements:\n- Input: [Parameters]\n- Output: [Return type]\n- Error handling: [Approach]\n- Performance: [Considerations]\n- Include comments\n\nExample usage:\n[Example]`,
            
            analysis: `Analyze [Dataset/Report] and provide insights.\n\nInclude:\n1. Key trends and patterns\n2. Statistical summary\n3. Significant anomalies\n4. Comparative analysis\n5. Recommendations\n6. Visualizations needed\n\nFocus on actionable insights.`,
            
            creative: `Write a [Type - story/poem/article] about [Topic].\n\nInclude:\n1. Engaging opening\n2. Character/context development\n3. Core narrative\n4. Emotional tone: [Specify]\n5. Vivid descriptions\n6. Satisfying conclusion\n\nLength: [Number] words.`,
            
            business: `Develop a business strategy for [Project] to achieve [Goal].\n\nConsider:\n1. Market position\n2. SWOT analysis\n3. Target audience\n4. Competitive advantage\n5. Timeline\n6. KPIs\n7. Risk mitigation`,
            
            learning: `Create a learning plan for [Skill/Topic].\n\nInclude:\n1. Prerequisites\n2. Learning resources\n3. Practical exercises\n4. Milestones\n5. Assessment methods\n6. Common pitfalls\n\nTarget: [Level]`
        };
        
        if (templates[template]) {
            this.elements.userInput.value = templates[template];
            this.handleInputChange();
            this.closeInspirationPanel();
            this.showNotification(`${template} template applied`, 'success');
        }
    }
    
    /**
     * Generate prompt using AI
     */
    async generatePrompt() {
        const input = this.elements.userInput.value.trim();
        
        // Validate input
        if (!input) {
            this.showNotification('Please enter a task description first', 'error');
            return;
        }
        
        if (input.length < 5) {
            this.showNotification('Please enter a more detailed description', 'warning');
            return;
        }
        
        // Disable generate button and show loading
        this.elements.generateBtn.disabled = true;
        this.elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        try {
            this.showNotification('Generating optimized prompt...', 'info');
            
            // Check if API service is available
            if (!window.apiService || !window.apiService.generatePrompt) {
                // Try to create it if it doesn't exist
                if (window.APIService) {
                    window.apiService = new window.APIService();
                } else {
                    throw new Error('API service not available');
                }
            }
            
            // Call API
            const startTime = Date.now();
            const result = await window.apiService.generatePrompt(input, this.state.currentModel);
            const responseTime = Date.now() - startTime;
            
            if (result && result.prompt) {
                // Update state
                this.state.generatedPrompt = result.prompt;
                this.state.currentStep = 2;
                this.state.generationStats = {
                    time: responseTime / 1000,
                    model: result.model || this.state.currentModel,
                    tokens: result.usage?.total_tokens || Math.floor(result.prompt.length / 4)
                };
                
                // Update UI
                this.elements.outputArea.textContent = result.prompt;
                this.elements.generationTime.textContent = this.state.generationStats.time.toFixed(2);
                this.elements.usedModel.textContent = result.model || this.state.currentModel;
                this.elements.tokenCount.textContent = this.state.generationStats.tokens;
                
                // Show step 2 and 3
                this.elements.step2Card.style.display = 'block';
                this.elements.step3Card.style.display = 'block';
                this.elements.generationInfo.style.display = 'flex';
                
                // Update footer
                this.elements.currentModel.textContent = result.model || this.state.currentModel;
                
                // Update button states
                this.elements.generateBtn.style.display = 'none';
                this.elements.resetBtn.style.display = 'flex';
                
                this.showNotification('Prompt generated successfully!', 'success');
                
                // Scroll to output
                setTimeout(() => {
                    this.elements.step2Card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
                
            } else {
                throw new Error('Invalid response from API');
            }
            
        } catch (error) {
            console.error('Prompt generation error:', error);
            
            let errorMessage = 'Failed to generate prompt';
            if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
                errorMessage = 'Connection error. Please check API configuration.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server. Please check your internet connection.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Request timeout. Please try again.';
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            this.showNotification(errorMessage, 'error');
            
            // Fallback: Create a simple prompt
            this.state.generatedPrompt = `Prompt (Fallback Mode):

Role: AI Assistant
Objective: ${input}
Instructions: Please provide a detailed response to the above request.

Note: Generated in fallback mode due to: ${error.message.substring(0, 100)}...`;
            
            this.elements.outputArea.textContent = this.state.generatedPrompt;
            this.state.currentStep = 2;
            this.elements.step2Card.style.display = 'block';
            this.elements.step3Card.style.display = 'block';
            this.elements.generationInfo.style.display = 'none';
            this.elements.generateBtn.style.display = 'none';
            this.elements.resetBtn.style.display = 'flex';
            
        } finally {
            // Re-enable generate button
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Prompt';
        }
    }
    
    /**
     * Copy output to clipboard
     */
    async copyOutput() {
        const text = this.state.generatedPrompt;
        if (!text) {
            this.showNotification('No prompt to copy', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Prompt copied to clipboard', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showNotification('Failed to copy prompt', 'error');
        }
    }
    
    /**
     * Save prompt to file
     */
    savePrompt() {
        const text = this.state.generatedPrompt;
        if (!text) {
            this.showNotification('No prompt to save', 'warning');
            return;
        }
        
        const filename = `prompt-${new Date().toISOString().split('T')[0]}.txt`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Prompt saved as text file', 'success');
    }
    
    /**
     * Open platform with prompt
     */
    async openPlatform(platformId) {
        const prompt = this.state.generatedPrompt;
        if (!prompt) {
            this.showNotification('Generate a prompt first', 'warning');
            return;
        }
        
        if (window.platforms && window.platforms.openPlatform) {
            const success = await window.platforms.openPlatform(platformId, prompt);
            if (!success) {
                this.showNotification('Failed to open platform', 'error');
            }
        } else {
            this.showNotification('Platform integration not available', 'error');
        }
    }
    
    /**
     * Reset application
     */
    resetApp() {
        // Clear input
        this.elements.userInput.value = '';
        this.handleInputChange();
        
        // Clear output
        this.state.generatedPrompt = '';
        this.elements.outputArea.textContent = '';
        
        // Reset steps
        this.state.currentStep = 1;
        this.elements.step2Card.style.display = 'none';
        this.elements.step3Card.style.display = 'none';
        this.elements.generationInfo.style.display = 'none';
        
        // Reset buttons
        this.elements.generateBtn.style.display = 'flex';
        this.elements.resetBtn.style.display = 'none';
        
        // Close panels
        this.closeInspirationPanel();
        
        this.showNotification('Application reset', 'info');
    }
    
    /**
     * Check API status
     */
    async checkAPIStatus() {
        try {
            this.updateAPIStatus('checking', 'Checking API connection...');
            
            if (window.apiService && window.apiService.checkHealth) {
                const result = await window.apiService.checkHealth();
                
                if (result.online) {
                    this.state.apiStatus = 'online';
                    this.updateAPIStatus('online', `API Connected${result.latency ? ` (${result.latency}ms)` : ''}`);
                } else {
                    this.state.apiStatus = 'offline';
                    this.updateAPIStatus('offline', 'API Offline - Using fallback mode');
                }
            } else {
                this.state.apiStatus = 'offline';
                this.updateAPIStatus('offline', 'API Service not available');
            }
            
        } catch (error) {
            this.state.apiStatus = 'offline';
            this.updateAPIStatus('offline', 'API Connection failed');
            console.error('API check failed:', error);
        }
    }
    
    /**
     * Update API status display
     */
    updateAPIStatus(status, message) {
        if (this.elements.apiStatusIndicator) {
            this.elements.apiStatusIndicator.className = `status-indicator ${status}`;
        }
        
        if (this.elements.apiStatusText) {
            this.elements.apiStatusText.textContent = 
                status === 'online' ? 'API Online' : 
                status === 'offline' ? 'API Offline' : 'Checking...';
        }
        
        if (this.elements.apiDot) {
            this.elements.apiDot.className = `status-dot ${status}`;
        }
        
        if (this.elements.apiMessage) {
            this.elements.apiMessage.textContent = message;
        }
        
        if (this.elements.apiDetails) {
            this.elements.apiDetails.style.display = 'block';
        }
        
        if (this.elements.apiEndpoint) {
            this.elements.apiEndpoint.textContent = window.Config ? window.Config.API.ENDPOINT : 'https://promptcraft-api.vijay-shagunkumar.workers.dev';
        }
        
        if (this.elements.apiStatusDetail) {
            this.elements.apiStatusDetail.textContent = status;
            this.elements.apiStatusDetail.style.color = 
                status === 'online' ? '#10B981' : 
                status === 'offline' ? '#EF4444' : '#F59E0B';
        }
    }
    
    /**
     * Open settings modal
     */
    openSettings() {
        this.elements.settingsModal.style.display = 'flex';
        this.loadSettingsIntoForm();
    }
    
    /**
     * Close settings modal
     */
    closeSettings() {
        this.elements.settingsModal.style.display = 'none';
    }
    
    /**
     * Load settings into form
     */

        /**
     * Load settings into form
     */
    loadSettingsIntoForm() {
        // Get current theme
        const currentTheme = window.themeManager ? window.themeManager.getTheme() : 'auto';
        
        // Only show models that are actually available in your Worker
        // Based on your Worker health check, you have:
        // - gemini-3-flash-preview (Gemini 3 Flash)
        // - gpt-4o-mini (GPT-4o Mini)
        // - llama-3.1-8b-instant (Llama 3.1 8B Instant)
        // Remove Claude since you don't have it configured
        
        const availableModels = [
            { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
            { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' }
        ];
        
        const modalBody = this.elements.settingsModal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="settings-group">
                    <h3><i class="fas fa-plug"></i> API Settings</h3>
                    <div class="setting-item">
                        <label>API Endpoint</label>
                        <input type="text" class="settings-input" value="${window.Config ? window.Config.API.ENDPOINT : 'https://promptcraft-api.vijay-shagunkumar.workers.dev'}" readonly>
                        <small>Cloudflare Worker endpoint</small>
                    </div>
                    <div class="setting-item">
                        <label>Default AI Model</label>
                        <select id="settingsModel" class="settings-select">
                            ${availableModels.map(model => `
                                <option value="${model.id}" ${this.state.currentModel === model.id ? 'selected' : ''}>
                                    ${model.name}
                                </option>
                            `).join('')}
                        </select>
                        <small>Select which AI model to use for prompt generation</small>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3><i class="fas fa-palette"></i> Appearance</h3>
                    <div class="setting-item">
                        <label>Theme</label>
                        <select id="settingsTheme" class="settings-select">
                            <option value="auto" ${currentTheme === 'auto' ? 'selected' : ''}>Auto (System)</option>
                            <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                        <small>Choose light, dark, or auto (follows system)</small>
                    </div>
                    <div class="setting-item">
                        <label>Animations</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="settingsAnimations" checked>
                            <span class="toggle-slider"></span>
                        </div>
                        <small>Enable/disable UI animations</small>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3><i class="fas fa-bell"></i> Notifications</h3>
                    <div class="setting-item">
                        <label>Show Notifications</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="settingsNotifications" checked>
                            <span class="toggle-slider"></span>
                        </div>
                        <small>Show success/error notifications</small>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3><i class="fas fa-microphone"></i> Voice Features</h3>
                    <div class="setting-item">
                        <label>Voice Input</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="settingsVoiceInput" ${window.speechService ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </div>
                        <small>Enable voice input (browser permission required)</small>
                    </div>
                    <div class="setting-item">
                        <label>Text-to-Speech</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="settingsTextToSpeech" ${window.speechService ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </div>
                        <small>Enable reading prompts aloud</small>
                    </div>
                </div>
            `;
        }
    }
    /**
     * Save settings
     */
    /**
     * Save settings
     */
    saveSettings() {
        const modelSelect = document.getElementById('settingsModel');
        const themeSelect = document.getElementById('settingsTheme');
        const animationsCheckbox = document.getElementById('settingsAnimations');
        const notificationsCheckbox = document.getElementById('settingsNotifications');
        const voiceInputCheckbox = document.getElementById('settingsVoiceInput');
        const textToSpeechCheckbox = document.getElementById('settingsTextToSpeech');
        
        // Save model
        if (modelSelect) {
            this.state.currentModel = modelSelect.value;
            if (this.elements.currentModel) {
                const modelName = modelSelect.options[modelSelect.selectedIndex].text;
                this.elements.currentModel.textContent = modelName;
            }
        }
        
        // Save theme
        if (themeSelect && window.themeManager) {
            window.themeManager.setTheme(themeSelect.value);
        }
        
        // Save other settings to localStorage
        const settings = {
            model: this.state.currentModel,
            theme: window.themeManager ? window.themeManager.getTheme() : 'auto',
            animations: animationsCheckbox ? animationsCheckbox.checked : true,
            notifications: notificationsCheckbox ? notificationsCheckbox.checked : true,
            voiceInput: voiceInputCheckbox ? voiceInputCheckbox.checked : false,
            textToSpeech: textToSpeechCheckbox ? textToSpeechCheckbox.checked : false,
            savedAt: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('promptcraft_settings', JSON.stringify(settings));
            console.log('Settings saved:', settings);
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
        
        this.closeSettings();
        this.showNotification('Settings saved successfully', 'success');
    }
    
    /**
     * Load saved settings
     */
    loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem('promptcraft_settings') || '{}');
            
            if (saved.model) {
                this.state.currentModel = saved.model;
                if (this.elements.currentModel) {
                    // Simple model name mapping
                    const modelNames = {
                        'gemini-3-flash-preview': 'Gemini 3 Flash',
                        'gpt-4o-mini': 'GPT-4o Mini',
                        'claude-3-haiku': 'Claude 3 Haiku'
                    };
                    this.elements.currentModel.textContent = modelNames[saved.model] || saved.model;
                }
            }
            
            if (saved.theme && window.themeManager) {
                window.themeManager.setTheme(saved.theme);
            }
            
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    }
    
    /**
     * Update button states based on current state
     */
    updateButtonStates() {
        const hasInput = this.state.userInput.trim().length > 0;
        const hasOutput = this.state.generatedPrompt.trim().length > 0;
        
        // Input buttons
        if (this.elements.clearInputBtn) {
            this.elements.clearInputBtn.disabled = !hasInput && !hasOutput;
        }
        
        if (this.elements.undoBtn) {
            this.elements.undoBtn.disabled = this.state.undoStack.length === 0;
        }
        
        if (this.elements.speakInputBtn) {
            this.elements.speakInputBtn.disabled = !hasInput;
        }
        
        // Output buttons
        if (this.elements.copyOutputBtn) {
            this.elements.copyOutputBtn.disabled = !hasOutput;
        }
        
        if (this.elements.speakOutputBtn) {
            this.elements.speakOutputBtn.disabled = !hasOutput;
        }
        
        if (this.elements.savePromptBtn) {
            this.elements.savePromptBtn.disabled = !hasOutput;
        }
        
        if (this.elements.maximizeOutputBtn) {
            this.elements.maximizeOutputBtn.disabled = !hasOutput;
        }
        
        // Generate button
        if (this.elements.generateBtn) {
            this.elements.generateBtn.disabled = !hasInput;
        }
    }
    
    /**
     * Update UI based on current state
     */
    updateUI() {
        this.updateButtonStates();
        
        // Update progress steps
        document.querySelectorAll('.step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            if (stepNum <= this.state.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Update API status indicator color
        if (this.elements.apiStatusIndicator) {
            this.elements.apiStatusIndicator.className = `status-indicator ${this.state.apiStatus}`;
        }
    }
    
    /**
     * Show notification (with fallback)
     */
    showNotification(message, type = 'info', duration = 3000) {
        if (window.showNotification) {
            window.showNotification(message, type, duration);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Make globally available
window.PromptCraftApp = PromptCraftApp;
console.log('PromptCraftApp class loaded');
