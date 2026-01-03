// Main Application Controller
class PromptCraftApp {
    constructor() {
        // Add global error handler to catch HTML syntax errors
        window.addEventListener('error', (event) => {
            console.error('Global error caught:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
            
            // Check if it's a syntax error from our output
            if (event.message.includes('Invalid or unexpected token') && 
                event.filename.includes('index.html')) {
                console.error('⚠️ HTML Syntax Error detected - likely from output injection');
                
                // Try to recover by clearing output
                if (this.elements && this.elements.outputArea) {
                    this.elements.outputArea.textContent = 'Error: Generated content contained invalid characters. Please try again.';
                    this.showNotification('Content error detected. Please regenerate prompt.', 'error');
                }
            }
            
            event.preventDefault();
        });
        
        // Also catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });
        
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
            fallbackToLocal: true,
            enableDebug: true
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
        
        try {
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
            
            // Test worker connection (don't block initialization)
            this.testWorkerConnection().catch(error => {
                console.warn('Worker test failed, continuing with local mode:', error);
            });
            
            // Update model display
            this.updateModelDisplay();
            
            console.log('PromptCraft Pro initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize PromptCraft:', error);
            this.showNotification('Failed to initialize application. Please refresh the page.', 'error');
        }
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
            
            // Enable save button when form changes
            settingsModal.addEventListener('change', () => {
                if (saveSettingsBtn) {
                    saveSettingsBtn.disabled = false;
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
    // PROMPT GENERATION - FIXED VERSION
    // ======================

    // Prepare prompt (main generation) - FIXED VERSION
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
            console.log(`=== STARTING PROMPT GENERATION ===`);
            console.log(`Model: ${selectedModel}`);
            console.log(`Input length: ${inputText.length} chars`);
            console.log(`Input preview: ${inputText.substring(0, 100)}...`);
            
            // Generate prompt using Cloudflare Worker
            const result = await this.promptGenerator.generatePrompt(inputText, {
                model: selectedModel,
                style: 'detailed',
                temperature: 0.4,
                timeout: 25000 // 25 second timeout
            });
            
            console.log('Generation result:', {
                success: result.success,
                promptLength: result.prompt?.length || 0,
                fallbackUsed: result.fallbackUsed || false,
                model: result.model,
                provider: result.provider
            });
            
            if (result.success && result.prompt) {
                // SAFE: Check if prompt is valid and not too short
                if (result.prompt.length < 50) {
                    console.warn('⚠️ Generated prompt is too short:', result.prompt.length);
                    console.warn('Prompt content:', result.prompt);
                    this.showNotification('Generated prompt seems incomplete. Trying fallback...', 'warning');
                    throw new Error('Prompt too short');
                }
                
                // ✅ Use SUPER SAFE text insertion
                const success = this.setOutputText(result.prompt);
                
                if (!success) {
                    throw new Error('Failed to safely display prompt');
                }
                
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
                if (result.suggestions && result.suggestions.length > 0) {
                    this.showSuggestions(result.suggestions);
                }
                
                // Save to history with model info
                this.saveToHistory(inputText, result.prompt, result.model);
                
                // Show success message with model info
                const modelDisplayName = this.getModelDisplayName(result.model);
                const fallbackNote = result.fallbackUsed ? ' (using fallback)' : '';
                this.showNotification(`Prompt generated successfully with ${modelDisplayName}${fallbackNote}!`, 'success');
                
                console.log(`=== GENERATION SUCCESSFUL ===`);
                console.log(`Final prompt length: ${result.prompt.length} chars`);
                console.log(`Prompt preview: ${result.prompt.substring(0, 200)}...`);
                
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

    // ✅ NEW: SUPER SAFE text insertion
    setOutputText(text) {
        try {
            console.log('Setting output text, length:', text.length);
            
            // First, completely clean the text
            const cleanText = this.cleanTextForDOM(text);
            console.log('Cleaned text length:', cleanText.length);
            
            // Clear output area first
            this.elements.outputArea.innerHTML = '';
            
            // Use document.createTextNode for maximum safety
            const textNode = document.createTextNode(cleanText);
            this.elements.outputArea.appendChild(textNode);
            
            // Verify it was set correctly
            const verifyText = this.elements.outputArea.textContent;
            if (verifyText !== cleanText) {
                console.error('Text was not set correctly!');
                console.error('Expected length:', cleanText.length);
                console.error('Got length:', verifyText.length);
                console.error('Expected (first 100):', cleanText.substring(0, 100));
                console.error('Got (first 100):', verifyText.substring(0, 100));
                
                // Emergency fallback - use textContent directly
                this.elements.outputArea.textContent = 'Generated prompt: ' + cleanText.substring(0, 500);
                return true;
            }
            
            console.log('Successfully set output text:', cleanText.length, 'chars');
            return true;
            
        } catch (error) {
            console.error('Failed to set output text:', error);
            
            // Last resort
            try {
                this.elements.outputArea.textContent = 'Generated prompt (display error): ' + text.substring(0, 300);
            } catch (e) {
                this.elements.outputArea.textContent = 'Error displaying generated content.';
            }
            
            return false;
        }
    }

    // ✅ NEW: Ultra-safe text cleaning
    cleanTextForDOM(text) {
        if (!text || typeof text !== 'string') return '';
        
        console.log('Original text length:', text.length);
        
        // Remove ALL control characters and problematic Unicode
        let clean = text
            .replace(/[\x00-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202F\uFEFF]/g, '')
            .replace(/\u0000/g, '')
            .replace(/\uFFFD/g, '')
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
            .trim();
        
        // Ensure it ends with proper punctuation
        const lastChar = clean.slice(-1);
        if (!['.', '!', '?', ')', ']', '}'].includes(lastChar)) {
            clean = clean + '.';
        }
        
        console.log('Cleaned text length:', clean.length);
        console.log('Cleaned preview (first 200):', clean.substring(0, 200));
        
        return clean;
    }

    // ✅ UPDATED: Try fallback models
    async tryFallbackModels(inputText) {
        const fallbackModels = ['gpt-4o-mini', 'llama-3.1-8b-instant'];
        let fallbackSuccess = false;
        
        for (const fallbackModel of fallbackModels) {
            try {
                console.log(`Trying fallback model: ${fallbackModel}`);
                this.showNotification(`Trying ${fallbackModel}...`, 'info');
                
                const fallbackResult = await this.promptGenerator.generatePrompt(inputText, {
                    model: fallbackModel,
                    style: 'detailed',
                    temperature: 0.4,
                    timeout: 20000
                });
                
                if (fallbackResult.success && fallbackResult.prompt && fallbackResult.prompt.length > 50) {
                    // Use safe insertion
                    const success = this.setOutputText(fallbackResult.prompt);
                    
                    if (!success) {
                        console.warn(`Failed to display prompt from ${fallbackModel}`);
                        continue;
                    }
                    
                    this.state.originalPrompt = fallbackResult.prompt;
                    this.state.hasGeneratedPrompt = true;
                    this.elements.outputSection.classList.add('visible');
                    this.platformIntegrations.renderPlatforms(this.elements.platformsGrid);
                    this.updateProgress();
                    this.updateButtonStates();
                    
                    if (fallbackResult.suggestions) {
                        this.showSuggestions(fallbackResult.suggestions);
                    }
                    
                    this.saveToHistory(inputText, fallbackResult.prompt, fallbackModel);
                    this.state.currentModel = fallbackModel;
                    this.updateModelDisplay();
                    
                    this.showNotification(`Generated with ${fallbackModel}`, 'success');
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
            console.log('All AI models failed, using local generation');
            this.useLocalGeneration(inputText);
        }
    }

    // ✅ NEW: Local generation fallback
    useLocalGeneration(inputText) {
        try {
            this.showNotification('Using local generation...', 'info');
            
            // Create a simple but complete prompt locally
            const localPrompt = `Based on your request: "${inputText.substring(0, 100)}..."

I'll help you create a comprehensive prompt. Here's a structured approach:

1. **Define the role**: Expert assistant specialized in the relevant domain
2. **Set clear objectives**: Address the specific requirements mentioned
3. **Provide context**: Consider relevant background information
4. **Give step-by-step instructions**: Break down complex tasks
5. **Include examples**: Show expected output format
6. **Specify constraints**: Mention any limitations or requirements
7. **Define success criteria**: How to know when the task is complete

This structured approach ensures you get detailed, actionable responses tailored to your needs.`;
            
            // Use safe insertion
            const success = this.setOutputText(localPrompt);
            
            if (!success) {
                throw new Error('Failed to display local prompt');
            }
            
            this.state.originalPrompt = localPrompt;
            this.state.hasGeneratedPrompt = true;
            this.elements.outputSection.classList.add('visible');
            this.platformIntegrations.renderPlatforms(this.elements.platformsGrid);
            this.updateProgress();
            this.updateButtonStates();
            this.saveToHistory(inputText, localPrompt, 'local');
            
            this.showNotification('Generated locally', 'warning');
            console.log('Local generation successful');
            
        } catch (error) {
            console.error('Local generation failed:', error);
            this.showNotification('Could not generate prompt. Please try again.', 'error');
        }
    }

    // Get model display name
    getModelDisplayName(modelId) {
        const modelNames = {
            'gemini-3-flash-preview': 'Gemini 3 Flash',
            'gpt-4o-mini': 'GPT-4o Mini',
            'llama-3.1-8b-instant': 'Llama 3.1 8B',
            'local': 'Local Generation',
            'local-fallback': 'Local Fallback'
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
        
        // Enable save button initially
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            saveBtn.disabled = false;
        }
    }

    // Save settings from modal
    saveSettingsModal() {
        console.log('Saving settings...');
        
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
        
        // Debug: Check if elements exist
        console.log('Form elements found:', {
            themeSelect: !!themeSelect,
            uiDensity: !!uiDensity,
            defaultModel: !!defaultModel,
            promptStyle: !!promptStyle
        });
        
        // Update settings
        if (themeSelect) {
            this.state.settings.theme = themeSelect.value;
            console.log('Theme set to:', themeSelect.value);
            this.applyTheme();
        }
        
        if (uiDensity) {
            this.state.settings.uiDensity = uiDensity.value;
            console.log('UI Density set to:', uiDensity.value);
            this.applyUIDensity();
        }
        
        if (defaultModel) {
            this.state.settings.defaultModel = defaultModel.value;
            this.state.currentModel = defaultModel.value;
            console.log('Default model set to:', defaultModel.value);
            this.updateModelDisplay();
        }
        
        if (promptStyle) {
            this.state.settings.promptStyle = promptStyle.value;
            console.log('Prompt style set to:', promptStyle.value);
        }
        
        if (autoConvertDelay) {
            this.state.settings.autoConvertDelay = parseInt(autoConvertDelay.value);
            console.log('Auto-convert delay set to:', autoConvertDelay.value);
        }
        
        if (notificationDuration) {
            this.state.settings.notificationDuration = parseInt(notificationDuration.value);
            console.log('Notification duration set to:', notificationDuration.value);
        }
        
        if (maxHistoryItems) {
            this.state.settings.maxHistoryItems = parseInt(maxHistoryItems.value);
            console.log('Max history items set to:', maxHistoryItems.value);
        }
        
        if (interfaceLanguage) {
            this.state.settings.interfaceLanguage = interfaceLanguage.value;
            console.log('Interface language set to:', interfaceLanguage.value);
        }
        
        if (voiceInputLanguage) {
            this.state.settings.voiceInputLanguage = voiceInputLanguage.value;
            console.log('Voice input language set to:', voiceInputLanguage.value);
        }
        
        if (voiceOutputLanguage) {
            this.state.settings.voiceOutputLanguage = voiceOutputLanguage.value;
            console.log('Voice output language set to:', voiceOutputLanguage.value);
        }
        
        // Debug: Check settings before saving
        console.log('Settings to save:', this.state.settings);
        
        // Save to storage
        const saveResult = this.saveSettings();
        console.log('Save result:', saveResult);
        
        // Close modal
        this.closeSettings();
        
        // Show success message
        if (saveResult) {
            this.showNotification('Settings saved successfully!', 'success');
        } else {
            this.showNotification('Failed to save settings. Please try again.', 'error');
        }
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
- Returns a dictionary with the minimum, maximum, average, and median values
- Handles empty lists gracefully
- Has clear docstring documentation
- Includes type hints for better code readability`,
            
            creative: `Write a short story (500-750 words) about a time traveler who accidentally brings a smartphone to medieval times. The story should:
- Explore the cultural clash between technology and medieval society
- Include humor but also moments of genuine connection
- Feature at least one character who sees the potential in this "magic"
- End with an open-ended but satisfying conclusion
- Use vivid sensory details to bring both eras to life`,
            
            social: `Create a LinkedIn post announcing our company's new sustainability initiative. The post should:
- Be professional yet approachable
- Highlight the environmental impact
- Include relevant hashtags
- Encourage engagement from followers
- Be under 250 words
- Include a call-to-action for comments and shares`
        };
        
        const example = examples[type] || '';
        this.elements.userInput.value = example;
        this.handleInputChange();
        
        this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} example inserted!`, 'success');
    }

    // Toggle history
    toggleHistory() {
        if (this.elements.historySection.classList.contains('active')) {
            this.closeHistory();
        } else {
            this.openHistory();
        }
    }

    openHistory() {
        this.elements.historySection.classList.add('active');
        this.elements.historyBtn.innerHTML = '<i class="fas fa-history"></i> ';
        this.loadHistory();
    }

    closeHistory() {
        this.elements.historySection.classList.remove('active');
        this.elements.historyBtn.innerHTML = '<i class="fas fa-history"></i>';
    }

    // ======================
    // UI UPDATES & UTILITIES
    // ======================

    // Show loading state
    showLoading(isLoading) {
        const btn = this.elements.stickyPrepareBtn;
        if (isLoading) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
            btn.disabled = true;
        } else {
            btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Prepare Prompt';
            btn.disabled = !this.elements.userInput.value.trim();
        }
    }

    // Update button states
    updateButtonStates() {
        const hasInput = this.elements.userInput.value.trim().length > 0;
        const hasPrompt = this.elements.outputArea.textContent.trim().length > 0;
        const isModified = this.state.promptModified;
        
        // Prepare button
        this.elements.stickyPrepareBtn.disabled = !hasInput;
        
        // Save prompt button
        this.elements.savePromptBtn.disabled = !hasPrompt || !isModified;
        
        // Action buttons
        const canUsePrompt = hasPrompt && this.state.hasGeneratedPrompt;
        this.elements.copyBtn.disabled = !canUsePrompt;
        this.elements.speakBtn.disabled = !canUsePrompt;
        this.elements.exportBtn.disabled = !canUsePrompt;
        
        // Update platforms visibility
        if (canUsePrompt) {
            this.elements.platformsGrid.style.display = 'grid';
            this.elements.platformsEmptyState.style.display = 'none';
        } else {
            this.elements.platformsGrid.style.display = 'none';
            this.elements.platformsEmptyState.style.display = 'flex';
        }
        
        // Update undo button
        this.elements.undoBtn.disabled = this.state.undoStack.length === 0;
    }

    // Update progress bar
    updateProgress() {
        let progress = 0;
        
        if (this.elements.userInput.value.trim().length > 0) {
            progress += 25;
        }
        
        if (this.state.hasGeneratedPrompt) {
            progress += 50;
        }
        
        if (this.state.selectedPlatform) {
            progress += 25;
        }
        
        this.elements.progressFill.style.width = `${progress}%`;
    }

    // Update model display
    updateModelDisplay() {
        if (this.elements.currentModel) {
            const modelName = this.getModelDisplayName(this.state.currentModel);
            this.elements.currentModel.textContent = modelName;
        }
    }

    // ======================
    // HISTORY MANAGEMENT
    // ======================

    // Load history
    loadHistory() {
        const history = this.storageManager.load('promptHistory') || [];
        this.state.promptHistory = history;
        this.renderHistory();
    }

    // Save to history
    saveToHistory(inputText, promptText, model) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            input: inputText.substring(0, 100) + (inputText.length > 100 ? '...' : ''),
            prompt: promptText.substring(0, 150) + (promptText.length > 150 ? '...' : ''),
            model: model,
            fullInput: inputText,
            fullPrompt: promptText
        };
        
        this.state.promptHistory.unshift(historyItem);
        
        // Limit history size
        const maxItems = this.state.settings.maxHistoryItems || 25;
        if (this.state.promptHistory.length > maxItems) {
            this.state.promptHistory = this.state.promptHistory.slice(0, maxItems);
        }
        
        this.storageManager.save('promptHistory', this.state.promptHistory);
        this.renderHistory();
    }

    // Render history
    renderHistory() {
        const historyList = this.elements.historyList;
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        if (this.state.promptHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-history"></i>
                    <p>No history yet</p>
                </div>
            `;
            return;
        }
        
        this.state.promptHistory.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <div class="history-item-content">
                    <div class="history-item-header">
                        <span class="history-item-time">${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span class="history-item-model">${this.getModelDisplayName(item.model)}</span>
                    </div>
                    <div class="history-item-input">${this.escapeHTML(item.input)}</div>
                    <div class="history-item-prompt">${this.escapeHTML(item.prompt)}</div>
                </div>
                <button class="history-item-restore" data-id="${item.id}">
                    <i class="fas fa-redo"></i>
                </button>
            `;
            
            li.querySelector('.history-item-restore').addEventListener('click', (e) => {
                e.stopPropagation();
                this.restoreHistoryItem(item.id);
            });
            
            li.addEventListener('click', () => {
                this.viewHistoryItem(item.id);
            });
            
            historyList.appendChild(li);
        });
    }

    // Restore history item
    restoreHistoryItem(id) {
        const item = this.state.promptHistory.find(h => h.id === id);
        if (item) {
            this.elements.userInput.value = item.fullInput;
            this.handleInputChange();
            this.showNotification('Input restored from history', 'success');
            this.closeHistory();
        }
    }

    // View history item
    viewHistoryItem(id) {
        const item = this.state.promptHistory.find(h => h.id === id);
        if (item) {
            // Open in full screen editor for viewing
            this.elements.userInput.value = item.fullInput;
            this.handleInputChange();
            this.openFullScreenEditor('input');
            
            // Set the output if available
            const editorTextarea = document.getElementById('editorTextarea');
            if (editorTextarea && item.fullPrompt) {
                setTimeout(() => {
                    editorTextarea.value = `Input: ${item.fullInput}\n\nGenerated Prompt:\n${item.fullPrompt}`;
                }, 100);
            }
        }
    }

    // ======================
    // SETTINGS MANAGEMENT
    // ======================

    // Load settings
    loadSettings() {
        const saved = this.storageManager.load('appSettings');
        if (saved) {
            this.state.settings = { ...this.loadDefaultSettings(), ...saved };
        }
        
        this.applyTheme();
        this.applyUIDensity();
    }

    // Save settings
    saveSettings() {
        try {
            this.storageManager.save('appSettings', this.state.settings);
            this.state.settingsModified = false;
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    // Apply theme
    applyTheme() {
        const theme = this.state.settings.theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        
        if (this.elements.currentTheme) {
            this.elements.currentTheme.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
        }
    }

    // Apply UI density
    applyUIDensity() {
        const density = this.state.settings.uiDensity || 'comfortable';
        document.documentElement.setAttribute('data-density', density);
    }

    // ======================
    // NOTIFICATIONS
    // ======================

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${this.escapeHTML(message)}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.elements.notificationContainer.appendChild(notification);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-remove
        const duration = this.state.settings.notificationDuration || 3000;
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    // Get notification icon
    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // ======================
    // SUGGESTIONS
    // ======================

    // Show suggestions
    showSuggestions(suggestions) {
        const suggestionsList = this.elements.suggestionsList;
        if (!suggestionsList) return;
        
        suggestionsList.innerHTML = '';
        
        if (!suggestions || suggestions.length === 0) {
            this.elements.suggestionsPanel.style.display = 'none';
            return;
        }
        
        suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            li.textContent = suggestion;
            li.addEventListener('click', () => {
                this.applySuggestion(suggestion);
            });
            suggestionsList.appendChild(li);
        });
        
        this.elements.suggestionsPanel.style.display = 'block';
    }

    // Apply suggestion
    applySuggestion(suggestion) {
        // Add suggestion to input
        const currentInput = this.elements.userInput.value;
        this.elements.userInput.value = currentInput + ' ' + suggestion;
        this.handleInputChange();
        
        this.showNotification('Suggestion applied to input', 'info');
    }

    // ======================
    // UTILITY METHODS
    // ======================

    // Escape HTML
    escapeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Test worker connection
    async testWorkerConnection() {
        try {
            console.log('Testing worker connection...');
            const testResult = await this.promptGenerator.testConnection();
            console.log('Worker test result:', testResult);
            
            if (testResult.success) {
                this.showNotification('Connected to AI services', 'success');
            } else {
                console.warn('Worker test failed:', testResult.error);
            }
        } catch (error) {
            console.warn('Worker test failed:', error);
        }
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter to prepare prompt
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (!this.elements.stickyPrepareBtn.disabled) {
                this.preparePrompt();
            }
        }
        
        // Escape to close panels
        if (e.key === 'Escape') {
            if (this.state.isEditorOpen) {
                this.closeFullScreenEditor();
            }
            
            if (this.state.inspirationPanelOpen) {
                this.closeInspirationPanel();
            }
            
            if (this.elements.historySection.classList.contains('active')) {
                this.closeHistory();
            }
        }
    }

    // Update UI
    updateUI() {
        this.updateButtonStates();
        this.updateProgress();
        this.updateModelDisplay();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.promptCraftApp = new PromptCraftApp();
});
