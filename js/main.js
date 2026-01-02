/**
 * Main initialization for PromptCraft Pro
 */

// Define the initialization function
function initializeApp() {
    try {
        console.log('🚀 Initializing PromptCraft Pro...');
        
        // Make sure PromptCraftEnterprise exists
        if (typeof PromptCraftEnterprise === 'undefined') {
            console.error('❌ PromptCraftEnterprise class not found');
            
            // Check if we can load it from the global scope
            if (window.PromptCraftEnterprise) {
                console.log('✅ Found PromptCraftEnterprise in window scope');
            } else {
                console.error('❌ PromptCraftEnterprise not found anywhere');
                throw new Error('PromptCraftEnterprise class not loaded. Check script loading order.');
            }
        }
        
        // Create and initialize the application
        window.promptCraft = new PromptCraftEnterprise();
        
        // Initialize the app
        if (typeof window.promptCraft.initialize === 'function') {
            window.promptCraft.initialize();
        }
        
        // Add global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            if (window.promptCraft && typeof window.promptCraft.showNotification === 'function') {
                window.promptCraft.showNotification('An unexpected error occurred', 'error');
            }
        });
        
        // Add unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            if (window.promptCraft && typeof window.promptCraft.showNotification === 'function') {
                window.promptCraft.showNotification('An unexpected error occurred', 'error');
            }
        });
        
        // Check for development mode using URL or localStorage
        const isDevMode = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         localStorage.getItem('debugMode') === 'true';
        
        // Make services globally available for debugging in dev mode
        if (isDevMode) {
            window.PromptCraft = window.promptCraft;
            console.log('📢 PromptCraft available as window.PromptCraft for debugging');
            console.log('🔧 Development mode enabled');
        }
        
        console.log('✅ PromptCraft Pro initialized successfully');
        return window.promptCraft;
        
    } catch (error) {
        console.error('❌ Failed to initialize PromptCraft Pro:', error);
        
        // Show error to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #dc2626, #7c2d12);
            color: white;
            padding: 1rem;
            text-align: center;
            z-index: 9999;
            font-family: var(--font-sans, sans-serif);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        `;
        
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>Application Error:</strong> Failed to initialize. 
                <br><small>${error.message}</small>
            </div>
            <button onclick="location.reload()" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                margin-left: 10px;
                font-size: 12px;
            ">
                Reload Page
            </button>
        `;
        
        document.body.appendChild(errorDiv);
        throw error;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for all scripts to load
    setTimeout(() => {
        initializeApp();
    }, 100);
});

// Make the function globally available
window.initializeApp = initializeApp;

// Export for module usage
export { initializeApp };
