class ApiService {
    constructor() {
        // ✅ Your Worker URL
        this.baseUrl = 'https://promptcraft-api.vijay-shagunkumar.workers.dev';
        
        // ⚠️ YOU NEED TO ADD YOUR ACTUAL API KEY HERE
        // Get it from Cloudflare: ortau_ur_str variable
        this.apiKey = ''; // ← Add your actual API key here
        
        // ✅ CHANGE THIS TO FALSE to use real API
        this.useSimulatedMode = false; // ← Change from true to false
        
        console.log('[ApiService] Initialized with:', {
            url: this.baseUrl,
            hasApiKey: !!this.apiKey,
            mode: this.useSimulatedMode ? 'SIMULATED' : 'REAL API'
        });
    }
    
    async generatePrompt(inputText, style = 'detailed') {
        console.log(`[ApiService] Generating: ${inputText.substring(0, 50)}...`);
        
        // If no API key, fall back to simulated
        if (!this.apiKey) {
            console.log('[ApiService] No API key, using simulated mode');
            return this.simulateAIProcessing(inputText, style);
        }
        
        // ✅ Now this will call your real Worker API
        try {
            console.log('[ApiService] Calling your Worker API...');
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey  // ← This needs to match ortau_ur_str in Cloudflare
                },
                body: JSON.stringify({
                    prompt: inputText,
                    model: 'gemini-3-flash-preview'
                })
            });
            
            // ... rest of your real API code ...
            
        } catch (error) {
            console.error('[ApiService] API call failed:', error);
            return this.simulateAIProcessing(inputText, style);
        }
    }
}
