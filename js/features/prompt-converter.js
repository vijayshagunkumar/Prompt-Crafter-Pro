import { appState } from '../core/app-state.js';
import { notifications } from '../ui/notifications.js';
import { toolPrioritizer } from './tool-prioritizer.js'; // ADD THIS IMPORT

export class PromptConverter {
    constructor() {
        this.isConverting = false;
        this.lastConversionPromise = null;
        this.setup();
    }
    
    setup() {
        // Manual convert button
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.convert());
        }
        
        // Auto-convert on input if enabled
        const input = document.getElementById('requirement');
        const autoToggle = document.getElementById('autoConvert');
        
        if (input && autoToggle) {
            autoToggle.checked = appState.autoConvertEnabled;
            
            let timeout;
            
            // Auto-clear Card 2 when Card 1 is empty
            input.addEventListener('input', () => {
                const text = input.value.trim();
                
                // Clear Card 2 if Card 1 is empty
                if (!text) {
                    this.clearGeneratedPrompt();
                }
                
                if (autoToggle.checked && text) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => this.convert(), 1000);
                }
            });
            
            // Update app state when toggle changes
            autoToggle.addEventListener('change', (e) => {
                appState.autoConvertEnabled = e.target.checked;
                appState.saveSettings();
            });
        }
    }
    
    clearGeneratedPrompt() {
        const output = document.getElementById('output');
        if (output) {
            output.value = '';
            
            // Update counters
            this.updateCounters();
            
            // Disable AI buttons
            document.querySelectorAll('.launch-btn').forEach(btn => {
                btn.disabled = true;
            });
            
            // Hide success badge
            const badge = document.getElementById('convertedBadge');
            if (badge) {
                badge.style.display = 'none';
            }
            
            // Hide voice output button
            const voiceOutputBtn = document.getElementById('voiceOutputBtn');
            if (voiceOutputBtn) {
                voiceOutputBtn.style.display = 'none';
            }
            
            // Reset app state
            appState.isConverted = false;
            appState.lastConvertedText = '';
            appState.lastRole = '';
        }
    }
    
    async convert() {
        // Prevent multiple simultaneous conversions
        if (this.isConverting) return;
        
        const input = document.getElementById('requirement');
        const output = document.getElementById('output');
        
        if (!input || !output) return;
        
        const requirement = input.value.trim();
        
        if (!requirement) {
            notifications.error('Please enter your idea first');
            return;
        }
        
        this.isConverting = true;
        
        try {
            // Show loading state - FIX: Proper loader with immediate stop
            const convertBtn = document.getElementById('convertBtn');
            const originalHTML = convertBtn.innerHTML;
            
            // Set loading state
            convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            convertBtn.disabled = true;
            
            // Create conversion promise
            this.lastConversionPromise = new Promise((resolve) => {
                setTimeout(() => {
                    const { role, preset, label } = this.analyzeText(requirement);
                    const optimizedPrompt = this.generatePrompt(requirement, role);
                    
                    // Update output
                    output.value = optimizedPrompt;
                    
                    // Update app state
                    appState.isConverted = true;
                    appState.lastConvertedText = optimizedPrompt;
                    appState.lastRole = role;
                    appState.incrementUsage();
                    
                    // Enable launch buttons
                    document.querySelectorAll('.launch-btn').forEach(btn => {
                        btn.disabled = false;
                    });
                    
                    // PRIORITIZE AI TOOLS BASED ON CONTENT - ADD THIS
                    const bestTool = toolPrioritizer.prioritizeTools(requirement);
                    
                    // Show success badge
                    const badge = document.getElementById('convertedBadge');
                    if (badge) {
                        badge.style.display = 'flex';
                    }
                    
                    // Update counters
                    this.updateCounters();
                    
                    // Update usage display
                    const usageElement = document.getElementById('usageCount');
                    if (usageElement) {
                        usageElement.innerHTML = `<i class="fas fa-bolt"></i> ${appState.usageCount} prompts`;
                    }
                    
                    // Show voice output button
                    const voiceOutputBtn = document.getElementById('voiceOutputBtn');
                    if (voiceOutputBtn) {
                        voiceOutputBtn.style.display = 'block';
                    }
                    
                    // FIX: Stop loader immediately
                    convertBtn.innerHTML = originalHTML;
                    convertBtn.disabled = false;
                    
                    // FIX: Show only ONE success notification
                    notifications.success('Prompt generated successfully!', 3000);
                    
                    resolve();
                }, 800); // Simulated processing time
            });
            
            await this.lastConversionPromise;
            
        } catch (error) {
            console.error('Conversion error:', error);
            notifications.error('Failed to generate prompt');
            
            // Reset button on error
            const convertBtn = document.getElementById('convertBtn');
            if (convertBtn) {
                convertBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Prompt';
                convertBtn.disabled = false;
            }
        } finally {
            this.isConverting = false;
            this.lastConversionPromise = null;
        }
    }
    
    analyzeText(text) {
        const lower = (text || "").toLowerCase();
        let role = "expert assistant";
        let preset = "default";
        let label = "General";
      
        // Email detection
        if (/email|mail|send.*to|message.*to|follow[- ]up/i.test(lower)) {
          role = "expert email writer";
          preset = "default";
          label = "Email";
        } 
        // Code detection
        else if (/code|program|script|develop|software|function|python|javascript|typescript|java|c#|sql|api|bug fix|refactor/i.test(lower)) {
          role = "expert developer";
          preset = "chatgpt";
          label = "Code";
        } 
        // Analysis detection
        else if (/analyze|analysis|market|research|evaluate|assessment|review|trend|report|insight|metrics/i.test(lower)) {
          role = "expert analyst";
          preset = "detailed";
          label = "Analysis";
        } 
        // Writing detection
        else if (/blog|article|story|linkedin post|caption|copywriting|content/i.test(lower)) {
          role = "expert content writer";
          preset = "default";
          label = "Writing";
        } 
        // Fitness detection
        else if (/workout|exercise|fitness|gym|diet|meal plan|training plan/i.test(lower)) {
          role = "expert fitness trainer";
          preset = "detailed";
          label = "Workout";
        } 
        // Business detection
        else if (/strategy|business plan|roadmap|pitch deck|proposal|go[- ]to[- ]market|g2m/i.test(lower)) {
          role = "expert business consultant";
          preset = "detailed";
          label = "Business";
        } 
        // Education detection
        else if (/teach|explain|lesson|tutorial|guide|training material|curriculum/i.test(lower)) {
          role = "expert educator";
          preset = "detailed";
          label = "Education";
        }
        // Creative detection
        else if (/creative|design|logo|brand|marketing|ad|campaign/i.test(lower)) {
          role = "expert creative director";
          preset = "detailed";
          label = "Creative";
        }
      
        return { role, preset, label };
    }
    
    generatePrompt(requirement, role) {
        // Build prompt structure using the detected role
        const prompt = `Act as a ${role}.

TASK: ${requirement}

INSTRUCTIONS:
1. Provide a comprehensive and detailed response
2. Structure your answer logically with clear sections
3. Use examples and practical applications where relevant
4. Include actionable advice and next steps
5. Maintain a professional, helpful tone

Please proceed with the task and provide your complete response below:`;

        return prompt;
    }
    
    updateCounters() {
        const output = document.getElementById('output');
        if (!output) return;
        
        const text = output.value;
        const charCount = document.getElementById('charCount');
        const wordCount = document.getElementById('wordCount');
        const lineCount = document.getElementById('lineCount');
        
        if (charCount) {
            charCount.textContent = `${text.length} chars`;
        }
        
        if (wordCount) {
            wordCount.textContent = `${text.split(/\s+/).filter(w => w.length > 0).length} words`;
        }
        
        if (lineCount) {
            lineCount.textContent = `${text.split('\n').length} lines`;
        }
    }
}

export const promptConverter = new PromptConverter();
