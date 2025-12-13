// app.js - Main Application Entry Point (UPDATED & COMPLETE)

import appState from './core/app-state.js';
import { STORAGE_KEYS, DEFAULTS } from './core/constants.js';
import { initializeVoice } from './features/voice.js';
import { loadTemplates } from './features/templates.js';
import { loadHistory } from './features/history.js';
import { detectContextFromText } from './features/context-detective.js';
import { setupToolClickHandlers, updateAIToolsGrid } from './ai/ai-tools.js';
import { initializeEventHandlers } from './ui/event-handlers.js';
import { showNotification, showSuccess, showError, showInfo } from './ui/notifications.js';
import modalManager from './ui/modal-manager.js';
import themeManager from './ui/theme-manager.js';
import { initializeSettings, openSettingsModal } from './ui/settings-manager.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    initializeApp();
  } catch (e) {
    console.error('Fatal init error:', e);
    showError('App failed to initialize. Check console for details.');
  }
});

function initializeApp() {
  // Core UI init
  themeManager.initialize();
  modalManager.initialize();

  // Settings
  initializeSettings();

  // Data
  loadTemplates();
  loadHistory();

  // AI tool grid
  updateAIToolsGrid();
  setupToolClickHandlers();

  // Voice
  initializeVoice();

  // Events (includes maximize, clear/undo, textarea sizing persistence, etc.)
  initializeEventHandlers();

  // Default focus
  const req = document.getElementById('requirement');
  if (req) req.focus();

  showInfo('Ready');
}

// Expose settings opener for UI buttons if needed
window.openSettingsModal = openSettingsModal;
