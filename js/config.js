/**
 * Environment Configuration for PromptCraft Pro
 */

const Config = {
    // API Configuration
    API: {
        // Production endpoint (your Cloudflare Worker)
        ENDPOINT: 'https://promptcraft-api.vijay-shagunkumar.workers.dev',
        
        // Local development endpoint
        LOCAL_ENDPOINT: 'http://127.0.0.1:8787',
        
        // Available models (matching worker.js)
        MODELS: {
            'gemini-3-flash-preview': {
                name: 'Gemini 3 Flash Preview',
                provider: 'Google',
                description: 'Latest Gemini 3 model with fast response times',
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
        
        // Rate limits (from your worker config)
        RATE_LIMITS: {
            MINUTE: 20,
            DAILY: 500
        },
        
        // Request configuration
        REQUEST_CONFIG: {
            timeout: 30000, // 30 seconds
            maxRetries: 2,
            retryDelay: 1000
        }
    },
    
    // Frontend Configuration
    FRONTEND: {
        VERSION: '4.3.1',
        BUILD_DATE: '2024-01-15',
        FEATURES: {
            REAL_API: true,
            OFFLINE_FALLBACK: true,
            SPEECH: true,
            HISTORY: true,
            EXPORT: true,
            ANALYTICS: true
        }
    },
    
    // Get current environment
    getEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('pages.dev') || hostname.includes('prompt-crafter-pro')) {
            return 'production';
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else {
            return 'staging';
        }
    },
    
    // Get API URL based on environment
    getApiUrl() {
        const env = this.getEnvironment();
        return env === 'development' ? this.API.LOCAL_ENDPOINT : this.API.ENDPOINT;
    },
    
    // Check if online mode should be used
    shouldUseRealApi() {
        return this.FRONTEND.FEATURES.REAL_API && navigator.onLine;
    },
    
    // Get default model
    getDefaultModel() {
        return this.API.DEFAULT_MODEL;
    },
    
    // Get model display name
    getModelDisplayName(modelId) {
        const model = this.API.MODELS[modelId];
        return model ? model.name : modelId;
    },
    
    // Get model provider
    getModelProvider(modelId) {
        const model = this.API.MODELS[modelId];
        return model ? model.provider : 'Unknown';
    },
    
    // Validate model ID
    isValidModel(modelId) {
        return Object.keys(this.API.MODELS).includes(modelId);
    }
};

export default Config;
