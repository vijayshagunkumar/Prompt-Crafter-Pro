// API Service for PromptCraft Pro
console.log("[API] Loading API service...");

class APIService {
    constructor() {
        this.baseURL = Config.API.ENDPOINT;
        this.activeRequests = new Map();
        console.log("[API] Initialized with endpoint:", this.baseURL);
    }

    // ✅ FIXED: Removed x-request-id header that was causing CORS errors
    async makeRequest(endpoint, data, method = 'POST') {
        const url = `${this.baseURL}${endpoint}`;
        const startTime = Date.now();
        const requestId = Utils.String.generateId?.() || Date.now().toString(36);
        
        console.log(`[API ${requestId}] ${method} ${url}`, data ? "with data" : "no data");
        
        // Track request for cancellation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Config.API.TIMEOUT);
        this.activeRequests.set(requestId, controller);
        
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    // ⚠️ REMOVED: 'x-request-id': requestId,  // This was causing CORS errors
                    ...(Config.API.KEY ? { 'Authorization': `Bearer ${Config.API.KEY}` } : {})
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
                    // Ignore JSON parse errors for error responses
                }
                throw new Error(errorMessage);
            }
            
            const responseData = await response.json();
            console.log(`[API ${requestId}] Success:`, responseData.success !== false);
            
            return responseData;
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`[API ${requestId}] Request failed:`, error.message);
            
            // Enhanced error messages
            let userMessage = "Network error. Please check your connection.";
            
            if (error.name === 'AbortError') {
                userMessage = "Request timeout. Please try again.";
            } else if (error.message.includes('Failed to fetch')) {
                userMessage = "Cannot connect to server. Please check if the API is running.";
            } else if (error.message.includes('CORS')) {
                userMessage = "Cross-origin request blocked. Please contact administrator.";
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
        
        if (prompt.length > Config.APP.MAX_INPUT_LENGTH) {
            throw new Error(`Task description too long (max ${Config.APP.MAX_INPUT_LENGTH} characters)`);
        }
        
        try {
            showNotification("Generating optimized prompt...", "info", 2000);
            
            const data = {
                prompt: prompt.trim(),
                model: model
            };
            
            const response = await this.makeRequest("/", data, "POST");
            
            if (!response.success) {
                throw new Error(response.error || "Failed to generate prompt");
            }
            
            console.log("[API] Prompt generated successfully:", {
                model: response.model,
                length: response.result?.length || 0
            });
            
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

    async checkStatus() {
        console.log("[API] Checking status...");
        
        try {
            // Simple HEAD request to check connectivity
            const startTime = Date.now();
            await fetch(this.baseURL, {
                method: 'HEAD',
                mode: 'no-cors' // This doesn't require CORS
            });
            const latency = Date.now() - startTime;
            
            return {
                online: true,
                latency: latency,
                message: `Connected (${latency}ms)`
            };
            
        } catch (error) {
            console.warn("[API] Status check failed:", error.message);
            return {
                online: false,
                latency: null,
                message: error.message
            };
        }
    }

    cancelAllRequests() {
        console.log("[API] Cancelling all active requests");
        for (const [id, controller] of this.activeRequests) {
            controller.abort();
            console.log(`[API] Cancelled request ${id}`);
        }
        this.activeRequests.clear();
    }
}

// Create global instance
window.APIService = APIService;
console.log("[API] Service loaded and ready");
