// PromptCraft – app.js

function intentObjectToChips(intent) {
  if (!intent) return [];

  const chips = [];

  if (intent.persona !== "neutral") {
    chips.push(`[${intent.persona}]`);
  }

  if (intent.tone !== "neutral") {
    chips.push(`[tone: ${intent.tone}]`);
  }

  if (intent.formality !== "neutral") {
    chips.push(`[formality: ${intent.formality}]`);
  }

  if (intent.emotion !== "neutral") {
    chips.push(`[emotion: ${intent.emotion}]`);
  }

  if (intent.urgency !== "normal") {
    chips.push(`[urgency: ${intent.urgency}]`);
  }

  if (intent.audience !== "general") {
    chips.push(`[audience: ${intent.audience}]`);
  }

  if (intent.format !== "free") {
    chips.push(`[format: ${intent.format}]`);
  }

  if (intent.depth !== "normal") {
    chips.push(`[depth: ${intent.depth}]`);
  }

  if (Array.isArray(intent.constraints)) {
    intent.constraints.forEach(c => {
      chips.push(`[${c}]`);
    });
  }

  return chips;
}
// ======================
// MODEL CONFIGURATION
// ======================
const MODEL_CONFIG = {
  "gemini-1.5-flash": {
    name: "Gemini 1.5 Flash",
    provider: "Google",
    free: true,
    recommended: true,
    description: "Fast, reliable, free default with daily quotas"
  },
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    provider: "OpenAI",
    free: true,
    description: "Excellent prompt quality with limited free usage"
  },
  "llama-3": {
    name: "Llama 3 (70B)",
    provider: "Groq",
    free: true,
    description: "Open-source, community-hosted model"
  }
};

function updateSizeInfo(id, height) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = `${Math.round(height)}px`;
}

// Auto-scroll active preset into view (horizontal)
function scrollPresetIntoView(presetId) {
  const btn = document.querySelector(
    `.preset-option[data-preset="${presetId}"]`
  );
  if (!btn) return;

  btn.scrollIntoView({
    behavior: "smooth",
    inline: "center",
    block: "nearest"
  });
}

// API Configuration
// API Configuration - Cloudflare Worker URL
const CLOUDFLARE_WORKER_URL = "https://promptcraft-api.vijay-shagunkumar.workers.dev";

// Application State
let currentPreset = "default";
let userPresetLocked = false;
let lastPresetSource = "auto";
let lastTaskLabel = "General";
let lastRole = "expert assistant";

let autoConvertEnabled = true;
let autoConvertDelay = 60;
let usageCount = 0;
let lastConvertedText = "";
let isConverted = false;
let autoConvertTimer;
let autoConvertCountdown = 60;
let countdownInterval;
let editingTemplateId = null;
let templates = [];
let historyItems = [];
// ====================== SECURITY FIX ======================
// Immediately clear any saved API key when page loads
document.addEventListener('DOMContentLoaded', function() {
  localStorage.removeItem("OPENAI_API_KEY");
});
// ==========================================================
// Clear/Undo button state
let lastClearedText = "";
let isUndoState = false;

// Textarea sizing state - BOTH SET TO 250px
let textareaSizes = {
  requirement: { height: 250 },
  output: { height: 250 }
};
let isInputExpanded = false;
let isOutputExpanded = false;

// Reset state
let isResetting = false;

// Template categories for Template Library
const TEMPLATE_CATEGORIES = {
  communication: { name: "Communication", icon: "fa-envelope", color: "#3b82f6" },
  coding:        { name: "Coding",        icon: "fa-code",     color: "#10b981" },
  writing:       { name: "Writing",       icon: "fa-pen",      color: "#8b5cf6" },
  analysis:      { name: "Analysis",      icon: "fa-chart-bar",color: "#f59e0b" },
  business:      { name: "Business",      icon: "fa-briefcase",color: "#ef4444" },
  creative:      { name: "Creative",      icon: "fa-palette",  color: "#ec4899" },
  education:     { name: "Education",     icon: "fa-graduation-cap", color: "#06b6d4" },
  other:         { name: "Other",         icon: "fa-th",       color: "#6b7280" }
};

// Default templates
const DEFAULT_TEMPLATES = [
  {
    id: "1",
    name: "Professional Email",
    description: "Write clear, professional emails for business communication",
    category: "communication",
    content: `# Role
You are an expert business communicator skilled in writing professional emails.

# Objective
Write a professional email about [TOPIC] to [RECIPIENT]

# Context
- Recipient: [DESCRIBE RECIPIENT]
- Relationship: [DESCRIBE RELATIONSHIP]
- Purpose: [EMAIL PURPOSE]

# Instructions
1. Use professional but friendly tone
2. Start with appropriate greeting
3. State purpose clearly in first paragraph
4. Provide necessary details
5. Include clear call to action
6. End with professional closing

# Notes
- Keep it concise (150-200 words)
- Use proper email formatting
- Include subject line
- Check for tone appropriateness`,
    example: "Write a professional email to my manager requesting a meeting to discuss project timeline adjustments.",
    usageCount: 5,
    createdAt: Date.now() - 86400000,
    isDefault: true
  }
];

// Preset templates
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

// Helper: classify role + best preset + label
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

// Helper: set preset + sync UI & badge
function setCurrentPreset(presetId) {
  if (!PRESETS[presetId]) return;

  currentPreset = presetId;

  document.querySelectorAll(".preset-option").forEach((o) => {
    o.classList.toggle("active", o.dataset.preset === presetId);
  });

  scrollPresetIntoView(presetId);
}

// REMOVED: updatePresetInfo function - no longer needed (Issue #3)

// Enable / disable all AI launch buttons
function setLaunchButtonsEnabled(enabled) {
  const ids = [
    "chatgptBtn",
    "claudeBtn",
    "geminiBtn",
    "perplexityBtn",
    "deepseekBtn",
    "copilotBtn",
    "grokBtn"
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

/* ================================
   INTENT CHIP RENDERING (Card 1)
================================ */

function renderIntentChips(chips) {
  const intentRow = document.getElementById("intentRow");
  const intentScroll = document.getElementById("intentScroll");
  
  if (!intentRow || !intentScroll) return;

  intentScroll.innerHTML = "";

  if (!chips.length) {
    intentRow.style.display = "none";
    return;
  }

  chips.forEach(label => {
    const chip = document.createElement("span");
    chip.className = "intent-chip";
    chip.textContent = label;
    intentScroll.appendChild(chip);
  });

  intentRow.style.display = "block";
  intentScroll.scrollLeft = intentScroll.scrollWidth;
}

function initializeApp() {
  loadSettings();
  loadTemplates();
  loadUsageCount();
  loadHistory();
  setupEventListeners();
  initializeUI();
  setCurrentPreset(currentPreset);
  
  // Initialize card transitions
  initializeCardTransitions();
  
  const presetInfoEl = document.getElementById("presetInfo");
  if (presetInfoEl) {
    presetInfoEl.style.display = "none"; // Keep hidden permanently (Issue #3)
  }

  const req = document.getElementById("requirement");
  if (req) req.focus();

  setLaunchButtonsEnabled(false);
  initializeTextareaSizing();
}

// ===========================================
// TEXTAREA RESIZING AND EXPAND FUNCTIONS - FIXED (Issue #2)
// ===========================================

// Initialize textarea sizing
function initializeTextareaSizing() {
  // Load saved sizes from localStorage
  const savedSizes = localStorage.getItem('textareaSizes');
  if (savedSizes) {
    textareaSizes = JSON.parse(savedSizes);
    
    const requirementEl = document.getElementById('requirement');
    const outputEl = document.getElementById('output');
    
    if (requirementEl) {
      requirementEl.style.height = `${textareaSizes.requirement.height || 250}px`;
      updateSizeInfo('inputSizeInfo', textareaSizes.requirement.height || 250);
    }
    
    if (outputEl) {
      outputEl.style.height = `${textareaSizes.output.height || 250}px`;
      updateSizeInfo('outputSizeInfo', textareaSizes.output.height || 250);
    }
  } else {
    const requirementEl = document.getElementById('requirement');
    const outputEl = document.getElementById('output');
    
    if (requirementEl) {
      requirementEl.style.height = '250px';
      textareaSizes.requirement.height = 250;
      updateSizeInfo('inputSizeInfo', 250);
    }
    
    if (outputEl) {
      outputEl.style.height = '250px';
      textareaSizes.output.height = 250;
      updateSizeInfo('outputSizeInfo', 250);
    }
  }
  
  setupResizeObservers();
  setupExpandButtons();
}

// Setup resize observers
function setupResizeObservers() {
  const requirementEl = document.getElementById('requirement');
  const outputEl = document.getElementById('output');
  
  if (!requirementEl || !outputEl) return;
  
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const height = entry.contentRect.height;
      const textareaId = entry.target.id;
      
      // Don't save sizes if we're in expanded mode (Issue #2 fix)
      if (textareaId === 'requirement' && !isInputExpanded) {
        textareaSizes.requirement.height = height;
        updateSizeInfo('inputSizeInfo', height);
      } else if (textareaId === 'output' && !isOutputExpanded) {
        textareaSizes.output.height = height;
        updateSizeInfo('outputSizeInfo', height);
      }
      
      // Save sizes with debounce (only if not expanded)
      if ((textareaId === 'requirement' && !isInputExpanded) || 
          (textareaId === 'output' && !isOutputExpanded)) {
        debounce(saveTextareaSizes, 500);
      }
      
      entry.target.classList.add('size-changing');
      setTimeout(() => {
        entry.target.classList.remove('size-changing');
      }, 300);
    }
  });
  
  resizeObserver.observe(requirementEl);
  resizeObserver.observe(outputEl);
  
  requirementEl.addEventListener('mouseup', () => {
    if (!isInputExpanded) debounce(saveTextareaSizes, 300);
  });
  outputEl.addEventListener('mouseup', () => {
    if (!isOutputExpanded) debounce(saveTextareaSizes, 300);
  });
}

// Save sizes to localStorage
function saveTextareaSizes() {
  localStorage.setItem('textareaSizes', JSON.stringify(textareaSizes));
}

// Setup expand/collapse buttons - FIXED (Issue #2)
function setupExpandButtons() {
  const expandInputBtn = document.getElementById('expandInputBtn');
  const expandOutputBtn = document.getElementById('expandOutputBtn');
  const expandOverlay = document.getElementById('expandOverlay');
  
  if (!expandInputBtn || !expandOutputBtn || !expandOverlay) return;
  
  // Input expand/collapse - FIXED
  expandInputBtn.addEventListener('click', () => {
    const textarea = document.getElementById('requirement');
    if (!textarea) return;
    
    if (isInputExpanded) {
      // Collapse - RESTORE to saved height (Issue #2 fix)
      textarea.classList.remove('textarea-expanded');
      expandInputBtn.classList.remove('expanded');
      expandInputBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
      expandInputBtn.title = 'Expand';
      expandOverlay.style.display = 'none';
      isInputExpanded = false;
      
      // Restore saved height
      if (textareaSizes.requirement.height) {
        textarea.style.height = `${textareaSizes.requirement.height}px`;
      } else {
        textarea.style.height = '250px';
      }
    } else {
      // Expand
      // Save current height before expanding
      const currentHeight = textarea.offsetHeight;
      if (currentHeight > 0) {
        textareaSizes.requirement.height = currentHeight;
      }
      
      textarea.classList.add('textarea-expanded');
      expandInputBtn.classList.add('expanded');
      expandInputBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
      expandInputBtn.title = 'Collapse';
      expandOverlay.style.display = 'block';
      isInputExpanded = true;
      
      textarea.focus();
      textarea.scrollTop = textarea.scrollHeight;
    }
  });
  
  // Output expand/collapse - FIXED
  expandOutputBtn.addEventListener('click', () => {
    const textarea = document.getElementById('output');
    if (!textarea) return;
    
    if (isOutputExpanded) {
      // Collapse - RESTORE to saved height (Issue #2 fix)
      textarea.classList.remove('textarea-expanded');
      expandOutputBtn.classList.remove('expanded');
      expandOutputBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
      expandOutputBtn.title = 'Expand';
      expandOverlay.style.display = 'none';
      isOutputExpanded = false;
      
      // Restore saved height
      if (textareaSizes.output.height) {
        textarea.style.height = `${textareaSizes.output.height}px`;
      } else {
        textarea.style.height = '250px';
      }
    } else {
      // Expand
      // Save current height before expanding
      const currentHeight = textarea.offsetHeight;
      if (currentHeight > 0) {
        textareaSizes.output.height = currentHeight;
      }
      
      textarea.classList.add('textarea-expanded');
      expandOutputBtn.classList.add('expanded');
      expandOutputBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
      expandOutputBtn.title = 'Collapse';
      expandOverlay.style.display = 'block';
      isOutputExpanded = true;
    }
  });
  
  // Close expanded mode when clicking overlay
  expandOverlay.addEventListener('click', () => {
    const inputTextarea = document.getElementById('requirement');
    const outputTextarea = document.getElementById('output');
    
    if (isInputExpanded && inputTextarea) {
      inputTextarea.classList.remove('textarea-expanded');
      expandInputBtn.classList.remove('expanded');
      expandInputBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
      expandInputBtn.title = 'Expand';
      isInputExpanded = false;
      
      // Restore saved height
      if (textareaSizes.requirement.height) {
        inputTextarea.style.height = `${textareaSizes.requirement.height}px`;
      } else {
        inputTextarea.style.height = '250px';
      }
    }
    
    if (isOutputExpanded && outputTextarea) {
      outputTextarea.classList.remove('textarea-expanded');
      expandOutputBtn.classList.remove('expanded');
      expandOutputBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
      expandOutputBtn.title = 'Expand';
      isOutputExpanded = false;
      
      // Restore saved height
      if (textareaSizes.output.height) {
        outputTextarea.style.height = `${textareaSizes.output.height}px`;
      } else {
        outputTextarea.style.height = '250px';
      }
    }
    
    expandOverlay.style.display = 'none';
  });
  
  // Close expanded mode with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      expandOverlay.click();
    }
  });
}

// Utility: Debounce function
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

// Reset textarea sizes to default - BOTH 250px
function resetTextareaSizes() {
  const requirementEl = document.getElementById('requirement');
  const outputEl = document.getElementById('output');
  
  if (requirementEl) {
    requirementEl.style.height = '250px';
    textareaSizes.requirement.height = 250;
    updateSizeInfo('inputSizeInfo', 250);
  }
  
  if (outputEl) {
    outputEl.style.height = '250px';
    textareaSizes.output.height = 250;
    updateSizeInfo('outputSizeInfo', 250);
  }
  
  saveTextareaSizes();
  showNotification('Textarea sizes reset to default (250px)');
}

// RESET EVERYTHING FUNCTION - FIXED (Issue #4)
function resetEverything() {
  if (isResetting) return;
  
  // Create and show custom modal instead of browser confirm
  showResetConfirmationModal();
}

// Show custom reset confirmation modal (Issue #4)
function showResetConfirmationModal() {
  // Create modal backdrop
  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop';
  modalBackdrop.id = 'resetConfirmationModal';
  modalBackdrop.style.display = 'flex';
  modalBackdrop.style.zIndex = '2000';
  
  // Create modal content
  modalBackdrop.innerHTML = `
    <div class="modal" style="max-width: 400px;">
      <div class="modal-header">
        <h3><i class="fas fa-exclamation-triangle"></i> Reset Everything</h3>
        <button id="closeResetModalBtn" class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div style="text-align: center; margin: 20px 0;">
          <i class="fas fa-trash-alt" style="font-size: 48px; color: var(--danger); margin-bottom: 16px;"></i>
          <p style="font-size: 16px; margin-bottom: 8px; color: var(--text-primary);">
            Are you sure you want to reset everything?
          </p>
          <p style="font-size: 14px; color: var(--text-secondary);">
            This will clear both input and output areas, reset presets, and clear all temporary data.
          </p>
        </div>
        <div class="modal-actions" style="justify-content: center; gap: 16px;">
          <button id="cancelResetBtn" class="btn-ghost" style="min-width: 100px;">
            <i class="fas fa-times"></i> Cancel
          </button>
          <button id="confirmResetBtn" class="btn-primary" style="min-width: 100px; background: var(--danger); border-color: var(--danger);">
            <i class="fas fa-check"></i> Yes, Reset
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modalBackdrop);
  
  // Add event listeners
  document.getElementById('closeResetModalBtn').addEventListener('click', () => {
    document.body.removeChild(modalBackdrop);
  });
  
  document.getElementById('cancelResetBtn').addEventListener('click', () => {
    document.body.removeChild(modalBackdrop);
  });
  
  document.getElementById('confirmResetBtn').addEventListener('click', () => {
    document.body.removeChild(modalBackdrop);
    performResetEverything();
  });
  
  // Close on backdrop click
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      document.body.removeChild(modalBackdrop);
    }
  });
}

// Perform the actual reset
function performResetEverything() {
  isResetting = true;
  
  // Clear both textareas
  const requirementEl = document.getElementById('requirement');
  const outputEl = document.getElementById('output');
  
  if (requirementEl) {
    requirementEl.value = '';
    requirementEl.focus();
  }
  
  if (outputEl) {
    outputEl.value = '';
  }
  
  // Reset UI state
  isConverted = false;
  isUndoState = false;
  lastClearedText = '';
  lastConvertedText = '';
  userPresetLocked = false;
  lastPresetSource = 'auto';
  lastTaskLabel = 'General';
  lastRole = 'expert assistant';
  
  // Reset preset to default
  currentPreset = 'default';
  setCurrentPreset('default');
  
  // Update UI elements
  document.getElementById('convertedBadge').style.display = 'none';
  document.getElementById('convertBtn').disabled = true;
  
  // Clear clear button state - FIXED (Issue #6)
  const clearBtn = document.getElementById('clearInputBtn');
  if (clearBtn) {
    clearBtn.classList.remove("undo-state");
    clearBtn.querySelector('i').className = "fas fa-broom";
    clearBtn.title = "Clear text";
    isUndoState = false;
  }
  
  // Clear timers
  clearAutoConvertTimer();
  
  // Reset stats
  updateStats('');
  updateOutputStats();
  
  // Disable launch buttons
  setLaunchButtonsEnabled(false);
  
  // Clear intent chips
  renderIntentChips([]);
  
  // Reset auto-convert timer if enabled
  if (autoConvertEnabled && autoConvertDelay > 0) {
    resetAutoConvertTimer();
  }
  
  // Reset textarea sizes to 250px
  resetTextareaSizes();
  
  showNotification('Everything has been reset');
  
  setTimeout(() => {
    isResetting = false;
  }, 500);
}

// Settings
function loadSettings() {
  // ================= SECURITY FIX =================
  // Delete any saved API key from localStorage
  localStorage.removeItem("OPENAI_API_KEY");
  // ================================================
  
  const delay = localStorage.getItem("autoConvertDelay") || "60";
  const voiceLang = localStorage.getItem("voiceLanguage") || "en-US";
  const savedModel = localStorage.getItem("promptcrafter_model") || "gemini-1.5-flash-latest";

  const autoDelayInput = document.getElementById("autoConvertDelay");
  const voiceLanguageSelect = document.getElementById("voiceLanguage");
  const modelSelect = document.getElementById("modelSelect");
  const delayValue = document.getElementById("delayValue");

  if (autoDelayInput) autoDelayInput.value = delay;
  if (voiceLanguageSelect) voiceLanguageSelect.value = voiceLang;
  if (modelSelect) modelSelect.value = savedModel;
  if (delayValue) delayValue.textContent = `Current: ${delay} seconds`;

  autoConvertDelay = parseInt(delay, 10);
  autoConvertCountdown = autoConvertDelay;
}

function saveSettings() {
  const delay = document.getElementById("autoConvertDelay").value || "60";
  const voiceLang = document.getElementById("voiceLanguage").value || "en-US";
  const modelSelect = document.getElementById("modelSelect");

  localStorage.setItem("autoConvertDelay", delay);
  localStorage.setItem("voiceLanguage", voiceLang);
  
  if (modelSelect && modelSelect.value) {
    localStorage.setItem("promptcrafter_model", modelSelect.value);
  }

  autoConvertDelay = parseInt(delay, 10);
  autoConvertCountdown = autoConvertDelay;

  if (window.voiceFeatures && window.voiceFeatures.updateVoiceLanguage) {
    window.voiceFeatures.updateVoiceLanguage(voiceLang);
  }

  showNotification("Settings saved");
  const modal = document.getElementById("settingsModal");
  if (modal) modal.style.display = "none";
}

function clearAllData() {
  localStorage.clear();
  
  textareaSizes = {
    requirement: { height: 250 },
    output: { height: 250 }
  };
  
  showNotification("All data cleared. Reloading...");
  setTimeout(() => {
    window.location.reload();
  }, 800);
}

// Templates
function loadTemplates() {
  const savedTemplates = localStorage.getItem("promptTemplates");
  if (savedTemplates) {
    templates = JSON.parse(savedTemplates);
  } else {
    templates = DEFAULT_TEMPLATES;
    localStorage.setItem("promptTemplates", JSON.stringify(templates));
  }
}

function loadCategories() {
  const container = document.getElementById("templateCategories");
  if (!container) return;
  container.innerHTML = "";

  const allCat = document.createElement("div");
  allCat.className = "template-category active";
  allCat.dataset.category = "all";
  allCat.innerHTML = '<i class="fas fa-th"></i> All';
  allCat.addEventListener("click", () => filterTemplatesUI("all"));
  container.appendChild(allCat);

  Object.entries(TEMPLATE_CATEGORIES).forEach(([key, value]) => {
    const div = document.createElement("div");
    div.className = "template-category";
    div.dataset.category = key;
    div.innerHTML = `<i class="fas ${value.icon}"></i> ${value.name}`;
    div.addEventListener("click", () => filterTemplatesUI(key));
    container.appendChild(div);
  });
}

function loadTemplatesToUI(category = "all", searchQuery = "") {
  const grid = document.getElementById("templatesGrid");
  const empty = document.getElementById("emptyTemplates");
  if (!grid || !empty) return;

  grid.innerHTML = "";

  let filtered = templates.slice();

  if (category !== "all") {
    filtered = filtered.filter((t) => t.category === category);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }

  if (!filtered.length) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  filtered.forEach((template) => {
    const card = document.createElement("div");
    card.className = "template-card";

    const categoryMeta = TEMPLATE_CATEGORIES[template.category] || {
      name: "Other",
      color: "#6b7280"
    };

    card.innerHTML = `
      <div class="template-card-header">
        <div class="template-card-title">${template.name}</div>
        <span class="template-card-meta" style="color:${categoryMeta.color}">
          <i class="fas ${categoryMeta.icon}"></i> ${categoryMeta.name}
        </span>
      </div>
      <div class="template-card-meta">
        Used ${template.usageCount || 0} times
      </div>
      <div class="template-card-description">
        ${(template.description || "").substring(0, 120)}${
          (template.description || "").length > 120 ? "..." : ""
        }
      </div>
      <div class="template-actions">
        <button class="btn-ghost-small" style="border-color:${categoryMeta.color};color:${categoryMeta.color}" onclick="useTemplate('${template.id}')">
          <i class="fas fa-play"></i> Use
        </button>
        <button class="btn-ghost-small" onclick="editTemplate('${template.id}')">
          <i class="fas fa-edit"></i>
        </button>
        ${
          !template.isDefault
            ? `<button class="btn-ghost-small danger" onclick="deleteTemplate('${template.id}')">
                 <i class="fas fa-trash"></i>
               </button>`
            : ""
        }
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterTemplatesUI(category, searchQuery = "") {
  document.querySelectorAll(".template-category").forEach((cat) => {
    cat.classList.remove("active");
  });
  const active = document.querySelector(
    `.template-category[data-category="${category}"]`
  );
  if (active) active.classList.add("active");

  const currentSearch =
    searchQuery || document.getElementById("templateSearch").value;
  loadTemplatesToUI(category, currentSearch);
}

function saveTemplate() {
  const name = document.getElementById("templateName").value.trim();
  const description = document
    .getElementById("templateDescription")
    .value.trim();
  const content = document.getElementById("templateContent").value.trim();
  const category = document.getElementById("templateCategory").value;
  const example = document.getElementById("templateExample").value.trim();

  if (!name || !content) {
    showNotification("Name and content are required");
    return;
  }

  if (editingTemplateId) {
    const index = templates.findIndex((t) => t.id === editingTemplateId);
    if (index !== -1) {
      templates[index] = {
        ...templates[index],
        name,
        description,
        content,
        category,
        example
      };
    }
  } else {
    const newTemplate = {
      id: Date.now().toString(),
      name,
      description,
      content,
      category,
      example,
      usageCount: 0,
      createdAt: Date.now(),
      isDefault: false
    };
    templates.push(newTemplate);
  }

  localStorage.setItem("promptTemplates", JSON.stringify(templates));
  loadTemplatesToUI();
  const modal = document.getElementById("templateModal");
  if (modal) modal.style.display = "none";
  showNotification(`Template "${name}" saved`);
}

function editTemplate(id) {
  const template = templates.find((t) => t.id === id);
  if (!template) return;

  editingTemplateId = id;
  document.getElementById("templateName").value = template.name;
  document.getElementById("templateDescription").value =
    template.description || "";
  document.getElementById("templateContent").value = template.content || "";
  document.getElementById("templateCategory").value =
    template.category || "other";
  document.getElementById("templateExample").value = template.example || "";

  const modal = document.getElementById("templateModal");
  if (modal) modal.style.display = "flex";
}

function deleteTemplate(id) {
  const template = templates.find((t) => t.id === id);
  if (!template) return;

  if (!confirm(`Delete template "${template.name}"?`)) return;

  templates = templates.filter((t) => t.id !== id);
  localStorage.setItem("promptTemplates", JSON.stringify(templates));
  loadTemplatesToUI();
  showNotification("Template deleted");
}

// History
function loadHistory() {
  const saved = localStorage.getItem("promptHistory");
  if (saved) {
    historyItems = JSON.parse(saved);
  } else {
    historyItems = [];
  }
  renderHistory();
}

function saveToHistory(requirement, prompt) {
  const item = {
    id: Date.now(),
    requirement,
    prompt,
    createdAt: new Date().toISOString()
  };
  historyItems.unshift(item);
  historyItems = historyItems.slice(0, 20);
  localStorage.setItem("promptHistory", JSON.stringify(historyItems));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;
  list.innerHTML = "";

  if (!historyItems.length) {
    list.innerHTML = `<div class="history-item-meta">No history yet.</div>`;
    return;
  }

  historyItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div class="history-item-title">${(item.requirement || "").slice(
        0,
        80
      )}${item.requirement.length > 80 ? "..." : ""}</div>
      <div class="history-item-meta">${new Date(
        item.createdAt
      ).toLocaleString()}</div>
    `;
    div.addEventListener("click", () => {
      document.getElementById("requirement").value = item.requirement;
      document.getElementById("output").value = item.prompt;
      updateStats(item.prompt);
      updateOutputStats();
      isConverted = true;
      lastConvertedText = item.requirement;
      document.getElementById("convertedBadge").style.display = "inline-flex";
      setLaunchButtonsEnabled(true);
      showNotification("Loaded from history");
      
      const { role, preset: autoPreset, label } = getRoleAndPreset(item.requirement);
      lastRole = role;
      lastTaskLabel = label;
      
      if (!userPresetLocked && autoPreset && PRESETS[autoPreset]) {
        lastPresetSource = "auto";
        setCurrentPreset(autoPreset);
      }
    });
    list.appendChild(div);
  });
}

function clearHistory() {
  if (!confirm("Clear all history?")) return;
  historyItems = [];
  localStorage.removeItem("promptHistory");
  renderHistory();
  showNotification("History cleared");
}

// UI Init
function initializeUI() {
  const templatesPanel = document.getElementById("templatesPanel");
  if (templatesPanel) templatesPanel.style.display = "none";
  const historyPanel = document.getElementById("historyPanel");
  if (historyPanel) historyPanel.style.display = "none";
  
  const presetInfoEl = document.getElementById("presetInfo");
  if (presetInfoEl) {
    presetInfoEl.style.display = "none"; // Keep hidden (Issue #3)
  }
}

// Event Listeners
function setupEventListeners() {
  /* ===============================
     RESET BUTTON - UPDATED (Issue #4)
  =============================== */
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetEverything);
  }

  /* ===============================
     SETTINGS MODAL
  =============================== */
  const settingsBtn = document.getElementById("settingsBtn");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const settingsModal = document.getElementById("settingsModal");

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener("click", () => {
      settingsModal.style.display = "flex";
    });
  }

  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener("click", () => {
      settingsModal.style.display = "none";
    });
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", saveSettings);
  }

  const clearDataBtn = document.getElementById("clearDataBtn");
  if (clearDataBtn) {
    clearDataBtn.addEventListener("click", () => {
      if (
        confirm(
          "Are you sure you want to clear all data? This will delete all templates, history, and settings."
        )
      ) {
        clearAllData();
      }
    });
  }

  document.getElementById("resetSizesBtn")
    ?.addEventListener("click", resetTextareaSizes);

  /* ===============================
     AUTO-CONVERT SETTINGS
  =============================== */
  const delaySlider = document.getElementById("autoConvertDelay");
  const delayValue = document.getElementById("delayValue");

  if (delaySlider && delayValue) {
    delaySlider.addEventListener("input", () => {
      delayValue.textContent = `Current: ${delaySlider.value} seconds`;
      autoConvertDelay = parseInt(delaySlider.value, 10);
    });
  }

  document.getElementById("autoConvert")?.addEventListener("change", (e) => {
    autoConvertEnabled = e.target.checked;
    if (!autoConvertEnabled) {
      clearAutoConvertTimer();
    }
  });

  /* ===============================
     REQUIREMENT INPUT
  =============================== */
  const requirementEl = document.getElementById("requirement");
  if (requirementEl) {
    requirementEl.addEventListener("input", handleRequirementInput);
  }

  /* ===============================
     PRESET SELECTION
  =============================== */
  document.querySelectorAll(".preset-option").forEach((option) => {
    option.addEventListener("click", () => {
      const presetId = option.dataset.preset;

      userPresetLocked = true;
      lastPresetSource = "manual";
      setCurrentPreset(presetId);

      if (isConverted) {
        const requirement = document.getElementById("requirement")?.value.trim();
        if (!requirement) return;

        const role = lastRole || "expert assistant";
        const reformatted = PRESETS[currentPreset](role, requirement);

        const outputEl = document.getElementById("output");
        if (outputEl) outputEl.value = reformatted;

        updateOutputStats();
        setLaunchButtonsEnabled(true);
      }
    });
  });

  /* ===============================
     EXAMPLE BUTTONS
  =============================== */
  document.querySelectorAll(".example-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!requirementEl) return;

      requirementEl.value = btn.dataset.example;
      requirementEl.focus();

      isConverted = false;
      const outputEl = document.getElementById("output");
      if (outputEl) outputEl.value = "";

      const badge = document.getElementById("convertedBadge");
      if (badge) badge.style.display = "none";

      setLaunchButtonsEnabled(false);
      updateStats(requirementEl.value);
      
      // Trigger AI tool ranking for examples
      const requirement = requirementEl.value.trim();
      if (requirement) {
        const intent = detectIntentFromText(requirement);
        
        // Update AI tool ranking
        if (window.AIToolRanker && intent) {
          window.AIToolRanker.rankAndReorder(intent);
        }
        
        // Also trigger auto-convert if enabled
        if (autoConvertEnabled && autoConvertDelay > 0) {
          resetAutoConvertTimer();
        }
      }

      if (requirementEl.value.trim()) {
        generatePrompt();
      }
    });
  });

  /* ===============================
     CONVERT BUTTON
  =============================== */
  document
    .getElementById("convertBtn")
    ?.addEventListener("click", generatePrompt);

  /* ===============================
     CLEAR INPUT BUTTON - FIXED (Issues #2, #3, #6)
  =============================== */
  const clearBtn = document.getElementById("clearInputBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", function() {
      const requirementEl = document.getElementById("requirement");
      const outputEl = document.getElementById("output");
      if (!requirementEl) return;
      
      if (isUndoState) {
        // UNDO - Restore text AND trigger ranking
        requirementEl.value = lastClearedText;
        lastClearedText = "";
        isUndoState = false;
        
        // Update button to CLEAR state
        this.classList.remove("undo-state");
        this.querySelector('i').className = "fas fa-broom";
        this.title = "Clear text";
        
        // Trigger ranking if there's content
        if (requirementEl.value.trim()) {
          handleRequirementInput();
        }
        
        showNotification("Text restored");
      } else {
        // CLEAR - Save and clear everything
        const currentText = requirementEl.value;
        if (!currentText.trim()) {
          showNotification("Nothing to clear");
          return;
        }
        
        lastClearedText = currentText;
        requirementEl.value = "";
        requirementEl.focus();
        isUndoState = true;
        
        // Update button to UNDO state IMMEDIATELY
        this.classList.add("undo-state");
        this.querySelector('i').className = "fas fa-undo";
        this.title = "Undo clear";
        
        // Trigger reset of Card2 & Card3
        handleRequirementInput();
        
        showNotification("Text cleared. Click again to restore.");
      }
    });
  }

  /* ===============================
     COPY OUTPUT BUTTON
  =============================== */
  const copyBtn = document.getElementById("copyOutputBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", copyOutputToClipboard);
  }

  /* ===============================
     AI TOOL LAUNCH BUTTONS
  =============================== */
  document.getElementById("chatgptBtn")
    ?.addEventListener("click", () => openAITool("ChatGPT", "https://chat.openai.com/"));

  document.getElementById("claudeBtn")
    ?.addEventListener("click", () => openAITool("Claude", "https://claude.ai/new"));

  document.getElementById("geminiBtn")?.addEventListener("click", () => {
    const outputEl = document.getElementById("output");
    const prompt = outputEl.value.trim();
    const selectedModel = localStorage.getItem("promptcrafter_model") || "gemini-1.5-flash";
    
    if (!prompt) {
      showNotification("No prompt to copy");
      return;
    }
    
    // Only open Gemini if it's the selected model
    if (selectedModel === "gemini-1.5-flash") {
      navigator.clipboard.writeText(prompt)
        .then(() => {
          showNotification("Prompt copied! Opening Gemini...");
          setTimeout(() => {
            window.open("https://gemini.google.com/app", "_blank");
          }, 500);
        })
        .catch(err => {
          console.error("Failed to copy:", err);
          showNotification("Failed to copy prompt");
        });
    } else {
      const modelName = MODEL_CONFIG[selectedModel]?.name || selectedModel;
      showNotification(`Please select Gemini as your AI model (currently using: ${modelName})`);
    }
  });

  document.getElementById("perplexityBtn")
    ?.addEventListener("click", () => openAITool("Perplexity", "https://www.perplexity.ai/"));

  document.getElementById("deepseekBtn")
    ?.addEventListener("click", () => openAITool("DeepSeek", "https://chat.deepseek.com/"));

  document.getElementById("copilotBtn")
    ?.addEventListener("click", () => openAITool("Copilot", "https://copilot.microsoft.com/"));

  document.getElementById("grokBtn")
    ?.addEventListener("click", () => openAITool("Grok", "https://x.ai/"));

  /* ===============================
     EXPORT
  =============================== */
  document.getElementById("exportBtn")
    ?.addEventListener("click", exportPrompt);

  /* ===============================
     TEMPLATE TOGGLE
  =============================== */
  const toggleTemplatesBtn = document.getElementById("toggleTemplatesBtn");
  const templatesPanel = document.getElementById("templatesPanel");
  
  if (toggleTemplatesBtn && templatesPanel) {
    toggleTemplatesBtn.addEventListener("click", function() {
      const isHidden = templatesPanel.style.display === "none" || templatesPanel.style.display === "";
      
      templatesPanel.style.display = isHidden ? "block" : "none";
      
      const icon = this.querySelector(".fa-chevron-down");
      if (icon) {
        icon.className = isHidden ? "fas fa-chevron-up" : "fas fa-chevron-down";
      }
      
      const eyeIcon = this.querySelector(".template-toggle-eye i");
      if (eyeIcon) {
        eyeIcon.className = isHidden ? "fas fa-eye-slash" : "fas fa-eye";
      }
      
      if (isHidden) {
        loadCategories();
        loadTemplatesToUI();
      }
    });
  }

  /* ===============================
     HISTORY TOGGLE
  =============================== */
  const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
  const historyPanel = document.getElementById("historyPanel");
  
  if (toggleHistoryBtn && historyPanel) {
    toggleHistoryBtn.addEventListener("click", function() {
      const isHidden = historyPanel.style.display === "none" || historyPanel.style.display === "";
      
      historyPanel.style.display = isHidden ? "block" : "none";
      
      if (isHidden) {
        this.innerHTML = '<i class="fas fa-times"></i> Close History';
      } else {
        this.innerHTML = '<i class="fas fa-history"></i> History';
      }
    });
  }

  /* ===============================
     TEMPLATE MODAL
  =============================== */
  const templateModal = document.getElementById("templateModal");
  const closeTemplateBtn = document.getElementById("closeTemplateBtn");
  const saveTemplateBtn = document.getElementById("saveTemplateBtn");
  const templateSearch = document.getElementById("templateSearch");

  document.getElementById("addTemplateBtn")?.addEventListener("click", () => {
    editingTemplateId = null;
    document.getElementById("templateName").value = "";
    document.getElementById("templateDescription").value = "";
    document.getElementById("templateContent").value = "";
    document.getElementById("templateCategory").value = "other";
    document.getElementById("templateExample").value = "";
    
    if (templateModal) {
      templateModal.style.display = "flex";
    }
  });

  if (closeTemplateBtn && templateModal) {
    closeTemplateBtn.addEventListener("click", () => {
      templateModal.style.display = "none";
    });
  }

  if (saveTemplateBtn) {
    saveTemplateBtn.addEventListener("click", saveTemplate);
  }

  if (templateSearch) {
    templateSearch.addEventListener("input", (e) => {
      const currentCategory = document.querySelector(".template-category.active")?.dataset.category || "all";
      filterTemplatesUI(currentCategory, e.target.value);
    });
  }

  /* ===============================
     HISTORY
  =============================== */
  document.getElementById("clearHistoryBtn")?.addEventListener("click", clearHistory);

  /* ===============================
     CLOSE MODALS ON OUTSIDE CLICK
  =============================== */
  window.addEventListener("click", (e) => {
    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal && e.target === settingsModal) {
      settingsModal.style.display = "none";
    }
    
    const templateModal = document.getElementById("templateModal");
    if (templateModal && e.target === templateModal) {
      templateModal.style.display = "none";
    }
  });

  /* ===============================
     KEYBOARD SHORTCUTS
  =============================== */
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!document.getElementById("convertBtn").disabled) {
        generatePrompt();
      }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      const templateModal = document.getElementById("templateModal");
      if (templateModal && templateModal.style.display === "flex") {
        e.preventDefault();
        saveTemplate();
      }
    }
    
    if (e.key === 'Escape') {
      const expandOverlay = document.getElementById('expandOverlay');
      if (expandOverlay) expandOverlay.click();
    }
  });
}

/* ===============================
   MAIN CONVERSION FUNCTION
=============================== */
function convertToPrompt() {
  const requirementEl = document.getElementById("requirement");
  const outputEl = document.getElementById("output");
  
  if (!requirementEl || !outputEl) return;
  
  const requirement = requirementEl.value.trim();
  if (!requirement) {
    showNotification("Please enter a requirement first");
    return;
  }
  
  const { role, preset: autoPreset, label } = getRoleAndPreset(requirement);
  lastRole = role;
  lastTaskLabel = label;
  
  if (!userPresetLocked && autoPreset && PRESETS[autoPreset]) {
    lastPresetSource = "auto";
    setCurrentPreset(autoPreset);
  }
  
  const prompt = PRESETS[currentPreset](lastRole, requirement);
  
  outputEl.value = prompt;
  isConverted = true;
  lastConvertedText = requirement;
  
  document.getElementById("convertedBadge").style.display = "inline-flex";
  setLaunchButtonsEnabled(true);
  
  updateStats(prompt);
  updateOutputStats();
  
  saveToHistory(requirement, prompt);
  
  usageCount++;
  localStorage.setItem("usageCount", usageCount.toString());
  
  showNotification("Prompt generated successfully");
}

/* ===============================
   HANDLE REQUIREMENT INPUT
=============================== */
function handleRequirementInput() {
  const requirement = document.getElementById("requirement").value.trim();
  const convertBtn = document.getElementById("convertBtn");
  const clearBtn = document.getElementById("clearInputBtn");
  
  if (!requirement) {
    convertBtn.disabled = true;
    
    // Reset Card2 & Card3 when prompt is empty
    const outputEl = document.getElementById("output");
    if (outputEl) outputEl.value = "";
    
    // Reset AI tool ranking to default
    if (window.AIToolRanker && window.AIToolRanker.resetToDefault) {
      window.AIToolRanker.resetToDefault();
    }
    
    // Hide the converted badge
    document.getElementById("convertedBadge").style.display = "none";
    
    // Disable launch buttons
    setLaunchButtonsEnabled(false);
    
    // Reset stats
    updateStats('');
    updateOutputStats();
    
    // Reset other states
    isConverted = false;
    lastConvertedText = "";
    
    renderIntentChips([]);
    
    return;
  }
  
  convertBtn.disabled = false;
  
  const intent = detectIntentFromText(requirement);
  const chips = intentObjectToChips(intent);
  renderIntentChips(chips);
  
  if (autoConvertEnabled && autoConvertDelay > 0) {
    resetAutoConvertTimer();
  }
  
  updateStats(requirement);
  
  // AI TOOL RANKING
  if (window.AIToolRanker && intent) {
    window.AIToolRanker.rankAndReorder(intent);
  }
}

/* ===============================
   COPY OUTPUT TO CLIPBOARD
=============================== */
function copyOutputToClipboard() {
  const outputEl = document.getElementById("output");
  if (!outputEl || !outputEl.value.trim()) {
    showNotification("No output to copy");
    return;
  }
  
  navigator.clipboard.writeText(outputEl.value)
    .then(() => {
      const copyBtn = document.getElementById("copyOutputBtn");
      if (copyBtn) {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
        copyBtn.style.backgroundColor = "#10b981";
        
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.style.backgroundColor = "";
        }, 2000);
      }
      showNotification("Copied to clipboard");
    })
    .catch((err) => {
      console.error("Copy failed:", err);
      showNotification("Failed to copy");
    });
}

/* ===============================
   AUTO-CONVERT TIMER FUNCTIONS
=============================== */
function resetAutoConvertTimer() {
  clearAutoConvertTimer();
  autoConvertCountdown = autoConvertDelay;
  
  const countdownEl = document.getElementById("autoConvertCountdown");
  if (countdownEl) {
    countdownEl.textContent = `Auto-convert in ${autoConvertCountdown}s`;
    countdownEl.style.display = "inline";
  }
  
  autoConvertTimer = setTimeout(() => {
    const requirement = document.getElementById("requirement").value.trim();
    if (requirement && !isConverted) {
      generatePrompt();
    }
    clearAutoConvertTimer();
  }, autoConvertDelay * 1000);
  
  countdownInterval = setInterval(() => {
    autoConvertCountdown--;
    
    const countdownEl = document.getElementById("autoConvertCountdown");
    if (countdownEl) {
      countdownEl.textContent = `Auto-convert in ${autoConvertCountdown}s`;
      
      if (autoConvertCountdown <= 0) {
        countdownEl.style.display = "none";
      }
    }
  }, 1000);
}

function clearAutoConvertTimer() {
  if (autoConvertTimer) {
    clearTimeout(autoConvertTimer);
    autoConvertTimer = null;
  }
  
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  
  const countdownEl = document.getElementById("autoConvertCountdown");
  if (countdownEl) {
    countdownEl.style.display = "none";
  }
}

/* ===============================
   STATS FUNCTIONS
=============================== */
function updateStats(text) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split("\n").length : 0;
  
  // Update with labels
  document.getElementById("charCount").textContent = `Chars: ${chars}`;
  document.getElementById("wordCount").textContent = `Words: ${words}`;
  document.getElementById("lineCount").textContent = `Lines: ${lines}`;
}

function updateOutputStats() {
  const outputEl = document.getElementById("output");
  if (!outputEl) return;
  
  const text = outputEl.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split("\n").length : 0;
  
  // Update with labels
  document.getElementById("outputCharCount").textContent = `Chars: ${chars}`;
  document.getElementById("outputWordCount").textContent = `Words: ${words}`;
  document.getElementById("outputLineCount").textContent = `Lines: ${lines}`;
}

function loadUsageCount() {
  const saved = localStorage.getItem("usageCount");
  usageCount = saved ? parseInt(saved, 10) : 0;
  
  const usageEl = document.getElementById("usageCount");
  if (usageEl) {
    usageEl.textContent = usageCount;
  }
}

/* ===============================
   INTENT DETECTION
=============================== */
function detectIntentFromText(text) {
  const lower = text.toLowerCase();
  const intent = {
    persona: "neutral",
    tone: "neutral",
    formality: "neutral",
    emotion: "neutral",
    urgency: "normal",
    audience: "general",
    format: "free",
    depth: "normal",
    constraints: [],
    taskType: "general"
  };
  
  if (/code|program|script|python|javascript|java|c#|sql|api|function|debug|algorithm/i.test(lower)) {
    intent.taskType = "code";
    intent.constraints.push("code");
  } else if (/email|mail|send.*to|message.*to|follow[- ]up/i.test(lower)) {
    intent.taskType = "email";
    intent.constraints.push("email");
  } else if (/research|analyze|analysis|report|data|statistics|metrics/i.test(lower)) {
    intent.taskType = "research";
    intent.constraints.push("research");
  } else if (/business|strategy|plan|proposal|pitch|market|growth/i.test(lower)) {
    intent.taskType = "business";
    intent.constraints.push("business");
  } else if (/creative|story|poem|fiction|imaginative|artistic/i.test(lower)) {
    intent.taskType = "creative";
    intent.constraints.push("creative");
  } else if (/explain|teach|tutorial|guide|lesson|education|learn/i.test(lower)) {
    intent.taskType = "education";
    intent.constraints.push("education");
  } else if (/write|article|blog|content|copy|post|caption/i.test(lower)) {
    intent.taskType = "writing";
    intent.constraints.push("writing");
  }
  
  if (/as a |i am a |i'm a /i.test(lower)) {
    intent.persona = "specific";
  } else if (/like a |similar to a |channeling /i.test(lower)) {
    intent.persona = "styled";
  }
  
  if (/friendly|warm|cordial|nice|kind/i.test(lower)) {
    intent.tone = "friendly";
  } else if (/professional|formal|business|official/i.test(lower)) {
    intent.tone = "professional";
  } else if (/casual|informal|relaxed|laid-back/i.test(lower)) {
    intent.tone = "casual";
  } else if (/humorous|funny|witty|sarcastic/i.test(lower)) {
    intent.tone = "humorous";
  } else if (/persuasive|convincing|compelling/i.test(lower)) {
    intent.tone = "persuasive";
  } else if (/authoritative|confident|assertive/i.test(lower)) {
    intent.tone = "authoritative";
  }
  
  if (/very formal|highly formal|extremely formal/i.test(lower)) {
    intent.formality = "very formal";
  } else if (/formal|professional|business/i.test(lower)) {
    intent.formality = "formal";
  } else if (/neutral|balanced|moderate/i.test(lower)) {
    intent.formality = "neutral";
  } else if (/informal|casual|relaxed/i.test(lower)) {
    intent.formality = "informal";
  } else if (/very informal|highly casual|slang/i.test(lower)) {
    intent.formality = "very informal";
  }
  
  if (/excited|enthusiastic|energetic/i.test(lower)) {
    intent.emotion = "excited";
  } else if (/urgent|important|critical|asap/i.test(lower)) {
    intent.emotion = "urgent";
  } else if (/calm|peaceful|serene|relaxed/i.test(lower)) {
    intent.emotion = "calm";
  } else if (/serious|grave|solemn/i.test(lower)) {
    intent.emotion = "serious";
  }
  
  if (/urgent|asap|immediately|right away|emergency/i.test(lower)) {
    intent.urgency = "high";
  } else if (/soon|shortly|in a bit/i.test(lower)) {
    intent.urgency = "medium";
  } else if (/no rush|whenever|at your convenience/i.test(lower)) {
    intent.urgency = "low";
  }
  
  if (/beginners|newbies|novices|students/i.test(lower)) {
    intent.audience = "beginners";
  } else if (/experts|professionals|advanced/i.test(lower)) {
    intent.audience = "experts";
  } else if (/technical|developers|engineers/i.test(lower)) {
    intent.audience = "technical";
  } else if (/non-technical|general public|everyone/i.test(lower)) {
    intent.audience = "non-technical";
  }
  
  if (/bullet points|bulleted list|list format/i.test(lower)) {
    intent.format = "bullet points";
  } else if (/numbered list|step by step|instructions/i.test(lower)) {
    intent.format = "numbered list";
  } else if (/table|tabular|rows and columns/i.test(lower)) {
    intent.format = "table";
  } else if (/json|xml|yaml|code format/i.test(lower)) {
    intent.format = "structured";
  } else if (/paragraph|prose|essay format/i.test(lower)) {
    intent.format = "paragraph";
  }
  
  if (/detailed|comprehensive|in-depth|thorough/i.test(lower)) {
    intent.depth = "detailed";
  } else if (/brief|concise|short|summary/i.test(lower)) {
    intent.depth = "brief";
  } else if (/high-level|overview|summary/i.test(lower)) {
    intent.depth = "high-level";
  }
  
  return intent;
}

/* ===============================
   MISSING FUNCTIONS FROM ORIGINAL FILE
=============================== */

// Clean up output
function sanitizePrompt(text) {
  if (!text) return "";
  let cleaned = text;

  cleaned = cleaned.replace(/^```[^\n]*\n?/g, "");
  cleaned = cleaned.replace(/```$/g, "");

  const forbiddenLineRegex =
    /(prompt generator|generate a prompt|convert .*requirement .*prompt|rewrite .*prompt|rewrite .*requirement)/i;

  cleaned = cleaned
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (/^```/.test(trimmed)) return false;
      if (forbiddenLineRegex.test(trimmed)) return false;
      return true;
    })
    .join("\n");

  cleaned = cleaned.replace(/prompt generator/gi, "assistant");
  cleaned = cleaned.replace(
    /generate a prompt/gi,
    "perform the task and return the final answer"
  );

  return cleaned.trim();
}

// Local formatter fallback
function localFormatter(raw) {
  const requirement = raw;
  const { role } = getRoleAndPreset(requirement);
  return PRESETS[currentPreset](role, requirement);
}

// API-based prompt generation
async function generatePrompt() {
  const requirementEl = document.getElementById("requirement");
  const outputEl = document.getElementById("output");
  const convertBtn = document.getElementById("convertBtn");
  const raw = requirementEl.value.trim();

  if (!raw) {
    showNotification("Please enter a requirement first");
    return "";
  }

  // FIX: Safe check for convertBtn
  if (convertBtn) {
    convertBtn.disabled = true;
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
  }

  const { role, preset: autoPreset, label } = getRoleAndPreset(raw);
  lastRole = role;
  lastTaskLabel = label;

  if (!userPresetLocked && autoPreset && PRESETS[autoPreset]) {
    lastPresetSource = "auto";
    setCurrentPreset(autoPreset);
  }

  usageCount++;
  localStorage.setItem("usageCount", usageCount.toString());
  
  const usageElement = document.getElementById("usageCount");
  if (usageElement) {
    usageElement.innerHTML = `<i class="fas fa-bolt"></i>${usageCount} prompts generated`;
  }

  let generatedPrompt;

  try {
    // Get selected model from localStorage
    const selectedModel = localStorage.getItem("promptcrafter_model") || "gemini-1.5-flash";
    
    // Map of model names for display
    const modelDisplayNames = {
      "gpt-4o-mini": "GPT-4o Mini",
      "gemini-1.5-flash": "Gemini 1.5 Flash",
      "llama-3": "Llama 3 (Groq)"
    };
    
    const modelName = modelDisplayNames[selectedModel] || selectedModel;
    
    console.log(`Generating with model: ${selectedModel} (${modelName})`);

    // Call Cloudflare Worker WITH MODEL PARAMETER
    const WORKER_URL = "https://promptcraft-api.vijay-shagunkumar.workers.dev";
    
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": "promptcraft-app-secret-123"
      },
      body: JSON.stringify({ 
        prompt: raw,
        model: selectedModel  // Send selected model
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error || `API error: ${response.status}`;
      console.error("Worker error:", errorMsg);
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    generatedPrompt = data.result;

    generatedPrompt = sanitizePrompt(generatedPrompt);

    outputEl.value = generatedPrompt;
    updateStats(raw);
    updateOutputStats();
    saveToHistory(raw, generatedPrompt);

    isConverted = true;
    lastConvertedText = raw;
    document.getElementById("convertedBadge").style.display = "inline-flex";
    setLaunchButtonsEnabled(true);

    // Show model used in notification
    showNotification(`✓ Prompt generated with ${modelName}`);

    if (autoConvertEnabled && raw) {
      autoConvertCountdown = autoConvertDelay;
      resetAutoConvertTimer();
    }
  } catch (error) {
    console.error("Generation error:", error);
    
    // Fallback to local formatter
    generatedPrompt = localFormatter(raw);
    outputEl.value = generatedPrompt;
    updateStats(generatedPrompt);
    updateOutputStats();
    
    // Show specific error notifications
    if (error.message.includes('timeout')) {
      showNotification("Request timeout. Using offline generation");
    } else if (error.message.includes('API key') || error.message.includes('configuration')) {
      showNotification("Model configuration issue. Using offline generation");
    } else if (error.message.includes('rate limited')) {
      showNotification("Rate limited. Using offline generation");
    } else if (error.message.includes('not supported')) {
      showNotification("Selected model not supported. Using offline generation");
    } else {
      showNotification("Using offline generation");
    }
  } finally {
    // FIX: Safe check for convertBtn
    if (convertBtn) {
      convertBtn.disabled = false;
      convertBtn.innerHTML = '<i class="fas fa-magic"></i> Convert to Prompt';
    }
  }

  return generatedPrompt;
}

// Export prompt to file
function exportPrompt() {
  const outputEl = document.getElementById("output");
  const prompt = outputEl.value;

  if (!prompt.trim()) {
    showNotification("No prompt to export");
    return;
  }

  const blob = new Blob([prompt], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification("Prompt exported");
}

// Open AI tool with prompt copied to clipboard
function openAITool(name, url) {
  const outputEl = document.getElementById("output");
  const prompt = outputEl.value.trim();
  
  if (!prompt) {
    showNotification("No prompt to copy");
    return;
  }
  
  navigator.clipboard.writeText(prompt)
    .then(() => {
      showNotification(`Prompt copied! Opening ${name}...`);
      setTimeout(() => {
        window.open(url, '_blank');
      }, 500);
    })
    .catch(err => {
      console.error('Failed to copy:', err);
      showNotification("Failed to copy prompt");
    });
}

// Show notification toast
function showNotification(message) {
  console.log("showNotification called:", message);
  
  // Get or create notification
  let notification = document.getElementById("notification");
  if (!notification) {
    notification = document.createElement("div");
    notification.id = "notification";
    document.body.appendChild(notification);
  }
  
  // CENTERED AT TOP - EASY TO SEE
  notification.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) translateY(-20px) !important;
    color: var(--text-primary) !important;
    background: var(--card-bg) !important;
    padding: 10px 20px !important;
    border-radius: 8px !important;
    z-index: 10000 !important;
    font-family: 'Inter', sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    opacity: 0 !important;
    transition: opacity 0.3s ease, transform 0.3s ease !important;
    pointer-events: none !important;
    margin: 0 !important;
    border: 1px solid var(--border-color) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    max-width: 80% !important;
    word-wrap: break-word !important;
    line-height: 1.4 !important;
    text-align: center !important;
    white-space: nowrap !important;
  `;
  
  // Just the message text
  notification.textContent = message;
  notification.style.display = "block";
  
  // Show - slide down from top
  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateX(-50%) translateY(0)";
  }, 10);
  
  // Hide after 1.5 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(-50%) translateY(-20px)";
    
    setTimeout(() => {
      notification.style.display = "none";
    }, 100);
  }, 1000);
}

// ==========================================
// CARD TRANSITIONS CODE
// ==========================================

// Fix for Card Transitions
function initializeCardTransitions() {
  const cards = document.querySelectorAll('.step-card');
  
  cards.forEach((card, index) => {
    // Set initial states
    if (index === 0) {
      card.classList.add('active');
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
      card.style.position = 'relative';
    } else {
      card.classList.remove('active');
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.position = 'absolute';
    }
  });
}

// ======================================================
// FIXED & ENHANCED AI TOOL RANKING ENGINE (CARD 3) - FIXED (Issue #1)
// ======================================================

(function () {
  /* ------------------------------------------
     ENHANCED AI Tool Capability Matrix
  ------------------------------------------ */

  const AI_TOOL_PROFILES = {
    chatgpt: {
      name: "ChatGPT",
      strengths: ["general", "writing", "email", "education", "analysis", "professional", "formal", "conversational", "creative", "technical"],
      weaknesses: ["real-time", "latest", "free", "image"],
      tone: ["professional", "friendly", "formal", "authoritative", "casual", "humorous", "persuasive"],
      format: ["free", "bullet points", "numbered list", "paragraph", "email", "code"],
      depth: ["normal", "detailed", "brief", "high-level", "step-by-step"],
      audience: ["general", "beginners", "experts", "technical", "non-technical", "business", "students"],
      bestFor: ["emails", "content writing", "analysis", "education", "general tasks", "brainstorming", "explanations"],
      score: 0,
      matchReason: "",
      tooltip: "Best for general tasks, writing, analysis, and explanations. Supports multiple formats."
    },
    claude: {
      name: "Claude",
      strengths: ["writing", "analysis", "business", "detailed", "long-form", "reasoning", "ethical", "safe"],
      weaknesses: ["code", "creative", "image", "real-time"],
      tone: ["professional", "formal", "authoritative", "serious", "ethical"],
      format: ["free", "paragraph", "structured", "long-form"],
      depth: ["detailed", "normal", "comprehensive"],
      audience: ["experts", "technical", "business", "professional"],
      bestFor: ["long-form content", "analysis", "business documents", "detailed writing", "reasoning tasks"],
      score: 0,
      matchReason: "",
      tooltip: "Excellent for long-form content, analysis, and business writing with strong reasoning."
    },
    gemini: {
      name: "Gemini",
      strengths: ["research", "analysis", "education", "technical", "code", "multimodal", "latest", "real-time"],
      weaknesses: ["creative", "casual", "long-form"],
      tone: ["professional", "technical", "informative"],
      format: ["free", "structured", "code", "bullet points"],
      depth: ["detailed", "normal", "technical"],
      audience: ["technical", "experts", "beginners", "students"],
      bestFor: ["research", "technical analysis", "learning", "coding", "real-time information"],
      score: 0,
      matchReason: "",
      tooltip: "Great for research, technical tasks, coding, and real-time information with multimodal support."
    },
    perplexity: {
      name: "Perplexity",
      strengths: ["research", "analysis", "brief", "concise", "factual", "citations", "web", "latest"],
      weaknesses: ["creative", "long-form", "conversational"],
      tone: ["professional", "casual", "factual"],
      format: ["free", "bullet points", "concise"],
      depth: ["brief", "high-level", "factual"],
      audience: ["general", "beginners", "researchers"],
      bestFor: ["quick research", "summaries", "facts", "web searches", "citations", "news"],
      score: 0,
      matchReason: "",
      tooltip: "Perfect for research, fact-checking, summaries, and web searches with citations."
    },
    deepseek: {
      name: "DeepSeek",
      strengths: ["code", "technical", "structured", "mathematical", "programming", "algorithms", "free"],
      weaknesses: ["creative", "casual", "general", "non-technical"],
      tone: ["technical", "professional", "precise"],
      format: ["structured", "code", "technical"],
      depth: ["detailed", "normal", "technical"],
      audience: ["technical", "experts", "developers"],
      bestFor: ["coding", "technical solutions", "APIs", "algorithms", "debugging", "mathematical problems"],
      score: 0,
      matchReason: "",
      tooltip: "Specialized for coding, technical solutions, algorithms, and mathematical problems."
    },
    copilot: {
      name: "Copilot",
      strengths: ["code", "quick", "assistance", "snippets", "development", "integrated", "contextual"],
      weaknesses: ["long-form", "creative", "analysis", "non-technical"],
      tone: ["technical", "casual", "assistive"],
      format: ["code", "structured", "snippets"],
      depth: ["normal", "brief", "contextual"],
      audience: ["technical", "beginners", "developers"],
      bestFor: ["quick code help", "snippets", "debugging", "code completion", "development assistance"],
      score: 0,
      matchReason: "",
      tooltip: "Ideal for code assistance, snippets, debugging, and development workflow integration."
    },
    grok: {
      name: "Grok",
      strengths: ["creative", "general", "casual", "humorous", "entertainment", "conversational", "trendy"],
      weaknesses: ["professional", "technical", "serious", "formal"],
      tone: ["casual", "humorous", "friendly", "sarcastic", "entertaining"],
      format: ["free", "paragraph", "conversational"],
      depth: ["normal", "brief", "casual"],
      audience: ["general", "beginners", "casual"],
      bestFor: ["creative writing", "casual chat", "entertainment", "humor", "trendy topics", "social"],
      score: 0,
      matchReason: "",
      tooltip: "Fun for creative writing, casual chat, humor, entertainment, and trendy topics."
    }
  };

  /* ------------------------------------------
     ENHANCED: Score AI Tools Based on Intent
  ------------------------------------------ */

  function rankAITools(intent) {
    if (!intent || !intent.taskType) {
      // If no specific intent, return default order
      return ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    }
    
    // Reset scores
    Object.values(AI_TOOL_PROFILES).forEach(tool => {
      tool.score = 0;
      tool.matchReason = "";
    });
    
    // Score each tool
    Object.entries(AI_TOOL_PROFILES).forEach(([toolKey, tool]) => {
      let score = 0;
      let reasons = [];
      
      // 1. Task type matching (highest weight)
      if (tool.strengths.includes(intent.taskType)) {
        score += 15;
        reasons.push(`excels at ${intent.taskType}`);
      } else if (tool.strengths.some(strength => 
        strength.includes(intent.taskType) || intent.taskType.includes(strength)
      )) {
        score += 10;
        reasons.push(`good for ${intent.taskType}`);
      }
      
      // 2. Tone matching
      if (intent.tone && intent.tone !== "neutral") {
        if (tool.tone.includes(intent.tone)) {
          score += 8;
          reasons.push(`${intent.tone} tone`);
        } else if (intent.tone === "humorous" && toolKey === "grok") {
          score += 10;
          reasons.push("humorous style");
        } else if (intent.tone === "technical" && (toolKey === "deepseek" || toolKey === "copilot" || toolKey === "gemini")) {
          score += 8;
          reasons.push("technical expertise");
        }
      }
      
      // 3. Format matching
      if (intent.format && intent.format !== "free") {
        if ((intent.format === "code" || intent.format === "structured") && 
            (toolKey === "deepseek" || toolKey === "copilot" || toolKey === "gemini")) {
          score += 12;
          reasons.push(`${intent.format} output`);
        } else if (tool.format.includes(intent.format)) {
          score += 6;
          reasons.push(`${intent.format} format`);
        }
      }
      
      // 4. Depth matching
      if (intent.depth && intent.depth !== "normal") {
        if (intent.depth === "detailed" && (toolKey === "claude" || toolKey === "gemini")) {
          score += 10;
          reasons.push("detailed analysis");
        } else if (intent.depth === "brief" && (toolKey === "perplexity" || toolKey === "copilot")) {
          score += 8;
          reasons.push("concise answers");
        } else if (tool.depth.includes(intent.depth)) {
          score += 5;
          reasons.push(`${intent.depth} depth`);
        }
      }
      
      // 5. Audience matching
      if (intent.audience && intent.audience !== "general") {
        if (intent.audience === "technical" && (toolKey === "deepseek" || toolKey === "copilot" || toolKey === "gemini")) {
          score += 10;
          reasons.push("technical audience");
        } else if (intent.audience === "beginners" && (toolKey === "chatgpt" || toolKey === "perplexity")) {
          score += 8;
          reasons.push("beginner-friendly");
        } else if (tool.audience.includes(intent.audience)) {
          score += 6;
          reasons.push(`${intent.audience} audience`);
        }
      }
      
      // 6. Specific constraints
      if (intent.constraints && intent.constraints.length > 0) {
        // Code-related tasks
        if (intent.constraints.includes("code")) {
          if (toolKey === "deepseek") { score += 20; reasons.push("coding specialist"); }
          if (toolKey === "copilot") { score += 18; reasons.push("code assistant"); }
          if (toolKey === "gemini") { score += 15; reasons.push("technical coding"); }
        }
        // Creative tasks
        if (intent.constraints.includes("creative")) {
          if (toolKey === "grok") { score += 18; reasons.push("creative specialist"); }
          if (toolKey === "chatgpt") { score += 12; reasons.push("creative writing"); }
        }
        // Research tasks
        if (intent.constraints.includes("research")) {
          if (toolKey === "perplexity") { score += 20; reasons.push("research specialist"); }
          if (toolKey === "gemini") { score += 15; reasons.push("research & analysis"); }
        }
        // Business tasks
        if (intent.constraints.includes("business")) {
          if (toolKey === "claude") { score += 16; reasons.push("business writing"); }
          if (toolKey === "chatgpt") { score += 12; reasons.push("professional content"); }
        }
        // Educational tasks
        if (intent.constraints.includes("education")) {
          if (toolKey === "gemini") { score += 15; reasons.push("educational content"); }
          if (toolKey === "chatgpt") { score += 12; reasons.push("learning assistance"); }
        }
        // Urgent tasks
        if (intent.urgency === "high") {
          if (toolKey === "perplexity") { score += 10; reasons.push("quick answers"); }
          if (toolKey === "copilot") { score += 8; reasons.push("fast assistance"); }
        }
      }
      
      // 7. Special enhancements
      // Real-time info
      if (/(news|latest|current|today|recent)/i.test(JSON.stringify(intent))) {
        if (toolKey === "perplexity" || toolKey === "gemini") {
          score += 10;
          reasons.push("real-time info");
        }
      }
      // Free tier preference
      if (/(free|budget|cost|cheap)/i.test(JSON.stringify(intent))) {
        if (toolKey === "deepseek" || toolKey === "perplexity") {
          score += 8;
          reasons.push("free access");
        }
      }
      
      // Penalize weaknesses
      if (tool.weaknesses.includes(intent.taskType)) {
        score -= 12;
      }
      
      tool.score = score;
      tool.matchReason = reasons.slice(0, 3).join(", ");
    });
    
    // Sort by score descending
    const sorted = Object.entries(AI_TOOL_PROFILES)
      .sort((a, b) => b[1].score - a[1].score)
      .map(([key]) => key);
    
    // Only reorder if there's a clear winner (score difference > 5)
    const topScore = AI_TOOL_PROFILES[sorted[0]].score;
    const secondScore = AI_TOOL_PROFILES[sorted[1]].score;
    
    if (topScore - secondScore < 5 && topScore < 10) {
      // No clear winner, return default order
      return ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    }
    
    return sorted;
  }

  /* ------------------------------------------
     Reorder Card-3 Buttons & Add Best Match Tag
  ------------------------------------------ */

  function reorderLaunchButtons(toolOrder) {
    const container = document.querySelector(".launch-list");
    if (!container || !toolOrder.length) return;
    
    const buttons = Array.from(container.querySelectorAll(".launch-btn"));
    if (!buttons.length) return;
    
    // Clear existing best-match tags and tooltips
    buttons.forEach(btn => {
      btn.classList.remove("best-match");
      const existingTag = btn.querySelector(".best-match-tag");
      if (existingTag) existingTag.remove();
      
      const existingExplanation = btn.querySelector(".inline-explanation");
      if (existingExplanation) existingExplanation.remove();
    });
    
    // Store original order
    const originalOrder = ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    
    // Check if we should reorder
    const allSame = toolOrder.every((tool, i) => originalOrder[i] === tool);
    const topTool = AI_TOOL_PROFILES[toolOrder[0]];
    
    if (allSame && (!topTool || topTool.score < 10)) {
      // No significant ranking, keep default order
      resetToDefault();
      return;
    }
    
    // Reorder buttons based on ranking
    toolOrder.forEach((toolKey, index) => {
      const btn = buttons.find(b => b.id === `${toolKey}Btn`);
      if (!btn) return;
      
      container.appendChild(btn);
    });
  }

  /* ------------------------------------------
     Reset to Default Order
  ------------------------------------------ */

  function resetToDefault() {
    const defaultOrder = ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    const container = document.querySelector(".launch-list");
    
    if (!container) return;
    
    // Clear existing best-match tags
    const buttons = container.querySelectorAll(".launch-btn");
    buttons.forEach(btn => {
      btn.classList.remove("best-match");
      const existingTag = btn.querySelector(".best-match-tag");
      if (existingTag) existingTag.remove();
      
      const existingExplanation = btn.querySelector(".inline-explanation");
      if (existingExplanation) existingExplanation.remove();
    });
    
    // Reorder to default
    defaultOrder.forEach(toolKey => {
      const btn = document.getElementById(`${toolKey}Btn`);
      if (btn) container.appendChild(btn);
    });
  }

  /* ------------------------------------------
     Update Best Match Display
  ------------------------------------------ */

  function updateBestMatchDisplay(intent, orderedTools) {
    if (!intent || !orderedTools || orderedTools.length === 0) return;
    
    // Clear existing best-match tags from ALL buttons first
    document.querySelectorAll('.launch-btn').forEach(btn => {
      btn.classList.remove("best-match");
      const existingTag = btn.querySelector(".best-match-tag");
      if (existingTag) existingTag.remove();
      const existingScore = btn.querySelector(".match-score");
      if (existingScore) existingScore.remove();
    });
    
    // Only add "Best Match" to the FIRST tool (index 0) if it meets threshold
    const topToolKey = orderedTools[0];
    const topTool = AI_TOOL_PROFILES[topToolKey];
    
    if (!topTool || topTool.score < 10) return;
    
    const topToolBtn = document.getElementById(`${topToolKey}Btn`);
    if (!topToolBtn) return;
    
    // Add best match styling to only the top tool
    topToolBtn.classList.add("best-match");
    
    // Create ONLY ONE tag with 100% score
    const bestMatchTag = document.createElement("span");
    bestMatchTag.className = "best-match-tag";
    bestMatchTag.textContent = "✨ Best Match: 100%";
    bestMatchTag.style.background = "linear-gradient(135deg, #00FF41, #00F3FF)";
    bestMatchTag.style.color = "#000";
    bestMatchTag.style.fontSize = "10px";
    bestMatchTag.style.fontWeight = "700";
    bestMatchTag.style.padding = "3px 10px";
    bestMatchTag.style.borderRadius = "12px";
    bestMatchTag.style.position = "absolute";
    bestMatchTag.style.top = "-10px";
    bestMatchTag.style.left = "50%";
    bestMatchTag.style.transform = "translateX(-50%)";
    bestMatchTag.style.zIndex = "10";
    bestMatchTag.style.boxShadow = "0 0 10px rgba(0, 255, 65, 0.8)";
    bestMatchTag.style.border = "2px solid #000";
    bestMatchTag.style.pointerEvents = "none";
    bestMatchTag.style.textTransform = "uppercase";
    bestMatchTag.style.letterSpacing = "1px";
    bestMatchTag.style.fontFamily = "'Courier New', monospace";
    bestMatchTag.style.textAlign = "center";
    bestMatchTag.style.minWidth = "120px";
    bestMatchTag.style.whiteSpace = "nowrap";
    
    topToolBtn.appendChild(bestMatchTag);
  }

  /* ------------------------------------------
     Add Hover Tooltips (Issue #5)
  ------------------------------------------ */

  function setupTooltips() {
    const launchButtons = document.querySelectorAll(".launch-btn");
    
    launchButtons.forEach(btn => {
      const toolId = btn.id.replace("Btn", "");
      const toolProfile = AI_TOOL_PROFILES[toolId];
      
      if (toolProfile) {
        // Remove any existing tooltip
        btn.removeAttribute("title");
        
        // Create custom tooltip
        btn.addEventListener("mouseenter", function(e) {
          if (!toolProfile) return;
          
          // Remove any existing custom tooltip
          const existingTooltip = document.querySelector(".custom-tooltip");
          if (existingTooltip) {
            existingTooltip.remove();
          }
          
          // Create new tooltip
          const tooltip = document.createElement("div");
          tooltip.className = "custom-tooltip";
          tooltip.innerHTML = `
            <div class="tooltip-header">
              <strong>${toolProfile.name}</strong>
               <span class="tooltip-match">${toolProfile.score > 0 ? `Match Score: ${toolProfile.score}/50` : ''}</span>
            </div>
            <div class="tooltip-body">${toolProfile.tooltip}</div>
            ${toolProfile.matchReason ? `<div class="tooltip-reason"><i class="fas fa-bullseye"></i> ${toolProfile.matchReason}</div>` : ''}
            <div class="tooltip-footer">
              <span><i class="fas fa-star"></i> Best for: ${toolProfile.bestFor.slice(0, 3).join(", ")}</span>
            </div>
          `;
          
          document.body.appendChild(tooltip);
          
          // Position tooltip
          const rect = btn.getBoundingClientRect();
          tooltip.style.left = `${rect.left + window.scrollX}px`;
          tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;
          
          // Adjust if tooltip goes off screen
          if (rect.top - tooltip.offsetHeight - 10 < 0) {
            tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
          }
        });
        
        btn.addEventListener("mouseleave", function() {
          const tooltip = document.querySelector(".custom-tooltip");
          if (tooltip) {
            tooltip.remove();
          }
        });
      }
    });
  }

  /* ------------------------------------------
     Public API
  ------------------------------------------ */

  window.AIToolRanker = {
    rankAndReorder(intent) {
      if (!intent) {
        resetToDefault();
        return;
      }
      
      const ordered = rankAITools(intent);
      reorderLaunchButtons(ordered);
      // Clear ALL best-match tags before adding new ones
      document.querySelectorAll('.launch-btn').forEach(btn => {
        btn.classList.remove("best-match");
        const existingTag = btn.querySelector(".best-match-tag");
        if (existingTag) existingTag.remove();
        const existingScore = btn.querySelector(".match-score");
        if (existingScore) existingScore.remove();
      });
      
      // Update best match display
      if (ordered.length > 0) {
        updateBestMatchDisplay(intent, ordered);
      }
      
      // Setup tooltips
      setTimeout(setupTooltips, 100);
    },
    
    resetToDefault,
    setupTooltips
  };
})();

// Make functions globally available
window.generatePrompt = generatePrompt;
window.exportPrompt = exportPrompt;
window.openAITool = openAITool;
window.saveSettings = saveSettings;
window.clearAllData = clearAllData;
window.resetTextareaSizes = resetTextareaSizes;
window.clearHistory = clearHistory;
window.useTemplate = function (id) {
  const template = templates.find((t) => t.id === id);
  if (template) {
    template.usageCount = (template.usageCount || 0) + 1;
    localStorage.setItem("promptTemplates", JSON.stringify(templates));

    document.getElementById("requirement").value = template.example || "";
    document.getElementById("output").value = template.content;
    updateStats(template.content);
    updateOutputStats();
    isConverted = true;
    lastConvertedText = template.example || "";
    document.getElementById("convertedBadge").style.display = "inline-flex";
    setLaunchButtonsEnabled(true);
    showNotification("Template loaded into prompt");
    
    loadCategories();
  }
};
window.editTemplate = editTemplate;
window.deleteTemplate = deleteTemplate;
window.resetEverything = resetEverything;

// Test the notification
setTimeout(() => {
  showNotification("PromptCraft is ready! Start by typing your requirement.");
}, 2000);
