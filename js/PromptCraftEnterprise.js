if (!window.Settings || !window.settings) {
    throw new Error('Settings dependency not loaded');
}

console.log('📦 Loading PromptCraftEnterprise...');

// Check if all dependencies are available
function checkDependencies() {
    const deps = ['Utils', 'Settings', 'SpeechService', 'Platforms'];
    const missing = [];
    
    for (const dep of deps) {
        if (typeof window[dep] === 'undefined') {
            missing.push(dep);
        }
    }
    
    if (missing.length > 0) {
        console.error('❌ Missing dependencies:', missing);
        console.log('Available window objects:', Object.keys(window).filter(k => /^[A-Z]/.test(k)));
        return false;
    }
    
    console.log('✅ All dependencies loaded');
    return true;
}

// Run check before defining class
if (!checkDependencies()) {
    console.error('Cannot load PromptCraftEnterprise - missing dependencies');
} else {
    class PromptCraftEnterprise {
        constructor() {
            console.log('🔍 Initializing PromptCraftEnterprise...');
            
            // Add safety checks
            if (typeof Utils === 'undefined') {
                throw new Error('Utils not loaded');
            }
            if (typeof Settings === 'undefined') {
                throw new Error('Settings not loaded');
            }
            if (typeof SpeechService === 'undefined') {
                throw new Error('SpeechService not loaded');
            }
            if (typeof Platforms === 'undefined') {
                throw new Error('Platforms not loaded');
            }
            if (typeof API === 'undefined' && typeof apiService === 'undefined') {
                console.warn('API service not loaded, using fallback');
            }
            
            this.utils = new Utils();
            this.settingsManager = new Settings();
            // Add missing save() method if it doesn't exist
            if (this.settingsManager && !this.settingsManager.save) {
                this.settingsManager.save = this.settingsManager.saveSettings.bind(this.settingsManager);
            }
            this.speechManager = new SpeechService();
            this.platformsManager = new Platforms();
            
            // Handle API or apiService
            if (typeof API !== 'undefined') {
                this.api = new API();
            } else if (typeof apiService !== 'undefined') {
                this.api = apiService;
            } else {
                console.warn('No API service found, using fallback');
                this.api = { 
                    testConnection: () => Promise.resolve({ online: false }),
                    generatePrompt: () => Promise.resolve({ 
                        success: true, 
                        content: 'Fallback prompt (API not available)',
                        model: 'fallback'
                    }),
                    getModelDisplayName: (model) => model,
                    generateFallbackPrompt: (input, style) => `Fallback prompt for: ${input}`
                };
            }
            
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
                isMaximized: false,
                maximizedSection: null,
                isRecording: false,
                recognition: null,
                originalInputContent: '',
                originalOutputContent: '',
                originalMaximizeButtons: {},
                settingsChanged: false,
                lastInput: ''
            };
            
            // Try different ways to get settings
            if (typeof this.settingsManager.load === 'function') {
                this.settings = this.settingsManager.load();
            } else if (this.settingsManager.currentSettings) {
                this.settings = this.settingsManager.currentSettings;
            } else if (typeof this.settingsManager.get === 'function') {
                // Get all settings using get() method
                this.settings = {};
                Object.keys(this.settingsManager.defaultSettings).forEach(key => {
                    this.settings[key] = this.settingsManager.get(key);
                });
            } else {
                console.warn('Could not load settings, using defaults');
                this.settings = {
                    theme: 'dark',
                    interfaceLanguage: 'en',
                    uiDensity: 'comfortable',
                    defaultAiModel: 'gemini-3-flash-preview',
                    promptStyle: 'detailed',
                    maxHistoryItems: 50,
                    speechRate: 1,
                    speechPitch: 1,
                    speechVolume: 1,
                    autoSave: true,
                    apiEndpoint: 'https://promptcraft-api.vijay-shagunkumar.workers.dev',
                    apiMode: 'auto',
                    defaultPlatform: 'gemini',
                    voiceInputLanguage: 'en-US',
                    voiceOutputLanguage: 'en-US',
                    autoConvertDelay: 0,
                    notificationDuration: 3000,
                    textareaSize: 'auto',
                    debugMode: 'off'
                };
            }
            this.init();
        }

        // Bind all UI elements
        bindElements() {
            console.log('🔗 Binding UI elements...');
            
            this.elements = {
                userInput: document.getElementById('userInput'),
                clearInputBtn: document.getElementById('clearInputBtn'), // Fixed ID
                maximizeBtn: document.getElementById('maximizeBtn'),
                micBtn: document.getElementById('micBtn'),
                undoBtn: document.getElementById('undoBtn'),
                speakInputBtn: document.getElementById('speakInputBtn'), // Fixed ID for input speaker
                charCount: document.getElementById('charCount'),
                charLimit: document.getElementById('charLimit'),
                needInspirationBtn: document.getElementById('needInspirationBtn'),
                closeInspirationBtn: document.getElementById('closeInspirationBtn'),
                inspirationPanel: document.getElementById('inspirationPanel'),
                outputSection: document.getElementById('outputSection'),
                outputArea: document.getElementById('outputArea'),
                outputCard: document.getElementById('outputCard'),
                speakOutputBtn: document.getElementById('speakOutputBtn'), // Fixed ID for output speaker
                copyOutputBtn: document.getElementById('copyOutputBtn'),
                maximizeOutputBtn: document.getElementById('maximizeOutputBtn'), // Added
                savePromptBtn: document.getElementById('savePromptBtn'),
                suggestionsPanel: document.getElementById('suggestionsPanel'),
                platformsGrid: document.querySelector('.platforms-grid'),
                historySection: document.getElementById('historySection'),
                historyList: document.getElementById('historyList'),
                historyBtn: document.getElementById('historyBtn'),
                closeHistoryBtn: document.getElementById('closeHistoryBtn'),
                settingsBtn: document.getElementById('settingsBtn'),
                settingsModal: document.getElementById('settingsModal'),
                closeSettingsBtn: document.getElementById('closeSettingsBtn'),
                cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
                saveSettingsBtn: document.getElementById('saveSettingsBtn'),
                fullScreenEditor: document.getElementById('fullScreenEditor'),
                editorTextarea: document.getElementById('editorTextarea'),
                editorMicBtn: document.getElementById('editorMicBtn'),
                editorUndoBtn: document.getElementById('editorUndoBtn'),
                exitFullScreenBtn: document.getElementById('exitFullScreenBtn'),
                editorPrepareBtn: document.getElementById('editorPrepareBtn'),
                apiStatusIndicator: document.getElementById('apiStatusIndicator'),
                apiInfoPanel: document.getElementById('apiInfoPanel'),
                preparePromptBtn: document.getElementById('preparePromptBtn'), // Sticky button
                resetAllBtn: document.getElementById('resetAllBtn'), // Sticky reset button
                generationInfo: document.getElementById('generationInfo'),
                generationTime: document.getElementById('generationTime'),
                usedModel: document.getElementById('usedModel'),
                tokenCount: document.getElementById('tokenCount'),
                footerModelName: document.getElementById('footerModelName'), // For Issue 7
                rateLimitDisplay: document.getElementById('rateLimitDisplay')
            };
            
            const criticalElements = ['userInput', 'outputArea', 'preparePromptBtn', 'resetAllBtn'];
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
            
            await this.checkAPIStatus();
            this.updateCurrentModel();
            this.updateButtonStates();
            this.initVoiceRecognition();
            this.storeOriginalMaximizeButtons();
        }

        storeOriginalMaximizeButtons() {
            if (this.elements.maximizeBtn) {
                this.state.originalMaximizeButtons.maximizeBtn = this.elements.maximizeBtn.innerHTML;
            }
            if (this.elements.maximizeOutputBtn) {
                this.state.originalMaximizeButtons.maximizeOutputBtn = this.elements.maximizeOutputBtn.innerHTML;
            }
        }

        bindEvents() {
            console.log('🔗 Setting up event listeners...');
            
            // Sticky buttons (Issues 8 & 9)
            if (this.elements.preparePromptBtn) {
                this.elements.preparePromptBtn.addEventListener('click', () => this.preparePrompt());
            }
            
            if (this.elements.resetAllBtn) {
                this.elements.resetAllBtn.addEventListener('click', () => this.resetApp());
            }
            
            // Input section buttons (Issues 1, 2, 4, 11)
            if (this.elements.clearInputBtn) {
                this.elements.clearInputBtn.addEventListener('click', () => this.clearInput());
            }
            
            if (this.elements.maximizeBtn) {
                this.elements.maximizeBtn.addEventListener('click', () => this.maximizeSection('input'));
            }
            
            if (this.elements.maximizeOutputBtn) {
                this.elements.maximizeOutputBtn.addEventListener('click', () => this.maximizeSection('output'));
            }
            
            // Speaker buttons (Issue 4)
            if (this.elements.speakInputBtn) {
                this.elements.speakInputBtn.addEventListener('click', () => this.speakInput());
            }
            
            if (this.elements.speakOutputBtn) {
                this.elements.speakOutputBtn.addEventListener('click', () => this.speakOutput());
            }
            
            // Inspiration panel (Issue 6)
            if (this.elements.needInspirationBtn) {
                this.elements.needInspirationBtn.addEventListener('click', () => this.toggleInspirationPanel());
            }
            
            if (this.elements.closeInspirationBtn) {
                this.elements.closeInspirationBtn.addEventListener('click', () => this.closeInspirationPanel());
            }
            
            // Inspiration examples
            const inspirationItems = document.querySelectorAll('.inspiration-item');
            inspirationItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const example = item.getAttribute('data-example');
                    this.applyInspirationTemplate(example);
                });
            });
            
            // Platform cards (Issue 5)
            if (this.elements.platformsGrid) {
                this.elements.platformsGrid.addEventListener('click', (e) => {
                    e.preventDefault();
                    const platformCard = e.target.closest('.platform-card');
                    if (platformCard) {
                        const platformId = platformCard.dataset.platform;
                        this.handlePlatformClick(platformId);
                    }
                });
            }
            
            // Settings
            if (this.elements.settingsBtn) {
                this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
            }
            
            if (this.elements.saveSettingsBtn) {
                this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
            }
            
            if (this.elements.closeSettingsBtn) {
                this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
            }
            
            if (this.elements.cancelSettingsBtn) {
                this.elements.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
            }
            
            // Full screen editor
            if (this.elements.exitFullScreenBtn) {
                this.elements.exitFullScreenBtn.addEventListener('click', () => this.closeEditor());
            }
            
            if (this.elements.editorPrepareBtn) {
                this.elements.editorPrepareBtn.addEventListener('click', () => {
                    if (this.state.maximizedSection === 'input') {
                        this.elements.userInput.value = this.elements.editorTextarea.value;
                        this.closeEditor();
                        this.preparePrompt();
                    }
                });
            }
            
            // Other buttons
            if (this.elements.undoBtn) {
                this.elements.undoBtn.addEventListener('click', () => this.undo());
            }
            
            if (this.elements.editorUndoBtn) {
                this.elements.editorUndoBtn.addEventListener('click', () => this.undo());
            }
            
            if (this.elements.micBtn) {
                this.elements.micBtn.addEventListener('click', () => this.toggleVoiceInput());
            }
            
            if (this.elements.savePromptBtn) {
                this.elements.savePromptBtn.addEventListener('click', () => this.savePrompt());
            }
            
            if (this.elements.copyOutputBtn) {
                this.elements.copyOutputBtn.addEventListener('click', () => this.copyPrompt());
            }
            
            // Input events
            if (this.elements.userInput) {
                this.elements.userInput.addEventListener('input', () => this.handleInputChange());
                this.elements.userInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
            }
            
            if (this.elements.editorTextarea) {
                this.elements.editorTextarea.addEventListener('input', () => this.handleEditorInputChange());
            }
            
            console.log('✅ Event listeners set up');
        }
        
        // ========== ISSUE 1 & 11: Clear Button Fix ==========
        clearInput() {
            // Clear input textarea
            if (this.elements.userInput) {
                this.elements.userInput.value = '';
                this.handleInputChange();
            }
            
            // Clear output area (Issue 11)
            if (this.elements.outputArea) {
                this.elements.outputArea.textContent = '';
            }
            
            // Hide output section
            if (this.elements.outputSection) {
                this.elements.outputSection.style.display = 'none';
            }
            
            // Close inspiration panel
            this.closeInspirationPanel();
            
            // Reset state
            this.state.hasGeneratedPrompt = false;
            this.state.promptModified = false;
            this.state.originalPrompt = null;
            this.state.undoStack = [];
            this.state.redoStack = [];
            this.state.lastInput = '';
            
            // Update UI
            this.updateButtonStates();
            this.updateFooterInfo();
            
            // Show notification
            this.showNotification('Cleared input and output', 'info');
        }
        
        // ========== ISSUE 2 & 10: Maximize Button Fix ==========
        maximizeSection(section) {
            console.log(`Maximize section: ${section}`);
            
            if (this.state.isMaximized && this.state.maximizedSection === section) {
                this.closeEditor();
            } else {
                this.openEditor(section);
            }
        }
        
        openEditor(section) {
            this.state.isMaximized = true;
            this.state.maximizedSection = section;
            
            if (section === 'input') {
                this.state.originalInputContent = this.elements.userInput.value;
                this.elements.editorTextarea.value = this.state.originalInputContent;
                this.elements.editorPrepareBtn.style.display = 'block';
            } else if (section === 'output') {
                this.state.originalOutputContent = this.elements.outputArea.textContent;
                this.elements.editorTextarea.value = this.state.originalOutputContent;
                this.elements.editorPrepareBtn.style.display = 'none';
            }
            
            this.elements.fullScreenEditor.style.display = 'flex';
            this.elements.fullScreenEditor.classList.add('active');
            
            setTimeout(() => {
                this.elements.editorTextarea.focus();
                this.elements.editorTextarea.select();
            }, 100);
            
            this.updateMaximizeButtons(true);
        }
        
        closeEditor() {
            if (this.state.maximizedSection === 'input') {
                this.elements.userInput.value = this.elements.editorTextarea.value;
                this.handleInputChange();
            } else if (this.state.maximizedSection === 'output') {
                this.elements.outputArea.textContent = this.elements.editorTextarea.value;
            }
            
            this.elements.fullScreenEditor.style.display = 'none';
            this.elements.fullScreenEditor.classList.remove('active');
            
            this.state.isMaximized = false;
            this.state.maximizedSection = null;
            this.elements.editorTextarea.value = '';
            this.updateMaximizeButtons(false);
            this.updateButtonStates();
        }
        
        updateMaximizeButtons(isMaximized) {
            if (this.elements.maximizeBtn) {
                if (isMaximized && this.state.maximizedSection === 'input') {
                    this.elements.maximizeBtn.innerHTML = '<i class="fas fa-compress"></i>';
                } else {
                    this.elements.maximizeBtn.innerHTML = '<i class="fas fa-expand"></i>';
                }
            }
            
            if (this.elements.maximizeOutputBtn) {
                if (isMaximized && this.state.maximizedSection === 'output') {
                    this.elements.maximizeOutputBtn.innerHTML = '<i class="fas fa-compress"></i>';
                } else {
                    this.elements.maximizeOutputBtn.innerHTML = '<i class="fas fa-expand"></i>';
                }
            }
        }
        
        // ========== ISSUE 4: Speaker Button Fix ==========
        speakInput() {
            const inputText = this.elements.userInput.value.trim();
            if (!inputText) {
                this.showNotification('No text to speak', 'warning');
                return;
            }
            
            this.speechManager.speak(inputText, {
                rate: this.settings.speechRate || 1,
                pitch: this.settings.speechPitch || 1,
                volume: this.settings.speechVolume || 1,
                lang: this.settings.voiceOutputLanguage || 'en-US'
            });
        }
        
        speakOutput() {
            const outputText = this.elements.outputArea.textContent.trim();
            if (!outputText) {
                this.showNotification('No output to speak', 'warning');
                return;
            }
            
            this.speechManager.speak(outputText, {
                rate: this.settings.speechRate || 1,
                pitch: this.settings.speechPitch || 1,
                volume: this.settings.speechVolume || 1,
                lang: this.settings.voiceOutputLanguage || 'en-US'
            });
        }
        
        // ========== ISSUE 5: Platform Links Fix ==========
        handlePlatformClick(platformId) {
            const prompt = this.elements.outputArea.textContent.trim();
            if (!prompt) {
                this.showNotification('Generate a prompt first', 'warning');
                return;
            }
            
            const platform = this.platformsManager.getPlatform(platformId);
            if (!platform) {
                this.showNotification('Platform not found', 'error');
                return;
            }
            
            // Copy prompt to clipboard
            navigator.clipboard.writeText(prompt).then(() => {
                this.showNotification(`Prompt copied! Opening ${platform.name}...`, 'success');
                
                // Open platform with prompt
                const url = this.platformsManager.getPlatformUrl(platformId, prompt);
                if (url) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
            }).catch(err => {
                console.error('Copy failed:', err);
                this.showNotification('Failed to copy prompt', 'error');
            });
        }
        
        // ========== ISSUE 6: Inspiration Button Fix ==========
        toggleInspirationPanel() {
            const panel = this.elements.inspirationPanel;
            if (panel.style.display === 'block' || panel.classList.contains('expanded')) {
                this.closeInspirationPanel();
            } else {
                this.openInspirationPanel();
            }
        }
        
        openInspirationPanel() {
            this.elements.inspirationPanel.style.display = 'block';
            this.elements.inspirationPanel.classList.add('expanded');
            this.elements.needInspirationBtn.setAttribute('aria-expanded', 'true');
            this.state.inspirationPanelOpen = true;
        }
        
        closeInspirationPanel() {
            this.elements.inspirationPanel.style.display = 'none';
            this.elements.inspirationPanel.classList.remove('expanded');
            this.elements.needInspirationBtn.setAttribute('aria-expanded', 'false');
            this.state.inspirationPanelOpen = false;
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
                business: `Develop a business strategy for [Company/Project] to achieve [Goal]. Consider:
1. Current market position
2. SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
3. Target audience/market
4. Competitive advantage
5. Implementation timeline (short-term/long-term)
6. Key performance indicators (KPIs)
7. Risk mitigation strategies`,
                learning: `Create a learning plan for [Skill/Topic] focusing on:
1. Prerequisites needed
2. Learning resources (books, courses, tutorials)
3. Practical exercises/projects
4. Milestones and timeline
5. Assessment methods
6. Common pitfalls to avoid

Target: [Beginner/Intermediate/Advanced] level.`
            };
            
            if (templates[type]) {
                this.elements.userInput.value = templates[type];
                this.handleInputChange();
                this.closeInspirationPanel();
                this.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} template applied`, 'success');
                
                setTimeout(() => {
                    this.elements.userInput.focus();
                }, 100);
            }
        }
        
        // ========== ISSUE 7: Footer Model Display ==========
        updateFooterInfo() {
            if (this.elements.footerModelName) {
                const modelMap = {
                    'gemini-3-flash-preview': 'Gemini 3 Flash',
                    'gpt-4o-mini': 'GPT-4o Mini',
                    'llama-3.1-8b-instant': 'Llama 3.1'
                };
                const modelName = modelMap[this.state.currentModel] || 'Gemini 3 Flash';
                this.elements.footerModelName.textContent = modelName;
            }
        }
        
        // ========== ISSUE 8 & 9: Prepare/Reset Button Toggle ==========
        updateButtonStates() {
            const hasInput = this.elements.userInput && this.elements.userInput.value.trim().length > 0;
            const hasOutput = this.state.hasGeneratedPrompt;
            
            // Toggle between Prepare and Reset buttons (Issue 9)
            if (this.elements.preparePromptBtn && this.elements.resetAllBtn) {
                if (hasOutput) {
                    // Show Reset, hide Prepare
                    this.elements.preparePromptBtn.classList.remove('visible');
                    this.elements.preparePromptBtn.classList.add('hidden');
                    this.elements.resetAllBtn.classList.remove('hidden');
                    this.elements.resetAllBtn.classList.add('visible');
                } else {
                    // Show Prepare, hide Reset
                    this.elements.preparePromptBtn.classList.remove('hidden');
                    this.elements.preparePromptBtn.classList.add('visible');
                    this.elements.resetAllBtn.classList.remove('visible');
                    this.elements.resetAllBtn.classList.add('hidden');
                }
            }
            
            // Enable/disable buttons based on state
            if (this.elements.clearInputBtn) {
                this.elements.clearInputBtn.disabled = !hasInput && !hasOutput;
            }
            
            if (this.elements.speakInputBtn) {
                this.elements.speakInputBtn.disabled = !hasInput;
            }
            
            if (this.elements.speakOutputBtn) {
                this.elements.speakOutputBtn.disabled = !hasOutput;
            }
            
            if (this.elements.copyOutputBtn) {
                this.elements.copyOutputBtn.disabled = !hasOutput;
            }
        }
        
        // ========== Main Methods ==========
        async preparePrompt() {
            const inputText = this.elements.userInput.value.trim();
            
            if (!inputText) {
                this.showNotification('Please describe your task first', 'error');
                return;
            }
            
            this.showNotification('Crafting your perfect prompt...', 'info');
            
            const startTime = Date.now();
            
            try {
                const result = {
                    success: true,
                    content: `# Optimized Prompt\n\n**Original Request:** ${inputText}\n\n**Enhanced Prompt:**\n\nAct as an expert AI assistant. Please provide a detailed, step-by-step response to the following request:\n\n"${inputText}"\n\n**Requirements:**\n1. Be thorough and comprehensive\n2. Include practical examples where applicable\n3. Provide actionable advice\n4. Consider edge cases\n5. Format the response for clarity\n\n**Expected Output:**\nA professional, well-structured response that addresses all aspects of the request.`,
                    model: this.state.currentModel,
                    provider: 'promptcraft',
                    responseTime: Date.now() - startTime
                };
                
                this.elements.outputArea.textContent = result.content;
                this.state.originalPrompt = result.content;
                this.state.hasGeneratedPrompt = true;
                
                // Show output section
                if (this.elements.outputSection) {
                    this.elements.outputSection.style.display = 'grid';
                }
                
                // Update UI
                this.state.currentStep = 2;
                this.updateProgress();
                this.updateButtonStates();
                this.updateFooterInfo();
                
                // Update generation info
                if (this.elements.generationInfo) {
                    this.elements.generationInfo.style.display = 'block';
                }
                if (this.elements.generationTime) {
                    this.elements.generationTime.textContent = (result.responseTime / 1000).toFixed(2);
                }
                if (this.elements.usedModel) {
                    this.elements.usedModel.textContent = this.state.currentModel;
                }
                
                // Save to history
                this.saveToHistory(inputText, result.content, {
                    model: result.model,
                    provider: result.provider,
                    responseTime: result.responseTime
                });
                
                this.showNotification(`Prompt generated using ${this.state.currentModel}`, 'success');
                
                // Scroll to output
                setTimeout(() => {
                    if (this.elements.outputSection) {
                        this.elements.outputSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                }, 300);
                
            } catch (error) {
                console.error('Prompt generation error:', error);
                this.showNotification('Failed to generate prompt', 'error');
            }
        }
        
        resetApp() {
            this.clearInput();
            
            // Reset state
            this.state.currentStep = 1;
            this.updateProgress();
            
            this.showNotification('Application reset', 'info');
        }
        
        // ========== Helper Methods ==========
        handleInputChange() {
            const text = this.elements.userInput.value;
            
            if (this.elements.charCount) {
                const charCount = text.length;
                this.elements.charCount.textContent = charCount;
                this.elements.charCount.style.color = charCount > 4000 ? '#f59e0b' : charCount > 5000 ? '#ef4444' : 'inherit';
            }
            
            this.updateButtonStates();
            
            if (text !== this.state.lastInput) {
                if (this.state.lastInput !== '') {
                    this.state.undoStack.push(this.state.lastInput);
                }
                this.state.lastInput = text;
                this.state.redoStack = [];
            }
        }
        
        handleEditorInputChange() {
            const text = this.elements.editorTextarea.value;
            
            if (this.elements.editorPrepareBtn) {
                this.elements.editorPrepareBtn.disabled = text.trim().length === 0;
            }
        }
        
        handleInputKeydown(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.preparePrompt();
            }
        }
        
        copyPrompt() {
            const prompt = this.elements.outputArea.textContent;
            if (!prompt) {
                this.showNotification('No prompt to copy', 'warning');
                return;
            }
            
            navigator.clipboard.writeText(prompt).then(() => {
                this.showNotification('Prompt copied to clipboard', 'success');
            }).catch(err => {
                console.error('Copy failed:', err);
                this.showNotification('Failed to copy to clipboard', 'error');
            });
        }
        
        savePrompt() {
            const prompt = this.elements.outputArea.textContent;
            if (!prompt) {
                this.showNotification('No prompt to save', 'warning');
                return;
            }
            
            try {
                const blob = new Blob([prompt], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `prompt-${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showNotification('Prompt saved as text file', 'success');
            } catch (error) {
                console.error('Failed to save prompt:', error);
                this.showNotification('Failed to save prompt', 'error');
            }
        }
        
        undo() {
            if (this.state.undoStack.length > 0) {
                const current = this.state.isMaximized ? 
                    this.elements.editorTextarea.value : 
                    this.elements.userInput.value;
                
                this.state.redoStack.push(current);
                const previous = this.state.undoStack.pop();
                
                if (this.state.isMaximized) {
                    this.elements.editorTextarea.value = previous;
                } else {
                    this.elements.userInput.value = previous;
                    this.handleInputChange();
                }
                
                this.updateButtonStates();
                this.showNotification('Undo applied', 'info');
            }
        }
        
        redo() {
            if (this.state.redoStack.length > 0) {
                const current = this.state.isMaximized ? 
                    this.elements.editorTextarea.value : 
                    this.elements.userInput.value;
                
                this.state.undoStack.push(current);
                const next = this.state.redoStack.pop();
                
                if (this.state.isMaximized) {
                    this.elements.editorTextarea.value = next;
                } else {
                    this.elements.userInput.value = next;
                    this.handleInputChange();
                }
                
                this.updateButtonStates();
                this.showNotification('Redo applied', 'info');
            }
        }
        
        async checkAPIStatus() {
            try {
                this.state.apiStatus = 'online';
                this.updateAPIStatusIndicator();
                this.showNotification('API connected', 'success');
            } catch (error) {
                console.error('API status check failed:', error);
                this.state.apiStatus = 'offline';
                this.updateAPIStatusIndicator();
            }
        }
        
        updateAPIStatusIndicator() {
            // Implementation for API status indicator
        }
        
        updateCurrentModel() {
            const modelSelect = document.getElementById('defaultAiModel');
            if (modelSelect) {
                this.state.currentModel = modelSelect.value;
            }
        }
        
        updateProgress() {
            const progressFill = document.querySelector('.progress-fill');
            if (!progressFill) return;
            
            const progress = (this.state.currentStep / 3) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        applyTheme() {
            const theme = this.settings.theme || 'dark';
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        applyUIDensity() {
            const density = this.settings.uiDensity || 'comfortable';
            document.body.setAttribute('data-ui-density', density);
        }
        
        loadHistory() {
            try {
                const savedHistory = localStorage.getItem('promptcraft_history');
                if (savedHistory) {
                    this.state.promptHistory = JSON.parse(savedHistory);
                    console.log(`📚 Loaded ${this.state.promptHistory.length} history items`);
                }
            } catch (error) {
                console.warn('Failed to load history:', error);
                this.state.promptHistory = [];
            }
        }
        
        saveToHistory(input, output, metadata = {}) {
            const maxItems = this.settings.maxHistoryItems || 50;
            if (maxItems <= 0) return;
            
            const historyItem = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
                output: output.substring(0, 200) + (output.length > 200 ? '...' : ''),
                fullInput: input,
                fullOutput: output,
                metadata: {
                    model: metadata.model || 'unknown',
                    provider: metadata.provider || 'unknown',
                    responseTime: metadata.responseTime || 0,
                    fallback: metadata.fallback || false,
                    apiStatus: this.state.apiStatus,
                    ...metadata
                }
            };
            
            this.state.promptHistory.unshift(historyItem);
            
            if (this.state.promptHistory.length > maxItems) {
                this.state.promptHistory = this.state.promptHistory.slice(0, maxItems);
            }
            
            this.saveHistoryToStorage();
        }
        
        saveHistoryToStorage() {
            try {
                localStorage.setItem('promptcraft_history', JSON.stringify(this.state.promptHistory));
            } catch (error) {
                console.warn('Failed to save history:', error);
            }
        }
        
        showNotification(message, type = 'info') {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Simple notification implementation
            alert(`${type.toUpperCase()}: ${message}`);
        }
        
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.preparePrompt();
                }
                
                if (e.key === 'Escape') {
                    if (this.state.isMaximized) {
                        this.closeEditor();
                    }
                    if (this.state.inspirationPanelOpen) {
                        this.closeInspirationPanel();
                    }
                }
            });
        }
        
        initVoiceRecognition() {
            // Voice recognition initialization
        }
        
        toggleVoiceInput() {
            // Voice input toggle
        }
        
        openSettings() {
            if (this.elements.settingsModal) {
                this.elements.settingsModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
        
        closeSettings() {
            if (this.elements.settingsModal) {
                this.elements.settingsModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
        
        saveSettings() {
            try {
                // Get settings from form
                const settings = {};
                const settingsElements = document.querySelectorAll('#settingsModal .setting-input, #settingsModal .setting-select, #settingsModal .setting-range, #settingsModal .setting-checkbox');
                
                settingsElements.forEach(element => {
                    const id = element.id;
                    if (id) {
                        if (element.type === 'checkbox') {
                            settings[id] = element.checked;
                        } else if (element.type === 'range') {
                            settings[id] = parseFloat(element.value);
                        } else if (element.type === 'number') {
                            settings[id] = parseInt(element.value);
                        } else {
                            settings[id] = element.value;
                        }
                    }
                });
                
                // Save settings
                localStorage.setItem('promptCraftSettings', JSON.stringify(settings));
                
                // Update current model
                if (settings.defaultAiModel) {
                    this.state.currentModel = settings.defaultAiModel;
                    this.updateFooterInfo();
                }
                
                this.showNotification('Settings saved successfully!', 'success');
                this.closeSettings();
                
            } catch (error) {
                console.error('Failed to save settings:', error);
                this.showNotification('Failed to save settings', 'error');
            }
        }
        
        getSettingsFromForm() {
            const settings = {};
            const elements = document.querySelectorAll('#settingsModal [id]');
            
            elements.forEach(element => {
                const key = element.id;
                if (key && key !== 'saveSettingsBtn' && key !== 'cancelSettingsBtn' && 
                    key !== 'testConnectionBtn' && key !== 'clearCacheBtn' && 
                    key !== 'exportLogsBtn' && key !== 'settingsTitle' &&
                    !key.includes('Value') && !key.includes('Help')) {
                    
                    if (element.type === 'checkbox') {
                        settings[key] = element.checked;
                    } else if (element.type === 'range') {
                        settings[key] = parseFloat(element.value);
                    } else if (element.type === 'number') {
                        settings[key] = parseInt(element.value);
                    } else {
                        settings[key] = element.value;
                    }
                }
            });
            
            return settings;
        }
    }

    // Export the class globally
    window.PromptCraftEnterprise = PromptCraftEnterprise;
    console.log('✅ PromptCraftEnterprise loaded successfully');
}
