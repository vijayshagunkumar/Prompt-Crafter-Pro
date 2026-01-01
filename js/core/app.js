// app.js - Main application (modified for GitHub Pages compatibility)
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
            this.loadSettings();
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

        // ... Add other methods from your original app.js ...

        showLoading(show) {
            if (show) {
                document.body.style.cursor = 'wait';
            } else {
                document.body.style.cursor = 'default';
            }
        }
    }
    
    // Export to global scope
    window.PromptCraftApp = PromptCraftApp;
    
})();
