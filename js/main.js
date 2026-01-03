/**
 * Main entry point for PromptCraft Pro
 * Initializes all services and starts the application
 */

console.log('=== PromptCraft Pro Main ===');

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    console.error('At:', e.filename, 'Line:', e.lineno);
    
    // Show user-friendly error message
    if (window.showNotification) {
        showNotification(
            'Application error occurred. Please refresh the page.',
            'error',
            5000
        );
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});

// Initialize services when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing services...');
    
    try {
        // Initialize API Service
        if (window.APIService) {
            console.log('Creating APIService instance...');
            window.apiService = new APIService();
            console.log('✓ APIService initialized');
        } else {
            console.error('✗ APIService class not found!');
            // Create fallback
            window.apiService = {
                generatePrompt: async function() {
                    throw new Error('API service not available');
                },
                checkHealth: async function() {
                    return { online: false, message: 'Service unavailable' };
                }
            };
        }
        
        // Initialize Speech Service
        if (window.SpeechService) {
            console.log('Creating SpeechService instance...');
            window.speechService = new SpeechService();
            console.log('✓ SpeechService initialized');
        } else if (window.speechService) {
            console.log('✓ SpeechService already exists');
        } else {
            console.warn('⚠ SpeechService not found, creating fallback');
            window.speechService = {
                startListening: function() {
                    console.log('Speech input not available');
                    return false;
                },
                stopListening: function() {
                    console.log('Speech input stopped');
                },
                speak: function(text) {
                    console.log('Speech output:', text.substring(0, 50) + '...');
                    return false;
                },
                isAvailable: function() {
                    return false;
                }
            };
        }
        
        // Initialize Platforms
        if (window.Platforms) {
            console.log('Creating Platforms instance...');
            window.platforms = new Platforms();
            console.log('✓ Platforms initialized');
        } else if (window.platforms) {
            console.log('✓ Platforms already exists');
        } else {
            console.warn('⚠ Platforms not found, creating fallback');
            window.platforms = {
                openPlatform: function(platformId, prompt) {
                    console.log(`Opening ${platformId} with prompt`);
                    
                    // Create platform URLs
                    const platformUrls = {
                        gemini: 'https://gemini.google.com/',
                        chatgpt: 'https://chat.openai.com/',
                        claude: 'https://claude.ai/',
                        perplexity: 'https://www.perplexity.ai/',
                        deepseek: 'https://chat.deepseek.com/',
                        copilot: 'https://copilot.microsoft.com/',
                        grok: 'https://grok.x.ai/'
                    };
                    
                    if (platformUrls[platformId]) {
                        window.open(platformUrls[platformId], '_blank');
                        return true;
                    }
                    
                    return false;
                },
                getPlatformInfo: function(platformId) {
                    return {
                        name: platformId,
                        url: '#',
                        supported: false
                    };
                }
            };
        }
        
        // Initialize Theme Manager
        if (window.themeManager) {
            console.log('✓ ThemeManager already exists');
        } else {
            console.warn('⚠ ThemeManager not found, creating fallback');
            window.themeManager = {
                themes: ['light', 'dark', 'auto'],
                currentTheme: 'auto',
                
                init: function() {
                    try {
                        const saved = localStorage.getItem('promptcraft_theme');
                        if (saved && this.themes.includes(saved)) {
                            this.currentTheme = saved;
                        }
                    } catch (error) {
                        console.warn('Failed to load theme:', error);
                    }
                    this.applyTheme();
                },
                
                applyTheme: function() {
                    let themeToApply = this.currentTheme;
                    
                    if (themeToApply === 'auto') {
                        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                            themeToApply = 'dark';
                        } else {
                            themeToApply = 'light';
                        }
                    }
                    
                    document.documentElement.setAttribute('data-theme', themeToApply);
                },
                
                setTheme: function(theme) {
                    if (this.themes.includes(theme)) {
                        this.currentTheme = theme;
                        try {
                            localStorage.setItem('promptcraft_theme', theme);
                        } catch (error) {
                            console.warn('Failed to save theme:', error);
                        }
                        this.applyTheme();
                        return true;
                    }
                    return false;
                },
                
                getTheme: function() {
                    return this.currentTheme;
                },
                
                toggleTheme: function() {
                    if (this.currentTheme === 'auto') {
                        const systemPrefersDark = window.matchMedia && 
                            window.matchMedia('(prefers-color-scheme: dark)').matches;
                        this.setTheme(systemPrefersDark ? 'light' : 'dark');
                    } else {
                        this.setTheme(this.currentTheme === 'dark' ? 'light' : 'dark');
                    }
                }
            };
        }
        
        // Initialize Theme
        window.themeManager.init();
        console.log('✓ Theme initialized');
        
        // Check if all required services are available
        const servicesReady = window.apiService && window.speechService && window.platforms;
        
        if (!servicesReady) {
            console.error('⚠ Some services failed to initialize');
            if (window.showNotification) {
                showNotification(
                    'Some features may not work properly. Please refresh.',
                    'warning',
                    5000
                );
            }
        }
        
        console.log('All services initialized, starting app...');
        
        // Start the main application
        setTimeout(function() {
            if (window.PromptCraftApp) {
                try {
                    window.app = new PromptCraftApp();
                    console.log('🎉 PromptCraft Pro started successfully!');
                    
                    // Show welcome message
                    if (window.showNotification) {
                        showNotification(
                            'Welcome to PromptCraft Pro! Ready to generate prompts.',
                            'success',
                            3000
                        );
                    }
                    
                } catch (error) {
                    console.error('Failed to start app:', error);
                    
                    if (window.showNotification) {
                        showNotification(
                            'Failed to start application: ' + error.message,
                            'error',
                            8000
                        );
                    }
                    
                    // Try fallback mode
                    startFallbackMode();
                }
            } else {
                console.error('PromptCraftApp class not found!');
                startFallbackMode();
            }
        }, 500);
        
    } catch (error) {
        console.error('Failed to initialize services:', error);
        
        if (window.showNotification) {
            showNotification(
                'Failed to initialize: ' + error.message,
                'error',
                8000
            );
        }
        
        startFallbackMode();
    }
});

// Fallback mode for when initialization fails
function startFallbackMode() {
    console.log('Starting in fallback mode...');
    
    // Basic UI initialization
    const generateBtn = document.getElementById('generateBtn');
    const userInput = document.getElementById('userInput');
    const outputArea = document.getElementById('outputArea');
    
    if (generateBtn && userInput && outputArea) {
        generateBtn.addEventListener('click', function() {
            const input = userInput.value.trim();
            if (!input) {
                alert('Please enter a task description');
                return;
            }
            
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            // Simple fallback prompt generation
            setTimeout(function() {
                const fallbackPrompt = `Fallback Prompt (API unavailable):

Role: AI Assistant
Objective: ${input}
Context: Generating this prompt offline due to API unavailability
Instructions:
1. Analyze the user's request
2. Break it down into clear steps
3. Provide detailed guidance
4. Include examples if applicable

Notes: This is a fallback prompt. For better results, ensure API is connected.`;
                
                outputArea.textContent = fallbackPrompt;
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Prompt';
                
                // Show step 2
                document.querySelector('.step-2').style.display = 'block';
                document.querySelector('.step-3').style.display = 'block';
                
                alert('Generated with fallback (API offline)');
            }, 1000);
        });
        
        console.log('✓ Fallback mode activated');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {};
}

console.log('=== Main script loaded ===');
