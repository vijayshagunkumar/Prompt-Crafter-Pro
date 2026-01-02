/**
 * PromptCraft Quick Fixes - Minimal fixes for specific issues
 * Add this file AFTER PromptCraftEnterprise.js in your HTML
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Applying quick fixes...');
    
    // Wait for main app to initialize
    setTimeout(applyFixes, 1000);
});

function applyFixes() {
    // Get the app instance
    const app = window.promptCraftApp || window.app;
    
    if (!app) {
        console.warn('App not found, trying to access directly...');
        applyDirectFixes();
        return;
    }
    
    applyAppFixes(app);
}

function applyDirectFixes() {
    console.log('Applying direct fixes...');
    
    // ========== FIX 1 & 11: Clear Button ==========
    const clearBtn = document.getElementById('clearInputBtn');
    if (clearBtn) {
        clearBtn.onclick = function() {
            console.log('Clear button clicked');
            
            // Clear input
            const userInput = document.getElementById('userInput');
            if (userInput) userInput.value = '';
            
            // Clear output (Issue 11)
            const outputArea = document.getElementById('outputArea');
            if (outputArea) outputArea.textContent = '';
            
            // Update char counter
            const charCount = document.getElementById('charCount');
            if (charCount) charCount.textContent = '0';
            
            // Hide output section
            const outputSection = document.getElementById('outputSection');
            if (outputSection) outputSection.style.display = 'none';
            
            // Hide reset button, show prepare button
            const prepareBtn = document.getElementById('preparePromptBtn');
            const resetBtn = document.getElementById('resetAllBtn');
            if (prepareBtn && resetBtn) {
                prepareBtn.classList.remove('hidden');
                prepareBtn.classList.add('visible');
                resetBtn.classList.remove('visible');
                resetBtn.classList.add('hidden');
            }
            
            console.log('Cleared input and output');
        };
    }
    
    // ========== FIX 2 & 10: Maximize Buttons ==========
    const maximizeBtn = document.getElementById('maximizeBtn');
    const maximizeOutputBtn = document.getElementById('maximizeOutputBtn');
    
    if (maximizeBtn) {
        maximizeBtn.onclick = function() {
            const fullScreenEditor = document.getElementById('fullScreenEditor');
            const editorTextarea = document.getElementById('editorTextarea');
            const userInput = document.getElementById('userInput');
            
            if (fullScreenEditor && editorTextarea && userInput) {
                editorTextarea.value = userInput.value;
                fullScreenEditor.style.display = 'flex';
                fullScreenEditor.classList.add('active');
            }
        };
    }
    
    if (maximizeOutputBtn) {
        maximizeOutputBtn.onclick = function() {
            const fullScreenEditor = document.getElementById('fullScreenEditor');
            const editorTextarea = document.getElementById('editorTextarea');
            const outputArea = document.getElementById('outputArea');
            
            if (fullScreenEditor && editorTextarea && outputArea) {
                editorTextarea.value = outputArea.textContent;
                fullScreenEditor.style.display = 'flex';
                fullScreenEditor.classList.add('active');
            }
        };
    }
    
    // ========== FIX 4: Speaker Buttons ==========
    const speakInputBtn = document.getElementById('speakInputBtn');
    const speakOutputBtn = document.getElementById('speakOutputBtn');
    
    if (speakInputBtn) {
        speakInputBtn.onclick = function() {
            const userInput = document.getElementById('userInput');
            if (userInput && userInput.value.trim()) {
                // Simple speech - no confirmation dialogs
                const utterance = new SpeechSynthesisUtterance(userInput.value);
                speechSynthesis.speak(utterance);
            }
        };
    }
    
    if (speakOutputBtn) {
        speakOutputBtn.onclick = function() {
            const outputArea = document.getElementById('outputArea');
            if (outputArea && outputArea.textContent.trim()) {
                const utterance = new SpeechSynthesisUtterance(outputArea.textContent);
                speechSynthesis.speak(utterance);
            }
        };
    }
    
    // ========== FIX 5: Platform Links ==========
    const platformCards = document.querySelectorAll('.platform-card');
    platformCards.forEach(card => {
        card.onclick = function(e) {
            e.preventDefault();
            const platform = this.getAttribute('data-platform');
            const outputArea = document.getElementById('outputArea');
            
            if (outputArea && outputArea.textContent.trim()) {
                // Copy to clipboard
                navigator.clipboard.writeText(outputArea.textContent)
                    .then(() => {
                        console.log('Prompt copied for platform:', platform);
                        
                        // Open platform WITHOUT confirmation
                        const urls = {
                            'gemini': 'https://gemini.google.com/app',
                            'chatgpt': 'https://chat.openai.com',
                            'claude': 'https://claude.ai/new',
                            'perplexity': 'https://www.perplexity.ai',
                            'deepseek': 'https://chat.deepseek.com',
                            'copilot': 'https://copilot.microsoft.com',
                            'grok': 'https://grok.x.ai'
                        };
                        
                        if (urls[platform]) {
                            window.open(urls[platform], '_blank');
                        }
                    })
                    .catch(err => {
                        console.error('Copy failed:', err);
                    });
            }
        };
    });
    
    // ========== FIX 6: Inspiration Button ==========
    const inspirationBtn = document.getElementById('needInspirationBtn');
    const inspirationPanel = document.getElementById('inspirationPanel');
    const closeInspirationBtn = document.getElementById('closeInspirationBtn');
    
    if (inspirationBtn && inspirationPanel) {
        inspirationBtn.onclick = function() {
            if (inspirationPanel.style.display === 'block') {
                inspirationPanel.style.display = 'none';
            } else {
                inspirationPanel.style.display = 'block';
            }
        };
    }
    
    if (closeInspirationBtn && inspirationPanel) {
        closeInspirationBtn.onclick = function() {
            inspirationPanel.style.display = 'none';
        };
    }
    
    // ========== FIX 7: Footer Model Display ==========
    updateFooterModel();
    
    // ========== FIX 8: Remove Duplicate Button ==========
    const duplicateBtn = document.querySelector('.sticky-btn');
    if (duplicateBtn && duplicateBtn.id === 'stickyPrepareBtn') {
        duplicateBtn.remove();
        console.log('Removed duplicate Prepare Prompt button');
    }
    
    // ========== FIX 9: Prepare/Reset Toggle ==========
    const prepareBtn = document.getElementById('preparePromptBtn');
    const resetBtn = document.getElementById('resetAllBtn');
    
    if (prepareBtn && resetBtn) {
        // Initially hide reset button
        resetBtn.classList.add('hidden');
        prepareBtn.classList.add('visible');
        
        // Listen for prompt generation
        const originalPrepare = prepareBtn.onclick;
        if (originalPrepare) {
            prepareBtn.onclick = function() {
                // Call original function
                if (typeof originalPrepare === 'function') {
                    originalPrepare();
                }
                
                // After generation, show reset button
                setTimeout(() => {
                    const outputArea = document.getElementById('outputArea');
                    if (outputArea && outputArea.textContent.trim()) {
                        prepareBtn.classList.remove('visible');
                        prepareBtn.classList.add('hidden');
                        resetBtn.classList.remove('hidden');
                        resetBtn.classList.add('visible');
                    }
                }, 500);
            };
        }
        
        // Reset button functionality
        resetBtn.onclick = function() {
            // Clear everything
            const clearBtn = document.getElementById('clearInputBtn');
            if (clearBtn) clearBtn.click();
            
            // Switch back to prepare button
            prepareBtn.classList.remove('hidden');
            prepareBtn.classList.add('visible');
            resetBtn.classList.remove('visible');
            resetBtn.classList.add('hidden');
        };
    }
    
    console.log('✅ All quick fixes applied');
}

function updateFooterModel() {
    const footerModel = document.getElementById('footerModelName');
    if (!footerModel) return;
    
    // Get current model from settings or default
    const modelSelect = document.getElementById('defaultAiModel');
    if (modelSelect) {
        const modelMap = {
            'gemini-3-flash-preview': 'Gemini 3 Flash',
            'gpt-4o-mini': 'GPT-4o Mini',
            'llama-3.1-8b-instant': 'Llama 3.1'
        };
        
        footerModel.textContent = modelMap[modelSelect.value] || 'Gemini 3 Flash';
        
        // Update when model changes
        modelSelect.addEventListener('change', function() {
            footerModel.textContent = modelMap[this.value] || 'Gemini 3 Flash';
        });
    } else {
        footerModel.textContent = 'Gemini 3 Flash';
    }
}

function applyAppFixes(app) {
    console.log('Applying fixes to app instance...');
    
    // Override specific methods
    if (app.clearInput) {
        const originalClearInput = app.clearInput.bind(app);
        app.clearInput = function() {
            console.log('Fixed clearInput called');
            
            // Clear output area too
            if (app.elements && app.elements.outputArea) {
                app.elements.outputArea.textContent = '';
            }
            
            // Call original
            originalClearInput();
        };
    }
    
    // Add maximize output if missing
    if (!app.maximizeOutputBtn && document.getElementById('maximizeOutputBtn')) {
        app.elements = app.elements || {};
        app.elements.maximizeOutputBtn = document.getElementById('maximizeOutputBtn');
        
        if (app.elements.maximizeOutputBtn && app.maximizeSection) {
            app.elements.maximizeOutputBtn.addEventListener('click', () => {
                app.maximizeSection('output');
            });
        }
    }
}
