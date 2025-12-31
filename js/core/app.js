// Complete Fixed App.js
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
            this.initializeServices();
            this.initializeModules();
            this.setupDOM();
            this.bindEvents();
            this.loadInitialState();
            this.setupTheme();
            this.setupVoice();
            this.setupAutoGeneration();
            this.updateUI();
            
            console.log('PromptCraft Pro initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showNotification('Failed to initialize application', 'error');
        }
    }

    initializeServices() {
        this.services.storage = new StorageService();
        this.services.api = new APIService();
        this.services.notification = new NotificationService();
        
        this.services.settings = {
            load: () => this.services.storage.loadSettings({}),
            save: (settings) => this.services.storage.saveSettings(settings)
        };
    }

    initializeModules() {
        this.modules.intent = new IntentDetector();
        this.modules.prompt = new PromptGenerator();
        this.modules.ranker = new AIRanker();
        this.modules.voice = new VoiceManager();
        
        this.modules.templates = new TemplateManager();
        this.modules.history = new HistoryManager();
        this.modules.theme = new ThemeManager();
    }

    setupDOM() {
        this.elements = {
            userInput: document.getElementById('userInput'),
            charCounter: document.getElementById('charCounter'),
            undoBtn: document.getElementById('undoBtn'),
            micBtn: document.getElementById('micBtn'),
            maximizeInputBtn: document.getElementById('maximizeInputBtn'),
            intentChips: document.getElementById('intentChips'),
            intentChipsScroll: document.getElementById('intentChipsScroll'),
            intentProgress: document.getElementById('intentProgress'),
            presetSelector: document.getElementById('presetSelector'),
            needInspirationBtn: document.getElementById('needInspirationBtn'),
            inspirationPanel: document.getElementById('inspirationPanel'),
            closeInspirationBtn: document.getElementById('closeInspirationBtn'),
            outputSection: document.getElementById('outputSection'),
            outputArea: document.getElementById('outputArea'),
            copyBtn: document.getElementById('copyBtn'),
            speakBtn: document.getElementById('speakBtn'),
            exportBtn: document.getElementById('exportBtn'),
            maximizeOutputBtn: document.getElementById('maximizeOutputBtn'),
            savePromptBtn: document.getElementById('savePromptBtn'),
            platformsGrid: document.getElementById('platformsGrid'),
            platformsEmptyState: document.getElementById('platformsEmptyState'),
            stickyPrepareBtn: document.getElementById('stickyPrepareBtn'),
            stickyResetBtn: document.getElementById('stickyResetBtn'),
            historyBtn: document.getElementById('historyBtn'),
            historySection: document.getElementById('historySection'),
            historyList: document.getElementById('historyList'),
            closeHistoryBtn: document.getElementById('closeHistoryBtn'),
            suggestionsPanel: document.getElementById('suggestionsPanel'),
            suggestionsList: document.getElementById('suggestionsList'),
            progressFill: document.getElementById('progressFill'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn')
        };

        setTimeout(() => {
            this.elements.presetButtons = document.querySelectorAll('.preset-btn');
            this.setupPresetButtons();
        }, 100);
    }

    bindEvents() {
        this.elements.userInput.addEventListener('input', () => this.handleInputChange());
        this.elements.stickyPrepareBtn.addEventListener('click', () => this.preparePrompt());
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        this.elements.copyBtn.addEventListener('click', () => this.copyPrompt());
        this.elements.speakBtn.addEventListener('click', () => this.toggleSpeech());
        this.elements.exportBtn.addEventListener('click', () => this.exportPrompt());
        this.elements.savePromptBtn.addEventListener('click', () => this.savePrompt());
        this.elements.stickyResetBtn.addEventListener('click', () => this.resetApp());
        this.elements.maximizeInputBtn.addEventListener('click', () => this.maximizeInput());
        this.elements.maximizeOutputBtn.addEventListener('click', () => this.maximizeOutput());
        this.elements.micBtn.addEventListener('click', () => this.toggleVoiceInput());
        this.elements.needInspirationBtn.addEventListener('click', () => this.toggleInspirationPanel());
        this.elements.closeInspirationBtn.addEventListener('click', () => this.closeInspirationPanel());
        this.elements.historyBtn.addEventListener('click', () => this.toggleHistory());
        this.elements.closeHistoryBtn.addEventListener('click', () => this.closeHistory());
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.elements.outputArea.addEventListener('input', () => this.handlePromptEdit());
        
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettings();
            }
        });

        const closeEditorBtn = document.getElementById('closeEditorBtn');
        if (closeEditorBtn) {
            closeEditorBtn.addEventListener('click', () => this.closeFullScreenEditor());
        }

        const editorPrepareBtn = document.getElementById('editorPrepareBtn');
        if (editorPrepareBtn) {
            editorPrepareBtn.addEventListener('click', () => this.editorPreparePrompt());
        }
    }

    setupPresetButtons() {
        if (!this.elements.presetButtons) return;
        
        this.elements.presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.setPreset(preset);
                
                this.elements.presetButtons.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    handleInputChange() {
        const text = this.elements.userInput.value;
        const charCount = text.length;
        const maxLength = 5000;
        
        this.elements.charCounter.textContent = `${charCount}/${maxLength}`;
        this.elements.charCounter.style.color = charCount > maxLength * 0.9 ? 'var(--danger)' : 'var(--text-tertiary)';
        
        if (text.trim().length > 10) {
            this.detectIntent(text);
        } else {
            this.hideIntentChips();
        }
        
        this.updateButtonStates();
        
        if (this.elements.userInput.scrollHeight > this.elements.userInput.clientHeight) {
            this.elements.userInput.scrollTop = this.elements.userInput.scrollHeight;
        }
        
        if (text.trim().length === 0 && this.state.hasGeneratedPrompt) {
            this.clearGeneratedPrompt();
        }
        
        this.state.undoStack.push({
            input: text,
            output: this.elements.outputArea.textContent
        });
    }

    detectIntent(text) {
        if (!this.modules.intent) return;
        
        this.elements.intentProgress.style.display = 'flex';
        
        clearTimeout(this.intentDetectionTimeout);
        this.intentDetectionTimeout = setTimeout(() => {
            const intent = this.modules.intent.detect(text);
            const chips = this.modules.intent.intentToChips(intent);
            
            this.renderIntentChips(chips);
            
            const { role, preset } = this.modules.intent.getRoleAndPreset(text);
            this.modules.prompt.lastRole = role;
            
            if (!this.modules.prompt.userPresetLocked && preset) {
                this.setPreset(preset);
            }
            
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
            this.showNotification(`Preset changed to: ${presetId}`, 'info');
        }
    }

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
        
        this.elements.stickyPrepareBtn.disabled = true;
        this.elements.stickyPrepareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
        
        try {
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
                this.elements.outputArea.textContent = result.prompt;
                this.state.originalPrompt = result.prompt;
                this.state.promptModified = false;
                this.state.hasGeneratedPrompt = true;
                
                this.elements.outputSection.classList.add('visible');
                
                if (this.modules.ranker && this.modules.ranker.renderRankedPlatforms) {
                    const intent = this.modules.intent.detect(inputText);
                    this.modules.ranker.renderRankedPlatforms(intent);
                }
                
                this.updateProgress();
                
                this.saveToHistory(inputText, result.prompt);
                
                this.showNotification(`Prompt generated with ${result.modelName}!`, 'success');
                
                setTimeout(() => {
                    this.elements.outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
                
            } else {
                throw new Error(result.error || 'Failed to generate prompt');
            }
            
        } catch (error) {
            console.error('Prompt generation error:', error);
            this.showNotification('Failed to generate prompt. Using fallback...', 'error');
            
            const fallbackPrompt = this.modules.prompt.generate(inputText);
            this.elements.outputArea.textContent = fallbackPrompt;
            this.state.originalPrompt = fallbackPrompt;
            this.state.hasGeneratedPrompt = true;
            this.elements.outputSection.classList.add('visible');
            
        } finally {
            this.elements.stickyPrepareBtn.disabled = false;
            this.elements.stickyPrepareBtn.innerHTML = '<i class="fas fa-magic"></i> Prepare Prompt';
            this.updateButtonStates();
        }
    }

    updateProgress() {
        let progress = 33;
        
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
        
        this.elements.stickyPrepareBtn.disabled = !hasInput;
        
        if (hasOutput) {
            this.elements.stickyPrepareBtn.classList.add('removed');
            this.elements.stickyResetBtn.classList.remove('hidden');
        } else {
            this.elements.stickyPrepareBtn.classList.remove('removed');
            this.elements.stickyResetBtn.classList.add('hidden');
        }
        
        this.elements.copyBtn.disabled = !hasOutput;
        this.elements.speakBtn.disabled = !hasOutput;
        this.elements.exportBtn.disabled = !hasOutput;
        
        this.elements.savePromptBtn.classList.toggle('visible', this.state.promptModified);
        
        const canUndo = this.state.undoStack.length > 0;
        this.elements.undoBtn.disabled = !canUndo;
        this.elements.undoBtn.classList.toggle('disabled', !canUndo);
    }

    copyPrompt() {
        const text = this.elements.outputArea.textContent.trim();
        
        if (!text) {
            this.showNotification('No prompt to copy', 'error');
            return;
        }
        
        navigator.clipboard.writeText(text)
            .then(() => {
                this.showNotification('Prompt copied to clipboard!', 'success');
                
                this.elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    this.elements.copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            })
            .catch(err => {
                this.showNotification('Failed to copy. Please try again.', 'error');
            });
    }

    savePrompt() {
        const promptText = this.elements.outputArea.textContent.trim();
        if (!promptText) {
            this.showNotification('No prompt to save', 'error');
            return;
        }
        
        this.state.originalPrompt = promptText;
        this.state.promptModified = false;
        this.updateButtonStates();
        
        const inputText = this.elements.userInput.value.trim();
        this.saveToHistory(inputText, promptText);
        
        this.showNotification('Prompt saved to history', 'success');
    }

    exportPrompt() {
        const promptText = this.elements.outputArea.textContent.trim();
        if (!promptText) {
            this.showNotification('No prompt to export', 'error');
            return;
        }
        
        const blob = new Blob([promptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prompt-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Prompt exported successfully', 'success');
    }

    toggleSpeech() {
        const promptText = this.elements.outputArea.textContent.trim();
        if (!promptText) {
            this.showNotification('No prompt to read', 'error');
            return;
        }
        
        if (this.modules.voice) {
            this.modules.voice.toggleSpeaking(promptText);
        }
    }

    toggleVoiceInput() {
        if (this.modules.voice) {
            this.modules.voice.toggleListening();
        }
    }

    resetApp() {
        this.elements.userInput.value = '';
        this.elements.outputArea.textContent = '';
        this.state.originalPrompt = null;
        this.state.hasGeneratedPrompt = false;
        this.state.promptModified = false;
        
        this.elements.outputSection.classList.remove('visible');
        
        this.updateProgress();
        this.updateButtonStates();
        this.hideIntentChips();
        
        const platformsGrid = document.getElementById('platformsGrid');
        const emptyState = document.getElementById('platformsEmptyState');
        if (platformsGrid && emptyState) {
            platformsGrid.innerHTML = '';
            platformsGrid.appendChild(emptyState);
        }
        
        this.showNotification('Application reset successfully', 'info');
    }

    maximizeInput() {
        this.state.currentEditor = 'input';
        this.state.isEditorOpen = true;
        
        const editorTextarea = document.getElementById('editorTextarea');
        if (editorTextarea) {
            editorTextarea.value = this.elements.userInput.value;
        }
        
        const fullScreenEditor = document.getElementById('fullScreenEditor');
        if (fullScreenEditor) {
            fullScreenEditor.classList.add('active');
            document.getElementById('editorTitle').textContent = 'Edit Your Task';
        }
    }

    maximizeOutput() {
        this.state.currentEditor = 'output';
        this.state.isEditorOpen = true;
        
        const editorTextarea = document.getElementById('editorTextarea');
        if (editorTextarea) {
            editorTextarea.value = this.elements.outputArea.textContent;
        }
        
        const fullScreenEditor = document.getElementById('fullScreenEditor');
        if (fullScreenEditor) {
            fullScreenEditor.classList.add('active');
            document.getElementById('editorTitle').textContent = 'Edit Generated Prompt';
        }
    }

    closeFullScreenEditor() {
        const fullScreenEditor = document.getElementById('fullScreenEditor');
        if (fullScreenEditor) {
            fullScreenEditor.classList.remove('active');
            this.state.isEditorOpen = false;
            
            const editorTextarea = document.getElementById('editorTextarea');
            if (editorTextarea && this.state.currentEditor) {
                if (this.state.currentEditor === 'input') {
                    this.elements.userInput.value = editorTextarea.value;
                    this.handleInputChange();
                } else if (this.state.currentEditor === 'output') {
                    this.elements.outputArea.textContent = editorTextarea.value;
                    this.state.promptModified = true;
                    this.updateButtonStates();
                }
            }
            
            this.state.currentEditor = null;
        }
    }

    editorPreparePrompt() {
        const editorTextarea = document.getElementById('editorTextarea');
        if (editorTextarea) {
            const inputText = editorTextarea.value.trim();
            if (inputText) {
                this.elements.userInput.value = inputText;
                this.preparePrompt();
                this.closeFullScreenEditor();
            }
        }
    }

    undo() {
        if (this.state.undoStack.length === 0) return;
        
        const state = this.state.undoStack.pop();
        this.state.redoStack.push({
            input: this.elements.userInput.value,
            output: this.elements.outputArea.textContent
        });
        
        this.elements.userInput.value = state.input;
        this.elements.outputArea.textContent = state.output;
        
        this.handleInputChange();
        this.updateButtonStates();
    }

    toggleInspirationPanel() {
        this.state.inspirationPanelOpen = !this.state.inspirationPanelOpen;
        this.elements.inspirationPanel.classList.toggle('expanded', this.state.inspirationPanelOpen);
        
        if (this.state.inspirationPanelOpen && this.modules.templates) {
            this.modules.templates.renderTemplatesGrid(
                document.getElementById('inspirationGrid'),
                (template) => {
                    this.elements.userInput.value = template.example || '';
                    this.handleInputChange();
                    this.closeInspirationPanel();
                }
            );
        }
    }

    closeInspirationPanel() {
        this.state.inspirationPanelOpen = false;
        this.elements.inspirationPanel.classList.remove('expanded');
    }

    toggleHistory() {
        this.state.historyOpen = !this.state.historyOpen;
        this.elements.historySection.classList.toggle('visible', this.state.historyOpen);
        
        if (this.state.historyOpen && this.modules.history) {
            this.modules.history.renderHistoryList(
                this.elements.historyList,
                (item) => {
                    this.elements.userInput.value = item.input;
                    this.elements.outputArea.textContent = item.prompt;
                    this.handleInputChange();
                    this.elements.outputSection.classList.add('visible');
                    this.state.hasGeneratedPrompt = true;
                    this.updateButtonStates();
                    this.closeHistory();
                }
            );
        }
    }

    closeHistory() {
        this.state.historyOpen = false;
        this.elements.historySection.classList.remove('visible');
    }

    loadFromHistory(id) {
        if (this.modules.history) {
            const history = this.modules.history.getAll();
            const item = history.find(h => h.id === id);
            if (item) {
                this.elements.userInput.value = item.input;
                this.elements.outputArea.textContent = item.prompt;
                this.handleInputChange();
                this.elements.outputSection.classList.add('visible');
                this.state.hasGeneratedPrompt = true;
                this.updateButtonStates();
                this.showNotification('Loaded from history', 'success');
            }
        }
    }

    saveToHistory(inputText, generatedPrompt) {
        try {
            if (this.modules.history) {
                this.modules.history.add({
                    input: inputText,
                    prompt: generatedPrompt,
                    model: this.services.storage.loadModel(),
                    timestamp: new Date().toISOString()
                });
            }
            return true;
        } catch (error) {
            console.error('Error saving to history:', error);
            return false;
        }
    }

    openSettings() {
        this.elements.settingsModal.classList.add('active');
    }

    closeSettings() {
        this.elements.settingsModal.classList.remove('active');
    }

    saveSettings() {
        this.showNotification('Settings saved', 'success');
        this.closeSettings();
    }

    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.preparePrompt();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            // Redo functionality
        }
        
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
            if (this.state.isEditorOpen) {
                this.closeFullScreenEditor();
            }
        }
    }

    showNotification(message, type = 'info') {
        if (this.services.notification) {
            this.services.notification[type](message);
        } else {
            // Fallback
            const container = document.getElementById('notificationContainer');
            if (!container) return;
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };
            
            notification.innerHTML = `
                <i class="notification-icon ${icons[type] || icons.info}"></i>
                <div class="notification-message">${message}</div>
            `;
            
            container.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.2s ease forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 200);
            }, 3000);
        }
    }

    setupTheme() {
        if (this.modules.theme) {
            this.modules.theme.applyTheme(this.modules.theme.getCurrentTheme());
        } else {
            const savedTheme = this.services.storage.loadTheme('dark');
            document.body.className = savedTheme === 'dark' ? 'dark-theme' : '';
        }
    }

    setupVoice() {
        if (this.modules.voice) {
            const savedLanguage = this.services.storage.loadVoiceLanguage('en-US');
            this.modules.voice.setInputLanguage(savedLanguage);
        }
    }

    setupAutoGeneration() {
        const savedDelay = this.services.storage.loadAutoDelay(0);
        if (savedDelay > 0) {
            this.state.autoMode.enabled = true;
            this.state.autoMode.delay = savedDelay;
        }
    }

    loadInitialState() {
        this.updateUI();
    }

    updateUI() {
        this.updateFooterInfo();
        this.updateButtonStates();
        this.updateProgress();
    }

    updateFooterInfo() {
        const model = this.services.storage.loadModel('gemini-1.5-flash');
        const modelConfig = window.MODEL_CONFIG?.[model];
        const modelName = modelConfig?.name || 'Google Gemini';
        
        const currentModelEl = document.getElementById('currentModel');
        if (currentModelEl) {
            currentModelEl.textContent = modelName;
        }
        
        const theme = this.services.storage.loadTheme('dark');
        const currentThemeEl = document.getElementById('currentTheme');
        if (currentThemeEl) {
            currentThemeEl.textContent = theme === 'dark' ? 'Dark' : 'Light';
        }
        
        const language = this.services.storage.loadVoiceLanguage('en-US');
        const currentLanguageEl = document.getElementById('currentLanguage');
        if (currentLanguageEl) {
            currentLanguageEl.textContent = language.split('-')[0].toUpperCase();
        }
    }

    handlePromptEdit() {
        this.state.promptModified = true;
        this.updateButtonStates();
    }

    clearGeneratedPrompt() {
        this.elements.outputArea.textContent = '';
        this.state.originalPrompt = null;
        this.state.hasGeneratedPrompt = false;
        this.state.promptModified = false;
        this.elements.outputSection.classList.remove('visible');
        this.updateButtonStates();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.promptCraft = new PromptCraftApp();
});
