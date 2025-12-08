// Application State
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "ft:gpt-3.5-turbo-1106:personal::CkAjxivm";

let currentPreset = "default";
let userPresetLocked = false; // NEW: when user clicks a preset, we stop auto-switching
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

// Template categories
const TEMPLATE_CATEGORIES = {
  communication: { name: "Communication", icon: "fa-envelope", color: "#3b82f6" },
  coding: { name: "Coding", icon: "fa-code", color: "#10b981" },
  writing: { name: "Writing", icon: "fa-pen", color: "#8b5cf6" },
  analysis: { name: "Analysis", icon: "fa-chart-bar", color: "#f59e0b" },
  business: { name: "Business", icon: "fa-briefcase", color: "#ef4444" },
  creative: { name: "Creative", icon: "fa-palette", color: "#ec4899" },
  education: { name: "Education", icon: "fa-graduation-cap", color: "#06b6d4" },
  other: { name: "Other", icon: "fa-th", color: "#6b7280" }
};

// Default templates
const DEFAULT_TEMPLATES = [
  {
    id: "1",
    name: "Professional Email",
    description: "Write clear, professional emails for business communication",
    category: "communication",
    tags: ["email", "professional", "business"],
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
    example:
      "Write a professional email to my manager requesting a meeting to discuss project timeline adjustments.",
    usageCount: 5,
    createdAt: Date.now() - 86400000,
    isDefault: true
  },
  {
    id: "2",
    name: "Code Review Request",
    description: "Request code reviews from team members effectively",
    category: "coding",
    tags: ["code", "review", "team"],
    content: `# Role
You are an experienced software developer who needs code review.

# Objective
Request code review for [FEATURE/BUG_FIX] from [TEAM_MEMBER/TEAM]

# Context
- PR/MR Link: [LINK]
- Changes: [BRIEF_DESCRIPTION]
- Testing: [WHAT_WAS_TESTED]

# Instructions
1. Mention specific files/lines to review
2. Explain the change briefly
3. Mention any concerns or trade-offs
4. Specify what kind of feedback you need
5. Provide context if needed

# Notes
- Be specific about what to review
- Mention deadlines if any
- Thank the reviewer in advance`,
    example:
      "Request code review for the new user authentication system from the backend team.",
    usageCount: 3,
    createdAt: Date.now() - 172800000,
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
3. Do **not** talk about prompts, prompt generation, or instructions.
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

// -------- Helper: set preset + sync UI ----------
function setCurrentPreset(presetId) {
  if (!PRESETS[presetId]) return;
  currentPreset = presetId;
  document
    .querySelectorAll(".preset-option")
    .forEach((o) => {
      o.classList.toggle("active", o.dataset.preset === presetId);
    });
}

// -------- Helper: classify role + BEST preset ----------
function getRoleAndPreset(text) {
  const lower = (text || "").toLowerCase();
  let role = "expert assistant";
  let preset = "default";

  if (/email|mail|send.*to|message.*to|follow[- ]up/i.test(lower)) {
    role = "expert email writer";
    preset = "default";
  } else if (
    /code|program|script|develop|software|function|python|javascript|typescript|java|c#|sql|api|bug fix|refactor/i.test(
      lower
    )
  ) {
    role = "expert developer";
    preset = "chatgpt";
  } else if (
    /analyze|analysis|market|research|evaluate|assessment|review|trend|report|insight|metrics/i.test(
      lower
    )
  ) {
    role = "expert analyst";
    preset = "detailed";
  } else if (
    /blog|article|story|linkedin post|caption|copywriting|content/i.test(lower)
  ) {
    role = "expert content writer";
    preset = "default";
  } else if (
    /workout|exercise|fitness|gym|diet|meal plan|training plan/i.test(lower)
  ) {
    role = "expert fitness trainer";
    preset = "detailed";
  } else if (
    /strategy|business plan|roadmap|pitch deck|proposal|go[- ]to[- ]market|g2m/i.test(
      lower
    )
  ) {
    role = "expert business consultant";
    preset = "detailed";
  } else if (
    /teach|explain|lesson|tutorial|guide|training material|curriculum/i.test(
      lower
    )
  ) {
    role = "expert educator";
    preset = "detailed";
  }

  return { role, preset };
}

// Backwards compatible helper
function getAppropriateRole(text) {
  return getRoleAndPreset(text).role;
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  loadSettings();
  loadTemplates();
  loadUsageCount();
  setupEventListeners();
  initializeUI();
  setCurrentPreset(currentPreset); // sync UI with default
  document.getElementById("requirement").focus();
}

function loadSettings() {
  const apiKey = localStorage.getItem("OPENAI_API_KEY") || "";
  const delay = localStorage.getItem("autoConvertDelay") || "60";
  const theme = localStorage.getItem("theme") || "light";

  document.getElementById("apiKeyInput").value = apiKey;
  document.getElementById("autoConvertDelay").value = delay;
  document.getElementById("themeSelect").value = theme;
  document.getElementById("delayValue").textContent = `Current: ${delay} seconds`;

  autoConvertDelay = parseInt(delay, 10);
  autoConvertCountdown = autoConvertDelay;
}

function loadTemplates() {
  const savedTemplates = localStorage.getItem("promptTemplates");
  if (savedTemplates) {
    templates = JSON.parse(savedTemplates);
  } else {
    templates = DEFAULT_TEMPLATES;
    localStorage.setItem("promptTemplates", JSON.stringify(templates));
  }
}

function loadUsageCount() {
  const savedUsage = localStorage.getItem("promptCrafterUsage");
  if (savedUsage) {
    usageCount = parseInt(savedUsage, 10);
    document.getElementById(
      "usageCount"
    ).textContent = `${usageCount} prompts generated`;
  }
}

function setupEventListeners() {
  // Settings
  document.getElementById("settingsBtn").addEventListener("click", () => {
    document.getElementById("settingsModal").style.display = "flex";
  });

  document
    .getElementById("closeSettingsBtn")
    .addEventListener("click", () => {
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
  delaySlider.addEventListener("input", () => {
    delayValue.textContent = `Current: ${delaySlider.value} seconds`;
    autoConvertDelay = parseInt(delaySlider.value, 10);
  });

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
      userPresetLocked = true; // once user picks, don't auto-switch
      setCurrentPreset(presetId);
      if (requirementEl.value.trim() && isConverted) {
        isConverted = false;
        generatePrompt();
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
  document
    .getElementById("convertBtn")
    .addEventListener("click", generatePrompt);

  // Copy button
  document.getElementById("copyBtn").addEventListener("click", async () => {
    if (!document.getElementById("output").value) await generatePrompt();
    await copyToClipboard();
    showNotification("Prompt copied to clipboard!");
  });

  // AI Tools
  document
    .getElementById("chatgptBtn")
    .addEventListener("click", () =>
      openAITool("ChatGPT", "https://chat.openai.com/")
    );
  document
    .getElementById("claudeBtn")
    .addEventListener("click", () =>
      openAITool("Claude", "https://claude.ai/new")
    );
  document
    .getElementById("geminiBtn")
    .addEventListener("click", () =>
      openAITool("Gemini", "https://gemini.google.com/app")
    );
  document
    .getElementById("perplexityBtn")
    .addEventListener("click", () =>
      openAITool("Perplexity", "https://www.perplexity.ai/")
    );
  document
    .getElementById("deepseekBtn")
    .addEventListener("click", () =>
      openAITool("DeepSeek", "https://chat.deepseek.com/")
    );

  // Export
  document.getElementById("exportBtn").addEventListener("click", exportPrompt);

  // History
  document
    .getElementById("toggleHistoryBtn")
    .addEventListener("click", toggleHistory);
  document
    .getElementById("clearHistoryBtn")
    .addEventListener("click", clearHistory);

  // Template functionality
  setupTemplateListeners();
}

function initializeUI() {
  updateStats("");
  loadHistory();
}

// Core Functions
function handleRequirementInput() {
  const requirementEl = document.getElementById("requirement");
  const convertBtn = document.getElementById("convertBtn");

  if (isConverted && requirementEl.value.trim() !== lastConvertedText) {
    isConverted = false;
    convertBtn.disabled = false;
    document.getElementById("convertedBadge").style.display = "none";
    document.getElementById("timerDisplay").style.display = "none";
    clearAutoConvertTimer();
  }

  // If user hasn't clicked a preset, auto-select best preset based on text
  if (!userPresetLocked) {
    const { preset } = getRoleAndPreset(requirementEl.value);
    if (preset && preset !== currentPreset) {
      setCurrentPreset(preset);
    }
  }

  if (autoConvertEnabled) {
    resetAutoConvertTimer();
  }
  updateStats(requirementEl.value);
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
  document.getElementById("timerDisplay").style.display = "none";
}

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
  const { role, preset: autoPreset } = getRoleAndPreset(raw);
  if (!userPresetLocked && autoPreset && PRESETS[autoPreset]) {
    setCurrentPreset(autoPreset);
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
    convertBtn.disabled = true;
    convertBtn.innerHTML = '<i class="fas fa-magic"></i> Convert to Prompt';
  }
}

function localFormatter(raw) {
  const clean = (raw || "").trim() || "[No requirement provided]";
  const { role, preset: autoPreset } = getRoleAndPreset(clean);

  if (!userPresetLocked && autoPreset && PRESETS[autoPreset]) {
    setCurrentPreset(autoPreset);
  }

  const template = PRESETS[currentPreset];
  return template ? template(role, clean) : PRESETS["default"](role, clean);
}

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

function exportPrompt() {
  const outputEl = document.getElementById("output");
  if (!outputEl.value) {
    showNotification("Generate a prompt first");
    return;
  }

  const blob = new Blob([outputEl.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification("Prompt exported as .txt file");
}

// Settings Functions
function saveSettings() {
  const apiKey = document.getElementById("apiKeyInput").value.trim();
  const delay = document.getElementById("autoConvertDelay").value;
  const theme = document.getElementById("themeSelect").value;

  localStorage.setItem("OPENAI_API_KEY", apiKey);
  localStorage.setItem("autoConvertDelay", delay);
  localStorage.setItem("theme", theme);

  autoConvertDelay = parseInt(delay, 10);
  autoConvertCountdown = autoConvertDelay;

  document.getElementById("settingsModal").style.display = "none";
  showNotification("Settings saved successfully!");
}

function clearAllData() {
  localStorage.removeItem("promptTemplates");
  localStorage.removeItem("promptHistory");
  localStorage.removeItem("promptCrafterUsage");

  // Keep settings
  const apiKey = localStorage.getItem("OPENAI_API_KEY");
  const delay = localStorage.getItem("autoConvertDelay");
  const theme = localStorage.getItem("theme");

  localStorage.clear();

  if (apiKey) localStorage.setItem("OPENAI_API_KEY", apiKey);
  if (delay) localStorage.setItem("autoConvertDelay", delay);
  if (theme) localStorage.setItem("theme", theme);

  // Reset state
  usageCount = 0;
  templates = [...DEFAULT_TEMPLATES];
  isConverted = false;
  lastConvertedText = "";

  // Reset UI
  document.getElementById("requirement").value = "";
  document.getElementById("output").value = "";
  document.getElementById("usageCount").textContent = "0 prompts generated";
  document.getElementById("historyList").innerHTML = "";
  document.getElementById("templatesGrid").innerHTML = "";
  updateStats("");

  // Clear badges
  document.getElementById("convertedBadge").style.display = "none";
  document.getElementById("timerDisplay").style.display = "none";
  document.getElementById("convertBtn").disabled = false;

  // Save default templates
  localStorage.setItem("promptTemplates", JSON.stringify(templates));

  document.getElementById("settingsModal").style.display = "none";
  showNotification("All data cleared successfully!");
}

// History Functions
function saveToHistory(requirement, prompt) {
  const history = JSON.parse(localStorage.getItem("promptHistory") || "[]");
  const item = {
    id: Date.now(),
    requirement:
      requirement.substring(0, 100) +
      (requirement.length > 100 ? "..." : ""),
    prompt: prompt,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }),
    date: new Date().toLocaleDateString(),
    fullRequirement: requirement
  };

  history.unshift(item);
  if (history.length > 15) history.pop();

  localStorage.setItem("promptHistory", JSON.stringify(history));
  localStorage.setItem(`fullReq_${item.id}`, requirement);
  loadHistory();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("promptHistory") || "[]");
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML =
      '<div style="text-align: center; color: var(--muted); padding: 20px; font-size: 13px;">No history yet</div>';
    return;
  }

  history.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight:500; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.requirement}</div>
        <div style="font-size:11px;color:var(--muted)">${item.date} ${item.timestamp}</div>
      </div>
      <button class="btn small" style="padding:6px 12px;font-size:12px; flex-shrink: 0;" onclick="event.stopPropagation();useHistoryItem('${item.id}')">Use</button>
    `;
    div.addEventListener("click", (e) => {
      if (!e.target.closest("button")) {
        const requirementEl = document.getElementById("requirement");
        const outputEl = document.getElementById("output");
        requirementEl.value =
          localStorage.getItem(`fullReq_${item.id}`) || item.requirement;
        outputEl.value = item.prompt;
        updateStats(item.prompt);
        isConverted = true;
        lastConvertedText = requirementEl.value.trim();
        document.getElementById("convertBtn").disabled = true;
        document.getElementById("convertedBadge").style.display = "inline-flex";
        showNotification("Prompt loaded from history");
      }
    });
    historyList.appendChild(div);
  });
}

function toggleHistory() {
  const panel = document.getElementById("historyPanel");
  const isVisible = panel.style.display === "block";
  panel.style.display = isVisible ? "none" : "block";
  if (!isVisible) loadHistory();
}

function clearHistory() {
  if (confirm("Are you sure you want to clear all history?")) {
    localStorage.removeItem("promptHistory");
    loadHistory();
    showNotification("History cleared");
  }
}

// Template Functions
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

  // Save as template
  document
    .getElementById("saveAsTemplateBtn")
    .addEventListener("click", () => {
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

  // Save template
  document
    .getElementById("saveTemplateBtn")
    .addEventListener("click", saveTemplate);

  // Close template modal
  document
    .getElementById("closeTemplateBtn")
    .addEventListener("click", () => {
      document.getElementById("templateModal").style.display = "none";
    });

  document
    .getElementById("cancelTemplateBtn")
    .addEventListener("click", () => {
      document.getElementById("templateModal").style.display = "none";
    });
}

function loadCategories() {
  const container = document.getElementById("templateCategories");
  container.innerHTML = "";

  // All category
  const allCat = document.createElement("div");
  allCat.className = "template-category active";
  allCat.dataset.category = "all";
  allCat.innerHTML = '<i class="fas fa-th"></i> All';
  allCat.addEventListener("click", () => filterTemplatesUI("all"));
  container.appendChild(allCat);

  // Other categories
  Object.keys(TEMPLATE_CATEGORIES).forEach((id) => {
    const cat = TEMPLATE_CATEGORIES[id];
    const catEl = document.createElement("div");
    catEl.className = "template-category";
    catEl.dataset.category = id;
    catEl.innerHTML = `<i class="fas ${cat.icon}"></i> ${cat.name}`;
    catEl.addEventListener("click", () => filterTemplatesUI(id));
    container.appendChild(catEl);
  });
}

function loadTemplatesToUI(filterCategory = "all", searchQuery = "") {
  const grid = document.getElementById("templatesGrid");
  const empty = document.getElementById("emptyTemplates");

  grid.innerHTML = "";

  let filtered = templates;

  if (filterCategory !== "all") {
    filtered = filtered.filter((t) => t.category === filterCategory);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query)))
    );
  }

  if (filtered.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  filtered.forEach((template) => {
    const category = TEMPLATE_CATEGORIES[template.category];
    const card = document.createElement("div");
    card.className = "template-card";
    card.innerHTML = `
      <div class="template-icon" style="background:${category.color}">
        <i class="fas ${category.icon}"></i>
      </div>
      <div class="template-title">${template.name}</div>
      <div class="template-desc">${template.description}</div>
      <div class="template-meta">
        <span><i class="fas fa-download"></i> Used ${
          template.usageCount || 0
        } times</span>
        <span class="tag"><i class="fas fa-tag"></i> ${category.name}</span>
      </div>
      <div class="template-actions">
        <button class="btn small" style="background:${category.color}" onclick="useTemplate('${template.id}')">
          <i class="fas fa-play"></i> Use
        </button>
        <button class="btn small" style="background:#64748b" onclick="editTemplate('${template.id}')">
          <i class="fas fa-edit"></i>
        </button>
        ${
          !template.isDefault
            ? `<button class="btn small" style="background:#ef4444" onclick="deleteTemplate('${template.id}')">
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
  document
    .querySelector(`.template-category[data-category="${category}"]`)
    .classList.add("active");

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
    // Update existing template
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
    // Add new template
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

// Utility Functions
function showNotification(message) {
  const notification = document.getElementById("notification");
  document.getElementById("notificationText").textContent = message;
  notification.style.display = "flex";
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

// Make functions globally available
window.clearHistory = clearHistory;
window.useTemplate = function (id) {
  const template = templates.find((t) => t.id === id);
  if (template) {
    // Update usage count
    template.usageCount = (template.usageCount || 0) + 1;
    localStorage.setItem("promptTemplates", JSON.stringify(templates));

    // Fill requirement with example
    document.getElementById("requirement").value = template.example || "";

    // Generate prompt from template content
    document.getElementById("output").value = template.content;
    updateStats(template.content);

    // Update state
    isConverted = true;
    lastConvertedText = document
      .getElementById("requirement")
      .value.trim();
    document.getElementById("convertBtn").disabled = true;
    document.getElementById("convertedBadge").style.display = "inline-flex";

    showNotification(`Using "${template.name}" template`);
  }
};

window.editTemplate = function (id) {
  const template = templates.find((t) => t.id === id);
  if (template) {
    editingTemplateId = id;
    document.getElementById("modalTitle").textContent = "Edit Template";
    document.getElementById("templateName").value = template.name;
    document.getElementById("templateDescription").value =
      template.description;
    document.getElementById("templateContent").value = template.content;
    document.getElementById("templateCategory").value = template.category;
    document.getElementById("templateExample").value = template.example || "";

    document.getElementById("templateModal").style.display = "flex";
  }
};

window.deleteTemplate = function (id) {
  if (confirm("Are you sure you want to delete this template?")) {
    templates = templates.filter((t) => t.id !== id || t.isDefault);
    localStorage.setItem("promptTemplates", JSON.stringify(templates));
    loadTemplatesToUI();
    showNotification("Template deleted");
  }
};

window.useHistoryItem = function (id) {
  const history = JSON.parse(localStorage.getItem("promptHistory") || "[]");
  const item = history.find((h) => h.id == id);
  if (item) {
    document.getElementById("requirement").value =
      localStorage.getItem(`fullReq_${id}`) || item.requirement;
    generatePrompt();
  }
};
