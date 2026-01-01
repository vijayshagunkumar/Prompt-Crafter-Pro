// app.js - Main application initialization
import { AppState } from './state.js';
import { IntentDetector } from '../modules/intent-detector.js';
import { PromptGenerator } from '../modules/prompt-generator.js';
import { AIRanker } from '../modules/ai-ranker.js';
import { VoiceManager } from '../modules/voice-manager.js';
import { ThemeManager } from '../modules/theme-manager.js';
import { HistoryManager } from '../modules/history-manager.js';
import { TemplateManager } from '../modules/template-manager.js';
import { NotificationService } from '../services/notification-service.js';
import { StorageService } from '../services/storage-service.js';
import { SettingsService } from '../services/settings-service.js';

export class PromptCraftApp {
    constructor() {
        this.state = new AppState();
        this.voiceManager = new VoiceManager();
        this.themeManager = new ThemeManager();
        this.historyManager = new HistoryManager();
        this.templateManager = new TemplateManager();
        this.notificationService = new NotificationService();
        this.storageService = new StorageService();
        this.settingsService = new SettingsService();
        
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
        
        console.log('PromptCraft Pro initialized');
    }

    bindElements() {
        // Cache DOM elements
        this.elements = {
            // Input elements
            userInput: document.getElementById('userInput'),
            requirement: document.getElementById('requirement'),
            charCounter: document.getElementById('charCounter'),
            
            // Output elements
            outputTextarea: document.getElementById('output'),
            outputArea: document.getElementById('outputArea'),
            
            // Buttons
            convertBtn: document.getElementById('convertBtn'),
            voiceInputBtn: document.getElementById('voiceInputBtn'),
            voiceOutputBtn: document.getElementById('voiceOutputBtn'),
            clearBtn: document.getElementById('clearBtn'),
            saveBtn: document.getElementById('saveBtn'),
            copyBtn: document.getElementById('copyBtn'),
            
            // AI Platform buttons
            chatgptBtn: document.getElementById('chatgptBtn'),
            claudeBtn: document.getElementById('claudeBtn'),
            geminiBtn: document.getElementById('geminiBtn'),
            perplexityBtn: document.getElementById('perplexityBtn'),
            deepseekBtn: document.getElementById('deepseekBtn'),
            copilotBtn: document.getElementById('copilotBtn'),
            grokBtn: document.getElementById('grokBtn'),
            
            // Settings
            settingsModal: document.getElementById('settingsModal'),
            themeSelect: document.getElementById('themeSelect'),
            voiceLanguage: document.getElementById('voiceLanguage'),
            
            // UI elements
            progressBar: document.getElementById('progressBar'),
            convertedBadge: document.getElementById('convertedBadge'),
            historyList: document.getElementById('historyList'),
            
            // Containers
            launchList: document.querySelector('.launch-list'),
            templatesPanel: document.getElementById('templatesPanel'),
            
            // Stats
            wordCount: document.getElementById('wordCount'),
            charCount: document.getElementById('charCount'),
            intentTags: document.getElementById('intentTags')
        };
    }

    bindEvents() {
        // Input handling
        if (this.elements.userInput) {
            this.elements.userInput.addEventListener('input', () => this.handleInputChange());
        }
        
        if (this.elements.requirement) {
            this.elements.requirement.addEventListener('input', () => this.handleInputChange());
        }
        
        // Convert button
        if (this.elements.convertBtn) {
            this.elements.convertBtn.addEventListener('click', () => this.convertPrompt());
        }
        
        // Voice buttons
        if (this.elements.voiceInputBtn) {
            this.elements.voiceInputBtn.addEventListener('click', () => this.voiceManager.toggleVoiceInput());
        }
        
        if (this.elements.voiceOutputBtn) {
            this.elements.voiceOutputBtn.addEventListener('click', () => this.voiceManager.toggleVoiceOutput());
        }
        
        // Clear button
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => this.clearInput());
        }
        
        // Copy button
        if (this.elements.copyBtn) {
            this.elements.copyBtn.addEventListener('click', () => this.copyOutput());
        }
        
        // Save button
        if (this.elements.saveBtn) {
            this.elements.saveBtn.addEventListener('click', () => this.savePrompt());
        }
        
        // AI Platform buttons
        const aiButtons = [
            this.elements.chatgptBtn,
            this.elements.claudeBtn,
            this.elements.geminiBtn,
            this.elements.perplexityBtn,
            this.elements.deepseekBtn,
            this.elements.copilotBtn,
            this.elements.grokBtn
        ];
        
        aiButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => this.launchAIPlatform(e));
            }
        });
        
        // Theme selector
        if (this.elements.themeSelect) {
            this.elements.themeSelect.addEventListener('change', (e) => this.changeTheme(e.target.value));
        }
        
        // Voice language selector
        if (this.elements.voiceLanguage) {
            this.elements.voiceLanguage.addEventListener('change', (e) => this.changeVoiceLanguage(e.target.value));
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Auto-convert toggle
        const autoConvertToggle = document.getElementById('autoConvertToggle');
        if (autoConvertToggle) {
            autoConvertToggle.addEventListener('change', (e) => this.toggleAutoConvert(e.target.checked));
        }
    }

    handleInputChange() {
        const text = this.elements.userInput?.value || this.elements.requirement?.value || '';
        
        // Update character counter
        if (this.elements.charCounter) {
            const charCount = text.length;
            this.elements.charCounter.textContent = `${charCount}/5000`;
        }
        
        // Update word count
        if (this.elements.wordCount) {
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            this.elements.wordCount.textContent = words;
        }
        
        // Update character count
        if (this.elements.charCount) {
            this.elements.charCount.textContent = text.length;
        }
        
        // Detect intent
        if (text.length > 10) {
            const intent = IntentDetector.analyzeInput(text);
            this.updateIntentTags(intent);
            
            // Auto-convert if enabled
            if (this.state.settings.autoConvert && text.length > 50) {
                this.scheduleAutoConvert();
            }
        }
        
        // Update UI state
        this.updateButtonStates();
    }

    updateIntentTags(intent) {
        if (!this.elements.intentTags) return;
        
        this.elements.intentTags.innerHTML = '';
        
        intent.allIntents.forEach(tag => {
            const chip = document.createElement('span');
            chip.className = 'intent-chip';
            chip.textContent = tag;
            chip.title = `Detected intent: ${tag}`;
            this.elements.intentTags.appendChild(chip);
        });
        
        // Update AI tool ranking
        AIRanker.rankAndReorder(intent);
    }

    async convertPrompt() {
        const inputText = this.elements.userInput?.value || this.elements.requirement?.value || '';
        
        if (!inputText.trim()) {
            this.notificationService.show('Please enter some text first', 'warning');
            return;
        }
        
        if (inputText.length < 10) {
            this.notificationService.show('Please provide more details for better results', 'warning');
            return;
        }
        
        // Show loading state
        this.showLoading(true);
        
        try {
            // Detect intent
            const intent = IntentDetector.analyzeInput(inputText);
            
            // Generate prompt
            const prompt = await PromptGenerator.generate(inputText, this.state.settings.promptStyle);
            
            // Update output
            if (this.elements.outputTextarea) {
                this.elements.outputTextarea.value = prompt;
            }
            if (this.elements.outputArea) {
                this.elements.outputArea.textContent = prompt;
            }
            
            this.state.originalPrompt = prompt;
            this.state.promptModified = false;
            this.state.hasGeneratedPrompt = true;
            
            // Update AI tool ranking
            AIRanker.rankAndReorder(intent);
            
            // Save to history
            this.historyManager.save(inputText, prompt);
            
            // Update UI
            this.updateProgress();
            this.updateButtonStates();
            
            // Show success
            this.notificationService.show('Prompt generated successfully!', 'success');
            
            // Show converted badge
            if (this.elements.convertedBadge) {
                this.elements.convertedBadge.textContent = '✓ Generated';
                this.elements.convertedBadge.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Prompt generation error:', error);
            this.notificationService.show('Failed to generate prompt', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    copyOutput() {
        const text = this.elements.outputTextarea?.value || this.elements.outputArea?.textContent || '';
        
        if (!text.trim()) {
            this.notificationService.show('No text to copy', 'warning');
            return;
        }
        
        navigator.clipboard.writeText(text)
            .then(() => {
                this.notificationService.show('Copied to clipboard!', 'success');
                
                // Visual feedback on button
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
                this.notificationService.show('Failed to copy text', 'error');
            });
    }

    savePrompt() {
        const input = this.elements.userInput?.value || this.elements.requirement?.value || '';
        const output = this.elements.outputTextarea?.value || this.elements.outputArea?.textContent || '';
        
        if (!input.trim() || !output.trim()) {
            this.notificationService.show('Nothing to save', 'warning');
            return;
        }
        
        this.historyManager.save(input, output);
        this.notificationService.show('Prompt saved to history', 'success');
    }

    clearInput() {
        if (this.elements.userInput) this.elements.userInput.value = '';
        if (this.elements.requirement) this.elements.requirement.value = '';
        this.handleInputChange();
        this.notificationService.show('Input cleared', 'info');
    }

    launchAIPlatform(event) {
        const platform = event.currentTarget.id.replace('Btn', '');
        const prompt = this.elements.outputTextarea?.value || this.elements.outputArea?.textContent || '';
        
        if (!prompt.trim()) {
            this.notificationService.show('Generate a prompt first', 'warning');
            return;
        }
        
        // Copy prompt to clipboard first
        navigator.clipboard.writeText(prompt)
            .then(() => {
                this.notificationService.show(`Prompt copied! Opening ${platform}...`, 'success');
                
                // Open platform in new tab
                const urls = {
                    chatgpt: 'https://chat.openai.com/',
                    claude: 'https://claude.ai/',
                    gemini: 'https://gemini.google.com/',
                    perplexity: 'https://www.perplexity.ai/',
                    deepseek: 'https://chat.deepseek.com/',
                    copilot: 'https://copilot.microsoft.com/',
                    grok: 'https://grok.x.ai/'
                };
                
                setTimeout(() => {
                    window.open(urls[platform], '_blank');
                }, 500);
            })
            .catch(err => {
                console.error('Copy failed:', err);
                this.notificationService.show('Failed to copy prompt', 'error');
            });
    }

    changeTheme(theme) {
        this.themeManager.apply(theme);
        this.state.settings.theme = theme;
        this.settingsService.save(this.state.settings);
        this.notificationService.show(`Theme changed to ${theme}`, 'info');
    }

    changeVoiceLanguage(language) {
        this.voiceManager.updateVoiceLanguage(language);
        this.state.settings.voiceLanguage = language;
        this.settingsService.save(this.state.settings);
    }

    setupAutoConvert() {
        if (this.state.settings.autoConvertDelay > 0) {
            this.autoConvertTimer = null;
            
            const inputElement = this.elements.userInput || this.elements.requirement;
            if (inputElement) {
                inputElement.addEventListener('input', () => {
                    clearTimeout(this.autoConvertTimer);
                    
                    const text = inputElement.value.trim();
                    if (text.length > 50) {
                        this.autoConvertTimer = setTimeout(() => {
                            this.convertPrompt();
                        }, this.state.settings.autoConvertDelay);
                    }
                });
            }
        }
    }

    toggleAutoConvert(enabled) {
        this.state.settings.autoConvert = enabled;
        this.settingsService.save(this.state.settings);
        
        if (enabled) {
            this.notificationService.show('Auto-convert enabled', 'info');
        } else {
            clearTimeout(this.autoConvertTimer);
            this.notificationService.show('Auto-convert disabled', 'info');
        }
    }

    updateProgress() {
        if (!this.elements.progressBar) return;
        
        let progress = 33; // Step 1
        
        if (this.state.hasGeneratedPrompt) {
            progress = 66; // Step 2
        }
        
        if (this.state.selectedPlatform) {
            progress = 100; // Step 3
        }
        
        this.elements.progressBar.style.width = `${progress}%`;
    }

    updateButtonStates() {
        const hasInput = (this.elements.userInput?.value || this.elements.requirement?.value || '').trim().length > 0;
        const hasOutput = (this.elements.outputTextarea?.value || this.elements.outputArea?.textContent || '').trim().length > 0;
        
        // Enable/disable buttons
        if (this.elements.convertBtn) {
            this.elements.convertBtn.disabled = !hasInput;
        }
        
        if (this.elements.copyBtn) {
            this.elements.copyBtn.disabled = !hasOutput;
        }
        
        if (this.elements.saveBtn) {
            this.elements.saveBtn.disabled = !hasOutput;
        }
        
        // Show/hide voice output button
        if (this.elements.voiceOutputBtn) {
            this.elements.voiceOutputBtn.style.display = hasOutput ? 'flex' : 'none';
        }
    }

    showLoading(show) {
        if (this.elements.convertBtn) {
            if (show) {
                this.elements.convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                this.elements.convertBtn.disabled = true;
            } else {
                this.elements.convertBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Prompt';
                this.updateButtonStates();
            }
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter to convert
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.convertPrompt();
        }
        
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.savePrompt();
        }
        
        // Ctrl/Cmd + C to copy
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            const activeElement = document.activeElement;
            if (!activeElement || activeElement.tagName === 'BODY') {
                e.preventDefault();
                this.copyOutput();
            }
        }
    }

    loadSettings() {
        const savedSettings = this.settingsService.load();
        if (savedSettings) {
            this.state.settings = { ...this.state.settings, ...savedSettings };
        }
    }

    applyTheme() {
        this.themeManager.apply(this.state.settings.theme);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PromptCraftApp();
});
