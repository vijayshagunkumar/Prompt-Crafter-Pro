/**
 * Configuration for PromptCraft Pro
 */

const Config = {
    // ==============================
    // API Configuration
    // ==============================
    API: {
        ENDPOINT: 'https://promptcraft-api.vijay-shagunkumar.workers.dev',
        LOCAL_ENDPOINT: 'http://localhost:8787',

        // ⏱️ CRITICAL: timeouts (ms)
        TIMEOUTS: {
            HEALTH: 3000,
            STATUS: 3000,
            GENERATE: 30000,
            DEFAULT: 10000
        },

        // Available models (SINGLE SOURCE OF TRUTH)
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

        // Rate limits (Cloudflare Worker)
        RATE_LIMITS: {
            PER_MINUTE: 20,
            PER_DAY: 500,
            WINDOW_MS: 60000,
            BLOCK_DURATION_MS: 900000
        }
    },

    // ==============================
    // Frontend Configuration
    // ==============================
    FRONTEND: {
        VERSION: '2.0.1',
        BUILD_DATE: '2026-01-03',

        GITHUB_REPO: 'https://github.com/vijay-shagunkumar/promptcraft',
        GITHUB_PAGES_URL: 'https://vijay-shagunkumar.github.io/promptcraft',

        FEATURES: {
            REAL_API: true,
            OFFLINE_FALLBACK: true,
            SPEECH: true,
            HISTORY: true,
            EXPORT: true
        },

        UI: {
            DEFAULT_THEME: 'dark',
            ANIMATIONS: true,
            SMOOTH_SCROLL: true,
            REDUCED_MOTION: false
        }
    },

    // ==============================
    // Storage
    // ==============================
    STORAGE: {
        PREFIX: 'promptcraft_',
        VERSION: '1.0'
    },

    // ==============================
    // Helpers
    // ==============================
    getApiUrl() {
        const host = window.location.hostname;
        return (host === 'localhost' || host === '127.0.0.1')
            ? this.API.LOCAL_ENDPOINT
            : this.API.ENDPOINT;
    },

    getDefaultModel() {
        return this.API.DEFAULT_MODEL;
    },

    getModel(modelId) {
        return this.API.MODELS[modelId] || null;
    },

    getAvailableModels() {
        return Object.entries(this.API.MODELS).map(([id, cfg]) => ({
            id,
            ...cfg
        }));
    },

    isValidModel(modelId) {
        return Boolean(this.API.MODELS[modelId]);
    },

    getStorageKey(key) {
        return `${this.STORAGE.PREFIX}${key}_v${this.STORAGE.VERSION}`;
    },

    sanitizeInput(text) {
        if (!text) return '';

        let sanitized = String(text);

        const blockedPatterns = [
            /<script.*?>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi
        ];

        blockedPatterns.forEach(p => {
            sanitized = sanitized.replace(p, '');
        });

        return sanitized.substring(0, 5000).trim();
    },

    validatePrompt(prompt) {
        if (typeof prompt !== 'string') {
            return { valid: false, error: 'Prompt must be text' };
        }

        const trimmed = prompt.trim();

        if (!trimmed) {
            return { valid: false, error: 'Prompt cannot be empty' };
        }

        if (trimmed.length < 3) {
            return { valid: false, error: 'Prompt is too short' };
        }

        if (trimmed.length > 5000) {
            return { valid: false, error: 'Prompt too long (max 5000 chars)' };
        }

        return { valid: true, trimmed, length: trimmed.length };
    },

    // ==============================
    // Logging helpers
    // ==============================
    debug(...args) {
        if (window.debugMode) console.log('[PromptCraft]', ...args);
    },
    info(...args) {
        console.info('[PromptCraft]', ...args);
    },
    warn(...args) {
        console.warn('[PromptCraft]', ...args);
    },
    error(...args) {
        console.error('[PromptCraft]', ...args);
    }
};

// Global export
window.Config = Config;
