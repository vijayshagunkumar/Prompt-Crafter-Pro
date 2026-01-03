// API Service for PromptCraft Pro
console.log("[API] Loading API service...");

class APIService {
    constructor() {
        this.baseURL = Config.API.ENDPOINT;
        this.activeRequests = new Map();
        console.log("[API] Initialized with endpoint:", this.baseURL);
    }

    async makeRequest(endpoint, data, method = 'POST') {
        const url = `${this.baseURL}${endpoint}`;
        const startTime = Date.now();
        const requestId = Date.now().toString(36);
        
        console.log(`[API ${requestId}] ${method} ${url}`);
        
        // Track request for cancellation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Config.API.TIMEOUT);
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
            
            clearTimeout(timeoutId);
            const latency = Date.now() - startTime;
            
            console.log(`[API ${requestId}] Response ${response.status} in ${latency}ms`);
            
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // Ignore JSON parse errors
                }
                throw new Error(errorMessage);
            }
            
            const responseData = await response.json();
            console.log(`[API ${requestId}] Success`);
            
            return responseData;
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`[API ${requestId}] Request failed:`, error.message);
            
            let userMessage = "Network error";
            if (error.name === 'AbortError') {
                userMessage = "Request timeout";
            } else if (error.message.includes('Failed to fetch')) {
                userMessage = "Cannot connect to server";
            } else if (error.message.includes('CORS')) {
                userMessage = "Connection blocked by CORS";
            }
            
            throw new Error(userMessage);
            
        } finally {
            this.activeRequests.delete(requestId);
            clearTimeout(timeoutId);
        }
    }

    async generatePrompt(prompt, model = Config.MODELS.DEFAULT) {
        console.log("[API] Generating prompt with model:", model);
        
        if (!prompt || prompt.trim().length === 0) {
            throw new Error("Please enter a task description first.");
        }
        
        try {
            const data = {
                prompt: prompt.trim(),
                model: model
            };
            
            const response = await this.makeRequest("/", data, "POST");
            
            if (!response.success) {
                throw new Error(response.error || "Failed to generate prompt");
            }
            
            console.log("[API] Prompt generated successfully");
            
            return {
                prompt: response.result,
                model: response.model,
                provider: response.provider || "google",
                usage: response.usage || {},
                requestId: response.requestId,
                rateLimit: response.rateLimit || {}
            };
            
        } catch (error) {
            console.error("[API] Generation failed:", error);
            throw error;
        }
    }

    async checkHealth() {
        console.log("[API] Checking health...");
        
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                return {
                    status: 'error',
                    online: false,
                    message: `API returned ${response.status}`
                };
            }
            
            const data = await response.json();
            return {
                status: data.status || 'unknown',
                online: true,
                message: 'API is online',
                version: data.version,
                models: data.models,
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

    cancelAllRequests() {
        console.log("[API] Cancelling all active requests");
        for (const [id, controller] of this.activeRequests) {
            controller.abort();
        }
        this.activeRequests.clear();
    }
}

// Create global instance
window.APIService = APIService;
console.log("[API] Service loaded and ready");
