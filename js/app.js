// Import all modules
import { appState } from './core/app-state.js';
import { notifications } from './ui/notifications.js';
import { promptConverter } from './features/prompt-converter.js';
import { templateManager } from './features/templates.js';
import { historyManager } from './features/history.js';
import { intentDetector } from './features/intent-detector.js';
import { cardMaximizer } from './features/card-maximizer.js';
import { voiceHandler } from './features/voice-handler.js';
import { exportHandler } from './features/export-handler.js';
import { launchButtons } from './features/launch-buttons.js';

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
  
  console.log('✅ PromptCraft initialized successfully');
});

function initFeatures() {
  // Features auto-initialize via their constructors
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
  
  // Auto-convert toggle
  const autoConvertToggle = document.getElementById('autoConvert');
  if (autoConvertToggle) {
    autoConvertToggle.addEventListener('change', (e) => {
      appState.autoConvert = e.target.checked;
      localStorage.setItem('autoConvert', e.target.checked);
      notifications.info(`Auto-convert ${e.target.checked ? 'enabled' : 'disabled'}`);
    });
  }
  
  // Generate prompt button
  const convertBtn = document.getElementById('convertBtn');
  if (convertBtn) {
    convertBtn.addEventListener('click', () => {
      promptConverter.convert();
    });
  }
  
  // Clear input button
  const clearInputBtn = document.getElementById('clearInputBtn');
  if (clearInputBtn) {
    clearInputBtn.addEventListener('click', () => {
      document.getElementById('requirement').value = '';
      intentDetector.clearDetection();
      notifications.info('Input cleared');
    });
  }
  
  // Expand buttons
  const expandInputBtn = document.getElementById('expandInputBtn');
  const expandOutputBtn = document.getElementById('expandOutputBtn');
  
  if (expandInputBtn) {
    expandInputBtn.addEventListener('click', () => {
      const inputTextarea = document.getElementById('requirement');
      if (inputTextarea.style.height === '300px') {
        inputTextarea.style.height = '150px';
      } else {
        inputTextarea.style.height = '300px';
      }
    });
  }
  
  if (expandOutputBtn) {
    expandOutputBtn.addEventListener('click', () => {
      const outputTextarea = document.getElementById('output');
      if (outputTextarea.style.height === '400px') {
        outputTextarea.style.height = '200px';
      } else {
        outputTextarea.style.height = '400px';
      }
    });
  }
  
  // Voice input
  const voiceInputBtn = document.getElementById('voiceInputBtn');
  if (voiceInputBtn) {
    voiceInputBtn.addEventListener('click', () => {
      voiceHandler.startVoiceInput();
    });
  }
  
  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportHandler.exportPrompt();
    });
  }
  
  // Global reset button
  const globalResetBtn = document.getElementById('globalResetBtn');
  if (globalResetBtn) {
    globalResetBtn.addEventListener('click', () => {
      if (confirm('Reset all cards to default layout?')) {
        // Reset textarea sizes
        const inputTextarea = document.getElementById('requirement');
        const outputTextarea = document.getElementById('output');
        if (inputTextarea) inputTextarea.style.height = '';
        if (outputTextarea) outputTextarea.style.height = '';
        
        // Close open panels
        const templatesPanel = document.getElementById('templatesPanel');
        const historyPanel = document.getElementById('historyPanel');
        if (templatesPanel) templatesPanel.style.display = 'none';
        if (historyPanel) historyPanel.style.display = 'none';
        
        // Restore maximized card if any
        cardMaximizer.restoreCurrentCard();
        
        notifications.success('Layout reset to default');
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
    
    // Escape to restore maximized card
    if (e.key === 'Escape') {
      cardMaximizer.restoreCurrentCard();
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
  
  // Update usage counter
  templateManager.updateCounters();
  
  // Show welcome notification
  setTimeout(() => {
    notifications.success('Welcome to PromptCraft v3.2! Start by describing your task.', 3000);
  }, 1000);
}
