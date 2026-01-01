// loader.js - Load all scripts in correct order
(function() {
    'use strict';
    
    const scripts = [
        // Utils first
        'js/utils/constants.js',
        'js/utils/helpers.js',
        'js/utils/debounce.js',
        
        // Services
        'js/services/storage-service.js',
        'js/services/settings-service.js',
        'js/services/notification-service.js',
        'js/services/api-service.js',
        
        // Core
        'js/core/state.js',
        'js/core/app.js'
    ];
    
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.async = false; // Load sequentially
        script.onload = function() {
            console.log('Loaded:', src);
            callback();
        };
        script.onerror = function() {
            console.error('Failed to load script:', src);
            callback();
        };
        document.head.appendChild(script);
    }
    
    function loadScriptsSequentially(index) {
        if (index >= scripts.length) {
            console.log('All scripts loaded successfully');
            
            // Check if all required classes are available
            const requiredClasses = [
                'AppState', 'NotificationService', 
                'StorageService', 'SettingsService', 'ApiService',
                'PromptCraftApp'
            ];
            
            const missingClasses = requiredClasses.filter(cls => !window[cls]);
            if (missingClasses.length > 0) {
                console.warn('Missing classes after loading:', missingClasses);
            }
            
            // Initialize app if available
            if (typeof window.PromptCraftApp !== 'undefined') {
                console.log('Initializing PromptCraftApp...');
                try {
                    window.app = new window.PromptCraftApp();
                    console.log('PromptCraftApp initialized successfully');
                } catch (error) {
                    console.error('Failed to initialize PromptCraftApp:', error);
                }
            } else {
                console.error('PromptCraftApp not found in global scope');
            }
            
            return;
        }
        
        loadScript(scripts[index], function() {
            loadScriptsSequentially(index + 1);
        });
    }
    
    // Start loading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, starting script loading...');
            loadScriptsSequentially(0);
        });
    } else {
        console.log('DOM already loaded, starting script loading...');
        loadScriptsSequentially(0);
    }
})();
