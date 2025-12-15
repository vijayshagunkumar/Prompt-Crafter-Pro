// event-handlers.js - DOM Event Handlers - FIXED VERSION

import appState from '../core/app-state.js';
import { generatePrompt, copyPromptToClipboard, exportPromptToFile } from '../ai/prompt-generator.js';
import { setupToolClickHandlers } from '../ai/ai-tools.js';
import { setupTemplateEventHandlers, openTemplatesModal } from '../features/templates.js';
import { loadHistory, addToHistory } from '../features/history.js';
import { detectContextFromText, createContextChipsHTML } from '../features/context-detective.js';
import { startVoiceRecognition, stopVoiceRecognition } from '../features/voice.js';

/**
 * Initialize all event handlers
 */
export function initEventHandlers() {
  console.log('🔧 Initializing event handlers...');
  
  // Setup textarea and button handlers
  setupTextareaHandlers();
  setupButtonHandlers();
  setupTemplateHandlers();
  setupToolHandlers();
  setupHistoryHandlers();
  setupVoiceHandlers();
  
  // Initialize from saved state
  initFromSavedState();
  
  console.log('✅ Event handlers initialized');
}

/**
 * Setup textarea handlers
 */
function setupTextareaHandlers() {
  // Card 1: Idea textarea
  const ideaTextarea = document.getElementById('idea');
  const outputTextarea = document.getElementById('output');
  
  if (ideaTextarea) {
    // Auto-convert timer
    ideaTextarea.addEventListener('input', debounce(() => {
      const text = ideaTextarea.value.trim();
      if (text && appState.autoConvertEnabled && !appState.isConverted) {
        console.log('Auto-convert triggered');
        convertIdeaToPrompt();
      }
      
      // Update character counter
      updateCharCounter(ideaTextarea, 'idea-char-count');
      
      // Update context chips
      updateContextChips(text);
    }, 300));
    
    // Clear button handler
    const clearBtn = document.querySelector('.clear-btn-left');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        ideaTextarea.value = '';
        ideaTextarea.focus();
        updateCharCounter(ideaTextarea, 'idea-char-count');
        updateContextChips('');
      });
    }
  }
  
  if (outputTextarea) {
    // Update character counter for output
    outputTextarea.addEventListener('input', () => {
      updateCharCounter(outputTextarea, 'output-char-count');
    });
    
    // Copy button handler (embedded version)
    const copyBtn = document.querySelector('.copy-btn-embedded');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const text = outputTextarea.value;
        if (!text) return;
        
        const success = await copyPromptToClipboard(text);
        if (success) {
          showNotification('Prompt copied to clipboard!');
        } else {
          showNotification('Failed to copy prompt');
        }
      });
    }
  }
}

/**
 * Setup button handlers
 */
function setupButtonHandlers() {
  // Convert button
  const convertBtn = document.querySelector('.elegant-convert-btn');
  if (convertBtn) {
    convertBtn.addEventListener('click', convertIdeaToPrompt);
  }
  
  // Export button
  const exportBtn = document.querySelector('.export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const output = document.getElementById('output');
      if (output && output.value.trim()) {
        exportPromptToFile(output.value.trim(), 'prompt.txt');
        showNotification('Prompt exported as prompt.txt');
      } else {
        showNotification('Generate a prompt first');
      }
    });
  }
  
  // Save as Template button
  const saveTemplateBtn = document.querySelector('.save-template-btn');
  if (saveTemplateBtn) {
    saveTemplateBtn.addEventListener('click', () => {
      const output = document.getElementById('output');
      if (output && output.value.trim()) {
        // This will be handled by setupTemplateEventHandlers
        // But we need to ensure the modal opens
        openTemplatesModal();
      } else {
        showNotification('Generate a prompt first');
      }
    });
  }
  
  // Clear output button
  const clearOutputBtn = document.querySelector('.clear-output-btn');
  if (clearOutputBtn) {
    clearOutputBtn.addEventListener('click', () => {
      const output = document.getElementById('output');
      if (output) {
        output.value = '';
        updateCharCounter(output, 'output-char-count');
        appState.isConverted = false;
        showNotification('Output cleared');
      }
    });
  }
  
  // Preset buttons
  const presetButtons = document.querySelectorAll('.preset-btn');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      if (preset) {
        setActivePreset(preset);
      }
    });
  });
}

/**
 * Setup template handlers
 */
function setupTemplateHandlers() {
  // Setup template event handlers
  setupTemplateEventHandlers(
    showNotification,
    (content) => {
      const ideaTextarea = document.getElementById('idea');
      if (ideaTextarea) {
        ideaTextarea.value = content;
        ideaTextarea.dispatchEvent(new Event('input'));
      }
    }
  );
}

/**
 * Setup tool handlers
 */
function setupToolHandlers() {
  // Setup AI tool click handlers
  setupToolClickHandlers(showNotification);
}

/**
 * Setup history handlers
 */
function setupHistoryHandlers() {
  // Load history on page load
  loadHistory();
  
  // View history button
  const viewHistoryBtn = document.querySelector('.view-history-btn');
  if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener('click', () => {
      // Open history modal (you'll need to implement this)
      showNotification('History feature coming soon');
    });
  }
}

/**
 * Setup voice handlers
 */
function setupVoiceHandlers() {
  const micBtn = document.querySelector('.mic-btn-right');
  if (micBtn) {
    let isRecording = false;
    
    micBtn.addEventListener('click', async () => {
      const ideaTextarea = document.getElementById('idea');
      
      if (!isRecording) {
        // Start recording
        const success = await startVoiceRecognition((text) => {
          if (ideaTextarea) {
            ideaTextarea.value = text;
            ideaTextarea.dispatchEvent(new Event('input'));
          }
        });
        
        if (success) {
          isRecording = true;
          micBtn.classList.add('recording');
          micBtn.innerHTML = '<i class="fas fa-stop"></i>';
          showNotification('Listening... Speak now');
        } else {
          showNotification('Voice recognition not supported');
        }
      } else {
        // Stop recording
        stopVoiceRecognition();
        isRecording = false;
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        showNotification('Voice input stopped');
      }
    });
  }
}

/**
 * Convert idea to prompt
 */
async function convertIdeaToPrompt() {
  const ideaTextarea = document.getElementById('idea');
  const outputTextarea = document.getElementById('output');
  
  if (!ideaTextarea || !outputTextarea) return;
  
  const idea = ideaTextarea.value.trim();
  if (!idea) {
    showNotification('Please enter an idea first');
    return;
  }
  
  // Show loading state
  const convertBtn = document.querySelector('.elegant-convert-btn');
  const originalText = convertBtn?.innerHTML;
  if (convertBtn) {
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
    convertBtn.disabled = true;
  }
  
  try {
    // Generate prompt
    const result = await generatePrompt(idea, {
      useAI: appState.autoConvertEnabled
    });
    
    if (result.success) {
      // Update output
      outputTextarea.value = result.prompt;
      outputTextarea.dispatchEvent(new Event('input'));
      
      // Update context chips
      updateContextChips(idea);
      
      // Update AI tools grid with new context
      const toolsGrid = document.getElementById('aiToolsGrid');
      if (toolsGrid) {
        // You'll need to import and call updateAIToolsGrid here
        // updateAIToolsGrid(result.context?.taskType, result.prompt, true);
      }
      
      // Add to history
      addToHistory({
        role: result.role,
        presetLabel: appState.currentPreset,
        raw: idea,
        prompt: result.prompt
      });
      
      showNotification('Prompt generated successfully!');
    } else {
      showNotification('Generation failed, using fallback');
    }
  } catch (error) {
    console.error('Conversion error:', error);
    showNotification('Error generating prompt');
  } finally {
    // Restore button
    if (convertBtn) {
      convertBtn.innerHTML = originalText;
      convertBtn.disabled = false;
    }
  }
}

/**
 * Update character counter
 * @param {HTMLTextAreaElement} textarea - Textarea element
 * @param {string} counterId - Counter element ID
 */
function updateCharCounter(textarea, counterId) {
  const counter = document.getElementById(counterId);
  if (counter) {
    const charCount = textarea.value.length;
    counter.textContent = `${charCount} chars`;
    
    // Update color based on count
    if (charCount === 0) {
      counter.style.color = 'var(--text-muted)';
    } else if (charCount > 0 && charCount <= 100) {
      counter.style.color = 'var(--matrix-green)';
    } else if (charCount > 100 && charCount <= 500) {
      counter.style.color = 'var(--primary)';
    } else {
      counter.style.color = 'var(--warning)';
    }
  }
}

/**
 * Update context chips
 * @param {string} text - Input text
 */
function updateContextChips(text) {
  const chipsContainer = document.querySelector('.chip-row');
  if (!chipsContainer) return;
  
  if (!text.trim()) {
    chipsContainer.innerHTML = '';
    return;
  }
  
  const context = detectContextFromText(text);
  const chipsHTML = createContextChipsHTML(context);
  chipsContainer.innerHTML = chipsHTML;
}

/**
 * Set active preset
 * @param {string} preset - Preset name
 */
function setActivePreset(preset) {
  appState.currentPreset = preset;
  
  // Update UI
  const presetButtons = document.querySelectorAll('.preset-btn');
  presetButtons.forEach(btn => {
    if (btn.dataset.preset === preset) {
      btn.classList.add('active');
      btn.style.background = 'rgba(255, 94, 0, 0.2)';
      btn.style.borderColor = 'var(--primary)';
    } else {
      btn.classList.remove('active');
      btn.style.background = '';
      btn.style.borderColor = '';
    }
  });
  
  showNotification(`Preset changed to: ${preset}`);
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${getNotificationIcon(type)}"></i>
    <span>${message}</span>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add to container or create one
  let container = document.querySelector('.notification-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
  }
  
  container.appendChild(notification);
  
  // Show with animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
  
  // Close button
  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    });
  }
}

/**
 * Get notification icon based on type
 * @param {string} type - Notification type
 * @returns {string} Icon class name
 */
function getNotificationIcon(type) {
  const icons = {
    success: 'check-circle',
    error: 'exclamation-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  };
  return icons[type] || 'info-circle';
}

/**
 * Initialize from saved state
 */
function initFromSavedState() {
  // Set active preset
  if (appState.currentPreset) {
    setActivePreset(appState.currentPreset);
  }
  
  // Update character counters
  const ideaTextarea = document.getElementById('idea');
  const outputTextarea = document.getElementById('output');
  
  if (ideaTextarea) {
    updateCharCounter(ideaTextarea, 'idea-char-count');
  }
  
  if (outputTextarea && outputTextarea.value) {
    updateCharCounter(outputTextarea, 'output-char-count');
  }
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export initialization function
export default initEventHandlers;
