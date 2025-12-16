// Main application orchestrator
import { appState } from '../core/app-state.js';
import { PromptGenerator } from '../ai/prompt-generator.js';
import { analyzeText } from '../features/context-detective.js';
import { historyManager } from '../features/history.js';
import { notifications } from '../ui/notifications.js';
import { ThemeManager } from '../ui/theme-manager.js';
import { SettingsManager } from '../ui/settings-manager.js';

export class PromptCrafterApp {
  constructor() {
    this.state = appState;
    this.promptGenerator = null;
    this.themeManager = new ThemeManager();
    this.settingsManager = new SettingsManager();
    
    this.init();
  }
  
  async init() {
    // Initialize modules
    await this.settingsManager.load();
    
    // Create prompt generator with API key if available
    const apiKey = this.settingsManager.getApiKey();
    this.promptGenerator = new PromptGenerator(apiKey);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initial render
    this.render();
    
    notifications.success('PromptCrafter loaded successfully!');
  }
  
  setupEventListeners() {
    // Requirement input
    const requirementEl = document.getElementById('requirement');
    if (requirementEl) {
      requirementEl.addEventListener('input', this.handleRequirementInput.bind(this));
    }
    
    // Convert button
    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) {
      convertBtn.addEventListener('click', this.generatePrompt.bind(this));
    }
    
    // Preset selection
    document.querySelectorAll('.preset-option').forEach(option => {
      option.addEventListener('click', () => {
        const presetId = option.dataset.preset;
        this.setPreset(presetId, 'manual');
      });
    });
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', this.exportPrompt.bind(this));
    }
    
    // Add more event listeners as needed...
  }
  
  handleRequirementInput(event) {
    const text = event.target.value;
    
    // Auto-detect context
    if (text.trim() && !this.state.userPresetLocked) {
      const { role, preset, label } = analyzeText(text);
      this.state.lastRole = role;
      this.state.lastTaskLabel = label;
      this.setPreset(preset, 'auto');
    }
    
    // Update UI state
    this.updateUIState();
  }
  
  setPreset(presetId, source = 'auto') {
    if (!presetId || !this.isValidPreset(presetId)) return;
    
    this.state.currentPreset = presetId;
    this.state.lastPresetSource = source;
    
    if (source === 'manual') {
      this.state.userPresetLocked = true;
    }
    
    this.updatePresetUI();
  }
  
  async generatePrompt() {
    const requirement = document.getElementById('requirement').value.trim();
    if (!requirement) {
      notifications.error('Please enter a requirement first');
      return;
    }
    
    try {
      const outputEl = document.getElementById('output');
      const convertBtn = document.getElementById('convertBtn');
      
      // Show loading state
      convertBtn.disabled = true;
      convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
      
      // Generate prompt
      const useOpenAI = !!this.settingsManager.getApiKey();
      const prompt = await this.promptGenerator.generate(
        requirement,
        this.state.currentPreset,
        useOpenAI
      );
      
      // Update output
      outputEl.value = prompt;
      this.state.isConverted = true;
      this.state.incrementUsage();
      
      // Save to history
      historyManager.add(requirement, prompt);
      
      // Update UI
      this.updateUIState();
      notifications.success('Prompt generated successfully!');
      
    } catch (error) {
      notifications.error('Failed to generate prompt: ' + error.message);
      console.error(error);
    } finally {
      const convertBtn = document.getElementById('convertBtn');
      if (convertBtn) {
        convertBtn.disabled = false;
        convertBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Enhance Prompt';
      }
    }
  }
  
  exportPrompt() {
    const outputEl = document.getElementById('output');
    const prompt = outputEl.value.trim();
    
    if (!prompt) {
      notifications.error('No prompt to export');
      return;
    }
    
    const blob = new Blob([prompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    notifications.success('Prompt exported successfully');
  }
  
  updateUIState() {
    // Update various UI elements based on state
    this.updatePresetUI();
    this.updateStats();
    this.updateConvertButton();
  }
  
  updatePresetUI() {
    const presetInfoEl = document.getElementById('presetInfo');
    if (!presetInfoEl) return;
    
    const presetNames = {
      default: 'Standard',
      chatgpt: 'ChatGPT',
      claude: 'Claude',
      detailed: 'Detailed'
    };
    
    const nicePreset = presetNames[this.state.currentPreset] || this.state.currentPreset;
    presetInfoEl.textContent = `${this.state.lastTaskLabel} • ${nicePreset} (${this.state.lastPresetSource})`;
  }
  
  updateStats() {
    // Update character/word/line counts
    // Implementation depends on your UI
  }
  
  updateConvertButton() {
    const requirement = document.getElementById('requirement').value.trim();
    const convertBtn = document.getElementById('convertBtn');
    
    if (convertBtn) {
      convertBtn.disabled = !requirement;
    }
  }
  
  isValidPreset(presetId) {
    const validPresets = ['default', 'claude', 'chatgpt', 'detailed'];
    return validPresets.includes(presetId);
  }
  
  render() {
    // Initial render of components
    historyManager.renderTo('historyList');
    this.updateUIState();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PromptCrafterApp();
});
