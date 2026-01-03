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
            currentModel: Config.getDefaultModel(),
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
        
        // Services
        this.api = apiService;
        this.speech = speechService;
        this.platforms = platforms;
        this.theme = themeManager;
        this.notifications = notifications;
        
        // Initialize
        this.init();
    }
    // Add this method to your PromptCraftApp class

    /**
     * Initialize the application
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettings();
        this.checkAPIStatus();
        this.updateUI();
        
        Config.info('PromptCraft Pro initialized');
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
        
        // Speech events
        window.addEventListener('speech:listeningresult', (e) => this.handleVoiceInput(e.detail.transcript));
        window.addEventListener('speech:listeningerror', (e) => this.handleVoiceError(e.detail.error));
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
            if (this.elements.settingsModal.style.display === 'block') {
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
        showNotification('Input cleared', 'info');
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
            
            showNotification('Undo applied', 'info');
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
            
            showNotification('Redo applied', 'info');
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
        if (this.state.isListening) {
            this.speech.stopListening();
            this.state.isListening = false;
            this.elements.voiceInputBtn.classList.remove('active');
        } else {
            if (this.speech.startListening()) {
                this.state.isListening = true;
                this.elements.voiceInputBtn.classList.add('active');
                showNotification('Listening... Speak now', 'info');
            } else {
                showNotification('Voice input not available', 'error');
            }
        }
    }
    
    /**
     * Handle voice input result
     */
    handleVoiceInput(transcript) {
        this.elements.userInput.value += ' ' + transcript;
        this.handleInputChange();
        showNotification('Voice input added', 'success');
    }
    
    /**
     * Handle voice input error
     */
    handleVoiceError(error) {
        showNotification(`Voice input error: ${error}`, 'error');
    }
    
    /**
     * Speak input text
     */
    speakInput() {
        const text = this.elements.userInput.value.trim();
        if (!text) {
            showNotification('No text to speak', 'warning');
            return;
        }
        
        if (this.speech.speak(text)) {
            this.state.isSpeaking = true;
            this.elements.speakInputBtn.classList.add('active');
            showNotification('Speaking input text...', 'info');
        }
    }
    
    /**
     * Speak output text
     */
    speakOutput() {
        const text = this.state.generatedPrompt.trim();
        if (!text) {
            showNotification('No output to speak', 'warning');
            return;
        }
        
        if (this.speech.speak(text)) {
            this.state.isSpeaking = true;
            this.elements.speakOutputBtn.classList.add('active');
            showNotification('Speaking output text...', 'info');
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
            showNotification(`${template} template applied`, 'success');
        }
    }
    
    /**
     * Generate prompt using AI
     */
    async generatePrompt() {
        const input = this.elements.userInput.value.trim();
        
        // Validate input
        const validation = Config.validatePrompt(input);
        if (!validation.valid) {
            showNotification(validation.error, 'error');
            return;
        }
        
        // Disable generate button and show loading
        this.elements.generateBtn.disabled = true;
        this.elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        try {
            showNotification('Generating prompt...', 'info');
            
            // Call API
            const result = await this.api.generatePrompt(input, {
                model: this.state.currentModel
            });
            
            if (result.success) {
                // Update state
                this.state.generatedPrompt = result.content;
                this.state.currentStep = 2;
                this.state.generationStats = {
                    time: result.responseTime / 1000,
                    model: result.model,
                    tokens: result.usage?.total_tokens || Math.floor(result.content.length / 4)
                };
                
                // Update UI
                this.elements.outputArea.textContent = result.content;
                this.elements.generationTime.textContent = this.state.generationStats.time.toFixed(2);
                this.elements.usedModel.textContent = Config.getModelDisplayName(result.model);
                this.elements.tokenCount.textContent = this.state.generationStats.tokens;
                
                // Show step 2 and 3
                this.elements.step2Card.style.display = 'block';
                this.elements.step3Card.style.display = 'block';
                this.elements.generationInfo.style.display = 'flex';
                
                // Update footer
                this.elements.currentModel.textContent = Config.getModelDisplayName(result.model);
                
                // Update button states
                this.elements.generateBtn.style.display = 'none';
                this.elements.resetBtn.style.display = 'flex';
                
                showNotification('Prompt generated successfully!', 'success');
                
                // Scroll to output
                setTimeout(() => {
                    this.elements.step2Card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
                
            } else {
                // Use fallback
                this.state.generatedPrompt = this.api.generateFallbackPrompt(input);
                this.elements.outputArea.textContent = this.state.generatedPrompt;
                this.state.currentStep = 2;
                
                // Show steps
                this.elements.step2Card.style.display = 'block';
                this.elements.step3Card.style.display = 'block';
                
                // Hide generation info for fallback
                this.elements.generationInfo.style.display = 'none';
                
                // Update button states
                this.elements.generateBtn.style.display = 'none';
                this.elements.resetBtn.style.display = 'flex';
                
                showNotification('Generated with fallback (API offline)', 'warning');
            }
            
        } catch (error) {
            Config.error('Prompt generation error:', error);
            showNotification('Failed to generate prompt', 'error');
            
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
            showNotification('No prompt to copy', 'warning');
            return;
        }
        
        const success = await Utils.copyToClipboard(text);
        if (success) {
            showNotification('Prompt copied to clipboard', 'success');
        } else {
            showNotification('Failed to copy prompt', 'error');
        }
    }
    
    /**
     * Save prompt to file
     */
    savePrompt() {
        const text = this.state.generatedPrompt;
        if (!text) {
            showNotification('No prompt to save', 'warning');
            return;
        }
        
        const filename = `prompt-${new Date().toISOString().split('T')[0]}.txt`;
        Utils.downloadFile(text, filename);
        showNotification('Prompt saved as text file', 'success');
    }
    
    /**
     * Open platform with prompt
     */
    async openPlatform(platformId) {
        const prompt = this.state.generatedPrompt;
        if (!prompt) {
            showNotification('Generate a prompt first', 'warning');
            return;
        }
        
        const success = await this.platforms.openPlatform(platformId, prompt);
        if (!success) {
            showNotification('Failed to open platform', 'error');
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
        
        showNotification('Application reset', 'info');
    }
    
    /**
     * Check API status
     */
    async checkAPIStatus() {
        try {
            this.updateAPIStatus('checking', 'Checking API connection...');
            
            const result = await this.api.testConnection();
            
            if (result.online) {
                this.state.apiStatus = 'online';
                this.updateAPIStatus('online', `API Connected (${result.responseTime}ms)`);
                
                // Update rate limit
                const rateLimit = this.api.getRateLimitStatus();
                this.elements.rateLimit.textContent = 
                    `${rateLimit.minuteRemaining}/${rateLimit.minuteLimit} (min)`;
                    
            } else {
                this.state.apiStatus = 'offline';
                this.updateAPIStatus('offline', 'API Offline - Using fallback mode');
            }
            
        } catch (error) {
            this.state.apiStatus = 'offline';
            this.updateAPIStatus('offline', 'API Connection failed');
            Config.error('API check failed:', error);
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
            this.elements.apiEndpoint.textContent = Config.getApiUrl();
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
    loadSettingsIntoForm() {
        // Load from localStorage or use defaults
        const settings = JSON.parse(localStorage.getItem(Config.getStorageKey('settings')) || '{}');
        
        // This would populate form fields with saved settings
        // For now, just show a basic settings form
        this.elements.settingsModal.querySelector('.modal-body').innerHTML = `
            <div class="settings-group">
                <h3><i class="fas fa-plug"></i> API Settings</h3>
                <div class="setting-item">
                    <label>API Endpoint</label>
                    <input type="text" value="${Config.getApiUrl()}" disabled>
                    <small>Cloudflare Worker endpoint</small>
                </div>
                <div class="setting-item">
                    <label>Default Model</label>
                    <select id="settingsModel">
                        ${Config.getAvailableModels().map(model => `
                            <option value="${model.id}" ${model.id === this.state.currentModel ? 'selected' : ''}>
                                ${model.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="settings-group">
                <h3><i class="fas fa-palette"></i> Appearance</h3>
                <div class="setting-item">
                    <label>Theme</label>
                    <select id="settingsTheme">
                        <option value="auto">Auto (System)</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    /**
     * Save settings
     */
    saveSettings() {
        const model = document.getElementById('settingsTheme')?.value;
        const theme = document.getElementById('settingsTheme')?.value;
        
        if (model) {
            this.state.currentModel = model;
            this.elements.currentModel.textContent = Config.getModelDisplayName(model);
        }
        
        if (theme) {
            this.theme.setTheme(theme);
        }
        
        // Save to localStorage
        localStorage.setItem(Config.getStorageKey('settings'), JSON.stringify({
            model: this.state.currentModel,
            theme: this.theme.getTheme()
        }));
        
        this.closeSettings();
        showNotification('Settings saved', 'success');
    }
    
    /**
     * Load saved settings
     */
    loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(Config.getStorageKey('settings')) || '{}');
            
            if (saved.model && Config.isValidModel(saved.model)) {
                this.state.currentModel = saved.model;
                this.elements.currentModel.textContent = Config.getModelDisplayName(saved.model);
            }
            
            if (saved.theme) {
                this.theme.setTheme(saved.theme);
            }
            
        } catch (error) {
            Config.warn('Failed to load settings:', error);
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
}

// Make globally available
window.PromptCraftApp = PromptCraftApp;
