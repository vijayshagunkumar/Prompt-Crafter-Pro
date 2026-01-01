// api-service.js - API service with Cloudflare Worker integration
(function() {
    'use strict';
    
    class ApiService {
        constructor() {
            // ✅ FIXED: No trailing slash in URL
            this.baseUrl = 'https://promptcraft-api.vijay-shagunkumar.workers.dev';
            
            // ⚠️ You need to get this from your Cloudflare Worker environment variables
            // Look for: ortau_ur_str
            this.apiKey = 'your-actual-api-key-here'; // Get this from Cloudflare Dashboard
            
            // Set to true temporarily if you don't have the API key yet
            this.useSimulatedMode = true; // Change to false when you have the API key
            
            this.isOnline = true;
        }
        
        async generatePrompt(inputText, style = 'detailed') {
            console.log(`[ApiService] Generating prompt with style: ${style}`);
            
            // If no API key is set or we're in simulated mode, use local generation
            if (!this.apiKey || this.apiKey === 'your-actual-api-key-here' || this.useSimulatedMode) {
                console.log('[ApiService] Using simulated mode (no API key configured)');
                return this.simulateAIProcessing(inputText, style);
            }
            
            try {
                console.log('[ApiService] Calling Cloudflare Worker API...');
                
                const response = await fetch(this.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey
                    },
                    body: JSON.stringify({
                        prompt: inputText,
                        model: 'gemini-3-flash-preview'
                    })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[ApiService] API error ${response.status}:`, errorText);
                    throw new Error(`API error: ${response.status} - ${errorText.substring(0, 100)}`);
                }
                
                const data = await response.json();
                console.log('[ApiService] API response:', data);
                
                if (data.success && data.result) {
                    return {
                        content: data.result,
                        model: data.model || 'gemini-3-flash-preview',
                        provider: data.provider || 'cloudflare-worker',
                        success: true,
                        fromAPI: true
                    };
                } else {
                    throw new Error(data.error || 'Failed to generate prompt');
                }
                
            } catch (error) {
                console.error('[ApiService] API call failed:', error);
                
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
            // Try to check API health
            if (this.apiKey && this.apiKey !== 'your-actual-api-key-here') {
                try {
                    const response = await fetch(`${this.baseUrl}/health`);
                    return response.ok;
                } catch (error) {
                    console.log('[ApiService] Health check failed:', error);
                    return false;
                }
            }
            
            // If no API key, just return true for simulated mode
            return true;
        }
        
        async savePrompt(promptData) {
            console.log('[ApiService] Saving prompt locally:', promptData);
            return { success: true, id: Date.now() };
        }
        
        async loadPrompts() {
            return [];
        }
        
        // Helper to set API configuration
        setApiConfig(baseUrl, apiKey) {
            this.baseUrl = baseUrl;
            this.apiKey = apiKey;
            console.log('[ApiService] API configuration updated');
        }
        
        // Get current API status
        getApiStatus() {
            return {
                hasApiKey: !!this.apiKey && this.apiKey !== 'your-actual-api-key-here',
                baseUrl: this.baseUrl,
                useSimulatedMode: this.useSimulatedMode,
                isOnline: this.isOnline
            };
        }
    }
    
    // Export to global scope
    window.ApiService = ApiService;
    
})();
