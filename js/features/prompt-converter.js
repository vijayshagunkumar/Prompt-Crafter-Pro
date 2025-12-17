import { appState } from '../core/app-state.js';
import { notifications } from '../ui/notifications.js';
import { historyManager } from './history.js';

export class PromptConverter {
    constructor() {
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
            let timeout;
            input.addEventListener('input', () => {
                if (autoToggle.checked) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => this.convert(), 1000);
                }
            });
        }
    }
    
    convert() {
        const input = document.getElementById('requirement');
        const output = document.getElementById('output');
        
        if (!input || !output) return;
        
        const requirement = input.value.trim();
        
        if (!requirement) {
            notifications.error('Please enter your idea first');
            return;
        }
        
        // Show loading state
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn) {
            convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            convertBtn.disabled = true;
        }
        
        // Simulate processing time
        setTimeout(() => {
            const optimizedPrompt = this.generatePrompt(requirement);
            
            output.value = optimizedPrompt;
            output.style.height = Math.min(output.scrollHeight, 400) + 'px';
            
            // Enable launch buttons
            document.querySelectorAll('.launch-btn').forEach(btn => {
                btn.disabled = false;
            });
            
            // Show success badge
            const badge = document.getElementById('convertedBadge');
            if (badge) {
                badge.style.display = 'flex';
            }
            
            // Update counters
            this.updateCounters();
            
            // Add to history
            if (historyManager) {
                historyManager.add(requirement, optimizedPrompt);
            }
            
            // Reset button
            if (convertBtn) {
                convertBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Prompt';
                convertBtn.disabled = false;
            }
            
            notifications.success('Prompt generated successfully!');
            
        }, 800);
    }
    
    generatePrompt(requirement) {
        // Simple local prompt generation
        const words = requirement.toLowerCase().split(/\s+/);
        
        // Determine category
        let category = 'General';
        let role = 'expert assistant';
        
        if (words.some(w => ['code', 'program', 'function', 'script', 'python', 'javascript'].includes(w))) {
            category = 'Programming';
            role = 'senior software developer';
        } else if (words.some(w => ['write', 'email', 'letter', 'blog', 'article', 'content'].includes(w))) {
            category = 'Writing';
            role = 'professional writer';
        } else if (words.some(w => ['image', 'picture', 'art', 'design', 'logo', 'visual'].includes(w))) {
            category = 'Visual';
            role = 'digital artist';
        } else if (words.some(w => ['analyze', 'research', 'data', 'report', 'summary'].includes(w))) {
            category = 'Analysis';
            role = 'data analyst';
        } else if (words.some(w => ['business', 'plan', 'strategy', 'marketing', 'sales'].includes(w))) {
            category = 'Business';
            role = 'business consultant';
        }
        
        // Build prompt structure
        const prompt = `Act as a ${role} with expertise in ${category}.

TASK: ${requirement}

REQUIREMENTS:
1. Provide a comprehensive and detailed response
2. Use clear, professional language
3. Structure your answer logically
4. Include specific examples where relevant
5. Focus on practical, actionable advice

FORMAT GUIDELINES:
- Use headings and bullet points for clarity
- Break down complex concepts
- Avoid unnecessary jargon
- Maintain a helpful, solution-oriented tone

Please proceed with the task and provide your response below:`;

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
