// Prompt Generator with Cloudflare Worker Integration
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
                    suggestions: response.suggestions || [],
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

    // Call Cloudflare Worker API
async callWorkerAPI(input, options) {
    const { workerUrl, timeout } = this.config;
    const signal = this.abortController.signal;

    const requestData = {
        prompt: input,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        timestamp: Date.now()
    };

    const headers = {
        'Content-Type': 'application/json',
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
            promptLength: input.length 
        });

        const fetchPromise = fetch(workerUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestData),
            signal: signal,
            mode: 'cors'
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Check response status
        if (!response.ok) {
            let errorText = 'No error text available';
            try {
                errorText = await response.text();
            } catch (e) {
                // Ignore text extraction error
            }
            
            console.error('Worker API error:', {
                status: response.status,
                statusText: response.statusText,
                url: workerUrl
            });
            
            throw new Error(`Worker API error (${response.status}): ${response.statusText}`);
        }

        // Parse response carefully
        let data;
        try {
            const responseText = await response.text();
            
            // Clean response text (remove any invalid characters)
            const cleanedText = responseText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
            
            data = JSON.parse(cleanedText);
            
            // Log response for debugging
            console.log('Worker response parsed:', {
                success: data.success,
                model: data.model,
                hasResult: !!data.result,
                resultLength: data.result?.length || 0
            });
            
        } catch (parseError) {
            console.error('Failed to parse worker response:', parseError);
            console.error('Raw response (first 500 chars):', 
                (await response.text()).substring(0, 500));
            throw new Error('Invalid response from worker');
        }
        
        // Check if worker returned success
        if (!data.success) {
            console.error('Worker returned unsuccessful response:', data);
            throw new Error(data.error || 'Worker returned unsuccessful response');
        }
        
        // Check for required fields
        if (!data.result) {
            console.error('Worker response missing result field:', data);
            throw new Error('No result in worker response');
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
            detailed: `You are an expert AI assistant with specialized knowledge in this domain. Your task is to:

Context:
${input}

Requirements:
1. Provide comprehensive, detailed analysis
2. Include specific examples and actionable insights
3. Structure the response with clear sections
4. Use professional terminology appropriately
5. Consider potential edge cases and limitations
6. Offer practical recommendations

Please deliver a thorough, well-structured response that addresses all aspects of the task. Begin with an executive summary, then proceed with detailed analysis, and conclude with clear next steps.`,

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

    // Test worker connection
    async testConnection() {
        try {
            // Test health endpoint
            const healthUrl = this.config.workerUrl.replace(/\/$/, '') + '/health';
            console.log('Testing connection to:', healthUrl);
            
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'PromptCraftPro/2.0'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                console.error('Health check failed:', response.status, response.statusText);
                return {
                    connected: false,
                    status: response.status,
                    statusText: response.statusText,
                    error: 'Health check failed'
                };
            }

            const data = await response.json();
            console.log('Health check successful:', data);
            
            return {
                connected: true,
                status: response.status,
                health: data,
                models: data.models || []
            };
            
        } catch (error) {
            console.error('Worker connection test failed:', error);
            return {
                connected: false,
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
