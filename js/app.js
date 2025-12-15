// app.js - Main Application Entry Point

// Import core modules
import appState from './core/app-state.js';
import { STORAGE_KEYS, DEFAULTS } from './core/constants.js';

// Import feature modules
import { initializeVoice } from './features/voice.js';
import { loadTemplates } from './features/templates.js';
import { loadHistory } from './features/history.js';
import { detectContextFromText } from './features/context-detective.js';

// Import AI modules
import { setupToolClickHandlers, updateAIToolsGrid } from './ai/ai-tools.js';

// Import UI modules
import { initializeEventHandlers } from './ui/event-handlers.js';
import { showNotification, showSuccess, showError, showInfo } from './ui/notifications.js';
import modalManager from './ui/modal-manager.js';

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    // Show loading state
    console.log('🚀 Initializing PromptCraft...');
    
    // Initialize app state
    appState.init();
    
    // Load data
    loadTemplates();
    loadHistory();
    
    // Initialize voice features
    initializeVoice();
    
    // Initialize event handlers
    initializeEventHandlers();
    
    // Initialize UI
    initializeUI();
    
    // Initialize AI tools
    initializeAITools();
    
    // Initialize theme
    initializeTheme();
    
    // Update stats
    updateAllStats();
    
    // Setup tool click handlers
    setupToolClickHandlers(showNotification);
    
    // Show welcome message
    setTimeout(() => {
      showSuccess('PromptCraft is ready! Start crafting prompts.');
    }, 1000);
    
    console.log('✅ PromptCraft initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    showError('Failed to initialize application. Please refresh the page.');
  }
}

/**
 * Initialize UI components
 */
function initializeUI() {
  // Update usage count display
  updateUsageCount();
  
  // Initialize modals
  initializeModals();
  
  // Set initial button states
  updateButtonStates();
}

/**
 * Initialize modals
 */
function initializeModals() {
  // Register all modals
  const templatesModal = document.getElementById('templatesModal');
  const historyModal = document.getElementById('historyModal');
  
  if (templatesModal) modalManager.register('templatesModal', templatesModal);
  if (historyModal) modalManager.register('historyModal', historyModal);
}

/**
 * Initialize AI tools grid
 */
function initializeAITools() {
  updateAIToolsGrid('general', '', false);
}

/**
 * Update all statistics
 */
function updateAllStats() {
  updateUsageCount();
  updateInputStats();
  updateOutputStats();
}

/**
 * Update usage count display
 */
function updateUsageCount() {
  const usageElement = document.getElementById('usageCount');
  if (usageElement) {
    usageElement.innerHTML = `<i class="fas fa-bolt"></i>${appState.usageCount} prompts generated`;
  }
}

/**
 * Update input statistics
 */
function updateInputStats() {
  const requirementEl = document.getElementById('requirement');
  const inputStats = document.getElementById('inputStats');
  
  if (requirementEl && inputStats) {
    inputStats.textContent = `${requirementEl.value.length} chars`;
  }
}

/**
 * Update output statistics
 */
function updateOutputStats() {
  const outputEl = document.getElementById('output');
  const outputStats = document.getElementById('outputStats');
  
  if (outputEl && outputStats) {
    outputStats.textContent = `${outputEl.value.length} chars`;
  }
}

/**
 * Update button states
 */
function updateButtonStates() {
  const requirementEl = document.getElementById('requirement');
  const convertBtn = document.getElementById('convertBtn');
  const outputEl = document.getElementById('output');
  
  if (convertBtn && requirementEl) {
    convertBtn.disabled = !requirementEl.value.trim();
  }
  
  // Update launch buttons
  const toolCards = document.querySelectorAll('.tool-card');
  toolCards.forEach(card => {
    if (outputEl && outputEl.value.trim()) {
      card.classList.remove('tool-card-disabled');
    } else {
      card.classList.add('tool-card-disabled');
    }
  });
}

/**
 * Initialize theme
 */
function initializeTheme() {
  // Load saved theme or use default
  const savedTheme = localStorage.getItem(STORAGE_KEYS.appTheme) || DEFAULTS.theme;
  setTheme(savedTheme, false);
  
  // Update theme toggle button
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.innerHTML = savedTheme === 'cyberpunk-neon' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    themeToggle.addEventListener('click', toggleTheme);
  }
}

/**
 * Set theme
 * @param {string} themeName - Theme name
 * @param {boolean} showNotif - Whether to show notification
 */
function setTheme(themeName, showNotif = true) {
  const html = document.documentElement;
  
  // List of available themes
  const themes = ['sunset-glow', 'aurora-magic', 'serenity-bliss', 'cyberpunk-neon', 'ocean-deep'];
  
  if (!themes.includes(themeName)) {
    themeName = DEFAULTS.theme;
  }
  
  // Set theme attribute
  html.setAttribute('data-app-theme', themeName);
  localStorage.setItem(STORAGE_KEYS.appTheme, themeName);
  
  // Update theme toggle icon
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.innerHTML = themeName === 'cyberpunk-neon' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }
  
  if (showNotif) {
    const themeNames = {
      'sunset-glow': 'Sunset Glow',
      'aurora-magic': 'Aurora Magic', 
      'serenity-bliss': 'Serenity Bliss',
      'cyberpunk-neon': 'Cyberpunk Neon',
      'ocean-deep': 'Ocean Deep'
    };
    
    showNotification(`Theme changed to ${themeNames[themeName] || themeName}`);
  }
}

/**
 * Toggle between themes
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-app-theme');
  const themes = ['sunset-glow', 'aurora-magic', 'serenity-bliss', 'cyberpunk-neon', 'ocean-deep'];
  const currentIndex = themes.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];
  
  setTheme(nextTheme);
}

/**
 * Export app data for backup
 */
function exportAppData() {
  const data = {
    exportedAt: new Date().toISOString(),
    appState: appState.export(),
    templates: appState.templates,
    history: appState.historyItems,
    settings: {
      theme: localStorage.getItem(STORAGE_KEYS.appTheme),
      voiceLanguage: localStorage.getItem(STORAGE_KEYS.voiceLanguage),
      usageCount: appState.usageCount
    }
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `promptcraft-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showSuccess('App data exported successfully');
}

/**
 * Reset app data
 */
function resetAppData() {
  if (confirm('Are you sure you want to reset all app data? This cannot be undone.')) {
    localStorage.clear();
    location.reload();
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showError(`An error occurred: ${event.message}`);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showError(`Promise rejection: ${event.reason.message || event.reason}`);
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for debugging
window.PromptCraft = {
  appState,
  modalManager,
  exportAppData,
  resetAppData,
  showNotification,
  showSuccess,
  showError,
  setTheme,
  toggleTheme
};

console.log('🎯 PromptCraft loaded');
