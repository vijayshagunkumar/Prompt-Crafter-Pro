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
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-3.5-turbo";

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

// Clear/Undo button state
let lastClearedText = "";
let isUndoState = false;

// Textarea sizing state
let textareaSizes = {
  requirement: { height: 250 },  // CHANGED FROM 140 TO 250
  output: { height: 200 }
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

  // ✅ AUTO-SCROLL active preset into view
  scrollPresetIntoView(presetId);

  updatePresetInfo(lastTaskLabel, currentPreset, lastPresetSource);
}

function updatePresetInfo(taskLabel, presetId, source) {
  const el = document.getElementById("presetInfo");
  if (!el) return;

  const presetNames = {
    default: "Standard",
    chatgpt: "ChatGPT",
    claude: "Claude",
    detailed: "Detailed"
  };

  const nicePreset = presetNames[presetId] || presetId;
  const srcLabel = source === "manual" ? "manual" : "auto";

  el.textContent = `${taskLabel} • ${nicePreset} (${srcLabel})`;
}

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
  
  // Auto-scroll to last chip
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
  updatePresetInfo("General", currentPreset, "auto");

  const req = document.getElementById("requirement");
  if (req) req.focus();

  setLaunchButtonsEnabled(false);
  
  // NEW: Initialize textarea sizing
  initializeTextareaSizing();
}

// ===========================================
// TEXTAREA RESIZING AND EXPAND FUNCTIONS
// ===========================================

// Initialize textarea sizing
function initializeTextareaSizing() {
  // Load saved sizes from localStorage
  const savedSizes = localStorage.getItem('textareaSizes');
  if (savedSizes) {
    textareaSizes = JSON.parse(savedSizes);
    
    // Apply saved heights
    const requirementEl = document.getElementById('requirement');
    const outputEl = document.getElementById('output');
    
    if (requirementEl && textareaSizes.requirement.height) {
      requirementEl.style.height = `${textareaSizes.requirement.height}px`;
      updateSizeInfo('inputSizeInfo', textareaSizes.requirement.height);
    }
    
    if (outputEl && textareaSizes.output.height) {
      outputEl.style.height = `${textareaSizes.output.height}px`;
      updateSizeInfo('outputSizeInfo', textareaSizes.output.height);
    }
  } else {
    // If no saved sizes, set default to 250px for Card 1
    const requirementEl = document.getElementById('requirement');
    if (requirementEl) {
      requirementEl.style.height = '250px';
      textareaSizes.requirement.height = 250;
      updateSizeInfo('inputSizeInfo', 250);
    }
  }
  
  // Setup resize observers
  setupResizeObservers();
  
  // Setup expand/collapse buttons
  setupExpandButtons();
}

// Setup resize observers to detect size changes
function setupResizeObservers() {
  const requirementEl = document.getElementById('requirement');
  const outputEl = document.getElementById('output');
  
  if (!requirementEl || !outputEl) return;
  
  // Use ResizeObserver to detect size changes
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const height = entry.contentRect.height;
      const textareaId = entry.target.id;
      
      // Update size info display
      if (textareaId === 'requirement') {
        textareaSizes.requirement.height = height;
        updateSizeInfo('inputSizeInfo', height);
      } else if (textareaId === 'output') {
        textareaSizes.output.height = height;
        updateSizeInfo('outputSizeInfo', height);
      }
      
      // Save sizes with debounce
      debounce(saveTextareaSizes, 500);
      
      // Add visual feedback
      entry.target.classList.add('size-changing');
      setTimeout(() => {
        entry.target.classList.remove('size-changing');
      }, 300);
    }
  });
  
  resizeObserver.observe(requirementEl);
  resizeObserver.observe(outputEl);
  
  // Also track manual drag events
  requirementEl.addEventListener('mouseup', () => debounce(saveTextareaSizes, 300));
  outputEl.addEventListener('mouseup', () => debounce(saveTextareaSizes, 300));
}

// Save sizes to localStorage
function saveTextareaSizes() {
  localStorage.setItem('textareaSizes', JSON.stringify(textareaSizes));
}

// Setup expand/collapse buttons
function setupExpandButtons() {
  const expandInputBtn = document.getElementById('expandInputBtn');
  const expandOutputBtn = document.getElementById('expandOutputBtn');
  const expandOverlay = document.getElementById('expandOverlay');
  
  if (!expandInputBtn || !expandOutputBtn || !expandOverlay) return;
  
  // Input expand/collapse
  expandInputBtn.addEventListener('click', () => {
    const textarea = document.getElementById('requirement');
    if (!textarea) return;
    
    if (isInputExpanded) {
      // Collapse
      textarea.classList.remove('textarea-expanded');
      expandInputBtn.classList.remove('expanded');
      expandInputBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
      expandInputBtn.title = 'Expand';
      expandOverlay.style.display = 'none';
      isInputExpanded = false;
      
      // Restore saved height
      if (textareaSizes.requirement.height) {
        textarea.style.height = `${textareaSizes.requirement.height}px`;
      }
    } else {
      // Expand
      // Save current height before expanding
      const currentHeight = textarea.offsetHeight;
      if (currentHeight > 250) {
        textareaSizes.requirement.height = currentHeight;
      }
      
      textarea.classList.add('textarea-expanded');
      expandInputBtn.classList.add('expanded');
      expandInputBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
      expandInputBtn.title = 'Collapse';
      expandOverlay.style.display = 'block';
      isInputExpanded = true;
      
      // Focus the textarea when expanded
      textarea.focus();
      
      // Scroll to cursor position
      textarea.scrollTop = textarea.scrollHeight;
    }
  });
  
  // Output expand/collapse
  expandOutputBtn.addEventListener('click', () => {
    const textarea = document.getElementById('output');
    if (!textarea) return;
    
    if (isOutputExpanded) {
      // Collapse
      textarea.classList.remove('textarea-expanded');
      expandOutputBtn.classList.remove('expanded');
      expandOutputBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
      expandOutputBtn.title = 'Expand';
      expandOverlay.style.display = 'none';
      isOutputExpanded = false;
      
      // Restore saved height
      if (textareaSizes.output.height) {
        textarea.style.height = `${textareaSizes.output.height}px`;
      }
    } else {
      // Expand
      // Save current height before expanding
      const currentHeight = textarea.offsetHeight;
      if (currentHeight > 200) {
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
      }
    }
    
    expandOverlay.style.display = 'none';
  });
  
  // Close expanded mode with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const expandOverlay = document.getElementById('expandOverlay');
      if (expandOverlay) expandOverlay.click();
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

// Reset textarea sizes to default
function resetTextareaSizes() {
  const requirementEl = document.getElementById('requirement');
  const outputEl = document.getElementById('output');
  
  if (requirementEl) {
    requirementEl.style.height = '250px';
    textareaSizes.requirement.height = 250;
    updateSizeInfo('inputSizeInfo', 250);
  }
  
  if (outputEl) {
    outputEl.style.height = '200px';
    textareaSizes.output.height = 200;
    updateSizeInfo('outputSizeInfo', 200);
  }
  
  saveTextareaSizes();
  showNotification('Textarea sizes reset to default');
}

// RESET EVERYTHING FUNCTION
function resetEverything() {
  if (isResetting) return;
  
  if (!confirm("Are you sure you want to reset everything? This will clear both input and output areas.")) {
    return;
  }
  
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
  updatePresetInfo('General', 'default', 'auto');
  
  // Update UI elements
  document.getElementById('convertedBadge').style.display = 'none';
  document.getElementById('convertBtn').disabled = true;
  
  // Clear clear button state
  const clearBtn = document.getElementById('clearInputBtn');
  if (clearBtn) {
    clearBtn.classList.remove('undo-state');
    clearBtn.querySelector('i').className = 'fas fa-broom';
    clearBtn.title = 'Clear text';
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
  
  // Reset textarea sizes to 250px (Card 1 larger)
  resetTextareaSizes();
  
  showNotification('Everything has been reset');
  
  // Allow resetting again after a short delay
  setTimeout(() => {
    isResetting = false;
  }, 500);
}

// Settings
function loadSettings() {
  const apiKey = localStorage.getItem("OPENAI_API_KEY") || "";
  const delay = localStorage.getItem("autoConvertDelay") || "60";
  const voiceLang = localStorage.getItem("voiceLanguage") || "en-US";

  const apiKeyInput = document.getElementById("apiKeyInput");
  const autoDelayInput = document.getElementById("autoConvertDelay");
  const voiceLanguageSelect = document.getElementById("voiceLanguage");
  const delayValue = document.getElementById("delayValue");

  if (apiKeyInput) apiKeyInput.value = apiKey;
  if (autoDelayInput) autoDelayInput.value = delay;
  if (voiceLanguageSelect) voiceLanguageSelect.value = voiceLang;
  if (delayValue) delayValue.textContent = `Current: ${delay} seconds`;

  autoConvertDelay = parseInt(delay, 10);
  autoConvertCountdown = autoConvertDelay;
}

function saveSettings() {
  const apiKey = (document.getElementById("apiKeyInput").value || "").trim();
  const delay = document.getElementById("autoConvertDelay").value || "60";
  const voiceLang = document.getElementById("voiceLanguage").value || "en-US";

  localStorage.setItem("OPENAI_API_KEY", apiKey);
  localStorage.setItem("autoConvertDelay", delay);
  localStorage.setItem("voiceLanguage", voiceLang);

  autoConvertDelay = parseInt(delay, 10);
  autoConvertCountdown = autoConvertDelay;

  // Update voice language if voice features are available
  if (window.voiceFeatures && window.voiceFeatures.updateVoiceLanguage) {
    window.voiceFeatures.updateVoiceLanguage(voiceLang);
  }

  showNotification("Settings saved");
  const modal = document.getElementById("settingsModal");
  if (modal) modal.style.display = "none";
}

function clearAllData() {
  localStorage.clear();
  
  // Reset textarea sizes in memory
  textareaSizes = {
    requirement: { height: 250 },
    output: { height: 200 }
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
      
      // Update preset based on the loaded requirement
      const { role, preset: autoPreset, label } = getRoleAndPreset(item.requirement);
      lastRole = role;
      lastTaskLabel = label;
      
      if (!userPresetLocked && autoPreset && PRESETS[autoPreset]) {
        lastPresetSource = "auto";
        setCurrentPreset(autoPreset);
      }
      updatePresetInfo(lastTaskLabel, currentPreset, lastPresetSource);
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
}

// Event Listeners
function setupEventListeners() {
  /* ===============================
     RESET BUTTON
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
        updatePresetInfo(lastTaskLabel, currentPreset, "manual");
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
     CLEAR INPUT BUTTON (UNDO/REDO)
  =============================== */
  const clearBtn = document.getElementById("clearInputBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", toggleClearUndo);
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

  document.getElementById("geminiBtn")
    ?.addEventListener("click", () => openAITool("Gemini", "https://gemini.google.com/app"));

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
     SIDEBAR TOGGLE
  =============================== */
  document.getElementById("toggleSidebar")?.addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    const toggleBtn = document.getElementById("toggleSidebar");
    
    if (sidebar && mainContent && toggleBtn) {
      sidebar.classList.toggle("collapsed");
      mainContent.classList.toggle("sidebar-collapsed");
      
      // Update toggle button icon
      const icon = toggleBtn.querySelector("i");
      if (icon) {
        if (sidebar.classList.contains("collapsed")) {
          icon.className = "fas fa-chevron-right";
        } else {
          icon.className = "fas fa-chevron-left";
        }
      }
    }
  });

  /* ===============================
     SIDEBAR TABS
  =============================== */
  document.querySelectorAll(".sidebar-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const tabId = e.currentTarget.dataset.tab;
      if (!tabId) return;
      
      // Update active tab
      document.querySelectorAll(".sidebar-tab").forEach((t) => {
        t.classList.remove("active");
      });
      e.currentTarget.classList.add("active");
      
      // Show corresponding panel
      document.querySelectorAll(".sidebar-panel").forEach((panel) => {
        panel.style.display = "none";
      });
      
      const targetPanel = document.getElementById(`${tabId}Panel`);
      if (targetPanel) {
        targetPanel.style.display = "block";
        
        // Load templates if needed
        if (tabId === "templates") {
          loadCategories();
          loadTemplatesToUI();
        }
      }
    });
  });

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
    // Ctrl/Cmd + Enter to convert
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!document.getElementById("convertBtn").disabled) {
        generatePrompt();
      }
    }
    
    // Ctrl/Cmd + S to save (in template modal)
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      const templateModal = document.getElementById("templateModal");
      if (templateModal && templateModal.style.display === "flex") {
        e.preventDefault();
        saveTemplate();
      }
    }
    
    // Escape key to close expanded mode
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
  
  // Update role and preset based on content
  const { role, preset: autoPreset, label } = getRoleAndPreset(requirement);
  lastRole = role;
  lastTaskLabel = label;
  
  if (!userPresetLocked && autoPreset && PRESETS[autoPreset]) {
    lastPresetSource = "auto";
    setCurrentPreset(autoPreset);
  }
  
  // Generate prompt using current preset
  const prompt = PRESETS[currentPreset](lastRole, requirement);
  
  // Update output
  outputEl.value = prompt;
  isConverted = true;
  lastConvertedText = requirement;
  
  // Update UI
  document.getElementById("convertedBadge").style.display = "inline-flex";
  setLaunchButtonsEnabled(true);
  
  // Update stats
  updateStats(prompt);
  updateOutputStats();
  
  // Save to history
  saveToHistory(requirement, prompt);
  
  // Increment usage count
  usageCount++;
  localStorage.setItem("usageCount", usageCount.toString());
  
  // Show success notification
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
    if (clearBtn) {
      clearBtn.classList.remove("undo-state");
      clearBtn.querySelector("i").className = "fas fa-broom";
      clearBtn.title = "Clear text";
    }
    
    // Clear intent chips
    renderIntentChips([]);
    return;
  }
  
  // Enable convert button
  convertBtn.disabled = false;
  
  // Update clear/undo button state
  if (clearBtn && isConverted && requirement === lastConvertedText) {
    clearBtn.classList.add("undo-state");
    clearBtn.querySelector("i").className = "fas fa-undo";
    clearBtn.title = "Undo to original";
  } else {
    clearBtn.classList.remove("undo-state");
    clearBtn.querySelector("i").className = "fas fa-broom";
    clearBtn.title = "Clear text";
  }
  
  // Auto-detect intent (for chip display)
  const intent = detectIntentFromText(requirement);
  const chips = intentObjectToChips(intent);
  renderIntentChips(chips);
  
  // Auto-convert logic
  if (autoConvertEnabled && autoConvertDelay > 0) {
    resetAutoConvertTimer();
  }
  
  // Update character stats
  updateStats(requirement);
}

/* ===============================
   TOGGLE CLEAR/UNDO FUNCTION
=============================== */
function toggleClearUndo() {
  const requirementEl = document.getElementById("requirement");
  const clearBtn = document.getElementById("clearInputBtn");
  
  if (!requirementEl || !clearBtn) return;
  
  if (isUndoState) {
    // Redo: restore last cleared text
    requirementEl.value = lastClearedText;
    requirementEl.focus();
    lastClearedText = "";
    isUndoState = false;
    
    // Update button
    clearBtn.classList.remove("undo-state");
    clearBtn.querySelector("i").className = "fas fa-broom";
    clearBtn.title = "Clear text";
    
    showNotification("Text restored");
  } else {
    // Clear: save current text
    const currentText = requirementEl.value;
    if (!currentText.trim()) {
      showNotification("Nothing to clear");
      return;
    }
    
    lastClearedText = currentText;
    requirementEl.value = "";
    requirementEl.focus();
    isUndoState = true;
    
    // Update button
    clearBtn.classList.add("undo-state");
    clearBtn.querySelector("i").className = "fas fa-redo";
    clearBtn.title = "Redo cleared text";
    
    // Disable convert button
    document.getElementById("convertBtn").disabled = true;
    
    // Clear intent chips
    renderIntentChips([]);
    
    showNotification("Text cleared. Click again to restore.");
  }
  
  // Trigger input event to update other UI
  requirementEl.dispatchEvent(new Event("input"));
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
  
  // Update countdown display
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
  
  // Update countdown every second
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
  
  document.getElementById("charCount").textContent = chars;
  document.getElementById("wordCount").textContent = words;
  document.getElementById("lineCount").textContent = lines;
}

function updateOutputStats() {
  const outputEl = document.getElementById("output");
  if (!outputEl) return;
  
  const text = outputEl.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split("\n").length : 0;
  
  document.getElementById("outputCharCount").textContent = chars;
  document.getElementById("outputWordCount").textContent = words;
  document.getElementById("outputLineCount").textContent = lines;
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
    constraints: []
  };
  
  // Detect persona
  if (/as a |i am a |i'm a /i.test(lower)) {
    intent.persona = "specific";
  } else if (/like a |similar to a |channeling /i.test(lower)) {
    intent.persona = "styled";
  }
  
  // Detect tone
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
  
  // Detect formality
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
  
  // Detect emotion
  if (/excited|enthusiastic|energetic/i.test(lower)) {
    intent.emotion = "excited";
  } else if (/urgent|important|critical|asap/i.test(lower)) {
    intent.emotion = "urgent";
  } else if (/calm|peaceful|serene|relaxed/i.test(lower)) {
    intent.emotion = "calm";
  } else if (/serious|grave|solemn/i.test(lower)) {
    intent.emotion = "serious";
  }
  
  // Detect urgency
  if (/urgent|asap|immediately|right away|emergency/i.test(lower)) {
    intent.urgency = "high";
  } else if (/soon|shortly|in a bit/i.test(lower)) {
    intent.urgency = "medium";
  } else if (/no rush|whenever|at your convenience/i.test(lower)) {
    intent.urgency = "low";
  }
  
  // Detect audience
  if (/beginners|newbies|novices|students/i.test(lower)) {
    intent.audience = "beginners";
  } else if (/experts|professionals|advanced/i.test(lower)) {
    intent.audience = "experts";
  } else if (/technical|developers|engineers/i.test(lower)) {
    intent.audience = "technical";
  } else if (/non-technical|general public|everyone/i.test(lower)) {
    intent.audience = "non-technical";
  }
  
  // Detect format
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
  
  // Detect depth
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

  const { role, preset: autoPreset, label } = getRoleAndPreset(raw);
  lastRole = role;
  lastTaskLabel = label;

  if (!userPresetLocked && autoPreset && PRESETS[autoPreset]) {
    lastPresetSource = "auto";
    setCurrentPreset(autoPreset);
  } else {
    updatePresetInfo(
      lastTaskLabel,
      currentPreset,
      userPresetLocked ? "manual" : "auto"
    );
  }

  usageCount++;
  localStorage.setItem("promptCrafterUsage", usageCount);
  document.getElementById(
    "usageCount"
  ).innerHTML = `<i class="fas fa-bolt"></i>${usageCount} prompts generated`;

  const apiKey = localStorage.getItem("OPENAI_API_KEY")?.trim();

  convertBtn.disabled = true;
  convertBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Converting...';
  clearAutoConvertTimer();

  let generatedPrompt;

  try {
    if (!apiKey) {
      generatedPrompt = localFormatter(raw);
    } else {
      const templateSkeleton = PRESETS[currentPreset]("[ROLE]", "[REQUIREMENT]");

      const system = `
You write structured task instructions for AI models.

Using the TEMPLATE below, replace [ROLE] with an appropriate expert role (for example: "${role}")
and [REQUIREMENT] with the user's requirement. Return ONLY the completed template and nothing else.

TEMPLATE:
${templateSkeleton}

Important:
- The template you return must tell the AI to directly perform the task and return the final result.
- Do NOT mention prompts, prompt generation, or rewriting instructions in your output.
`.trim();

      const userMessage = `User requirement: "${raw}"

Fill the template accordingly in the current preset format ("${currentPreset}") and return only the filled template.`;

      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userMessage }
          ],
          temperature: 0.1,
          max_tokens: 700
        })
      });

      if (response.ok) {
        const data = await response.json();
        generatedPrompt =
          data.choices?.[0]?.message?.content?.trim() || localFormatter(raw);
      } else {
        generatedPrompt = localFormatter(raw);
      }
    }

    generatedPrompt = sanitizePrompt(generatedPrompt);

    outputEl.value = generatedPrompt;
    updateStats(raw);
    updateOutputStats();
    saveToHistory(raw, generatedPrompt);

    isConverted = true;
    lastConvertedText = raw;
    document.getElementById("convertedBadge").style.display = "inline-flex";
    setLaunchButtonsEnabled(true);

    showNotification("Prompt generated successfully");

    // Reset auto-convert timer if there's still text
    if (autoConvertEnabled && raw) {
      autoConvertCountdown = autoConvertDelay;
      resetAutoConvertTimer();
    }
  } catch (error) {
    console.error("Generation error:", error);
    generatedPrompt = localFormatter(raw);
    outputEl.value = generatedPrompt;
    updateStats(generatedPrompt);
    updateOutputStats();
    showNotification("Using offline generation");
  } finally {
    convertBtn.disabled = false;
    convertBtn.innerHTML = '<i class="fas fa-magic"></i> Convert';
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
  
  // Copy prompt to clipboard
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
  const notification = document.getElementById("notification");
  if (!notification) return;
  
  const textEl = document.getElementById("notificationText");
  if (textEl) textEl.textContent = message;
  
  notification.style.display = "flex";
  
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.style.display = "none";
    }, 300);
  }, 3000);
}

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
  }
};
window.editTemplate = editTemplate;
window.deleteTemplate = deleteTemplate;
window.resetEverything = resetEverything;
