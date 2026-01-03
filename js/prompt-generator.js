// Prompt Generator with Cloudflare Worker Integration - COMPLETE FIXED VERSION
class PromptGenerator {
    constructor(config = {}) {
        // Default configuration - USING YOUR WORKER URL
        this.config = {
            workerUrl: config.workerUrl || 'https://promptcraft-api.vijay-shagunkumar.workers.dev/',
            apiKey: config.apiKey || '',
            defaultModel: config.defaultModel || 'gemini-3-flash-preview',
            timeout: config.timeout || 30000,
            retries: config.retries || 3,
            fallbackToLocal: config.fallbackToLocal !== false,
            ...config
        };

        console.log('PromptGenerator initialized with worker:', this.config.workerUrl);
        this.isGenerating = false;
        this.abortController = null;
    }

    // Generate prompt using Cloudflare Worker
    async generatePrompt(input, options = {}) {
        // Don't generate if already generating
        if (this.isGenerating) {
            throw new Error('Generation already in progress');
        }

        this.isGenerating = true;
        this.abortController = new AbortController();

        try {
            const mergedOptions = {
                model: options.model || this.config.defaultModel,
                style: options.style || 'detailed',
                temperature: options.temperature || 0.4,
                maxTokens: options.maxTokens || 1000,
                ...options
            };

            console.log('Calling worker API with options:', mergedOptions);
            const response = await this.callWorkerAPI(input, mergedOptions);
            
            if (response.success) {
                return {
                    success: true,
                    prompt: response.result, // Worker returns "result" field
                    suggestions: response.suggestions || this.generateSuggestions(input),
                    metadata: {
                        model: response.model,
                        provider: response.provider,
                        usage: response.usage,
                        requestId: response.requestId,
                        timestamp: new Date().toISOString()
                    }
                };
            } else {
                throw new Error(response.error || 'Failed to generate prompt');
            }

        } catch (error) {
            console.error('Prompt generation failed:', error);
            
            // Fallback to local generation if worker fails
            if (this.config.fallbackToLocal) {
                console.warn('Falling back to local generation');
                return this.generatePromptLocally(input, options);
            }
            
            throw error;
            
        } finally {
            this.isGenerating = false;
            this.abortController = null;
        }
    }

    // Call Cloudflare Worker API - COMPLETE FIX WITH EXTRA CHARACTERS HANDLING
    async callWorkerAPI(input, options) {
        const { workerUrl, timeout } = this.config;
        const signal = this.abortController.signal;

        const requestData = {
            prompt: input,
            model: options.model,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            style: options.style,
            timestamp: Date.now()
        };

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'PromptCraftPro/2.0'
        };

        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    if (this.abortController) {
                        this.abortController.abort();
                    }
                    reject(new Error('Request timeout after ' + timeout + 'ms'));
                }, timeout);
            });

            console.log('Sending request to:', workerUrl);
            console.log('Request data:', { 
                model: requestData.model,
                promptLength: input.length,
                style: requestData.style
            });

            const fetchPromise = fetch(workerUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData),
                signal: signal,
                mode: 'cors'
            });

            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            // SAFE RESPONSE PARSING - HANDLE EXTRA CHARACTERS
            console.log('Response status:', response.status, response.statusText);
            
            // Get raw response text first
            const rawResponseText = await response.text();
            console.log('Raw response length:', rawResponseText.length);
            console.log('Full raw response:', rawResponseText); // CRITICAL - SEE FULL RESPONSE
            
            // Check if response is completely empty
            if (!rawResponseText || rawResponseText.trim() === '') {
                throw new Error('Empty response from worker');
            }
            
            // FIX: Handle extra characters after JSON
            let data;
            let cleanedResponse = rawResponseText;
            
            // Try 1: Parse as-is first
            try {
                data = JSON.parse(rawResponseText);
                console.log('✅ Parsed response successfully as-is');
            } catch (firstParseError) {
                console.log('First parse failed, trying to clean response...');
                
                // Try 2: Remove everything after the last closing brace
                const lastBraceIndex = rawResponseText.lastIndexOf('}');
                if (lastBraceIndex > 0) {
                    cleanedResponse = rawResponseText.substring(0, lastBraceIndex + 1);
                    console.log('Extracted JSON portion:', cleanedResponse);
                    
                    try {
                        data = JSON.parse(cleanedResponse);
                        console.log('✅ Parsed cleaned response successfully');
                    } catch (secondParseError) {
                        console.error('Second parse failed:', secondParseError.message);
                        
                        // Try 3: Find JSON object with regex
                        const jsonMatch = rawResponseText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            cleanedResponse = jsonMatch[0];
                            console.log('Found JSON with regex:', cleanedResponse.substring(0, 200) + '...');
                            
                            try {
                                data = JSON.parse(cleanedResponse);
                                console.log('✅ Parsed regex-extracted JSON successfully');
                            } catch (thirdParseError) {
                                console.error('All JSON parsing attempts failed');
                                throw new Error(`Invalid response format: ${thirdParseError.message}`);
                            }
                        } else {
                            throw new Error('No valid JSON found in response');
                        }
                    }
                } else {
                    throw new Error('No closing brace found in response');
                }
            }
            
            // Log what we successfully parsed
            console.log('Worker response parsed:', {
                success: data.success,
                model: data.model,
                hasResult: !!(data.result || data.prompt),
                resultLength: (data.result || data.prompt || '').length,
                keys: Object.keys(data)
            });
            
            // Debug: Show the actual result content
            if (data.result || data.prompt) {
                const result = data.result || data.prompt;
                console.log('Result preview (first 500 chars):', result.substring(0, 500));
                console.log('Result length:', result.length);
                
                // Check if result is cut off
                if (result.length < 100 && input.length > 100) {
                    console.warn('⚠️ Result seems too short compared to input');
                }
            }
            
            // Check if worker returned success
            if (!data.success) {
                console.error('Worker returned unsuccessful response:', data);
                throw new Error(data.error || data.message || 'Worker returned unsuccessful response');
            }
            
            // Check for required fields
            if (!data.result && !data.prompt) {
                console.error('Worker response missing result/prompt field:', data);
                throw new Error('No result in worker response');
            }
            
            // Normalize response format
            if (data.prompt && !data.result) {
                data.result = data.prompt;
            }
            
            return data;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request was aborted due to timeout');
            }
            throw error;
        }
    }

    // Fallback local prompt generation
    generatePromptLocally(input, options = {}) {
        const style = options.style || 'detailed';
        
        const promptStyles = {
            detailed: `# Optimized AI Prompt

## Task Description:
${input}

## Enhanced Instructions:

1. **Context & Objective**: ${this.extractObjective(input)}
2. **Key Requirements**: ${this.extractRequirements(input)}
3. **Expected Output Format**: Clear, structured, and actionable
4. **Quality Criteria**: Professional, detailed, and comprehensive
5. **Additional Considerations**: Include examples where relevant

## Final Prompt to AI:
Please provide a comprehensive response to the above task, ensuring it is:
- Well-structured and organized
- Includes practical examples
- Addresses all specified requirements
- Maintains professional tone and clarity
- Delivers actionable insights and recommendations`,

            concise: `Task: ${input}

Provide a direct, concise response focusing on key points. Use clear language and avoid unnecessary elaboration.`,

            creative: `Creative Prompt:
${input}

Approach this with innovative thinking and imaginative solutions. Use engaging language, storytelling elements where appropriate, and focus on unique perspectives. Be original and inspiring in your response.`,

            analytical: `Analytical Task: ${input}

Please provide a structured analysis including:
1. Key metrics and data points
2. Trend analysis and patterns
3. Comparative assessment
4. Risk evaluation
5. Data-driven recommendations
6. Supporting evidence and sources

Use objective language and focus on measurable outcomes.`,

            professional: `Professional Request: ${input}

Prepare a formal, business-appropriate response that includes:
• Executive summary
• Background and context
• Detailed analysis
• Strategic recommendations
• Implementation considerations
• Risk assessment
• Next steps

Use professional tone and formal structure suitable for business communications.`
        };

        const prompt = promptStyles[style] || promptStyles.detailed;
        
        // Generate simple suggestions
        const suggestions = this.generateSuggestions(prompt);

        return {
            success: true,
            prompt: prompt,
            suggestions: suggestions,
            metadata: {
                generatedLocally: true,
                model: 'local-fallback',
                style: style,
                timestamp: new Date().toISOString()
            }
        };
    }

    // Helper methods for local generation
    extractObjective(text) {
        if (text.includes('create') || text.includes('generate')) {
            return 'Generate content based on specifications';
        } else if (text.includes('analyze') || text.includes('review')) {
            return 'Analyze and provide insights';
        } else if (text.includes('write') || text.includes('compose')) {
            return 'Create written content';
        } else if (text.includes('design') || text.includes('develop')) {
            return 'Design or develop a solution';
        }
        return 'Complete the specified task with excellence';
    }

    extractRequirements(text) {
        const requirements = [];
        if (text.length > 100) requirements.push('Detailed response');
        if (text.includes('example')) requirements.push('Include examples');
        if (text.includes('format') || text.includes('structure')) requirements.push('Proper formatting');
        if (text.includes('specific') || text.includes('concrete')) requirements.push('Specific details');
        if (text.includes('professional') || text.includes('business')) requirements.push('Professional tone');
        return requirements.join(', ') || 'Clear, comprehensive, and actionable';
    }

    // Generate optimization suggestions
    generateSuggestions(prompt) {
        const suggestions = [];
        
        // Check for clarity
        if (prompt.split(' ').length < 20) {
            suggestions.push({
                id: 'add-details',
                text: 'Add more details for better results',
                icon: 'fas fa-plus-circle',
                severity: 'low',
                action: 'Add specific requirements and context.'
            });
        }
        
        // Check for structure
        if (!prompt.includes(':')) {
            suggestions.push({
                id: 'add-structure',
                text: 'Add structured sections with colons',
                icon: 'fas fa-list',
                severity: 'medium',
                action: 'Add sections like "Requirements:", "Context:", "Format:"'
            });
        }
        
        // Check for action verbs
        const actionVerbs = ['create', 'analyze', 'write', 'develop', 'design', 'optimize'];
        const hasActionVerb = actionVerbs.some(verb => prompt.toLowerCase().includes(verb));
        if (!hasActionVerb) {
            suggestions.push({
                id: 'add-action',
                text: 'Start with a clear action verb',
                icon: 'fas fa-bolt',
                severity: 'medium',
                action: 'Begin with verbs like "Create", "Analyze", or "Write"'
            });
        }
        
        // Check for length
        const wordCount = prompt.split(' ').length;
        if (wordCount > 500) {
            suggestions.push({
                id: 'reduce-length',
                text: 'Consider shortening for better focus',
                icon: 'fas fa-scissors',
                severity: 'low',
                action: 'Focus on key requirements and remove redundant information'
            });
        }
        
        // Check for specificity
        const specificWords = ['specific', 'detailed', 'concrete', 'example', 'step-by-step'];
        const hasSpecificWords = specificWords.some(word => prompt.toLowerCase().includes(word));
        if (!hasSpecificWords) {
            suggestions.push({
                id: 'add-specificity',
                text: 'Make the prompt more specific',
                icon: 'fas fa-bullseye',
                severity: 'medium',
                action: 'Add specific examples or requirements'
            });
        }
        
        return suggestions;
    }

    // Cancel ongoing generation
    cancelGeneration() {
        if (this.abortController && this.abortController.abort) {
            this.abortController.abort();
            this.isGenerating = false;
            return true;
        }
        return false;
    }

    // Test worker connection - FIXED VERSION
    async testConnection() {
        try {
            // Test health endpoint
            const healthUrl = this.config.workerUrl.replace(/\/$/, '') + '/health';
            console.log('Testing connection to:', healthUrl);
            
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'PromptCraftPro/2.0'
                },
                mode: 'cors',
                signal: AbortSignal.timeout(10000)
            });

            // Get raw response first
            const responseText = await response.text();
            console.log('Health response raw:', responseText.substring(0, 200));
            
            if (!response.ok) {
                console.error('Health check failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    response: responseText.substring(0, 200)
                });
                return {
                    connected: false,
                    status: response.status,
                    statusText: response.statusText,
                    error: 'Health check failed',
                    rawResponse: responseText.substring(0, 500)
                };
            }

            // Parse JSON safely
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse health response as JSON:', parseError);
                return {
                    connected: false,
                    status: response.status,
                    error: 'Invalid JSON response from health endpoint',
                    rawResponse: responseText.substring(0, 500)
                };
            }
            
            console.log('Health check successful:', data);
            
            return {
                connected: true,
                success: true,
                status: response.status,
                health: data,
                models: data.models || []
            };
            
        } catch (error) {
            console.error('Worker connection test failed:', error);
            return {
                connected: false,
                success: false,
                error: error.message
            };
        }
    }

    // Get available models
    async getAvailableModels() {
        try {
            const health = await this.testConnection();
            if (health.connected && health.models) {
                return health.models;
            }
            return ['gemini-3-flash-preview', 'gpt-4o-mini', 'llama-3.1-8b-instant'];
        } catch (error) {
            console.error('Failed to get available models:', error);
            return ['gemini-3-flash-preview'];
        }
    }

    // Update configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('PromptGenerator config updated:', this.config);
    }

    // Get current configuration
    getConfig() {
        return { ...this.config };
    }

    // Clear sensitive data
    clearSensitiveData() {
        this.config.apiKey = '';
        this.abortController = null;
    }
}
