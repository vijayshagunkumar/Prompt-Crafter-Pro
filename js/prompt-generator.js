// Advanced AI Prompt Generator with Cloudflare Worker Integration
class PromptGenerator {
    constructor(config = {}) {
        this.config = {
            workerUrl: config.workerUrl || 'https://promptcraft-api.vijay-shagunkumar.workers.dev/',
            defaultModel: config.defaultModel || 'gemini-3-flash-preview',
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 2,
            fallbackToLocal: config.fallbackToLocal !== false,
            enableDebug: config.enableDebug || false,
            strictPromptMode: config.strictPromptMode !== false // 🔥 NEW: Strict mode to prevent content generation
        };
        
        console.log(`PromptGenerator initialized with worker: ${this.config.workerUrl}`);
        console.log(`Default model: ${this.config.defaultModel}`);
        console.log(`Strict prompt mode: ${this.config.strictPromptMode}`);
        
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
            maxTokens: options.maxTokens || 2048,
            signal: options.signal,
            timeout: options.timeout || this.config.timeout,
            retryAttempts: options.retryAttempts || this.config.retryAttempts,
            strictPromptMode: options.strictPromptMode !== false, // 🔥 NEW
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
            strictPromptMode: opts.strictPromptMode
        });
        
        // Prepare request data with SYSTEM PROMPT constraint
        const requestData = {
            prompt: prompt,
            model: opts.model,
            style: opts.style,
            temperature: opts.temperature,

            // 🔥 CRITICAL: SYSTEM PROMPT TO PREVENT CONTENT GENERATION
            systemPrompt: opts.strictPromptMode ? 
                `You are a professional prompt engineer. Your ONLY task is to convert user requests into high-quality, structured AI prompts.
                
                ABSOLUTE RULES:
                1. NEVER generate actual content (emails, code, articles, stories, etc.)
                2. ALWAYS output ONLY a structured prompt template
                3. The prompt must be ready to be copied and pasted into any AI tool
                4. The prompt should guide the AI to generate the content, NOT contain the content
                
                REQUIRED PROMPT STRUCTURE:
                • Role: [Define the AI's role]
                • Objective: [What the prompt should achieve]
                • Context: [Background information]
                • Instructions: [Step-by-step guidance]
                • Constraints: [Limitations or requirements]
                • Output Format: [Expected response structure]
                
                EXAMPLE INPUT: "Write a professional follow-up email"
                EXAMPLE CORRECT OUTPUT (NOT the email):
                Role: Professional B2B email copywriter
                Objective: Create a concise follow-up email after a product demo
                Context: Client attended demo last week
                Instructions: 1. Thank client 2. Highlight key features 3. Include call-to-action
                Constraints: Under 200 words, professional tone
                Output Format: Complete email with subject line and body
                
                REMEMBER: If the output can be sent directly to a client, it's WRONG.` 
                : null,

            // Gemini-specific config
            generationConfig: {
                maxOutputTokens: opts.maxTokens || 2048,
                temperature: opts.temperature || 0.4,
                topP: 0.95,
                topK: 40,
                stopSequences: []
            },

            // Keep for non-Gemini models
            maxTokens: opts.maxTokens || 2048,

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
                    // 🔥 Validate that output is actually a prompt, not content
                    if (opts.strictPromptMode) {
                        const validatedResult = this.validatePromptNotContent(result.prompt);
                        if (!validatedResult.isValid) {
                            console.warn(`⚠️ Generated content instead of prompt: ${validatedResult.reason}`);
                            // Regenerate with stricter constraints
                            if (attempt < opts.retryAttempts) {
                                console.log(`Regenerating with stricter constraints...`);
                                requestData.systemPrompt = this.getStricterSystemPrompt();
                                continue;
                            }
                        }
                        result.prompt = validatedResult.cleanedPrompt;
                    }
                    
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
                    const localResult = this.generatePromptLocally(prompt, opts);
                    
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
    // CONTENT VALIDATION
    // ======================
    
    /**
     * Validate that the output is a prompt, not content
     */
    validatePromptNotContent(text) {
        if (!text || typeof text !== 'string') {
            return { isValid: false, reason: 'Empty or invalid text', cleanedPrompt: text };
        }
        
        const lowerText = text.toLowerCase();
        
        // 🔥 Check for content patterns (what we DON'T want)
        const contentIndicators = [
            // Email content patterns
            /dear\s+(?:mr|mrs|ms|dr)\./i,
            /to:\s*[^\n]+\ncc:/i,
            /subject:\s*[^\n]+/i,
            /best\s+regards,/i,
            /sincerely,/i,
            /thank you for your time/i,
            
            // Code content patterns
            /def\s+\w+\(/i,
            /function\s+\w+\(/i,
            /class\s+\w+/i,
            /import\s+/i,
            /console\.log/i,
            /return\s+/i,
            
            // Story/Article content
            /once upon a time/i,
            /in conclusion,/i,
            /the end/i,
            /chapter\s+\d+/i,
            
            // Direct responses
            /here(?:'s| is) (?:the|an?)\s+/i,
            /i (?:think|believe|would)\s+/i,
            /you should\s+/i,
            /as requested,/i
        ];
        
        for (const pattern of contentIndicators) {
            if (pattern.test(text)) {
                return { 
                    isValid: false, 
                    reason: `Contains content pattern: ${pattern.toString().substring(0, 30)}...`,
                    cleanedPrompt: this.convertContentToPrompt(text)
                };
            }
        }
        
        // 🔥 Check for prompt patterns (what we DO want)
        const promptIndicators = [
            /role\s*:/i,
            /objective\s*:/i,
            /context\s*:/i,
            /instructions\s*:/i,
            /constraints\s*:/i,
            /output format\s*:/i,
            /step\s+\d+\s*:/i,
            /\*\*[^*]+\*\*/ // Markdown bold
        ];
        
        let promptScore = 0;
        for (const pattern of promptIndicators) {
            if (pattern.test(text)) {
                promptScore++;
            }
        }
        
        // If text has more content indicators than prompt indicators, it's likely content
        if (promptScore < 2) {
            return { 
                isValid: false, 
                reason: 'Missing prompt structure indicators',
                cleanedPrompt: this.convertContentToPrompt(text)
            };
        }
        
        return { isValid: true, reason: 'Valid prompt structure', cleanedPrompt: text };
    }
    
    /**
     * Convert accidental content into a prompt structure
     */
    convertContentToPrompt(content) {
        console.log('Converting content to prompt structure...');
        
        // Try to extract structure from content
        const lines = content.split('\n').filter(line => line.trim());
        
        // Check if it's email-like
        if (content.includes('@') || content.includes('Subject:') || content.includes('Dear')) {
            return `Role: Professional Email Copywriter
Objective: ${lines[0] || 'Create professional email communication'}
Context: ${content.substring(0, 100)}...
Instructions: 
1. Craft appropriate subject line
2. Write professional greeting
3. Structure email body logically
4. Include clear call-to-action
5. Add professional closing
Constraints: Maintain professional tone, be concise
Output Format: Complete email with all components`;
        }
        
        // Check if it's code
        if (content.includes('function') || content.includes('def ') || content.includes('class ')) {
            return `Role: Expert Software Developer
Objective: ${lines[0] || 'Write efficient, clean code'}
Context: ${content.substring(0, 100)}...
Instructions:
1. Write well-documented code
2. Include error handling
3. Follow best practices
4. Add comments for clarity
5. Consider edge cases
Constraints: Follow language conventions, optimize for readability
Output Format: Complete code with documentation`;
        }
        
        // Default structured prompt
        return `Role: Expert Assistant
Objective: Generate high-quality output based on user request
Context: ${content.substring(0, 150)}...
Instructions:
1. Analyze requirements carefully
2. Provide comprehensive response
3. Include relevant details
4. Structure information logically
5. Consider different perspectives
Constraints: Be accurate, thorough, and helpful
Output Format: Well-structured response`;
    }
    
    getStricterSystemPrompt() {
        return `CRITICAL: You MUST output ONLY a structured prompt, NEVER actual content.

VIOLATION EXAMPLES (DO NOT DO THIS):
- ❌ "Dear Mr. Smith, thank you for..." (This is email content)
- ❌ "def calculate_total(items):" (This is code content)  
- ❌ "Once upon a time..." (This is story content)
- ❌ "Here is the answer:" (This is a direct response)

REQUIRED OUTPUT FORMAT:
Role: [Specific role for AI]
Objective: [What the AI should accomplish]
Context: [Background information]
Instructions: [Numbered steps]
Constraints: [Limitations/rules]
Output Format: [Expected structure]

If user asks for "email", output a prompt to WRITE an email, NOT the email itself.
If user asks for "code", output a prompt to WRITE code, NOT the code itself.
If user asks for "story", output a prompt to WRITE a story, NOT the story itself.`;
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
                style: requestData.style,
                hasSystemPrompt: !!requestData.systemPrompt
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
            
            // Parse response
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
                isPrompt: this.validatePromptNotContent(result).isValid
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
    // JSON FIXING UTILITIES (keep existing)
    // ======================
    fixIncompleteJson(jsonText) {
        // ... keep existing implementation ...
        if (!jsonText || typeof jsonText !== 'string') return null;
        
        let text = jsonText.trim();
        
        if (text.endsWith(',') || text.endsWith('"') || text.endsWith("'")) {
            text = text.slice(0, -1);
        }
        
        if (text.startsWith('{') && !text.endsWith('}')) {
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
                text = text + '}';
            }
        }
        
        text = text.replace(/,\s*}/g, '}');
        text = text.replace(/,\s*]/g, ']');
        
        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.warn('Failed to fix JSON:', parseError.message);
            
            try {
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
        
        const lastChar = result.slice(-1);
        if (['.', '!', '?', ':', ')', ']', '}'].includes(lastChar)) {
            return result;
        }
        
        if ([',', '-', '—', '–', ';'].includes(lastChar)) {
            result = result.slice(0, -1);
        }
        
        const sentences = result.split(/[.!?]/);
        const lastSentence = sentences[sentences.length - 1].trim();
        
        if (lastSentence.length < 10 || lastSentence.split(' ').length < 3) {
            if (sentences.length > 1) {
                result = sentences.slice(0, -1).join('.') + '.';
            }
        } else {
            result = result + '.';
        }
        
        return result;
    }
    
    // ======================
    // LOCAL FALLBACK GENERATION
    // ======================
    generatePromptLocally(prompt, options = {}) {
        console.log('Generating prompt locally...');
        
        // Always ensure local generation creates prompts, not content
        const template = `Role: Expert Assistant
Objective: ${this.extractObjective(prompt)}
Context: User needs assistance with: ${prompt.substring(0, 100)}...
Instructions:
1. Analyze the requirements carefully
2. Provide detailed, step-by-step guidance
3. Include examples where helpful
4. Consider edge cases
5. Offer best practices

Constraints: Be comprehensive yet concise
Output Format: Structured response with clear organization

Notes: This prompt is designed to elicit comprehensive, actionable responses from an AI system.`;

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
            return 'Generate content based on specifications';
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
        
        return suggestions.slice(0, 3);
    }
    
    // ======================
    // UTILITY METHODS (keep existing)
    // ======================
    
    getCacheKey(prompt, options) {
        const keyData = {
            prompt: prompt.substring(0, 100),
            model: options.model,
            style: options.style,
            temperature: options.temperature,
            strictPromptMode: options.strictPromptMode
        };
        return JSON.stringify(keyData);
    }
    
    cacheResult(key, result) {
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
    // HEALTH CHECK (keep existing)
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
