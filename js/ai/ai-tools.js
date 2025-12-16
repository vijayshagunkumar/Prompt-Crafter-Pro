import { AI_TOOLS } from '../core/constants.js';
import { copyToClipboard } from '../core/utilities.js';
import { notifications } from '../ui/notifications.js';

export class AIToolsManager {
  constructor() {
    this.tools = AI_TOOLS;
    this.init();
  }
  
  init() {
    // Initialize tool buttons
    this.tools.forEach(tool => {
      const button = document.getElementById(`${tool.id}Btn`);
      if (button) {
        button.addEventListener('click', () => this.openTool(tool));
      }
    });
  }
  
  async openTool(tool) {
    const output = document.getElementById('output').value.trim();
    
    if (!output) {
      notifications.error('No prompt to copy');
      return;
    }
    
    // Copy prompt to clipboard
    const copied = await copyToClipboard(output);
    
    if (copied) {
      notifications.success(`Prompt copied! Opening ${tool.name}...`);
      
      // Open in new tab after a short delay
      setTimeout(() => {
        window.open(tool.url, '_blank', 'noopener,noreferrer');
      }, 500);
    } else {
      notifications.error('Failed to copy prompt');
    }
  }
  
  setToolsEnabled(enabled) {
    this.tools.forEach(tool => {
      const button = document.getElementById(`${tool.id}Btn`);
      if (button) {
        button.disabled = !enabled;
      }
    });
  }
  
  getToolById(id) {
    return this.tools.find(tool => tool.id === id);
  }
}

// Singleton instance
export const aiToolsManager = new AIToolsManager();
