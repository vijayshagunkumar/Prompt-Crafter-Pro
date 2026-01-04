// Advanced AI Prompt Generator with Cloudflare Worker Integration
class PromptGenerator {
    constructor(config = {}) {
        this.config = {
            workerUrl: config.workerUrl || 'https://promptcraft-api.vijay-shagunkumar.workers.dev/',
            defaultModel: config.defaultModel || 'gemini-3-flash-preview',
            timeout: config.timeout || 20000, // 🔧 FIX 1: Reduced from 30s to 20s
            retryAttempts: config.retryAttempts || 1, // 🔧 FIX 1: Reduced retries
            fallbackToLocal: config.fallbackToLocal !== false,
            enableDebug: config.enableDebug || false,
            strictPromptMode: config.strictPromptMode !== false,
            minPromptLength: config.minPromptLength || 150 // 🔧 FIX 2: Min length
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
            averageLatency: 0
        };
        
        // Cache for recent requests with versioning
        this.cache = new Map();
        this.cacheMaxSize = 50;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.cacheVersion = '1.0'; // 🔧 FIX 8: Cache version for invalidation
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
            strictPromptMode: options.strictPromptMode !== false,
            minPromptLength: options.minPromptLength || this.config.minPromptLength,
            ...options
        };
        
        // 🔧 FIX 8: Check cache with version
        const cacheKey = this.getCacheKey(prompt, opts);
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
        
        // 🔧 FIX 5: UPDATED SYSTEM PROMPT FOR EXECUTABLE PROMPTS
        const executableSystemPrompt = `You are creating prompts that users will COPY AND PASTE directly into AI tools like ChatGPT, Gemini, etc.

CRITICAL REQUIREMENTS FOR EXECUTABLE PROMPTS:
1. OUTPUT MUST BE A DIRECT TASK that an AI can execute immediately
2. NEVER output meta-instructions like "Create a prompt for..." or "Write a template..."
3. ALWAYS use imperative commands that start with action verbs:
   - ✅ "Write a professional email..." 
   - ✅ "Generate Python code that..."
   - ✅ "Analyze this dataset and provide insights..."
   - ✅ "Create a marketing strategy for..."
   - ❌ "Create a prompt to write an email" (BAD - meta)
   - ❌ "You should write a story about..." (BAD - indirect)
   - ❌ "I need you to analyze..." (BAD - conversational)

4. Start with execution context: "Execute the following task:" or "Task to perform:"
5. Use DIRECT, IMPERATIVE language throughout
6. Include ALL necessary context and requirements within the executable command
7. Structure complex tasks with clear bullet points or numbered steps
8. Minimum ${opts.minPromptLength} characters to ensure completeness

EXAMPLE INPUT: "help me write a follow-up email to a client"
EXAMPLE BAD OUTPUT (meta): "Role: Email writer, Objective: Create follow-up email..."
EXAMPLE GOOD OUTPUT (executable): "Task to perform: Write a professional follow-up email to a client who attended our product demo last week. 

Requirements:
1. Thank the client for their time
2. Highlight 2-3 key features relevant to their business
3. Include a clear call-to-action for next steps
4. Maintain professional but warm tone
5. Keep under 200 words
6. Include subject line and signature

Format: Complete email with all components."

The user will copy your output EXACTLY and paste it into an AI tool. The AI tool should execute it immediately, not analyze or improve it.`;
        
        // Prepare request data with SYSTEM PROMPT constraint
        const requestData = {
            prompt: prompt,
            model: opts.model,
            style: opts.style,
            temperature: opts.temperature,

            // 🔧 FIX 5: Use executable system prompt
            systemPrompt: opts.strictPromptMode ? executableSystemPrompt : null,

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
        
        // 🔧 FIX 1: Try worker API with single attempt (faster)
        let lastError = null;
        
        try {
            console.log(`Starting generation with model: ${opts.model}`);
            const result = await this.callWorkerAPI(requestData, opts);
            
            if (result.success) {
                // 🔧 FIX 3: Enhanced validation
                if (opts.strictPromptMode) {
                    const validatedResult = this.validatePromptNotContent(result.prompt);
                    if (!validatedResult.isValid) {
                        console.warn(`⚠️ Generated content instead of prompt: ${validatedResult.reason}`);
                        // Try once more with stricter prompt
                        requestData.systemPrompt = this.getStricterSystemPrompt();
                        const retryResult = await this.callWorkerAPI(requestData, opts);
                        if (retryResult.success) {
                            result.prompt = retryResult.prompt;
                        } else {
                            throw new Error('Failed to generate valid prompt after retry');
                        }
                    }
                    
                    // 🔧 FIX 2 & 5: Check prompt length and executability
                    if (result.prompt.length < opts.minPromptLength) {
                        console.warn(`Prompt too short: ${result.prompt.length} chars (min ${opts.minPromptLength})`);
                        throw new Error('Generated prompt is incomplete');
                    }
                    
                    if (!this.isExecutablePrompt(result.prompt)) {
                        console.warn('Prompt not in executable format');
                        throw new Error('Prompt not executable');
                    }
                }
                
                // 🔧 FIX 8: Cache with version
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
            console.error(`Request ${requestId} failed:`, error.message);
            
            // 🔧 FIX 1: Immediate fallback instead of retries
            if (this.config.fallbackToLocal) {
                console.log('Immediate fallback to local generation');
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
            
            // All attempts failed, no fallback
            this.metrics.failedRequests++;
            console.error(`All attempts failed for ${requestId}:`, lastError?.message);
            
            return this.createErrorResponse(
                `Failed to generate prompt: ${lastError?.message}`,
                requestId
            );
        }
    }
    
    // ======================
    // CONTENT VALIDATION - ENHANCED
    // ======================
    
    /**
     * 🔧 NEW: Check if prompt is executable
     */
    isExecutablePrompt(text) {
        if (!text || typeof text !== 'string') return false;
        
        const lowerText = text.toLowerCase();
        
        // Check for executable indicators
        const executableIndicators = [
            /^(execute|task|write|create|generate|analyze|build|develop|design|compose)/i,
            /requirements?:/i,
            /instructions?:/i,
            /steps?:/i,
            /format:/i,
            /\d+\.\s+[A-Z]/, // Numbered steps
            /-\s+[A-Z]/ // Bullet points
        ];
        
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
        
        let executableScore = 0;
        for (const pattern of executableIndicators) {
            if (pattern.test(text)) executableScore++;
        }
        
        let metaScore = 0;
        for (const pattern of metaIndicators) {
            if (pattern.test(lowerText)) metaScore++;
        }
        
        // Must have more executable indicators than meta indicators
        return executableScore > metaScore && text.length >= this.config.minPromptLength;
    }
    
    /**
     * 🔧 ENHANCED: Validate that the output is a prompt, not content
     */
    validatePromptNotContent(text) {
        if (!text || typeof text !== 'string') {
            return { isValid: false, reason: 'Empty or invalid text', cleanedPrompt: text };
        }
        
        // 🔧 FIX 2: Check minimum length
        if (text.length < this.config.minPromptLength) {
            return { 
                isValid: false, 
                reason: `Prompt too short (${text.length} chars, min ${this.config.minPromptLength})`,
                cleanedPrompt: this.convertContentToPrompt(text)
            };
        }
        
        const lowerText = text.toLowerCase();
        
        // 🔧 FIX 3: Enhanced content detection
        const contentIndicators = [
            // Email content patterns
            /dear\s+(?:mr|mrs|ms|dr)\./i,
            /to:\s*[^\n]+\ncc:/i,
            /subject:\s*[^\n]+/i,
            /best\s+regards,/i,
            /sincerely,/i,
            /thank you for your time/i,
            /yours\s+(?:truly|sincerely)/i,
            /kind\s+regards/i,
            /warm\s+regards/i,
            
            // Code content patterns
            /def\s+\w+\(/i,
            /function\s+\w+\(/i,
            /class\s+\w+/i,
            /import\s+/i,
            /console\.log/i,
            /return\s+/i,
            /public\s+class/i,
            /void\s+main/i,
            /<!DOCTYPE html>/i,
            /<\/?[a-z][\s\S]*>/i,
            
            // Story/Article content
            /once upon a time/i,
            /in conclusion,/i,
            /the end/i,
            /chapter\s+\d+/i,
            /\*\*the end\*\*/i,
            /happily ever after/i,
            
            // Direct responses
            /here(?:'s| is) (?:the|an?)\s+/i,
            /i (?:think|believe|would)\s+/i,
            /you should\s+/i,
            /as requested,/i,
            /here (?:is|are) the/i,
            /based on your request/i,
            
            // Conversation
            /hello,/i,
            /hi there,/i,
            /good morning/i,
            /how are you/i,
            /dear (?:user|reader)/i
        ];
        
        for (const pattern of contentIndicators) {
            if (pattern.test(text)) {
                return { 
                    isValid: false, 
                    reason: `Contains content pattern: ${pattern.toString().substring(0, 50)}...`,
                    cleanedPrompt: this.convertContentToPrompt(text)
                };
            }
        }
        
        // Check for executable prompt patterns
        const promptIndicators = [
            /^(execute|task|write|create|generate|analyze|build|develop|design|compose|perform)/i,
            /requirements?:/i,
            /instructions?:/i,
            /constraints?:/i,
            /format:/i,
            /steps?:/i,
            /\d+\.\s+[A-Z]/,
            /-\s+[A-Z]/,
            /output\s+(?:format|structure):/i,
            /expected\s+output:/i
        ];
        
        let promptScore = 0;
        for (const pattern of promptIndicators) {
            if (pattern.test(text)) {
                promptScore++;
            }
        }
        
        if (promptScore < 2) {
            return { 
                isValid: false, 
                reason: 'Missing executable prompt structure',
                cleanedPrompt: this.convertContentToPrompt(text)
            };
        }
        
        return { isValid: true, reason: 'Valid executable prompt', cleanedPrompt: text };
    }
    
    getStricterSystemPrompt() {
        return `CRITICAL: You MUST output ONLY an EXECUTABLE prompt, NEVER actual content.

EXECUTABLE PROMPT REQUIREMENTS:
- MUST start with action verb (Write, Create, Generate, Analyze, Build, Design)
- MUST use imperative language (commands)
- MUST NOT contain meta-language ("prompt for", "template for")
- MUST be minimum ${this.config.minPromptLength} characters
- MUST include specific requirements and format instructions

VIOLATION EXAMPLES (DO NOT DO THIS):
- ❌ "Dear Mr. Smith, thank you for..." (This is email CONTENT)
- ❌ "Role: Professional writer" (This is META structure)
- ❌ "You should write an email about..." (This is INDIRECT)
- ❌ "I need you to analyze..." (This is CONVERSATIONAL)

REQUIRED OUTPUT FORMAT:
Task to perform: [Clear action]
Requirements: [Specific bullet points]
Format: [Expected output structure]

Example: "Task to perform: Write a professional business proposal...
Requirements:
1. Include executive summary
2. Detail project scope
3. Provide budget breakdown
4. Timeline and deliverables
Format: Formal business document with sections

Remember: The user will copy-paste this directly into an AI tool.`;
    }
    
    /**
     * Convert accidental content into a prompt structure
     */
    convertContentToPrompt(content) {
        console.log('Converting content to executable prompt structure...');
        
        // Try to extract structure from content
        const lines = content.split('\n').filter(line => line.trim());
        
        // Check if it's email-like
        if (content.includes('@') || content.includes('Subject:') || content.includes('Dear')) {
            return `Task to perform: Write a professional email communication

Requirements:
1. Craft appropriate subject line
2. Write professional greeting
3. Structure email body logically
4. Include clear call-to-action
5. Add professional closing
6. Maintain appropriate tone

Format: Complete email with all components

Context: ${content.substring(0, 150)}...`;
        }
        
        // Check if it's code
        if (content.includes('function') || content.includes('def ') || content.includes('class ')) {
            return `Task to perform: Write efficient, clean code

Requirements:
1. Write well-documented code
2. Include error handling
3. Follow best practices
4. Add comments for clarity
5. Consider edge cases
6. Optimize for readability

Format: Complete code with documentation

Context: ${content.substring(0, 150)}...`;
        }
        
        // Default executable prompt
        return `Task to perform: Generate high-quality output based on requirements

Requirements:
1. Analyze requirements carefully
2. Provide comprehensive response
3. Include relevant details
4. Structure information logically
5. Consider different perspectives
6. Be accurate and thorough

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
                isExecutable: this.isExecutablePrompt(result)
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
        console.log('Generating executable prompt locally...');
        
        // Always ensure local generation creates executable prompts
        const template = `Task to perform: ${this.extractObjective(prompt)}

Requirements:
1. Provide comprehensive, detailed output
2. Include all necessary context and specifications
3. Follow best practices for the task type
4. Consider potential edge cases
5. Ensure professional quality
6. Structure information logically

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
        } else if (lowerPrompt.includes('summarize') || lowerPrompt.includes('summary')) {
            return 'Create comprehensive summary';
        }
        
        return 'Address the user query effectively';
    }
    
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
    // UTILITY METHODS
    // ======================
    
    getCacheKey(prompt, options) {
        const keyData = {
            prompt: prompt.substring(0, 100),
            model: options.model,
            style: options.style,
            temperature: options.temperature,
            strictPromptMode: options.strictPromptMode,
            cacheVersion: this.cacheVersion // 🔧 FIX 8: Include version
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
            timestamp: Date.now(),
            version: this.cacheVersion // 🔧 FIX 8: Store version
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
            cacheVersion: this.cacheVersion,
            successRate: this.metrics.totalRequests > 0 
                ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
                : 0,
            averageResponseTime: this.metrics.averageLatency,
            minPromptLength: this.config.minPromptLength
        };
    }
    
    // 🔧 FIX 8: Clear cache when settings change
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
            averageLatency: 0
        };
        console.log('Metrics reset');
    }
}
