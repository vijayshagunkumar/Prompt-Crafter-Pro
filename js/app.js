// PromptCraft – app.js

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
let autoConvertTimer = null;
let autoConvertCountdown = autoConvertDelay;
let countdownInterval = null;
let editingTemplateId = null;
let templates = [];
let historyItems = [];

// Textarea sizing state
const textareaSizes = {
  requirement: { height: 140 },
  output: { height: 180 }
};

// Template categories for Template Library
const TEMPLATE_CATEGORIES = {
  communication: { name: "Communication", icon: "fa-envelope", color: "#3b82f6" },
  coding:        { name: "Coding",        icon: "fa-code",     color: "#10b981" },
  writing:       { name: "Writing",       icon: "fa-pen",      color: "#8b5cf6" },
  analysis:      { name: "Analysis",      icon: "fa-chart-line",  color: "#f97316" },
  other:         { name: "Other",         icon: "fa-sparkles", color: "#e5e7eb" }
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

# Instructions
1. Use a clear subject line
2. Start with an appropriate greeting
3. Explain the purpose of the email clearly
4. Use a polite and professional tone
5. Keep paragraphs short and focused
6. End with a clear call-to-action or next steps
7. Include a professional closing and signature

# Output Format
- Subject line
- Email body in paragraph format

# Notes
- Avoid jargon unless necessary
- Use simple, easy-to-understand English`
  },
  {
    id: "2",
    name: "Product Requirement",
    description: "Structure product ideas into clear requirements",
    category: "analysis",
    content: `# Role
You are a senior product manager.

# Objective
Turn the user's idea into a clear, structured product requirement.

# Instructions
1. Identify the user persona
2. Define the core problem being solved
3. Describe the proposed solution
4. List key features and requirements
5. Outline success metrics
6. Mention dependencies and risks

# Output Format
- Persona
- Problem Statement
- Solution Overview
- Key Requirements (bulleted)
- Success Metrics
- Risks & Dependencies

# Notes
- Use crisp, business-friendly language
- Keep it skimmable for stakeholders`
  }
];

// PRESETS: How the final structured prompt is shaped
const PRESETS = {
  default: (role, requirement) => `# Role
${role}

# Objective
Carry out the following task for the user and return the finished output:

${requirement}

# Instructions
- Focus on delivering the final result (answer, email, code, etc.).
- Do not talk about prompts, prompt generation, or rewriting instructions.
- Do not restate or summarize the user's request.
- Return only the completed output.

# Notes
Maintain professional quality and clarity in your response.`,

  communication: (role, requirement) => `# Role
You are a highly skilled communication specialist.

# Objective
Turn the user's request into a clear, effective piece of communication:

${requirement}

# Instructions
- Use a tone that matches the context (professional, friendly, or neutral as appropriate).
- Structure the message with a clear beginning, middle, and end.
- Avoid jargon and keep the language simple and understandable.
- Do NOT mention that you are rewriting or optimizing a prompt.
- Deliver the communication piece ready to send.

# Output Format
Return only the final message ready to send.

# Notes
Keep it concise, specific, and audience-appropriate.`,

  coding: (role, requirement) => `# Role
You are an expert software developer.

# Objective
Fulfill the following coding-related task:

${requirement}

# Instructions
- If code is required, provide complete, working code with comments where helpful.
- Explain reasoning briefly if it helps understanding, but focus on the final code.
- Do NOT talk about prompts, prompt generation, or rewriting instructions.
- Optimize for readability and maintainability.

# Output Format
- Code (in appropriate language)
- Brief explanation only if essential.

# Notes
Follow best practices and handle edge cases when possible.`,

  writing: (role, requirement) => `# Role
You are a skilled writer and editor.

# Objective
Create a polished written piece based on this request:

${requirement}

# Instructions
- Choose the appropriate style (formal, informal, storytelling, etc.) based on context.
- Make the writing clear, engaging, and cohesive.
- Do NOT mention prompts, prompt generation, or rewriting instructions.
- Fix any grammar, clarity, or structure issues implicitly.

# Output Format
Return only the final written content.

# Notes
Aim for readability and impact.`,

  analysis: (role, requirement) => `# Role
You are an analytical expert with strong critical thinking skills.

# Objective
Respond to this analytical or comparative request:

${requirement}

# Instructions
- Break down complex ideas into clear, structured sections.
- Highlight key insights, pros/cons, and trade-offs where relevant.
- Do NOT mention prompts, prompt generation, or rewriting instructions.
- Keep explanations rigorous but understandable.

# Output Format
Use headings or bullet points if helpful, but focus on clarity of reasoning.

# Notes
Support statements with logical arguments or examples where possible.`
};

// STORAGE KEYS
const STORAGE_KEYS = {
  templates: "promptCrafterTemplates",
  history: "promptCrafterHistory"
};

// Utility – save and load JSON
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("Error loading JSON from storage", key, e);
    return fallback;
  }
}

// Usage Count
function loadUsageCount() {
  const savedUsage = localStorage.getItem("promptCrafterUsage");
  if (savedUsage) {
    usageCount = parseInt(savedUsage, 10);
  }
  document.getElementById(
    "usageCount"
  ).innerHTML = `<i class="fas fa-bolt"></i>${usageCount} prompts generated`;
}

// === AUTO-CONTEXT DETECTIVE ===

let lastDetectedContext = null;

// Detect task type, language and key entities from the requirement text
function detectContextFromText(text) {
  const raw = text || "";
  const lower = raw.toLowerCase();

  // Language detection
  const hasDevanagari = /[\u0900-\u097F]/.test(raw);
  const hasHindiWords = /\b(banao|kar do|karo|krdo|ladki|ladka|paani ki bottle|tasveer|likh do|email likh|presentation bana)\b/i.test(
    raw
  );
  let language = "english";
  if (hasDevanagari || hasHindiWords) {
    language = /[a-zA-Z]/.test(raw) ? "hinglish" : "hindi";
  }

  // Task type / intent
  let taskType = "general";
  if (
    /cartoon|illustration|image|photo|picture|poster|thumbnail|logo|banner|icon/.test(
      lower
    ) ||
    (hasHindiWords && /banao|draw|sketch/.test(lower))
  ) {
    taskType = "image_generation";
  } else if (/email|mail|subject:|dear sir|dear team/.test(lower)) {
    taskType = "email";
  } else if (/code|function|class |api|bug|error|javascript|python|sql/.test(lower)) {
    taskType = "coding";
  } else if (
    /story|poem|script|blog|article|essay|linkedin post|caption/.test(lower)
  ) {
    taskType = "writing";
  } else if (
    /analy[sz]e|analysis|compare|summarize|summary|explain|review/.test(lower)
  ) {
    taskType = "analysis";
  }

  // Audience
  let audience = null;
  if (/manager|lead|boss|stakeholder|vp|director/.test(lower)) {
    audience = "senior stakeholder";
  } else if (/team|colleagues|squad|pod/.test(lower)) {
    audience = "internal team";
  } else if (/customer|client|user|buyer/.test(lower)) {
    audience = "customer";
  }

  // Tone
  let tone = null;
  if (/formal|professional|official/.test(lower) || taskType === "email") {
    tone = "formal";
  } else if (/friendly|casual|fun/.test(lower)) {
    tone = "casual";
  } else if (/romantic|love|heartfelt|emotional/.test(lower)) {
    tone = "emotional";
  }

  // Image-specific entities
  const keyEntities = [];
  let medium = null;
  let background = null;

  if (taskType === "image_generation") {
    if (/cartoon|illustration|drawing/.test(lower)) {
      medium = "cartoon / illustration";
    } else if (/photo|photograph|realistic|hdr/.test(lower)) {
      medium = "photo-realistic";
    }

    if (/library|bookshelf|book shelf|study room/.test(lower)) {
      background = "library / bookshelves";
      keyEntities.push("library background");
    }
    if (/bottle|paani ki bottle|water bottle/.test(lower)) {
      keyEntities.push("water bottle in hand");
    }
    if (/girl|female|woman|ladki/.test(lower)) {
      keyEntities.push("female character");
    }
    if (/boy|male|man|ladka/.test(lower)) {
      keyEntities.push("male character");
    }
  }

  const context = {
    taskType,
    language,
    audience,
    tone,
    medium,
    background,
    keyEntities,
    originalText: raw
  };

  lastDetectedContext = context;
  return context;
}

// Build an enriched requirement string using the detected context
function buildContextAwareRequirement(raw, context) {
  if (!context) return raw;

  const lines = [];

  // Language hint
  if (context.language === "hindi" || context.language === "hinglish") {
    lines.push(
      "The user spoke in Hindi / Hinglish. First fully understand the intent, then write everything in clear, natural English."
    );
  }

  if (context.taskType === "image_generation") {
    lines.push(
      "Create a rich, detailed prompt for an AI image generator based on the user's description."
    );

    const summaryParts = [];
    if (context.medium) summaryParts.push(`style: ${context.medium}`);
    if (context.background) summaryParts.push(`background: ${context.background}`);
    if (context.keyEntities && context.keyEntities.length) {
      summaryParts.push("focus elements: " + context.keyEntities.join(", "));
    }

    if (summaryParts.length) {
      lines.push("Key visual context: " + summaryParts.join(" • "));
    }

    lines.push(
      "Do not change the core idea, but you may add 2–3 small, natural details to make the scene vivid."
    );
  } else if (context.taskType === "email") {
    lines.push(
      "Write a clear, concise, high-quality email that directly solves the user's need."
    );
    if (context.audience) {
      lines.push(`Audience: ${context.audience}.`);
    }
    if (context.tone) {
      lines.push(`Tone: ${context.tone}.`);
    } else {
      lines.push("Tone: formal but easy to understand.");
    }
  }

  const contextNote = lines.length
    ? "\n\nContext for this task:\n" + lines.join("\n")
    : "";

  return raw + contextNote;
}

// Render context chips under the textarea
function renderContextChips(context) {
  const row = document.getElementById("contextChipsRow");
  if (!row) return;

  row.innerHTML = "";

  if (!context || !context.taskType || !context.originalText.trim()) {
    row.style.display = "none";
    return;
  }

  row.style.display = "flex";

  const chips = [];

  const taskLabelMap = {
    image_generation: "Image / Illustration",
    email: "Email / Communication",
    coding: "Code / Dev",
    writing: "Writing",
    analysis: "Analysis / Research",
    general: "General Task"
  };
  const iconMap = {
    image_generation: "fa-image",
    email: "fa-envelope",
    coding: "fa-code",
    writing: "fa-pen",
    analysis: "fa-chart-line",
    general: "fa-wand-magic-sparkles"
  };

  chips.push({
    icon: iconMap[context.taskType] || "fa-wand-magic-sparkles",
    label: taskLabelMap[context.taskType] || "Smart Context"
  });

  if (context.language === "hindi") {
    chips.push({ icon: "fa-language", label: "Hindi → English" });
  } else if (context.language === "hinglish") {
    chips.push({ icon: "fa-language", label: "Hinglish → English" });
  }

  if (context.audience) {
    chips.push({ icon: "fa-user-group", label: `Audience: ${context.audience}` });
  }
  if (context.tone) {
    chips.push({ icon: "fa-wave-square", label: `Tone: ${context.tone}` });
  }

  if (context.medium) {
    chips.push({ icon: "fa-palette", label: context.medium });
  }
  if (context.background) {
    chips.push({ icon: "fa-mountain-city", label: context.background });
  }

  (context.keyEntities || []).slice(0, 3).forEach((entity) => {
    chips.push({ icon: "fa-tag", label: entity });
  });

  chips.forEach((chip) => {
    const btn = document.createElement("button");
    btn.className = "chip context-chip";
    btn.innerHTML = `<i class="fas ${chip.icon}"></i> ${chip.label}`;
    row.appendChild(btn);
  });
}

// Auto-convert
function handleRequirementInput() {
  const text = document.getElementById("requirement").value;

  // Auto-Context Detective – update chips as user types
  try {
    const ctx = detectContextFromText(text);
    renderContextChips(ctx);
  } catch (e) {
    console.log("Context detection error:", e);
  }

  // Clear output if user is typing new requirement
  if (isConverted && text !== lastConvertedText) {
    document.getElementById("output").value = "";
    isConverted = false;
    document.getElementById("convertedBadge").style.display = "none";
    setLaunchButtonsEnabled(false);
  }

  isConverted = false;
  document.getElementById("convertedBadge").style.display = "none";
  document.getElementById("convertBtn").disabled = !text.trim();

  setLaunchButtonsEnabled(false);

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
    autoConvertTimer = setTimeout(triggerAutoConvert, autoConvertDelay * 1000);
    countdownInterval = setInterval(updateCountdownDisplay, 1000);
    document.getElementById("timerDisplay").style.display = "inline-flex";
    updateCountdownDisplay();
  } else {
    document.getElementById("timerDisplay").style.display = "none";
  }
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
  document.getElementById("timerDisplay").style.display = "none";
}

function triggerAutoConvert() {
  clearAutoConvertTimer();
  generatePrompt();
}

function updateCountdownDisplay() {
  autoConvertCountdown = Math.max(0, autoConvertCountdown - 1);
  const timerValueEl = document.getElementById("timerValue");
  if (timerValueEl) {
    timerValueEl.textContent = `${autoConvertCountdown}s`;
  }
  if (autoConvertCountdown <= 0) {
    clearAutoConvertTimer();
  }
}

// Stats
function updateStats(text) {
  const inputStats = document.getElementById("inputStats");
  if (inputStats) {
    inputStats.textContent = `${text.length} chars`;
  }
}

function updateOutputStats() {
  const outputEl = document.getElementById("output");
  const outputStats = document.getElementById("outputStats");
  if (outputStats && outputEl) {
    outputStats.textContent = `${outputEl.value.length} chars`;
  }
}

// Role & Preset Suggestion
function getRoleAndPreset(rawRequirement) {
  const text = rawRequirement.toLowerCase();

  // Basic domain detection
  let role = "expert assistant";
  let preset = "default";
  let label = "General";

  if (
    text.includes("email") ||
    text.includes("mail") ||
    text.includes("subject:") ||
    text.includes("dear ") ||
    text.includes("notice") ||
    text.includes("letter")
  ) {
    role = "expert communication specialist";
    preset = "communication";
    label = "Communication";
  } else if (
    text.includes("code") ||
    text.includes("function") ||
    text.includes("bug") ||
    text.includes("error") ||
    text.includes("api") ||
    text.includes("script") ||
    text.includes("program")
  ) {
    role = "expert software developer";
    preset = "coding";
    label = "Coding";
  } else if (
    text.includes("story") ||
    text.includes("blog") ||
    text.includes("article") ||
    text.includes("essay") ||
    text.includes("post") ||
    text.includes("writeup") ||
    text.includes("creative")
  ) {
    role = "skilled writer";
    preset = "writing";
    label = "Writing";
  } else if (
    text.includes("analyze") ||
    text.includes("analysis") ||
    text.includes("compare") ||
    text.includes("comparison") ||
    text.includes("review") ||
    text.includes("evaluate")
  ) {
    role = "analytical expert";
    preset = "analysis";
    label = "Analysis";
  }

  return { role, preset, label };
}

// Notification helper
function showNotification(message) {
  // Simple console log + could be extended with a toast later
  console.log("[PromptCrafter]", message);
}

// TEMPLATE LIBRARY
function loadTemplates() {
  templates = loadJSON(STORAGE_KEYS.templates, DEFAULT_TEMPLATES);
}

function saveTemplates() {
  saveJSON(STORAGE_KEYS.templates, templates);
}

function renderTemplates() {
  const grid = document.getElementById("templatesGrid");
  if (!grid) return;

  grid.innerHTML = "";

  templates.forEach((tpl) => {
    const card = document.createElement("article");
    card.className = "template-card";
    card.dataset.id = tpl.id;

    const cat = TEMPLATE_CATEGORIES[tpl.category] || TEMPLATE_CATEGORIES.other;

    card.innerHTML = `
      <header class="template-card-header">
        <div class="template-badge" style="border-color: ${cat.color}; color: ${cat.color}">
          <i class="fas ${cat.icon}"></i>
          <span>${cat.name}</span>
        </div>
        <div class="template-actions">
          <button class="icon-btn template-edit" title="Edit template">
            <i class="fas fa-pen"></i>
          </button>
          <button class="icon-btn template-delete" title="Delete template">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </header>
      <div class="template-card-body">
        <h4>${tpl.name}</h4>
        <p>${tpl.description}</p>
      </div>
      <footer class="template-card-footer">
        <button class="ghost-btn template-use">
          <i class="fas fa-bolt"></i>
          Use Template
        </button>
      </footer>
    `;

    grid.appendChild(card);
  });
}

function openTemplatesModal() {
  document.getElementById("templatesModal").classList.add("open");
}

function closeTemplatesModal() {
  document.getElementById("templatesModal").classList.remove("open");
}

function onTemplatesGridClick(e) {
  const card = e.target.closest(".template-card");
  if (!card) return;

  const id = card.dataset.id;
  const tpl = templates.find((t) => t.id === id);
  if (!tpl) return;

  if (e.target.closest(".template-use")) {
    // Insert template content into requirement textarea
    const requirementEl = document.getElementById("requirement");
    requirementEl.value = tpl.content;
    handleRequirementInput();
    closeTemplatesModal();
  } else if (e.target.closest(".template-edit")) {
    openTemplateEditor(tpl);
  } else if (e.target.closest(".template-delete")) {
    if (confirm(`Delete template "${tpl.name}"?`)) {
      templates = templates.filter((t) => t.id !== id);
      saveTemplates();
      renderTemplates();
    }
  }
}

function openTemplateEditor(tpl) {
  editingTemplateId = tpl.id;

  const requirementEl = document.getElementById("requirement");
  requirementEl.value = tpl.content;
  handleRequirementInput();

  showNotification("Edit the template content in the idea box, then click 'Save as Template' to update.");
}

// HISTORY
function loadHistory() {
  historyItems = loadJSON(STORAGE_KEYS.history, []);
}

function saveHistory() {
  saveJSON(STORAGE_KEYS.history, historyItems);
}

function addHistoryItem(raw, prompt, role, presetLabel) {
  const item = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    role,
    presetLabel,
    raw,
    prompt
  };
  historyItems.unshift(item);
  historyItems = historyItems.slice(0, 200);
  saveHistory();
}

function renderHistory() {
  const container = document.getElementById("historyList");
  if (!container) return;

  container.innerHTML = "";

  if (!historyItems.length) {
    container.innerHTML = `<p class="helper-text">No history yet. Your converted prompts will appear here.</p>`;
    return;
  }

  historyItems.forEach((item) => {
    const div = document.createElement("article");
    div.className = "history-item";

    const date = new Date(item.timestamp);
    const readable = date.toLocaleString();

    div.innerHTML = `
      <header class="history-item-header">
        <div>
          <h4>${item.presetLabel || "Prompt"}</h4>
          <p class="history-meta">${readable}</p>
        </div>
        <button class="icon-btn history-insert" data-id="${item.id}" title="Insert this prompt">
          <i class="fas fa-arrow-turn-up"></i>
        </button>
      </header>
      <div class="history-item-body">
        <p class="history-raw"><strong>Idea:</strong> ${item.raw}</p>
        <pre class="history-prompt">${item.prompt}</pre>
      </div>
    `;

    container.appendChild(div);
  });
}

function openHistoryModal() {
  document.getElementById("historyModal").classList.add("open");
}

function closeHistoryModal() {
  document.getElementById("historyModal").classList.remove("open");
}

function onHistoryListClick(e) {
  const btn = e.target.closest(".history-insert");
  if (!btn) return;

  const id = btn.dataset.id;
  const item = historyItems.find((h) => h.id === id);
  if (!item) return;

  const requirementEl = document.getElementById("requirement");
  requirementEl.value = item.raw;
  const outputEl = document.getElementById("output");
  outputEl.value = item.prompt;
  updateStats(item.raw);
  updateOutputStats();
  isConverted = true;
  lastConvertedText = item.raw;
  document.getElementById("convertedBadge").style.display = "inline-flex";
  setLaunchButtonsEnabled(true);

  closeHistoryModal();
}

// MAIN GENERATION LOGIC
async function generatePrompt() {
  const requirementEl = document.getElementById("requirement");
  const outputEl = document.getElementById("output");
  const convertBtn = document.getElementById("convertBtn");
  const raw = requirementEl.value.trim();

  if (!raw) {
    showNotification("Please enter a requirement first");
    return "";
  }

  // Detect context once at the start
  const context = detectContextFromText(raw);
  const requirementWithContext = buildContextAwareRequirement(raw, context);
  renderContextChips(context);

  const { role, preset: autoPreset, label } = getRoleAndPreset(raw);
  lastRole = role;
  lastTaskLabel = label;

  if (!userPresetLocked && autoPreset && PRESETS[autoPreset]) {
    currentPreset = autoPreset;
    const presetSelect = document.getElementById("presetSelect");
    if (presetSelect) {
      presetSelect.value = autoPreset;
    }
    lastPresetSource = "auto";
  } else {
    lastPresetSource = "manual";
  }

  usageCount += 1;
  localStorage.setItem("promptCrafterUsage", usageCount.toString());
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
      generatedPrompt = localFormatter(requirementWithContext, role);
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

      const contextSummary = context
        ? `
Detected context:
- Task type: ${context.taskType}
- Language: ${context.language}${context.audience ? `\n- Audience: ${context.audience}` : ""}${context.tone ? `\n- Tone: ${context.tone}` : ""}${context.medium ? `\n- Medium: ${context.medium}` : ""}${context.background ? `\n- Background: ${context.background}` : ""}`
        : "";

      const userMessage = `User requirement (original): "${raw}"
${contextSummary}

Use this understanding and fill the template accordingly in the current preset format ("${currentPreset}"). Return only the completed template.`;

      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
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
          data.choices?.[0]?.message?.content?.trim() ||
          localFormatter(requirementWithContext, role);
      } else {
        console.warn("OpenAI API error, using offline formatter");
        generatedPrompt = localFormatter(requirementWithContext, role);
      }
    }

    outputEl.value = generatedPrompt;
    updateOutputStats();

    isConverted = true;
    lastConvertedText = raw;
    document.getElementById("convertedBadge").style.display = "inline-flex";
    setLaunchButtonsEnabled(true);

    addHistoryItem(raw, generatedPrompt, role, lastTaskLabel);

    showNotification("Prompt generated successfully");

    // Reset auto-convert timer if there's still text
    if (autoConvertEnabled && raw) {
      autoConvertCountdown = autoConvertDelay;
      resetAutoConvertTimer();
    }
  } catch (error) {
    console.error("Generation error:", error);
    generatedPrompt = localFormatter(requirementWithContext, role);
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

function localFormatter(raw, forcedRole) {
  const requirement = raw;
  const roleToUse = forcedRole || getRoleAndPreset(requirement).role;
  return PRESETS[currentPreset](roleToUse, requirement);
}

// Export
function exportPrompt() {
  const outputEl = document.getElementById("output");
  const prompt = outputEl.value.trim();
  if (!prompt) {
    showNotification("No prompt to export");
    return;
  }

  const blob = new Blob([prompt], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "prompt.txt";
  a.click();

  URL.revokeObjectURL(url);
  showNotification("Prompt exported as prompt.txt");
}

// Copy + Open helper
function setLaunchButtonsEnabled(enabled) {
  const cards = document.querySelectorAll(".tool-card");
  cards.forEach((card) => {
    if (enabled) {
      card.classList.remove("tool-card-disabled");
    } else {
      card.classList.add("tool-card-disabled");
    }
  });
}

function onToolCardClick(e) {
  const card = e.currentTarget;
  const tool = card.dataset.tool;
  const outputEl = document.getElementById("output");
  const prompt = outputEl.value.trim();

  if (!prompt) {
    showNotification("Generate a prompt first");
    return;
  }

  let url = "";
  let name = "";

  switch (tool) {
    case "chatgpt":
      url = "https://chat.openai.com/";
      name = "ChatGPT";
      break;
    case "claude":
      url = "https://claude.ai/";
      name = "Claude";
      break;
    case "gemini":
      url = "https://gemini.google.com/app";
      name = "Gemini";
      break;
    default:
      url = "";
      name = "AI tool";
  }

  if (!url) {
    showNotification("Tool not configured yet");
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
      console.error("Clipboard error", err);
      window.open(url, '_blank');
    });
}

// INIT
function attachEvents() {
  const requirementEl = document.getElementById("requirement");
  const outputEl = document.getElementById("output");
  const convertBtn = document.getElementById("convertBtn");
  const autoConvertCheckbox = document.getElementById("autoConvert");
  const presetSelect = document.getElementById("presetSelect");
  const lockPresetCheckbox = document.getElementById("lockPreset");
  const clearRequirementBtn = document.getElementById("clearRequirementBtn");
  const copyOutputBtn = document.getElementById("copyOutputBtn");
  const exportBtn = document.getElementById("exportBtn");
  const saveTemplateBtn = document.getElementById("saveTemplateBtn");
  const openTemplatesBtn = document.getElementById("openTemplatesBtn");
  const closeTemplatesBtn = document.getElementById("closeTemplatesBtn");
  const openHistoryBtn = document.getElementById("openHistoryBtn");
  const closeHistoryBtn = document.getElementById("closeHistoryBtn");
  const historyList = document.getElementById("historyList");
  const templatesGrid = document.getElementById("templatesGrid");
  const aiToolsGrid = document.getElementById("aiToolsGrid");

  if (requirementEl) {
    requirementEl.addEventListener("input", handleRequirementInput);
  }

  if (convertBtn) {
    convertBtn.addEventListener("click", generatePrompt);
  }

  if (autoConvertCheckbox) {
    autoConvertCheckbox.addEventListener("change", (e) => {
      autoConvertEnabled = e.target.checked;
      if (!autoConvertEnabled) {
        clearAutoConvertTimer();
      } else {
        const text = requirementEl.value.trim();
        if (text && !isConverted) {
          resetAutoConvertTimer();
        }
      }
    });
  }

  if (presetSelect) {
    presetSelect.addEventListener("change", (e) => {
      currentPreset = e.target.value;
      userPresetLocked = lockPresetCheckbox?.checked || false;
      lastPresetSource = "manual";
    });
  }

  if (lockPresetCheckbox) {
    lockPresetCheckbox.addEventListener("change", (e) => {
      userPresetLocked = e.target.checked;
    });
  }

  if (clearRequirementBtn) {
    clearRequirementBtn.addEventListener("click", () => {
      requirementEl.value = "";
      handleRequirementInput();
    });
  }

  if (copyOutputBtn) {
    copyOutputBtn.addEventListener("click", () => {
      const prompt = outputEl.value.trim();
      if (!prompt) {
        showNotification("No prompt to copy");
        return;
      }
      navigator.clipboard.writeText(prompt).then(() => {
        showNotification("Prompt copied to clipboard");
      });
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", exportPrompt);
  }

  if (saveTemplateBtn) {
    saveTemplateBtn.addEventListener("click", () => {
      const content = requirementEl.value.trim();
      if (!content) {
        showNotification("Type something in the idea box to save as a template");
        return;
      }

      const name = prompt("Template name:");
      if (!name) return;

      const description = prompt("Short description (optional):") || "Custom template";
      const category = "other";

      if (editingTemplateId) {
        const idx = templates.findIndex((t) => t.id === editingTemplateId);
        if (idx >= 0) {
          templates[idx] = { ...templates[idx], name, description, content, category };
        }
        editingTemplateId = null;
      } else {
        const newTemplate = {
          id: Date.now().toString(),
          name,
          description,
          category,
          content
        };
        templates.push(newTemplate);
      }

      saveTemplates();
      renderTemplates();
      showNotification("Template saved");
    });
  }

  if (openTemplatesBtn) {
    openTemplatesBtn.addEventListener("click", openTemplatesModal);
  }
  if (closeTemplatesBtn) {
    closeTemplatesBtn.addEventListener("click", closeTemplatesModal);
  }
  if (templatesGrid) {
    templatesGrid.addEventListener("click", onTemplatesGridClick);
  }

  if (openHistoryBtn) {
    openHistoryBtn.addEventListener("click", () => {
      renderHistory();
      openHistoryModal();
    });
  }
  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener("click", closeHistoryModal);
  }
  if (historyList) {
    historyList.addEventListener("click", onHistoryListClick);
  }

  if (aiToolsGrid) {
    aiToolsGrid.querySelectorAll(".tool-card").forEach((card) => {
      card.addEventListener("click", onToolCardClick);
    });
  }
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  loadUsageCount();
  loadTemplates();
  renderTemplates();
  loadHistory();
  attachEvents();
  updateStats("");
  updateOutputStats();
});
