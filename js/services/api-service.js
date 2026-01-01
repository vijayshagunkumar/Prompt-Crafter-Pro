// api-service.js - UPDATED with model selection support
(function() {
    'use strict';
    
    class ApiService {
        constructor() {
            // ✅ Your actual Worker URL
            this.baseUrl = 'https://promptcraft-api.vijay-shagunkumar.workers.dev';
            
            // ⚠️ No API key needed when ENABLE_API_KEYS: false in worker
            this.apiKey = '';
            
            // ✅ Set to FALSE to use real AI API through your Worker
            this.useSimulatedMode = false;
            
            // ✅ Default model
            this.selectedModel = 'gemini-3-flash-preview';
            
            this.isOnline = true;
            
            console.log('[ApiService] Initialized with REAL AI API mode:', {
                workerUrl: this.baseUrl,
                mode: 'REAL AI API (no client key needed)',
                defaultModel: this.selectedModel
            });
        }
        
        async generatePrompt(inputText, style = 'detailed', model = null) {
            console.log(`[ApiService] Generating prompt with style: ${style}, model: ${model || this.selectedModel}`);
            
            // Use specified model or default
            const useModel = model || this.selectedModel;
            
            // If we want to use simulated mode for testing, uncomment:
            if (this.useSimulatedMode) {
                console.log('[ApiService] Using simulated mode');
                return this.simulateAIProcessing(inputText, style);
            }
            
            try {
                console.log('[ApiService] Calling Cloudflare Worker (real AI)...');
                
                // ✅ SIMPLE: No API key needed when worker has ENABLE_API_KEYS: false
                const response = await fetch(this.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                        // No x-api-key needed!
                    },
                    body: JSON.stringify({
                        prompt: inputText,
                        model: useModel  // ✅ Use the selected model
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[ApiService] Worker error ${response.status}:`, errorText);
                    throw new Error(`Worker error: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('[ApiService] Worker response received');
                
                if (data.success && data.result) {
                    return {
                        content: data.result,
                        model: data.model || useModel,
                        provider: data.provider || 'cloudflare-worker',
                        success: true,
                        fromAPI: true,
                        rawResponse: data
                    };
                } else {
                    throw new Error(data.error || 'Failed to generate prompt');
                }
                
            } catch (error) {
                console.error('[ApiService] Worker call failed:', error.message);
                
                // Fallback to simulated response
                console.log('[ApiService] Falling back to simulated response');
                return this.simulateAIProcessing(inputText, style);
            }
        }
        
        simulateAIProcessing(inputText, style = 'detailed') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const promptStyles = {
                        detailed: `You are an expert AI assistant with specialized knowledge in this domain. Your task is to:

Context:
${inputText}

Requirements:
1. Provide comprehensive, detailed analysis
2. Include specific examples and actionable insights
3. Structure the response with clear sections
4. Use professional terminology appropriately
5. Consider potential edge cases and limitations
6. Offer practical recommendations

Please deliver a thorough, well-structured response that addresses all aspects of the task. Begin with an executive summary, then proceed with detailed analysis, and conclude with clear next steps.`,

                        concise: `Task: ${inputText}

Provide a direct, concise response focusing on key points. Use clear language and avoid unnecessary elaboration.`,

                        creative: `Creative Prompt:
${inputText}

Approach this with innovative thinking and imaginative solutions. Use engaging language, storytelling elements where appropriate, and focus on unique perspectives. Be original and inspiring in your response.`,

                        professional: `Professional Request: ${inputText}

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

                    resolve({
                        content: promptStyles[style] || promptStyles.detailed,
                        model: 'simulated',
                        provider: 'simulated',
                        success: true,
                        fromAPI: false
                    });
                }, 1500);
            });
        }
        
        async checkStatus() {
            try {
                // Check worker health endpoint
                const response = await fetch(`${this.baseUrl}/health`);
                if (response.ok) {
                    const health = await response.json();
                    console.log('[ApiService] Worker health:', health.status);
                    this.isOnline = true;
                    return true;
                }
            } catch (error) {
                console.log('[ApiService] Health check failed:', error.message);
                this.isOnline = false;
            }
            return false;
        }
        
        async savePrompt(promptData) {
            console.log('[ApiService] Saving prompt locally:', promptData);
            // In the future, you could save to Cloudflare KV
            return { success: true, id: Date.now() };
        }
        
        async loadPrompts() {
            // In the future, you could load from Cloudflare KV
            return [];
        }
        
        // Helper to set API configuration
        setApiConfig(baseUrl, apiKey, model = null) {
            this.baseUrl = baseUrl;
            this.apiKey = apiKey;
            if (model) {
                this.selectedModel = model;
            }
            console.log('[ApiService] API configuration updated');
        }
        
        // Set selected model
        setModel(model) {
            this.selectedModel = model;
            console.log(`[ApiService] Model set to: ${model}`);
        }
        
        // Get current API status
        getApiStatus() {
            return {
                hasApiKey: !!this.apiKey,
                baseUrl: this.baseUrl,
                selectedModel: this.selectedModel,
                useSimulatedMode: this.useSimulatedMode,
                isOnline: this.isOnline,
                config: 'Using Worker with ENABLE_API_KEYS: false'
            };
        }
        
        // Method to switch between simulated and real mode
        setMode(useSimulated) {
            this.useSimulatedMode = useSimulated;
            console.log(`[ApiService] Mode changed to: ${useSimulated ? 'SIMULATED' : 'REAL API'}`);
        }
    }
    
    // Export to global scope
    window.ApiService = ApiService;
    
})();
