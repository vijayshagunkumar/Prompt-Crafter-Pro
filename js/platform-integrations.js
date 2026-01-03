// AI Platform Integrations for PromptCraft Pro
class PlatformIntegrations {
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
                logoUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg'
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
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/openai-2.svg'
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
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/anthropic-1.svg'
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
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/perplexity-1.svg'
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
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/deepseek-1.svg'
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
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/microsoft-copilot.svg'
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
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/x-social-media-logo.svg'
            }
        ];
    }

    // Generate platform card HTML
    generatePlatformCard(platform, isSelected = false) {
        const logoHtml = platform.logoUrl ? 
            `<img src="${platform.logoUrl}" alt="${platform.name} Logo" onerror="this.onerror=null; this.style.display='none'; this.parentNode.innerHTML='<i class=\"${platform.icon}\"></i>';">` :
            `<i class="${platform.icon}"></i>`;
        
        return `
            <div class="platform-card ${platform.recommended ? 'recommended' : ''} ${isSelected ? 'selected' : ''}" 
                 data-platform="${platform.id}">
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
            </div>
        `;
    }

    // Render all platforms to container
    renderPlatforms(container, selectedPlatform = null) {
        if (!container) return;
        
        container.innerHTML = this.platforms.map(platform => 
            this.generatePlatformCard(platform, selectedPlatform === platform.id)
        ).join('');
    }

    // Get platform by ID
    getPlatformById(id) {
        return this.platforms.find(p => p.id === id);
    }

    // Generate launch URL with prompt
    generateLaunchUrl(platformId, prompt) {
        const platform = this.getPlatformById(platformId);
        if (!platform) return null;
        
        const url = new URL(platform.launchUrl);
        
        // Add prompt to URL parameters if the platform supports it
        if (platform.params) {
            const paramName = Object.keys(platform.params)[0];
            if (paramName) {
                // Some platforms might need URL encoding
                url.searchParams.set(paramName, encodeURIComponent(prompt));
            }
        }
        
        return url.toString();
    }

    // Copy prompt and launch platform
    async copyAndLaunch(platformId, prompt, callback) {
        try {
            // Copy to clipboard
            await navigator.clipboard.writeText(prompt);
            
            // Get launch URL
            const launchUrl = this.generateLaunchUrl(platformId, prompt);
            
            // Callback with success
            if (callback) {
                callback({
                    success: true,
                    platformId,
                    platformName: this.getPlatformById(platformId)?.name,
                    launchUrl
                });
            }
            
            // Return data for further processing
            return {
                success: true,
                platformId,
                platformName: this.getPlatformById(platformId)?.name,
                launchUrl
            };
            
        } catch (err) {
            console.error('Failed to copy and launch:', err);
            
            if (callback) {
                callback({
                    success: false,
                    error: err.message
                });
            }
            
            return {
                success: false,
                error: err.message
            };
        }
    }

    // Get all platforms
    getAllPlatforms() {
        return this.platforms;
    }

    // Get recommended platforms
    getRecommendedPlatforms() {
        return this.platforms.filter(p => p.recommended);
    }

    // Filter platforms by tags
    filterPlatformsByTags(tags) {
        return this.platforms.filter(platform => 
            tags.some(tag => platform.tags.includes(tag))
        );
    }

    // Add custom platform (for extensibility)
    addCustomPlatform(platform) {
        // Validate required fields
        const required = ['id', 'name', 'icon', 'launchUrl'];
        const missing = required.filter(field => !platform[field]);
        
        if (missing.length > 0) {
            console.error('Missing required fields:', missing);
            return false;
        }
        
        this.platforms.push(platform);
        return true;
    }

    // Remove platform
    removePlatform(platformId) {
        const index = this.platforms.findIndex(p => p.id === platformId);
        if (index !== -1) {
            this.platforms.splice(index, 1);
            return true;
        }
        return false;
    }
}
