// Import all modules
import { appState } from './core/app-state.js';
import { notifications } from './ui/notifications.js';
import { promptConverter } from './features/prompt-converter.js';
import { templateManager } from './features/templates.js';
import { historyManager } from './features/history.js';
import { intentDetector } from './features/intent-detector.js';
import { cardMaximizer } from './features/card-maximizer.js';
import { voiceFeatures } from './features/voice.js';
import { exportHandler } from './features/export-handler.js';
import { launchButtons } from './features/launch-buttons.js';
import { toolPrioritizer } from './features/tool-prioritizer.js';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('PromptCraft v3.2 Initializing...');
  
  // Initialize all features
  initFeatures();
  setupEventListeners();
  loadInitialState();
  
  // Add to window for debugging
  window.appState = appState;
  window.promptConverter = promptConverter;
  window.templateManager = templateManager;
  window.historyManager = historyManager;
  window.cardMaximizer = cardMaximizer;
  window.toolPrioritizer = toolPrioritizer;
  
  console.log('✅ PromptCraft initialized successfully');
});

function initFeatures() {
  // Add maximize buttons to cards
  setTimeout(() => {
    cardMaximizer.addMaximizeButtons();
  }, 200);
  
  // Load default templates if empty
  setTimeout(() => {
    if (templateManager.templates.length === 0) {
      templateManager.loadDefaultTemplates();
    }
  }, 300);
  
  // Override promptConverter to add tool prioritization
  overridePromptConverter();
}

function overridePromptConverter() {
  // Store original convert method
  const originalConvert = promptConverter.convert;
  
  // Override convert method
  promptConverter.convert = async function() {
    // Show loading state
    const convertBtn = document.getElementById('convertBtn');
    const originalHTML = convertBtn.innerHTML;
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    convertBtn.disabled = true;
    
    try {
      // Call original convert method
      await originalConvert.call(this);
      
      // After successful conversion, prioritize AI tools
      const input = document.getElementById('requirement');
      if (input && input.value.trim()) {
        setTimeout(() => {
          toolPrioritizer.prioritizeTools(input.value);
        }, 300);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      notifications.error('Failed to generate prompt');
      
      // Reset button
      convertBtn.innerHTML = originalHTML;
      convertBtn.disabled = false;
    }
  };
}

function setupEventListeners() {
  // Settings modal
  const settingsBtn = document.getElementById('settingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'flex';
    });
  }
  
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
      document.getElementById('settingsModal').style.display = 'none';
    });
  }
  
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const apiKey = document.getElementById('apiKeyInput').value;
      if (apiKey) {
        appState.apiKey = apiKey;
        localStorage.setItem('promptCraftApiKey', apiKey);
        notifications.success('API key saved successfully');
        document.getElementById('settingsModal').style.display = 'none';
      } else {
        notifications.error('Please enter an API key');
      }
    });
  }
  
  // Clear input button
  const clearInputBtn = document.getElementById('clearInputBtn');
  if (clearInputBtn) {
    clearInputBtn.addEventListener('click', () => {
      document.getElementById('requirement').value = '';
      intentDetector.clearDetection();
      // Also clear the generated prompt in Card 2
      document.getElementById('output').value = '';
      
      // Update counters
      const charCount = document.getElementById('charCount');
      const wordCount = document.getElementById('wordCount');
      const lineCount = document.getElementById('lineCount');
      if (charCount) charCount.textContent = '0 chars';
      if (wordCount) wordCount.textContent = '0 words';
      if (lineCount) lineCount.textContent = '0 lines';
      
      // Disable AI buttons
      document.querySelectorAll('.launch-btn').forEach(btn => {
        btn.disabled = true;
      });
      
      // Hide success badge
      const badge = document.getElementById('convertedBadge');
      if (badge) {
        badge.style.display = 'none';
      }
      
      // Reset tool prioritization
      const launchList = document.querySelector('.launch-list');
      if (launchList) {
        // Remove crowns
        launchList.querySelectorAll('.crown-icon').forEach(crown => crown.remove());
        // Reset button classes
        launchList.querySelectorAll('.launch-btn').forEach(btn => {
          btn.classList.remove('best-tool');
        });
      }
      
      notifications.info('Input cleared');
    });
  }
  
  // Global reset button
  const globalResetBtn = document.getElementById('globalResetBtn');
  if (globalResetBtn) {
    globalResetBtn.addEventListener('click', () => {
      if (confirm('Reset all cards to default layout?')) {
        // Clear all text areas
        document.getElementById('requirement').value = '';
        document.getElementById('output').value = '';
        
        // Reset textarea sizes
        const inputTextarea = document.getElementById('requirement');
        const outputTextarea = document.getElementById('output');
        if (inputTextarea) inputTextarea.style.height = '';
        if (outputTextarea) outputTextarea.style.height = '';
        
        // Reset counters
        const charCount = document.getElementById('charCount');
        const wordCount = document.getElementById('wordCount');
        const lineCount = document.getElementById('lineCount');
        if (charCount) charCount.textContent = '0 chars';
        if (wordCount) wordCount.textContent = '0 words';
        if (lineCount) lineCount.textContent = '0 lines';
        
        // Disable AI buttons
        document.querySelectorAll('.launch-btn').forEach(btn => {
          btn.disabled = true;
        });
        
        // Hide badges
        const convertedBadge = document.getElementById('convertedBadge');
        if (convertedBadge) convertedBadge.style.display = 'none';
        
        const intentBadge = document.getElementById('intentBadge');
        if (intentBadge) intentBadge.style.display = 'none';
        
        // Reset voice button state
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        if (voiceInputBtn) {
          voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
          voiceInputBtn.title = 'Click to enable voice input';
          voiceInputBtn.classList.remove('listening', 'speaking');
          voiceInputBtn.classList.add('muted');
        }
        
        // Close any maximized card
        cardMaximizer.closeAll();
        
        // Clear intent detection
        intentDetector.clearDetection();
        
        // Reset tool prioritization
        const launchList = document.querySelector('.launch-list');
        if (launchList) {
          // Remove crowns
          launchList.querySelectorAll('.crown-icon').forEach(crown => crown.remove());
          // Reset button classes
          launchList.querySelectorAll('.launch-btn').forEach(btn => {
            btn.classList.remove('best-tool');
          });
        }
        
        notifications.success('Layout reset to default');
      }
    });
  }
  
  // Template modal
  const closeTemplateBtn = document.getElementById('closeTemplateBtn');
  if (closeTemplateBtn) {
    closeTemplateBtn.addEventListener('click', () => {
      document.getElementById('templateModal').style.display = 'none';
    });
  }
  
  // Save template buttons
  const saveTemplateBtn1 = document.getElementById('saveTemplateBtn');
  const saveTemplateBtn2 = document.getElementById('saveTemplateBtn2');
  const saveTemplateBtnModal = document.getElementById('saveTemplateBtnModal');
  
  if (saveTemplateBtn1) {
    saveTemplateBtn1.addEventListener('click', () => templateManager.openSaveModal());
  }
  
  if (saveTemplateBtn2) {
    saveTemplateBtn2.addEventListener('click', () => templateManager.openSaveModal());
  }
  
  if (saveTemplateBtnModal) {
    saveTemplateBtnModal.addEventListener('click', () => {
      const name = document.getElementById('templateName').value;
      const category = document.getElementById('templateCategory').value;
      const prompt = document.getElementById('output').value;
      
      if (name && prompt) {
        templateManager.saveTemplate(name, category, prompt);
        document.getElementById('templateModal').style.display = 'none';
        document.getElementById('templateName').value = '';
      } else {
        notifications.error('Please enter template name and generate a prompt first');
      }
    });
  }
  
  // History toggle
  const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
  if (toggleHistoryBtn) {
    toggleHistoryBtn.addEventListener('click', () => {
      const historyPanel = document.getElementById('historyPanel');
      if (historyPanel) {
        const isVisible = historyPanel.style.display === 'block';
        historyPanel.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
          historyManager.loadHistory();
        }
      }
    });
  }
  
  // Clear history
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        historyManager.clearHistory();
      }
    });
  }
  
  // Handle outside modal clicks
  window.addEventListener('click', (e) => {
    const settingsModal = document.getElementById('settingsModal');
    const templateModal = document.getElementById('templateModal');
    
    if (settingsModal && e.target === settingsModal) {
      settingsModal.style.display = 'none';
    }
    
    if (templateModal && e.target === templateModal) {
      templateModal.style.display = 'none';
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      promptConverter.convert();
    }
    
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      templateManager.openSaveModal();
    }
    
    // Escape to close modals or restore maximized card
    if (e.key === 'Escape') {
      // Close modals first
      const settingsModal = document.getElementById('settingsModal');
      const templateModal = document.getElementById('templateModal');
      
      if (settingsModal && settingsModal.style.display === 'flex') {
        settingsModal.style.display = 'none';
      } else if (templateModal && templateModal.style.display === 'flex') {
        templateModal.style.display = 'none';
      } else {
        // Then restore maximized card
        cardMaximizer.closeAll();
      }
    }
  });
}

function loadInitialState() {
  // Load saved API key
  const savedApiKey = localStorage.getItem('promptCraftApiKey');
  if (savedApiKey) {
    appState.apiKey = savedApiKey;
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) {
      apiKeyInput.value = savedApiKey;
    }
  }
  
  // Load auto-convert setting
  const savedAutoConvert = localStorage.getItem('autoConvert');
  if (savedAutoConvert !== null) {
    appState.autoConvert = savedAutoConvert === 'true';
    const autoConvertToggle = document.getElementById('autoConvert');
    if (autoConvertToggle) {
      autoConvertToggle.checked = appState.autoConvert;
    }
  }
  
  // Load usage count
  const savedUsage = localStorage.getItem('promptCraftUsageCount');
  if (savedUsage) {
    appState.usageCount = parseInt(savedUsage) || 0;
    const usageElement = document.getElementById('usageCount');
    if (usageElement) {
      usageElement.innerHTML = `<i class="fas fa-bolt"></i> ${appState.usageCount} prompts`;
    }
  }
  
  // Update template counters
  templateManager.updateCounters();
  
  // Show welcome notification
  setTimeout(() => {
    notifications.success('Welcome to PromptCraft v3.2! Start by describing your task.', 3000);
  }, 1000);
}
