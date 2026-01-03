/**
 * Main initialization script
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 PromptCraft Pro Initializing...');
    
    // Check for required APIs
    if (!window.fetch) {
        alert('Your browser does not support fetch API. Please use a modern browser.');
        return;
    }
    
    try {
        // Initialize notification system first
        if (!window.notifications) {
            console.error('Notification system not loaded');
        }
        
        // Check for dependencies
        const requiredDeps = ['Config', 'Utils', 'apiService', 'speechService', 'platforms', 'themeManager'];
        const missingDeps = requiredDeps.filter(dep => !window[dep]);
        
        if (missingDeps.length > 0) {
            console.error('Missing dependencies:', missingDeps);
            showNotification('Failed to load required components. Please refresh.', 'error');
            return;
        }
        
        // Initialize theme
        themeManager.applyTheme();
        
        // Setup speech service error handling
        if (!speechService.isRecognitionAvailable()) {
            console.warn('Speech recognition not available');
            const voiceBtn = document.getElementById('voiceInputBtn');
            if (voiceBtn) {
                voiceBtn.disabled = true;
                voiceBtn.title = 'Voice input not supported';
            }
        }
        
        if (!speechService.isSynthesisAvailable()) {
            console.warn('Speech synthesis not available');
            const speakBtns = document.querySelectorAll('.speak-btn');
            speakBtns.forEach(btn => {
                btn.disabled = true;
                btn.title = 'Text-to-speech not supported';
            });
        }
        
        // Initialize app
        if (window.PromptCraftApp) {
            window.app = new PromptCraftApp();
            console.log('✅ PromptCraft Pro initialized successfully');
            
            // Show welcome notification
            setTimeout(() => {
                showNotification('Welcome to PromptCraft Pro! Enter your task and click Generate.', 'info', 5000);
            }, 1000);
            
        } else {
            throw new Error('PromptCraftApp class not found');
        }
        
    } catch (error) {
        console.error('❌ Failed to initialize PromptCraft Pro:', error);
        
        // Show error to user
        const errorHtml = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #ef4444, #7f1d1d);
                color: white;
                padding: 16px;
                text-align: center;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            ">
                <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 20px;"></i>
                    <div>
                        <strong>Initialization Error:</strong> ${error.message}
                        <br><small>Check browser console for details</small>
                    </div>
                    <button onclick="location.reload()" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: white;
                        padding: 6px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        margin-left: 16px;
                        font-size: 14px;
                    ">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
        
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = errorHtml;
        document.body.prepend(errorDiv.firstElementChild);
    }
});

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    if (window.showNotification) {
        showNotification('An unexpected error occurred', 'error');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.showNotification) {
        showNotification('An unexpected error occurred', 'error');
    }
});

// Make showNotification globally available if notifications failed
if (!window.showNotification) {
    window.showNotification = function(message, type = 'info', duration = 3000) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Simple fallback using console
    };
}

// Export to global scope for debugging
window.PromptCraft = {
    version: Config.FRONTEND.VERSION,
    api: apiService,
    speech: speechService,
    platforms: platforms,
    theme: themeManager,
    utils: Utils,
    config: Config
};
