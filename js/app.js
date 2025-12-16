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

// ===========================================
// ADDED BACK: Preset templates from old version
// ===========================================
const PRESETS = {
  default: (role, requirement) =>
    `# Role
You are an ${role} who will directly perform the user's task.

# Objective
${requirement}

# Context
(Add relevant background information or constraints here, if needed.)

# Instructions
1. Perform the task described in the Objective.
2. Focus on delivering the final result (email, analysis, code, etc.).
3. Do **not** talk about prompts, prompt generation, or rewriting instructions.
4. Do **not** rewrite or summarize the task itself.
5. Return the completed output in one response.

# Notes
- Use a clear, professional tone.
- Structure the answer with headings or bullet points when helpful.
- Include examples only if they improve clarity.`,

  claude: (role, requirement) =>
    `# Role
You are an ${role}.

# Objective
Perform the following task and return the final result:

${requirement}

# Instructions
- Do not explain your process unless explicitly asked.
- Do not rephrase or restate the Objective.
- Respond only with the completed result, not with a description of the task.

# Notes
Keep the answer clear and well-structured.`,

  chatgpt: (role, requirement) =>
    `# Role
You are an ${role}.

# Objective
Carry out the following task for the user and return the finished output:

${requirement}

# Instructions
- Start directly with the answer.
- Do not include meta-commentary or a restatement of the request.
- Do not talk about prompts or instructions.
- Output only the final result.

# Notes
Maintain professional quality and clarity in your response.`,

  detailed: (role, requirement) =>
    `# Role
You are an ${role}.

# Objective
Execute the following task end-to-end and provide the final output:

${requirement}

# Context
- Add any important background, constraints, or assumptions here if needed.

# Instructions
1. Analyze the task carefully.
2. Break the solution into clear, logical sections where useful.
3. Ensure correctness, structure, and readability.
4. Do **not** generate instructions or "prompts" for another AI.
5. Do **not** rewrite or summarize the task; just solve it.

# Notes
- Use headings, bullet points, or numbered lists as appropriate.
- Include examples or explanations only if they help the user apply the result.`
};

// ===========================================
// ADDED BACK: getRoleAndPreset function from old version
// ===========================================
function getRoleAndPreset(text) {
  const lower = (text || "").toLowerCase();
  let role = "expert assistant";
  let preset = "default";
  let label = "General";

  if (/email|mail|send.*to|message.*to|follow[- ]up/i.test(lower)) {
    role = "expert email writer";
    preset = "default";
    label = "Email";
  } else if (
    /code|program|script|develop|software|function|python|javascript|typescript|java|c#|sql|api|bug fix|refactor/i.test(
      lower
    )
  ) {
    role = "expert developer";
    preset = "chatgpt";
    label = "Code";
  } else if (
    /analyze|analysis|market|research|evaluate|assessment|review|trend|report|insight|metrics/i.test(
      lower
    )
  ) {
    role = "expert analyst";
    preset = "detailed";
    label = "Analysis";
  } else if (
    /blog|article|story|linkedin post|caption|copywriting|content/i.test(lower)
  ) {
    role = "expert content writer";
    preset = "default";
    label = "Writing";
  } else if (
    /workout|exercise|fitness|gym|diet|meal plan|training plan/i.test(lower)
  ) {
    role = "expert fitness trainer";
    preset = "detailed";
    label = "Workout";
  } else if (
    /strategy|business plan|roadmap|pitch deck|proposal|go[- ]to[- ]market|g2m/i.test(
      lower
    )
  ) {
    role = "expert business consultant";
    preset = "detailed";
    label = "Business";
  } else if (
    /teach|explain|lesson|tutorial|guide|training material|curriculum/i.test(
      lower
    )
  ) {
    role = "expert educator";
    preset = "detailed";
    label = "Education";
  }

  return { role, preset, label };
}

// ===========================================
// ADDED BACK: generatePrompt function from old version (simplified)
// ===========================================
async function generatePrompt() {
  const requirementEl = document.getElementById('requirement');
  const outputEl = document.getElementById('output');
  const convertBtn = document.getElementById('convertBtn');
  const raw = requirementEl.value.trim();

  if (!raw) {
    showNotification("Please enter a requirement first");
    return "";
  }

  const { role, preset: autoPreset, label } = getRoleAndPreset(raw);
  
  // Get current preset from UI
  const presetSelect = document.getElementById('presetSelect');
  const currentPreset = presetSelect ? presetSelect.value : 'default';
  
  // Get the appropriate preset template
  let presetTemplate;
  if (currentPreset === 'claude' && PRESETS.claude) {
    presetTemplate = PRESETS.claude;
  } else if (currentPreset === 'chatgpt' && PRESETS.chatgpt) {
    presetTemplate = PRESETS.chatgpt;
  } else if (currentPreset === 'detailed' && PRESETS.detailed) {
    presetTemplate = PRESETS.detailed;
  } else {
    presetTemplate = PRESETS.default;
  }

  // Disable convert button during generation
  if (convertBtn) {
    convertBtn.disabled = true;
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
  }

  try {
    // Generate the prompt using the preset template
    const generatedPrompt = presetTemplate(role, raw);
    
    // Update output
    if (outputEl) {
      outputEl.value = generatedPrompt;
    }
    
    // Update stats
    updateOutputStats();
    
    // Update usage count
    appState.usageCount = (appState.usageCount || 0) + 1;
    updateUsageCount();
    
    // Update AI tools based on generated prompt
    updateAIToolsGrid(label, raw, true);
    
    // Update button states
    updateButtonStates();
    
    // Show success notification
    showSuccess('Prompt generated successfully!');
    
    return generatedPrompt;
    
  } catch (error) {
    console.error('Generation error:', error);
    showError('Failed to generate prompt. Please try again.');
    
    // Fallback: Use simple prompt format
    const fallbackPrompt = `# Task\n${raw}\n\n# Instructions\nPlease perform this task and provide the result.`;
    if (outputEl) {
      outputEl.value = fallbackPrompt;
      updateOutputStats();
      updateButtonStates();
    }
    
    return fallbackPrompt;
    
  } finally {
    // Re-enable convert button
    if (convertBtn) {
      convertBtn.disabled = false;
      convertBtn.innerHTML = '<i class="fas fa-magic"></i> Convert Idea to Prompt';
    }
  }
}

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
    
    // Initialize event handlers (includes card expander)
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
    
    // ===========================================
    // ADDED: Setup convert button event listener
    // ===========================================
    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) {
      convertBtn.addEventListener('click', generatePrompt);
    }
    
    // ===========================================
    // ADDED: Setup auto-convert event listeners
    // ===========================================
    setupAutoConvertListeners();
    
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
 * Setup auto-convert event listeners
 */
function setupAutoConvertListeners() {
  const requirementEl = document.getElementById('requirement');
  const autoConvertCheckbox = document.getElementById('autoConvert');
  
  if (!requirementEl || !autoConvertCheckbox) return;
  
  // Track typing for auto-convert
  let typingTimer;
  const doneTypingInterval = 1500; // 1.5 seconds
  
  requirementEl.addEventListener('input', function() {
    // Update input stats
    updateInputStats();
    
    // Update convert button state
    updateButtonStates();
    
    // Clear existing timer
    clearTimeout(typingTimer);
    
    // If auto-convert is enabled and there's text, start timer
    if (autoConvertCheckbox.checked && this.value.trim()) {
      typingTimer = setTimeout(() => {
        generatePrompt();
      }, doneTypingInterval);
    }
  });
  
  // Clear timer on blur
  requirementEl.addEventListener('blur', () => {
    clearTimeout(typingTimer);
  });
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
  
  // ===========================================
  // ADDED: Setup preset selector change handler
  // ===========================================
  const presetSelect = document.getElementById('presetSelect');
  if (presetSelect) {
    presetSelect.addEventListener('change', function() {
      // Regenerate prompt if there's content and auto-convert is enabled
      const requirementEl = document.getElementById('requirement');
      const autoConvertCheckbox = document.getElementById('autoConvert');
      
      if (requirementEl && requirementEl.value.trim() && 
          autoConvertCheckbox && autoConvertCheckbox.checked) {
        generatePrompt();
      }
    });
  }
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
    const count = appState.usageCount || 0;
    usageElement.innerHTML = `<i class="fas fa-bolt"></i>${count} prompts generated`;
    
    // Also update the stats footer
    const statsFooter = document.querySelector('.stats-footer');
    if (statsFooter) {
      statsFooter.innerHTML = `<i class="fas fa-bolt"></i><span>${count} prompts generated</span>`;
    }
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
    
    // Also update export/save buttons
    const exportBtn = document.getElementById('exportBtn');
    const saveBtn = document.getElementById('saveTemplateBtn');
    
    if (exportBtn) exportBtn.disabled = !outputEl.value.trim();
    if (saveBtn) saveBtn.disabled = !outputEl.value.trim();
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
 * Toggle card maximize/minimize
 * @param {string} cardId - ID of card to toggle
 */
function toggleCard(cardId) {
  if (window.cardExpander) {
    const card = document.getElementById(cardId);
    if (card) {
      const isMaximized = card.classList.contains('is-maximized');
      const isMinimized = card.classList.contains('is-minimized');
      
      if (isMaximized || isMinimized) {
        window.cardExpander.restoreCard(cardId);
      } else {
        window.cardExpander.maximizeCard(cardId);
      }
    }
  }
}

/**
 * Maximize specific card
 * @param {string} cardId - ID of card to maximize
 */
function maximizeCard(cardId) {
  if (window.cardExpander) {
    window.cardExpander.maximizeCard(cardId);
  }
}

/**
 * Minimize specific card
 * @param {string} cardId - ID of card to minimize
 */
function minimizeCard(cardId) {
  if (window.cardExpander) {
    window.cardExpander.minimizeCard(cardId);
  }
}

/**
 * Restore specific card
 * @param {string} cardId - ID of card to restore
 */
function restoreCard(cardId) {
  if (window.cardExpander) {
    window.cardExpander.restoreCard(cardId);
  }
}

/**
 * Get card states
 */
function getCardStates() {
  if (window.cardExpander) {
    return {
      maximized: window.cardExpander.getMaximizedCard(),
      minimized: window.cardExpander.getMinimizedCards(),
      hasMaximizedCard: window.cardExpander.getMaximizedCard() !== null
    };
  }
  return null;
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

// ✅ FIXED: Add this global object for debugging
window.PromptCraft = {
  appState,
  modalManager,
  exportAppData,
  resetAppData,
  showNotification,
  showSuccess,
  showError,
  showInfo,
  setTheme,
  toggleTheme,
  // Card expander methods
  toggleCard,
  maximizeCard,
  minimizeCard,
  restoreCard,
  getCardStates,
  // Prompt generation methods (ADDED BACK)
  getRoleAndPreset,
  generatePrompt
};

console.log('🎯 PromptCraft loaded');
