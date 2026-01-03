// API Service for PromptCraft Pro
console.log("[API] Loading API service...");

class APIService {
    constructor() {
        // Use environment-aware endpoint if available
        this.baseURL = typeof Config.getApiUrl === 'function'
            ? Config.getApiUrl()
            : Config.API.ENDPOINT;

        this.activeRequests = new Map();

        console.log("[API] Initialized with endpoint:", this.baseURL);
    }

    /**
     * Core request handler
     */
    async makeRequest(endpoint, data, method = 'POST', timeoutType = 'DEFAULT') {
        const url = `${this.baseURL}${endpoint}`;
        const startTime = Date.now();
        const requestId = Date.now().toString(36);

        console.log(`[API ${requestId}] ${method} ${url}`);

        const controller = new AbortController();

        const timeout =
            Config.API.TIMEOUTS?.[timeoutType.toUpperCase()] ??
            Config.API.TIMEOUTS?.DEFAULT ??
            15000;

        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);

        this.activeRequests.set(requestId, controller);

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: method !== 'GET' ? JSON.stringify(data) : undefined,
                signal: controller.signal
            });

            const latency = Date.now() - startTime;
            console.log(`[API ${requestId}] Response ${response.status} in ${latency}ms`);

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (_) {
                    // Ignore JSON parse errors
                }
                throw new Error(errorMessage);
            }

            const responseData = await response.json();
            console.log(`[API ${requestId}] Success`, responseData);

            return responseData;

        } catch (error) {
            let userMessage = "Network error";

            if (error.name === 'AbortError') {
                userMessage = "Request timeout. Please try again.";
            } else if (error.message.includes('Failed to fetch')) {
                userMessage = "Cannot connect to server";
            } else if (error.message.includes('CORS')) {
                userMessage = "Connection blocked by CORS";
            } else if (error.message) {
                userMessage = error.message;
            }

            console.error(`[API ${requestId}] Request failed:`, userMessage);
            throw new Error(userMessage);

        } finally {
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);
        }
    }

    /**
     * Generate optimized prompt
     */
    async generatePrompt(data) {
        console.log("[API] Generating prompt with data:", data);
        
        // Handle both formats:
        // Format 1: { model: 'model-name', prompt: 'prompt text' }
        // Format 2: (string prompt, string model) - backward compatibility
        
        let requestData;
        if (typeof data === 'string') {
            // Backward compatibility: generatePrompt(prompt, model)
            const model = arguments[1] || Config.getDefaultModel();
            requestData = {
                model: model,
                prompt: data
            };
        } else if (typeof data === 'object') {
            // New format: generatePrompt({ model, prompt })
            requestData = data;
        } else {
            throw new Error("Invalid data format for generatePrompt");
        }

        if (!requestData.prompt || !requestData.prompt.trim()) {
            throw new Error("Please enter a task description first.");
        }

        if (!requestData.model) {
            requestData.model = Config.getDefaultModel();
        }

        console.log("[API] Sending request:", requestData);

        const response = await this.makeRequest(
            "/",
            requestData,
            "POST",
            "GENERATE"
        );

        console.log("[API] Response received:", response);

        // Handle different response formats
        if (!response.success) {
            throw new Error(response.error || "Failed to generate prompt");
        }

        // Your Worker returns 'result', but the app expects 'prompt'
        const promptText = response.result || response.prompt || "";
        
        if (!promptText) {
            throw new Error("No prompt generated");
        }

        console.log("[API] Prompt generated successfully");

        return {
            prompt: promptText,
            model: response.model || requestData.model,
            provider: response.provider || "unknown",
            usage: response.usage || {},
            rateLimit: response.rateLimit || {}
        };
    }

    /**
     * Health check
     */
    async checkHealth() {
        console.log("[API] Checking health...");

        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                return {
                    status: 'error',
                    online: false,
                    message: `API returned ${response.status}`
                };
            }

            const data = await response.json();
            console.log("[API] Health check response:", data);

            return {
                status: data.status || 'unknown',
                online: true,
                version: data.version,
                models: data.models || [],
                environment: data.environment
            };

        } catch (error) {
            console.warn("[API] Health check failed:", error.message);
            return {
                status: 'offline',
                online: false,
                message: error.message
            };
        }
    }

    /**
     * Lightweight connectivity check
     */
    async checkStatus() {
        console.log("[API] Checking status...");

        try {
            const startTime = Date.now();
            await fetch(this.baseURL, { method: 'HEAD', mode: 'no-cors' });
            const latency = Date.now() - startTime;

            return {
                online: true,
                latency,
                message: `Connected (${latency}ms)`
            };

        } catch (error) {
            return {
                online: false,
                latency: null,
                message: error.message
            };
        }
    }

    /**
     * Cancel all in-flight requests
     */
    cancelAllRequests() {
        console.log("[API] Cancelling all active requests");
        for (const controller of this.activeRequests.values()) {
            controller.abort();
        }
        this.activeRequests.clear();
    }
}

// Make globally available
window.APIService = APIService;

// Create singleton instance safely
try {
    if (window.Config?.API?.ENDPOINT) {
        window.apiService = new APIService();
        console.log("[API] Created global apiService instance");
    } else {
        console.warn("[API] Config not ready, delaying apiService creation");
        setTimeout(() => {
            if (!window.apiService && window.Config?.API?.ENDPOINT) {
                window.apiService = new APIService();
                console.log("[API] Created delayed apiService instance");
            }
        }, 500);
    }
} catch (error) {
    console.error("[API] Failed to create apiService:", error);
    window.apiService = new APIService();
}

console.log("[API] Service loaded and ready");
