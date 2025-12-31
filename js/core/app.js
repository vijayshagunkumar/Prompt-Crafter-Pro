class PromptCraftApp {
    constructor() {
        this.state = {
            currentStep: 1,
            hasGeneratedPrompt: false,
            promptModified: false,
            isListening: false,
            isSpeaking: false,
            isEditorOpen: false,
            currentEditor: null,
            inspirationPanelOpen: false,
            templateLibraryOpen: false,
            historyOpen: false,
            selectedPlatform: null,
            originalPrompt: null,
            undoStack: [],
            redoStack: [],
            inputHistory: [],
            historyIndex: -1,
            autoMode: {
                enabled: false,
                delay: 0,
                timer: null,
                executing: false
            }
        };

        this.services = {};
        this.modules = {};
        this.init();
    }

    async init() {
        try {
            // Initialize services first
            this.initializeServices();
            
            // Initialize modules
            this.initializeModules();
            
            // Setup DOM elements
            this.setupDOM();
            
            // Bind events
            this.bindEvents();
            
            // Load initial state
            this.loadInitialState();
            
            // Setup theme
            this.setupTheme();
            
            // Setup voice
            this.setupVoice();
            
            // Setup auto-generation
            this.setupAutoGeneration();
            
            // Update UI
            this.updateUI();
            
            console.log('PromptCraft Pro initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.services.notification?.error('Failed to initialize application');
        }
    }

    initializeServices() {
        // Storage service
        this.services.storage = new StorageService();
        
        // API service
        this.services.api = new APIService();
        
        // Notification service
        this.services.notification = new NotificationService();
        
        // Settings service (to be implemented)
        this.services.settings = {
            load: () => this.services.storage.loadSettings({}),
            save: (settings) => this.services.storage.saveSettings(settings)
        };
    }

    initializeModules() {
        // Intent detector
        this.modules.intent = new IntentDetector();
        
        // Prompt generator
        this.modules.prompt = new PromptGenerator();
        
        // AI ranker
        this.modules.ranker = new AIRanker();
        
        // Voice manager
        this.modules.voice = new VoiceManager();
        
        // Template manager (to be implemented)
        this.modules.templates = {
            load: () => this.services.storage.loadTemplates(window.DEFAULT_TEMPLATES || []),
            save: (templates) => this.services.storage.saveTemplates(templates),
            categories: window.TEMPLATE_CATEGORIES || {}
        };
        
        // History manager (to be implemented)
        this.modules.history = {
            load: () => this.services.storage.loadHistory([]),
            save: (history) => this.services.storage.saveHistory(history)
        };
    }

    setupDOM() {
        this.elements = {
            // Input
            userInput: document.getElementById('userInput'),
            charCounter: document.getElementById('charCounter'),
            undoBtn: document.getElementById('undoBtn'),
            micBtn: document.getElementById('micBtn'),
            maximizeInputBtn: document.getElementById('maximizeInputBtn'),
            
            // Intent chips
            intentChips: document.getElementById('intentChips'),
            intentChipsScroll: document.getElementById('intentChipsScroll'),
            intentProgress: document.getElementById('intentProgress'),
            
            // Preset selector
            presetSelector: document.getElementById('presetSelector'),
            presetButtons: null, // Will be set after DOM ready
            
            // Inspiration
            needInspirationBtn: document.getElementById('needInspirationBtn'),
            inspirationPanel: document.getElementById('inspirationPanel'),
            closeInspirationBtn: document.getElementById('closeInspirationBtn'),
            
            // Output
            outputSection: document.getElementById('outputSection'),
            outputArea: document.getElementById('outputArea'),
            copyBtn: document.getElementById('copyBtn'),
            speakBtn: document.getElementById('speakBtn'),
            exportBtn: document.getElementById('exportBtn'),
            maximizeOutputBtn: document.getElementById('maximizeOutputBtn'),
            savePromptBtn: document.getElementById('savePromptBtn'),
            
            // Platforms
            platformsGrid: document.getElementById('platformsGrid'),
            platformsEmptyState: document.getElementById('platformsEmptyState'),
            
            // Buttons
            stickyPrepareBtn: document.getElementById('stickyPrepareBtn'),
            stickyResetBtn: document.getElementById('stickyResetBtn'),
            
            // History
            historyBtn: document.getElementById('historyBtn'),
            historySection: document.getElementById('historySection'),
            historyList: document.getElementById('historyList'),
            closeHistoryBtn: document.getElementById('closeHistoryBtn'),
            
            // Suggestions
            suggestionsPanel: document.getElementById('suggestionsPanel'),
            suggestionsList: document.getElementById('suggestionsList'),
            
            // Progress
            progressFill: document.getElementById('progressFill'),
            
            // Settings
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn')
        };

        // Initialize preset buttons after DOM is ready
        setTimeout(() => {
            this.elements.presetButtons = document.querySelectorAll('.preset-btn');
            this.setupPresetButtons();
        }, 100);
    }

    bindEvents() {
        // Input handling
        this.elements.userInput.addEventListener('input', () => this.handleInputChange());
        
        // Prepare prompt button
        this.elements.stickyPrepareBtn.addEventListener('click', () => this.preparePrompt());
        
        // Undo button
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        
        // Copy button
        this.elements.copyBtn.addEventListener('click', () => this.copyPrompt());
        
        // Speak button
        this.elements.speakBtn.addEventListener('click', () => this.toggleSpeech());
        
        // Export button
        this.elements.exportBtn.addEventListener('click', () => this.exportPrompt());
        
        // Save button
        this.elements.savePromptBtn.addEventListener('click', () => this.savePrompt());
        
        // Reset button
        this.elements.stickyResetBtn.addEventListener('click', () => this.resetApp());
        
        // Maximize buttons
        this.elements.maximizeInputBtn.addEventListener('click', () => this.maximizeInput());
        this.elements.maximizeOutputBtn.addEventListener('click', () => this.maximizeOutput());
        
        // Voice button
        this.elements.micBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Inspiration button
        this.elements.needInspirationBtn.addEventListener('click', () => this.toggleInspirationPanel());
        this.elements.closeInspirationBtn.addEventListener('click', () => this.closeInspirationPanel());
        
        // History button
        this.elements.historyBtn.addEventListener('click', () => this.toggleHistory());
        this.elements.closeHistoryBtn.addEventListener('click', () => this.closeHistory());
        
        // Settings button
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        // Output area editing
        this.elements.outputArea.addEventListener('input', () => this.handlePromptEdit());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Close modals on backdrop click
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettings();
            }
        });
    }

    setupPresetButtons() {
        if (!this.elements.presetButtons) return;
        
        this.elements.presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.setPreset(preset);
                
                // Update active state
                this.elements.presetButtons.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    handleInputChange() {
        const text = this.elements.userInput.value;
        const charCount = text.length;
        const maxLength = 5000;
        
        // Update character counter
        this.elements.charCounter.textContent = `${charCount}/${maxLength}`;
        this.elements.charCounter.style.color = charCount > maxLength * 0.9 ? 'var(--danger)' : 'var(--text-tertiary)';
        
        // Detect intent if we have enough text
        if (text.trim().length > 10) {
            this.detectIntent(text);
        } else {
            this.hideIntentChips();
        }
        
        // Update button states
        this.updateButtonStates();
        
        // Auto-scroll for large text
        if (this.elements.userInput.scrollHeight > this.elements.userInput.clientHeight) {
            this.elements.userInput.scrollTop = this.elements.userInput.scrollHeight;
        }
        
        // Clear generated prompt if input is cleared
        if (text.trim().length === 0 && this.state.hasGeneratedPrompt) {
            this.clearGeneratedPrompt();
        }
    }

    detectIntent(text) {
        if (!this.modules.intent) return;
        
        // Show intent progress
        this.elements.intentProgress.style.display = 'flex';
        
        // Use debouncing to avoid too many calls
        clearTimeout(this.intentDetectionTimeout);
        this.intentDetectionTimeout = setTimeout(() => {
            const intent = this.modules.intent.detect(text);
            const chips = this.modules.intent.intentToChips(intent);
            
            this.renderIntentChips(chips);
            
            // Get role and preset
            const { role, preset } = this.modules.intent.getRoleAndPreset(text);
            this.modules.prompt.lastRole = role;
            
            // Auto-select preset if not locked
            if (!this.modules.prompt.userPresetLocked && preset) {
                this.setPreset(preset);
            }
            
            // Hide progress
            this.elements.intentProgress.style.display = 'none';
            
        }, 300);
    }

    renderIntentChips(chips) {
        if (!chips || chips.length === 0) {
            this.hideIntentChips();
            return;
        }
        
        this.elements.intentChipsScroll.innerHTML = '';
        this.elements.intentChips.style.display = 'block';
        
        chips.forEach(chipText => {
            const chip = document.createElement('span');
            chip.className = 'intent-chip';
            chip.textContent = chipText;
            this.elements.intentChipsScroll.appendChild(chip);
        });
        
        // Show preset selector
        this.elements.presetSelector.style.display = 'block';
    }

    hideIntentChips() {
        this.elements.intentChips.style.display = 'none';
        this.elements.presetSelector.style.display = 'none';
        this.elements.intentProgress.style.display = 'none';
    }

    setPreset(presetId) {
        const success = this.modules.prompt.setPreset(presetId);
        if (success) {
            this.services.notification.info(`Preset changed to: ${presetId}`);
        }
    }

    async preparePrompt() {
        const inputText = this.elements.userInput.value.trim();
        
        if (!inputText) {
            this.services.notification.error('Please describe your task first');
            return;
        }
        
        if (inputText.length < 10) {
            this.services.notification.warning('Please provide more details for better results');
            return;
        }
        
        // Show loading state
        this.elements.stickyPrepareBtn.disabled = true;
        this.elements.stickyPrepareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
        
        try {
            // Generate prompt using AI or local generator
            const useAI = localStorage.getItem('use_ai_generation') !== 'false';
            let result;
            
            if (useAI && this.services.api) {
                result = await this.services.api.generatePrompt(inputText);
            } else {
                const prompt = this.modules.prompt.generate(inputText);
                result = {
                    prompt: prompt,
                    model: 'local',
                    modelName: 'Local Generator',
                    provider: 'local',
                    success: true
                };
            }
            
            if (result.success) {
                // Update output
                this.elements.outputArea.textContent = result.prompt;
                this.state.originalPrompt = result.prompt;
                this.state.promptModified = false;
                this.state.hasGeneratedPrompt = true;
                
                // Show output section
                this.elements.outputSection.classList.add('visible');
                
                // Update platforms with ranking
                const intent = this.modules.intent.detect(inputText);
                this.modules.ranker.renderRankedPlatforms(intent);
                
                // Update progress
                this.updateProgress();
                
                // Save to history
                this.saveToHistory(inputText, result.prompt);
                
                // Show success message
                this.services.notification.success(`Prompt generated with ${result.modelName}!`);
                
                // Scroll to output
                setTimeout(() => {
                    this.elements.outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
                
            } else {
                throw new Error(result.error || 'Failed to generate prompt');
            }
            
        } catch (error) {
            console.error('Prompt generation error:', error);
            this.services.notification.error('Failed to generate prompt. Please try again.');
            
            // Fallback to local generation
            const fallbackPrompt = this.modules.prompt.generate(inputText);
            this.elements.outputArea.textContent = fallbackPrompt;
            this.state.originalPrompt = fallbackPrompt;
            this.state.hasGeneratedPrompt = true;
            this.elements.outputSection.classList.add('visible');
            
        } finally {
            // Reset button state
            this.elements.stickyPrepareBtn.disabled = false;
            this.elements.stickyPrepareBtn.innerHTML = '<i class="fas fa-magic"></i> Prepare Prompt';
            this.updateButtonStates();
        }
    }

    updateProgress() {
        let progress = 33; // Step 1
        
        if (this.state.hasGeneratedPrompt) {
            progress = 66;
        }
        
        if (this.state.selectedPlatform) {
            progress = 100;
        }
        
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${progress}%`;
        }
    }

    updateButtonStates() {
        const hasInput = this.elements.userInput.value.trim().length > 0;
        const hasOutput = this.state.hasGeneratedPrompt;
        
        // Prepare button
        this.elements.stickyPrepareBtn.disabled = !hasInput;
        
        // Show/hide prepare button
        if (hasOutput) {
            this.elements.stickyPrepareBtn.classList.add('removed');
            this.elements.stickyResetBtn.classList.remove('hidden');
        } else {
            this.elements.stickyPrepareBtn.classList.remove('removed');
            this.elements.stickyResetBtn.classList.add('hidden');
        }
        
        // Output buttons
        this.elements.copyBtn.disabled = !hasOutput;
        this.elements.speakBtn.disabled = !hasOutput;
        this.elements.exportBtn.disabled = !hasOutput;
        
        // Save button
        this.elements.savePromptBtn.classList.toggle('visible', this.state.promptModified);
        
        // Undo button
        const canUndo = this.state.undoStack.length > 0;
        this.elements.undoBtn.disabled = !canUndo;
        this.elements.undoBtn.classList.toggle('disabled', !canUndo);
    }

    // ... (More methods for other functionality)

    setupTheme() {
        const savedTheme = this.services.storage.loadTheme('dark');
        document.body.className = savedTheme === 'dark' ? 'dark-theme' : '';
    }

    setupVoice() {
        if (this.modules.voice) {
            const savedLanguage = this.services.storage.loadVoiceLanguage('en-US');
            this.modules.voice.updateVoiceLanguage(savedLanguage);
        }
    }

    setupAutoGeneration() {
        const savedDelay = this.services.storage.loadAutoConvertDelay(0);
        if (savedDelay > 0) {
            this.state.autoMode.enabled = true;
            this.state.autoMode.delay = savedDelay;
        }
    }

    loadInitialState() {
        // Load settings
        const settings = this.services.settings.load();
        
        // Load templates
        const templates = this.modules.templates.load();
        
        // Load history
        const history = this.modules.history.load();
        
        // Update UI based on loaded state
        this.updateUI();
    }

    updateUI() {
        // Update footer info
        this.updateFooterInfo();
        
        // Update button states
        this.updateButtonStates();
        
        // Update progress
        this.updateProgress();
    }

    updateFooterInfo() {
        // Update current model
        const model = this.services.storage.loadModel('gemini-1.5-flash');
        const modelConfig = window.MODEL_CONFIG?.[model];
        const modelName = modelConfig?.name || 'Google Gemini';
        
        const currentModelEl = document.getElementById('currentModel');
        if (currentModelEl) {
            currentModelEl.textContent = modelName;
        }
        
        // Update theme
        const theme = this.services.storage.loadTheme('dark');
        const currentThemeEl = document.getElementById('currentTheme');
        if (currentThemeEl) {
            currentThemeEl.textContent = theme === 'dark' ? 'Dark' : 'Light';
        }
        
        // Update language
        const language = this.services.storage.loadVoiceLanguage('en-US');
        const currentLanguageEl = document.getElementById('currentLanguage');
        if (currentLanguageEl) {
            currentLanguageEl.textContent = language.split('-')[0].toUpperCase();
        }
    }

    // ... (Implement remaining methods)

    toggleInspirationPanel() {
        this.state.inspirationPanelOpen = !this.state.inspirationPanelOpen;
        this.elements.inspirationPanel.classList.toggle('expanded', this.state.inspirationPanelOpen);
    }

    closeInspirationPanel() {
        this.state.inspirationPanelOpen = false;
        this.elements.inspirationPanel.classList.remove('expanded');
    }

    toggleHistory() {
        this.state.historyOpen = !this.state.historyOpen;
        this.elements.historySection.classList.toggle('visible', this.state.historyOpen);
        
        if (this.state.historyOpen) {
            this.loadHistory();
        }
    }

    closeHistory() {
        this.state.historyOpen = false;
        this.elements.historySection.classList.remove('visible');
    }

    openSettings() {
        this.elements.settingsModal.classList.add('active');
    }

    closeSettings() {
        this.elements.settingsModal.classList.remove('active');
    }

    saveSettings() {
        // Implement settings save logic
        this.services.notification.success('Settings saved');
        this.closeSettings();
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter to prepare prompt
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.preparePrompt();
        }
        
        // Ctrl/Cmd + Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }
        
        // Ctrl/Cmd + Y for redo
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            this.redo();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            if (this.state.inspirationPanelOpen) {
                this.closeInspirationPanel();
            }
            if (this.state.historyOpen) {
                this.closeHistory();
            }
            if (this.elements.settingsModal.classList.contains('active')) {
                this.closeSettings();
            }
        }
    }

    // ... (Implement other methods like copyPrompt, savePrompt, exportPrompt, etc.)
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.promptCraft = new PromptCraftApp();
});
