import Utils from './utils.js';
import SettingsManager from './settings.js';
import SpeechManager from './speech.js';
import PlatformsManager from './platforms.js';
import apiService from './api.js';

class PromptCraftEnterprise {
    constructor() {
        this.utils = new Utils();
        this.settingsManager = new SettingsManager();
        this.speechManager = new SpeechManager();
        this.platformsManager = new PlatformsManager();
        this.api = apiService;
        
        this.state = {
            currentStep: 1,
            isEditorOpen: false,
            currentEditor: null,
            selectedPlatform: null,
            originalPrompt: null,
            promptModified: false,
            hasGeneratedPrompt: false,
            inspirationPanelOpen: false,
            promptHistory: [],
            suggestions: [],
            undoStack: [],
            redoStack: [],
            apiStatus: 'checking',
            useFallback: false,
            currentModel: 'gemini-3-flash-preview',
            generationStats: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0
            },
            // Track maximize state
            isMaximized: false,
            maximizedSection: null
        };
        
        this.settings = this.settingsManager.load();
        this.init();
    }

    // Bind all UI elements - UPDATED
    bindElements() {
        console.log('🔗 Binding UI elements...');
        
        this.elements = {
            // Input Section
            userInput: document.getElementById('userInput'),
            micBtn: document.getElementById('micBtn'),
            undoBtn: document.getElementById('undoBtn'),
            maximizeInputBtn: document.getElementById('maximizeInputBtn'),
            clearBtn: document.getElementById('clearBtn'), // NEW
            charCounter: document.getElementById('charCounter'),
            needInspirationBtn: document.getElementById('needInspirationBtn'),
            closeInspirationBtn: document.getElementById('closeInspirationBtn'),
            inspirationPanel: document.getElementById('inspirationPanel'),
            
            // Output Section
            outputSection: document.getElementById('outputSection'),
            outputArea: document.getElementById('outputArea'),
            outputCard: document.getElementById('outputCard'),
            speakBtn: document.getElementById('speakBtn'),
            copyBtn: document.getElementById('copyBtn'),
            exportBtn: document.getElementById('exportBtn'),
            maximizeOutputBtn: document.getElementById('maximizeOutputBtn'),
            savePromptBtn: document.getElementById('savePromptBtn'),
            suggestionsPanel: document.getElementById('suggestionsPanel'),
            suggestionsList: document.getElementById('suggestionsList'),
            
            // Platforms
            platformsGrid: document.getElementById('platformsGrid'),
            platformsEmptyState: document.getElementById('platformsEmptyState'),
            
            // History
            historySection: document.getElementById('historySection'),
            historyList: document.getElementById('historyList'),
            historyBtn: document.getElementById('historyBtn'),
            closeHistoryBtn: document.getElementById('closeHistoryBtn'),
            
            // Settings
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            
            // Editor
            fullScreenEditor: document.getElementById('fullScreenEditor'),
            editorTextarea: document.getElementById('editorTextarea'),
            editorMicBtn: document.getElementById('editorMicBtn'),
            editorUndoBtn: document.getElementById('editorUndoBtn'),
            closeEditorBtn: document.getElementById('closeEditorBtn'),
            editorPrepareBtn: document.getElementById('editorPrepareBtn'),
            
            // API Status
            apiStatusIndicator: document.getElementById('apiStatusIndicator'),
            headerApiStatus: document.getElementById('headerApiStatus'),
            apiInfoPanel: document.getElementById('apiInfoPanel'),
            apiStatusMessage: document.getElementById('apiStatusMessage'),
            apiDetails: document.getElementById('apiDetails'),
            
            // CTA Buttons
            stickyPrepareBtn: document.getElementById('stickyPrepareBtn'),
            stickyResetBtn: document.getElementById('stickyResetBtn'),
            
            // Generation Info
            generationInfo: document.getElementById('generationInfo'),
            generatedModel: document.getElementById('generatedModel'),
            generationTime: document.getElementById('generationTime'),
            tokenCount: document.getElementById('tokenCount'),
            generationMode: document.getElementById('generationMode'),
            
            // Footer
            currentModel: document.getElementById('currentModel'),
            currentTheme: document.getElementById('currentTheme'),
            currentLanguage: document.getElementById('currentLanguage'),
            statusText: document.getElementById('statusText'),
            rateLimitDisplay: document.getElementById('rateLimitDisplay'),
            rateLimitText: document.getElementById('rateLimitText')
        };
        
        // Verify critical elements exist
        const criticalElements = ['userInput', 'outputArea', 'stickyPrepareBtn'];
        for (const elementId of criticalElements) {
            if (!this.elements[elementId]) {
                console.warn(`⚠️ Critical element not found: ${elementId}`);
            }
        }
        
        console.log(`✅ Bound ${Object.keys(this.elements).length} UI elements`);
        return this.elements;
    }

    async init() {
        this.bindElements();
        this.bindEvents();
        this.applyTheme();
        this.applyUIDensity();
        this.updateProgress();
        this.setupKeyboardShortcuts();
        this.loadHistory();
        this.updateFooterInfo();
        
        // Test API connection on startup
        await this.checkAPIStatus();
        
        // Initialize with current model
        this.updateCurrentModel();
        
        // Initialize button states
        this.updateButtonStates();
    }

    bindEvents() {
        console.log('🔗 Setting up event listeners...');
        
        // Prepare Prompt button
        if (this.elements.stickyPrepareBtn) {
            this.elements.stickyPrepareBtn.addEventListener('click', () => this.preparePrompt());
        }
        
        // Reset button
        if (this.elements.stickyResetBtn) {
            this.elements.stickyResetBtn.addEventListener('click', () => this.resetApp());
        }
        
        // Copy button
        if (this.elements.copyBtn) {
            this.elements.copyBtn.addEventListener('click', () => this.copyPrompt());
        }
        
        // Settings button
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        }
        
        // Save Settings button
        if (this.elements.saveSettingsBtn) {
            this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
        
        // Close settings button
        if (this.elements.closeSettingsBtn) {
            this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        }
        
        // Cancel settings button
        if (this.elements.cancelSettingsBtn) {
            this.elements.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
        }
        
        // Maximize buttons - NEW
        if (this.elements.maximizeInputBtn) {
            this.elements.maximizeInputBtn.addEventListener('click', () => this.maximizeSection('input'));
        }
        
        if (this.elements.maximizeOutputBtn) {
            this.elements.maximizeOutputBtn.addEventListener('click', () => this.maximizeSection('output'));
        }
        
        // Clear button - NEW
        if (this.elements.clearBtn) {
            this.elements.clearBtn.addEventListener('click', () => this.clearInput());
        }
        
        // Need Inspiration button - NEW
        if (this.elements.needInspirationBtn) {
            this.elements.needInspirationBtn.addEventListener('click', () => this.toggleInspirationPanel());
        }
        
        if (this.elements.closeInspirationBtn) {
            this.elements.closeInspirationBtn.addEventListener('click', () => this.closeInspirationPanel());
        }
        
        // Voice buttons - NEW
        if (this.elements.micBtn) {
            this.elements.micBtn.addEventListener('click', () => this.toggleVoiceInput());
        }
        
        if (this.elements.speakBtn) {
            this.elements.speakBtn.addEventListener('click', () => this.toggleVoiceOutput());
        }
        
        // Text input events
        if (this.elements.userInput) {
            this.elements.userInput.addEventListener('input', () => this.handleInputChange());
            this.elements.userInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
        }
        
        // Settings change detection
        this.bindSettingsEvents();
        
        console.log('✅ Event listeners set up');
    }
    
    // NEW: Maximize section functionality
    maximizeSection(section) {
        if (this.state.isMaximized && this.state.maximizedSection === section) {
            // Restore normal view
            this.restoreNormalView();
        } else {
            // Maximize the requested section
            this.enterMaximizeMode(section);
        }
    }
    
    enterMaximizeMode(section) {
        this.state.isMaximized = true;
        this.state.maximizedSection = section;
        
        // Store original content
        if (section === 'input') {
            this.state.originalInputContent = this.elements.userInput.value;
            this.elements.editorTextarea.value = this.state.originalInputContent;
            this.elements.editorTitle.innerHTML = '<i class="fas fa-edit"></i><span>Edit Input</span>';
            this.elements.editorPrepareBtn.textContent = 'Generate Prompt';
            this.elements.editorPrepareBtn.onclick = () => {
                this.elements.userInput.value = this.elements.editorTextarea.value;
                this.closeEditor();
                this.preparePrompt();
            };
        } else if (section === 'output') {
            this.state.originalOutputContent = this.elements.outputArea.textContent;
            this.elements.editorTextarea.value = this.state.originalOutputContent;
            this.elements.editorTitle.innerHTML = '<i class="fas fa-edit"></i><span>Edit Output</span>';
            this.elements.editorPrepareBtn.style.display = 'none';
        }
        
        // Show full screen editor
        this.elements.fullScreenEditor.style.display = 'flex';
        this.elements.fullScreenEditor.classList.add('active');
        this.elements.editorTextarea.focus();
        
        // Update button states
        this.updateMaximizeButtons();
    }
    
    restoreNormalView() {
        if (!this.state.isMaximized) return;
        
        // Restore content if modified
        if (this.state.maximizedSection === 'input') {
            this.elements.userInput.value = this.elements.editorTextarea.value;
        } else if (this.state.maximizedSection === 'output') {
            this.elements.outputArea.textContent = this.elements.editorTextarea.value;
        }
        
        // Close editor
        this.closeEditor();
    }
    
    closeEditor() {
        this.elements.fullScreenEditor.style.display = 'none';
        this.elements.fullScreenEditor.classList.remove('active');
        this.state.isMaximized = false;
        this.state.maximizedSection = null;
        this.updateMaximizeButtons();
    }
    
    updateMaximizeButtons() {
        const isInputMaximized = this.state.isMaximized && this.state.maximizedSection === 'input';
        const isOutputMaximized = this.state.isMaximized && this.state.maximizedSection === 'output';
        
        if (this.elements.maximizeInputBtn) {
            this.elements.maximizeInputBtn.innerHTML = isInputMaximized ? 
                '<i class="fas fa-compress"></i><span class="action-btn-tooltip">Minimize</span>' :
                '<i class="fas fa-expand"></i><span class="action-btn-tooltip">Maximize</span>';
        }
        
        if (this.elements.maximizeOutputBtn) {
            this.elements.maximizeOutputBtn.innerHTML = isOutputMaximized ? 
                '<i class="fas fa-compress"></i><span class="action-btn-tooltip">Minimize</span>' :
                '<i class="fas fa-expand"></i><span class="action-btn-tooltip">Maximize</span>';
        }
    }
    
    // NEW: Clear input functionality
    clearInput() {
        if (this.elements.userInput) {
            this.elements.userInput.value = '';
            this.handleInputChange();
        }
        
        // Also clear output if exists
        if (this.elements.outputArea) {
            this.elements.outputArea.textContent = '';
        }
        
        // Hide output section
        if (this.elements.outputSection) {
            this.elements.outputSection.hidden = true;
            this.elements.outputSection.classList.remove('visible');
        }
        
        // Reset generation state
        this.state.hasGeneratedPrompt = false;
        this.updateButtonStates();
        
        this.showNotification('Cleared input', 'info');
    }
    
    // NEW: Toggle inspiration panel
    toggleInspirationPanel() {
        const panel = this.elements.inspirationPanel;
        const isExpanded = panel.classList.contains('expanded');
        
        if (isExpanded) {
            this.closeInspirationPanel();
        } else {
            panel.classList.add('expanded');
            this.elements.needInspirationBtn.setAttribute('aria-expanded', 'true');
            this.elements.needInspirationBtn.innerHTML = '<i class="fas fa-times"></i><span class="inspiration-btn-text">Close Inspiration</span>';
            
            // Add click handlers for inspiration items
            const inspirationItems = panel.querySelectorAll('.inspiration-item');
            inspirationItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.applyInspirationTemplate(item.dataset.type);
                });
            });
        }
    }
    
    closeInspirationPanel() {
        this.elements.inspirationPanel.classList.remove('expanded');
        this.elements.needInspirationBtn.setAttribute('aria-expanded', 'false');
        this.elements.needInspirationBtn.innerHTML = '<i class="fas fa-lightbulb"></i><span class="inspiration-btn-text">Need Inspiration?</span>';
    }
    
    applyInspirationTemplate(type) {
        const templates = {
            email: `Write a professional business email to [Recipient Name] about [Subject]. Include:
1. Clear subject line
2. Professional greeting
3. Main purpose/request
4. Supporting details
5. Call to action
6. Professional closing

Tone: Professional, clear, and respectful`,
            code: `Create a [Programming Language] function that [Function Purpose]. Requirements:
1. Input parameters: [List parameters]
2. Return type: [Expected return]
3. Error handling: [How to handle errors]
4. Performance considerations: [Any performance requirements]
5. Include comments explaining key logic

Example usage should be provided.`,
            analysis: `Analyze [Dataset/Report Name] and provide insights on:
1. Key trends and patterns observed
2. Statistical summary (mean, median, mode, standard deviation)
3. Significant outliers or anomalies
4. Comparative analysis (if applicable)
5. Recommendations based on findings
6. Visualizations needed (charts, graphs)

Focus on actionable insights.`,
            creative: `Write a [Creative Piece Type - story/poem/article] about [Topic/Theme]. Include:
1. Engaging opening/hook
2. Character/context development (if applicable)
3. Core narrative or message
4. Emotional tone: [Specify tone]
5. Vivid descriptions and imagery
6. Satisfying conclusion

Length: Approximately [Number] words.`,
            strategy: `Develop a business strategy for [Company/Project] to achieve [Goal]. Consider:
1. Current market position
2. SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
3. Target audience/market
4. Competitive advantage
5. Implementation timeline (short-term/long-term)
6. Key performance indicators (KPIs)
7. Risk mitigation strategies`,
            research: `Summarize research on [Topic] focusing on:
1. Key findings from major studies
2. Methodology overview
3. Conflicting viewpoints (if any)
4. Gaps in current research
5. Practical applications/implications
6. Future research directions

Format: Academic but accessible, with citations where appropriate.`
        };
        
        if (templates[type] && this.elements.userInput) {
            this.elements.userInput.value = templates[type];
            this.handleInputChange();
            this.closeInspirationPanel();
            this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} template applied`, 'success');
        }
    }
    
    // NEW: Voice input/output toggle
    toggleVoiceInput() {
        // This will be implemented in speech.js
        this.speechManager.toggleRecognition()
            .then(text => {
                if (text && this.elements.userInput) {
                    this.elements.userInput.value += text;
                    this.handleInputChange();
                }
            })
            .catch(error => {
                this.showNotification('Voice input failed: ' + error.message, 'error');
            });
    }
    
    toggleVoiceOutput() {
        const text = this.elements.outputArea.textContent;
        if (!text) {
            this.showNotification('No text to read aloud', 'warning');
            return;
        }
        
        this.speechManager.toggleSynthesis(text)
            .then(() => {
                // Success handled in speech.js
            })
            .catch(error => {
                this.showNotification('Voice output failed: ' + error.message, 'error');
            });
    }
    
    // NEW: Bind settings events for save button enable/disable
    bindSettingsEvents() {
        const settingsForm = document.getElementById('settingsModal');
        if (!settingsForm) return;
        
        // Track initial settings
        this.originalSettings = JSON.stringify(this.settings);
        
        // Listen to all settings changes
        const inputs = settingsForm.querySelectorAll('select, input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.checkSettingsChanged());
        });
    }
    
    checkSettingsChanged() {
        if (!this.elements.saveSettingsBtn) return;
        
        // Get current settings values from form
        const currentSettings = {
            theme: document.getElementById('themeSelect')?.value || 'dark',
            uiDensity: document.getElementById('uiDensity')?.value || 'comfortable',
            interfaceLanguage: document.getElementById('interfaceLanguage')?.value || 'en',
            voiceInputLanguage: document.getElementById('voiceInputLanguage')?.value || 'en-US',
            voiceOutputLanguage: document.getElementById('voiceOutputLanguage')?.value || 'en-US',
            defaultModel: document.getElementById('defaultAiModel')?.value || 'gemini-3-flash-preview',
            promptStyle: document.getElementById('promptStyle')?.value || 'detailed',
            maxHistoryItems: document.getElementById('maxHistoryItems')?.value || '50'
        };
        
        const hasChanged = JSON.stringify(currentSettings) !== this.originalSettings;
        this.elements.saveSettingsBtn.disabled = !hasChanged;
    }
    
    // NEW: Save settings functionality
    saveSettings() {
        const newSettings = {
            theme: document.getElementById('themeSelect')?.value || 'dark',
            uiDensity: document.getElementById('uiDensity')?.value || 'comfortable',
            interfaceLanguage: document.getElementById('interfaceLanguage')?.value || 'en',
            voiceInputLanguage: document.getElementById('voiceInputLanguage')?.value || 'en-US',
            voiceOutputLanguage: document.getElementById('voiceOutputLanguage')?.value || 'en-US',
            defaultModel: document.getElementById('defaultAiModel')?.value || 'gemini-3-flash-preview',
            defaultPlatform: document.getElementById('defaultPlatform')?.value || 'gemini',
            promptStyle: document.getElementById('promptStyle')?.value || 'detailed',
            maxHistoryItems: parseInt(document.getElementById('maxHistoryItems')?.value || '50'),
            apiMode: document.getElementById('apiMode')?.value || 'auto',
            apiEndpoint: document.getElementById('apiEndpoint')?.value || 'https://promptcraft-api.vijay-shagunkumar.workers.dev',
            autoConvertDelay: parseInt(document.getElementById('autoConvertDelay')?.value || '0'),
            notificationDuration: parseInt(document.getElementById('notificationDuration')?.value || '3000'),
            textareaSize: document.getElementById('textareaSize')?.value || 'auto',
            debugMode: document.getElementById('debugMode')?.value || 'off'
        };
        
        this.settingsManager.save(newSettings);
        this.settings = newSettings;
        this.originalSettings = JSON.stringify(newSettings);
        
        // Apply new settings
        this.applyTheme();
        this.applyUIDensity();
        this.updateFooterInfo();
        
        // Disable save button
        this.elements.saveSettingsBtn.disabled = true;
        
        this.showNotification('Settings saved successfully', 'success');
        this.closeSettings();
    }
    
    openSettings() {
        if (this.elements.settingsModal) {
            // Populate form with current settings
            this.populateSettingsForm();
            this.elements.settingsModal.style.display = 'flex';
            this.elements.settingsModal.classList.add('active');
            
            // Disable save button initially
            this.elements.saveSettingsBtn.disabled = true;
            this.originalSettings = JSON.stringify(this.settings);
        }
    }
    
    populateSettingsForm() {
        // Set form values from current settings
        const setValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        };
        
        setValue('themeSelect', this.settings.theme || 'dark');
        setValue('uiDensity', this.settings.uiDensity || 'comfortable');
        setValue('interfaceLanguage', this.settings.interfaceLanguage || 'en');
        setValue('voiceInputLanguage', this.settings.voiceInputLanguage || 'en-US');
        setValue('voiceOutputLanguage', this.settings.voiceOutputLanguage || 'en-US');
        setValue('defaultAiModel', this.settings.defaultModel || 'gemini-3-flash-preview');
        setValue('defaultPlatform', this.settings.defaultPlatform || 'gemini');
        setValue('promptStyle', this.settings.promptStyle || 'detailed');
        setValue('maxHistoryItems', this.settings.maxHistoryItems || '50');
        setValue('apiMode', this.settings.apiMode || 'auto');
        setValue('apiEndpoint', this.settings.apiEndpoint || 'https://promptcraft-api.vijay-shagunkumar.workers.dev');
        setValue('autoConvertDelay', this.settings.autoConvertDelay || '0');
        setValue('notificationDuration', this.settings.notificationDuration || '3000');
        setValue('textareaSize', this.settings.textareaSize || 'auto');
        setValue('debugMode', this.settings.debugMode || 'off');
    }
    
    closeSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'none';
            this.elements.settingsModal.classList.remove('active');
        }
    }
    
    // UPDATED: Update button states to handle Prepare Prompt vs Reset
    updateButtonStates() {
        const hasPrompt = this.state.hasGeneratedPrompt;
        
        // Update Prepare Prompt button
        if (this.elements.stickyPrepareBtn) {
            if (hasPrompt) {
                this.elements.stickyPrepareBtn.classList.add('removed');
                setTimeout(() => {
                    this.elements.stickyPrepareBtn.style.display = 'none';
                }, 300);
            } else {
                this.elements.stickyPrepareBtn.classList.remove('removed');
                this.elements.stickyPrepareBtn.style.display = 'flex';
            }
        }
        
        // Update Reset button
        if (this.elements.stickyResetBtn) {
            if (hasPrompt) {
                this.elements.stickyResetBtn.classList.remove('hidden');
                this.elements.stickyResetBtn.classList.add('visible');
            } else {
                this.elements.stickyResetBtn.classList.add('hidden');
                this.elements.stickyResetBtn.classList.remove('visible');
            }
        }
    }
    
    // Rest of the existing methods remain the same...
    // Only showing changes above for clarity
}

export default PromptCraftEnterprise;
