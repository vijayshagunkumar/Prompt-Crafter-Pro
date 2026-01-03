// Advanced AI Prompt Generator with Cloudflare Worker Integration
class PromptGenerator {
    constructor(config = {}) {
        this.config = {
            workerUrl: config.workerUrl || 'https://promptcraft-api.vijay-shagunkumar.workers.dev/',
            defaultModel: config.defaultModel || 'gemini-3-flash-preview',
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 2,
            fallbackToLocal: config.fallbackToLocal !== false,
            enableDebug: config.enableDebug || false
        };
        
        console.log(`PromptGenerator initialized with worker: ${this.config.workerUrl}`);
        console.log(`Default model: ${this.config.defaultModel}`);
        console.log(`Fallback to local: ${this.config.fallbackToLocal}`);
        
        // Performance metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalLatency: 0,
            averageLatency: 0
        };
        
        // Cache for recent requests
        this.cache = new Map();
        this.cacheMaxSize = 50;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }
    
    // ======================
    // MAIN GENERATION METHOD
    // ======================
    async generatePrompt(prompt, options = {}) {
        this.metrics.totalRequests++;
        const startTime = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Default options
        const opts = {
            model: options.model || this.config.defaultModel,
            style: options.style || 'detailed',
            temperature: options.temperature || 0.4,
            maxTokens: options.maxTokens || 1000,
            signal: options.signal,
            timeout: options.timeout || this.config.timeout,
            retryAttempts: options.retryAttempts || this.config.retryAttempts,
            ...options
        };
        
        // Check cache first
        const cacheKey = this.getCacheKey(prompt, opts);
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                console.log(`Cache hit for key: ${cacheKey.substring(0, 20)}...`);
                return cached.result;
            } else {
                this.cache.delete(cacheKey);
            }
        }
        
        // Validate prompt
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            console.error('Invalid prompt provided');
            return this.createErrorResponse('Prompt cannot be empty', requestId);
        }
        
        if (prompt.length > 5000) {
            console.warn(`Prompt very long: ${prompt.length} characters`);
        }
        
        console.log(`Calling worker API with options:`, {
            model: opts.model,
            style: opts.style,
            temperature: opts.temperature,
            maxTokens: opts.maxTokens
        });
        
        // Prepare request data
        const requestData = {
            prompt: prompt,
            model: opts.model,
            style: opts.style,
            temperature: opts.temperature,
            maxTokens: opts.maxTokens,
            requestId: requestId,
            timestamp: new Date().toISOString()
        };
        
        // Try worker API with retries
        let lastError = null;
        
        for (let attempt = 1; attempt <= opts.retryAttempts; attempt++) {
            try {
                if (attempt > 1) {
                    console.log(`Retry attempt ${attempt}/${opts.retryAttempts} for request ${requestId}`);
                    await this.delay(attempt * 1000); // Exponential backoff
                }
                
                const result = await this.callWorkerAPI(requestData, opts);
                
                if (result.success) {
                    // Cache successful result
                    this.cacheResult(cacheKey, result);
                    
                    // Update metrics
                    const latency = Date.now() - startTime;
                    this.metrics.successfulRequests++;
                    this.metrics.totalLatency += latency;
                    this.metrics.averageLatency = this.metrics.totalLatency / this.metrics.successfulRequests;
                    
                    console.log(`✅ Request ${requestId} successful in ${latency}ms`);
                    console.log(`Metrics: ${this.metrics.successfulRequests}/${this.metrics.totalRequests} successful`);
                    
                    return result;
                } else {
                    throw new Error(result.error || 'Worker API returned unsuccessful response');
                }
                
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed for ${requestId}:`, error.message);
                
                // If this is the last attempt and we should fallback to local
                if (attempt === opts.retryAttempts && this.config.fallbackToLocal) {
                    console.log('All API attempts failed, falling back to local generation');
                    const localResult = this.generatePromptLocally(prompt);
                    
                    // Update metrics for fallback
                    this.metrics.failedRequests++;
                    const latency = Date.now() - startTime;
                    this.metrics.totalLatency += latency;
                    
                    return {
                        ...localResult,
                        fallbackUsed: true,
                        originalError: error.message,
                        requestId: requestId
                    };
                }
            }
        }
        
        // All attempts failed, no fallback
        this.metrics.failedRequests++;
        console.error(`All attempts failed for ${requestId}:`, lastError?.message);
        
        return this.createErrorResponse(
            `Failed to generate prompt after ${opts.retryAttempts} attempts: ${lastError?.message}`,
            requestId
        );
    }
    
    // ======================
    // WORKER API CALL
    // ======================
    async callWorkerAPI(requestData, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        
        try {
            console.log(`Sending request to: ${this.config.workerUrl}`);
            console.log(`Request data:`, {
                model: requestData.model,
                promptLength: requestData.prompt?.length || 0,
                style: requestData.style
            });
            
            const response = await fetch(this.config.workerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'PromptCraft/1.0'
                },
                body: JSON.stringify(requestData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log(`Response status: ${response.status}`);
            
            // Get response as text first to handle incomplete JSON
            const responseText = await response.text();
            console.log(`Raw response length: ${responseText.length}`);
            
            if (this.config.enableDebug) {
                console.log(`Full raw response: ${responseText}`);
            }
            
            // ✅ FIXED: Check for incomplete JSON
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(responseText);
                console.log('✅ Parsed response successfully as-is');
            } catch (parseError) {
                console.warn('❌ JSON parse error:', parseError.message);
                console.warn('Response preview (first 500 chars):', responseText.substring(0, 500));
                
                // Try to fix incomplete JSON
                const fixedResponse = this.fixIncompleteJson(responseText);
                if (fixedResponse) {
                    parsedResponse = fixedResponse;
                    console.log('✅ Successfully fixed and parsed incomplete JSON');
                } else {
                    throw new Error(`Invalid JSON response: ${parseError.message}`);
                }
            }
            
            // Validate response structure
            if (!parsedResponse) {
                throw new Error('Empty response from worker');
            }
            
            if (!parsedResponse.success) {
                throw new Error(parsedResponse.error || 'Worker returned unsuccessful response');
            }
            
            // Extract and validate result
            let result = parsedResponse.result;
            if (!result || typeof result !== 'string') {
                console.warn('No result field or invalid type in response:', parsedResponse);
                result = 'No response generated.';
            }
            
            // Ensure result is complete
            result = this.ensureCompletePrompt(result);
            
            // Create suggestions if not present
            let suggestions = [];
            if (parsedResponse.suggestions && Array.isArray(parsedResponse.suggestions)) {
                suggestions = parsedResponse.suggestions;
            } else {
                suggestions = this.generateSuggestions(result);
            }
            
            console.log(`Worker response parsed:`, {
                success: true,
                model: parsedResponse.model,
                hasResult: !!result,
                resultLength: result.length,
                keys: Object.keys(parsedResponse)
            });
            
            console.log(`Result preview (first 500 chars): ${result.substring(0, 500)}...`);
            console.log(`Result length: ${result.length}`);
            
            return {
                success: true,
                prompt: result,
                model: parsedResponse.model || requestData.model,
                provider: parsedResponse.provider || 'unknown',
                usage: parsedResponse.usage || {},
                suggestions: suggestions,
                requestId: parsedResponse.requestId || requestData.requestId,
                rateLimit: parsedResponse.rateLimit,
                timestamp: parsedResponse.timestamp || new Date().toISOString(),
                rawResponse: this.config.enableDebug ? parsedResponse : undefined
            };
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            console.error('Worker API call failed:', {
                error: error.message,
                url: this.config.workerUrl,
                requestId: requestData.requestId
            });
            
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${options.timeout}ms`);
            }
            
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error: Cannot connect to AI service');
            }
            
            throw error;
        }
    }
    
    // ======================
    // JSON FIXING UTILITIES
    // ======================
    
    fixIncompleteJson(jsonText) {
        if (!jsonText || typeof jsonText !== 'string') return null;
        
        let text = jsonText.trim();
        
        // Common incomplete patterns
        if (text.endsWith(',') || text.endsWith('"') || text.endsWith("'")) {
            text = text.slice(0, -1);
        }
        
        // If it starts with { but doesn't end with }
        if (text.startsWith('{') && !text.endsWith('}')) {
            // Try to find the last complete object
            let braceCount = 0;
            let lastCompletePos = -1;
            
            for (let i = 0; i < text.length; i++) {
                if (text[i] === '{') braceCount++;
                if (text[i] === '}') braceCount--;
                
                if (braceCount === 0) {
                    lastCompletePos = i;
                }
            }
            
            if (lastCompletePos !== -1) {
                text = text.substring(0, lastCompletePos + 1);
            } else {
                // Just close it
                text = text + '}';
            }
        }
        
        // Remove trailing commas before }
        text = text.replace(/,\s*}/g, '}');
        text = text.replace(/,\s*]/g, ']');
        
        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.warn('Failed to fix JSON:', parseError.message);
            
            // Last resort: create a minimal valid response
            try {
                // Try to extract just the result field
                const resultMatch = text.match(/"result"\s*:\s*"([^"]*)"/);
                if (resultMatch && resultMatch[1]) {
                    return {
                        success: true,
                        result: resultMatch[1],
                        error: "Response was partially corrupted",
                        fixed: true
                    };
                }
            } catch (e) {
                // Give up
            }
            
            return null;
        }
    }
    
    ensureCompletePrompt(prompt) {
        if (!prompt || typeof prompt !== 'string') return prompt || '';
        
        let result = prompt.trim();
        
        // Check if ends with complete punctuation
        const lastChar = result.slice(-1);
        if (['.', '!', '?', ':', ')', ']', '}'].includes(lastChar)) {
            return result;
        }
        
        // Remove trailing comma or dash
        if ([',', '-', '—', '–', ';'].includes(lastChar)) {
            result = result.slice(0, -1);
        }
        
        // Check if ends with complete sentence
        const sentences = result.split(/[.!?]/);
        const lastSentence = sentences[sentences.length - 1].trim();
        
        if (lastSentence.length < 10 || lastSentence.split(' ').length < 3) {
            // Probably incomplete, remove it
            if (sentences.length > 1) {
                result = sentences.slice(0, -1).join('.') + '.';
            }
        } else {
            // Add period
            result = result + '.';
        }
        
        return result;
    }
    
    // ======================
    // LOCAL FALLBACK GENERATION
    // ======================
    generatePromptLocally(prompt) {
        console.log('Generating prompt locally...');
        
        // Create a structured prompt template
        const template = `Based on your request, here is a structured prompt:

**Role**: Expert Assistant
**Objective**: ${this.extractObjective(prompt)}
**Context**: User needs assistance with: ${prompt.substring(0, 100)}...
**Instructions**:
1. Analyze the requirements carefully
2. Provide detailed, step-by-step guidance
3. Include examples where helpful
4. Consider edge cases
5. Offer best practices

**Notes**: This prompt is designed to elicit comprehensive, actionable responses.`;

        const suggestions = this.generateSuggestions(template);
        
        return {
            success: true,
            prompt: template,
            model: 'local-fallback',
            provider: 'local',
            usage: {
                prompt_tokens: prompt.length,
                completion_tokens: template.length,
                total_tokens: prompt.length + template.length
            },
            suggestions: suggestions,
            requestId: `local_${Date.now()}`,
            timestamp: new Date().toISOString(),
            isLocalFallback: true
        };
    }
    
    extractObjective(prompt) {
        if (!prompt) return 'Address the user query';
        
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes('write') || lowerPrompt.includes('create') || lowerPrompt.includes('generate')) {
            return 'Create content based on specifications';
        } else if (lowerPrompt.includes('explain') || lowerPrompt.includes('describe')) {
            return 'Explain concepts clearly';
        } else if (lowerPrompt.includes('help') || lowerPrompt.includes('assist')) {
            return 'Provide helpful assistance';
        } else if (lowerPrompt.includes('code') || lowerPrompt.includes('program')) {
            return 'Write and explain code';
        } else if (lowerPrompt.includes('email') || lowerPrompt.includes('letter')) {
            return 'Compose professional communication';
        } else if (lowerPrompt.includes('analyze') || lowerPrompt.includes('review')) {
            return 'Analyze and provide insights';
        }
        
        return 'Address the user query effectively';
    }
    
    generateSuggestions(prompt) {
        const suggestions = [];
        
        if (prompt.includes('Role')) {
            suggestions.push('Consider adjusting the role for different perspectives');
        }
        
        if (prompt.includes('Objective')) {
            suggestions.push('Make the objective more specific');
        }
        
        if (prompt.length > 500) {
            suggestions.push('Consider making the prompt more concise');
        } else if (prompt.length < 200) {
            suggestions.push('Add more details to the prompt');
        }
        
        if (!prompt.includes('Examples')) {
            suggestions.push('Include specific examples');
        }
        
        if (!prompt.includes('Format')) {
            suggestions.push('Specify the desired output format');
        }
        
        return suggestions.slice(0, 3); // Return top 3 suggestions
    }
    
    // ======================
    // UTILITY METHODS
    // ======================
    
    getCacheKey(prompt, options) {
        const keyData = {
            prompt: prompt.substring(0, 100),
            model: options.model,
            style: options.style,
            temperature: options.temperature
        };
        return JSON.stringify(keyData);
    }
    
    cacheResult(key, result) {
        // Clean old cache entries if needed
        if (this.cache.size >= this.cacheMaxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            result: result,
            timestamp: Date.now()
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    createErrorResponse(errorMessage, requestId) {
        return {
            success: false,
            error: errorMessage,
            requestId: requestId,
            timestamp: new Date().toISOString(),
            prompt: '',
            suggestions: []
        };
    }
    
    // ======================
    // HEALTH CHECK
    // ======================
    async testConnection() {
        try {
            console.log(`Testing connection to: ${this.config.workerUrl}health`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.config.workerUrl}health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const responseText = await response.text();
            console.log(`Health response raw: ${responseText.substring(0, 200)}...`);
            
            try {
                const data = JSON.parse(responseText);
                
                if (response.ok) {
                    console.log('Health check successful:', data);
                    return {
                        success: true,
                        status: data.status,
                        models: data.models,
                        keys: data.keys,
                        version: data.version
                    };
                } else {
                    return {
                        success: false,
                        error: data.error || `Health check failed: ${response.status}`,
                        status: response.status
                    };
                }
            } catch (parseError) {
                console.error('Health check parse error:', parseError);
                return {
                    success: false,
                    error: `Invalid health response: ${responseText.substring(0, 100)}`,
                    rawResponse: responseText
                };
            }
            
        } catch (error) {
            console.error('Health check failed:', error.message);
            return {
                success: false,
                error: error.message,
                isNetworkError: error.name === 'AbortError' || error.message.includes('fetch')
            };
        }
    }
    
    // ======================
    // METRICS & DIAGNOSTICS
    // ======================
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            successRate: this.metrics.totalRequests > 0 
                ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
                : 0
        };
    }
    
    clearCache() {
        this.cache.clear();
        console.log('Cache cleared');
    }
    
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalLatency: 0,
            averageLatency: 0
        };
        console.log('Metrics reset');
    }
}
