// Combined app for immediate deployment
(function() {
    'use strict';
    
    // Simple debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Storage service
    class StorageService {
        constructor() {
            this.prefix = 'promptcraft_';
        }
        
        set(key, value) {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
        }
        
        get(key, defaultValue = null) {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        }
    }
    
    // API Service
    class APIService {
        constructor() {
            this.config = {
                WORKER_URL: "https://promptcraft-api.vijay-shagunkumar.workers.dev",
                API_KEY_HEADER: "x-api-key",
                DEFAULT_API_KEY: "promptcraft-app-secret-123"
            };
        }
        
        async generatePrompt(prompt) {
            try {
                const response = await fetch(this.config.WORKER_URL, {
                    method: 'POST',
                    headers: { 
                        "Content-Type": "application/json",
                        [this.config.API_KEY_HEADER]: this.config.DEFAULT_API_KEY
                    },
                    body: JSON.stringify({ 
                        prompt: prompt,
                        model: "gemini-1.5-flash"
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return {
                        prompt: data.result || "",
                        success: true
                    };
                }
            } catch (error) {
                console.error('API Error:', error);
            }
            
            return {
                prompt: "",
                success: false,
                error: "Failed to generate prompt"
            };
        }
    }
    
    // Main App
    class PromptCraftApp {
        constructor() {
            this.storage = new StorageService();
            this.api = new APIService();
            this.init();
        }
        
        init() {
            this.bindEvents();
            console.log('PromptCraft Pro initialized');
        }
        
        bindEvents() {
            const prepareBtn = document.getElementById('stickyPrepareBtn');
            if (prepareBtn) {
                prepareBtn.addEventListener('click', () => this.preparePrompt());
            }
            
            const copyBtn = document.getElementById('copyBtn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => this.copyPrompt());
            }
            
            const resetBtn = document.getElementById('stickyResetBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.resetApp());
            }
        }
        
        async preparePrompt() {
            const input = document.getElementById('userInput');
            const output = document.getElementById('outputArea');
            const outputSection = document.getElementById('outputSection');
            
            if (!input || !input.value.trim()) {
                this.showNotification('Please enter a task description', 'error');
                return;
            }
            
            // Show loading
            const prepareBtn = document.getElementById('stickyPrepareBtn');
            const originalText = prepareBtn.innerHTML;
            prepareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            prepareBtn.disabled = true;
            
            try {
                const result = await this.api.generatePrompt(input.value);
                
                if (result.success) {
                    output.textContent = result.prompt;
                    outputSection.classList.add('visible');
                    this.showNotification('Prompt generated successfully!', 'success');
                    
                    // Show reset button
                    const resetBtn = document.getElementById('stickyResetBtn');
                    if (resetBtn) resetBtn.classList.remove('hidden');
                    
                    // Hide prepare button
                    if (prepareBtn) prepareBtn.classList.add('removed');
                } else {
                    this.showNotification(result.error || 'Failed to generate prompt', 'error');
                }
            } catch (error) {
                this.showNotification('An error occurred', 'error');
            } finally {
                // Restore button
                if (prepareBtn) {
                    prepareBtn.innerHTML = originalText;
                    prepareBtn.disabled = false;
                }
            }
        }
        
        copyPrompt() {
            const output = document.getElementById('outputArea');
            if (!output || !output.textContent.trim()) {
                this.showNotification('No prompt to copy', 'error');
                return;
            }
            
            navigator.clipboard.writeText(output.textContent)
                .then(() => this.showNotification('Copied to clipboard!', 'success'))
                .catch(() => this.showNotification('Failed to copy', 'error'));
        }
        
        resetApp() {
            const input = document.getElementById('userInput');
            const output = document.getElementById('outputArea');
            const outputSection = document.getElementById('outputSection');
            const prepareBtn = document.getElementById('stickyPrepareBtn');
            const resetBtn = document.getElementById('stickyResetBtn');
            
            if (input) input.value = '';
            if (output) output.textContent = output.dataset.placeholder || '';
            if (outputSection) outputSection.classList.remove('visible');
            if (prepareBtn) {
                prepareBtn.classList.remove('removed');
                prepareBtn.disabled = false;
            }
            if (resetBtn) resetBtn.classList.add('hidden');
            
            this.showNotification('App reset', 'info');
        }
        
        showNotification(message, type = 'info') {
            const container = document.getElementById('notificationContainer');
            if (!container) {
                console.log(`${type}: ${message}`);
                return;
            }
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <i class="notification-icon fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
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
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new PromptCraftApp();
    });
    
})();
