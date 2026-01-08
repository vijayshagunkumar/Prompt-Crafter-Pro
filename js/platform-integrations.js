// AI Platform Integrations for PromptCraft Pro
class PlatformIntegrations {
    constructor() {
        this.platforms = [
            {
                id: 'gemini',
                name: 'Google Gemini',
                logo: '<i class="fas fa-robot"></i>', // ✅ Icon instead of image
                color: '#8B5CF6',
                description: 'Advanced reasoning and multimodal capabilities',
                tags: ['Multimodal', 'Advanced', 'Google'],
                launchUrl: 'https://gemini.google.com/',
                params: { prompt: '' }
            },
            {
                id: 'chatgpt',
                name: 'ChatGPT',
                logo: '<i class="fas fa-comment-alt"></i>', // ✅ Icon
                color: '#10A37F',
                description: 'Industry-leading conversational AI',
                tags: ['Conversational', 'Popular', 'OpenAI'],
                launchUrl: 'https://chat.openai.com/',
                params: { text: '' }
            },
            {
                id: 'claude',
                name: 'Anthropic Claude',
                logo: '<i class="fas fa-brain"></i>', // ✅ Icon
                color: '#D4A574',
                description: 'Constitutional AI with safety focus',
                tags: ['Safe', 'Contextual', 'Anthropic'],
                launchUrl: 'https://claude.ai/',
                params: { query: '' }
            },
            {
                id: 'perplexity',
                name: 'Perplexity AI',
                logo: '<i class="fas fa-search"></i>', // ✅ Icon
                color: '#6B7280',
                description: 'Search-enhanced AI with citations',
                tags: ['Search', 'Citations', 'Real-time'],
                launchUrl: 'https://www.perplexity.ai/',
                params: { q: '' }
            },
            {
                id: 'deepseek',
                name: 'DeepSeek',
                logo: '<i class="fas fa-code"></i>', // ✅ Icon
                color: '#3B82F6',
                description: 'Code-focused AI with reasoning',
                tags: ['Code', 'Developer', 'Reasoning'],
                launchUrl: 'https://chat.deepseek.com/',
                params: { message: '' }
            },
            {
                id: 'copilot',
                name: 'Microsoft Copilot',
                logo: '<i class="fab fa-microsoft"></i>', // ✅ Icon
                color: '#0078D4',
                description: 'Microsoft-powered AI assistant',
                tags: ['Microsoft', 'Productivity', 'Office'],
                launchUrl: 'https://copilot.microsoft.com/',
                params: { prompt: '' }
            },
            {
                id: 'grok',
                name: 'Grok AI',
                logo: '<i class="fab fa-x-twitter"></i>', // ✅ Icon
                color: '#FF6B35',
                description: 'Real-time knowledge AI',
                tags: ['Real-time', 'X', 'Elon'],
                launchUrl: 'https://grok.x.ai/',
                params: { query: '' }
            },
            {
                id: 'groq',
                name: 'Groq Playground',
                logo: '<i class="fas fa-rocket"></i>', // ✅ Icon
                color: '#00B894',
                description: 'Ultra-fast inference engine',
                tags: ['Fast', 'API', 'Playground'],
                launchUrl: 'https://console.groq.com/playground',
                params: { prompt: '' }
            }
        ];
        
        // Simple cache for performance
        this.loadedLogos = new Set();
        
        console.log('PlatformIntegrations initialized with icons');
    }

    // ✅ FIXED #3: Clean mobile detection (UA only, no screen size)
    isMobileDevice() {
        // Only use User-Agent for reliability
        // Removed screen size detection to avoid false positives
        return /Android|iPhone|iPod|iPad/i.test(navigator.userAgent);
    }

    // ✅ IMPROVED: Clipboard copy with robust fallback
    async copyToClipboardWithFallback(text) {
        // Check for very long prompts (optional)
        if (text.length > 10000) {
            console.warn('Prompt is very long, clipboard may truncate');
        }
        
        // 1. Try modern clipboard API first (works on secure contexts)
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return { success: true, method: 'modern' };
            } catch (err) {
                console.warn('Modern clipboard API failed:', err);
                // Continue to fallback
            }
        }
        
        // 2. Fallback to document.execCommand (deprecated but needed)
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.top = '-9999px';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            
            // iOS specific handling
            if (navigator.userAgent.match(/ipad|iphone|ipod/i)) {
                textArea.contentEditable = true;
                textArea.readOnly = false;
                const range = document.createRange();
                range.selectNodeContents(textArea);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                textArea.setSelectionRange(0, 999999);
            } else {
                textArea.select();
            }
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                return { success: true, method: 'legacy' };
            }
            
            return { success: false, error: 'Legacy copy failed' };
            
        } catch (err) {
            console.error('All clipboard methods failed:', err);
            return { 
                success: false, 
                error: err.message,
                method: 'error'
            };
        }
    }

    // ✅ FIXED #2: Consistent copy-first approach for ALL devices
    async handlePlatformClick(platformId, prompt) {
        if (!prompt || !prompt.trim()) {
            console.warn('No prompt provided for platform launch');
            return { success: false, error: 'No prompt provided' };
        }

        const platform = this.getPlatformById(platformId);
        if (!platform) {
            return { success: false, error: `Platform ${platformId} not found` };
        }

        const isMobile = this.isMobileDevice();
        const trimmedPrompt = prompt.trim();
        
        try {
            // ✅ UNIFIED FLOW: Copy FIRST on ALL devices (simpler, consistent)
            const copyResult = await this.copyToClipboardWithFallback(trimmedPrompt);
            
            if (!copyResult.success) {
                // Copy failed - show appropriate message
                const errorMessage = isMobile 
                    ? 'Could not copy automatically. Please copy manually.'
                    : 'Copy failed. Please copy the prompt manually.';
                
                this.showNotification(errorMessage, 'warning');
                
                // Still open the platform
                const win = window.open(
                    platform.launchUrl,
                    '_blank',
                    'noopener,noreferrer'
                );
                
                return {
                    success: true,
                    platformName: platform.name,
                    copySuccess: false,
                    message: win ? 'Platform opened (copy failed)' : 'Popup blocked (copy failed)',
                    popupBlocked: !win,
                    isMobile: isMobile
                };
            }
            
            // Copy succeeded - show success message
            const successMessage = isMobile
                ? '✅ Prompt copied! Opening AI tool...'
                : '✅ Prompt copied! Opening AI tool...';
            
            this.showNotification(successMessage, 'success');
            
            // Small delay to ensure clipboard commit and show notification
            await new Promise(resolve => setTimeout(resolve, isMobile ? 120 : 50));
            
            // Open the platform
            const win = window.open(
                platform.launchUrl,
                '_blank',
                'noopener,noreferrer'
            );
            
            // Handle popup block scenario
            if (!win) {
                const blockedMessage = isMobile
                    ? 'Popup blocked. Prompt is copied - open the AI tool manually.'
                    : 'Popup blocked. Prompt is copied - please open manually.';
                
                this.showNotification(blockedMessage, 'warning', 4000);
                
                return {
                    success: true,
                    platformName: platform.name,
                    copySuccess: true,
                    message: 'Popup blocked',
                    popupBlocked: true,
                    isMobile: isMobile
                };
            }
            
            return {
                success: true,
                platformName: platform.name,
                copySuccess: true,
                message: 'Platform opened successfully',
                popupBlocked: false,
                isMobile: isMobile
            };
            
        } catch (err) {
            console.error('Platform launch failed:', err);
            
            const errorMessage = isMobile
                ? 'Error launching platform. Please try again.'
                : `Error: ${err.message}`;
            
            this.showNotification(errorMessage, 'error', 4000);
            
            return {
                success: false,
                platformName: platform.name,
                error: err.message,
                isMobile: isMobile
            };
        }
    }

    // ✅ FIXED #1: Make fallback method properly async
    async fallbackCopyAndLaunch(platformId, prompt, callback) {
        const platform = this.getPlatformById(platformId);
        if (!platform) {
            const result = {
                success: false,
                platformId,
                error: `Platform ${platformId} not found`
            };
            if (callback) callback(result);
            return result;
        }
        
        // Use the improved copy method with await
        const copyResult = await this.copyToClipboardWithFallback(prompt);
        
        if (!copyResult.success) {
            const result = {
                success: false,
                platformId,
                error: 'Copy failed',
                message: 'Please copy the prompt manually',
                usedFallback: true
            };
            if (callback) callback(result);
            return result;
        }
        
        const win = window.open(
            platform.launchUrl,
            '_blank',
            'noopener,noreferrer'
        );
        
        const result = {
            success: true,
            platformId,
            platformName: platform.name,
            message: win ? 'Prompt copied! Opening platform...' : 'Prompt copied! Please visit manually.',
            popupBlocked: !win,
            usedFallback: true,
            isMobile: this.isMobileDevice()
        };
        
        if (callback) callback(result);
        return result;
    }

    // Notification helper with proper duration
    showNotification(message, type = 'info', duration = 3000) {
        const event = new CustomEvent('platformNotification', {
            detail: {
                message,
                type,
                duration: duration
            }
        });
        document.dispatchEvent(event);
        
        console.log(`[Platform Notification ${type}]: ${message}`);
    }

    // Simplified copyAndLaunch method
    async copyAndLaunch(platformId, prompt, callback) {
        const result = await this.handlePlatformClick(platformId, prompt);
        
        if (callback && typeof callback === 'function') {
            callback(result);
        }
        
        return result;
    }

    // ✅ Generate platform card with mobile hint
    generatePlatformCard(platform, isSelected = false) {
        const isMobile = this.isMobileDevice();
        let description = platform.description;
        
        if (isMobile) {
            description = `📱 Tap to copy & open • ${description}`;
        }
        
        return `
            <div class="platform-card ${isSelected ? 'selected' : ''}"
                 data-platform="${platform.id}">
                <div class="platform-logo-container"
                     style="background: ${platform.id === 'gemini' ? 'white' : platform.color}">
                    ${platform.logo}
                </div>

                <div class="platform-info">
                    <div class="platform-name">${platform.name}</div>
                    <div class="platform-desc">${description}</div>
                    <div class="platform-tags">
                        ${platform.tags.map(tag => `<span class="platform-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Setup logo handlers
    setupLogoHandlers() {
        const icons = document.querySelectorAll('.platform-logo-container i');
        icons.forEach(icon => {
            icon.style.opacity = '0.9';
            icon.style.fontSize = '1.5rem';
        });
    }
    
    // Render all platforms to container
    renderPlatforms(container, selectedPlatform = null) {
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Add mobile hint header if on mobile
        const isMobile = this.isMobileDevice();
        if (isMobile) {
            const mobileHint = `
                <div class="mobile-hint">
                    <small>📱 <strong>Mobile tip:</strong> Prompt will be copied automatically before opening</small>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', mobileHint);
        }
        
        // Render each platform card
        this.platforms.forEach(platform => {
            const cardHtml = this.generatePlatformCard(platform, selectedPlatform === platform.id);
            container.insertAdjacentHTML('beforeend', cardHtml);
        });
        
        // Set up handlers
        setTimeout(() => this.setupLogoHandlers(), 0);
        
        // Notify ranking system AFTER platforms exist in DOM
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('platformsRendered'));
        }, 50);
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
        const required = ['id', 'name', 'logo', 'launchUrl'];
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
    
    // Clear cache
    clearCache() {
        this.loadedLogos.clear();
        console.log('Platform cache cleared');
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformIntegrations;
}
