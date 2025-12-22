import { notifications } from '../ui/notifications.js';

export class LaunchButtons {
  constructor() {
    this.toolUrls = {
      'chatgptBtn': 'https://chat.openai.com/',
      'claudeBtn': 'https://claude.ai/new',
      'geminiBtn': 'https://gemini.google.com/app',
      'perplexityBtn': 'https://www.perplexity.ai/',
      'dalleBtn':  'https://chatgpt.com/?model=image',
      'midjourneyBtn': 'https://www.midjourney.com/',
      'deepseekBtn': 'https://chat.deepseek.com/',
      'copilotBtn': 'https://copilot.microsoft.com/',
      'grokBtn': 'https://x.ai/'
    };
    
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
        btn.addEventListener('click', (e) => this.handleLaunch(id, e));
      }
    });
  }
  
  async handleLaunch(buttonId, event) {
    const output = document.getElementById('output');
    if (!output || !output.value.trim()) {
      notifications.error('Generate a prompt first!');
      return;
    }
    
    const prompt = output.value;
    const toolName = this.getToolName(buttonId);
    
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(prompt);
      
      // Open AI tool website
      const url = this.toolUrls[buttonId];
      if (url) {
        // Open in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
        
        // Show success message
        const messages = {
          'chatgptBtn': '✅ Prompt copied! ChatGPT opened in new tab.',
          'claudeBtn': '✅ Prompt copied! Claude opened in new tab.',
          'geminiBtn': '✅ Prompt copied! Gemini opened in new tab.',
          'perplexityBtn': '✅ Prompt copied! Perplexity opened in new tab.',
          'dalleBtn': '✅ Image prompt copied! DALL·E opened for image generation.',
          'midjourneyBtn': '✅ Midjourney prompt copied! Open Discord and use /imagine command.',
          'deepseekBtn': '✅ Prompt copied! DeepSeek opened in new tab.',
          'copilotBtn': '✅ Prompt copied! Copilot opened in new tab.',
          'grokBtn': '✅ Prompt copied! Grok opened in new tab.'
        };
        
        notifications.success(messages[buttonId] || `✅ Prompt copied for ${toolName}! Tool opened.`, 5000);
      }
      
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      
      // Fallback copy method
      const textarea = document.createElement('textarea');
      textarea.value = prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      // Still open the tool
      const url = this.toolUrls[buttonId];
      if (url) {
        window.open(url, '_blank');
      }
      
      notifications.success(`✅ Prompt copied for ${toolName}! Tool opened in new tab.`, 5000);
    }
  }
  
  getToolName(buttonId) {
    const names = {
      'chatgptBtn': 'ChatGPT',
      'claudeBtn': 'Claude',
      'geminiBtn': 'Gemini',
      'perplexityBtn': 'Perplexity',
      'dalleBtn': 'DALL·E',
      'midjourneyBtn': 'Midjourney',
      'deepseekBtn': 'DeepSeek',
      'copilotBtn': 'Copilot',
      'grokBtn': 'Grok'
    };
    return names[buttonId] || 'AI Tool';
  }
}

export const launchButtons = new LaunchButtons();
