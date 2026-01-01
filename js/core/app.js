// app.js - Complete version with ALL services integrated
(function() {
    'use strict';
    
    class PromptCraftApp {
        constructor() {
            console.log('PromptCraft Pro initializing...');
            
            // Initialize all services
            this.state = new AppState();
            this.storageService = new StorageService();
            this.settingsService = new SettingsService();
            this.apiService = new ApiService();
            this.voiceManager = new VoiceManager();
            this.themeManager = new ThemeManager();
            this.historyManager = new HistoryManager();
            this.templateManager = new TemplateManager();
            this.notificationService = new NotificationService();
            this.promptGenerator = new PromptGenerator();
            this.aiRanker = new AIRanker();
            
            // Processing state
            this.processingState = {
                isProcessing: false,
                isMaximized: false,
                maximizeType: null,
                lastPromptState: '',
                currentModel: null,
                currentStyle: 'detailed'
            };
            
            this.elements = {};
            this.currentPromptId = null;
            
            this.init();
        }

        async init() {
            console.log('Initializing services...');
            
            // Initialize services
            await this.voiceManager.initialize();
            await this.loadSettings();
            await this.applyTheme();
            await this.initializeUI();
            
            // Test API connection
            const isApiOnline = await this.testApiConnection();
            this.updateApiStatus(isApiOnline);
            
            // Load initial data
            await this.loadInitialData();
            
            console.log('PromptCraft Pro initialized successfully');
            this.showNotification('PromptCraft Pro loaded!', 'success', 2000);
        }

        initializeUI() {
            this.bindElements();
            this.bindEvents();
            this.setupEventListeners();
            this.updateUIState();
        }

        bindElements() {
            // Core elements
            this.elements = {
                // Input section
                userInput: document.getElementById('userInput'),
                charCounter: document.getElementById('charCounter'),
                micBtn: document.getElementById('micBtn'),
                clearInputBtn: document.getElementById('clearInputBtn'),
                maximizeInputBtn: document.getElementById('maximizeInputBtn'),
                needInspirationBtn: document.getElementById('needInspirationBtn'),
                
                // Output section
                outputSection: document.getElementById('outputSection'),
                outputArea: document.getElementById('outputArea'),
                copyBtn: document.getElementById('copyBtn'),
                speakBtn: document.getElementById('speakBtn'),
                exportBtn: document.getElementById('exportBtn'),
                maximizeOutputBtn: document.getElementById('maximizeOutputBtn'),
                undoPromptBtn: document.getElementById('undoPromptBtn'),
                
                // AI Platforms
                platformsGrid: document.getElementById('platformsGrid'),
                platformsEmptyState: document.getElementById('platformsEmptyState'),
                
                // History
                historyBtn: document.getElementById('historyBtn'),
                historySection: document.getElementById('historySection'),
                historyList: document.getElementById('historyList'),
                closeHistoryBtn: document.getElementById('closeHistoryBtn'),
                
                // Settings
                settingsBtn: document.getElementById('settingsBtn'),
                settingsModal: document.getElementById('settingsModal'),
                closeSettingsBtn: document.getElementById('closeSettingsBtn'),
                saveSettingsBtn: document.getElementById('saveSettingsBtn'),
                cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
                
                // Settings inputs
                themeSelect: document.getElementById('themeSelect'),
                aiModelSelect: document.getElementById('aiModelSelect'),
                promptStyleSelect: document.getElementById('promptStyleSelect'),
                maxHistoryItems: document.getElementById('maxHistoryItems'),
                
                // Inspiration modal
                inspirationModal: document.getElementById('inspirationModal'),
                closeInspirationModalBtn: document.getElementById('closeInspirationModalBtn'),
                inspirationGrid: document.querySelector('.inspiration-grid'),
                
                // Editor
                fullScreenEditor: document.getElementById('fullScreenEditor'),
                editorTextarea: document.getElementById('editorTextarea'),
                closeEditorBtn: document.getElementById('closeEditorBtn'),
                editorPrepareBtn: document.getElementById('editorPrepareBtn'),
                editorInspirationBtn: document.getElementById('editorInspirationBtn'),
                editorTitle: document.getElementById('editorTitle'),
                
                // Sticky buttons
                stickyPrepareBtn: document.getElementById('stickyPrepareBtn'),
                stickyResetBtn: document.getElementById('stickyResetBtn'),
                
                // Footer
                statusText: document.getElementById('statusText'),
                currentModel: document.getElementById('currentModel'),
                currentTheme: document.getElementById('currentTheme'),
                
                // Loading
                globalLoading: document.getElementById('globalLoading'),
                loadingText: document.getElementById('loadingText')
            };
        }

        bindEvents() {
            // Main actions
            this.elements.stickyPrepareBtn.addEventListener('click', () => this.preparePrompt());
            this.elements.stickyResetBtn.addEventListener('click', () => this.resetApplication());
            
            // Input actions
            this.elements.userInput.addEventListener('input', (e) => this.handleInputChange(e));
            this.elements.clearInputBtn.addEventListener('click', () => this.clearInput());
            this.elements.micBtn.addEventListener('click', () => this.toggleVoiceInput());
            this.elements.maximizeInputBtn.addEventListener('click', () => this.openMaximizedView('input'));
            
            // Output actions
            this.elements.copyBtn.addEventListener('click', () => this.copyPrompt());
            this.elements.speakBtn.addEventListener('click', () => this.toggleSpeech());
            this.elements.exportBtn.addEventListener('click', () => this.exportPrompt());
            this.elements.maximizeOutputBtn.addEventListener('click', () => this.openMaximizedView('output'));
            this.elements.undoPromptBtn.addEventListener('click', () => this.undoPrompt());
            
            // Editor actions
            this.elements.closeEditorBtn.addEventListener('click', () => this.closeFullScreenEditor());
            this.elements.editorPrepareBtn.addEventListener('click', () => this.prepareFromEditor());
            this.elements.editorInspirationBtn.addEventListener('click', () => this.showInspirationModal());
            
            // Inspiration
            this.elements.needInspirationBtn.addEventListener('click', () => this.showInspirationModal());
            this.elements.closeInspirationModalBtn.addEventListener('click', () => this.closeInspirationModal());
            
            // Settings
            this.elements.settingsBtn.addEventListener('click', () => this.openSettingsModal());
            this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
            this.elements.cancelSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
            this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
            
            // History
            this.elements.historyBtn.addEventListener('click', () => this.showHistory());
            this.elements.closeHistoryBtn.addEventListener('click', () => this.closeHistory());
        }

        setupEventListeners() {
            // Voice transcript events
            document.addEventListener('voiceTranscript', (e) => {
                this.handleVoiceTranscript(e.detail.transcript);
            });
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
            
            // Window events
            window.addEventListener('beforeunload', () => this.saveCurrentState());
            
            // Settings change detection
            if (this.elements.themeSelect) {
                this.elements.themeSelect.addEventListener('change', () => this.markSettingsChanged());
            }
            if (this.elements.aiModelSelect) {
                this.elements.aiModelSelect.addEventListener('change', () => this.markSettingsChanged());
            }
            if (this.elements.promptStyleSelect) {
                this.elements.promptStyleSelect.addEventListener('change', () => this.markSettingsChanged());
            }
        }

        // ===== CORE FUNCTIONALITY =====

        async preparePrompt() {
            const inputText = this.elements.userInput.value.trim();
            
            // Validation
            if (!inputText) {
                this.showNotification('Please describe your task first', 'error');
                return;
            }
            
            if (inputText.length < 10) {
                this.showNotification('Please provide more details for better results', 'warning');
                return;
            }
            
            // Show loading state
            this.showLoading(true, 'Crafting your perfect prompt...');
            this.processingState.isProcessing = true;
            this.updateButtonStates();
            
            try {
                // Save for undo functionality
                if (this.elements.outputArea.textContent.trim()) {
                    this.processingState.lastPromptState = this.elements.outputArea.innerHTML;
                    this.elements.undoPromptBtn.style.display = 'flex';
                }
                
                // Get settings
                const style = this.settingsService.get('promptStyle') || 'detailed';
                const model = this.settingsService.get('defaultModel') || 'gemini';
                
                console.log('[APP] Calling API with:', { style, model, inputLength: inputText.length });
                
                // Call the API
                const apiResult = await this.apiService.generatePrompt(inputText, style);
                
                if (apiResult.success) {
                    // Display the generated prompt
                    const formattedPrompt = this.formatPromptOutput(apiResult.content, model);
                    this.elements.outputArea.innerHTML = formattedPrompt;
                    
                    // Show output section
                    this.elements.outputSection.classList.add('show');
                    
                    // Update progress
                    this.elements.progressFill.style.width = '66%';
                    
                    // Change button to Reset
                    this.elements.stickyPrepareBtn.classList.add('hidden');
                    this.elements.stickyResetBtn.classList.remove('hidden');
                    
                    // Update model indicator
                    this.elements.currentModel.textContent = this.getModelDisplayName(model);
                    
                    // Add to history
                    const historyItem = {
                        id: Date.now(),
                        input: inputText,
                        prompt: apiResult.content,
                        style: style,
                        model: model,
                        timestamp: new Date().toISOString(),
                        tokens: this.estimateTokenCount(apiResult.content)
                    };
                    
                    this.historyManager.add(historyItem);
                    
                    // Show AI platforms
                    this.showAIPlatforms(apiResult.content);
                    
                    // Show success notification
                    const source = apiResult.fromAPI ? 'AI API' : 'simulated';
                    this.showNotification(`Prompt generated using ${source}!`, 'success');
                    
                    // Update state
                    this.processingState.currentModel = model;
                    this.processingState.currentStyle = style;
                    this.currentPromptId = historyItem.id;
                    
                } else {
                    throw new Error(apiResult.error || 'Failed to generate prompt');
                }
                
            } catch (error) {
                console.error('[APP] Error generating prompt:', error);
                this.showNotification('Failed to generate prompt. Using fallback...', 'error');
                
                // Fallback to local generation
                const fallbackPrompt = this.promptGenerator.generate(inputText, 'detailed');
                this.elements.outputArea.innerHTML = this.formatPromptOutput(fallbackPrompt, 'fallback');
                this.elements.outputSection.classList.add('show');
            } finally {
                // Hide loading state
                this.showLoading(false);
                this.processingState.isProcessing = false;
                this.updateButtonStates();
            }
        }

        showAIPlatforms(promptContent) {
            if (!this.elements.platformsGrid) return;
            
            // Clear existing content
            this.elements.platformsGrid.innerHTML = '';
            this.elements.platformsEmptyState.style.display = 'none';
            
            // Get ranked platforms
            const rankedPlatforms = this.aiRanker.rank(promptContent);
            
            // Create platform cards
            rankedPlatforms.slice(0, 6).forEach((platform, index) => {
                const platformCard = this.createPlatformCard(platform, promptContent, index === 0);
                this.elements.platformsGrid.appendChild(platformCard);
            });
        }

        createPlatformCard(platform, promptContent, isRecommended = false) {
            const card = document.createElement('div');
            card.className = `platform-card ${isRecommended ? 'recommended' : ''}`;
            card.innerHTML = `
                <div class="platform-icon" style="background: ${platform.color}20; border-color: ${platform.color}40;">
                    <i class="${platform.icon}"></i>
                </div>
                <div class="platform-info">
                    <div class="platform-name">
                        ${platform.name}
                        ${isRecommended ? '<span class="recommended-tag">Recommended</span>' : ''}
                    </div>
                    <div class="platform-desc">${platform.description}</div>
                </div>
            `;
            
            card.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(promptContent);
                    this.showNotification(`Prompt copied! Opening ${platform.name}...`, 'success');
                    
                    // Open platform in new tab
                    setTimeout(() => {
                        window.open(platform.launchUrl, '_blank');
                    }, 500);
                    
                } catch (error) {
                    console.error('Failed to copy:', error);
                    this.showNotification('Failed to copy prompt', 'error');
                }
            });
            
            return card;
        }

        // ===== UI MANAGEMENT =====

        showLoading(show, message = 'Processing...') {
            if (show) {
                this.elements.loadingText.textContent = message;
                this.elements.globalLoading.classList.add('show');
            } else {
                this.elements.globalLoading.classList.remove('show');
            }
        }

        showNotification(message, type = 'info', duration = 3000) {
            this.notificationService.show(message, type, duration);
        }

        updateUIState() {
            // Update character counter
            this.updateCharCounter();
            
            // Update button states
            this.updateButtonStates();
            
            // Update footer
            this.updateFooter();
        }

        updateCharCounter() {
            if (!this.elements.userInput || !this.elements.charCounter) return;
            
            const count = this.elements.userInput.value.length;
            this.elements.charCounter.textContent = `${count}/5000`;
            
            if (count > 5000) {
                this.elements.charCounter.style.color = 'var(--danger-color)';
            } else if (count > 4000) {
                this.elements.charCounter.style.color = 'var(--warning-color)';
            } else {
                this.elements.charCounter.style.color = 'var(--text-tertiary)';
            }
        }

        updateButtonStates() {
            const isProcessing = this.processingState.isProcessing;
            
            // Update main buttons
            this.elements.stickyPrepareBtn.disabled = isProcessing;
            this.elements.stickyResetBtn.disabled = isProcessing;
            
            // Update action buttons
            const actionButtons = [
                this.elements.copyBtn,
                this.elements.speakBtn,
                this.elements.exportBtn,
                this.elements.maximizeOutputBtn,
                this.elements.micBtn,
                this.elements.clearInputBtn
            ];
            
            actionButtons.forEach(btn => {
                if (btn) btn.disabled = isProcessing;
            });
        }

        // ===== SETTINGS MANAGEMENT =====

        async loadSettings() {
            try {
                const settings = this.settingsService.load();
                
                // Apply settings to UI
                if (this.elements.themeSelect) {
                    this.elements.themeSelect.value = settings.theme || 'dark';
                }
                if (this.elements.aiModelSelect) {
                    this.elements.aiModelSelect.value = settings.defaultModel || 'gemini';
                }
                if (this.elements.promptStyleSelect) {
                    this.elements.promptStyleSelect.value = settings.promptStyle || 'detailed';
                }
                if (this.elements.maxHistoryItems) {
                    this.elements.maxHistoryItems.value = settings.maxHistoryItems || 25;
                }
                
                console.log('[APP] Settings loaded:', settings);
                
            } catch (error) {
                console.error('[APP] Failed to load settings:', error);
            }
        }

        async applyTheme() {
            const theme = this.settingsService.get('theme') || 'dark';
            await this.themeManager.apply(theme);
        }

        markSettingsChanged() {
            this.elements.saveSettingsBtn.disabled = false;
        }

        saveSettings() {
            const settings = {
                theme: this.elements.themeSelect.value,
                defaultModel: this.elements.aiModelSelect.value,
                promptStyle: this.elements.promptStyleSelect.value,
                maxHistoryItems: parseInt(this.elements.maxHistoryItems.value),
                // Add other settings as needed
                voiceLanguage: this.settingsService.get('voiceLanguage') || 'en-US',
                autoConvert: this.settingsService.get('autoConvert') || true,
                notificationDuration: this.settingsService.get('notificationDuration') || 3000
            };
            
            this.settingsService.save(settings);
            this.applyTheme();
            this.elements.saveSettingsBtn.disabled = true;
            
            this.showNotification('Settings saved successfully!', 'success');
            this.closeSettingsModal();
        }

        // ===== HISTORY MANAGEMENT =====

        showHistory() {
            this.elements.historySection.classList.add('show');
            this.loadHistoryList();
        }

        closeHistory() {
            this.elements.historySection.classList.remove('show');
        }

        loadHistoryList() {
            if (!this.elements.historyList) return;
            
            const historyItems = this.historyManager.getRecent(20);
            
            if (historyItems.length === 0) {
                this.elements.historyList.innerHTML = `
                    <div class="history-empty">
                        <div class="history-empty-icon">
                            <i class="fas fa-history"></i>
                        </div>
                        <p>No prompt history yet</p>
                        <p class="history-empty-hint">Generate some prompts to see them here</p>
                    </div>
                `;
                return;
            }
            
            this.elements.historyList.innerHTML = '';
            
            historyItems.forEach(item => {
                const historyElement = this.createHistoryItem(item);
                this.elements.historyList.appendChild(historyElement);
            });
        }

        createHistoryItem(item) {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-content">
                    <div class="history-text">${this.truncateText(item.input, 100)}</div>
                    <div class="history-meta">
                        <span>${item.style}</span>
                        <span>${this.formatDate(item.timestamp)}</span>
                        <span>${item.model}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-reuse-btn" title="Reuse this prompt">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                </div>
            `;
            
            // Add click event for reuse
            const reuseBtn = div.querySelector('.history-reuse-btn');
            reuseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.reuseHistoryItem(item);
            });
            
            return div;
        }

        reuseHistoryItem(item) {
            this.elements.userInput.value = item.input;
            this.updateCharCounter();
            this.closeHistory();
            
            this.showNotification('Prompt loaded from history', 'success');
            
            // Auto-scroll to input
            this.elements.userInput.scrollIntoView({ behavior: 'smooth' });
        }

        // ===== VOICE FUNCTIONALITY =====

        async toggleVoiceInput() {
            if (this.voiceManager.isListening) {
                this.voiceManager.stopListening();
                this.elements.micBtn.classList.remove('listening');
            } else {
                try {
                    const language = this.settingsService.get('voiceLanguage') || 'en-US';
                    await this.voiceManager.startListening(language);
                    this.elements.micBtn.classList.add('listening');
                    this.showNotification('Listening... Speak now.', 'info');
                } catch (error) {
                    console.error('Voice input failed:', error);
                    this.showNotification('Voice input unavailable', 'error');
                }
            }
        }

        handleVoiceTranscript(transcript) {
            this.elements.userInput.value += ' ' + transcript;
            this.updateCharCounter();
            this.elements.micBtn.classList.remove('listening');
            this.showNotification('Voice input captured', 'success');
        }

        async toggleSpeech() {
            const text = this.elements.outputArea.textContent.trim();
            
            if (!text || text.includes('Your optimized prompt will appear here')) {
                this.showNotification('No prompt to read', 'warning');
                return;
            }
            
            if (this.voiceManager.isSpeaking) {
                this.voiceManager.stopSpeaking();
                this.elements.speakBtn.classList.remove('listening');
            } else {
                try {
                    await this.voiceManager.speak(text);
                    this.elements.speakBtn.classList.add('listening');
                } catch (error) {
                    console.error('Speech failed:', error);
                    this.showNotification('Speech unavailable', 'error');
                }
            }
        }

        // ===== HELPER METHODS =====

        formatPromptOutput(content, model) {
            const modelName = this.getModelDisplayName(model);
            return `
                <div class="prompt-content">
                    <div class="prompt-header">
                        <div class="prompt-meta">
                            <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                            <span class="model-tag">${modelName}</span>
                        </div>
                    </div>
                    <div class="prompt-text">
                        <pre>${this.escapeHtml(content)}</pre>
                    </div>
                </div>
            `;
        }

        getModelDisplayName(modelKey) {
            const modelNames = {
                'gemini': 'Google Gemini',
                'chatgpt': 'OpenAI ChatGPT',
                'claude': 'Anthropic Claude',
                'llama': 'Meta Llama',
                'fallback': 'Simulated'
            };
            return modelNames[modelKey] || modelKey;
        }

        truncateText(text, maxLength) {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        }

        formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 60) {
                return `${diffMins}m ago`;
            } else if (diffMins < 1440) {
                return `${Math.floor(diffMins / 60)}h ago`;
            } else {
                return date.toLocaleDateString();
            }
        }

        estimateTokenCount(text) {
            // Rough estimation: 4 characters ≈ 1 token
            return Math.ceil(text.length / 4);
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ===== API STATUS =====

        async testApiConnection() {
            try {
                const isHealthy = await this.apiService.checkStatus();
                return isHealthy;
            } catch (error) {
                console.warn('[APP] API connection test failed:', error);
                return false;
            }
        }

        updateApiStatus(isOnline) {
            this.elements.statusText.textContent = isOnline ? 'Online' : 'Offline (Using Fallback)';
            this.elements.statusText.style.color = isOnline ? 'var(--success-color)' : 'var(--warning-color)';
        }

        updateFooter() {
            // Update theme display
            const theme = this.settingsService.get('theme') || 'dark';
            const themeDisplay = {
                'dark': 'Dark',
                'light': 'Light',
                'sunset': 'Sunset',
                'aurora': 'Aurora'
            };
            this.elements.currentTheme.textContent = themeDisplay[theme] || 'Dark';
            
            // Update model display
            const model = this.settingsService.get('defaultModel') || 'gemini';
            this.elements.currentModel.textContent = this.getModelDisplayName(model);
        }

        // ===== EVENT HANDLERS =====

        handleInputChange(e) {
            this.updateCharCounter();
            
            // If input changes after generation, switch back to Prepare button
            if (this.elements.stickyResetBtn.classList.contains('hidden') === false) {
                this.elements.stickyPrepareBtn.classList.remove('hidden');
                this.elements.stickyResetBtn.classList.add('hidden');
            }
        }

        clearInput() {
            this.elements.userInput.value = '';
            this.updateCharCounter();
            this.showNotification('Input cleared', 'info');
        }

        copyPrompt() {
            const text = this.elements.outputArea.textContent.trim();
            if (!text || text.includes('Your optimized prompt will appear here')) {
                this.showNotification('No prompt to copy', 'warning');
                return;
            }
            
            navigator.clipboard.writeText(text)
                .then(() => this.showNotification('Prompt copied to clipboard!', 'success'))
                .catch(() => this.showNotification('Failed to copy', 'error'));
        }

        exportPrompt() {
            const text = this.elements.outputArea.textContent.trim();
            if (!text || text.includes('Your optimized prompt will appear here')) {
                this.showNotification('No prompt to export', 'warning');
                return;
            }
            
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prompt-${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Prompt exported successfully!', 'success');
        }

        undoPrompt() {
            if (this.processingState.lastPromptState) {
                this.elements.outputArea.innerHTML = this.processingState.lastPromptState;
                this.processingState.lastPromptState = '';
                this.elements.undoPromptBtn.style.display = 'none';
                this.showNotification('Undo completed', 'info');
            }
        }

        resetApplication() {
            if (confirm('Reset the application? This will clear all input and output.')) {
                // Clear input
                this.elements.userInput.value = '';
                this.updateCharCounter();
                
                // Clear output
                this.elements.outputArea.textContent = this.elements.outputArea.dataset.placeholder;
                this.elements.outputSection.classList.remove('show');
                
                // Reset buttons
                this.elements.stickyPrepareBtn.classList.remove('hidden');
                this.elements.stickyResetBtn.classList.add('hidden');
                
                // Reset progress
                this.elements.progressFill.style.width = '33%';
                
                // Clear AI platforms
                this.elements.platformsGrid.innerHTML = `
                    <div class="empty-state" id="platformsEmptyState">
                        <div class="empty-state-icon">
                            <i class="fas fa-robot"></i>
                        </div>
                        <p>Generate a prompt first to see AI platform options</p>
                    </div>
                `;
                this.elements.platformsEmptyState.style.display = 'block';
                
                // Reset state
                this.processingState.lastPromptState = '';
                this.elements.undoPromptBtn.style.display = 'none';
                this.currentPromptId = null;
                
                this.showNotification('Application reset', 'success');
            }
        }

        openMaximizedView(type) {
            let title = '';
            let content = '';
            
            if (type === 'input') {
                title = 'Edit Your Task';
                content = this.elements.userInput.value;
                this.processingState.maximizeType = 'input';
            } else {
                title = 'Edit Generated Prompt';
                content = this.elements.outputArea.textContent;
                this.processingState.maximizeType = 'output';
            }
            
            this.elements.editorTitle.textContent = title;
            this.elements.editorTextarea.value = content;
            this.elements.fullScreenEditor.classList.add('show');
            this.elements.editorTextarea.focus();
        }

        closeFullScreenEditor() {
            const editorText = this.elements.editorTextarea.value;
            
            if (this.processingState.maximizeType === 'input') {
                this.elements.userInput.value = editorText;
                this.updateCharCounter();
            } else if (this.processingState.maximizeType === 'output') {
                this.elements.outputArea.innerHTML = this.formatPromptOutput(editorText, this.processingState.currentModel || 'gemini');
            }
            
            this.elements.fullScreenEditor.classList.remove('show');
            this.processingState.maximizeType = null;
        }

        prepareFromEditor() {
            const editorText = this.elements.editorTextarea.value;
            this.elements.userInput.value = editorText;
            this.updateCharCounter();
            this.closeFullScreenEditor();
            
            // Auto-trigger prompt generation
            setTimeout(() => {
                this.preparePrompt();
            }, 300);
        }

        showInspirationModal() {
            this.elements.inspirationModal.classList.add('show');
        }

        closeInspirationModal() {
            this.elements.inspirationModal.classList.remove('show');
        }

        openSettingsModal() {
            this.elements.settingsModal.classList.add('show');
        }

        closeSettingsModal() {
            this.elements.settingsModal.classList.remove('show');
        }

        handleKeyboardShortcuts(e) {
            // Close modals with Escape
            if (e.key === 'Escape') {
                if (this.elements.fullScreenEditor.classList.contains('show')) {
                    this.closeFullScreenEditor();
                }
                if (this.elements.inspirationModal.classList.contains('show')) {
                    this.closeInspirationModal();
                }
                if (this.elements.settingsModal.classList.contains('show')) {
                    this.closeSettingsModal();
                }
                if (this.elements.historySection.classList.contains('show')) {
                    this.closeHistory();
                }
            }
            
            // Ctrl/Cmd + Enter to generate prompt
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.preparePrompt();
            }
            
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveSettings();
            }
        }

        saveCurrentState() {
            // Save any pending data
            const currentState = {
                input: this.elements.userInput.value,
                lastUpdate: Date.now()
            };
            
            this.storageService.setSession('current_state', currentState);
        }

        // Initialize when DOM is ready
        static initialize() {
            document.addEventListener('DOMContentLoaded', () => {
                window.app = new PromptCraftApp();
            });
        }
    }
    
    // Auto-initialize
    PromptCraftApp.initialize();
    
    // Export for global access
    window.PromptCraftApp = PromptCraftApp;
    
})();
