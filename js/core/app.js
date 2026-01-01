// app.js - Complete version with API integration and all fixes
(function() {
    'use strict';
    
    class PromptCraftApp {
        constructor() {
            console.log('PromptCraft Pro initializing...');
            this.state = new AppState();
            this.voiceManager = new VoiceManager();
            this.themeManager = new ThemeManager();
            this.historyManager = new HistoryManager();
            this.templateManager = new TemplateManager();
            this.notificationService = new NotificationService();
            this.storageService = new StorageService();
            this.settingsService = new SettingsService();
            this.apiService = new ApiService();
            
            // Processing state
            this.processingState = {
                isProcessing: false,
                isMaximized: false,
                maximizeType: null,
                lastPromptState: ''
            };
            
            this.init();
        }

        async init() {
            this.bindElements();
            this.bindEvents();
            await this.loadSettings();
            this.applyTheme();
            this.updateUI();
            
            // Initialize modules
            await this.voiceManager.initialize();
            await this.themeManager.apply(this.state.settings.theme);
            await this.historyManager.load();
            
            // Setup auto-convert if enabled
            this.setupAutoConvert();
            
            // Test API connection
            await this.testApiConnection();
            
            console.log('PromptCraft Pro initialized successfully');
        }

        bindElements() {
            // Cache DOM elements
            this.elements = {
                // Input elements
                userInput: document.getElementById('userInput'),
                charCounter: document.getElementById('charCounter'),
                undoBtn: document.getElementById('undoBtn'),
                clearBtn: document.getElementById('clearBtn'),
                micBtn: document.getElementById('micBtn'),
                maximizeInputBtn: document.getElementById('maximizeInputBtn'),
                needInspirationBtn: document.getElementById('needInspirationBtn'),
                
                // Output elements
                outputSection: document.getElementById('outputSection'),
                outputArea: document.getElementById('outputArea'),
                copyBtn: document.getElementById('copyBtn'),
                speakBtn: document.getElementById('speakBtn'),
                exportBtn: document.getElementById('exportBtn'),
                maximizeOutputBtn: document.getElementById('maximizeOutputBtn'),
                savePromptBtn: document.getElementById('savePromptBtn'),
                
                // AI Platforms
                aiCard: document.getElementById('aiCard'),
                platformsGrid: document.getElementById('platformsGrid'),
                platformsEmptyState: document.getElementById('platformsEmptyState'),
                
                // Settings
                settingsBtn: document.getElementById('settingsBtn'),
                settingsModal: document.getElementById('settingsModal'),
                closeSettingsBtn: document.getElementById('closeSettingsBtn'),
                saveSettingsBtn: document.getElementById('saveSettingsBtn'),
                cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
                
                // Inspiration Panel
                inspirationPanel: document.getElementById('inspirationPanel'),
                closeInspirationBtn: document.getElementById('closeInspirationBtn'),
                
                // Theme and settings
                themeSelect: document.getElementById('themeSelect'),
                uiDensity: document.getElementById('uiDensity'),
                defaultModel: document.getElementById('defaultModel'),
                promptStyle: document.getElementById('promptStyle'),
                autoConvertDelay: document.getElementById('autoConvertDelay'),
                textareaSize: document.getElementById('textareaSize'),
                voiceInputLanguage: document.getElementById('voiceInputLanguage'),
                voiceOutputLanguage: document.getElementById('voiceOutputLanguage'),
                interfaceLanguage: document.getElementById('interfaceLanguage'),
                maxHistoryItems: document.getElementById('maxHistoryItems'),
                notificationDuration: document.getElementById('notificationDuration'),
                
                // Progress
                progressFill: document.getElementById('progressFill'),
                
                // Full screen editor
                fullScreenEditor: document.getElementById('fullScreenEditor'),
                editorTextarea: document.getElementById('editorTextarea'),
                closeEditorBtn: document.getElementById('closeEditorBtn'),
                editorMicBtn: document.getElementById('editorMicBtn'),
                editorUndoBtn: document.getElementById('editorUndoBtn'),
                editorPrepareBtn: document.getElementById('editorPrepareBtn'),
                editorTitle: document.getElementById('editorTitle'),
                
                // Sticky buttons
                stickyResetBtn: document.getElementById('stickyResetBtn'),
                stickyPrepareBtn: document.getElementById('stickyPrepareBtn'),
                
                // History
                historyBtn: document.getElementById('historyBtn'),
                historySection: document.getElementById('historySection'),
                historyList: document.getElementById('historyList'),
                closeHistoryBtn: document.getElementById('closeHistoryBtn'),
                
                // Suggestions
                suggestionsPanel: document.getElementById('suggestionsPanel'),
                suggestionsList: document.getElementById('suggestionsList'),
                
                // Footer
                currentModel: document.getElementById('currentModel'),
                currentTheme: document.getElementById('currentTheme'),
                currentLanguage: document.getElementById('currentLanguage'),
                
                // App container
                appContainer: document.querySelector('.app-container'),
                
                // Notifications
                notificationContainer: document.getElementById('notificationContainer'),
                
                // Processing indicator
                processingIndicator: document.getElementById('processingIndicator'),
                processingText: document.getElementById('processingText'),
                
                // Maximized view elements
                maximizeModal: document.getElementById('maximizeModal'),
                maximizeContent: document.getElementById('maximizeContent'),
                maximizeFooter: document.getElementById('maximizeFooter'),
                closeMaximizeBtn: document.getElementById('closeMaximizeBtn'),
                maximizeUndoBtn: document.getElementById('maximizeUndoBtn')
            };
        }

        bindEvents() {
            // Input handling
            if (this.elements.userInput) {
                this.elements.userInput.addEventListener('input', () => this.handleInputChange());
            }

            // Buttons
            if (this.elements.stickyPrepareBtn) {
                this.elements.stickyPrepareBtn.addEventListener('click', () => this.preparePrompt());
            }
            
            if (this.elements.editorPrepareBtn) {
                this.elements.editorPrepareBtn.addEventListener('click', () => this.prepareFromEditor());
            }
            
            // Clear button
            if (this.elements.clearBtn) {
                this.elements.clearBtn.addEventListener('click', () => this.clearApplication());
            } else {
                this.createClearButton();
            }
            
            // Undo button
            if (this.elements.undoBtn) {
                this.elements.undoBtn.addEventListener('click', () => this.undo());
            }
            
            if (this.elements.editorUndoBtn) {
                this.elements.editorUndoBtn.addEventListener('click', () => this.undo());
            }
            
            if (this.elements.maximizeUndoBtn) {
                this.elements.maximizeUndoBtn.addEventListener('click', () => this.undo());
            }
            
            if (this.elements.copyBtn) {
                this.elements.copyBtn.addEventListener('click', () => this.copyPrompt());
            }
            
            if (this.elements.speakBtn) {
                this.elements.speakBtn.addEventListener('click', () => this.toggleSpeech());
            }
            
            if (this.elements.exportBtn) {
                this.elements.exportBtn.addEventListener('click', () => this.exportPrompt());
            }
            
            if (this.elements.savePromptBtn) {
                this.elements.savePromptBtn.addEventListener('click', () => this.savePrompt());
            }
            
            if (this.elements.stickyResetBtn) {
                this.elements.stickyResetBtn.addEventListener('click', () => this.resetApplication());
            }
            
            // Maximize buttons
            if (this.elements.maximizeInputBtn) {
                this.elements.maximizeInputBtn.addEventListener('click', () => this.openMaximizedView('input'));
            }
            
            if (this.elements.maximizeOutputBtn) {
                this.elements.maximizeOutputBtn.addEventListener('click', () => this.openMaximizedView('output'));
            }
            
            // Close maximize modal
            if (this.elements.closeMaximizeBtn) {
                this.elements.closeMaximizeBtn.addEventListener('click', () => this.closeMaximizedView());
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
                this.elements.saveSettingsBtn.disabled = true;
            }
            
            // Settings input changes
            if (this.elements.themeSelect) {
                this.elements.themeSelect.addEventListener('change', () => this.onSettingsChange());
            }
            if (this.elements.defaultModel) {
                this.elements.defaultModel.addEventListener('change', () => this.onSettingsChange());
            }
            if (this.elements.promptStyle) {
                this.elements.promptStyle.addEventListener('change', () => this.onSettingsChange());
            }
            
            // Move inspiration button
            this.moveInspirationButton();
            
            // Close inspiration panel
            if (this.elements.closeInspirationBtn) {
                this.elements.closeInspirationBtn.addEventListener('click', () => {
                    this.closeInspirationPanel();
                });
            }
            
            // Voice button
            if (this.elements.micBtn) {
                this.elements.micBtn.addEventListener('click', () => this.toggleVoiceInput());
            }
            
            if (this.elements.editorMicBtn) {
                this.elements.editorMicBtn.addEventListener('click', () => this.toggleVoiceInput());
            }
            
            // Editor textarea input
            if (this.elements.editorTextarea) {
                this.elements.editorTextarea.addEventListener('input', () => {
                    this.updateEditorPrepareButton();
                });
            }
            
            // Full screen editor
            if (this.elements.closeEditorBtn) {
                this.elements.closeEditorBtn.addEventListener('click', () => this.closeFullScreenEditor());
            }
            
            // Close modals on backdrop click
            if (this.elements.settingsModal) {
                this.elements.settingsModal.addEventListener('click', (e) => {
                    if (e.target === this.elements.settingsModal) {
                        this.closeSettings();
                    }
                });
            }
            
            if (this.elements.maximizeModal) {
                this.elements.maximizeModal.addEventListener('click', (e) => {
                    if (e.target === this.elements.maximizeModal) {
                        this.closeMaximizedView();
                    }
                });
            }
            
            // Output area editing
            if (this.elements.outputArea) {
                this.elements.outputArea.addEventListener('input', () => {
                    this.handlePromptEdit();
                    this.generateSuggestions();
                });
                
                this.elements.outputArea.addEventListener('focus', () => {
                    if (this.elements.outputArea.textContent.trim() === this.elements.outputArea.dataset.placeholder) {
                        this.elements.outputArea.textContent = '';
                    }
                });
                
                this.elements.outputArea.addEventListener('blur', () => {
                    if (!this.elements.outputArea.textContent.trim()) {
                        this.elements.outputArea.textContent = this.elements.outputArea.dataset.placeholder;
                    }
                });
            }
            
            // Inspiration items
            document.querySelectorAll('.inspiration-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const type = e.currentTarget.dataset.type;
                    this.insertExample(type);
                    this.closeInspirationPanel();
                });
            });
            
            // History button
            if (this.elements.historyBtn) {
                this.elements.historyBtn.addEventListener('click', () => this.showHistorySection());
            }
            
            // Close history button
            if (this.elements.closeHistoryBtn) {
                this.elements.closeHistoryBtn.addEventListener('click', () => this.closeHistory());
            }
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
            
            // Setup reset button behavior
            this.setupResetButtonBehavior();
        }

        // ===== MAIN API CALL METHOD =====
        async preparePrompt() {
            const inputText = this.elements.userInput?.value.trim() || '';
            
            if (!inputText) {
                this.notificationService.show('Please describe your task first', 'error');
                return;
            }
            
            if (inputText.length < 10) {
                this.notificationService.show('Please provide more details for better results', 'warning');
                return;
            }
            
            // Show processing indicator
            this.showProcessingIndicator(true, 'Crafting your perfect prompt...');
            this.toggleProcessingState(true);
            
            // Save for undo functionality
            this.processingState.lastPromptState = this.elements.outputArea?.innerHTML || '';
            
            try {
                // Get selected style and model from settings
                const selectedStyle = this.settingsService.get('promptStyle') || 'detailed';
                const selectedModel = this.settingsService.get('defaultModel') || 'gemini-3-flash-preview';
                
                console.log(`[APP] Calling API with:`, {
                    model: selectedModel,
                    style: selectedStyle,
                    inputLength: inputText.length
                });
                
                // ✅ THIS CALLS THE REAL API
                const apiResult = await this.apiService.generatePrompt(
                    inputText, 
                    selectedStyle, 
                    selectedModel
                );
                
                console.log('[APP] API Result:', {
                    success: apiResult.success,
                    fromAPI: apiResult.fromAPI || false,
                    model: apiResult.model,
                    contentLength: apiResult.content?.length || 0
                });
                
                if (apiResult.success) {
                    // Display the generated prompt
                    if (this.elements.outputArea) {
                        this.elements.outputArea.innerHTML = this.formatPromptOutput(apiResult.content);
                        this.elements.outputArea.classList.remove('placeholder');
                        this.state.originalPrompt = apiResult.content;
                        this.state.promptModified = false;
                        this.state.hasGeneratedPrompt = true;
                    }
                    
                    // Show output section
                    if (this.elements.outputSection) {
                        this.elements.outputSection.classList.add('show');
                        this.elements.outputSection.classList.add('visible');
                    }
                    
                    // Update progress bar
                    if (this.elements.progressFill) {
                        this.elements.progressFill.style.width = '66%';
                    }
                    
                    // Change Prepare Prompt button to Reset
                    this.updatePrepareButtonToReset();
                    
                    // Update model indicator in UI
                    if (this.elements.currentModel) {
                        this.elements.currentModel.textContent = apiResult.model || selectedModel;
                    }
                    
                    // Add to history
                    this.addToHistory(inputText, apiResult.content, selectedStyle);
                    
                    // Show AI platforms sidebar
                    this.showAIPlatforms(apiResult.content);
                    
                    // Enable undo button
                    if (this.elements.undoBtn) {
                        this.elements.undoBtn.disabled = false;
                        this.elements.undoBtn.style.opacity = '1';
                    }
                    
                    // Show success notification
                    const source = apiResult.fromAPI ? 'AI API' : 'simulated';
                    this.notificationService.show(
                        `Prompt generated using ${source}!`, 
                        'success'
                    );
                    
                } else {
                    throw new Error(apiResult.error || 'API call failed');
                }
                
            } catch (error) {
                console.error('[APP] Error generating prompt:', error);
                
                // Fallback to simulated response
                await this.generateFallbackPrompt(inputText);
                
                this.notificationService.show(
                    'Used fallback generation. API might be unavailable.', 
                    'warning'
                );
                
            } finally {
                // Hide processing indicator
                this.showProcessingIndicator(false);
                this.toggleProcessingState(false);
            }
        }

        // ===== HELPER METHODS =====

        toggleProcessingState(isProcessing) {
            const prepareBtn = this.elements.stickyPrepareBtn || document.getElementById('stickyPrepareBtn');
            if (prepareBtn) {
                prepareBtn.disabled = isProcessing;
                if (isProcessing) {
                    prepareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                } else {
                    prepareBtn.innerHTML = '<i class="fas fa-magic"></i> Prepare Prompt';
                }
            }
            
            // Also disable other action buttons during processing
            const actionButtons = [
                this.elements.copyBtn,
                this.elements.speakBtn,
                this.elements.exportBtn,
                this.elements.maximizeOutputBtn
            ];
            
            actionButtons.forEach(btn => {
                if (btn) btn.disabled = isProcessing;
            });
        }

        formatPromptOutput(content) {
            return `
                <div class="prompt-content">
                    <div class="prompt-header">
                        <div class="prompt-meta">
                            <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                            <span class="model-tag">${this.getCurrentModelName()}</span>
                        </div>
                    </div>
                    <div class="prompt-text">
                        <pre>${this.escapeHtml(content)}</pre>
                    </div>
                </div>
            `;
        }

        async generateFallbackPrompt(inputText) {
            // Fallback to simulated response
            const selectedStyle = this.settingsService.get('promptStyle') || 'detailed';
            const result = await this.apiService.simulateAIProcessing(inputText, selectedStyle);
            
            if (this.elements.outputArea) {
                this.elements.outputArea.innerHTML = this.formatPromptOutput(result.content);
                this.elements.outputArea.classList.remove('placeholder');
            }
            
            if (this.elements.outputSection) {
                this.elements.outputSection.classList.add('show');
            }
            
            this.updatePrepareButtonToReset();
        }

        showAIPlatforms(promptContent) {
            if (!this.elements.platformsGrid) return;
            
            this.elements.platformsGrid.innerHTML = '';
            
            const platforms = [
                {
                    name: 'Google Gemini',
                    icon: 'fas fa-robot',
                    color: '#4285F4',
                    description: 'Google\'s advanced AI model',
                    url: 'https://gemini.google.com',
                    action: () => this.copyAndOpen(promptContent, 'https://gemini.google.com')
                },
                {
                    name: 'ChatGPT',
                    icon: 'fas fa-comment-alt',
                    color: '#10A37F',
                    description: 'OpenAI\'s conversational AI',
                    url: 'https://chat.openai.com',
                    action: () => this.copyAndOpen(promptContent, 'https://chat.openai.com')
                },
                {
                    name: 'Claude',
                    icon: 'fas fa-brain',
                    color: '#FF6B35',
                    description: 'Anthropic\'s safety-focused AI',
                    url: 'https://claude.ai',
                    action: () => this.copyAndOpen(promptContent, 'https://claude.ai')
                },
                {
                    name: 'Perplexity',
                    icon: 'fas fa-search',
                    color: '#2A5CAA',
                    description: 'AI-powered search assistant',
                    url: 'https://perplexity.ai',
                    action: () => this.copyAndOpen(promptContent, 'https://perplexity.ai')
                }
            ];
            
            platforms.forEach(platform => {
                const platformCard = document.createElement('div');
                platformCard.className = 'platform-card';
                platformCard.style.cursor = 'pointer';
                platformCard.style.transition = 'all 0.3s ease';
                
                platformCard.innerHTML = `
                    <div class="platform-icon" style="background: ${platform.color}20; border-color: ${platform.color}40;">
                        <i class="${platform.icon}" style="color: ${platform.color};"></i>
                    </div>
                    <div class="platform-info">
                        <div class="platform-name">${platform.name}</div>
                        <div class="platform-desc">${platform.description}</div>
                    </div>
                    <div class="platform-arrow">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                `;
                
                platformCard.addEventListener('click', () => {
                    platform.action();
                    this.notificationService.show(`Prompt copied! Opening ${platform.name}...`, 'success');
                });
                
                platformCard.addEventListener('mouseenter', () => {
                    platformCard.style.transform = 'translateY(-2px)';
                    platformCard.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                });
                
                platformCard.addEventListener('mouseleave', () => {
                    platformCard.style.transform = 'translateY(0)';
                    platformCard.style.boxShadow = 'none';
                });
                
                this.elements.platformsGrid.appendChild(platformCard);
            });
        }

        async copyAndOpen(promptContent, url) {
            try {
                await navigator.clipboard.writeText(promptContent);
                setTimeout(() => {
                    window.open(url, '_blank');
                }, 300);
            } catch (error) {
                console.error('Copy failed:', error);
                this.notificationService.show('Failed to copy prompt', 'error');
            }
        }

        addToHistory(inputText, generatedPrompt, style) {
            const historyItem = {
                id: Date.now(),
                input: inputText,
                output: generatedPrompt,
                style: style,
                timestamp: new Date().toISOString(),
                model: this.getCurrentModelName()
            };
            
            this.historyManager.save(historyItem);
        }

        async testApiConnection() {
            try {
                console.log('[APP] Testing API connection...');
                
                const testResponse = await fetch('https://promptcraft-api.vijay-shagunkumar.workers.dev/health', {
                    method: 'GET'
                });
                
                if (testResponse.ok) {
                    const health = await testResponse.json();
                    console.log('[APP] API Health:', health);
                    
                    // Update status in footer
                    const statusElement = document.querySelector('.status-indicator');
                    if (statusElement) {
                        statusElement.style.background = '#10b981';
                        statusElement.nextElementSibling.innerHTML = 'Status: <strong>Online</strong>';
                    }
                    
                    this.notificationService.show('API connection successful!', 'success');
                    return true;
                } else {
                    throw new Error('Health check failed');
                }
                
            } catch (error) {
                console.warn('[APP] API connection failed:', error.message);
                
                // Update status in footer
                const statusElement = document.querySelector('.status-indicator');
                if (statusElement) {
                    statusElement.style.background = '#ef4444';
                    statusElement.nextElementSibling.innerHTML = 'Status: <strong>Offline (Using Fallback)</strong>';
                }
                
                this.notificationService.show('API offline - using simulated mode', 'warning');
                return false;
            }
        }

        // ===== EXISTING METHODS (simplified versions) =====

        showProcessingIndicator(show, message = 'Generating prompt...') {
            if (!this.elements.processingIndicator) {
                this.createProcessingIndicator();
            }
            
            if (show) {
                this.elements.processingIndicator.style.display = 'flex';
                if (this.elements.processingText) {
                    this.elements.processingText.textContent = message;
                }
                this.processingState.isProcessing = true;
            } else {
                this.elements.processingIndicator.style.display = 'none';
                this.processingState.isProcessing = false;
            }
        }

        createProcessingIndicator() {
            const indicator = document.createElement('div');
            indicator.id = 'processingIndicator';
            indicator.className = 'processing-indicator';
            indicator.style.display = 'none';
            indicator.style.position = 'fixed';
            indicator.style.top = '50%';
            indicator.style.left = '50%';
            indicator.style.transform = 'translate(-50%, -50%)';
            indicator.style.zIndex = '9999';
            indicator.style.background = 'rgba(0, 0, 0, 0.8)';
            indicator.style.padding = '20px 30px';
            indicator.style.borderRadius = '10px';
            indicator.style.color = 'white';
            indicator.style.fontSize = '16px';
            indicator.style.fontWeight = '500';
            indicator.style.alignItems = 'center';
            indicator.style.gap = '15px';
            
            indicator.innerHTML = `
                <div class="spinner" style="width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span id="processingText">Generating prompt...</span>
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(indicator);
            this.elements.processingIndicator = indicator;
            this.elements.processingText = document.getElementById('processingText');
        }

        updatePrepareButtonToReset() {
            if (this.elements.stickyPrepareBtn) {
                this.elements.stickyPrepareBtn.innerHTML = '<i class="fas fa-redo"></i> Reset';
                this.elements.stickyPrepareBtn.onclick = () => this.resetApplication();
            }
        }

        getCurrentModelName() {
            const modelValue = this.settingsService.get('defaultModel') || 'gemini-3-flash-preview';
            const modelNames = {
                'gemini-3-flash-preview': 'Google Gemini 3 Flash Preview',
                'gpt-4o-mini': 'OpenAI GPT-4o Mini',
                'llama-3.1-8b-instant': 'Meta Llama 3.1 8B (via Groq)',
                'gemini-1.5-flash-latest': 'Google Gemini 1.5 Flash Latest',
                'gemini-1.5-flash': 'Google Gemini 1.5 Flash'
            };
            return modelNames[modelValue] || modelValue;
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        openMaximizedView(type) {
            this.processingState.isMaximized = true;
            this.processingState.maximizeType = type;
            
            let title = '';
            let content = '';
            let footer = '';
            
            if (type === 'input') {
                title = 'Describe Your Task';
                const inputText = this.elements.userInput?.value || '';
                content = `
                    <div class="maximized-input-container">
                        <div class="maximized-input-header">
                            <h4>What would you like the AI to help you with?</h4>
                            <button class="btn btn-small btn-inspiration" id="maximizedInspirationBtn">
                                <i class="fas fa-lightbulb"></i> Need Inspiration?
                            </button>
                        </div>
                        <textarea class="maximized-textarea" rows="15" placeholder="Describe your task in detail...">${inputText}</textarea>
                    </div>
                `;
                footer = `
                    <button class="btn btn-secondary" id="saveMaximizedInput">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                `;
            } else if (type === 'output') {
                title = 'Generated Prompt';
                const promptText = this.elements.outputArea?.textContent.trim() || '';
                content = `
                    <div class="maximized-prompt-container">
                        <div class="maximized-prompt-header">
                            <div class="model-indicator">
                                <i class="fas fa-microchip"></i>
                                <span>${this.getCurrentModelName()}</span>
                            </div>
                        </div>
                        <div class="maximized-prompt-content">
                            ${promptText ? `<pre>${this.escapeHtml(promptText)}</pre>` : '<p class="placeholder-text">No prompt generated yet.</p>'}
                        </div>
                    </div>
                `;
                footer = `
                    <button class="btn btn-secondary" id="maximizeUndoBtn">
                        <i class="fas fa-undo"></i> Undo
                    </button>
                    <button class="btn btn-primary" id="copyMaximizedPrompt">
                        <i class="fas fa-copy"></i> Copy Prompt
                    </button>
                `;
            }
            
            document.getElementById('maximizedTitle').textContent = title;
            this.elements.maximizeContent.innerHTML = content;
            this.elements.maximizeFooter.innerHTML = footer;
            this.elements.maximizeModal.style.display = 'flex';
        }

        closeMaximizedView() {
            this.processingState.isMaximized = false;
            this.processingState.maximizeType = null;
            this.elements.maximizeModal.style.display = 'none';
        }

        clearApplication() {
            if (this.elements.userInput) {
                this.elements.userInput.value = '';
                this.handleInputChange();
            }
            
            if (this.elements.outputArea) {
                this.elements.outputArea.textContent = this.elements.outputArea.dataset.placeholder || '';
                this.state.originalPrompt = '';
                this.state.promptModified = false;
                this.state.hasGeneratedPrompt = false;
            }
            
            if (this.elements.outputSection) {
                this.elements.outputSection.classList.remove('visible');
            }
            
            if (this.elements.platformsGrid) {
                this.elements.platformsGrid.innerHTML = '';
                if (this.elements.platformsEmptyState) {
                    this.elements.platformsEmptyState.style.display = 'block';
                }
            }
            
            if (this.elements.progressFill) {
                this.elements.progressFill.style.width = '33%';
            }
            
            if (this.elements.stickyPrepareBtn) {
                this.elements.stickyPrepareBtn.innerHTML = '<i class="fas fa-magic"></i> Prepare Prompt';
                this.elements.stickyPrepareBtn.onclick = () => this.preparePrompt();
            }
            
            this.closeMaximizedView();
            this.closeFullScreenEditor();
            
            this.notificationService.show('Application cleared', 'success');
        }

        resetApplication() {
            if (confirm('Are you sure you want to reset? This will clear all input and output.')) {
                this.clearApplication();
                this.notificationService.show('Application reset successfully', 'success');
            }
        }

        moveInspirationButton() {
            if (!this.elements.needInspirationBtn) return;
            
            const inputLabel = document.querySelector('label[for="userInput"]');
            if (inputLabel) {
                const container = document.createElement('div');
                container.className = 'input-header-container';
                container.style.display = 'flex';
                container.style.justifyContent = 'space-between';
                container.style.alignItems = 'center';
                container.style.marginBottom = '10px';
                
                const labelClone = inputLabel.cloneNode(true);
                const buttonClone = this.elements.needInspirationBtn.cloneNode(true);
                
                buttonClone.className = 'btn btn-small btn-inspiration';
                buttonClone.innerHTML = '<i class="fas fa-lightbulb"></i> Need Inspiration?';
                buttonClone.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleInspirationPanel();
                });
                
                container.appendChild(labelClone);
                container.appendChild(buttonClone);
                inputLabel.parentNode.replaceChild(container, inputLabel);
                
                const oldButton = document.querySelector('.need-inspiration-btn');
                if (oldButton && oldButton !== buttonClone) {
                    oldButton.remove();
                }
            }
        }

        createClearButton() {
            const inputActions = this.elements.undoBtn?.parentElement;
            if (inputActions) {
                const clearBtn = document.createElement('button');
                clearBtn.id = 'clearBtn';
                clearBtn.className = 'btn btn-small btn-danger';
                clearBtn.innerHTML = '<i class="fas fa-times"></i> Clear';
                clearBtn.title = 'Clear input and reset application';
                
                inputActions.insertBefore(clearBtn, this.elements.undoBtn);
                this.elements.clearBtn = clearBtn;
                
                clearBtn.addEventListener('click', () => this.clearApplication());
            }
        }

        // ===== OTHER EXISTING METHODS (stubs - you should keep your existing implementations) =====
        
        async loadSettings() {
            // Your existing implementation
        }

        applyTheme() {
            // Your existing implementation
        }

        updateUI() {
            // Your existing implementation
        }

        setupAutoConvert() {
            // Your existing implementation
        }

        handleInputChange() {
            // Your existing implementation
        }

        prepareFromEditor() {
            // Your existing implementation
        }

        undo() {
            // Your existing implementation
        }

        copyPrompt() {
            // Your existing implementation
        }

        toggleSpeech() {
            // Your existing implementation
        }

        exportPrompt() {
            // Your existing implementation
        }

        savePrompt() {
            // Your existing implementation
        }

        openSettings() {
            // Your existing implementation
        }

        closeSettings() {
            // Your existing implementation
        }

        saveSettings() {
            // Your existing implementation
        }

        onSettingsChange() {
            // Your existing implementation
        }

        toggleInspirationPanel() {
            // Your existing implementation
        }

        closeInspirationPanel() {
            // Your existing implementation
        }

        toggleVoiceInput() {
            // Your existing implementation
        }

        updateEditorPrepareButton() {
            // Your existing implementation
        }

        closeFullScreenEditor() {
            // Your existing implementation
        }

        handlePromptEdit() {
            // Your existing implementation
        }

        generateSuggestions() {
            // Your existing implementation
        }

        insertExample(type) {
            // Your existing implementation
        }

        showHistorySection() {
            // Your existing implementation
        }

        closeHistory() {
            // Your existing implementation
        }

        handleKeyboardShortcuts(e) {
            // Your existing implementation
        }

        setupResetButtonBehavior() {
            // Your existing implementation
        }

        loadHistoryWithReuse() {
            // Your existing implementation
        }

        useHistoryItem(id) {
            // Your existing implementation
        }

        deleteHistoryItem(id) {
            // Your existing implementation
        }

    }
    
    // Export to global scope
    window.PromptCraftApp = PromptCraftApp;
    
})();
