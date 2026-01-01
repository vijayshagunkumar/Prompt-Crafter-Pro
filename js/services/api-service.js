// api-service.js - CORRECTED VERSION
(function() {
    'use strict';
    
    class ApiService {
        constructor() {
            // ✅ Your actual Worker URL
            this.baseUrl = 'https://promptcraft-api.vijay-shagunkumar.workers.dev';
            
            // ⚠️ YOUR API KEY IS: Use the value from `ortau_ur_str` in Cloudflare
            // This is your CLIENT key to access your Worker
            this.apiKey = ''; // ← Get this from Cloudflare Variables
            
            // ✅ Set to false to use real API
            this.useSimulatedMode = true; // Change to false when you add the API key below
            
            console.log('[ApiService] Initialized:', {
                url: this.baseUrl,
                hasApiKey: !!this.apiKey,
                mode: this.useSimulatedMode ? 'SIMULATED' : 'REAL API'
            });
        }
        
        async generatePrompt(inputText, style = 'detailed') {
            console.log(`[ApiService] Generating: ${inputText.substring(0, 50)}...`);
            
            // ✅ Temporary simulated mode - comment out when you add API key
            if (this.useSimulatedMode) {
                console.log('[ApiService] Using simulated mode');
                return this.simulateAIProcessing(inputText, style);
            }
            
            // ✅ UNCOMMENT AND ADD YOUR API KEY HERE:
            /*
            this.apiKey = 'YOUR-API-KEY-HERE'; // ← Get from Cloudflare
            this.useSimulatedMode = false;
            */
            
            try {
                console.log('[ApiService] Calling your Worker...');
                
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
                return this.simulateAIProcessing(inputText, style);
            }
        }
        
        simulateAIProcessing(inputText, style = 'detailed') {
            // ... keep your existing simulated response code ...
            return new Promise((resolve) => {
                setTimeout(() => {
                    const promptStyles = {
                        detailed: `Detailed prompt for: ${inputText}`,
                        concise: `Concise: ${inputText}`,
                        creative: `Creative: ${inputText}`,
                        professional: `Professional: ${inputText}`
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
        
        // ... rest of your methods ...
    }
    
    window.ApiService = ApiService;
})();
