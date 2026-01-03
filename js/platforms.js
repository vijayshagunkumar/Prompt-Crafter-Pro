/**
 * AI Platforms Configuration and Management
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
                url: 'https://gemini.google.com',
                apiUrl: 'https://generativelanguage.googleapis.com',
                params: '&hl=en',
                recommended: true,
                enabled: true,
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
                params: '',
                enabled: true,
                tags: ['Freemium', 'Versatile']
            },
            claude: {
                id: 'claude',
                name: 'Anthropic Claude',
                description: 'Safety-focused, long context',
                icon: 'fas fa-brain',
                color: '#D3A3F9',
                url: 'https://claude.ai',
                apiUrl: 'https://api.anthropic.com',
                params: '',
                enabled: true,
                tags: ['Freemium', 'Safe']
            },
            perplexity: {
                id: 'perplexity',
                name: 'Perplexity AI',
                description: 'Real-time web search AI',
                icon: 'fas fa-search',
                color: '#000000',
                url: 'https://www.perplexity.ai',
                apiUrl: 'https://api.perplexity.ai',
                params: '',
                enabled: true,
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
                params: '',
                enabled: true,
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
                params: '',
                enabled: true,
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
                params: '',
                enabled: true,
                tags: ['Premium', 'Real-time']
            }
        };
        
        this.selectedPlatform = 'gemini';
        this.loadSettings();
    }
    
    /**
     * Load platform settings
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('promptcraft_platform_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Update platform enabled states
                if (settings.enabledPlatforms) {
                    Object.keys(settings.enabledPlatforms).forEach(platformId => {
                        if (this.platforms[platformId]) {
                            this.platforms[platformId].enabled = settings.enabledPlatforms[platformId];
                        }
                    });
                }
                
                // Update selected platform
                if (settings.selectedPlatform && this.platforms[settings.selectedPlatform]) {
                    this.selectedPlatform = settings.selectedPlatform;
                }
            }
        } catch (error) {
            console.warn('Failed to load platform settings:', error);
        }
    }
    
    /**
     * Save platform settings
     */
    saveSettings() {
        try {
            const enabledPlatforms = {};
            Object.keys(this.platforms).forEach(platformId => {
                enabledPlatforms[platformId] = this.platforms[platformId].enabled;
            });
            
            const settings = {
                selectedPlatform: this.selectedPlatform,
                enabledPlatforms: enabledPlatforms
            };
            
            localStorage.setItem('promptcraft_platform_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save platform settings:', error);
        }
    }
    
    /**
     * Get all platforms
     */
    getAllPlatforms() {
        return Object.values(this.platforms);
    }
    
    /**
     * Get enabled platforms
     */
    getEnabledPlatforms() {
        return Object.values(this.platforms).filter(platform => platform.enabled);
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
     * Enable/disable platform
     */
    setPlatformEnabled(platformId, enabled) {
        if (this.platforms[platformId]) {
            this.platforms[platformId].enabled = enabled;
            
            // If disabling selected platform, switch to another enabled platform
            if (platformId === this.selectedPlatform && !enabled) {
                const enabledPlatform = this.getEnabledPlatforms()[0];
                if (enabledPlatform) {
                    this.selectedPlatform = enabledPlatform.id;
                }
            }
            
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
        
        // Add additional params
        if (platform.params) {
            url += platform.params;
        }
        
        return url;
    }
    
    /**
     * Open platform with prompt
     */
    openPlatform(platformId, prompt = '') {
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
        const recommended = Object.values(this.platforms).find(p => p.recommended);
        return recommended || this.platforms.gemini;
    }
    
    /**
     * Get platform stats
     */
    getPlatformStats() {
        const allPlatforms = this.getAllPlatforms();
        const enabledPlatforms = this.getEnabledPlatforms();
        
        return {
            total: allPlatforms.length,
            enabled: enabledPlatforms.length,
            disabled: allPlatforms.length - enabledPlatforms.length,
            recommended: allPlatforms.filter(p => p.recommended).length
        };
    }
    
    /**
     * Get platform by feature
     */
    getPlatformsByFeature(feature) {
        return Object.values(this.platforms).filter(platform => {
            switch (feature) {
                case 'free':
                    return platform.tags.includes('Free');
                case 'realtime':
                    return platform.tags.includes('Real-time');
                case 'websearch':
                    return platform.tags.includes('Web Search');
                case 'opensource':
                    return platform.tags.includes('Open Source');
                default:
                    return false;
            }
        });
    }
    
    /**
     * Search platforms
     */
    searchPlatforms(query) {
        const searchTerm = query.toLowerCase();
        return Object.values(this.platforms).filter(platform => {
            return (
                platform.name.toLowerCase().includes(searchTerm) ||
                platform.description.toLowerCase().includes(searchTerm) ||
                platform.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    /**
     * Export platforms configuration
     */
    exportConfig() {
        return {
            platforms: this.platforms,
            selectedPlatform: this.selectedPlatform,
            stats: this.getPlatformStats(),
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Import platforms configuration
     */
    importConfig(config) {
        try {
            if (config.platforms) {
                Object.keys(config.platforms).forEach(platformId => {
                    if (this.platforms[platformId]) {
                        this.platforms[platformId] = {
                            ...this.platforms[platformId],
                            ...config.platforms[platformId]
                        };
                    }
                });
            }
            
            if (config.selectedPlatform && this.platforms[config.selectedPlatform]) {
                this.selectedPlatform = config.selectedPlatform;
            }
            
            this.saveSettings();
            return true;
        } catch (error) {
            console.error('Failed to import platform config:', error);
            return false;
        }
    }
    
    /**
     * Reset to default configuration
     */
    resetToDefaults() {
        // Reset enabled state for all platforms
        Object.keys(this.platforms).forEach(platformId => {
            this.platforms[platformId].enabled = true;
        });
        
        // Reset selected platform
        this.selectedPlatform = 'gemini';
        
        this.saveSettings();
        return true;
    }
}

// Create singleton instance
const platforms = new Platforms();

// Make globally available
window.Platforms = Platforms;


