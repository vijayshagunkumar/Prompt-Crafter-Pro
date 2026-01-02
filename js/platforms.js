/**
 * AI Platforms data and handlers for PromptCraft Pro
 */

class PlatformsManager {
    constructor() {
        this.platforms = [
            {
                id: 'gemini',
                name: 'Google Gemini',
                icon: 'fab fa-google',
                color: '#8B5CF6',
                description: 'Advanced reasoning and multimodal capabilities',
                tags: ['Multimodal', 'Advanced', 'Google'],
                launchUrl: 'https://gemini.google.com/',
                params: { prompt: '' },
                recommended: true,
                logoUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
                provider: 'Google',
                supportedModels: ['gemini-3-flash-preview', 'gemini-1.5-flash-latest']
            },
            {
                id: 'chatgpt',
                name: 'ChatGPT',
                icon: 'fas fa-comment-alt',
                color: '#10A37F',
                description: 'Industry-leading conversational AI',
                tags: ['Conversational', 'Popular', 'OpenAI'],
                launchUrl: 'https://chat.openai.com/',
                params: { text: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/openai-2.svg',
                provider: 'OpenAI',
                supportedModels: ['gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo']
            },
            {
                id: 'claude',
                name: 'Anthropic Claude',
                icon: 'fas fa-brain',
                color: '#D4A574',
                description: 'Constitutional AI with safety focus',
                tags: ['Safe', 'Contextual', 'Anthropic'],
                launchUrl: 'https://claude.ai/',
                params: { query: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/anthropic-1.svg',
                provider: 'Anthropic',
                supportedModels: ['claude-3-haiku', 'claude-3-sonnet']
            },
            {
                id: 'perplexity',
                name: 'Perplexity AI',
                icon: 'fas fa-search',
                color: '#6B7280',
                description: 'Search-enhanced AI with citations',
                tags: ['Search', 'Citations', 'Real-time'],
                launchUrl: 'https://www.perplexity.ai/',
                params: { q: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/perplexity-1.svg',
                provider: 'Perplexity',
                supportedModels: ['sonar', 'sonar-pro']
            },
            {
                id: 'deepseek',
                name: 'DeepSeek',
                icon: 'fas fa-code',
                color: '#3B82F6',
                description: 'Code-focused AI with reasoning',
                tags: ['Code', 'Developer', 'Reasoning'],
                launchUrl: 'https://chat.deepseek.com/',
                params: { message: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/deepseek-1.svg',
                provider: 'DeepSeek',
                supportedModels: ['deepseek-coder', 'deepseek-chat']
            },
            {
                id: 'copilot',
                name: 'Microsoft Copilot',
                icon: 'fab fa-microsoft',
                color: '#0078D4',
                description: 'Microsoft-powered AI assistant',
                tags: ['Microsoft', 'Productivity', 'Office'],
                launchUrl: 'https://copilot.microsoft.com/',
                params: { prompt: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/microsoft-copilot.svg',
                provider: 'Microsoft',
                supportedModels: ['gpt-4', 'gpt-4-turbo']
            },
            {
                id: 'grok',
                name: 'Grok AI',
                icon: 'fab fa-x-twitter',
                color: '#FF6B35',
                description: 'Real-time knowledge AI',
                tags: ['Real-time', 'X', 'Elon'],
                launchUrl: 'https://grok.x.ai/',
                params: { query: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/x-social-media-logo.svg',
                provider: 'xAI',
                supportedModels: ['grok-1', 'grok-2']
            }
        ];
        
        this.selectedPlatform = null;
    }

    /**
     * Get all platforms
     */
    getAllPlatforms() {
        return this.platforms;
    }

    /**
     * Get platform by ID
     */
    getPlatform(id) {
        return this.platforms.find(p => p.id === id);
    }

    /**
     * Get recommended platform
     */
    getRecommendedPlatform() {
        return this.platforms.find(p => p.recommended) || this.platforms[0];
    }

    /**
     * Select a platform
     */
    selectPlatform(platformId) {
        const platform = this.getPlatform(platformId);
        if (platform) {
            this.selectedPlatform = platform;
            return platform;
        }
        return null;
    }

    /**
     * Get selected platform
     */
    getSelectedPlatform() {
        return this.selectedPlatform;
    }

    /**
     * Clear selected platform
     */
    clearSelectedPlatform() {
        this.selectedPlatform = null;
    }

    /**
     * Generate platform URL with prompt
     */
    generatePlatformUrl(platformId, prompt) {
        const platform = this.getPlatform(platformId);
        if (!platform || !prompt) return null;

        try {
            // Create URL object
            const url = new URL(platform.launchUrl);
            
            // Add prompt to appropriate parameter
            const paramName = Object.keys(platform.params)[0];
            if (paramName) {
                // Some platforms use URL parameters, others use hash
                if (platform.id === 'gemini' || platform.id === 'chatgpt') {
                    // These typically don't accept parameters in URL
                    // We'll return the base URL and prompt can be pasted
                    return url.toString();
                } else {
                    url.searchParams.set(paramName, prompt);
                }
            }
            
            return url.toString();
        } catch (error) {
            console.error('Error generating platform URL:', error);
            return platform.launchUrl;
        }
    }

    /**
     * Create platform card element
     */
    createPlatformCard(platform, isSelected = false) {
        const card = document.createElement('div');
        card.className = 'platform-card';
        card.dataset.platform = platform.id;
        
        if (platform.recommended) {
            card.classList.add('recommended');
        }
        
        if (isSelected) {
            card.classList.add('selected');
        }
        
        // Create logo element
        const logoHtml = platform.logoUrl ? 
            `<img src="${platform.logoUrl}" alt="${platform.name} Logo" onerror="this.onerror=null; this.parentNode.innerHTML='<i class=\"${platform.icon}\"></i>';">` :
            `<i class="${platform.icon}"></i>`;
        
        card.innerHTML = `
            <div class="platform-logo-container" style="background: ${platform.id === 'gemini' ? 'white' : platform.color}">
                ${logoHtml}
            </div>
            <div class="platform-info">
                <div class="platform-name">
                    ${platform.name}
                    ${platform.recommended ? '<span class="recommended-badge">Recommended</span>' : ''}
                </div>
                <div class="platform-desc">${platform.description}</div>
                <div class="platform-tags">
                    ${platform.tags.map(tag => `<span class="platform-tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
        
        // Store platform data for later use
        card._platformData = platform;
        
        return card;
    }

    /**
     * Get platforms compatible with a model
     */
    getPlatformsForModel(modelId) {
        return this.platforms.filter(platform => {
            // If platform has no supportedModels list, assume it supports all
            if (!platform.supportedModels || platform.supportedModels.length === 0) {
                return true;
            }
            
            // Check if model is in supportedModels
            return platform.supportedModels.includes(modelId);
        });
    }

    /**
     * Get model-to-platform mapping
     */
    getModelPlatformMapping() {
        const mapping = {};
        
        this.platforms.forEach(platform => {
            if (platform.supportedModels && platform.supportedModels.length > 0) {
                platform.supportedModels.forEach(modelId => {
                    if (!mapping[modelId]) {
                        mapping[modelId] = [];
                    }
                    mapping[modelId].push(platform.id);
                });
            }
        });
        
        return mapping;
    }

    /**
     * Filter platforms by tag
     */
    filterPlatformsByTag(tag) {
        return this.platforms.filter(platform => 
            platform.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
        );
    }

    /**
     * Search platforms
     */
    searchPlatforms(query) {
        const lowerQuery = query.toLowerCase();
        return this.platforms.filter(platform => 
            platform.name.toLowerCase().includes(lowerQuery) ||
            platform.description.toLowerCase().includes(lowerQuery) ||
            platform.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
            platform.provider.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Get platform statistics
     */
    getPlatformStats() {
        return {
            total: this.platforms.length,
            byProvider: this.getPlatformsByProvider(),
            tags: this.getAllTags(),
            recommended: this.platforms.filter(p => p.recommended).length
        };
    }

    /**
     * Group platforms by provider
     */
    getPlatformsByProvider() {
        const groups = {};
        
        this.platforms.forEach(platform => {
            if (!groups[platform.provider]) {
                groups[platform.provider] = [];
            }
            groups[platform.provider].push(platform.id);
        });
        
        return groups;
    }

    /**
     * Get all unique tags
     */
    getAllTags() {
        const tags = new Set();
        
        this.platforms.forEach(platform => {
            platform.tags.forEach(tag => tags.add(tag));
        });
        
        return Array.from(tags);
    }

    /**
     * Sort platforms by criteria
     */
    sortPlatforms(criteria = 'name', order = 'asc') {
        const sorted = [...this.platforms];
        
        sorted.sort((a, b) => {
            let aVal, bVal;
            
            switch (criteria) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'provider':
                    aVal = a.provider.toLowerCase();
                    bVal = b.provider.toLowerCase();
                    break;
                case 'recommended':
                    aVal = a.recommended ? 0 : 1;
                    bVal = b.recommended ? 0 : 1;
                    break;
                default:
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
            }
            
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sorted;
    }

    /**
     * Export platforms data
     */
    exportPlatformsData(format = 'json') {
        const data = {
            timestamp: new Date().toISOString(),
            count: this.platforms.length,
            platforms: this.platforms
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(data.platforms);
            default:
                return data;
        }
    }

    /**
     * Convert platforms to CSV
     */
    convertToCSV(platforms) {
        const headers = ['ID', 'Name', 'Provider', 'Description', 'Tags', 'URL'];
        const rows = platforms.map(p => [
            p.id,
            `"${p.name}"`,
            p.provider,
            `"${p.description}"`,
            `"${p.tags.join(', ')}"`,
            p.launchUrl
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    /**
     * Import platforms data
     */
    importPlatformsData(data) {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            
            if (parsed.platforms && Array.isArray(parsed.platforms)) {
                this.platforms = parsed.platforms;
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error importing platforms data:', error);
            return false;
        }
    }

    /**
     * Reset to default platforms
     */
    resetToDefault() {
        // Reinitialize with default platforms
        this.platforms = this.constructor.getDefaultPlatforms();
        this.selectedPlatform = null;
    }

    /**
     * Get default platforms (static method)
     */
    static getDefaultPlatforms() {
        // Same as constructor data
        return [
            {
                id: 'gemini',
                name: 'Google Gemini',
                icon: 'fab fa-google',
                color: '#8B5CF6',
                description: 'Advanced reasoning and multimodal capabilities',
                tags: ['Multimodal', 'Advanced', 'Google'],
                launchUrl: 'https://gemini.google.com/',
                params: { prompt: '' },
                recommended: true,
                logoUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
                provider: 'Google'
            },
            // ... other platforms
        ];
    }
}

export default PlatformsManager;
