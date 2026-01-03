/**
 * AI Platforms Management
 */

class Platforms {
    constructor() {
        this.platforms = {
            gemini: {
                id: 'gemini',
                name: 'Google Gemini',
                description: 'Advanced reasoning with Google\'s AI',
                icon: 'fab fa-google',
                color: '#4285F4',
                url: 'https://gemini.google.com/app',
                apiUrl: 'https://generativelanguage.googleapis.com',
                recommended: true,
                tags: ['Free', 'Advanced']
            },
            chatgpt: {
                id: 'chatgpt',
                name: 'OpenAI ChatGPT',
                description: 'Most popular AI assistant',
                icon: 'fab fa-openai',
                color: '#10A37F',
                url: 'https://chat.openai.com',
                apiUrl: 'https://api.openai.com',
                tags: ['Freemium', 'Versatile']
            },
            claude: {
                id: 'claude',
                name: 'Anthropic Claude',
                description: 'Safety-focused, long context',
                icon: 'fas fa-brain',
                color: '#D3A3F9',
                url: 'https://claude.ai/new',
                apiUrl: 'https://api.anthropic.com',
                tags: ['Freemium', 'Safe']
            },
            perplexity: {
                id: 'perplexity',
                name: 'Perplexity AI',
                description: 'Real-time web search AI',
                icon: 'fas fa-search',
                color: '#000000',
                url: 'https://www.perplexity.ai/search',
                apiUrl: 'https://api.perplexity.ai',
                tags: ['Freemium', 'Web Search']
            },
            deepseek: {
                id: 'deepseek',
                name: 'DeepSeek',
                description: 'Free, powerful open model',
                icon: 'fas fa-rocket',
                color: '#2D5BFF',
                url: 'https://chat.deepseek.com',
                apiUrl: 'https://api.deepseek.com',
                tags: ['Free', 'Open Source']
            },
            copilot: {
                id: 'copilot',
                name: 'Microsoft Copilot',
                description: 'Integrated with Microsoft 365',
                icon: 'fab fa-microsoft',
                color: '#0078D4',
                url: 'https://copilot.microsoft.com',
                apiUrl: 'https://api.copilot.microsoft.com',
                tags: ['Freemium', 'Integrated']
            },
            grok: {
                id: 'grok',
                name: 'Grok AI',
                description: 'X\'s AI with real-time data',
                icon: 'fas fa-bolt',
                color: '#FF6B35',
                url: 'https://grok.x.ai',
                apiUrl: 'https://api.x.ai',
                tags: ['Premium', 'Real-time']
            }
        };
        
        this.selectedPlatform = 'gemini';
        this.loadSettings();
    }
    
    /**
     * Load settings from storage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(Config.getStorageKey('platform_settings'));
            if (saved) {
                const settings = JSON.parse(saved);
                
                if (settings.selectedPlatform && this.platforms[settings.selectedPlatform]) {
                    this.selectedPlatform = settings.selectedPlatform;
                }
            }
        } catch (error) {
            Config.warn('Failed to load platform settings:', error);
        }
    }
    
    /**
     * Save settings to storage
     */
    saveSettings() {
        try {
            localStorage.setItem(
                Config.getStorageKey('platform_settings'),
                JSON.stringify({
                    selectedPlatform: this.selectedPlatform
                })
            );
        } catch (error) {
            Config.warn('Failed to save platform settings:', error);
        }
    }
    
    /**
     * Get all platforms
     */
    getAllPlatforms() {
        return Object.values(this.platforms);
    }
    
    /**
     * Get platform by ID
     */
    getPlatform(platformId) {
        return this.platforms[platformId] || null;
    }
    
    /**
     * Get selected platform
     */
    getSelectedPlatform() {
        return this.platforms[this.selectedPlatform];
    }
    
    /**
     * Set selected platform
     */
    setSelectedPlatform(platformId) {
        if (this.platforms[platformId]) {
            this.selectedPlatform = platformId;
            this.saveSettings();
            return true;
        }
        return false;
    }
    
    /**
     * Get platform URL with prompt
     */
    getPlatformUrl(platformId, prompt = '') {
        const platform = this.platforms[platformId];
        if (!platform) return null;
        
        let url = platform.url;
        
        // Add prompt to URL based on platform
        if (prompt.trim()) {
            const encodedPrompt = encodeURIComponent(prompt.trim());
            
            switch (platformId) {
                case 'gemini':
                    url = `https://gemini.google.com/app?prompt=${encodedPrompt}`;
                    break;
                case 'chatgpt':
                    url = `https://chat.openai.com/?q=${encodedPrompt}`;
                    break;
                case 'claude':
                    url = `https://claude.ai/new?prompt=${encodedPrompt}`;
                    break;
                case 'perplexity':
                    url = `https://www.perplexity.ai/search?q=${encodedPrompt}`;
                    break;
                case 'deepseek':
                    url = `https://chat.deepseek.com/?q=${encodedPrompt}`;
                    break;
                case 'copilot':
                    url = `https://copilot.microsoft.com/?q=${encodedPrompt}`;
                    break;
                case 'grok':
                    url = `https://grok.x.ai/?q=${encodedPrompt}`;
                    break;
            }
        }
        
        return url;
    }
    
    /**
     * Open platform with prompt
     */
    async openPlatform(platformId, prompt = '') {
        const platform = this.getPlatform(platformId);
        if (!platform) {
            showNotification('Platform not found', 'error');
            return false;
        }
        
        // Copy prompt to clipboard
        if (prompt.trim()) {
            const success = await Utils.copyToClipboard(prompt);
            if (!success) {
                showNotification('Failed to copy prompt to clipboard', 'error');
                return false;
            }
            
            showNotification(`Prompt copied! Opening ${platform.name}...`, 'success');
        }
        
        // Open platform URL
        const url = this.getPlatformUrl(platformId, prompt);
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
            return true;
        }
        
        return false;
    }
    
    /**
     * Get recommended platform
     */
    getRecommendedPlatform() {
        const recommended = this.getAllPlatforms().find(p => p.recommended);
        return recommended || this.platforms.gemini;
    }
}

// Create singleton instance
const platforms = new Platforms();

// Make globally available
window.Platforms = Platforms;
window.platforms = platforms;
