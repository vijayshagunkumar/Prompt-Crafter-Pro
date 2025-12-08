// Prompt Crafter Pro - app.js

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

// Template categories for Template Library
const TEMPLATE_CATEGORIES = {
  communication: { name: "Communication", icon: "fa-envelope", color: "#3b82f6" },
  coding:        { name: "Coding",        icon: "fa-code",     color: "#10b981" },
  writing:       { name: "Writing",      icon: "fa-pen",      color: "#8b5cf6" },
  analysis:      { name: "Analysis",     icon: "fa-chart-bar",color: "#f59e0b" },
  business:      { name: "Business",     icon: "fa-briefcase",color: "#ef4444" },
  creative:      { name: "Creative",     icon: "fa-palette",  color: "#ec4899" },
  education:     { name: "Education",    icon: "fa-graduation-cap", color: "#06b6d4" },
  other:         { name: "Other",        icon: "fa-th",       color: "#6b7280" }
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

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

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
  document.getElementById("settingsModal").style.display = "none";
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
        ${(template.description || "").substring(0, 120)}${(template.description || "").length > 120 ? "..." : ""}
      </div>
      <div class="template-actions">
        <button class="btn btn-small" style="background:${categoryMeta.color}" onclick="useTemplate('${template.id}')">
          <i class="fas fa-play"></i> Use
        </button>
        <button class="btn btn-small btn-secondary" onclick="editTemplate('${template.id}')">
          <i class="fas fa-edit"></i>
        </button>
        ${
          !template.isDefault
            ? `<button class="btn btn-small btn-danger" onclick="deleteTemplate('${template.id}')">
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
  const active = document.querySelector(`.template-category[data-category="${category}"]`);
  if (active) active.classList.add("active");

  const currentSearch =
    searchQuery || document.getElementById("templateSearch").value;
  loadTemplatesToUI(category, currentSearch);
}

function saveTemplate() {
  const name = document.getElementById("templateName").value.trim();
  const description = document.getElementById("templateDescription").value.trim();
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
  document.getElementById("templateModal").style.display = "none";
  showNotification(`Template "${name}" saved`);
}

function editTemplate(id) {
  const template = templates.find((t) => t.id === id);
  if (!template) return;

  editingTemplateId = id;
  document.getElementById("modalTitle").textContent = "Edit Template";
  document.getElementById("templateName").value = template.name;
  document.getElementById("templateDescription").value = template.description || "";
  document.getElementById("templateContent").value = template.content || "";
  document.getElementById("templateCategory").value = template.category || "other";
  document.getElementById("templateExample").value = template.example || "";
  document.getElementById("templateModal").style.display = "flex";
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
      <div class="history-item-title">${(item.requirement || "").slice(0, 80)}${item.requirement.length > 80 ? "..." : ""}</div>
      <div class="history-item-meta">${new Date(item.createdAt).toLocaleString()}</div>
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
  // templates panel initially hidden; history panel hidden
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

  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);

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

  // Requirement input
  const requirementEl = document.getElementById("requirement");
  requirementEl.addEventListener("input", handleRequirementInput);

  // Auto-convert toggle
  document.getElementById("autoConvert").addEventListener("change", (e) => {
    autoConvertEnabled = e.target.checked;
    if (!autoConvertEnabled) {
      clearAutoConvertTimer();
    } else if (requirementEl.value.trim() && !isConverted) {
      resetAutoConvertTimer();
    }
  });

  // Preset selection (manual override)
  document.querySelectorAll(".preset-option").forEach((option) => {
    option.addEventListener("click", () => {
      const presetId = option.dataset.preset;
      userPresetLocked = true;
      lastPresetSource = "manual";
      setCurrentPreset(presetId);

      if (document.getElementById("requirement").value.trim() && isConverted) {
        isConverted = false;
        generatePrompt();
      } else {
        updatePresetInfo(lastTaskLabel, currentPreset, "manual");
      }
    });
  });

  // Examples
  document.querySelectorAll(".example-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      requirementEl.value = btn.dataset.example;
      requirementEl.focus();
      isConverted = false;
      document.getElementById("convertBtn").disabled = false;
      document.getElementById("convertedBadge").style.display = "none";
      generatePrompt();
    });
  });

  // Convert button
  document.getElementById("convertBtn").addEventListener("click", generatePrompt);

  // AI Tools (copy + open)
  document.getElementById("chatgptBtn")
    .addEventListener("click", () => openAITool("ChatGPT", "https://chat.openai.com/"));

  document.getElementById("claudeBtn")
    .addEventListener("click", () => openAITool("Claude", "https://claude.ai/new"));

  document.getElementById("geminiBtn")
    .addEventListener("click", () => openAITool("Gemini", "https://gemini.google.com/app"));

  document.getElementById("perplexityBtn")
    .addEventListener("click", () => openAITool("Perplexity", "https://www.perplexity.ai/"));

  document.getElementById("deepseekBtn")
    .addEventListener("click", () => openAITool("DeepSeek", "https://chat.deepseek.com/"));

  document.getElementById("copilotBtn")
    .addEventListener("click", () => openAITool("Copilot", "https://copilot.microsoft.com/"));

  document.getElementById("grokBtn")
    .addEventListener("click", () => openAITool("Grok", "https://x.ai/"));

  // Export
  document.getElementById("exportBtn").addEventListener("click", exportPrompt);

  // History toggle + clear
  document.getElementById("toggleHistoryBtn").addEventListener("click", () => {
    const panel = document.getElementById("historyPanel");
    if (!panel) return;
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  });

  document.getElementById("clearHistoryBtn").addEventListener("click", clearHistory);

  // Template listeners
  setupTemplateListeners();
}

// Template listeners (UI)
function setupTemplateListeners() {
  // Toggle templates panel
  document.getElementById("toggleTemplatesBtn").addEventListener("click", () => {
    const panel = document.getElementById("templatesPanel");
    const btn = document.getElementById("toggleTemplatesBtn");

    if (panel.style.display === "none") {
      panel.style.display = "block";
      btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
      loadCategories();
      loadTemplatesToUI();
    } else {
      panel.style.display = "none";
      btn.innerHTML = '<i class="fas fa-eye"></i> Show';
    }
  });

  // Template search
  document
    .getElementById("templateSearch")
    .addEventListener("input", function () {
      const activeCategory =
        document.querySelector(".template-category.active")?.dataset.category ||
        "all";
      filterTemplatesUI(activeCategory, this.value);
    });

  // New template
  document.getElementById("newTemplateBtn").addEventListener("click", () => {
    editingTemplateId = null;
    document.getElementById("modalTitle").textContent = "New Template";
    document.getElementById("templateName").value = "";
    document.getElementById("templateDescription").value = "";
    document.getElementById("templateContent").value =
      document.getElementById("output").value || "";
    document.getElementById("templateCategory").value = "communication";
    document.getElementById("templateExample").value =
      document.getElementById("requirement").value || "";
    document.getElementById("templateModal").style.display = "flex";
  });

  // Save as template (from existing output)
  const saveAsTemplateBtn = document.getElementById("saveAsTemplateBtn");
  if (saveAsTemplateBtn) {
    saveAsTemplateBtn.addEventListener("click", () => {
      if (!document.getElementById("output").value.trim()) {
        showNotification(
          "Generate a prompt first before saving as template"
        );
        return;
      }

      editingTemplateId = null;
      document.getElementById("modalTitle").textContent = "Save as Template";
      document.getElementById("templateName").value = `Prompt ${new Date().toLocaleDateString()}`;
      document.getElementById("templateDescription").value =
        "Custom prompt template";
      document.getElementById("templateContent").value =
        document.getElementById("output").value;
      document.getElementById("templateCategory").value = "other";
      document.getElementById("templateExample").value =
        document.getElementById("requirement").value || "";
      document.getElementById("templateModal").style.display = "flex";
    });
  }

  // Save template
  document.getElementById("saveTemplateBtn").addEventListener("click", saveTemplate);

  // Close template modal
  document.getElementById("closeTemplateBtn").addEventListener("click", () => {
    document.getElementById("templateModal").style.display = "none";
  });

  document.getElementById("cancelTemplateBtn").addEventListener("click", () => {
    document.getElementById("templateModal").style.display = "none";
  });
}

// Make template functions globally available (for onclick)
window.clearHistory = clearHistory;
window.useTemplate = function (id) {
  const template = templates.find((t) => t.id === id);
  if (template) {
    // Update usage count
    template.usageCount = (template.usageCount || 0) + 1;
    localStorage.setItem("promptTemplates", JSON.stringify(templates));

    // Fill requirement with example
    document.getElementById("requirement").value = template.example || "";

    // Generate prompt from template content (simple: just use content)
    document.getElementById("output").value = template.content;
    updateStats(template.content);
    showNotification("Template loaded into prompt");
  }
};
window.editTemplate = editTemplate;
window.deleteTemplate = deleteTemplate;

// ----- Usage Count -----
function loadUsageCount() {
  const savedUsage = localStorage.getItem("promptCrafterUsage");
  if (savedUsage) {
    usageCount = parseInt(savedUsage, 10);
    document.getElementById(
      "usageCount"
    ).textContent = `${usageCount} prompts generated`;
  }
}

// ----- Auto-convert -----
function handleRequirementInput() {
  const text = document.getElementById("requirement").value;
  isConverted = false;
  document.getElementById("convertedBadge").style.display = "none";
  document.getElementById("convertBtn").disabled = !text.trim();

  if (autoConvertEnabled) {
    resetAutoConvertTimer();
  }
  updateStats(text);
}

function resetAutoConvertTimer() {
  clearAutoConvertTimer();

  const requirement = document.getElementById("requirement").value.trim();
  if (autoConvertEnabled && requirement && !isConverted) {
    autoConvertCountdown = autoConvertDelay;
    document.getElementById(
      "timerValue"
    ).textContent = `${autoConvertCountdown}s`;
    document.getElementById("timerDisplay").style.display = "inline-flex";

    countdownInterval = setInterval(() => {
      autoConvertCountdown--;
      document.getElementById(
        "timerValue"
      ).textContent = `${autoConvertCountdown}s`;

      if (autoConvertCountdown <= 0) {
        clearInterval(countdownInterval);
        document.getElementById("timerDisplay").style.display = "none";
        if (requirement && requirement !== lastConvertedText) {
          generatePrompt();
        }
      }
    }, 1000);

    autoConvertTimer = setTimeout(() => {
      const currentRequirement =
        document.getElementById("requirement").value.trim();
      if (currentRequirement && currentRequirement !== lastConvertedText) {
        generatePrompt();
      }
    }, autoConvertDelay * 1000);
  }
}

function clearAutoConvertTimer() {
  clearTimeout(autoConvertTimer);
  clearInterval(countdownInterval);
  const timerDisplay = document.getElementById("timerDisplay");
  if (timerDisplay) timerDisplay.style.display = "none";
}

// ----- Stats -----
function updateStats(text) {
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text.split("\n").length;

  document.getElementById(
    "charCount"
  ).textContent = `${charCount} characters`;
  document.getElementById("wordCount").textContent = `${wordCount} words`;
  document.getElementById("lineCount").textContent = `${lineCount} lines`;
}

// Clean up any bad output from the finetuned model
function sanitizePrompt(text) {
  if (!text) return "";
  let cleaned = text;

  // Strip code fences if present
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

  // Soft replacements if anything slipped inside a line
  cleaned = cleaned.replace(/prompt generator/gi, "assistant");
  cleaned = cleaned.replace(
    /generate a prompt/gi,
    "perform the task and return the final answer"
  );

  return cleaned.trim();
}

// ----- Generation -----
async function generatePrompt() {
  const requirementEl = document.getElementById("requirement");
  const outputEl = document.getElementById("output");
  const convertBtn = document.getElementById("convertBtn");
  const raw = requirementEl.value.trim();

  if (!raw) {
    showNotification("Please enter a requirement first");
    return "";
  }

  // Smart auto-preset (only if user didn't lock)
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

  // Track usage
  usageCount++;
  localStorage.setItem("promptCrafterUsage", usageCount);
  document.getElementById(
    "usageCount"
  ).textContent = `${usageCount} prompts generated`;

  const apiKey = localStorage.getItem("OPENAI_API_KEY")?.trim();

  // Show converting state
  convertBtn.disabled = true;
  convertBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Converting...';
  clearAutoConvertTimer();

  let generatedPrompt;

  try {
    if (!apiKey) {
      // Use local formatter
      generatedPrompt = localFormatter(raw);
    } else {
      // Use API with template filling
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
    updateStats(generatedPrompt);
    saveToHistory(raw, generatedPrompt);

    // Update state
    isConverted = true;
    lastConvertedText = raw;
    convertBtn.disabled = true;
    document.getElementById("convertedBadge").style.display = "inline-flex";

    showNotification("Prompt generated successfully");

    if (autoConvertEnabled) {
      resetAutoConvertTimer();
    }

    return generatedPrompt;
  } catch (err) {
    console.error("Generation error:", err);
    generatedPrompt = sanitizePrompt(localFormatter(raw));
    outputEl.value = generatedPrompt;
    updateStats(generatedPrompt);
    saveToHistory(raw, generatedPrompt);
    showNotification("Generated with local template");

    isConverted = true;
    lastConvertedText = raw;
    convertBtn.disabled = true;
    document.getElementById("convertedBadge").style.display = "inline-flex";

    return generatedPrompt;
  } finally {
    convertBtn.disabled = false;
    convertBtn.innerHTML = '<i class="fas fa-magic"></i> Convert to Prompt';
  }
}

function localFormatter(raw) {
  const clean = (raw || "").trim() || "[No requirement provided]";
  const { role, preset: autoPreset, label } = getRoleAndPreset(clean);

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

  const template = PRESETS[currentPreset];
  return template ? template(role, clean) : PRESETS["default"](role, clean);
}

// ----- Clipboard & AI Tool Integration -----
async function copyToClipboard() {
  const outputEl = document.getElementById("output");
  if (!outputEl.value) {
    showNotification("No prompt to copy. Generate one first.");
    return false;
  }

  try {
    await navigator.clipboard.writeText(outputEl.value);
    return true;
  } catch (err) {
    // Fallback
    const textArea = document.createElement("textarea");
    textArea.value = outputEl.value;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (err2) {
      document.body.removeChild(textArea);
      showNotification("Failed to copy. Please copy manually.");
      return false;
    }
  }
}

async function openAITool(platform, url) {
  const outputEl = document.getElementById("output");
  if (!outputEl.value || !isConverted) {
    await generatePrompt();
  }

  const copied = await copyToClipboard();
  if (!copied) return;

  showNotification(`Prompt copied! Opening ${platform}...`);

  try {
    window.open(url, "_blank");
  } catch (err) {
    showNotification(
      `${platform} blocked by popup blocker. Please allow popups.`
    );
  }
}

// ----- Export -----
function exportPrompt() {
  const outputEl = document.getElementById("output");
  if (!outputEl.value) {
    showNotification("Generate a prompt first");
    return;
  }

  const blob = new Blob([outputEl.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prompt.txt";
  a.click();
  URL.revokeObjectURL(url);
  showNotification("Prompt exported as prompt.txt");
}

// ----- Notification -----
function showNotification(message) {
  const notification = document.getElementById("notification");
  document.getElementById("notificationText").textContent = message;
  notification.style.display = "flex";
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}
