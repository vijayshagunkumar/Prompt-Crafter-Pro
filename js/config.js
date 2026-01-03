/**
 * Configuration for PromptCraft Pro
 */

const Config = {
    // API Configuration
    API: {
        ENDPOINT: 'https://promptcraft-api.vijay-shagunkumar.workers.dev',
        LOCAL_ENDPOINT: 'http://localhost:8787',
        
        // Available models
        MODELS: {
            'gemini-3-flash-preview': {
                name: 'Gemini 3 Flash',
                provider: 'Google',
                description: 'Latest Gemini 3 model with fast response times',
                icon: 'fab fa-google',
                color: '#8B5CF6',
                isDefault: true
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
        
        DEFAULT_MODEL: 'gemini-3-flash-preview',
        
        // Rate limits (matching your Cloudflare Worker)
        RATE_LIMITS: {
            MINUTE: 20,
            DAILY: 500,
            WINDOW_MS: 60000,
            BLOCK_DURATION_MS: 900000
        }
    },
    
    // Frontend Configuration
    FRONTEND: {
        VERSION: '2.0',
        BUILD_DATE: '2024-01-15',
        GITHUB_REPO: 'https://github.com/vijay-shagunkumar/promptcraft',
        GITHUB_PAGES_URL: 'https://vijay-shagunkumar.github.io/promptcraft',
        
        // Feature flags
        FEATURES: {
            REAL_API: true,
            OFFLINE_FALLBACK: true,
            SPEECH: true,
            HISTORY: true,
            EXPORT: true
        },
        
        // UI Configuration
        UI: {
            DEFAULT_THEME: 'dark',
            ANIMATIONS: true,
            SMOOTH_SCROLL: true,
            REDUCED_MOTION: false
        }
    },
    
    // Storage Configuration
    STORAGE: {
        PREFIX: 'promptcraft_',
        VERSION: '1.0'
    },
    
    // Helper Methods
    getApiUrl() {
        const hostname = window.location.hostname;
        return (hostname === 'localhost' || hostname === '127.0.0.1') 
            ? this.API.LOCAL_ENDPOINT 
            : this.API.ENDPOINT;
    },
    
    getDefaultModel() {
        return this.API.DEFAULT_MODEL;
    },
    
    getModelDisplayName(modelId) {
        const model = this.API.MODELS[modelId];
        return model ? model.name : modelId;
    },
    
    getModelProvider(modelId) {
        const model = this.API.MODELS[modelId];
        return model ? model.provider : 'Unknown';
    },
    
    isValidModel(modelId) {
        return Object.keys(this.API.MODELS).includes(modelId);
    },
    
    getAvailableModels() {
        return Object.keys(this.API.MODELS).map(id => ({
            id,
            ...this.API.MODELS[id]
        }));
    },
    
    getStorageKey(key) {
        return `${this.STORAGE.PREFIX}${key}_v${this.STORAGE.VERSION}`;
    },
    
    sanitizeInput(text) {
        if (!text) return '';
        
        let sanitized = text.toString();
        
        // Remove potentially harmful content
        const blockedPatterns = [
            /<script.*?>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi
        ];
        
        blockedPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        
        // Limit length
        if (sanitized.length > 5000) {
            sanitized = sanitized.substring(0, 5000);
        }
        
        return sanitized.trim();
    },
    
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
        
        if (trimmed.length > 5000) {
            return { 
                valid: false, 
                error: `Prompt too long (max 5000 characters)` 
            };
        }
        
        return { 
            valid: true, 
            length: trimmed.length,
            trimmed: trimmed
        };
    },
    
    debug(...args) {
        if (window.debugMode) {
            console.log('[PromptCraft]', ...args);
        }
    },
    
    error(...args) {
        console.error('[PromptCraft]', ...args);
    },
    
    warn(...args) {
        console.warn('[PromptCraft]', ...args);
    },
    
    info(...args) {
        console.info('[PromptCraft]', ...args);
    }
};

// Make globally available
window.Config = Config;
