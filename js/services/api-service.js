class APIService {
    constructor() {
        this.config = window.API_CONFIG || {
            WORKER_URL: "https://promptcraft-api.vijay-shagunkumar.workers.dev",
            API_KEY_HEADER: "x-api-key",
            DEFAULT_API_KEY: "promptcraft-app-secret-123",
            TIMEOUT: 30000,
            RETRY_ATTEMPTS: 2
        };
        
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    async generatePrompt(prompt, model = null) {
        const selectedModel = model || localStorage.getItem("promptcrafter_model") || "gemini-1.5-flash";
        const cacheKey = `${selectedModel}:${prompt.substring(0, 100)}`;
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('Returning cached prompt');
            return cached;
        }
        
        try {
            const response = await fetch(this.config.WORKER_URL, {
                method: 'POST',
                headers: { 
                    "Content-Type": "application/json",
                    [this.config.API_KEY_HEADER]: this.config.DEFAULT_API_KEY
                },
                body: JSON.stringify({ 
                    prompt: prompt,
                    model: selectedModel
                }),
                signal: AbortSignal.timeout(this.config.TIMEOUT)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            const result = {
                prompt: data.result || "",
                model: selectedModel,
                modelName: window.MODEL_CONFIG?.[selectedModel]?.name || selectedModel,
                provider: data.provider || "unknown",
                usage: data.usage || {},
                success: true
            };
            
            // Cache the result
            this.setCache(cacheKey, result);
            
            return result;
            
        } catch (error) {
            console.error("API Service Error:", error);
            
            // Return fallback result
            return {
                prompt: "",
                model: selectedModel,
                modelName: window.MODEL_CONFIG?.[selectedModel]?.name || selectedModel,
                provider: "local",
                usage: {},
                success: false,
                error: error.message,
                fallback: true
            };
        }
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.config.WORKER_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    connected: true,
                    status: data.status || 'unknown',
                    version: data.version || 'unknown',
                    models: data.models || []
                };
            }
            
            return { connected: false, error: `HTTP ${response.status}` };
            
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    // Cache management
    getFromCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Cleanup old cache entries
        this.cleanupCache();
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.cacheTTL) {
                this.cache.delete(key);
            }
        }
    }

    clearCache() {
        this.cache.clear();
    }

    // Batch processing
    async batchGenerate(prompts, model = null) {
        const results = [];
        
        for (const prompt of prompts) {
            try {
                const result = await this.generatePrompt(prompt, model);
                results.push(result);
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                results.push({
                    prompt: "",
                    model: model || "gemini-1.5-flash",
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // Get available models
    getAvailableModels() {
        return Object.entries(window.MODEL_CONFIG || {}).map(([id, config]) => ({
            id,
            name: config.name,
            provider: config.provider,
            free: config.free || false,
            recommended: config.recommended || false,
            description: config.description || ""
        }));
    }

    // Update API configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    // Get current configuration
    getConfig() {
        return { ...this.config };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}
