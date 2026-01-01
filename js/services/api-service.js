// api-service.js - FIXED VERSION
(function() {
    'use strict';
    
    class ApiService {
        constructor() {
            // ✅ Your Worker URL
            this.baseUrl = 'https://promptcraft-api.vijay-shagunkumar.workers.dev';
            
            // ⚠️ Add your API key here when you get it
            this.apiKey = ''; // Leave empty for now
            
            // ✅ Simulated mode works without API key
            this.useSimulatedMode = !this.apiKey;
            
            console.log('[ApiService] Initialized:', {
                url: this.baseUrl,
                hasApiKey: !!this.apiKey,
                mode: this.useSimulatedMode ? 'SIMULATED' : 'REAL API'
            });
        }
        
        async generatePrompt(inputText, style = 'detailed') {
            console.log(`[ApiService] Generating: ${inputText.substring(0, 50)}...`);
            
            // If no API key or in simulated mode, use simulated response
            if (!this.apiKey || this.useSimulatedMode) {
                console.log('[ApiService] Using simulated mode');
                return this.simulateAIProcessing(inputText, style);
            }
            
            try {
                console.log('[ApiService] Calling your Worker API...');
                
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
                    console.error(`[ApiService] Error ${response.status}:`, errorText);
                    throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success && data.result) {
                    return {
                        content: data.result,
                        model: data.model || 'gemini-3-flash-preview',
                        provider: data.provider || 'cloudflare-worker',
                        success: true,
                        fromAPI: true
                    };
                } else {
                    throw new Error(data.error || 'Failed to generate');
                }
                
            } catch (error) {
                console.error('[ApiService] API call failed:', error);
                console.log('[ApiService] Falling back to simulated response');
                return this.simulateAIProcessing(inputText, style);
            }
        }
        
        // ✅ ADD THIS METHOD - It was missing!
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
            // Always return true for simulated mode
            if (this.useSimulatedMode) {
                return true;
            }
            
            if (this.apiKey) {
                try {
                    const response = await fetch(`${this.baseUrl}/health`);
                    return response.ok;
                } catch (error) {
                    console.log('[ApiService] Health check failed:', error);
                    return false;
                }
            }
            
            return true;
        }
        
        async savePrompt(promptData) {
            console.log('[ApiService] Saving prompt locally:', promptData);
            return { success: true, id: Date.now() };
        }
        
        async loadPrompts() {
            return [];
        }
        
        setApiConfig(baseUrl, apiKey) {
            this.baseUrl = baseUrl;
            this.apiKey = apiKey;
            console.log('[ApiService] API configuration updated');
        }
        
        getApiStatus() {
            return {
                hasApiKey: !!this.apiKey,
                baseUrl: this.baseUrl,
                useSimulatedMode: this.useSimulatedMode,
                isOnline: true
            };
        }
    }
    
    // ✅ EXPORT PROPERLY - This was missing!
    if (typeof window !== 'undefined') {
        window.ApiService = ApiService;
        console.log('[ApiService] Exported to window.ApiService');
    }
    
    // ✅ Also export for ES6 modules
    if (typeof exports !== 'undefined') {
        exports.ApiService = ApiService;
    }
    
})();
