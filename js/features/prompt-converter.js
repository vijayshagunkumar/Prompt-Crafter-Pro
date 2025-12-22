import { appState } from '../core/app-state.js';
import { notifications } from '../ui/notifications.js';
import { toolPrioritizer } from './tool-prioritizer.js';

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
                
                if (!text) {
                    this.clearGeneratedPrompt();
                }
                
                if (autoToggle.checked && text) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => this.convert(), 1000);
                }
            });
            
            autoToggle.addEventListener('change', (e) => {
                appState.autoConvertEnabled = e.target.checked;
                appState.saveSettings();
            });
        }
    }
    
    clearGeneratedPrompt() {
        const output = document.getElementById('output');
        if (!output) return;
        
        output.value = '';
        this.updateCounters();
        
        document.querySelectorAll('.launch-btn').forEach(btn => {
            btn.disabled = true;
        });
        
        const badge = document.getElementById('convertedBadge');
        if (badge) badge.style.display = 'none';
        
        const voiceOutputBtn = document.getElementById('voiceOutputBtn');
        if (voiceOutputBtn) voiceOutputBtn.style.display = 'none';
        
        appState.isConverted = false;
        appState.lastConvertedText = '';
        appState.lastRole = '';
    }
    
    async convert() {
        if (this.isConverting) return;
        
        const input = document.getElementById('requirement');
        const output = document.getElementById('output');
        const convertBtn = document.getElementById('convertBtn');
        
        if (!input || !output || !convertBtn) return;
        
        const requirement = input.value.trim();
        if (!requirement) {
            notifications.error('Please enter your idea first');
            return;
        }
        
        this.isConverting = true;
        
        const originalHTML = convertBtn.innerHTML;
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        convertBtn.disabled = true;
        
        try {
            this.lastConversionPromise = new Promise(resolve => {
                setTimeout(() => {
                    const { role } = this.analyzeText(requirement);
                    const optimizedPrompt = this.generatePrompt(requirement, role);
                    
                    output.value = optimizedPrompt;
                    
                    appState.isConverted = true;
                    appState.lastConvertedText = optimizedPrompt;
                    appState.lastRole = role;
                    appState.incrementUsage();
                    
                    document.querySelectorAll('.launch-btn').forEach(btn => {
                        btn.disabled = false;
                    });
                    
                    toolPrioritizer.prioritizeTools(requirement);
                    
                    const badge = document.getElementById('convertedBadge');
                    if (badge) badge.style.display = 'flex';
                    
                    this.updateCounters();
                    
                    const usageElement = document.getElementById('usageCount');
                    if (usageElement) {
                        usageElement.innerHTML = `<i class="fas fa-bolt"></i> ${appState.usageCount} prompts`;
                    }
                    
                    const voiceOutputBtn = document.getElementById('voiceOutputBtn');
                    if (voiceOutputBtn) voiceOutputBtn.style.display = 'block';
                    
                    notifications.success('Prompt generated successfully!', 3000);
                    resolve();
                }, 800);
            });
            
            await this.lastConversionPromise;
            
        } catch (error) {
            console.error('Conversion error:', error);
            notifications.error('Failed to generate prompt');
        } finally {
            convertBtn.innerHTML = originalHTML;
            convertBtn.disabled = false;
            this.isConverting = false;
            this.lastConversionPromise = null;
        }
    }
    
    analyzeText(text) {
        const lower = (text || "").toLowerCase();
        let role = "expert assistant";
        let preset = "default";
        let label = "General";
      
        if (/email|mail|send.*to|message.*to|follow[- ]up/i.test(lower)) {
            role = "expert email writer";
            label = "Email";
        } else if (/code|program|script|develop|software|function|python|javascript|typescript|java|c#|sql|api|bug fix|refactor/i.test(lower)) {
            role = "expert developer";
            preset = "chatgpt";
            label = "Code";
        } else if (/analyze|analysis|market|research|evaluate|assessment|review|trend|report|insight|metrics/i.test(lower)) {
            role = "expert analyst";
            preset = "detailed";
            label = "Analysis";
        } else if (/blog|article|story|linkedin post|caption|copywriting|content/i.test(lower)) {
            role = "expert content writer";
            label = "Writing";
        } else if (/workout|exercise|fitness|gym|diet|meal plan|training plan/i.test(lower)) {
            role = "expert fitness trainer";
            preset = "detailed";
            label = "Workout";
        } else if (/strategy|business plan|roadmap|pitch deck|proposal|go[- ]to[- ]market|g2m/i.test(lower)) {
            role = "expert business consultant";
            preset = "detailed";
            label = "Business";
        } else if (/teach|explain|lesson|tutorial|guide|training material|curriculum/i.test(lower)) {
            role = "expert educator";
            preset = "detailed";
            label = "Education";
        } else if (/creative|design|logo|brand|marketing|ad|campaign/i.test(lower)) {
            role = "expert creative director";
            preset = "detailed";
            label = "Creative";
        }
      
        return { role, preset, label };
    }
    
    generatePrompt(requirement, role) {
        return `Act as a ${role}.

TASK: ${requirement}

INSTRUCTIONS:
1. Provide a comprehensive and detailed response
2. Structure your answer logically with clear sections
3. Use examples and practical applications where relevant
4. Include actionable advice and next steps
5. Maintain a professional, helpful tone

Please proceed with the task and provide your complete response below:`;
    }
    
    updateCounters() {
        const output = document.getElementById('output');
        if (!output) return;
        
        const text = output.value;
        
        const charCount = document.getElementById('charCount');
        const wordCount = document.getElementById('wordCount');
        const lineCount = document.getElementById('lineCount');
        
        if (charCount) charCount.textContent = `${text.length} chars`;
        if (wordCount) wordCount.textContent = `${text.split(/\s+/).filter(w => w.length > 0).length} words`;
        if (lineCount) lineCount.textContent = `${text.split('\n').length} lines`;
    }
}

export const promptConverter = new PromptConverter();
