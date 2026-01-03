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
                    <p>No prompt history yet</p>
                </div>
            `;
            return;
        }
        
        this.state.promptHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(item.timestamp);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString();
            
            historyItem.innerHTML = `
                <div class="history-content">
                    <div class="history-text" title="${item.input}">${item.input}</div>
                    <div class="history-time">
                        <i class="fas fa-clock"></i>
                        ${dateString} at ${timeString}
                        <span class="history-model">${item.model}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="action-btn load-history-btn" title="Load Prompt">
                        <i class="fas fa-arrow-up"></i>
                        <span class="action-btn-tooltip">Load</span>
                    </button>
                </div>
            `;
            
            // Add load button functionality
            const loadBtn = historyItem.querySelector('.load-history-btn');
            loadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadHistoryItem(item);
            });
            
            historyItem.addEventListener('click', () => {
                this.loadHistoryItem(item);
            });
            
            historyList.appendChild(historyItem);
        });
    }

    // Load history item
    loadHistoryItem(item) {
        this.elements.userInput.value = item.fullInput;
        this.elements.outputArea.textContent = item.fullOutput;
        this.state.originalPrompt = item.fullOutput;
        this.state.hasGeneratedPrompt = true;
        this.state.currentModel = item.model || 'gemini-3-flash-preview';
        
        this.handleInputChange();
        this.elements.outputSection.classList.add('visible');
        this.platformIntegrations.renderPlatforms(this.elements.platformsGrid);
        this.updateProgress();
        this.updateButtonStates();
        this.updateModelDisplay();
        this.closeHistory();
        
        this.showNotification('Prompt loaded from history', 'success');
    }

    // ======================
    // SETTINGS & STORAGE
    // ======================

    // Load settings
    loadSettings() {
        const saved = this.storageManager.load('promptCraftSettings');
        if (saved) {
            this.state.settings = { ...this.state.settings, ...saved };
            // Apply theme
            this.applyTheme();
            // Apply UI density
            this.applyUIDensity();
        }
    }

    // Save settings
    saveSettings() {
        this.storageManager.save('promptCraftSettings', this.state.settings);
    }

    // Load history
    loadHistory() {
        const history = this.storageManager.load('promptCraftHistory', []);
        this.state.promptHistory = history;
    }

    // Save history
    saveHistory() {
        this.storageManager.save('promptCraftHistory', this.state.promptHistory);
    }

    // Apply theme
    applyTheme() {
        const theme = this.state.settings.theme;
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.toggle('dark-theme', prefersDark);
            this.elements.currentTheme.textContent = prefersDark ? 'Dark' : 'Light';
        } else {
            document.body.classList.toggle('dark-theme', theme === 'dark');
            this.elements.currentTheme.textContent = theme === 'dark' ? 'Dark' : 'Light';
        }
    }

    // Apply UI density
    applyUIDensity() {
        const density = this.state.settings.uiDensity;
        const root = document.documentElement;
        
        const densities = {
            comfortable: {
                '--spacing-xs': '0.25rem',
                '--spacing-sm': '0.5rem',
                '--spacing-md': '0.75rem',
                '--spacing-lg': '1rem',
                '--spacing-xl': '1.5rem',
                '--spacing-2xl': '2rem',
                '--font-size-base': '1rem'
            },
            compact: {
                '--spacing-xs': '0.125rem',
                '--spacing-sm': '0.25rem',
                '--spacing-md': '0.5rem',
                '--spacing-lg': '0.75rem',
                '--spacing-xl': '1rem',
                '--spacing-2xl': '1.5rem',
                '--font-size-base': '0.875rem'
            },
            spacious: {
                '--spacing-xs': '0.5rem',
                '--spacing-sm': '1rem',
                '--spacing-md': '1.5rem',
                '--spacing-lg': '2rem',
                '--spacing-xl': '3rem',
                '--spacing-2xl': '4rem',
                '--font-size-base': '1.125rem'
            }
        };
        
        const vars = densities[density] || densities.comfortable;
        Object.entries(vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }

    // ======================
    // UI UPDATES
    // ======================

    // Update progress
    updateProgress() {
        let progress = 33;
        
        if (this.state.hasGeneratedPrompt) {
            progress = 66;
        }
        
        if (this.state.selectedPlatform) {
            progress = 100;
        }
        
        this.elements.progressFill.style.width = `${progress}%`;
    }

    // Update button states
    updateButtonStates() {
        const hasInput = this.elements.userInput.value.trim().length > 0;
        const hasOutput = this.state.hasGeneratedPrompt;
        
        // Prepare prompt button
        if (hasOutput) {
            this.elements.stickyPrepareBtn.classList.add('removed');
            this.elements.stickyResetBtn.classList.remove('hidden');
            this.elements.stickyResetBtn.classList.add('visible');
        } else {
            this.elements.stickyPrepareBtn.classList.remove('removed');
            this.elements.stickyResetBtn.classList.add('hidden');
            this.elements.stickyResetBtn.classList.remove('visible');
        }
        
        // Enable/disable buttons
        this.elements.stickyPrepareBtn.disabled = !hasInput;
        this.elements.copyBtn.disabled = !hasOutput;
        this.elements.speakBtn.disabled = !hasOutput;
        this.elements.exportBtn.disabled = !hasOutput;
        this.elements.savePromptBtn.classList.toggle('visible', this.state.promptModified);
        
        // Enable/disable undo button
        const canUndo = this.state.undoStack.length > 0;
        this.elements.undoBtn.disabled = !canUndo;
        this.elements.undoBtn.classList.toggle('disabled', !canUndo);
    }

    // Update model display
    updateModelDisplay() {
        const modelName = this.getModelDisplayName(this.state.currentModel);
        this.elements.currentModel.textContent = modelName;
    }

    // Update UI
    updateUI() {
        this.updateProgress();
        this.updateButtonStates();
        this.updateModelDisplay();
    }

    // ======================
    // NOTIFICATIONS
    // ======================

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="notification-icon ${icons[type]}"></i>
            <div class="notification-message">${message}</div>
        `;
        
        this.elements.notificationContainer.appendChild(notification);
        
        // Auto-remove after duration
        const duration = this.state.settings.notificationDuration || 3000;
        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.2s ease forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 200);
            }, duration);
        }
    }

    // Show loading state
    showLoading(show) {
        if (show) {
            this.elements.stickyPrepareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            this.elements.stickyPrepareBtn.disabled = true;
        } else {
            this.elements.stickyPrepareBtn.innerHTML = '<i class="fas fa-magic"></i> Prepare Prompt';
            this.elements.stickyPrepareBtn.disabled = false;
        }
    }

    // ======================
    // WORKER CONNECTION
    // ======================

    // Test worker connection
    async testWorkerConnection() {
        try {
            const result = await this.promptGenerator.testConnection();
            if (result.connected) {
                console.log('Worker connection successful:', result.health);
                // Update available models if needed
                if (result.models && result.models.length > 0) {
                    console.log('Available models:', result.models);
                }
            } else {
                console.warn('Worker connection failed:', result.error);
                this.showNotification('AI service connection failed. Local mode only.', 'warning');
            }
        } catch (error) {
            console.error('Worker connection test error:', error);
        }
    }

    // ======================
    // KEYBOARD SHORTCUTS
    // ======================

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Close modals with Escape
        if (e.key === 'Escape') {
            if (this.state.inspirationPanelOpen) {
                this.closeInspirationPanel();
            }
            if (this.elements.historySection.classList.contains('visible')) {
                this.closeHistory();
            }
        }
        
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
        
        // Ctrl/Cmd + H for history
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            this.toggleHistory();
        }
    }

    // ======================
    // EDITOR FUNCTIONS
    // ======================

    // Open full screen editor
    openFullScreenEditor(type) {
        // This is a simplified version. You can expand this as needed.
        alert('Full screen editor coming soon! For now, use the main text area.');
    }

    // ======================
    // CLEANUP
    // ======================

    // Cleanup
    destroy() {
        this.voiceHandler.destroy();
        this.promptGenerator.clearSensitiveData();
        // Save before closing
        this.saveSettings();
        this.saveHistory();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PromptCraftApp();
});
