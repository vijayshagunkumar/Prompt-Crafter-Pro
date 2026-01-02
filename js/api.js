import Config from './config.js';

/**
 * API Service for PromptCraft Pro
 * Communicates with Cloudflare Worker backend
 */

class APIService {
    constructor() {
        this.apiUrl = Config.getApiUrl();
        this.apiKey = ''; // Not needed for public API
        
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': `PromptCraft-Pro/${Config.FRONTEND.VERSION}`
        };
        
        this.rateLimitInfo = {
            minuteRemaining: Config.API.RATE_LIMITS.MINUTE,
            dailyRemaining: Config.API.RATE_LIMITS.DAILY,
            lastReset: Date.now()
        };
        
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalResponseTime: 0,
            lastRequestTime: null
        };
    }

    /**
     * Generate a prompt using AI
     */
    async generatePrompt(userInput, options = {}) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        
        this.stats.totalRequests++;
        
        console.log(`[API ${requestId}] Generating with model: ${options.model || Config.getDefaultModel()}`);
        
        try {
            // Prepare request body
            const requestBody = {
                prompt: userInput,
                model: options.model || Config.getDefaultModel(),
                ...options
            };
            
            // Remove undefined properties
            Object.keys(requestBody).forEach(key => 
                requestBody[key] === undefined && delete requestBody[key]
            );
            
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(), 
                Config.API.REQUEST_CONFIG.timeout
            );
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw this.handleApiError(response, requestId);
            }
            
            const data = await response.json();
            
            // Update rate limit info
            this.updateRateLimitInfo(response);
            
            // Update stats
            const responseTime = Date.now() - startTime;
            this.updateStats(responseTime, true);
            
            console.log(`[API ${requestId}] Success in ${responseTime}ms`);
            
            return {
                success: true,
                content: data.result,
                model: data.model,
                provider: data.provider,
                usage: data.usage,
                requestId: data.requestId || requestId,
                rateLimit: data.rateLimit || this.rateLimitInfo,
                responseTime: responseTime,
                timestamp: data.timestamp || new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`[API ${requestId}] Error:`, error.message);
            
            // Update stats
            this.updateStats(Date.now() - startTime, false);
            
            // Retry logic
            const retryCount = options.retryCount || 0;
            if (retryCount < Config.API.REQUEST_CONFIG.maxRetries) {
                console.log(`[API ${requestId}] Retrying (${retryCount + 1}/${Config.API.REQUEST_CONFIG.maxRetries})...`);
                
                await new Promise(resolve => 
                    setTimeout(resolve, Config.API.REQUEST_CONFIG.retryDelay)
                );
                
                return this.generatePrompt(userInput, {
                    ...options,
                    retryCount: retryCount + 1
                });
            }
            
            return {
                success: false,
                error: error.message,
                requestId: requestId,
                fallbackUsed: true
            };
        }
    }

    /**
     * Handle API errors
     */
    handleApiError(response, requestId) {
        const status = response.status;
        let message = `HTTP ${status}`;
        let userMessage = 'An error occurred';
        
        switch (status) {
            case 400:
                message = 'Invalid request';
                userMessage = 'Please check your input format';
                break;
            case 401:
                message = 'Authentication failed';
                userMessage = 'API authentication error';
                break;
            case 403:
                message = 'Access denied';
                userMessage = 'You do not have access to this resource';
                break;
            case 429:
                message = 'Rate limit exceeded';
                userMessage = 'Too many requests. Please wait a moment.';
                break;
            case 500:
                message = 'Internal server error';
                userMessage = 'AI service is experiencing issues';
                break;
            case 502:
                message = 'Bad gateway';
                userMessage = 'Service temporarily unavailable';
                break;
            case 503:
                message = 'Service unavailable';
                userMessage = 'AI service is currently down';
                break;
            case 504:
                message = 'Gateway timeout';
                userMessage = 'Request timed out. Please try again.';
                break;
        }
        
        return new Error(`${userMessage} (${message}) [${requestId}]`);
    }

    /**
     * Update rate limit information from response headers
     */
    updateRateLimitInfo(response) {
        const minuteRemaining = response.headers.get('X-RateLimit-Remaining');
        const dailyRemaining = response.headers.get('X-RateLimit-Daily-Remaining');
        
        if (minuteRemaining) {
            this.rateLimitInfo.minuteRemaining = parseInt(minuteRemaining);
        }
        
        if (dailyRemaining) {
            this.rateLimitInfo.dailyRemaining = parseInt(dailyRemaining);
        }
        
        this.rateLimitInfo.lastReset = Date.now();
    }

    /**
     * Update statistics
     */
    updateStats(responseTime, success) {
        if (success) {
            this.stats.successfulRequests++;
            this.stats.totalResponseTime += responseTime;
        } else {
            this.stats.failedRequests++;
        }
        
        this.stats.lastRequestTime = new Date().toISOString();
    }

    /**
     * Get API statistics
     */
    getStats() {
        const successRate = this.stats.totalRequests > 0 
            ? (this.stats.successfulRequests / this.stats.totalRequests) * 100 
            : 100;
        
        const avgResponseTime = this.stats.successfulRequests > 0
            ? Math.round(this.stats.totalResponseTime / this.stats.successfulRequests)
            : 0;
        
        return {
            ...this.stats,
            successRate: Math.round(successRate),
            averageResponseTime: avgResponseTime,
            rateLimit: this.rateLimitInfo
        };
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    online: true,
                    status: data.status,
                    models: data.models,
                    environment: data.environment,
                    version: data.version
                };
            }
            
            return {
                online: false,
                status: 'unhealthy',
                statusCode: response.status
            };
            
        } catch (error) {
            return {
                online: false,
                status: 'offline',
                error: error.message
            };
        }
    }

    /**
     * Get available models
     */
    getAvailableModels() {
        return Config.API.MODELS;
    }

    /**
     * Get model display name
     */
    getModelDisplayName(modelId) {
        return Config.getModelDisplayName(modelId);
    }

    /**
     * Get model provider
     */
    getModelProvider(modelId) {
        return Config.getModelProvider(modelId);
    }

    /**
     * Get rate limit status
     */
    getRateLimitStatus() {
        return {
            ...this.rateLimitInfo,
            minuteLimit: Config.API.RATE_LIMITS.MINUTE,
            dailyLimit: Config.API.RATE_LIMITS.DAILY,
            used: Config.API.RATE_LIMITS.DAILY - this.rateLimitInfo.dailyRemaining
        };
    }

    /**
     * Fallback prompt generation
     */
    generateFallbackPrompt(userInput, style = 'detailed') {
        const promptStyles = {
            detailed: `# Expert AI Assistant Prompt
## Role Specification
You are an expert AI assistant with specialized knowledge in this domain.

## Primary Task
${userInput}

## Detailed Requirements
1. Provide comprehensive, detailed analysis with specific examples
2. Include actionable insights and practical recommendations
3. Structure the response with clear, logical sections
4. Use professional terminology appropriate for the context
5. Consider potential edge cases, limitations, and alternative approaches
6. Offer data-driven insights where applicable

## Response Structure
- Executive Summary: Brief overview of key findings
- Detailed Analysis: In-depth examination of all relevant aspects
- Actionable Recommendations: Specific, implementable suggestions
- Next Steps: Clear guidance for implementation
- Considerations: Important factors, risks, and limitations

## Quality Standards
- Clarity: Use clear, concise language
- Depth: Provide thorough analysis without unnecessary verbosity
- Practicality: Focus on actionable, real-world applications
- Professionalism: Maintain appropriate tone for business/technical contexts`,

            concise: `# Task Specification
${userInput}

# Response Requirements
- Be direct and to the point
- Focus on essential information only
- Use clear, simple language
- Avoid elaboration unless necessary
- Structure with bullet points where helpful`,

            creative: `# Creative Task
${userInput}

# Creative Approach
- Use innovative thinking and imaginative solutions
- Incorporate storytelling elements where appropriate
- Focus on unique perspectives and original ideas
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
1. **Key Metrics & Data Points**: Identify relevant quantitative measures
2. **Trend Analysis**: Examine patterns and changes over time
3. **Comparative Assessment**: Evaluate against benchmarks or alternatives
4. **Risk Evaluation**: Identify and assess potential risks
5. **Data-Driven Recommendations**: Base suggestions on evidence
6. **Supporting Evidence**: Reference sources and data validity

# Reporting Requirements
- Objective, unbiased language
- Clear distinction between facts and interpretations
- Visual representation suggestions (charts, graphs)
- Executive summary of findings`,

            professional: `# Professional Business Request
${userInput}

# Response Structure
## Executive Summary
- Brief overview of key points and recommendations

## Background & Context
- Relevant background information
- Current situation analysis

## Detailed Analysis
- Thorough examination of all relevant factors
- Supporting data and evidence

## Strategic Recommendations
- Actionable business recommendations
- Implementation considerations
- Expected outcomes and benefits

## Risk Assessment
- Potential challenges and mitigation strategies
- Contingency planning

## Next Steps
- Specific action items
- Timeline and responsibilities
- Success metrics

# Professional Standards
- Formal, business-appropriate tone
- Professional formatting and structure
- Citation of sources where applicable
- Balanced consideration of stakeholder perspectives`
        };

        return promptStyles[style] || promptStyles.detailed;
    }
}

// Export singleton instance
const apiService = new APIService();
export default apiService;
