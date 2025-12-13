// event-handlers.js - UI Event Handlers

import appState from '../core/app-state.js';
import { DEFAULTS } from '../core/constants.js';
import { generatePromptFromRequirement } from '../ai/prompt-generator.js';
import { detectContextFromText } from '../features/context-detective.js';
import { updateInputStats, updateOutputStats } from '../core/utilities.js';
import { showNotification, showSuccess, showError, showInfo } from './notifications.js';
import themeManager from './theme-manager.js';
import modalManager from './modal-manager.js';
import { openSettingsModal } from './settings-manager.js';

// ===========================================
// Textarea sizing persistence + Clear/Undo
// ===========================================
const TEXTAREA_SIZE_KEY = 'pc_textareaSizes';

let _textareaSizes = {
  requirement: { height: null },
  output: { height: null }
};

let _saveSizesTimer = null;
function _debouncedSaveSizes() {
  clearTimeout(_saveSizesTimer);
  _saveSizesTimer = setTimeout(() => {
    try {
      localStorage.setItem(TEXTAREA_SIZE_KEY, JSON.stringify(_textareaSizes));
    } catch (e) {
      // ignore storage errors
    }
  }, 350);
}

function _loadTextareaSizes() {
  try {
    const raw = localStorage.getItem(TEXTAREA_SIZE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') _textareaSizes = { ..._textareaSizes, ...parsed };
  } catch (e) {
    // ignore
  }
}

function _applyTextareaSizes() {
  const requirementEl = document.getElementById('requirement');
  const outputEl = document.getElementById('output');

  if (requirementEl && _textareaSizes.requirement?.height) {
    requirementEl.style.height = `${_textareaSizes.requirement.height}px`;
  }
  if (outputEl && _textareaSizes.output?.height) {
    outputEl.style.height = `${_textareaSizes.output.height}px`;
  }
}

function _observeTextareaSizes() {
  const requirementEl = document.getElementById('requirement');
  const outputEl = document.getElementById('output');
  if (!window.ResizeObserver || (!requirementEl && !outputEl)) return;

  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const id = entry.target?.id;
      const h = Math.round(entry.contentRect.height || 0);
      if (!h) continue;

      if (id === 'requirement') _textareaSizes.requirement.height = h;
      if (id === 'output') _textareaSizes.output.height = h;

      _debouncedSaveSizes();
    }
  });

  if (requirementEl) ro.observe(requirementEl);
  if (outputEl) ro.observe(outputEl);
}

export function initializeEventHandlers() {
  // Load and apply persisted textarea heights early (before any layout-dependent logic)
  _loadTextareaSizes();
  _applyTextareaSizes();

  setupSidebarHandlers();
  setupTopbarHandlers();
  setupPresetHandlers();
  setupInputHandlers();
  setupOutputHandlers();
  setupCardMaximizeHandlers();
  setupGlobalShortcuts();

  // Track manual textarea resizing and persist heights
  _observeTextareaSizes();
}

// ==============================
// Sidebar / Topbar
// ==============================
function setupSidebarHandlers() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // Theme chips
  document.querySelectorAll('.theme-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.theme-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      themeManager.setTheme(chip.dataset.theme);
    });
  });

  // Templates/History toggles handled elsewhere (if present)
}

function setupTopbarHandlers() {
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
}

// ==============================
// Presets
// ==============================
function setupPresetHandlers() {
  const presetSelect = document.getElementById('presetSelect');
  const lockPreset = document.getElementById('lockPreset');

  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      appState.currentPreset = presetSelect.value;
      appState.userPresetLocked = !!(lockPreset && lockPreset.checked);
      updatePresetInfo(appState.lastTaskLabel || 'General', appState.currentPreset, appState.userPresetLocked ? 'manual' : 'auto');

      // If already converted, clear output to avoid “stale prompt”
      const outputEl = document.getElementById('output');
      const convertedBadge = document.getElementById('convertedBadge');
      if (outputEl) outputEl.value = '';
      if (convertedBadge) convertedBadge.style.display = 'none';
      setLaunchButtonsEnabled(false);
    });
  }

  if (lockPreset) {
    lockPreset.addEventListener('change', () => {
      appState.userPresetLocked = lockPreset.checked;
      updatePresetInfo(appState.lastTaskLabel || 'General', appState.currentPreset, lockPreset.checked ? 'manual' : 'auto');
    });
  }
}

function updatePresetInfo(taskLabel, presetId, source) {
  const el = document.getElementById('presetInfo');
  if (!el) return;

  const presetNames = {
    default: 'Standard',
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    detailed: 'Detailed'
  };

  const nicePreset = presetNames[presetId] || presetId;
  const srcLabel = source === 'manual' ? 'manual' : 'auto';
  el.textContent = `${taskLabel} • ${nicePreset} (${srcLabel})`;
}

// ==============================
// Input area (Requirement)
// ==============================
function setupInputHandlers() {
  const requirementEl = document.getElementById('requirement');
  const clearBtn = document.getElementById('clearRequirementBtn');
  const autoConvertCheckbox = document.getElementById('autoConvert');
  const contextChipsRow = document.getElementById('contextChipsRow');

  if (!requirementEl) {
    console.warn('Requirement textarea not found');
    return;
  }

  // Input handler with debouncing
  let inputTimeout;
  requirementEl.addEventListener('input', () => {
    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(() => {
      handleRequirementInput(requirementEl, contextChipsRow);
    }, 300);

    // Update stats immediately
    updateInputStats(requirementEl.value);
  });

  // Clear / Undo button
  if (clearBtn) {
    let lastClearedText = '';
    let isUndoState = false;

    const setClearState = () => {
      isUndoState = false;
      clearBtn.classList.remove('undo-state');
      clearBtn.setAttribute('aria-label', 'Clear text');
      clearBtn.title = 'Clear text';
      const icon = clearBtn.querySelector('i');
      if (icon) icon.className = 'fas fa-broom';
    };

    const setUndoState = () => {
      isUndoState = true;
      clearBtn.classList.add('undo-state');
      clearBtn.setAttribute('aria-label', 'Undo clear');
      clearBtn.title = 'Undo clear';
      const icon = clearBtn.querySelector('i');
      if (icon) icon.className = 'fas fa-undo';
    };

    // Ensure initial state looks correct even if HTML icon is different
    setClearState();

    clearBtn.addEventListener('click', () => {
      const current = requirementEl.value || '';

      if (!isUndoState) {
        if (!current.trim()) return;

        lastClearedText = current;
        requirementEl.value = '';
        requirementEl.focus();

        // Clear output too (new requirement)
        const outputEl = document.getElementById('output');
        if (outputEl) {
          outputEl.value = '';
          updateOutputStats();
        }

        handleRequirementInput(requirementEl, contextChipsRow);
        setUndoState();
        showInfo('Text cleared. Click undo to restore.');
      } else {
        requirementEl.value = lastClearedText;
        requirementEl.focus();

        handleRequirementInput(requirementEl, contextChipsRow);
        setClearState();
        showInfo('Text restored');
        lastClearedText = '';
      }
    });

    // If the user starts typing after a clear, drop undo state
    requirementEl.addEventListener('input', () => {
      if (isUndoState) {
        isUndoState = false;
        lastClearedText = '';
        setClearState();
      }
    });
  }

  // Auto-convert toggle
  if (autoConvertCheckbox) {
    autoConvertCheckbox.addEventListener('change', () => {
      appState.autoConvertEnabled = autoConvertCheckbox.checked;
      if (!appState.autoConvertEnabled) clearAutoConvertTimer();
      else if (requirementEl.value.trim()) resetAutoConvertTimer();
    });
  }

  // Convert button
  const convertBtn = document.getElementById('convertBtn');
  if (convertBtn) {
    convertBtn.addEventListener('click', () => generatePrompt(requirementEl));
  }
}

function handleRequirementInput(requirementEl, contextChipsRow) {
  const text = requirementEl.value || '';
  const convertBtn = document.getElementById('convertBtn');
  const convertedBadge = document.getElementById('convertedBadge');

  // Enable/disable convert button
  if (convertBtn) convertBtn.disabled = !text.trim();

  // Clear converted badge + disable launch buttons when content changes
  if (convertedBadge) convertedBadge.style.display = 'none';
  setLaunchButtonsEnabled(false);

  // Update context chips (optional)
  try {
    const ctx = detectContextFromText(text);
    appState.lastTaskLabel = ctx?.label || 'General';
    appState.lastRole = ctx?.role || 'expert assistant';

    // (If you have chips UI, render them here; otherwise harmless)
    if (contextChipsRow && ctx?.chips?.length) {
      contextChipsRow.innerHTML = '';
      ctx.chips.forEach((chip) => {
        const el = document.createElement('span');
        el.className = 'chip';
        el.textContent = chip;
        contextChipsRow.appendChild(el);
      });
    } else if (contextChipsRow) {
      contextChipsRow.innerHTML = '';
    }

    // Auto preset unless locked
    if (!appState.userPresetLocked && ctx?.preset) {
      appState.currentPreset = ctx.preset;
      const presetSelect = document.getElementById('presetSelect');
      if (presetSelect) presetSelect.value = ctx.preset;
    }

    updatePresetInfo(appState.lastTaskLabel, appState.currentPreset, appState.userPresetLocked ? 'manual' : 'auto');
  } catch (e) {
    // ignore context errors
  }

  // Auto convert
  if (appState.autoConvertEnabled) resetAutoConvertTimer();
}

// ==============================
// Output area
// ==============================
function setupOutputHandlers() {
  const outputEl = document.getElementById('output');
  if (!outputEl) return;

  outputEl.addEventListener('input', () => updateOutputStats());

  const copyBtn = document.getElementById('copyOutputBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const txt = (outputEl.value || '').trim();
      if (!txt) return showInfo('Nothing to copy');

      try {
        await navigator.clipboard.writeText(txt);
        showSuccess('Copied to clipboard');
      } catch (e) {
        showError('Copy failed');
      }
    });
  }

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const txt = (outputEl.value || '').trim();
      if (!txt) return showInfo('No prompt to export');

      const blob = new Blob([txt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Exported');
    });
  }
}

// ==============================
// Card maximize (fix blinking by ensuring single handler)
// ==============================
function setupCardMaximizeHandlers() {
  const buttons = document.querySelectorAll('[data-maximize-card]');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cardId = btn.getAttribute('data-maximize-card');
      const card = document.getElementById(cardId);
      if (!card) return;

      const isMax = card.classList.toggle('is-maximized');
      document.body.classList.toggle('has-maximized-card', isMax);

      const icon = btn.querySelector('i');
      if (icon) icon.className = isMax ? 'fas fa-compress' : 'fas fa-expand';
    });
  });

  // Click outside / ESC to close if needed
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    const maxCard = document.querySelector('.card.is-maximized');
    if (!maxCard) return;

    maxCard.classList.remove('is-maximized');
    document.body.classList.remove('has-maximized-card');

    document.querySelectorAll('[data-maximize-card] i').forEach((icon) => {
      icon.className = 'fas fa-expand';
    });
  });
}

// ==============================
// Auto-convert timer
// ==============================
function resetAutoConvertTimer() {
  clearAutoConvertTimer();

  const requirementEl = document.getElementById('requirement');
  if (!requirementEl) return;

  const req = requirementEl.value.trim();
  if (!req) return;

  appState.autoConvertCountdown = appState.autoConvertDelay || DEFAULTS.autoConvertDelay;

  const timerValue = document.getElementById('timerValue');
  const timerDisplay = document.getElementById('timerDisplay');
  if (timerValue) timerValue.textContent = `${appState.autoConvertCountdown}s`;
  if (timerDisplay) timerDisplay.style.display = 'inline-flex';

  appState.countdownInterval = setInterval(() => {
    appState.autoConvertCountdown--;
    if (timerValue) timerValue.textContent = `${appState.autoConvertCountdown}s`;

    if (appState.autoConvertCountdown <= 0) {
      clearAutoConvertTimer();
      if (timerDisplay) timerDisplay.style.display = 'none';
      generatePrompt(requirementEl);
    }
  }, 1000);

  appState.autoConvertTimer = setTimeout(() => {
    const current = requirementEl.value.trim();
    if (current) generatePrompt(requirementEl);
  }, appState.autoConvertCountdown * 1000);
}

function clearAutoConvertTimer() {
  clearTimeout(appState.autoConvertTimer);
  clearInterval(appState.countdownInterval);

  const timerDisplay = document.getElementById('timerDisplay');
  if (timerDisplay) timerDisplay.style.display = 'none';
}

// ==============================
// Prompt generation
// ==============================
async function generatePrompt(requirementEl) {
  const raw = (requirementEl?.value || '').trim();
  if (!raw) return showInfo('Please enter a requirement first');

  const convertBtn = document.getElementById('convertBtn');
  const outputEl = document.getElementById('output');
  const convertedBadge = document.getElementById('convertedBadge');

  if (convertBtn) {
    convertBtn.disabled = true;
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
  }

  clearAutoConvertTimer();

  try {
    const result = await generatePromptFromRequirement(raw);
    if (outputEl) outputEl.value = result || '';
    updateOutputStats();

    if (convertedBadge) convertedBadge.style.display = 'inline-flex';
    setLaunchButtonsEnabled(true);
    showSuccess('Prompt generated');
  } catch (e) {
    console.error(e);
    showError('Failed to generate prompt');
  } finally {
    if (convertBtn) {
      convertBtn.disabled = false;
      convertBtn.innerHTML = '<i class="fas fa-magic"></i> Convert';
    }
  }
}

// ==============================
// AI tool buttons enabled/disabled
// ==============================
function setLaunchButtonsEnabled(enabled) {
  const ids = [
    'chatgptBtn',
    'claudeBtn',
    'geminiBtn',
    'perplexityBtn',
    'deepseekBtn',
    'copilotBtn',
    'grokBtn'
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
}

// ==============================
// Global shortcuts
// ==============================
function setupGlobalShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter converts
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const req = document.getElementById('requirement');
      if (req) generatePrompt(req);
    }
  });
}
