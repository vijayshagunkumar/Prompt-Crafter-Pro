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
            },
            {
                id: 'groq',
                name: 'Groq Playground',
                icon: 'fas fa-rocket',
                color: '#00B894',
                description: 'Ultra-fast inference engine',
                tags: ['Fast', 'API', 'Playground'],
                launchUrl: 'https://console.groq.com/playground',
                params: { prompt: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/groq-logo.svg'
            }
        ];
        
        // 🔧 FIX: LRU Cache to prevent memory leak
        this.loadedLogos = new Map();
        this.MAX_LOGOS = 50;
        this.logoCacheHits = 0;
        this.logoCacheMisses = 0;
        
        console.log('PlatformIntegrations initialized with LRU cache');
    }

    // ✅ FIXED: Generate platform card HTML
    generatePlatformCard(platform, isSelected = false) {
        const logoHtml = platform.logoUrl ? 
            `<img src="${platform.logoUrl}" 
                  alt="${platform.name} Logo" 
                  class="platform-logo" 
                  data-platform="${platform.id}"
                  data-fallback-icon="${platform.icon}"
                  loading="lazy">` :
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

    // ✅ FIXED: Handle logo image errors with LRU cache
    setupLogoErrorHandlers() {
        document.querySelectorAll('.platform-logo').forEach(img => {
            const imgSrc = img.src;
            
            // Check cache first
            if (this.loadedLogos.has(imgSrc)) {
                const cached = this.loadedLogos.get(imgSrc);
                if (cached.status === 'loaded') {
                    this.logoCacheHits++;
                    img.classList.add('loaded');
                    return; // Already loaded successfully
                } else if (cached.status === 'failed') {
                    this.replaceWithFallback(img);
                    return;
                }
            }
            
            // Add error handler
            img.addEventListener('error', (e) => {
                this.handleLogoError(e.target);
            });
            
            // Mark as loaded when successful
            img.addEventListener('load', (e) => {
                e.target.classList.add('loaded');
                this.updateLogoCache(e.target.src, 'loaded');
                this.logoCacheMisses++;
            });
        });
        
        // 🔧 FIX: Clean cache if too large
        this.cleanLogoCache();
    }
    
    handleLogoError(img) {
        const fallbackIcon = img.getAttribute('data-fallback-icon');
        const platformId = img.getAttribute('data-platform');
        
        if (fallbackIcon && platformId) {
            this.replaceWithFallback(img);
            this.updateLogoCache(img.src, 'failed');
        }
    }
    
    replaceWithFallback(img) {
        const fallbackIcon = img.getAttribute('data-fallback-icon');
        const container = img.parentElement;
        if (container) {
            container.innerHTML = `<i class="${fallbackIcon}"></i>`;
            container.style.background = 'transparent';
        }
    }
    
    // 🔧 NEW: LRU Cache management
    updateLogoCache(src, status) {
        this.loadedLogos.set(src, {
            status: status,
            timestamp: Date.now()
        });
    }
    
    cleanLogoCache() {
        if (this.loadedLogos.size > this.MAX_LOGOS) {
            // Convert to array, sort by timestamp, remove oldest 20%
            const entries = Array.from(this.loadedLogos.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toRemove = entries.slice(0, Math.floor(this.MAX_LOGOS * 0.2));
            toRemove.forEach(([key]) => {
                this.loadedLogos.delete(key);
            });
            
            console.log(`Cleaned logo cache: removed ${toRemove.length} entries`);
        }
    }
    
    getCacheStats() {
        const total = this.logoCacheHits + this.logoCacheMisses;
        return {
            size: this.loadedLogos.size,
            hits: this.logoCacheHits,
            misses: this.logoCacheMisses,
            hitRate: total > 0 ? (this.logoCacheHits / total) * 100 : 0
        };
    }

    // Render all platforms to container
    renderPlatforms(container, selectedPlatform = null) {
        if (!container) return;
        
        container.innerHTML = this.platforms.map(platform => 
            this.generatePlatformCard(platform, selectedPlatform === platform.id)
        ).join('');
        
        // Set up safe logo error handlers after render
        setTimeout(() => this.setupLogoErrorHandlers(), 0);
    }

    // Get platform by ID
    getPlatformById(id) {
        return this.platforms.find(p => p.id === id);
    }

    // Generate launch URL with prompt
    generateLaunchUrl(platformId, prompt) {
        const platform = this.getPlatformById(platformId);
        if (!platform) return null;
        
        return platform.launchUrl;
    }

    // ✅ FIXED: Copy prompt and launch platform safely
    async copyAndLaunch(platformId, prompt, callback) {
        try {
            const platform = this.getPlatformById(platformId);
            if (!platform) {
                throw new Error(`Platform ${platformId} not found`);
            }
            
            // ✅ FIX: Copy EXACT prompt — no wrappers, no instructions
            const copyText = prompt;
            
            // Open window FIRST
            const win = window.open(
                platform.launchUrl,
                '_blank',
                'noopener,noreferrer'
            );
            
            // Then copy to clipboard
            await navigator.clipboard.writeText(copyText);
            
            // Handle popup block scenario
            if (!win) {
                const message = `Prompt copied! Popup was blocked. Please visit ${platform.name} manually.`;
                console.warn(message);
                
                if (callback) {
                    callback({
                        success: true,
                        platformId,
                        platformName: platform.name,
                        launchUrl: platform.launchUrl,
                        message: message,
                        popupBlocked: true
                    });
                }
                
                return {
                    success: true,
                    platformId,
                    platformName: platform.name,
                    launchUrl: platform.launchUrl,
                    message: message,
                    popupBlocked: true
                };
            }
            
            // Success case
            const message = `Prompt copied! Opening ${platform.name}...`;
            
            if (callback) {
                callback({
                    success: true,
                    platformId,
                    platformName: platform.name,
                    launchUrl: platform.launchUrl,
                    message: message,
                    popupBlocked: false,
                    window: win
                });
            }
            
            return {
                success: true,
                platformId,
                platformName: platform.name,
                launchUrl: platform.launchUrl,
                message: message,
                popupBlocked: false
            };
            
        } catch (err) {
            console.error('Failed to copy and launch:', err);
            
            // Fallback for older browsers
            if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
                return this.fallbackCopyAndLaunch(platformId, prompt, callback);
            }
            
            const errorMessage = 'Failed to copy prompt. Please try manually.';
            
            if (callback) {
                callback({
                    success: false,
                    platformId,
                    error: err.message,
                    message: errorMessage
                });
            }
            
            return {
                success: false,
                platformId,
                error: err.message,
                message: errorMessage
            };
        }
    }
    
    fallbackCopyAndLaunch(platformId, prompt, callback) {
        try {
            const platform = this.getPlatformById(platformId);
            if (!platform) return false;
            
            const textArea = document.createElement('textarea');
            textArea.value = prompt;
            document.body.appendChild(textArea);
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                const win = window.open(
                    platform.launchUrl,
                    '_blank',
                    'noopener,noreferrer'
                );
                
                const message = win ? 
                    'Prompt copied! Opening platform...' :
                    'Prompt copied! Please visit manually.';
                
                if (callback) {
                    callback({
                        success: true,
                        platformId,
                        platformName: platform.name,
                        message: message + ' (used fallback method)',
                        usedFallback: true
                    });
                }
                
                return {
                    success: true,
                    platformId,
                    platformName: platform.name,
                    message: message,
                    usedFallback: true
                };
            }
        } catch (fallbackErr) {
            console.error('Fallback copy failed:', fallbackErr);
        }
        
        return {
            success: false,
            platformId,
            error: 'All copy methods failed',
            message: 'Please copy the prompt manually'
        };
    }

    // ✅ FIXED: Optimized launch method for immediate user gesture
    handlePlatformClick(platformId, prompt) {
        const platform = this.getPlatformById(platformId);
        if (!platform) return false;
        
        try {
            // Open window immediately (sync - within user gesture)
            const win = window.open(
                platform.launchUrl,
                '_blank',
                'noopener,noreferrer'
            );
            
            // ✅ FIX: Copy EXACT prompt — platform-agnostic
            const copyText = prompt;
            
            // Copy to clipboard (async - after window is opened)
            navigator.clipboard.writeText(copyText).then(() => {
                console.log(`Prompt copied for ${platform.name} (clean copy)`);
            }).catch(err => {
                console.warn('Clipboard write failed:', err);
                // Try fallback
                this.fallbackCopyAndLaunch(platformId, prompt);
            });
            
            return {
                success: true,
                platformName: platform.name,
                window: win,
                popupBlocked: !win
            };
            
        } catch (err) {
            console.error('Platform launch failed:', err);
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
    
    // 🔧 NEW: Clear logo cache
    clearLogoCache() {
        this.loadedLogos.clear();
        this.logoCacheHits = 0;
        this.logoCacheMisses = 0;
        console.log('Logo cache cleared');
    }
}
