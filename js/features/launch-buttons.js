import { notifications } from '../ui/notifications.js';

export class LaunchButtons {
    constructor() {
        this.setup();
    }
    
    setup() {
        // All launch buttons
        const buttonIds = [
            'chatgptBtn', 'claudeBtn', 'geminiBtn', 'perplexityBtn',
            'dalleBtn', 'midjourneyBtn', 'deepseekBtn', 'copilotBtn', 'grokBtn'
        ];
        
        buttonIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.handleLaunch(id));
            }
        });
    }
    
    handleLaunch(buttonId) {
        const output = document.getElementById('output');
        if (!output || !output.value.trim()) {
            notifications.error('Generate a prompt first!');
            return;
        }
        
        const prompt = output.value;
        
        // Copy to clipboard
        navigator.clipboard.writeText(prompt).then(() => {
            const toolName = buttonId.replace('Btn', '');
            notifications.success(`Prompt copied for ${toolName}! Open the tool and paste.`);
        }).catch(err => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = prompt;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            const toolName = buttonId.replace('Btn', '');
            notifications.success(`Prompt copied for ${toolName}!`);
        });
    }
}

export const launchButtons = new LaunchButtons();
