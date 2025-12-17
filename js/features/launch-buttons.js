import { notifications } from '../ui/notifications.js';

export class LaunchButtons {
    constructor() {
        this.setup();
    }
    
    setup() {
        // All launch buttons
        const buttons = [
            'chatgptBtn', 'claudeBtn', 'geminiBtn', 'perplexityBtn',
            'dalleBtn', 'midjourneyBtn', 'deepseekBtn', 'copilotBtn', 'grokBtn'
        ];
        
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.launch(btnId));
            }
        });
    }
    
    launch(aiTool) {
        const output = document.getElementById('output');
        if (!output || !output.value.trim()) {
            notifications.error('No prompt to launch');
            return;
        }
        
        const prompt = output.value.trim();
        
        // Tool-specific launch actions
        const actions = {
            chatgptBtn: () => this.launchChatGPT(prompt),
            claudeBtn: () => this.launchClaude(prompt),
            geminiBtn: () => this.launchGemini(prompt),
            perplexityBtn: () => this.launchPerplexity(prompt),
            dalleBtn: () => this.launchDalle(prompt),
            midjourneyBtn: () => this.launchMidjourney(prompt),
            deepseekBtn: () => this.launchDeepSeek(prompt),
            copilotBtn: () => this.launchCopilot(prompt),
            grokBtn: () => this.launchGrok(prompt)
        };
        
        if (actions[aiTool]) {
            actions[aiTool]();
        } else {
            this.copyToClipboard(prompt, aiTool.replace('Btn', ''));
        }
    }
    
    launchChatGPT(prompt) {
        // Open ChatGPT with prompt
        const url = 'https://chat.openai.com/';
        window.open(url, '_blank');
        
        // Show instructions
        notifications.info('ChatGPT opened in new tab. Copy your prompt and paste it there.', 5000);
        this.copyToClipboard(prompt, 'ChatGPT');
    }
    
    launchClaude(prompt) {
        const url = 'https://claude.ai/';
        window.open(url, '_blank');
        notifications.info('Claude opened in new tab. Copy your prompt and paste it there.', 5000);
        this.copyToClipboard(prompt, 'Claude');
    }
    
    launchGemini(prompt) {
        const url = 'https://gemini.google.com/';
        window.open(url, '_blank');
        notifications.info('Gemini opened in new tab. Copy your prompt and paste it there.', 5000);
        this.copyToClipboard(prompt, 'Gemini');
    }
    
    launchPerplexity(prompt) {
        const url = 'https://www.perplexity.ai/';
        window.open(url, '_blank');
        notifications.info('Perplexity opened in new tab. Copy your prompt and paste it there.', 5000);
        this.copyToClipboard(prompt, 'Perplexity');
    }
    
    launchDalle(prompt) {
        const url = 'https://labs.openai.com/';
        window.open(url, '_blank');
        
        // Format prompt for DALL-E
        const dallePrompt = `Create an image: ${prompt.split('\n')[0]}`;
        this.copyToClipboard(dallePrompt, 'DALL-E');
        notifications.info('DALL-E opened. Use this image generation prompt.', 5000);
    }
    
    launchMidjourney(prompt) {
        // Midjourney is Discord-based, so show instructions
        const midjourneyPrompt = this.formatForMidjourney(prompt);
        this.copyToClipboard(midjourneyPrompt, 'Midjourney');
        
        notifications.info(
            `Midjourney prompt copied!<br>
            1. Open Discord<br>
            2. Go to Midjourney bot<br>
            3. Type: /imagine<br>
            4. Paste prompt`, 
            7000
        );
    }
    
    launchDeepSeek(prompt) {
        const url = 'https://chat.deepseek.com/';
        window.open(url, '_blank');
        notifications.info('DeepSeek opened in new tab. Copy your prompt and paste it there.', 5000);
        this.copyToClipboard(prompt, 'DeepSeek');
    }
    
    launchCopilot(prompt) {
        const url = 'https://copilot.microsoft.com/';
        window.open(url, '_blank');
        notifications.info('Copilot opened in new tab. Copy your prompt and paste it there.', 5000);
        this.copyToClipboard(prompt, 'Copilot');
    }
    
    launchGrok(prompt) {
        const url = 'https://x.com/i/grok';
        window.open(url, '_blank');
        notifications.info('Grok opened in new tab. Copy your prompt and paste it there.', 5000);
        this.copyToClipboard(prompt, 'Grok');
    }
    
    formatForMidjourney(prompt) {
        // Simple formatting for Midjourney
        const lines = prompt.split('\n');
        let mainPrompt = lines[0].replace(/Act as a.*?with expertise in.*?\./i, '');
        mainPrompt = mainPrompt.replace(/TASK:/i, '');
        mainPrompt = mainPrompt.trim();
        
        // Add common Midjourney parameters
        return `${mainPrompt} --ar 16:9 --v 6.0 --style raw`;
    }
    
    copyToClipboard(text, toolName) {
        navigator.clipboard.writeText(text).then(() => {
            notifications.success(`Prompt copied for ${toolName}!`);
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            notifications.success(`Prompt copied for ${toolName}!`);
        });
    }
}

export const launchButtons = new LaunchButtons();
