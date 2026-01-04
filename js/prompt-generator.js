// Advanced AI Prompt Generator with Cloudflare Worker Integration
class PromptGenerator {
    constructor(config = {}) {
        this.config = {
            workerUrl: config.workerUrl || 'https://promptcraft-api.vijay-shagunkumar.workers.dev/',
            defaultModel: config.defaultModel || 'gemini-3-flash-preview',
            timeout: config.timeout || 10000,
            retryAttempts: config.retryAttempts || 0,
            fallbackToLocal: config.fallbackToLocal !== false,
            enableDebug: config.enableDebug || false,
            strictPromptMode: config.strictPromptMode !== false,
            minPromptLength: config.minPromptLength || 150
        };
        
        // ✅ MODEL CAPABILITIES - SINGLE SOURCE OF TRUTH
        this.MODEL_CAPABILITIES = {
            "gemini-3-flash-preview": {
                name: "Gemini 3 Flash",
                executable: true,
                chat: true,
                description: "Fast, reliable prompt generation",
                provider: "google",
                default: true
            },
            "gpt-4o-mini": {
                name: "GPT-4o Mini", 
                executable: true,
                chat: true,
                description: "OpenAI's fast model",
                provider: "openai",
                default: false
            },
            "gemini-1.5-flash-latest": {
                name: "Gemini 1.5 Flash Latest",
                executable: true,
                chat: true,
                description: "Latest Gemini Flash",
                provider: "google",
                default: false
            },
            "gemini-1.5-flash": {
                name: "Gemini 1.5 Flash",
                executable: true,
                chat: true,
                description: "Stable Gemini Flash",
                provider: "google",
                default: false
            },
            "llama-3.1-8b-instant": {
                name: "LLaMA 3.1 Instant",
                executable: false,
                chat: true,
                description: "Fast chat & execution (not for prompt generation)",
                provider: "groq",
                default: false
            }
        };
        
        console.log(`PromptGenerator initialized with worker: ${this.config.workerUrl}`);
        console.log(`Default model: ${this.config.defaultModel}`);
        console.log(`Strict prompt mode: ${this.config.strictPromptMode}`);
        console.log(`Min prompt length: ${this.config.minPromptLength} chars`);
        
        // Performance metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalLatency: 0,
            averageLatency: 0,
            workerValidatedHits: 0,
            workerTotalValidations: 0,
            modelCorrections: 0
        };
        
        // Cache for recent requests with versioning
        this.cache = new Map();
        this.cacheMaxSize = 50;
        this.cacheExpiry = 5 * 60 * 1000;
        this.cacheVersion = '1.2'; // ✅ UPDATED
    }
    
    // ✅ Get allowed models based on mode
    getAllowedModels(strictPromptMode = true) {
        return Object.entries(this.MODEL_CAPABILITIES)
            .filter(([modelId, capabilities]) => {
                if (strictPromptMode) {
                    return capabilities.executable;
                }
                return true;
            })
            .map(([modelId]) => modelId);
    }
    
    // ✅ Get default model for mode
    getDefaultModel(strictPromptMode = true) {
        const allowedModels = this.getAllowedModels(strictPromptMode);
        
        const defaultModel = allowedModels.find(modelId => 
            this.MODEL_CAPABILITIES[modelId]?.default === true
        );
        
        return defaultModel || allowedModels[0] || "gemini-3-flash-preview";
    }
    
    // ✅ Validate and correct model selection
    validateModelSelection(selectedModel, strictPromptMode = true) {
        const allowedModels = this.getAllowedModels(strictPromptMode);
        
        if (allowedModels.includes(selectedModel)) {
            return {
                valid: true,
                model: selectedModel,
                reason: ''
            };
        }
        
        const correctedModel = this.getDefaultModel(strictPromptMode);
        const originalModelName = this.MODEL_CAPABILITIES[selectedModel]?.name || selectedModel;
        
        return {
            valid: false,
            model: correctedModel,
            reason: `"${originalModelName}" is not available in ${strictPromptMode ? 'Executable Prompt' : 'Chat'} mode.`,
            corrected: true
        };
    }
    
    // ======================
    // MAIN GENERATION METHOD
    // ======================
    async generatePrompt(prompt, options = {}) {
        this.metrics.totalRequests++;
        const startTime = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const opts = {
            model: options.model || this.config.defaultModel,
            style: options.style || 'detailed',
            temperature: options.temperature || 0.4,
            maxTokens: options.maxTokens || 2048,
            signal: options.signal,
            timeout: options.timeout || this.config.timeout,
            retryAttempts: options.retryAttempts || this.config.retryAttempts,
            strictPromptMode: options.strictPromptMode !== undefined ? options.strictPromptMode : this.config.strictPromptMode,
            minPromptLength: options.minPromptLength || this.config.minPromptLength,
            ...options
        };
        
        // ✅ CRITICAL: Validate and correct model selection BEFORE API call
        const modelValidation = this.validateModelSelection(opts.model, opts.strictPromptMode);
        if (modelValidation.corrected) {
            console.warn(`Model auto-corrected: ${modelValidation.reason} Using ${modelValidation.model} instead.`);
            this.metrics.modelCorrections++;
            opts.model = modelValidation.model;
        }
        
        // 🔧 Check cache with version
        const cacheKey = await this.getCacheKey(prompt, opts);
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (cached.version === this.cacheVersion && 
                Date.now() - cached.timestamp < this.cacheExpiry) {
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
            strictPromptMode: opts.strictPromptMode,
            minLength: opts.minPromptLength
        });
        
        const requestData = {
            prompt: prompt,
            model: opts.model,
            enforceExecutableFormat: opts.strictPromptMode,
            requestId: requestId,
            timestamp: new Date().toISOString()
        };
        
        try {
            console.log(`Starting generation with model: ${opts.model}`);
            const result = await this.callWorkerAPI(requestData, opts);
            
            if (result.success) {
                // ✅ TRUST WORKER VALIDATION
                if (result.executableFormatValidated === true) {
                    console.log('✅ Worker validated executable format - skipping redundant checks');
                    this.metrics.workerValidatedHits++;
                    this.metrics.workerTotalValidations++;
                    
                    // ✅ FIX: Cache with version
                    await this.cacheResult(cacheKey, result);
                    
                    const latency = Date.now() - startTime;
                    this.metrics.successfulRequests++;
                    this.metrics.totalLatency += latency;
                    this.metrics.averageLatency = this.metrics.totalLatency / this.metrics.successfulRequests;
                    
                    console.log(`✅ Request ${requestId} successful in ${latency}ms`);
                    console.log(`Metrics: ${this.metrics.successfulRequests}/${this.metrics.totalRequests} successful`);
                    
                    return result;
                }
                
                // Only validate if worker didn't validate
                if (opts.strictPromptMode && result.executableFormatValidated !== true) {
                    this.metrics.workerTotalValidations++;
                    
                    const validatedResult = this.validatePromptNotContent(result.prompt);
                    if (!validatedResult.isValid) {
                        console.warn(`⚠️ Generated content instead of prompt: ${validatedResult.reason}`);
                        result.prompt = validatedResult.cleanedPrompt;
                        result.localConversion = true;
                    }
                    
                    if (result.prompt.length < opts.minPromptLength) {
                        console.warn(`Prompt too short: ${result.prompt.length} chars (min ${opts.minPromptLength})`);
                        throw new Error('Generated prompt is incomplete');
                    }
                    
                    if (!this.isExecutablePrompt(result.prompt)) {
                        console.warn('Prompt not in executable format');
                        throw new Error('Prompt not executable');
                    }
                }
                
                // ✅ FIX: Cache with version
                await this.cacheResult(cacheKey, result);
                
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
            console.error(`Request ${requestId} failed:`, error.message);
            
            if (this.config.fallbackToLocal) {
                console.log('Immediate fallback to local generation');
                const localResult = this.generatePromptLocally(prompt, opts);
                
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
            
            this.metrics.failedRequests++;
            console.error(`All attempts failed for ${requestId}:`, error.message);
            
            return this.createErrorResponse(
                `Failed to generate prompt: ${error.message}`,
                requestId
            );
        }
    }
    
    // ======================
    // CONTENT VALIDATION - UPDATED WITH FIXES
    // ======================
    
    /**
     * ✅ FIX 1: Stricter executable prompt detection
     * Now ONLY accepts "Task to perform:" as canonical entry point
     */
    isExecutablePrompt(text) {
        if (!text || typeof text !== 'string') return false;
        
        // ✅ FIX: Canonical entry point only
        if (!/^task to perform:/i.test(text)) {
            return false;
        }
        
        const lowerText = text.toLowerCase();
        
        // Still check for basic structure
        const structureIndicators = [
            /requirements?:/i,
            /instructions?:/i,
            /format:/i
        ];
        
        let structureScore = 0;
        for (const pattern of structureIndicators) {
            if (pattern.test(text)) structureScore++;
        }
        
        // Must have at least one structure indicator
        if (structureScore < 1) {
            return false;
        }
        
        // Check for non-executable indicators (meta)
        const metaIndicators = [
            /prompt for/i,
            /template for/i,
            /role:\s*/i,
            /objective:\s*/i,
            /context:\s*/i,
            /you should/i,
            /i need you to/i,
            /can you/i,
            /would you/i,
            /please create a prompt/i
        ];
        
        for (const pattern of metaIndicators) {
            if (pattern.test(lowerText)) {
                return false;
            }
        }
        
        return text.length >= this.config.minPromptLength;
    }
    
    /**
     * Validate that the output is a prompt, not content
     */
    validatePromptNotContent(text) {
        if (!text || typeof text !== 'string') {
            return { isValid: false, reason: 'Empty or invalid text', cleanedPrompt: text };
        }
        
        // Check minimum length
        if (text.length < this.config.minPromptLength) {
            return { 
                isValid: false, 
                reason: `Prompt too short (${text.length} chars, min ${this.config.minPromptLength})`,
                cleanedPrompt: this.convertContentToPrompt(text)
            };
        }
        
        // ✅ Check for canonical entry point
        if (!/^task to perform:/i.test(text)) {
            return { 
                isValid: false, 
                reason: 'Missing canonical entry point "Task to perform:"',
                cleanedPrompt: this.convertContentToPrompt(text)
            };
        }
        
        // Detect software tutorials and reject them
        const softwareTutorialPatterns = [
            /software:.*\d{4}/i,
            /image size:.*\d+.*x.*\d+/i,
            /color mode:/i,
            /resolution:.*dpi/i,
            /use the.*tool to/i,
            /create a new layer/i,
            /adobe photoshop/i,
            /photoshop cc \d{4}/i,
            /utilize.*libraries/i,
            /use python.*library/i
        ];
        
        for (const pattern of softwareTutorialPatterns) {
            if (pattern.test(text)) {
                return { 
                    isValid: false, 
                    reason: `Contains software tutorial`,
                    cleanedPrompt: this.convertContentToPrompt(text)
                };
            }
        }
        
        // Detect platform wrapper pollution
        const wrapperPatterns = [
            /^===.*===/m,
            /^paste this.*exactly/im,
            /^do not ask.*(ai|model)/im,
            /^execute.*as.*written/im,
            /copy.*paste.*below.*into.*ai/i
        ];
        
        for (const pattern of wrapperPatterns) {
            if (pattern.test(text)) {
                return { 
                    isValid: false, 
                    reason: `Contains platform wrapper instructions`,
                    cleanedPrompt: this.convertContentToPrompt(text)
                };
            }
        }
        
        // Enhanced content detection - only actual content, not prompts
        const contentIndicators = [
            /^dear\s+(?:mr|mrs|ms|dr)\.\s+\w+,\s*\n/im,
            /^subject:\s*.+\n\s*(?:dear|hello|hi)\s+\w+/im,
            /^best\s+regards,\s*\n/im,
            /^sincerely,\s*\n/im,
            
            /^\s*def\s+\w+\([^)]*\)\s*:/im,
            /^\s*function\s+\w+\([^)]*\)\s*\{/im,
            /^\s*console\.log\(.*\)/im,
            /^\s*return\s+\w+\s*;/im,
            /^\s*public\s+class\s+\w+\s*\{/im,
            /^\s*void\s+main\s*\(/im,
            /^<!DOCTYPE html>/i,
            
            /^once upon a time,/i,
            /^in conclusion,/i,
            /^the end/i,
            
            /^here(?:'s| is) (?:the|an?)\s+/i,
            /^i (?:think|believe|would)\s+/i,
            /^you should\s+/i,
            /^as requested,/i,
            
            /^hello,/i,
            /^hi there,/i,
            /^good morning/i
        ];
        
        for (const pattern of contentIndicators) {
            if (pattern.test(text)) {
                return { 
                    isValid: false, 
                    reason: `Contains actual content pattern`,
                    cleanedPrompt: this.convertContentToPrompt(text)
                };
            }
        }
        
        // Check for basic prompt structure
        const promptIndicators = [
            /requirements?:/i,
            /instructions?:/i,
            /format:/i
        ];
        
        let promptScore = 0;
        for (const pattern of promptIndicators) {
            if (pattern.test(text)) {
                promptScore++;
            }
        }
        
        if (promptScore < 1) {
            return { 
                isValid: false, 
                reason: 'Missing basic prompt structure',
                cleanedPrompt: this.convertContentToPrompt(text)
            };
        }
        
        return { isValid: true, reason: 'Valid executable prompt', cleanedPrompt: text };
    }
    
    /**
     * Convert accidental content into a prompt structure
     */
    convertContentToPrompt(content) {
        console.log('Converting content to executable prompt structure...');
        
        return `Task to perform: Produce the requested output according to requirements

Requirements:
1. Analyze input requirements carefully
2. Generate comprehensive, detailed output
3. Follow appropriate formatting guidelines
4. Consider relevant constraints and edge cases
5. Ensure professional quality and accuracy
6. Structure information logically and clearly

Format: Well-structured, actionable output

Context: ${content.substring(0, 200)}...`;
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
                enforceExecutableFormat: requestData.enforceExecutableFormat
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
            
            const responseText = await response.text();
            console.log(`Raw response length: ${responseText.length}`);
            
            if (this.config.enableDebug) {
                console.log(`Full raw response: ${responseText}`);
            }
            
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(responseText);
                console.log('✅ Parsed response successfully as-is');
            } catch (parseError) {
                console.warn('❌ JSON parse error:', parseError.message);
                
                const fixedResponse = this.fixIncompleteJson(responseText);
                if (fixedResponse) {
                    parsedResponse = fixedResponse;
                    console.log('✅ Successfully fixed and parsed incomplete JSON');
                } else {
                    throw new Error(`Invalid JSON response: ${parseError.message}`);
                }
            }
            
            if (!parsedResponse) {
                throw new Error('Empty response from worker');
            }
            
            if (!parsedResponse.success) {
                throw new Error(parsedResponse.error || 'Worker returned unsuccessful response');
            }
            
            let result = parsedResponse.result;
            if (!result || typeof result !== 'string') {
                console.warn('No result field or invalid type in response:', parsedResponse);
                result = 'No response generated.';
            }
            
            result = this.ensureCompletePrompt(result);
            
            let suggestions = [];
            if (parsedResponse.suggestions && Array.isArray(parsedResponse.suggestions)) {
                suggestions = parsedResponse.suggestions;
            } else {
                suggestions = this.generateSuggestions(result);
            }
            
            console.log(`Worker validation: ${parsedResponse.executableFormatValidated ? '✅ Validated' : '❌ Not validated'}`);
            
            console.log(`Worker response parsed:`, {
                success: true,
                model: parsedResponse.model,
                hasResult: !!result,
                resultLength: result.length
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
                rawResponse: this.config.enableDebug ? parsedResponse : undefined,
                executableFormatValidated: parsedResponse.executableFormatValidated || false,
                fallbackUsed: parsedResponse.fallbackUsed || false,
                ultraStrictUsed: parsedResponse.ultraStrictUsed || false
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
    // LOCAL FALLBACK GENERATION - UPDATED WITH FIX 2
    // ======================
    generatePromptLocally(prompt, options = {}) {
        console.log('Generating executable prompt locally...');
        
        // ✅ FIX 2: Neutral objective for local fallback
        const template = `Task to perform: Produce the requested output according to requirements

Requirements:
1. Analyze input requirements carefully
2. Generate comprehensive, detailed output
3. Follow appropriate formatting guidelines
4. Consider relevant constraints and edge cases
5. Ensure professional quality and accuracy
6. Structure information logically and clearly

Format: Well-structured, actionable output ready for execution

Additional context: ${prompt.substring(0, 200)}...`;

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
            isLocalFallback: true,
            executableFormatValidated: false
        };
    }
    
    // ✅ REMOVED: extractObjective() method entirely
    // Local fallback now uses neutral phrasing
    
    generateSuggestions(prompt) {
        const suggestions = [];
        
        if (prompt.length < 200) {
            suggestions.push('Add more specific requirements');
        }
        
        if (!prompt.includes('Format:')) {
            suggestions.push('Specify the expected output format');
        }
        
        if (!prompt.match(/\d+\.\s/)) {
            suggestions.push('Add numbered steps for clarity');
        }
        
        if (prompt.length > 800) {
            suggestions.push('Consider breaking into smaller tasks');
        }
        
        return suggestions.slice(0, 3);
    }
    
    // ======================
    // UTILITY METHODS - UPDATED WITH FIX 3
    // ======================
    
    async getCacheKey(prompt, options) {
        // ✅ FIX 3: Better cache key generation
        let promptHash;
        
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(prompt.substring(0, 1000));
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                promptHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } catch (e) {
                // Fallback to substring if crypto fails
                promptHash = prompt.substring(0, 200);
            }
        } else {
            // Fallback for non-secure contexts
            promptHash = prompt.substring(0, 200);
        }
        
        const keyData = {
            promptHash: promptHash,
            model: options.model,
            style: options.style,
            temperature: options.temperature,
            strictPromptMode: options.strictPromptMode,
            cacheVersion: this.cacheVersion
        };
        
        return JSON.stringify(keyData);
    }
    
    async cacheResult(key, result) {
        if (this.cache.size >= this.cacheMaxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            result: result,
            timestamp: Date.now(),
            version: this.cacheVersion
        });
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
                        keys: data.availableModels,
                        version: data.version,
                        architecture: data.architecture
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
        const workerValidationHitRate = this.metrics.workerTotalValidations > 0 
            ? (this.metrics.workerValidatedHits / this.metrics.workerTotalValidations) * 100 
            : 0;
            
        const estimatedPerformanceGain = (24 / Math.max(1, this.metrics.averageLatency / 1000)).toFixed(1);
        
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            cacheVersion: this.cacheVersion,
            successRate: this.metrics.totalRequests > 0 
                ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
                : 0,
            averageResponseTime: this.metrics.averageLatency,
            minPromptLength: this.config.minPromptLength,
            workerValidationHitRate: workerValidationHitRate,
            workerValidationStatus: `${this.metrics.workerValidatedHits}/${this.metrics.workerTotalValidations} validated`,
            estimatedPerformanceGain: `${estimatedPerformanceGain}x faster`,
            debug: {
                shouldBeFaster: this.metrics.averageLatency < 6000 ? '✅ Yes (<6s)' : '❌ No (>6s)',
                workerTrustLevel: workerValidationHitRate > 95 ? '✅ High (>95%)' : '⚠️ Medium/Low',
                modelCorrections: this.metrics.modelCorrections
            }
        };
    }
    
    clearCache() {
        this.cache.clear();
        this.cacheVersion = (parseFloat(this.cacheVersion) + 0.1).toFixed(1);
        console.log('Cache cleared and version updated to:', this.cacheVersion);
        return true;
    }
    
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalLatency: 0,
            averageLatency: 0,
            workerValidatedHits: 0,
            workerTotalValidations: 0,
            modelCorrections: 0
        };
        console.log('Metrics reset');
    }
    
    // ======================
    // UI HELPER METHODS
    // ======================
    
    getAvailableModels(strictMode = true) {
        return Object.entries(this.MODEL_CAPABILITIES).map(([id, config]) => ({
            id,
            name: config.name,
            executable: config.executable,
            chat: config.chat,
            description: config.description,
            provider: config.provider,
            default: config.default || false,
            availableInStrictMode: strictMode ? config.executable : true
        }));
    }
    
    getModelInfo(modelId) {
        return this.MODEL_CAPABILITIES[modelId] || null;
    }
    
    updateSettings(options = {}) {
        if (options.defaultModel !== undefined) {
            this.config.defaultModel = options.defaultModel;
        }
        
        if (options.strictPromptMode !== undefined) {
            this.config.strictPromptMode = options.strictPromptMode;
            
            const validation = this.validateModelSelection(this.config.defaultModel, this.config.strictPromptMode);
            if (!validation.valid) {
                this.config.defaultModel = validation.model;
                console.log(`Model auto-corrected to: ${this.config.defaultModel}`);
            }
        }
        
        if (options.minPromptLength !== undefined) {
            this.config.minPromptLength = options.minPromptLength;
        }
        
        if (options.workerUrl !== undefined) {
            this.config.workerUrl = options.workerUrl;
        }
        
        console.log('PromptGenerator settings updated:', {
            defaultModel: this.config.defaultModel,
            strictPromptMode: this.config.strictPromptMode,
            minPromptLength: this.config.minPromptLength
        });
    }
    
    // ======================
    // JSON FIXING UTILITIES (keep from original)
    // ======================
    fixIncompleteJson(jsonText) {
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
}
