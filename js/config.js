/**
 * Environment Configuration for PromptCraft Pro
 * GitHub Pages Version
 */

const Config = {
    // API Configuration
    API: {
        // Production endpoint (your Cloudflare Worker)
        ENDPOINT: 'https://promptcraft-api.vijay-shagunkumar.workers.dev',
        
        // Local development endpoint
        LOCAL_ENDPOINT: 'http://127.0.0.1:8787',
        
        // Available models (must match your worker.js)
        MODELS: {
            'gemini-3-flash-preview': {
                name: 'Gemini 3 Flash Preview',
                provider: 'Google',
                description: 'Latest Gemini 3 model with fast response times',
                icon: 'fab fa-google',
                color: '#8B5CF6',
                isDefault: true
            },
            'gemini-1.5-flash-latest': {
                name: 'Gemini 1.5 Flash',
                provider: 'Google',
                description: 'Fast and capable Gemini model',
                icon: 'fab fa-google',
                color: '#8B5CF6'
            },
            'gpt-4o-mini': {
                name: 'GPT-4o Mini',
                provider: 'OpenAI',
                description: 'Cost-effective GPT-4 variant',
                icon: 'fas fa-comment-alt',
                color: '#10A37F'
            },
            'llama-3.1-8b-instant': {
                name: 'Llama 3.1 8B',
                provider: 'Groq',
                description: 'Fast Llama model via Groq',
                icon: 'fas fa-brain',
                color: '#3B82F6'
            }
        },
        
        // Default model
        DEFAULT_MODEL: 'gemini-3-flash-preview',
        
        // Rate limits (from your worker.js)
        RATE_LIMITS: {
            MINUTE: 20,
            DAILY: 500,
            WINDOW_MS: 60000,
            BLOCK_DURATION_MS: 900000
        },
        
        // Request configuration
        REQUEST_CONFIG: {
            timeout: 30000,
            maxRetries: 2,
            retryDelay: 1000,
            fallbackEnabled: true
        }
    },
    
    // Frontend Configuration
    FRONTEND: {
        VERSION: '4.3.1',
        BUILD_DATE: '2024-01-15',
        GITHUB_REPO: 'https://github.com/vijay-shagunkumar/promptcraft',
        GITHUB_PAGES_URL: 'https://vijay-shagunkumar.github.io/promptcraft',
        
        // Feature flags
        FEATURES: {
            REAL_API: true,
            OFFLINE_FALLBACK: true,
            SPEECH: true,
            HISTORY: true,
            EXPORT: true,
            ANALYTICS: false,
            DEBUG: false
        },
        
        // UI Configuration
        UI: {
            DEFAULT_THEME: 'dark',
            ANIMATIONS: true,
            SMOOTH_SCROLL: true,
            REDUCED_MOTION: false
        }
    },
    
    // Security Configuration
    SECURITY: {
        ENABLE_CSP: false,
        SANITIZE_INPUT: true,
        VALIDATE_PROMPTS: true,
        MAX_PROMPT_LENGTH: 5000,
        BLOCKED_PATTERNS: [
            /<script.*?>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi
        ]
    },
    
    // Storage Configuration
    STORAGE: {
        PREFIX: 'promptcraft_',
        VERSION: '1.0',
        COMPRESSION: false,
        ENCRYPTION: false
    },
    
    // Analytics Configuration
    ANALYTICS: {
        ENABLED: false,
        ENDPOINT: '',
        SAMPLE_RATE: 0.1
    },
    
    // ========== HELPER METHODS ==========
    
    /**
     * Get current environment
     */
    getEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('github.io')) {
            return 'github-pages';
        } else if (hostname.includes('pages.dev')) {
            return 'cloudflare-pages';
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else {
            return 'production';
        }
    },
    
    /**
     * Get API URL based on environment
     */
    getApiUrl() {
        const env = this.getEnvironment();
        return env === 'development' ? this.API.LOCAL_ENDPOINT : this.API.ENDPOINT;
    },
    
    /**
     * Check if online mode should be used
     */
    shouldUseRealApi() {
        return this.FRONTEND.FEATURES.REAL_API && navigator.onLine;
    },
    
    /**
     * Get default model
     */
    getDefaultModel() {
        return this.API.DEFAULT_MODEL;
    },
    
    /**
     * Get model display name
     */
    getModelDisplayName(modelId) {
        const model = this.API.MODELS[modelId];
        return model ? model.name : modelId;
    },
    
    /**
     * Get model provider
     */
    getModelProvider(modelId) {
        const model = this.API.MODELS[modelId];
        return model ? model.provider : 'Unknown';
    },
    
    /**
     * Get model color
     */
    getModelColor(modelId) {
        const model = this.API.MODELS[modelId];
        return model ? model.color : '#4F46E5';
    },
    
    /**
     * Get model icon
     */
    getModelIcon(modelId) {
        const model = this.API.MODELS[modelId];
        return model ? model.icon : 'fas fa-robot';
    },
    
    /**
     * Validate model ID
     */
    isValidModel(modelId) {
        return Object.keys(this.API.MODELS).includes(modelId);
    },
    
    /**
     * Get all available models
     */
    getAvailableModels() {
        return Object.keys(this.API.MODELS).map(id => ({
            id,
            ...this.API.MODELS[id]
        }));
    },
    
    /**
     * Get recommended model
     */
    getRecommendedModel() {
        const models = this.getAvailableModels();
        return models.find(m => m.isDefault) || models[0];
    },
    
    /**
     * Get rate limit information
     */
    getRateLimitInfo() {
        return {
            ...this.API.RATE_LIMITS,
            remaining: {
                minute: this.API.RATE_LIMITS.MINUTE,
                daily: this.API.RATE_LIMITS.DAILY
            }
        };
    },
    
    /**
     * Get request configuration
     */
    getRequestConfig() {
        return this.API.REQUEST_CONFIG;
    },
    
    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.FRONTEND.FEATURES[feature] || false;
    },
    
    /**
     * Enable/disable feature
     */
    setFeature(feature, enabled) {
        if (this.FRONTEND.FEATURES.hasOwnProperty(feature)) {
            this.FRONTEND.FEATURES[feature] = enabled;
            return true;
        }
        return false;
    },
    
    /**
     * Sanitize input text
     */
    sanitizeInput(text) {
        if (!this.SECURITY.SANITIZE_INPUT || !text) return text || '';
        
        let sanitized = text.toString();
        
        // Remove blocked patterns
        this.SECURITY.BLOCKED_PATTERNS.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        
        // Trim and limit length
        sanitized = sanitized.trim();
        if (sanitized.length > this.SECURITY.MAX_PROMPT_LENGTH) {
            sanitized = sanitized.substring(0, this.SECURITY.MAX_PROMPT_LENGTH);
        }
        
        return sanitized;
    },
    
    /**
     * Validate prompt
     */
    validatePrompt(prompt) {
        if (!prompt || typeof prompt !== 'string') {
            return { valid: false, error: 'Prompt is required' };
        }
        
        const trimmed = prompt.trim();
        
        if (trimmed.length === 0) {
            return { valid: false, error: 'Prompt cannot be empty' };
        }
        
        if (trimmed.length < 3) {
            return { valid: false, error: 'Prompt is too short' };
        }
        
        if (trimmed.length > this.SECURITY.MAX_PROMPT_LENGTH) {
            return { 
                valid: false, 
                error: `Prompt too long (max ${this.SECURITY.MAX_PROMPT_LENGTH} characters)` 
            };
        }
        
        // Check for blocked patterns
        if (this.SECURITY.VALIDATE_PROMPTS) {
            for (const pattern of this.SECURITY.BLOCKED_PATTERNS) {
                if (pattern.test(trimmed)) {
                    return { 
                        valid: false, 
                        error: 'Prompt contains disallowed content',
                        flagged: true 
                    };
                }
            }
        }
        
        return { 
            valid: true, 
            length: trimmed.length,
            trimmed: trimmed
        };
    },
    
    /**
     * Get app version
     */
    getVersion() {
        return this.FRONTEND.VERSION;
    },
    
    /**
     * Get build info
     */
    getBuildInfo() {
        return {
            version: this.FRONTEND.VERSION,
            buildDate: this.FRONTEND.BUILD_DATE,
            environment: this.getEnvironment(),
            repo: this.FRONTEND.GITHUB_REPO
        };
    },
    
    /**
     * Check if running on GitHub Pages
     */
    isGitHubPages() {
        return this.getEnvironment() === 'github-pages';
    },
    
    /**
     * Check if running on Cloudflare Pages
     */
    isCloudflarePages() {
        return this.getEnvironment() === 'cloudflare-pages';
    },
    
    /**
     * Check if in development mode
     */
    isDevelopment() {
        return this.getEnvironment() === 'development';
    },
    
    /**
     * Get storage key with prefix
     */
    getStorageKey(key) {
        return `${this.STORAGE.PREFIX}${key}_v${this.STORAGE.VERSION}`;
    },
    
    /**
     * Clear all app storage
     */
    clearStorage() {
        const prefix = this.STORAGE.PREFIX;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
        return true;
    },
    
    /**
     * Log debug message if debug mode is enabled
     */
    debug(...args) {
        if (this.FRONTEND.FEATURES.DEBUG) {
            console.log('[PromptCraft Debug]', ...args);
        }
    },
    
    /**
     * Log error message
     */
    error(...args) {
        console.error('[PromptCraft Error]', ...args);
    },
    
    /**
     * Log warning message
     */
    warn(...args) {
        console.warn('[PromptCraft Warning]', ...args);
    },
    
    /**
     * Log info message
     */
    info(...args) {
        console.info('[PromptCraft Info]', ...args);
    },
    
    /**
     * Generate unique request ID
     */
    generateRequestId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 9);
        return `req_${timestamp}_${random}`;
    },
    
    /**
     * Format date for display
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    },
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Get browser information
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';
        
        if (ua.includes('Firefox')) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Chrome') && !ua.includes('Edg')) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browser = 'Safari';
            version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.includes('Edg')) {
            browser = 'Edge';
            version = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
        }
        
        return {
            browser,
            version,
            userAgent: ua,
            language: navigator.language,
            platform: navigator.platform,
            online: navigator.onLine,
            cookieEnabled: navigator.cookieEnabled,
            javaEnabled: navigator.javaEnabled ? true : false
        };
    },
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        if (!window.performance || !window.performance.timing) {
            return null;
        }
        
        const timing = window.performance.timing;
        const navigation = window.performance.navigation;
        
        return {
            loadTime: timing.loadEventEnd - timing.navigationStart,
            domReadyTime: timing.domComplete - timing.domLoading,
            redirectCount: navigation.redirectCount,
            type: navigation.type,
            memory: window.performance.memory
        };
    },
    
    /**
     * Initialize configuration
     */
    init() {
        this.debug('Configuration initialized:', this.getBuildInfo());
        this.debug('Environment:', this.getEnvironment());
        this.debug('API URL:', this.getApiUrl());
        this.debug('Browser:', this.getBrowserInfo());
        
        // Apply reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.FRONTEND.UI.REDUCED_MOTION = true;
            this.FRONTEND.UI.ANIMATIONS = false;
        }
        
        // Apply theme based on system preference
        if (this.FRONTEND.UI.DEFAULT_THEME === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.toggle('dark-theme', prefersDark);
        }
        
        return this;
    }
};

// Initialize and make globally available
window.Config = Config.init();

// Export for module usage
export default Config.init();
