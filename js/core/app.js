// app.js - Main application (complete version with debounce fix)
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
            
            console.log('PromptCraft Pro initialized successfully');
        }

        bindElements() {
            // Cache DOM elements
            this.elements = {
                // Input elements
                userInput: document.getElementById('userInput'),
                charCounter: document.getElementById('charCounter'),
                undoBtn: document.getElementById('undoBtn'),
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
                notificationContainer: document.getElementById('notificationContainer')
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
            
            // Undo button
            if (this.elements.undoBtn) {
                this.elements.undoBtn.addEventListener('click', () => this.undo());
            }
            
            if (this.elements.editorUndoBtn) {
                this.elements.editorUndoBtn.addEventListener('click', () => this.undo());
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
                this.elements.maximizeInputBtn.addEventListener('click', () => this.openFullScreenEditor('input'));
            }
            
            if (this.elements.maximizeOutputBtn) {
                this.elements.maximizeOutputBtn.addEventListener('click', () => this.openFullScreenEditor('output'));
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
            
            // Inspiration button
            if (this.elements.needInspirationBtn) {
                this.elements.needInspirationBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleInspirationPanel();
                });
            }
            
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
                this.elements.historyBtn.addEventListener('click', () => this.toggleHistory());
            }
            
            // Close history button
            if (this.elements.closeHistoryBtn) {
                this.elements.closeHistoryBtn.addEventListener('click', () => this.closeHistory());
            }
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        }

        // Debounce helper method
        debounce(func, wait, immediate) {
            let timeout;
            return function() {
                const context = this, args = arguments;
                const later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        }

        async loadSettings() {
            try {
                const settings = this.settingsService.load();
                this.state.settings = { ...this.state.settings, ...settings };
                console.log('Settings loaded:', this.state.settings);
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }

        applyTheme() {
            if (this.themeManager && this.state.settings.theme) {
                this.themeManager.apply(this.state.settings.theme);
            }
        }

        updateUI() {
            // Update footer info
            if (this.elements.currentTheme) {
                this.elements.currentTheme.textContent = this.state.settings.theme.charAt(0).toUpperCase() + this.state.settings.theme.slice(1);
            }
            
            if (this.elements.currentLanguage) {
                this.elements.currentLanguage.textContent = this.state.settings.interfaceLanguage.toUpperCase();
            }
            
            if (this.elements.currentModel) {
                this.elements.currentModel.textContent = this.state.settings.defaultModel.charAt(0).toUpperCase() + this.state.settings.defaultModel.slice(1);
            }
        }

        setupAutoConvert() {
            if (this.state.settings.autoConvert && this.state.settings.autoConvertDelay > 0) {
                const delay = parseInt(this.state.settings.autoConvertDelay);
                if (this.elements.userInput) {
                    this.elements.userInput.addEventListener('input', this.debounce(() => {
                        if (this.elements.userInput.value.trim().length > 10) {
                            this.preparePrompt();
                        }
                    }, delay));
                }
            }
        }

        handleInputChange() {
            const text = this.elements.userInput?.value || '';
            
            // Update character counter
            if (this.elements.charCounter) {
                const charCount = text.length;
                this.elements.charCounter.textContent = `${charCount}/5000`;
            }
            
            // Update button states
            this.updateButtonStates();
        }

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
            
            // Show loading state
            this.showLoading(true);
            
            try {
                // Simulate AI processing
                await this.simulateAIProcessing();
                
                // Generate enhanced prompt
                const enhancedPrompt = this.generateEnhancedPrompt(inputText);
                
                // Update output
                if (this.elements.outputArea) {
                    this.elements.outputArea.textContent = enhancedPrompt;
                    this.state.originalPrompt = enhancedPrompt;
                    this.state.promptModified = false;
                    this.state.hasGeneratedPrompt = true;
                }
                
                // Show output section
                if (this.elements.outputSection) {
                    this.elements.outputSection.classList.add('visible');
                }
                
                // Update platforms
                this.updatePlatformCards();
                
                // Update progress and buttons
                this.updateProgress();
                this.updateButtonStates();
                
                // Save to history
                this.historyManager.save(inputText, enhancedPrompt);
                
                this.notificationService.show('Prompt successfully generated!', 'success');
                
            } catch (error) {
                this.notificationService.show('Failed to generate prompt. Please try again.', 'error');
                console.error('Prompt generation error:', error);
            } finally {
                this.showLoading(false);
            }
        }

        async prepareFromEditor() {
            const text = this.elements.editorTextarea?.value.trim() || '';
            if (!text) {
                this.notificationService.show('Please enter some text first', 'error');
                return;
            }
            
            if (this.state.currentEditor === 'input') {
                if (this.elements.userInput) {
                    this.elements.userInput.value = text;
                    this.handleInputChange();
                }
                this.closeFullScreenEditor();
                this.preparePrompt();
            } else if (this.state.currentEditor === 'output') {
                if (this.elements.outputArea) {
                    this.elements.outputArea.textContent = text;
                    this.handlePromptEdit();
                }
                this.closeFullScreenEditor();
            }
        }

        simulateAIProcessing() {
            return new Promise(resolve => {
                setTimeout(resolve, 1500);
            });
        }

        generateEnhancedPrompt(inputText) {
            const style = this.state.settings.promptStyle;
            
            const promptStyles = {
                detailed: `You are an expert AI assistant with specialized knowledge in this domain. Your task is to:

Context:
${inputText}

Requirements:
1. Provide comprehensive, detailed analysis
2. Include specific examples and actionable insights
3. Structure the response with clear sections
4. Use professional terminology appropriately
5. Consider potential edge cases and limitations
6. Offer practical recommendations

Please deliver a thorough, well-structured response that addresses all aspects of the task. Begin with an executive summary, then proceed with detailed analysis, and conclude with clear next steps.`,

                concise: `Task: ${inputText}

Provide a direct, concise response focusing on key points. Use clear language and avoid unnecessary elaboration.`,

                creative: `Creative Prompt:
${inputText}

Approach this with innovative thinking and imaginative solutions. Use engaging language, storytelling elements where appropriate, and focus on unique perspectives. Be original and inspiring in your response.`,

                professional: `Professional Request: ${inputText}

Prepare a formal, business-appropriate response that includes:
• Executive summary
• Background and context
• Detailed analysis
• Strategic recommendations
• Implementation considerations
• Risk assessment
• Next steps

Use professional tone and formal structure suitable for business communications.`
            };

            return promptStyles[style] || promptStyles.detailed;
        }

        updatePlatformCards() {
            if (!this.elements.platformsGrid) return;
            
            this.elements.platformsGrid.innerHTML = '';
            
            if (this.elements.platformsEmptyState) {
                this.elements.platformsEmptyState.style.display = 'none';
            }
            
            // Add platform cards
            const platforms = [
                {
                    id: 'gemini',
                    name: 'Google Gemini',
                    icon: 'fab fa-google',
                    color: '#8B5CF6',
                    description: 'Advanced reasoning and multimodal capabilities',
                    tags: ['Multimodal', 'Advanced', 'Google'],
                    launchUrl: 'https://gemini.google.com/',
                    recommended: true
                },
                {
                    id: 'chatgpt',
                    name: 'ChatGPT',
                    icon: 'fas fa-comment-alt',
                    color: '#10A37F',
                    description: 'Industry-leading conversational AI',
                    tags: ['Conversational', 'Popular', 'OpenAI'],
                    launchUrl: 'https://chat.openai.com/'
                },
                {
                    id: 'claude',
                    name: 'Anthropic Claude',
                    icon: 'fas fa-brain',
                    color: '#D4A574',
                    description: 'Constitutional AI with safety focus',
                    tags: ['Safe', 'Contextual', 'Anthropic'],
                    launchUrl: 'https://claude.ai/'
                }
            ];
            
            platforms.forEach(platform => {
                const platformCard = document.createElement('div');
                platformCard.className = 'platform-card';
                platformCard.dataset.platform = platform.id;
                
                if (platform.recommended) {
                    platformCard.classList.add('recommended');
                }
                
                platformCard.innerHTML = `
                    <div class="platform-logo-container" style="background: ${platform.color}">
                        <i class="${platform.icon}"></i>
                    </div>
                    <div class="platform-info">
                        <div class="platform-name">
                            ${platform.name}
                            ${platform.recommended ? '<span class="recommended-badge">Recommended</span>' : ''}
                        </div>
                        <div class="platform-desc">${platform.description}</div>
                        <div class="platform-tags">
                            ${platform.tags.map(tag => `<span class="platform-tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                `;
                
                platformCard.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const prompt = this.elements.outputArea?.textContent.trim() || '';
                    if (prompt && prompt !== this.elements.outputArea?.dataset.placeholder) {
                        try {
                            await navigator.clipboard.writeText(prompt);
                            this.notificationService.show(`Prompt copied! Opening ${platform.name}...`, 'success');
                            
                            // Open platform in new tab
                            setTimeout(() => {
                                window.open(platform.launchUrl, '_blank');
                            }, 500);
                            
                        } catch (err) {
                            this.notificationService.show('Failed to copy prompt. Please try again.', 'error');
                        }
                    } else {
                        this.notificationService.show('Please generate a prompt first', 'error');
                    }
                });
                
                this.elements.platformsGrid.appendChild(platformCard);
            });
        }

        copyPrompt() {
            const text = this.elements.outputArea?.textContent.trim() || '';
            
            if (!text) {
                this.notificationService.show('No prompt to copy', 'info');
                return;
            }
            
            navigator.clipboard.writeText(text)
                .then(() => {
                    this.notificationService.show('Prompt copied to clipboard!', 'success');
                    
                    // Visual feedback
                    if (this.elements.copyBtn) {
                        const originalHTML = this.elements.copyBtn.innerHTML;
                        this.elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            this.elements.copyBtn.innerHTML = originalHTML;
                        }, 2000);
                    }
                })
                .catch(err => {
                    console.error('Copy failed:', err);
                    this.notificationService.show('Failed to copy. Please try again.', 'error');
                });
        }

        toggleSpeech() {
            const text = this.elements.outputArea?.textContent.trim() || '';
            if (!text) {
                this.notificationService.show('No prompt to speak', 'info');
                return;
            }
            
            if (this.state.isSpeaking) {
                this.voiceManager.stopSpeaking();
                this.state.isSpeaking = false;
                if (this.elements.speakBtn) {
                    this.elements.speakBtn.innerHTML = '<i class="fas fa-volume-up"></i><span class="action-btn-tooltip">Listen</span>';
                }
            } else {
                this.voiceManager.speak(text, this.state.settings.voiceOutputLanguage)
                    .then(() => {
                        this.state.isSpeaking = false;
                        if (this.elements.speakBtn) {
                            this.elements.speakBtn.innerHTML = '<i class="fas fa-volume-up"></i><span class="action-btn-tooltip">Listen</span>';
                        }
                    })
                    .catch(error => {
                        console.error('Speech error:', error);
                        this.notificationService.show('Speech synthesis failed', 'error');
                        this.state.isSpeaking = false;
                    });
                
                this.state.isSpeaking = true;
                if (this.elements.speakBtn) {
                    this.elements.speakBtn.innerHTML = '<i class="fas fa-stop"></i><span class="action-btn-tooltip">Stop</span>';
                }
            }
        }

        exportPrompt() {
            const text = this.elements.outputArea?.textContent.trim() || '';
            if (!text) {
                this.notificationService.show('No prompt to export', 'info');
                return;
            }
            
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prompt-${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.notificationService.show('Prompt exported as text file', 'success');
        }

        savePrompt() {
            const text = this.elements.outputArea?.textContent.trim() || '';
            if (!text) {
                this.notificationService.show('No prompt to save', 'info');
                return;
            }
            
            this.historyManager.save('Edited prompt', text);
            this.state.promptModified = false;
            this.updateButtonStates();
            this.notificationService.show('Prompt saved to history', 'success');
        }

        undo() {
            if (this.state.undoStack.length > 0) {
                const lastState = this.state.undoStack.pop();
                this.state.redoStack.push(this.elements.userInput?.value || '');
                
                if (this.elements.userInput) {
                    this.elements.userInput.value = lastState;
                    this.handleInputChange();
                }
                
                this.notificationService.show('Undo completed', 'info');
            } else {
                this.notificationService.show('Nothing to undo', 'info');
            }
        }

        toggleVoiceInput() {
            if (!this.voiceManager.supported) {
                this.notificationService.show('Voice input not supported in your browser', 'error');
                return;
            }
            
            if (this.state.isListening) {
                this.voiceManager.stopListening();
                this.state.isListening = false;
                if (this.elements.micBtn) {
                    this.elements.micBtn.innerHTML = '<i class="fas fa-microphone"></i><span class="action-btn-tooltip">Voice Input</span>';
                }
                if (this.elements.editorMicBtn) {
                    this.elements.editorMicBtn.innerHTML = '<i class="fas fa-microphone"></i><span class="action-btn-tooltip">Voice Input</span>';
                }
            } else {
                this.voiceManager.startListening(this.state.settings.voiceInputLanguage)
                    .then(() => {
                        this.state.isListening = true;
                        if (this.elements.micBtn) {
                            this.elements.micBtn.innerHTML = '<i class="fas fa-stop"></i><span class="action-btn-tooltip">Stop Listening</span>';
                        }
                        if (this.elements.editorMicBtn) {
                            this.elements.editorMicBtn.innerHTML = '<i class="fas fa-stop"></i><span class="action-btn-tooltip">Stop Listening</span>';
                        }
                        this.notificationService.show('Listening... Speak now', 'info');
                    })
                    .catch(error => {
                        console.error('Voice input error:', error);
                        this.notificationService.show('Failed to start voice input', 'error');
                    });
                
                // Listen for voice transcript
                document.addEventListener('voiceTranscript', (e) => {
                    const transcript = e.detail.transcript;
                    if (this.state.isEditorOpen && this.elements.editorTextarea) {
                        this.elements.editorTextarea.value += ' ' + transcript;
                        this.updateEditorPrepareButton();
                    } else if (this.elements.userInput) {
                        this.elements.userInput.value += ' ' + transcript;
                        this.handleInputChange();
                    }
                    
                    this.voiceManager.stopListening();
                    this.state.isListening = false;
                    if (this.elements.micBtn) {
                        this.elements.micBtn.innerHTML = '<i class="fas fa-microphone"></i><span class="action-btn-tooltip">Voice Input</span>';
                    }
                    if (this.elements.editorMicBtn) {
                        this.elements.editorMicBtn.innerHTML = '<i class="fas fa-microphone"></i><span class="action-btn-tooltip">Voice Input</span>';
                    }
                    
                    this.notificationService.show('Voice input captured', 'success');
                });
            }
        }

        openFullScreenEditor(type) {
            this.state.currentEditor = type;
            this.state.isEditorOpen = true;
            
            if (type === 'input') {
                this.elements.editorTitle.textContent = 'Edit Input';
                this.elements.editorTextarea.value = this.elements.userInput?.value || '';
                this.elements.editorPrepareBtn.disabled = !this.elements.userInput?.value.trim();
            } else if (type === 'output') {
                this.elements.editorTitle.textContent = 'Edit Generated Prompt';
                this.elements.editorTextarea.value = this.elements.outputArea?.textContent.trim() || '';
                this.elements.editorPrepareBtn.disabled = !this.elements.outputArea?.textContent.trim();
            }
            
            this.elements.fullScreenEditor.style.display = 'block';
            setTimeout(() => {
                this.elements.fullScreenEditor.classList.add('visible');
                this.elements.editorTextarea.focus();
            }, 10);
        }

        closeFullScreenEditor() {
            this.elements.fullScreenEditor.classList.remove('visible');
            setTimeout(() => {
                this.elements.fullScreenEditor.style.display = 'none';
                this.state.isEditorOpen = false;
                this.state.currentEditor = null;
            }, 300);
        }

        updateEditorPrepareButton() {
            const hasText = this.elements.editorTextarea?.value.trim().length > 0;
            if (this.elements.editorPrepareBtn) {
                this.elements.editorPrepareBtn.disabled = !hasText;
            }
        }

        openSettings() {
            // Populate settings form
            if (this.elements.themeSelect) {
                this.elements.themeSelect.value = this.state.settings.theme;
            }
            if (this.elements.uiDensity) {
                this.elements.uiDensity.value = this.state.settings.uiDensity;
            }
            if (this.elements.defaultModel) {
                this.elements.defaultModel.value = this.state.settings.defaultModel;
            }
            if (this.elements.promptStyle) {
                this.elements.promptStyle.value = this.state.settings.promptStyle;
            }
            if (this.elements.autoConvertDelay) {
                this.elements.autoConvertDelay.value = this.state.settings.autoConvertDelay;
            }
            if (this.elements.interfaceLanguage) {
                this.elements.interfaceLanguage.value = this.state.settings.interfaceLanguage;
            }
            if (this.elements.voiceInputLanguage) {
                this.elements.voiceInputLanguage.value = this.state.settings.voiceLanguage;
            }
            if (this.elements.voiceOutputLanguage) {
                this.elements.voiceOutputLanguage.value = this.state.settings.voiceLanguage;
            }
            if (this.elements.maxHistoryItems) {
                this.elements.maxHistoryItems.value = this.state.settings.maxHistoryItems;
            }
            if (this.elements.notificationDuration) {
                this.elements.notificationDuration.value = this.state.settings.notificationDuration;
            }
            
            this.elements.settingsModal.style.display = 'block';
            setTimeout(() => {
                this.elements.settingsModal.classList.add('visible');
            }, 10);
        }

        closeSettings() {
            this.elements.settingsModal.classList.remove('visible');
            setTimeout(() => {
                this.elements.settingsModal.style.display = 'none';
            }, 300);
        }

        saveSettings() {
            const newSettings = {
                theme: this.elements.themeSelect?.value || 'dark',
                uiDensity: this.elements.uiDensity?.value || 'comfortable',
                defaultModel: this.elements.defaultModel?.value || 'gemini',
                promptStyle: this.elements.promptStyle?.value || 'detailed',
                autoConvertDelay: parseInt(this.elements.autoConvertDelay?.value || '5000'),
                interfaceLanguage: this.elements.interfaceLanguage?.value || 'en',
                voiceLanguage: this.elements.voiceInputLanguage?.value || 'en-US',
                maxHistoryItems: parseInt(this.elements.maxHistoryItems?.value || '25'),
                notificationDuration: parseInt(this.elements.notificationDuration?.value || '3000'),
                autoConvert: parseInt(this.elements.autoConvertDelay?.value || '0') > 0
            };
            
            this.state.settings = { ...this.state.settings, ...newSettings };
            this.settingsService.save(this.state.settings);
            
            // Apply changes
            this.applyTheme();
            this.historyManager.setMaxItems(this.state.settings.maxHistoryItems);
            this.setupAutoConvert();
            this.updateUI();
            
            this.notificationService.show('Settings saved successfully', 'success');
            this.closeSettings();
        }

        toggleInspirationPanel() {
            const isVisible = this.elements.inspirationPanel.classList.contains('visible');
            if (isVisible) {
                this.closeInspirationPanel();
            } else {
                this.elements.inspirationPanel.classList.add('visible');
            }
        }

        closeInspirationPanel() {
            this.elements.inspirationPanel.classList.remove('visible');
        }

        insertExample(type) {
            const examples = {
                email: "Compose a professional email to a client about delaying a project deadline by two weeks due to unforeseen technical challenges. Include: 1) Apology and explanation, 2) New timeline, 3) Steps being taken to mitigate impact, 4) Offer for compensation or discount, 5) Request for acknowledgment.",
                code: "Write a Python function that takes a list of numbers and returns a dictionary with the following statistics: mean, median, mode, standard deviation, min, max, and range. Include error handling for empty lists and non-numeric values.",
                analysis: "Analyze quarterly sales data showing a 15% decline in revenue. Identify potential causes, compare with industry trends, evaluate marketing effectiveness, assess competitor performance, and provide actionable recommendations to reverse the trend.",
                creative: "Write a short story about a time traveler who accidentally prevents their own birth but finds an unexpected way to exist. Include themes of identity, consequence, and the nature of existence.",
                strategy: "Develop a market entry strategy for launching an AI-powered educational platform in Southeast Asia. Include: target markets, competitive analysis, pricing strategy, marketing plan, partnership opportunities, and risk assessment.",
                research: "Summarize recent research on the impact of remote work on employee productivity and mental health. Include key findings from at least 5 studies published in the last 2 years, methodology strengths/weaknesses, and practical implications for HR policies."
            };
            
            const example = examples[type] || examples.email;
            if (this.elements.userInput) {
                this.elements.userInput.value = example;
                this.handleInputChange();
            }
        }

        toggleHistory() {
            const isVisible = this.elements.historySection.classList.contains('visible');
            if (isVisible) {
                this.closeHistory();
            } else {
                this.loadHistory();
                this.elements.historySection.classList.add('visible');
            }
        }

        closeHistory() {
            this.elements.historySection.classList.remove('visible');
        }

        loadHistory() {
            if (!this.elements.historyList) return;
            
            const history = this.historyManager.getAll();
            this.elements.historyList.innerHTML = '';
            
            if (history.length === 0) {
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
            
            history.forEach((item, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <div class="history-item-header">
                        <div class="history-item-date">${new Date(item.timestamp).toLocaleString()}</div>
                        <button class="history-item-action" data-id="${item.id}" title="Use this prompt">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>
                    <div class="history-item-preview">${this.truncateText(item.input, 100)}</div>
                `;
                
                historyItem.querySelector('.history-item-action').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.useHistoryItem(item.id);
                });
                
                this.elements.historyList.appendChild(historyItem);
            });
        }

        useHistoryItem(id) {
            const item = this.historyManager.getById(id);
            if (item) {
                if (this.elements.userInput) {
                    this.elements.userInput.value = item.input;
                    this.handleInputChange();
                }
                if (this.elements.outputArea) {
                    this.elements.outputArea.textContent = item.output;
                    this.state.originalPrompt = item.output;
                    this.state.promptModified = false;
                    this.state.hasGeneratedPrompt = true;
                }
                
                this.elements.outputSection?.classList.add('visible');
                this.updatePlatformCards();
                this.updateProgress();
                this.updateButtonStates();
                this.closeHistory();
                
                this.notificationService.show('Prompt loaded from history', 'success');
            }
        }

        handlePromptEdit() {
            const currentText = this.elements.outputArea?.textContent.trim() || '';
            const originalText = this.state.originalPrompt || '';
            
            this.state.promptModified = currentText !== originalText;
            this.updateButtonStates();
        }

        generateSuggestions() {
            // Simplified suggestions - you can enhance this later
            const suggestions = [
                'Add more specific details about your target audience',
                'Include concrete examples or use cases',
                'Specify the desired format or structure',
                'Mention any constraints or limitations',
                'Add context about the purpose or goal'
            ];
            
            if (this.elements.suggestionsList) {
                this.elements.suggestionsList.innerHTML = '';
                
                suggestions.forEach(suggestion => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.innerHTML = `
                        <i class="fas fa-lightbulb"></i>
                        <span>${suggestion}</span>
                        <button class="suggestion-apply">Apply</button>
                    `;
                    
                    suggestionItem.querySelector('.suggestion-apply').addEventListener('click', () => {
                        this.applySuggestion(suggestion);
                    });
                    
                    this.elements.suggestionsList.appendChild(suggestionItem);
                });
            }
        }

        applySuggestion(suggestion) {
            if (this.elements.outputArea) {
                const currentText = this.elements.outputArea.textContent.trim();
                this.elements.outputArea.textContent = currentText + '\n\n' + suggestion;
                this.handlePromptEdit();
                this.notificationService.show('Suggestion applied', 'success');
            }
        }

        handleKeyboardShortcuts(e) {
            // Ctrl/Cmd + Enter to prepare prompt
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.preparePrompt();
            }
            
            // Ctrl/Cmd + S to save prompt
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.savePrompt();
            }
            
            // Ctrl/Cmd + C to copy prompt
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && e.target !== this.elements.userInput) {
                // Don't interfere with normal copy in text areas
                if (!this.elements.userInput.contains(e.target) && !this.elements.editorTextarea.contains(e.target)) {
                    this.copyPrompt();
                }
            }
            
            // Escape to close modals/editors
            if (e.key === 'Escape') {
                if (this.state.isEditorOpen) {
                    this.closeFullScreenEditor();
                } else if (this.elements.settingsModal.classList.contains('visible')) {
                    this.closeSettings();
                } else if (this.elements.historySection.classList.contains('visible')) {
                    this.closeHistory();
                } else if (this.elements.inspirationPanel.classList.contains('visible')) {
                    this.closeInspirationPanel();
                }
            }
        }

        updateButtonStates() {
            const hasInput = this.elements.userInput?.value.trim().length > 0;
            const hasOutput = this.state.hasGeneratedPrompt;
            
            // Enable/disable buttons
            if (this.elements.stickyPrepareBtn) {
                this.elements.stickyPrepareBtn.disabled = !hasInput;
            }
            
            if (this.elements.copyBtn) {
                this.elements.copyBtn.disabled = !hasOutput;
            }
            
            if (this.elements.speakBtn) {
                this.elements.speakBtn.disabled = !hasOutput;
            }
            
            if (this.elements.exportBtn) {
                this.elements.exportBtn.disabled = !hasOutput;
            }
            
            if (this.elements.savePromptBtn) {
                this.elements.savePromptBtn.classList.toggle('visible', this.state.promptModified);
            }
        }

        updateProgress() {
            if (!this.elements.progressFill) return;
            
            let progress = 33; // Step 1 is always visible
            
            if (this.state.hasGeneratedPrompt) {
                progress = 66;
            }
            
            this.elements.progressFill.style.width = `${progress}%`;
        }

        resetApplication() {
            if (confirm('Are you sure you want to reset? This will clear all input and output.')) {
                // Clear input
                if (this.elements.userInput) {
                    this.elements.userInput.value = '';
                }
                
                // Clear output
                if (this.elements.outputArea) {
                    this.elements.outputArea.textContent = this.elements.outputArea.dataset.placeholder;
                }
                
                // Hide output section
                if (this.elements.outputSection) {
                    this.elements.outputSection.classList.remove('visible');
                }
                
                // Reset platform cards
                if (this.elements.platformsGrid) {
                    this.elements.platformsGrid.innerHTML = '';
                    if (this.elements.platformsEmptyState) {
                        this.elements.platformsEmptyState.style.display = 'block';
                    }
                }
                
                // Reset state
                this.state.hasGeneratedPrompt = false;
                this.state.promptModified = false;
                this.state.originalPrompt = null;
                
                // Update UI
                this.handleInputChange();
                this.updateProgress();
                this.updateButtonStates();
                
                this.notificationService.show('Application reset successfully', 'success');
            }
        }

        showLoading(show) {
            if (show) {
                document.body.style.cursor = 'wait';
                // You can add a loading spinner here if needed
            } else {
                document.body.style.cursor = 'default';
            }
        }

        truncateText(text, maxLength = 100) {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        }
    }
    
    // Export to global scope
    window.PromptCraftApp = PromptCraftApp;
    
})();
