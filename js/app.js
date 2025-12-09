// PromptCraft – app.js

// API Configuration
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
// Use your fine-tuned model or a base model here
const OPENAI_MODEL = "gpt-3.5-turbo";

// Application State
let currentPreset = "default";
let userPresetLocked = false;       // when user clicks a preset, stop auto-switching
let lastPresetSource = "auto";      // 'auto' or 'manual'
let lastTaskLabel = "General";      // Email / Code / Analysis / Blog / etc.
let lastRole = "expert assistant";  // from classifier

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

// Voice input (Speech Recognition)
let recognition = null;
let isListening = false;

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

// Default templates (simple examples)
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

// Preset templates – markdown with Role / Objective / Context / Instructions / Notes
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

// -------- Helper: classify role + best preset + label ----------
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

// -------- Helper: set preset + sync UI & badge ----------
function setCurrentPreset(presetId) {
  if (!PRESETS[presetId]) return;
  currentPreset = presetId;
  document.querySelectorAll(".preset-option").forEach((o) => {
    o.classList.toggle("active", o.dataset.preset === presetId);
  });
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

/**
 * Enable / disable all AI launch buttons (Step 3)
 */
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

// ----- Voice Input (Speech Recognition) -----
function initVoice() {
  const voiceRow = document.getElementById("voiceRow");
  const voiceBtn = document.getElementById("voiceBtn");
  const voiceStatus = document.getElementById("voiceStatus");
  const voiceDot = document.getElementById("voiceDot");
  const voiceBtnLabel = document.getElementById("voiceBtnLabel");

  if (!voiceRow || !voiceBtn || !voiceStatus || !voiceDot || !voiceBtnLabel) {
    return;
  }

  const hasSupport =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  if (!hasSupport) {
    voiceStatus.textContent = "Voice input is not supported in this browser.";
    voiceBtn.disabled = true;
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";          // change to "en-US" if you prefer
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    isListening = true;
    voiceDot.classList.add("active");
    voiceStatus.textContent = "Listening… speak now.";
    voiceBtnLabel.textContent = "Stop";
  };

  recognition.onend = () => {
    isListening = false;
    voiceDot.classList.remove("active");
    voiceStatus.textContent = "Click mic and start speaking.";
    voiceBtnLabel.textContent = "Start";
  };

  recognition.onerror = (event) => {
    isListening = false;
    voiceDot.classList.remove("active");
    voiceBtnLabel.textContent = "Start";

    if (event.error === "not-allowed") {
      voiceStatus.textContent = "Mic access blocked. Check browser permissions.";
    } else if (event.error === "no-speech") {
      voiceStatus.textContent = "No speech detected. Try again.";
    } else {
      voiceStatus.textContent = "Voice error – try again.";
      if (typeof showNotification === "function") {
        showNotification("Voice error: " + event.error);
      }
    }
  };

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    const reqEl = document.getElementById("requirement");
    if (!reqEl) return;

    const existing = reqEl.value.trim();
    reqEl.value = (existing ? existing + " " : "") + transcript.trim();

    // Reuse existing logic for stats / auto-convert / state
    handleRequirementInput();
  };

  voiceBtn.addEventListener("click", toggleVoiceInput);
}

function toggleVoiceInput() {
  if (!recognition) {
    if (typeof showNotification === "function") {
      showNotification("Voice input not available.");
    }
    return;
  }

  try {
    if (!isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }
  } catch (e) {
    console.error("Speech recognition error:", e);
  }
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

  // Initially all AI tool buttons are disabled until a prompt is generated
  setLaunchButtonsEnabled(false);

  // Initialize voice input controls
  initVoice();
}

// ----- Settings -----
function loadSettings() {
  const apiKey = localStorage.getItem("OPENAI_API_KEY") || "";
  const delay = localStorage.getItem("autoConvertDelay") || "60";
  const theme = localStorage.getItem("theme") || "light";

  const apiKeyInput = document.getElementById("apiKeyInput");
  const autoDelayInput = document.getElementById("autoConvertDelay");
  const themeSelect = document.getElementById("themeSelect");
  const delayValue = document.getElementById("delayValue");

  if (apiKeyInput) apiKeyInput.value = apiKey;
  if (autoDelayInput) autoDelayInput.value = delay;
  if (themeSelect) themeSelect.value = theme;
  if (delayValue) delayValue.textContent = `Current: ${delay} seconds`;

  autoConvertDelay = parseInt(delay, 10);
  autoConvertCountdown = autoConvertDelay;

  applyTheme(theme);
}

function applyTheme(theme) {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
}

function saveSettings() {
  const apiKey = (document.getElementById("apiKeyInput").value || "").trim();
  const delay = document.getElementById("autoConvertDelay").value || "60";
  const theme = document.getElementById("themeSelect").value || "light";

  localStorage.setItem("OPENAI_API_KEY", apiKey);
  localStorage.setItem("autoConvertDelay", delay);
  localStorage.setItem("theme", theme);

  autoConvertDelay = parseInt(delay, 10);
  autoConvertCountdown = autoConvertDelay;
  applyTheme(theme);

  showNotification("Settings saved");
  const modal = document.getElementById("settingsModal");
  if (modal) modal.style.display = "none";
}

function clearAllData() {
  localStorage.clear();
  showNotification("All data cleared. Reloading...");
  setTimeout(() => {
    window.location.reload();
  }, 800);
}

// ----- Templates -----
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

  // All category
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

// ----- History -----
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
      showNotification("Loaded from history");
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

// ----- UI Init -----
function initializeUI() {
  const templatesPanel = document.getElementById("templatesPanel");
  if (templatesPanel) templatesPanel.style.display = "none";
  const historyPanel = document.getElementById("historyPanel");
  if (historyPanel) historyPanel.style.display = "none";
}

// ----- Event Listeners -----
function setupEventListeners() {
  // Settings
  document.getElementById("settingsBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").style.display = "flex";
  });

  document.getElementById("closeSettingsBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").style.display = "none";
  });

  document
    .getElementById("saveSettingsBtn")
    .addEventListener("click", saveSettings);

  document.getElementById("clearDataBtn").addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to clear all data? This will delete all templates, history, and settings."
      )
    ) {
      clearAllData();
    }
  });

  // Auto-convert delay slider
  const delaySlider = document.getElementById("autoConvertDelay");
  const delayValue = document.getElementById("delayValue");
  if (delaySlider && delayValue) {
    delaySlider.addEventListener("input", () => {
      delayValue.textContent = `Current: ${delaySlider.value} seconds`;
      autoConvertDelay = parseInt(delaySlider.value, 10);
    });
  }

  // Toggle templates panel
  const toggleTemplatesBtn = document.getElementById("toggleTemplatesBtn");
  if (toggleTemplatesBtn) {
    toggleTemplatesBtn.addEventListener("click", () => {
      const panel = document.getElementById("templatesPanel");
      if (!panel) return;
      const isHidden = panel.style.display === "none" || panel.style.display === "";
      panel.style.display = isHidden ? "block" : "none";
      const state = document.querySelector(".template-toggle-state");
      if (state) state.textContent = isHidden ? "Visible" : "Hidden";
    });
  }

  // Template modal buttons
  const addTemplateBtn = document.getElementById("addTemplateBtn");
  if (addTemplateBtn) {
    addTemplateBtn.addEventListener("click", () => openTemplateModal());
  }

  const closeTemplateModalBtn = document.getElementById("closeTemplateModalBtn");
  if (closeTemplateModalBtn) {
    closeTemplateModalBtn.addEventListener("click", closeTemplateModal);
  }

  const cancelTemplateBtn = document.getElementById("cancelTemplateBtn");
  if (cancelTemplateBtn) {
    cancelTemplateBtn.addEventListener("click", closeTemplateModal);
  }

  const saveTemplateBtn = document.getElementById("saveTemplateBtn");
  if (saveTemplateBtn) {
    saveTemplateBtn.addEventListener("click", saveTemplate);
  }

  // Template search
  const templateSearch = document.getElementById("templateSearch");
  if (templateSearch) {
    templateSearch.addEventListener("input", () => {
      const categoryBtn = document.querySelector(".template-category.active");
      const category = categoryBtn ? categoryBtn.dataset.category : "all";
      filterTemplatesUI(category, templateSearch.value);
    });
  }

  // Requirement input
  const requirementInput = document.getElementById("requirement");
  if (requirementInput) {
    requirementInput.addEventListener("input", handleRequirementInput);
  }

  const autoConvertToggle = document.getElementById("autoConvert");
  if (autoConvertToggle) {
    autoConvertToggle.addEventListener("change", (e) => {
      autoConvertEnabled = e.target.checked;
      if (!autoConvertEnabled) {
        clearAutoConvertTimer();
      } else {
        scheduleAutoConvert();
      }
    });
  }

  // Generate button
  const generateBtn = document.getElementById("generateBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const text = requirementInput.value.trim();
      if (!text) {
        showNotification("Please enter your requirement first.");
        return;
      }
      convertRequirementToPrompt(text, true);
    });
  }

  // Copy output
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const output = document.getElementById("output");
      if (!output.value.trim()) {
        showNotification("No prompt to copy yet.");
        return;
      }
      copyToClipboard(output.value.trim());
      showNotification("Prompt copied to clipboard.");
    });
  }

  // History
  const historyBtn = document.getElementById("historyBtn");
  if (historyBtn) {
    historyBtn.addEventListener("click", () => {
      const panel = document.getElementById("historyPanel");
      if (!panel) return;
      const isHidden = panel.style.display === "none" || panel.style.display === "";
      panel.style.display = isHidden ? "block" : "none";
    });
  }

  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", clearHistory);
  }

  // Export
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const output = document.getElementById("output");
      if (!output.value.trim()) {
        showNotification("No prompt to export yet.");
        return;
      }
      exportPrompt(output.value.trim());
    });
  }

  // Preset options
  document.querySelectorAll(".preset-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.dataset.preset;
      userPresetLocked = true;
      lastPresetSource = "manual";
      setCurrentPreset(preset);
      const requirementText = requirementInput.value.trim();
      if (requirementText) {
        convertRequirementToPrompt(requirementText, false);
      }
    });
  });

  // AI Tools
  const toolButtons = document.querySelectorAll(".ai-tool-btn");
  toolButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const url = btn.dataset.url;
      const outputText = document.getElementById("output").value.trim();
      if (!outputText) {
        showNotification("No prompt to copy yet.");
        return;
      }
      copyToClipboard(outputText);
      showNotification("Prompt copied. Opening AI tool in a new tab...");
      window.open(url, "_blank", "noopener");
    });
  });
}

// ----- Template Modal Helpers -----
function openTemplateModal() {
  editingTemplateId = null;
  document.getElementById("templateName").value = "";
  document.getElementById("templateDescription").value = "";
  document.getElementById("templateContent").value = "";
  document.getElementById("templateCategory").value = "communication";
  document.getElementById("templateExample").value = "";
  const modal = document.getElementById("templateModal");
  if (modal) modal.style.display = "flex";
}

function closeTemplateModal() {
  const modal = document.getElementById("templateModal");
  if (modal) modal.style.display = "none";
}

// ----- Requirement Handling -----
function handleRequirementInput() {
  const input = document.getElementById("requirement");
  if (!input) return;
  const text = input.value || "";

  updateStats(text);

  const { role, preset, label } = getRoleAndPreset(text);
  lastRole = role;
  lastTaskLabel = label;

  if (!userPresetLocked) {
    lastPresetSource = "auto";
    setCurrentPreset(preset);
  }

  if (autoConvertEnabled) {
    scheduleAutoConvert();
  } else {
    clearAutoConvertTimer();
  }
}

function updateStats(text) {
  const chars = text.length;
  const words = text.trim()
    ? text
        .trim()
        .split(/\s+/)
        .length
    : 0;

  const cc = document.getElementById("charCount");
  const wc = document.getElementById("wordCount");
  if (cc) cc.textContent = chars;
  if (wc) wc.textContent = words;
}

// Auto-convert timer helpers
function scheduleAutoConvert() {
  clearAutoConvertTimer();
  if (!autoConvertEnabled) return;

  autoConvertCountdown = autoConvertDelay;
  const timerDisplay = document.getElementById("timerDisplay");
  const timerValue = document.getElementById("timerValue");

  if (timerDisplay && timerValue) {
    timerDisplay.style.display = "inline-flex";
    timerValue.textContent = `${autoConvertCountdown}s`;
  }

  countdownInterval = setInterval(() => {
    autoConvertCountdown--;
    if (timerValue) {
      timerValue.textContent = `${autoConvertCountdown}s`;
    }
    if (autoConvertCountdown <= 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);

  autoConvertTimer = setTimeout(() => {
    const input = document.getElementById("requirement");
    if (input && input.value.trim()) {
      convertRequirementToPrompt(input.value.trim(), false);
    }
    if (timerDisplay) timerDisplay.style.display = "none";
  }, autoConvertDelay * 1000);
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
  const timerDisplay = document.getElementById("timerDisplay");
  if (timerDisplay) timerDisplay.style.display = "none";
}

// ----- Conversion Logic -----
async function convertRequirementToPrompt(requirement, trackUsage = false) {
  const output = document.getElementById("output");
  if (!output) return;

  if (!requirement.trim()) {
    showNotification("Please enter your requirement first.");
    return;
  }

  const { role, preset, label } = getRoleAndPreset(requirement);
  lastRole = role;
  lastTaskLabel = label;

  if (!userPresetLocked) {
    lastPresetSource = "auto";
    setCurrentPreset(preset);
  }

  const templateFn = PRESETS[currentPreset] || PRESETS.default;
  const structuredPrompt = templateFn(role, requirement);

  output.value = structuredPrompt;
  updateStats(structuredPrompt);
  lastConvertedText = structuredPrompt;
  isConverted = true;

  setLaunchButtonsEnabled(true);

  saveToHistory(requirement, structuredPrompt);

  if (trackUsage) {
    incrementUsageCount();
  }
}

// Usage tracking
function loadUsageCount() {
  const saved = localStorage.getItem("usageCount");
  usageCount = saved ? parseInt(saved, 10) : 0;
}

function incrementUsageCount() {
  usageCount += 1;
  localStorage.setItem("usageCount", usageCount.toString());
}

// ----- OpenAI Integration (Optional in-app convert) -----
async function callOpenAI(prompt) {
  const apiKey = (localStorage.getItem("OPENAI_API_KEY") || "").trim();
  if (!apiKey) {
    showNotification("Add your OpenAI API key in Settings to use in-app conversion.");
    return null;
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that refines and improves user prompts for AI tools."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      showNotification("OpenAI API error. Check console for details.");
      return null;
    }

    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content?.trim() || null;
    return content;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    showNotification("Network error while calling OpenAI.");
    return null;
  }
}

// ----- Utilities -----
function copyToClipboard(text) {
  if (!navigator.clipboard) {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
    return;
  }
  navigator.clipboard.writeText(text);
}

function exportPrompt(prompt) {
  const blob = new Blob([prompt], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prompt.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showNotification(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}
