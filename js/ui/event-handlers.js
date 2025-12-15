// event-handlers.js - UI Event Handlers

// IMPORT YOUR EXISTING IMPORTS HERE
import appState from '../core/app-state.js';
import { detectContextFromText, createContextChipsHTML } from '../features/context-detective.js';
import { generatePrompt } from '../ai/prompt-generator.js';
import { updateAIToolsGrid, setupToolClickHandlers } from '../ai/ai-tools.js';
import { showNotification, showSuccess, showError, showInfo } from './notifications.js';
import modalManager, { openModal, closeModal } from './modal-manager.js';
import { setupVoiceButton } from '../features/voice.js';
import { renderTemplatesGrid } from '../features/templates.js';
import { renderHistoryList } from '../features/history.js';
import { copyPromptToClipboard, exportPromptToFile } from '../ai/prompt-generator.js';

// 🔧 ADD THIS AT THE TOP (ONCE!)
let cardExpanderInstance = null;

/**
 * Initialize card expander
 */
export function initializeCardExpander() {
  if (cardExpanderInstance) {
    console.log('✅ Card expander already initialized');
    return cardExpanderInstance;
  }
  
  console.log('🔧 Initializing card expander from event handlers...');
  
  // Import and initialize card expander
  import('../features/card-expander.js').then(module => {
    const CardExpander = module.CardExpander;
    cardExpanderInstance = new CardExpander();
    cardExpanderInstance.initialize();
    window.cardExpander = cardExpanderInstance;
    
    console.log('✅ Card expander initialized successfully');
  }).catch(error => {
    console.error('❌ Failed to load card expander:', error);
  });
  
  return cardExpanderInstance;
}

/**
 * Initialize all event handlers
 */
export function initializeEventHandlers() {
  // 🔧 ADD THIS LINE - Initialize card expander FIRST
  initializeCardExpander();
  
  // ... KEEP ALL YOUR EXISTING CODE BELOW EXACTLY AS IS
  setupRequirementHandlers();
  setupOutputHandlers();
  setupToolHandlers();
  setupModalHandlers();
  setupVoiceHandlers();
  setupUIHandlers();
}

/**
 * Setup requirement textarea handlers
 */
function setupRequirementHandlers() {
  // ... KEEP YOUR EXISTING CODE HERE
}

/**
 * Setup output handlers
 */
function setupOutputHandlers() {
  // ... KEEP YOUR EXISTING CODE HERE
}

/**
 * Setup tool handlers
 */
function setupToolHandlers() {
  // ... KEEP YOUR EXISTING CODE HERE
}

/**
 * Setup modal handlers
 */
function setupModalHandlers() {
  // ... KEEP YOUR EXISTING CODE HERE
}

/**
 * Setup voice handlers
 */
function setupVoiceHandlers() {
  // ... KEEP YOUR EXISTING CODE HERE
}

/**
 * Setup general UI handlers
 */
function setupUIHandlers() {
  // ... KEEP YOUR EXISTING CODE HERE
}

// ... KEEP ALL YOUR OTHER EXISTING FUNCTIONS BELOW
