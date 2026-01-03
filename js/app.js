// Main Application Controller
class PromptCraftApp {
    constructor() {
        this.state = {
            currentStep: 1,
            hasGeneratedPrompt: false,
            promptModified: false,
            originalPrompt: null,
            selectedPlatform: null,
            isEditorOpen: false,
            currentEditor: null,
            inspirationPanelOpen: false,
            settingsModified: false,
            undoStack: [],
            redoStack: [],
            promptHistory: [],
            currentModel: 'gemini-3-flash-preview',
            settings: this.loadDefaultSettings()
        };

        // Configuration
        this.config = window.AppConfig || {
            WORKER_CONFIG: {
                workerUrl: 'https://promptcraft-api.vijay-shagunkumar.workers.dev/',
                defaultModel: 'gemini-3-flash-preview'
            }
        };
        
        // Initialize managers
        this.storageManager = new StorageManager();
        this.voiceHandler = new VoiceHandler();
        this.platformIntegrations = new PlatformIntegrations();
        
        // Initialize prompt generator
        this.promptGenerator = new PromptGenerator({
            workerUrl: this.config.WORKER_CONFIG?.workerUrl,
            defaultModel: this.config.WORKER_CONFIG?.defaultModel,
            timeout: 30000,
            fallbackToLocal: true
        });

        // Bind elements
        this.elements = {};
        this.bindElements();
        
        // Initialize
        this.init();
    }

    // Load default settings
    loadDefaultSettings() {
        return {
            theme: 'dark',
            uiDensity: 'comfortable',
            defaultModel: 'gemini-3-flash-preview',
            promptStyle: 'detailed',
            autoConvertDelay: 0,
            voiceInputLanguage: 'en-US',
            voiceOutputLanguage: 'en-US',
            interfaceLanguage: 'en',
            maxHistoryItems: 25,
            notificationDuration: 3000
        };
    }

    // Bind DOM elements
    bindElements() {
        this.elements = {
            // Input
            userInput: document.getElementById('userInput'),
            charCounter: document.getElementById('charCounter'),
            undoBtn: document.getElementById('undoBtn'),
            micBtn: document.getElementById('micBtn'),
            maximizeInputBtn: document.getElementById('maximizeInputBtn'),
            needInspirationBtn: document.getElementById('needInspirationBtn'),
            
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
            
            // Inspiration
            inspirationPanel: document.getElementById('inspirationPanel'),
            closeInspirationBtn: document.getElementById('closeInspirationBtn'),
            
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
            
            // Footer
            currentModel: document.getElementById('currentModel'),
            currentTheme: document.getElementById('currentTheme'),
            currentLanguage: document.getElementById('currentLanguage'),
            
            // App container
            appContainer: document.querySelector('.app-container'),
            
            // Notification container (create if doesn't exist)
            notificationContainer: document.getElementById('notificationContainer') || this.createNotificationContainer()
        };
    }

    // Create notification container if it doesn't exist
    createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.id = 'notificationContainer';
        document.body.appendChild(container);
        return container;
    }

    // Initialize application
    async init() {
        console.log('Initializing PromptCraft Pro...');
        
        // Load settings
        this.loadSettings();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up voice handler callbacks
        this.setupVoiceCallbacks();
        
        // Update UI
        this.updateUI();
        
        // Load history
        this.loadHistory();
        
        // Test worker connection
        await this.testWorkerConnection();
        
        // Update model display
        this.updateModelDisplay();
        
        console.log('PromptCraft Pro initialized successfully!');
    }

    // Set up event listeners
    setupEventListeners() {
        // Input handling
        this.elements.userInput.addEventListener('input', () => this.handleInputChange());
        
        // Button events
        this.elements.stickyPrepareBtn.addEventListener('click', () => this.preparePrompt());
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        this.elements.copyBtn.addEventListener('click', () => this.copyPrompt());
        this.elements.speakBtn.addEventListener('click', () => this.toggleSpeech());
        this.elements.exportBtn.addEventListener('click', () => this.exportPrompt());
        this.elements.savePromptBtn.addEventListener('click', () => this.savePrompt());
        this.elements.stickyResetBtn.addEventListener('click', () => this.resetApplication());
        
        // Voice button
        this.elements.micBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Maximize buttons
        this.elements.maximizeInputBtn.addEventListener('click', () => this.openFullScreenEditor('input'));
        this.elements.maximizeOutputBtn.addEventListener('click', () => this.openFullScreenEditor('output'));
        
        // Inspiration
        this.elements.needInspirationBtn.addEventListener('click', () => this.toggleInspirationPanel());
        this.elements.closeInspirationBtn.addEventListener('click', () => this.closeInspirationPanel());
        
        // History
        this.elements.historyBtn.addEventListener('click', () => this.toggleHistory());
        this.elements.closeHistoryBtn.addEventListener('click', () => this.closeHistory());
        
        // Platform clicks
        this.elements.platformsGrid.addEventListener('click', (e) => {
            const platformCard = e.target.closest('.platform-card');
            if (platformCard) {
                this.handlePlatformClick(platformCard.dataset.platform);
            }
        });
        
        // Output editing
        this.elements.outputArea.addEventListener('input', () => this.handlePromptEdit());
        
        // Inspiration items
        document.querySelectorAll('.inspiration-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.insertExample(e.currentTarget.dataset.type);
                this.closeInspirationPanel();
            });
        });
        
        // Settings button
        this.elements.settingsBtn = document.getElementById('settingsBtn');
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        }
        
        // Settings modal buttons
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        }
        
        if (cancelSettingsBtn) {
            cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
        }
        
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettingsModal());
        }
        
        // Close settings when clicking outside
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.closeSettings();
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Auto-generation
        this.setupAutoGeneration();
    }

    // Set up voice handler callbacks
    setupVoiceCallbacks() {
        this.voiceHandler.setCallbacks({
            onListeningStart: () => {
                this.showNotification('Listening... Start speaking', 'info');
            },
            onTranscript: (text) => {
                if (this.state.isEditorOpen && this.state.currentEditor === 'input') {
                    // Handle editor voice input
                    const editor = document.getElementById('editorTextarea');
                    if (editor) editor.value += text;
                } else {
                    this.elements.userInput.value += text;
                    this.handleInputChange();
                }
            },
            onSpeakingStart: () => {
                this.showNotification('Reading prompt...', 'info');
            },
            onSpeakingEnd: () => {
                this.showNotification('Finished reading prompt', 'info');
            },
            onError: (error) => {
                this.showNotification(`Voice error: ${error}`, 'error');
            }
        });
    }

    // Set up auto-generation
    setupAutoGeneration() {
        let debounceTimer;
        this.elements.userInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            
            const delay = this.state.settings.autoConvertDelay;
            if (delay > 0 && this.elements.userInput.value.trim().length > 10) {
                this.elements.userInput.classList.add('auto-generating');
                
                debounceTimer = setTimeout(() => {
                    if (this.elements.userInput.value.trim().length > 10) {
                        this.preparePrompt();
                    }
                    this.elements.userInput.classList.remove('auto-generating');
                }, delay);
            }
        });
    }

    // Handle input changes
    handleInputChange() {
        const text = this.elements.userInput.value;
        const charCount = text.length;
        const maxLength = 5000;
        
        // Update character counter
        this.elements.charCounter.textContent = `${charCount}/${maxLength}`;
        this.elements.charCounter.style.color = charCount > maxLength * 0.9 ? 'var(--danger)' : 'var(--text-tertiary)';
        
        // Update button states
        this.updateButtonStates();
        
        // Clear generated prompt if Step 1 input is cleared
        if (text.trim().length === 0 && this.state.hasGeneratedPrompt) {
            this.clearGeneratedPrompt();
        }
    }

    // Handle prompt editing
    handlePromptEdit() {
        const currentContent = this.elements.outputArea.textContent.trim();
        this.state.promptModified = currentContent !== this.state.originalPrompt;
        this.updateButtonStates();
    }

    // ======================
    // PROMPT GENERATION
    // ======================

    // Prepare prompt (main generation)
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
        
        // Get selected model
        const selectedModel = this.state.currentModel || 'gemini-3-flash-preview';
        
        // Show loading state
        this.showLoading(true);
        
        try {
            console.log(`Generating prompt with model: ${selectedModel}`);
            
            // Generate prompt using Cloudflare Worker
            const result = await this.promptGenerator.generatePrompt(inputText, {
                model: selectedModel,
                style: 'detailed',
                temperature: 0.4
            });
            
            if (result.success) {
                // Update output
                this.elements.outputArea.textContent = result.prompt;
                this.state.originalPrompt = result.prompt;
                this.state.promptModified = false;
                this.state.hasGeneratedPrompt = true;
                
                // Show output section
                this.elements.outputSection.classList.add('visible');
                
                // Update platforms
                this.platformIntegrations.renderPlatforms(this.elements.platformsGrid);
                
                // Update progress and UI
                this.updateProgress();
                this.updateButtonStates();
                
                // Generate and show suggestions
                this.showSuggestions(result.suggestions);
                
                // Save to history with model info
                this.saveToHistory(inputText, result.prompt, selectedModel);
                
                // Show success message with model info
                const modelDisplayName = this.getModelDisplayName(selectedModel);
                this.showNotification(`Prompt generated successfully with ${modelDisplayName}!`, 'success');
                
            } else {
                throw new Error('Failed to generate prompt');
            }
            
        } catch (error) {
            console.error('Prompt generation error:', error);
            this.showNotification(`Failed to generate with ${selectedModel}. Trying fallback...`, 'warning');
            
            // Try fallback models
            await this.tryFallbackModels(inputText);
            
        } finally {
            this.showLoading(false);
        }
    }

    // Try fallback models
    async tryFallbackModels(inputText) {
        const fallbackModels = ['gpt-4o-mini', 'llama-3.1-8b-instant'];
        let fallbackSuccess = false;
        
        for (const fallbackModel of fallbackModels) {
            try {
                this.showNotification(`Trying ${fallbackModel}...`, 'info');
                const fallbackResult = await this.promptGenerator.generatePrompt(inputText, {
                    model: fallbackModel,
                    style: 'detailed',
                    temperature: 0.4
                });
                
                if (fallbackResult.success) {
                    this.elements.outputArea.textContent = fallbackResult.prompt;
                    this.state.originalPrompt = fallbackResult.prompt;
                    this.state.hasGeneratedPrompt = true;
                    this.elements.outputSection.classList.add('visible');
                    this.platformIntegrations.renderPlatforms(this.elements.platformsGrid);
                    this.updateProgress();
                    this.updateButtonStates();
                    this.showSuggestions(fallbackResult.suggestions);
                    this.saveToHistory(inputText, fallbackResult.prompt, fallbackModel);
                    
                    this.state.currentModel = fallbackModel;
                    this.updateModelDisplay();
                    
                    this.showNotification(`Generated with fallback model ${fallbackModel}`, 'success');
                    fallbackSuccess = true;
                    break;
                }
            } catch (fallbackError) {
                console.warn(`Fallback ${fallbackModel} failed:`, fallbackError.message);
                continue;
            }
        }
        
        // If all fallbacks fail, use local generation
        if (!fallbackSuccess) {
            this.showNotification('Using local generation...', 'info');
            const localResult = this.promptGenerator.generatePromptLocally(inputText);
            this.elements.outputArea.textContent = localResult.prompt;
            this.state.originalPrompt = localResult.prompt;
            this.state.hasGeneratedPrompt = true;
            this.elements.outputSection.classList.add('visible');
            this.platformIntegrations.renderPlatforms(this.elements.platformsGrid);
            this.updateProgress();
            this.updateButtonStates();
            this.showSuggestions(localResult.suggestions);
            this.saveToHistory(inputText, localResult.prompt, 'local-fallback');
            
            this.showNotification('Generated locally (AI service unavailable)', 'warning');
        }
    }

    // Get model display name
    getModelDisplayName(modelId) {
        const modelNames = {
            'gemini-3-flash-preview': 'Gemini 3 Flash',
            'gpt-4o-mini': 'GPT-4o Mini',
            'llama-3.1-8b-instant': 'Llama 3.1 8B',
            'local-fallback': 'Local AI'
        };
        return modelNames[modelId] || modelId;
    }

    // ======================
    // PLATFORM INTEGRATION
    // ======================

    // Handle platform click
    async handlePlatformClick(platformId) {
        const prompt = this.elements.outputArea.textContent.trim();
        
        if (!prompt || prompt === this.elements.outputArea.dataset.placeholder) {
            this.showNotification('Please generate a prompt first', 'error');
            return;
        }
        
        const result = await this.platformIntegrations.copyAndLaunch(platformId, prompt, (response) => {
            if (response.success) {
                this.showNotification(`Prompt copied! Opening ${response.platformName}...`, 'success');
                this.state.selectedPlatform = platformId;
                this.updateProgress();
                this.updatePlatformSelection();
                
                // Open platform
                if (response.launchUrl) {
                    window.open(response.launchUrl, '_blank');
                }
            } else {
                this.showNotification('Failed to copy prompt', 'error');
            }
        });
    }

    // Update platform selection UI
    updatePlatformSelection() {
        document.querySelectorAll('.platform-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.platform === this.state.selectedPlatform) {
                card.classList.add('selected');
            }
        });
    }

    // ======================
    // PROMPT ACTIONS
    // ======================

    // Copy prompt to clipboard
    async copyPrompt() {
        const text = this.elements.outputArea.textContent.trim();
        
        if (!text || text === this.elements.outputArea.dataset.placeholder) {
            this.showNotification('No prompt to copy', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Prompt copied to clipboard!', 'success');
            
            // Visual feedback
            this.elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                this.elements.copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
            
        } catch (err) {
            console.error('Copy failed:', err);
            this.showNotification('Failed to copy. Please try again.', 'error');
        }
    }

    // Toggle speech
    toggleSpeech() {
        const text = this.elements.outputArea.textContent.trim();
        
        if (!text || text === this.elements.outputArea.dataset.placeholder) {
            this.showNotification('No prompt to read', 'error');
            return;
        }
        
        this.voiceHandler.toggleSpeaking(text, {
            lang: this.state.settings.voiceOutputLanguage || 'en-US'
        });
    }

    // Toggle voice input
    toggleVoiceInput() {
        this.voiceHandler.toggleListening(this.state.settings.voiceInputLanguage || 'en-US');
    }

    // Export prompt
    exportPrompt() {
        const prompt = this.elements.outputArea.textContent.trim();
        
        if (!prompt || prompt === this.elements.outputArea.dataset.placeholder) {
            this.showNotification('No prompt to export', 'error');
            return;
        }
        
        const blob = new Blob([prompt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `prompt-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Prompt exported successfully!', 'success');
    }

    // Save prompt
    savePrompt() {
        this.state.originalPrompt = this.elements.outputArea.textContent.trim();
        this.state.promptModified = false;
        this.updateButtonStates();
        this.showNotification('Prompt saved!', 'success');
    }

    // ======================
    // APPLICATION CONTROLS
    // ======================

    // Reset application
    resetApplication() {
        // Clear undo/redo stacks
        this.state.undoStack = [];
        this.state.redoStack = [];
        
        // Clear input
        this.elements.userInput.value = '';
        
        // Clear generated prompt
        this.clearGeneratedPrompt();
        
        // Hide history
        this.closeHistory();
        
        // Reset model
        this.state.currentModel = 'gemini-3-flash-preview';
        this.updateModelDisplay();
        
        // Update button states
        this.updateButtonStates();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.showNotification('Application reset to initial state', 'info');
    }

    // Clear generated prompt
    clearGeneratedPrompt() {
        this.elements.outputArea.textContent = '';
        this.state.originalPrompt = null;
        this.state.promptModified = false;
        this.state.hasGeneratedPrompt = false;
        this.state.selectedPlatform = null;
        this.elements.outputSection.classList.remove('visible');
        this.updateProgress();
        this.updateButtonStates();
    }

    // Undo
    undo() {
        if (this.state.undoStack.length === 0) {
            this.showNotification('Nothing to undo', 'info');
            return;
        }
        
        const lastAction = this.state.undoStack.pop();
        this.state.redoStack.push(lastAction);
        
        // Restore previous state
        if (lastAction.type === 'input') {
            this.elements.userInput.value = lastAction.value;
            this.handleInputChange();
        } else if (lastAction.type === 'output') {
            this.elements.outputArea.textContent = lastAction.value;
            this.handlePromptEdit();
        }
        
        this.showNotification('Undo completed', 'info');
    }

    // ======================
    // SETTINGS MODAL
    // ======================

    // Open settings modal
    openSettings() {
        console.log('Opening settings...');
        
        // Load current settings into form
        this.loadSettingsIntoForm();
        
        // Show modal
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            console.error('Settings modal not found!');
            this.showNotification('Settings modal not found. Please refresh the page.', 'error');
        }
    }

    // Close settings modal
    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    }

    // Load settings into form
    loadSettingsIntoForm() {
        // Theme
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) themeSelect.value = this.state.settings.theme || 'dark';
        
        // UI Density
        const uiDensity = document.getElementById('uiDensity');
        if (uiDensity) uiDensity.value = this.state.settings.uiDensity || 'comfortable';
        
        // Default Model
        const defaultModel = document.getElementById('defaultModel');
        if (defaultModel) defaultModel.value = this.state.settings.defaultModel || 'gemini-3-flash-preview';
        
        // Prompt Style
        const promptStyle = document.getElementById('promptStyle');
        if (promptStyle) promptStyle.value = this.state.settings.promptStyle || 'detailed';
        
        // Auto-convert delay
        const autoConvertDelay = document.getElementById('autoConvertDelay');
        if (autoConvertDelay) autoConvertDelay.value = this.state.settings.autoConvertDelay || 0;
        
        // Notification duration
        const notificationDuration = document.getElementById('notificationDuration');
        if (notificationDuration) notificationDuration.value = this.state.settings.notificationDuration || 3000;
        
        // Max history items
        const maxHistoryItems = document.getElementById('maxHistoryItems');
        if (maxHistoryItems) maxHistoryItems.value = this.state.settings.maxHistoryItems || 25;
        
        // Language settings
        const interfaceLanguage = document.getElementById('interfaceLanguage');
        if (interfaceLanguage) interfaceLanguage.value = this.state.settings.interfaceLanguage || 'en';
        
        const voiceInputLanguage = document.getElementById('voiceInputLanguage');
        if (voiceInputLanguage) voiceInputLanguage.value = this.state.settings.voiceInputLanguage || 'en-US';
        
        const voiceOutputLanguage = document.getElementById('voiceOutputLanguage');
        if (voiceOutputLanguage) voiceOutputLanguage.value = this.state.settings.voiceOutputLanguage || 'en-US';
    }

    // Save settings from modal
    saveSettingsModal() {
        // Get values from form
        const themeSelect = document.getElementById('themeSelect');
        const uiDensity = document.getElementById('uiDensity');
        const defaultModel = document.getElementById('defaultModel');
        const promptStyle = document.getElementById('promptStyle');
        const autoConvertDelay = document.getElementById('autoConvertDelay');
        const notificationDuration = document.getElementById('notificationDuration');
        const maxHistoryItems = document.getElementById('maxHistoryItems');
        const interfaceLanguage = document.getElementById('interfaceLanguage');
        const voiceInputLanguage = document.getElementById('voiceInputLanguage');
        const voiceOutputLanguage = document.getElementById('voiceOutputLanguage');
        
        // Update settings
        if (themeSelect) {
            this.state.settings.theme = themeSelect.value;
            this.applyTheme();
        }
        
        if (uiDensity) {
            this.state.settings.uiDensity = uiDensity.value;
            this.applyUIDensity();
        }
        
        if (defaultModel) {
            this.state.settings.defaultModel = defaultModel.value;
            this.state.currentModel = defaultModel.value;
            this.updateModelDisplay();
        }
        
        if (promptStyle) this.state.settings.promptStyle = promptStyle.value;
        if (autoConvertDelay) this.state.settings.autoConvertDelay = parseInt(autoConvertDelay.value);
        if (notificationDuration) this.state.settings.notificationDuration = parseInt(notificationDuration.value);
        if (maxHistoryItems) this.state.settings.maxHistoryItems = parseInt(maxHistoryItems.value);
        if (interfaceLanguage) this.state.settings.interfaceLanguage = interfaceLanguage.value;
        if (voiceInputLanguage) this.state.settings.voiceInputLanguage = voiceInputLanguage.value;
        if (voiceOutputLanguage) this.state.settings.voiceOutputLanguage = voiceOutputLanguage.value;
        
        // Save to storage
        this.saveSettings();
        
        // Close modal
        this.closeSettings();
        
        // Show success message
        this.showNotification('Settings saved successfully!', 'success');
    }

    // ======================
    // FULL SCREEN EDITOR
    // ======================

    // Open full screen editor
    openFullScreenEditor(type) {
        console.log('Opening full screen editor for:', type);
        
        this.state.isEditorOpen = true;
        this.state.currentEditor = type;
        
        const editor = document.getElementById('fullScreenEditor');
        const editorTextarea = document.getElementById('editorTextarea');
        const editorTitle = document.getElementById('editorTitle');
        const editorPrepareBtn = document.getElementById('editorPrepareBtn');
        
        if (!editor || !editorTextarea) {
            console.error('Full screen editor elements not found!');
            this.showNotification('Editor not available. Please refresh the page.', 'error');
            return;
        }
        
        // Set editor content based on type
        let text = '';
        if (type === 'input') {
            text = this.elements.userInput.value;
            editorTitle.textContent = 'Edit Input';
            if (editorPrepareBtn) {
                editorPrepareBtn.style.display = 'flex';
                editorPrepareBtn.disabled = !text.trim();
            }
        } else {
            text = this.elements.outputArea.textContent;
            editorTitle.textContent = 'Edit Output';
            if (editorPrepareBtn) {
                editorPrepareBtn.style.display = 'none';
            }
        }
        
        // Set text and show editor
        editorTextarea.value = text;
        editor.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Focus on textarea
        setTimeout(() => {
            editorTextarea.focus();
            editorTextarea.setSelectionRange(text.length, text.length);
        }, 100);
        
        // Setup editor events
        this.setupEditorEvents();
    }

    // Setup editor events
    setupEditorEvents() {
        const editorTextarea = document.getElementById('editorTextarea');
        const editorPrepareBtn = document.getElementById('editorPrepareBtn');
        const closeEditorBtn = document.getElementById('closeEditorBtn');
        const editorMicBtn = document.getElementById('editorMicBtn');
        const editorUndoBtn = document.getElementById('editorUndoBtn');
        
        if (!editorTextarea) return;
        
        // Update prepare button state
        editorTextarea.addEventListener('input', () => {
            if (editorPrepareBtn) {
                editorPrepareBtn.disabled = !editorTextarea.value.trim();
            }
        });
        
        // Prepare from editor
        if (editorPrepareBtn) {
            editorPrepareBtn.onclick = () => this.prepareFromEditor();
        }
        
        // Close editor
        if (closeEditorBtn) {
            closeEditorBtn.onclick = () => this.closeFullScreenEditor();
        }
        
        // Voice input in editor
        if (editorMicBtn) {
            editorMicBtn.onclick = () => {
                this.voiceHandler.toggleListening(this.state.settings.voiceInputLanguage || 'en-US');
            };
        }
        
        // Undo in editor
        if (editorUndoBtn) {
            editorUndoBtn.onclick = () => {
                // Simple undo for editor
                document.execCommand('undo');
            };
        }
        
        // Keyboard shortcuts in editor
        editorTextarea.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to prepare
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (this.state.currentEditor === 'input' && editorPrepareBtn && !editorPrepareBtn.disabled) {
                    this.prepareFromEditor();
                }
            }
            
            // Escape to close
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closeFullScreenEditor();
            }
        });
    }

    // Prepare from editor
    async prepareFromEditor() {
        const editorTextarea = document.getElementById('editorTextarea');
        if (!editorTextarea) return;
        
        const inputText = editorTextarea.value.trim();
        
        if (!inputText) {
            this.showNotification('Please describe your task first', 'error');
            return;
        }
        
        // Update main input
        this.elements.userInput.value = inputText;
        this.handleInputChange();
        
        // Close editor
        this.closeFullScreenEditor();
        
        // Generate prompt
        await this.preparePrompt();
    }

    // Close full screen editor
    closeFullScreenEditor() {
        const editor = document.getElementById('fullScreenEditor');
        const editorTextarea = document.getElementById('editorTextarea');
        
        if (editor && editorTextarea) {
            // Save changes if editing output
            if (this.state.currentEditor === 'output') {
                const newText = editorTextarea.value;
                this.elements.outputArea.textContent = newText;
                this.handlePromptEdit();
            }
            
            // Close editor
            editor.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable scrolling
            this.state.isEditorOpen = false;
            this.state.currentEditor = null;
        }
    }

    // ======================
    // UI CONTROLS
    // ======================

    // Toggle inspiration panel
    toggleInspirationPanel() {
        if (this.state.inspirationPanelOpen) {
            this.closeInspirationPanel();
        } else {
            this.openInspirationPanel();
        }
    }

    openInspirationPanel() {
        this.state.inspirationPanelOpen = true;
        this.elements.inspirationPanel.classList.add('expanded');
        this.elements.needInspirationBtn.innerHTML = '<i class="fas fa-lightbulb"></i> ';
    }

    closeInspirationPanel() {
        this.state.inspirationPanelOpen = false;
        this.elements.inspirationPanel.classList.remove('expanded');
        this.elements.needInspirationBtn.innerHTML = '<i class="fas fa-lightbulb"></i>';
    }

    // Insert example
    insertExample(type) {
        const examples = {
            email: `Compose a professional follow-up email to a client who attended our product demo last week. The email should:
1. Thank them for their time
2. Highlight 2-3 key features relevant to their business needs
3. Include a clear call-to-action for next steps
4. Maintain a warm but professional tone
5. Be concise (under 200 words)`,
            
            code: `Write a Python function that:
- Accepts a list of numbers
- Returns a dictionary with the following statistics:
  * mean, median, mode
  * standard deviation
  * min and max values
  * 25th, 50th, and 75th percentiles
- Include comprehensive error handling
- Add clear docstrings and type hints
- Optimize for performance with large datasets`,
            
            analysis: `Analyze the following sales data and provide insights:
- Monthly sales figures for the past 24 months
- Product category breakdown
- Regional performance comparison
- Customer acquisition vs retention rates
- Seasonal trends and patterns

Please provide:
1. Executive summary of key findings
2. Visual chart recommendations
3. Three strategic recommendations
4. Risk factors to monitor
5. Key performance indicators for tracking`,
            
            creative: `Write a short story (500-700 words) about:
- A retired astronaut discovering a mysterious signal
- Set in a near-future where space tourism is common
- Include themes of discovery, aging, and legacy
- Create vivid sensory descriptions
- Build suspense and emotional depth`,
            
            strategy: `Develop a go-to-market strategy for a new AI-powered project management tool targeting:
- Small to medium businesses (50-500 employees)
- Remote and hybrid teams
- Competitive with Asana, Trello, and Monday.com

Include:
1. Target customer personas
2. Unique value proposition
3. Pricing strategy
4. Marketing channels and tactics
5. Sales funnel design
6. Success metrics and milestones`,
            
            research: `Summarize the current state of quantum computing for business applications:
- Key technological breakthroughs in the last 2 years
- Major players and their approaches (Google, IBM, Microsoft, etc.)
- Practical applications in finance, logistics, and drug discovery
- Timeline for commercial viability
- Investment opportunities and risks
- Skills and talent required for adoption`
        };
        
        const example = examples[type];
        if (example) {
            this.elements.userInput.value = example;
            this.handleInputChange();
            this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} example loaded`, 'success');
        }
    }

    // Toggle history
    toggleHistory() {
        const isVisible = this.elements.historySection.classList.contains('visible');
        if (isVisible) {
            this.closeHistory();
        } else {
            this.loadHistoryItems();
            this.elements.historySection.classList.add('visible');
        }
    }

    closeHistory() {
        this.elements.historySection.classList.remove('visible');
    }

    // ======================
    // SUGGESTIONS
    // ======================

    // Show suggestions
    showSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            this.elements.suggestionsPanel.classList.remove('visible');
            return;
        }
        
        this.elements.suggestionsList.innerHTML = suggestions.map(s => `
            <div class="suggestion-item" onclick="window.app.applySuggestion('${s.action.replace(/'/g, "\\'")}')">
                <i class="${s.icon}" style="color: var(--primary);"></i>
                <span>${s.text}</span>
            </div>
        `).join('');
        
        this.elements.suggestionsPanel.classList.add('visible');
    }

    // Apply suggestion
    applySuggestion(action) {
        const currentPrompt = this.elements.outputArea.textContent.trim();
        this.elements.outputArea.textContent = currentPrompt + '\n\n' + action;
        this.handlePromptEdit();
        this.showNotification('Suggestion applied', 'success');
    }

    // ======================
    // HISTORY MANAGEMENT
    // ======================

    // Save to history
    saveToHistory(input, output, model) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
            output: output.substring(0, 200) + (output.length > 200 ? '...' : ''),
            fullInput: input,
            fullOutput: output,
            model: model
        };
        
        this.state.promptHistory.unshift(historyItem);
        
        // Limit history size
        const maxItems = this.state.settings.maxHistoryItems || 25;
        if (this.state.promptHistory.length > maxItems) {
            this.state.promptHistory = this.state.promptHistory.slice(0, maxItems);
        }
        
        this.saveHistory();
    }

    // Load history items
    loadHistoryItems() {
        const historyList = this.elements.historyList;
        historyList.innerHTML = '';
        
        if (this.state.promptHistory.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <div class="history-empty-icon">
                        <i class="fas fa-history"></i>
                    </div>
                    <p>No history yet</p>
                    <p class="history-empty-subtitle">Generated prompts will appear here</p>
                </div>
            `;
            return;
        }
        
        this.state.promptHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.dataset.id = item.id;
            
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            historyItem.innerHTML = `
                <div class="history-item-header">
                    <span class="history-item-date">${formattedDate}</span>
                    <span class="history-item-model">${this.getModelDisplayName(item.model)}</span>
                </div>
                <div class="history-item-input">${this.escapeHtml(item.input)}</div>
                <div class="history-item-actions">
                    <button class="btn-icon" title="Load" onclick="window.app.loadHistoryItem('${item.id}')">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="btn-icon" title="View Full" onclick="window.app.viewFullHistoryItem('${item.id}')">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="btn-icon" title="Delete" onclick="window.app.deleteHistoryItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    // Load history item
    loadHistoryItem(id) {
        const item = this.state.promptHistory.find(i => i.id == id);
        if (!item) return;
        
        this.elements.userInput.value = item.fullInput;
        this.elements.outputArea.textContent = item.fullOutput;
        this.state.originalPrompt = item.fullOutput;
        this.state.promptModified = false;
        this.state.hasGeneratedPrompt = true;
        this.state.currentModel = item.model;
        
        // Update UI
        this.elements.outputSection.classList.add('visible');
        this.updateButtonStates();
        this.updateModelDisplay();
        
        // Scroll to output
        this.elements.outputSection.scrollIntoView({ behavior: 'smooth' });
        
        this.showNotification('History item loaded', 'success');
    }

    // View full history item
    viewFullHistoryItem(id) {
        const item = this.state.promptHistory.find(i => i.id == id);
        if (!item) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Prompt History</h3>
                    <button class="btn-icon close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="history-full-view">
                        <div class="history-section">
                            <h4>Original Input</h4>
                            <div class="history-full-text">${this.escapeHtml(item.fullInput)}</div>
                        </div>
                        <div class="history-section">
                            <h4>Generated Prompt</h4>
                            <div class="history-full-text">${this.escapeHtml(item.fullOutput)}</div>
                        </div>
                        <div class="history-meta">
                            <span><i class="fas fa-calendar"></i> ${new Date(item.timestamp).toLocaleString()}</span>
                            <span><i class="fas fa-brain"></i> ${this.getModelDisplayName(item.model)}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                    <button class="btn btn-primary" onclick="window.app.loadHistoryItem('${item.id}'); this.closest('.modal').remove()">Load This Prompt</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }

    // Delete history item
    deleteHistoryItem(id) {
        const index = this.state.promptHistory.findIndex(i => i.id == id);
        if (index === -1) return;
        
        this.state.promptHistory.splice(index, 1);
        this.saveHistory();
        this.loadHistoryItems();
        
        this.showNotification('History item deleted', 'info');
    }

    // Escape HTML for safe rendering
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ======================
    // SETTINGS & STORAGE (FIXED)
    // ======================

    // Load settings from storage
    loadSettings() {
        const saved = this.storageManager.load('promptCraftSettings');
        if (saved) {
            this.state.settings = { ...this.loadDefaultSettings(), ...saved };
            
            // Apply settings
            this.applyTheme();
            this.applyUIDensity();
        }
    }

    // Save settings to storage
    saveSettings() {
        this.storageManager.save('promptCraftSettings', this.state.settings);
    }

    // Load history from storage
    loadHistory() {
        const saved = this.storageManager.load('promptCraftHistory', []);
        if (saved && Array.isArray(saved)) {
            this.state.promptHistory = saved;
        }
    }

    // Save history to storage
    saveHistory() {
        this.storageManager.save('promptCraftHistory', this.state.promptHistory);
    }

    // Apply theme
    applyTheme() {
        const theme = this.state.settings.theme || 'dark';
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            if (this.elements.currentTheme) {
                this.elements.currentTheme.textContent = prefersDark ? 'Dark' : 'Light';
            }
        } else {
            document.documentElement.setAttribute('data-theme', theme);
            if (this.elements.currentTheme) {
                this.elements.currentTheme.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
            }
        }
    }

    // Apply UI density
    applyUIDensity() {
        const density = this.state.settings.uiDensity || 'comfortable';
        this.elements.appContainer.className = `app-container ${density}`;
    }

    // ======================
    // UI UPDATES
    // ======================

    // Update model display
    updateModelDisplay() {
        if (this.elements.currentModel) {
            this.elements.currentModel.textContent = this.getModelDisplayName(this.state.currentModel);
        }
    }

    // Test worker connection
    async testWorkerConnection() {
        try {
            const testResult = await this.promptGenerator.testConnection();
            if (testResult.success) {
                console.log('Worker connection test successful');
                return true;
            } else {
                console.warn('Worker connection test failed:', testResult.error);
                return false;
            }
        } catch (error) {
            console.error('Worker connection test error:', error);
            return false;
        }
    }

    // Show loading state
    showLoading(show) {
        const btn = this.elements.stickyPrepareBtn;
        if (show) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-magic"></i> Prepare Prompt';
        }
    }

    // Update progress
    updateProgress() {
        let progress = 0;
        
        if (this.elements.userInput.value.trim().length > 10) {
            progress += 33;
        }
        
        if (this.state.hasGeneratedPrompt) {
            progress += 33;
        }
        
        if (this.state.selectedPlatform) {
            progress += 34;
        }
        
        this.elements.progressFill.style.width = `${progress}%`;
    }

    // Update button states
    updateButtonStates() {
        const hasInput = this.elements.userInput.value.trim().length > 0;
        const hasOutput = this.state.hasGeneratedPrompt;
        const isModified = this.state.promptModified;
        
        // Prepare button
        this.elements.stickyPrepareBtn.disabled = !hasInput;
        
        // Save button
        this.elements.savePromptBtn.disabled = !isModified;
        
        // Copy, speak, export buttons
        const outputButtons = [this.elements.copyBtn, this.elements.speakBtn, this.elements.exportBtn];
        outputButtons.forEach(btn => btn.disabled = !hasOutput);
        
        // Undo button
        this.elements.undoBtn.disabled = this.state.undoStack.length === 0;
        
        // Platform buttons
        const platformCards = document.querySelectorAll('.platform-card');
        platformCards.forEach(card => {
            card.style.opacity = hasOutput ? '1' : '0.5';
            card.style.pointerEvents = hasOutput ? 'auto' : 'none';
        });
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Don't trigger shortcuts if user is typing in input or textarea
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
            // Special case: Ctrl/Cmd + Enter in main input
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && e.target === this.elements.userInput) {
                e.preventDefault();
                if (!this.elements.stickyPrepareBtn.disabled) {
                    this.preparePrompt();
                }
                return;
            }
            return;
        }
        
        // Global shortcuts
        switch (e.key) {
            case 'Escape':
                if (this.state.isEditorOpen) {
                    this.closeFullScreenEditor();
                    e.preventDefault();
                }
                if (this.state.inspirationPanelOpen) {
                    this.closeInspirationPanel();
                    e.preventDefault();
                }
                break;
                
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.resetApplication();
                }
                break;
                
            case 'h':
            case 'H':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.toggleHistory();
                }
                break;
                
            case 'i':
            case 'I':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.toggleInspirationPanel();
                }
                break;
                
            case 'z':
            case 'Z':
                if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                }
                break;
                
            case 'c':
            case 'C':
                if ((e.ctrlKey || e.metaKey) && e.altKey) {
                    e.preventDefault();
                    if (!this.elements.copyBtn.disabled) {
                        this.copyPrompt();
                    }
                }
                break;
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="btn-icon" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.elements.notificationContainer.appendChild(notification);
        
        // Auto-remove after duration
        const duration = this.state.settings.notificationDuration || 3000;
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    // Update UI
    updateUI() {
        this.updateProgress();
        this.updateButtonStates();
        this.updateModelDisplay();
        
        // Update language display
        if (this.elements.currentLanguage) {
            const lang = this.state.settings.interfaceLanguage || 'en';
            this.elements.currentLanguage.textContent = lang.toUpperCase();
        }
    }

    // ======================
    // CLEANUP
    // ======================

    // Cleanup method
    destroy() {
        // Save data before cleanup
        this.saveSettings();
        this.saveHistory();
        
        // Cleanup voice handler if available
        if (this.voiceHandler && typeof this.voiceHandler.destroy === 'function') {
            this.voiceHandler.destroy();
        }
        
        // Cleanup prompt generator if available
        if (this.promptGenerator && typeof this.promptGenerator.clearSensitiveData === 'function') {
            this.promptGenerator.clearSensitiveData();
        }
        
        console.log('PromptCraftApp destroyed');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PromptCraftApp();
});
