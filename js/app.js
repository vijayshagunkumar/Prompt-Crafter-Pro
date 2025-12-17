// Main application orchestrator
import { appState } from './core/app-state.js';
import { PromptGenerator } from './ai/prompt-generator.js';
import { analyzeText } from './features/context-detective.js';
import { getPresetName } from './ai/presets.js';
import { updateStats, copyToClipboard, downloadFile } from './core/utilities.js';
import { historyManager } from './features/history.js';
import { templateManager } from './features/templates.js';
import { cardExpander } from './features/card-expander.js';
import { aiToolsManager } from './ai/ai-tools.js';
import { notifications } from './ui/notifications.js';
import { settingsManager } from './ui/settings-manager.js';
import { modalManager } from './ui/modal-manager.js';
import { themeManager } from './ui/theme-manager.js';
import { EventHandlers } from './ui/event-handlers.js';

// NEW: Import the new features
import { cardMaximizer } from './features/card-maximizer.js';
import { intentDetector } from './features/intent-detector.js';
import { toolPrioritizer } from './features/tool-prioritizer.js';

import './features/voice.js'; // Initialize voice features

class PromptCrafterApp {
  constructor() {
    this.promptGenerator = null;
    this.eventHandlers = null;
    this.init();
  }
  
  async init() {
    console.log('🚀 PromptCrafter Pro v3.1 - Modular Edition');
    
    // Initialize modules
    this.initPromptGenerator();
    this.initEventHandlers();
    this.initUI();
    
    // NEW: Initialize additional features
    this.setupAutoSync();
    this.setupGlobalResetButton();
    this.setupResponsiveTextareas();
    
    // Show welcome notification
    setTimeout(() => {
      notifications.success('PromptCrafter loaded successfully!');
    }, 500);
  }
  
  initPromptGenerator() {
    const apiKey = settingsManager.getApiKey();
    this.promptGenerator = new PromptGenerator(apiKey);
  }
  
  initEventHandlers() {
    this.eventHandlers = new EventHandlers(this);
  }
  
  initUI() {
    this.updateUsageCount();
    this.updatePresetUI();
    this.updateAutoConvertToggle();
    historyManager.renderTo('historyList');
    this.setupOutputStats();
  }
  
  async generatePrompt() {
    const requirementEl = document.getElementById('requirement');
    const outputEl = document.getElementById('output');
    const convertBtn = document.getElementById('convertBtn');
    const requirement = requirementEl.value.trim();
    
    if (!requirement) {
      notifications.error('Please enter a requirement first');
      return;
    }
    
    const { role, preset: autoPreset, label } = analyzeText(requirement);
    appState.lastRole = role;
    appState.lastTaskLabel = label;
    
    if (!appState.userPresetLocked && autoPreset) {
      appState.lastPresetSource = 'auto';
      this.eventHandlers.setPreset(autoPreset);
    } else {
      this.updatePresetInfo();
    }
    
    // Update usage count
    appState.incrementUsage();
    this.updateUsageCount();
    
    // Show loading state
    convertBtn.disabled = true;
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
    this.eventHandlers.clearAutoConvertTimer();
    
    try {
      const useOpenAI = !!settingsManager.getApiKey();
      const prompt = await this.promptGenerator.generate(
        requirement,
        appState.currentPreset,
        useOpenAI
      );
      
      // Update output
      outputEl.value = prompt;
      
      // Update stats
      updateStats(prompt, 'outputCharCount', 'outputWordCount', 'outputLineCount');
      
      // Save to history
      historyManager.add(requirement, prompt);
      
      // Update state
      appState.isConverted = true;
      appState.lastConvertedText = requirement;
      document.getElementById('convertedBadge').style.display = 'inline-flex';
      aiToolsManager.setToolsEnabled(true);
      
      // Show voice output button
      const voiceOutputBtn = document.getElementById('voiceOutputBtn');
      if (voiceOutputBtn) {
        voiceOutputBtn.style.display = 'block';
      }
      
      notifications.success('Prompt generated successfully');
      
      // Reset auto-convert timer if still enabled
      if (appState.autoConvertEnabled) {
        appState.autoConvertCountdown = appState.autoConvertDelay;
        this.eventHandlers.resetAutoConvertTimer();
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      notifications.error(`Generation failed: ${error.message}`);
      
      // Fallback to local generation
      const { role } = analyzeText(requirement);
      const prompt = this.promptGenerator.generateLocally(requirement, role, appState.currentPreset);
      outputEl.value = prompt;
      updateStats(prompt, 'outputCharCount', 'outputWordCount', 'outputLineCount');
      
    } finally {
      convertBtn.disabled = false;
      convertBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Enhance Prompt';
    }
  }
  
  updateUsageCount() {
    const usageCountEl = document.getElementById('usageCount');
    if (usageCountEl) {
      usageCountEl.innerHTML = `<i class="fas fa-bolt"></i>${appState.usageCount} prompts generated`;
    }
  }
  
  updatePresetUI() {
    // Set active preset button
    document.querySelectorAll('.preset-option').forEach((o) => {
      o.classList.toggle('active', o.dataset.preset === appState.currentPreset);
    });
    
    this.updatePresetInfo();
  }
  
  updatePresetInfo() {
    const el = document.getElementById('presetInfo');
    if (!el) return;
    
    const nicePreset = getPresetName(appState.currentPreset);
    el.textContent = `${appState.lastTaskLabel} • ${nicePreset} (${appState.lastPresetSource})`;
  }
  
  updateAutoConvertToggle() {
    const autoConvert = document.getElementById('autoConvert');
    if (autoConvert) {
      autoConvert.checked = appState.autoConvertEnabled;
    }
  }
  
  setupOutputStats() {
    const outputEl = document.getElementById('output');
    if (outputEl) {
      outputEl.addEventListener('input', () => {
        const text = outputEl.value;
        updateStats(text, 'outputCharCount', 'outputWordCount', 'outputLineCount');
        
        // Show/hide voice output button
        const voiceOutputBtn = document.getElementById('voiceOutputBtn');
        if (voiceOutputBtn) {
          voiceOutputBtn.style.display = text ? 'block' : 'none';
        }
      });
    }
  }
  
  // NEW: Auto-sync between Card 1 and Card 2
  setupAutoSync() {
    const requirementEl = document.getElementById('requirement');
    if (requirementEl) {
      requirementEl.addEventListener('input', () => {
        const text = requirementEl.value.trim();
        if (!text) {
          // Clear Card 2 when Card 1 is empty
          document.getElementById('output').value = '';
          document.getElementById('convertedBadge').style.display = 'none';
          aiToolsManager.setToolsEnabled(false);
          
          // Update stats
          updateStats('', 'outputCharCount', 'outputWordCount', 'outputLineCount');
        }
      });
    }
  }
  
  // NEW: Global reset button in header
  setupGlobalResetButton() {
    const header = document.querySelector('.hero-top');
    if (header) {
      const resetBtn = document.createElement('button');
      resetBtn.className = 'global-reset-btn';
      resetBtn.id = 'globalResetBtn';
      resetBtn.title = 'Reset all textarea sizes';
      resetBtn.innerHTML = '<i class="fas fa-arrows-alt-v"></i> Reset Sizes';
      
      resetBtn.addEventListener('click', () => {
        cardExpander.resetSizes();
      });
      
      header.appendChild(resetBtn);
    }
  }
  
  // NEW: Responsive textarea sizing
  setupResponsiveTextareas() {
    // Responsive textarea sizing
    const updateTextareaHeights = () => {
      const viewportHeight = window.innerHeight;
      const maxHeight = Math.min(viewportHeight * 0.6, 500); // Max 60% of viewport or 500px
      
      const requirementEl = document.getElementById('requirement');
      const outputEl = document.getElementById('output');
      
      if (requirementEl) {
        requirementEl.style.maxHeight = `${maxHeight}px`;
      }
      
      if (outputEl) {
        outputEl.style.maxHeight = `${maxHeight}px`;
      }
    };
    
    // Initial setup
    updateTextareaHeights();
    
    // Update on resize
    window.addEventListener('resize', updateTextareaHeights);
    
    // Auto-grow with content
    const setupAutoGrow = (textarea) => {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, parseInt(textarea.style.maxHeight));
        textarea.style.height = `${newHeight}px`;
      });
    };
    
    const requirementEl = document.getElementById('requirement');
    const outputEl = document.getElementById('output');
    
    if (requirementEl) setupAutoGrow(requirementEl);
    if (outputEl) setupAutoGrow(outputEl);
  }
  
  // Public API for external use
  getState() {
    return appState;
  }
  
  getPromptGenerator() {
    return this.promptGenerator;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PromptCrafterApp();
  
  // Make app available globally for debugging
  console.log('📱 App initialized:', window.app);
});

// Export for module usage
export default PromptCrafterApp;
