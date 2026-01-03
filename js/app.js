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
            promptHistory: []
        };

        // Initialize managers
        this.storageManager = new StorageManager();
        this.voiceHandler = new VoiceHandler();
        this.platformIntegrations = new PlatformIntegrations();
        this.promptGenerator = new PromptGenerator({
            workerUrl: 'https://your-worker.workers.dev/generate',
            fallbackToLocal: true
        });

        // Bind elements
        this.elements = {};
        this.bindElements();
        
        // Initialize
        this.init();
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
            currentLanguage: document.getElementById('currentLanguage')
        };
    }

    // Initialize application
    async init() {
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
    }

    // Set up voice handler callbacks
    setupVoiceCallbacks() {
        this.voiceHandler.setCallbacks({
            onListeningStart: () => {
                this.showNotification('Listening... Start speaking', 'info');
            },
            onTranscript: (text) => {
                this.elements.userInput.value += text;
                this.handleInputChange();
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

    // Handle input changes
    handleInputChange() {
        const text = this.elements.userInput.value;
        const charCount = text.length;
        
        // Update character counter
        this.elements.charCounter.textContent = `${charCount}/5000`;
        this.elements.charCounter.style.color = charCount > 4500 ? 'var(--danger)' : 'var(--text-tertiary)';
        
        // Update button states
        this.updateButtonStates();
    }

    // Handle prompt editing
    handlePromptEdit() {
        const currentContent = this.elements.outputArea.textContent.trim();
        this.state.promptModified = currentContent !== this.state.originalPrompt;
        this.updateButtonStates();
    }

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
        
        // Show loading state
        this.showLoading(true);
        
        try {
            // Generate prompt using Cloudflare Worker
            const result = await this.promptGenerator.generatePrompt(inputText, {
                style: 'detailed', // Get from settings
                model: 'gemini' // Get from settings
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
                
                // Save to history
                this.saveToHistory(inputText, result.prompt);
                
                this.showNotification('Prompt successfully generated! Click any AI tool to copy and launch.', 'success');
                
            } else {
                throw new Error('Failed to generate prompt');
            }
            
        } catch (error) {
            console.error('Prompt generation error:', error);
            this.showNotification('Failed to generate prompt. Using local generation...', 'warning');
            
            // Fallback to local generation
            const localResult = this.promptGenerator.generatePromptLocally(inputText);
            this.elements.outputArea.textContent = localResult.prompt;
            this.state.originalPrompt = localResult.prompt;
            this.state.hasGeneratedPrompt = true;
            this.elements.outputSection.classList.add('visible');
            this.platformIntegrations.renderPlatforms(this.elements.platformsGrid);
            this.updateProgress();
            this.updateButtonStates();
            this.showSuggestions(localResult.suggestions);
            this.saveToHistory(inputText, localResult.prompt);
            
        } finally {
            this.showLoading(false);
        }
    }

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

    // Copy prompt to clipboard
    async copyPrompt() {
        const text = this.elements.outputArea.textContent.trim();
        
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Prompt copied to clipboard!', 'success');
            
            // Visual feedback
            this.elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                this.elements.copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
            
        } catch (err) {
            this.showNotification('Failed to copy. Please try again.', 'error');
        }
    }

    // Toggle speech
    toggleSpeech() {
        const text = this.elements.outputArea.textContent.trim();
        this.voiceHandler.toggleSpeaking(text, {
            lang: 'en-US' // Get from settings
        });
    }

    // Toggle voice input
    toggleVoiceInput() {
        this.voiceHandler.toggleListening('en-US'); // Get from settings
    }

    // Export prompt
    exportPrompt() {
        const prompt = this.elements.outputArea.textContent.trim();
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
        this.elements.outputSection.classList.remove('visible');
        this.state.selectedPlatform = null;
        this.updateProgress();
        this.updateButtonStates();
    }

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
    }

    closeInspirationPanel() {
        this.state.inspirationPanelOpen = false;
        this.elements.inspirationPanel.classList.remove('expanded');
    }

    // Insert example
    insertExample(type) {
        const examples = {
            email: `Compose a professional follow-up email...`,
            code: `Write a Python function that...`,
            analysis: `Analyze the following sales data...`,
            creative: `Write a short story...`,
            strategy: `Develop a go-to-market strategy...`,
            research: `Summarize the current state of quantum computing...`
        };
        
        const example = examples[type];
        if (example) {
            this.elements.userInput.value = example;
            this.handleInputChange();
            this.showNotification(`${type} example loaded`, 'success');
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

    // Save to history
    saveToHistory(input, output) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
            output: output.substring(0, 200) + (output.length > 200 ? '...' : ''),
            fullInput: input,
            fullOutput: output
        };
        
        this.state.promptHistory.unshift(historyItem);
        
        // Limit history size
        if (this.state.promptHistory.length > 25) {
            this.state.promptHistory = this.state.promptHistory.slice(0, 25);
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
                    </div>
                </div>
                <div class="history-actions">
                    <button class="action-btn load-history-btn" title="Load Prompt">
                        <i class="fas fa-arrow-up"></i>
                        <span class="action-btn-tooltip">Load</span>
                    </button>
                </div>
            `;
            
            const loadBtn = historyItem.querySelector('.load-history-btn');
            loadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
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
        
        this.handleInputChange();
        this.elements.outputSection.classList.add('visible');
        this.platformIntegrations.renderPlatforms(this.elements.platformsGrid);
        this.updateProgress();
        this.updateButtonStates();
        this.closeHistory();
        
        this.showNotification('Prompt loaded from history', 'success');
    }

    // Show suggestions
    showSuggestions(suggestions) {
        if (suggestions.length === 0) {
            this.elements.suggestionsPanel.classList.remove('visible');
            return;
        }
        
        this.elements.suggestionsList.innerHTML = suggestions.map(s => `
            <div class="suggestion-item" onclick="window.app.applySuggestion('${s.text.replace(/'/g, "\\'")}')">
                <i class="${s.icon}" style="color: var(--primary);"></i>
                <span>${s.text}</span>
            </div>
        `).join('');
        
        this.elements.suggestionsPanel.classList.add('visible');
    }

    // Apply suggestion
    applySuggestion(text) {
        const currentPrompt = this.elements.outputArea.textContent.trim();
        this.elements.outputArea.textContent = currentPrompt + '\n\n' + text;
        this.handlePromptEdit();
        this.showNotification('Suggestion applied', 'success');
    }

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
    }

    // Update UI
    updateUI() {
        this.updateProgress();
        this.updateButtonStates();
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="notification-icon ${icons[type]}"></i>
            <div class="notification-message">${message}</div>
        `;
        
        // Create container if it doesn't exist
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.2s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 200);
        }, 3000);
    }

    // Show loading state
    showLoading(show) {
        const buttons = [this.elements.stickyPrepareBtn];
        
        buttons.forEach(btn => {
            if (btn) {
                if (show) {
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                    btn.disabled = true;
                } else {
                    btn.innerHTML = '<i class="fas fa-magic"></i> Prepare Prompt';
                    btn.disabled = false;
                }
            }
        });
    }

    // Load settings
    loadSettings() {
        const settings = this.storageManager.load('promptCraftSettings');
        if (settings) {
            // Apply settings
            // This would include theme, language, etc.
        }
    }

    // Save history
    saveHistory() {
        this.storageManager.save('promptCraftHistory', this.state.promptHistory);
    }

    // Load history
    loadHistory() {
        const history = this.storageManager.load('promptCraftHistory', []);
        this.state.promptHistory = history;
    }

    // Test worker connection
    async testWorkerConnection() {
        try {
            const result = await this.promptGenerator.testConnection();
            if (result.connected) {
                console.log('Worker connection test successful');
            } else {
                console.warn('Worker connection test failed:', result.error);
            }
        } catch (error) {
            console.error('Worker connection test error:', error);
        }
    }

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
    }

    // Undo
    undo() {
        // Implement undo logic
    }

    // Open full screen editor
    openFullScreenEditor(type) {
        // Implement full screen editor
    }

    // Cleanup
    destroy() {
        this.voiceHandler.destroy();
        this.promptGenerator.clearSensitiveData();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PromptCraftApp();
});
