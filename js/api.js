/**
 * API Service for PromptCraft Pro
 * Communicates with Cloudflare Worker backend
 * Matches the worker.js API structure
 */

class API {
    constructor() {
        // Production API endpoint
        this.apiUrl = 'https://promptcraft-api.vijay-shagunkumar.workers.dev';
        
        // Local development endpoint
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1') {
            this.apiUrl = 'http://127.0.0.1:8787';
        }
        
        // API Key from your worker environment variable
        this.apiKey = ''; // Will be injected via environment
        
        // Model mapping
        this.availableModels = {
            'gemini-3-flash-preview': {
                name: 'Gemini 3 Flash',
                provider: 'Google',
                description: 'Latest Gemini 3 model'
            },
            'gemini-1.5-flash-latest': {
                name: 'Gemini 1.5 Flash',
                provider: 'Google',
                description: 'Fast and capable model'
            },
            'gpt-4o-mini': {
                name: 'GPT-4o Mini',
                provider: 'OpenAI',
                description: 'Cost-effective GPT-4 variant'
            },
            'llama-3.1-8b-instant': {
                name: 'Llama 3.1 8B',
                provider: 'Groq',
                description: 'Fast Llama model via Groq'
            }
        };
        
        // Default headers
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'PromptCraft-Pro-Frontend/1.0'
        };
        
        // Add API key to headers if available
        if (this.apiKey) {
            this.headers['X-API-Key'] = this.apiKey;
        }
        
        // Rate limiting state
        this.rateLimitInfo = {
            minuteRemaining: 20,
            dailyRemaining: 500,
            lastReset: Date.now()
        };
        
        // Retry configuration
        this.retryConfig = {
            maxRetries: 2,
            retryDelay: 1000,
            timeout: 30000
        };
    }

    /**
     * Generate a prompt using the AI service
     */
    async generatePrompt(userInput, options = {}) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`[API ${requestId}] Generating prompt with model: ${options.model || 'default'}`);
        
        try {
            // Prepare request body
            const requestBody = {
                prompt: userInput,
                model: options.model || 'gemini-3-flash-preview',
                ...options
            };
            
            // Remove undefined properties
            Object.keys(requestBody).forEach(key => 
                requestBody[key] === undefined && delete requestBody[key]
            );
            
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.retryConfig.timeout);
            
            // FIXED: Added mode and credentials
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal,
                mode: 'cors', // Added
                credentials: 'omit' // Added
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw this.handleApiError(response.status, errorData, requestId);
            }
            
            const data = await response.json();
            
            // Update rate limit info from response headers
            this.updateRateLimitInfo(response);
            
            console.log(`[API ${requestId}] Success: ${data.model} via ${data.provider}`);
            
            return {
                success: true,
                content: data.result,
                model: data.model,
                provider: data.provider,
                usage: data.usage,
                requestId: data.requestId || requestId,
                rateLimit: data.rateLimit,
                timestamp: data.timestamp
            };
            
        } catch (error) {
            console.error(`[API ${requestId}] Error:`, error.message);
            
            // Retry logic
            const retryCount = options.retryCount || 0;
            
            if (retryCount < this.retryConfig.maxRetries && 
                !error.message.includes('timeout') &&
                !error.message.includes('rate limit')) {
                
                console.log(`[API ${requestId}] Retrying (${retryCount + 1}/${this.retryConfig.maxRetries})...`);
                
                await new Promise(resolve => 
                    setTimeout(resolve, this.retryConfig.retryDelay)
                );
                
                return this.generatePrompt(userInput, {
                    ...options,
                    retryCount: retryCount + 1
                });
            }
            
            return {
                success: false,
                error: error.message,
                requestId,
                fallbackUsed: true
            };
        }
    }

    /**
     * Handle API errors
     */
    handleApiError(statusCode, errorData, requestId) {
        const errors = {
            400: { message: errorData.error || 'Invalid request format' },
            401: { message: 'Authentication failed' },
            403: { message: 'Access denied' },
            404: { message: 'API endpoint not found' },
            429: { message: 'Rate limit exceeded' },
            500: { message: errorData.error || 'Internal server error' },
            502: { message: 'Bad gateway' },
            503: { message: 'Service unavailable' },
            504: { message: 'Gateway timeout' }
        };
        
        const error = errors[statusCode] || {
            message: errorData.error || `HTTP ${statusCode}`
        };
        
        return new Error(`${error.message} [${requestId}]`);
    }

    /**
     * Update rate limit information
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
     * Test API connectivity
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/health`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Accept': 'application/json'
                }
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
            console.warn('API connection test failed:', error.message);
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
        return this.availableModels;
    }

    /**
     * Get model display name
     */
    getModelDisplayName(modelId) {
        const model = this.availableModels[modelId];
        return model ? model.name : modelId;
    }

    /**
     * Get rate limit status
     */
    getRateLimitStatus() {
        return {
            ...this.rateLimitInfo,
            minuteLimit: 20,
            dailyLimit: 500,
            used: 500 - this.rateLimitInfo.dailyRemaining
        };
    }

    /**
     * Fallback prompt generation
     */
    generateFallbackPrompt(userInput, style = 'detailed') {
        console.log('Using fallback prompt generation');
        
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

// Create singleton instance
const apiService = new API();

// Make globally available
window.API = API;
window.apiService = apiService;

