/**
 * API Service for PromptCraft Pro
 * Communicates with Cloudflare Worker backend
 */

class APIService {
    constructor() {
        // Get API endpoint from config
        this.endpoint = Config.getApiUrl();
        this.apiKey = ''; // Your API key if needed
        
        // Request configuration
        this.config = {
            timeout: 30000,
            maxRetries: 2,
            retryDelay: 1000
        };
        
        // Rate limiting state
        this.rateLimit = {
            minuteRemaining: 20,
            dailyRemaining: 500,
            lastReset: Date.now()
        };
        
        // Request history
        this.history = [];
        this.totalRequests = 0;
        this.successfulRequests = 0;
        this.failedRequests = 0;
    }
    
    /**
     * Generate a prompt using the AI service
     */
    async generatePrompt(userInput, options = {}) {
        const startTime = Date.now();
        const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        Config.debug(`Generating prompt with model: ${options.model || 'default'}`);
        
        try {
            // Prepare request
            const requestBody = {
                prompt: userInput,
                model: options.model || Config.getDefaultModel(),
                ...options
            };
            
            // Clean up undefined properties
            Object.keys(requestBody).forEach(key => {
                if (requestBody[key] === undefined) {
                    delete requestBody[key];
                }
            });
            
            // Make API call
            const response = await this.makeRequest(requestBody, requestId);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            // Update stats
            this.totalRequests++;
            this.successfulRequests++;
            
            // Log to history
            this.history.push({
                id: requestId,
                timestamp: new Date().toISOString(),
                input: userInput.substring(0, 100),
                model: options.model || Config.getDefaultModel(),
                responseTime,
                success: true
            });
            
            // Trim history if too long
            if (this.history.length > 100) {
                this.history = this.history.slice(-50);
            }
            
            Config.info(`Prompt generated in ${responseTime}ms`);
            
            return {
                success: true,
                content: response.result || response.content,
                model: response.model || options.model,
                provider: response.provider || 'unknown',
                responseTime,
                requestId,
                usage: response.usage,
                rateLimit: response.rateLimit
            };
            
        } catch (error) {
            this.totalRequests++;
            this.failedRequests++;
            
            Config.error(`Prompt generation failed:`, error.message);
            
            return {
                success: false,
                error: error.message,
                requestId,
                fallbackUsed: true
            };
        }
    }
    
    /**
     * Make actual API request with retry logic
     */
    async makeRequest(body, requestId, retryCount = 0) {
        try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            
            // Make request
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Request-ID': requestId,
                    ...(this.apiKey && { 'X-API-Key': this.apiKey })
                },
                body: JSON.stringify(body),
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit'
            });
            
            clearTimeout(timeoutId);
            
            // Handle response
            if (!response.ok) {
                throw this.handleErrorResponse(response, requestId);
            }
            
            const data = await response.json();
            
            // Update rate limit from headers
            this.updateRateLimit(response.headers);
            
            return data;
            
        } catch (error) {
            // Retry logic
            if (retryCount < this.config.maxRetries) {
                Config.warn(`Retrying request (${retryCount + 1}/${this.config.maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
                return this.makeRequest(body, requestId, retryCount + 1);
            }
            
            throw error;
        }
    }
    
    /**
     * Handle API errors
     */
    handleErrorResponse(response, requestId) {
        const status = response.status;
        const errors = {
            400: 'Invalid request format',
            401: 'Authentication failed',
            403: 'Access denied',
            404: 'API endpoint not found',
            429: 'Rate limit exceeded',
            500: 'Internal server error',
            502: 'Bad gateway',
            503: 'Service unavailable',
            504: 'Gateway timeout'
        };
        
        const message = errors[status] || `HTTP ${status}`;
        return new Error(`${message} [${requestId}]`);
    }
    
    /**
     * Update rate limit information
     */
    updateRateLimit(headers) {
        const minuteRemaining = headers.get('X-RateLimit-Remaining');
        const dailyRemaining = headers.get('X-RateLimit-Daily-Remaining');
        
        if (minuteRemaining !== null) {
            this.rateLimit.minuteRemaining = parseInt(minuteRemaining);
        }
        
        if (dailyRemaining !== null) {
            this.rateLimit.dailyRemaining = parseInt(dailyRemaining);
        }
        
        this.rateLimit.lastReset = Date.now();
    }
    
    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const startTime = Date.now();
            const response = await fetch(this.endpoint + '/health', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });
            
            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                return {
                    online: true,
                    responseTime,
                    status: data.status || 'healthy',
                    models: data.models || [],
                    environment: data.environment || 'unknown',
                    version: data.version || 'unknown'
                };
            }
            
            return {
                online: false,
                responseTime,
                status: 'unhealthy',
                statusCode: response.status
            };
            
        } catch (error) {
            Config.warn('API connection test failed:', error.message);
            return {
                online: false,
                status: 'offline',
                error: error.message
            };
        }
    }
    
    /**
     * Fallback prompt generation (when API is offline)
     */
    generateFallbackPrompt(userInput, style = 'detailed') {
        const templates = {
            detailed: `# Expert AI Assistant Prompt

## Role Specification
You are an expert AI assistant with specialized knowledge in this domain.

## Primary Task
${userInput}

## Detailed Requirements
1. Provide comprehensive analysis with specific examples
2. Include actionable insights and practical recommendations
3. Structure the response with clear, logical sections
4. Use professional terminology appropriate for context
5. Consider potential edge cases and limitations
6. Offer data-driven insights where applicable

## Response Structure
- Executive Summary: Brief overview of key findings
- Detailed Analysis: In-depth examination of all aspects
- Actionable Recommendations: Specific suggestions
- Next Steps: Clear guidance for implementation
- Considerations: Important factors and risks

## Quality Standards
- Clarity: Use clear, concise language
- Depth: Provide thorough analysis
- Practicality: Focus on real-world applications
- Professionalism: Maintain appropriate tone`,
            
            concise: `# Task Specification
${userInput}

# Response Requirements
- Be direct and to the point
- Focus on essential information
- Use clear, simple language
- Avoid unnecessary elaboration
- Structure with bullet points where helpful`,
            
            creative: `# Creative Task
${userInput}

# Creative Approach
- Use innovative thinking and imaginative solutions
- Incorporate storytelling elements
- Focus on unique perspectives
- Engage with vivid, descriptive language
- Balance creativity with practical application

# Style Guidelines
- Engaging and inspiring tone
- Rich sensory descriptions
- Metaphorical language where effective
- Emotional resonance without sentimentality`,
            
            analytical: `# Analytical Task
${userInput}

# Analysis Framework
1. Key Metrics: Identify relevant quantitative measures
2. Trend Analysis: Examine patterns over time
3. Comparative Assessment: Evaluate against alternatives
4. Risk Evaluation: Identify and assess risks
5. Data-Driven Recommendations: Base suggestions on evidence

# Reporting Requirements
- Objective, unbiased language
- Clear distinction between facts and interpretations
- Visual representation suggestions
- Executive summary of findings`
        };
        
        return templates[style] || templates.detailed;
    }
    
    /**
     * Get API statistics
     */
    getStats() {
        const successRate = this.totalRequests > 0 
            ? Math.round((this.successfulRequests / this.totalRequests) * 100) 
            : 100;
        
        return {
            totalRequests: this.totalRequests,
            successfulRequests: this.successfulRequests,
            failedRequests: this.failedRequests,
            successRate: `${successRate}%`,
            rateLimit: this.rateLimit,
            historyCount: this.history.length
        };
    }
    
    /**
     * Get rate limit status
     */
    getRateLimitStatus() {
        return {
            ...this.rateLimit,
            minuteLimit: 20,
            dailyLimit: 500,
            used: 500 - this.rateLimit.dailyRemaining
        };
    }
    
    /**
     * Clear API history
     */
    clearHistory() {
        this.history = [];
        this.totalRequests = 0;
        this.successfulRequests = 0;
        this.failedRequests = 0;
    }
}

// Create singleton instance
const apiService = new APIService();

// Make globally available
window.APIService = APIService;
window.apiService = apiService;
