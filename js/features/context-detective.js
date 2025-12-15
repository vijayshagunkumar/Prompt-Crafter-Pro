// context-detective.js - Context Detection and Analysis

/**
 * Detect task type, language and key entities from text
 * @param {string} text - Input text
 * @returns {Object} Detected context
 */
export function detectContextFromText(text) {
  const raw = text || "";
  const lower = raw.toLowerCase();

  // Language detection
  const hasDevanagari = /[\u0900-\u097F]/.test(raw);
  const hasHindiWords = /\b(banao|kar do|karo|krdo|ladki|ladka|paani ki bottle|tasveer|likh do|email likh|presentation bana)\b/i.test(raw);
  
  let language = "english";
  if (hasDevanagari || hasHindiWords) {
    language = /[a-zA-Z]/.test(raw) ? "hinglish" : "hindi";
  }

  // Task type / intent
  let taskType = "general";
  if (/cartoon|illustration|image|photo|picture|poster|thumbnail|logo|banner|icon/.test(lower) ||
      (hasHindiWords && /banao|draw|sketch/.test(lower))) {
    taskType = "image_generation";
  } else if (/email|mail|subject:|dear sir|dear team/.test(lower)) {
    taskType = "email";
  } else if (/code|function|class |api|bug|error|javascript|python|sql/.test(lower)) {
    taskType = "coding";
  } else if (/story|poem|script|blog|article|essay|linkedin post|caption/.test(lower)) {
    taskType = "writing";
  } else if (/analy[sz]e|analysis|compare|summarize|summary|explain|review/.test(lower)) {
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

  return {
    taskType,
    language,
    audience,
    tone,
    medium,
    background,
    keyEntities,
    originalText: raw
  };
}

/**
 * Build enriched requirement using detected context
 * @param {string} raw - Raw requirement text
 * @param {Object} context - Detected context
 * @returns {string} Enriched requirement
 */
export function buildContextAwareRequirement(raw, context) {
  if (!context) return raw;

  const lines = [];

  // Language hint
  if (context.language === "hindi" || context.language === "hinglish") {
    lines.push("The user spoke in Hindi / Hinglish. First fully understand the intent, then write everything in clear, natural English.");
  }

  if (context.taskType === "image_generation") {
    lines.push("Create a rich, detailed prompt for an AI image generator based on the user's description.");

    const summaryParts = [];
    if (context.medium) summaryParts.push(`style: ${context.medium}`);
    if (context.background) summaryParts.push(`background: ${context.background}`);
    if (context.keyEntities && context.keyEntities.length) {
      summaryParts.push("focus elements: " + context.keyEntities.join(", "));
    }

    if (summaryParts.length) {
      lines.push("Key visual context: " + summaryParts.join(" • "));
    }

    lines.push("Do not change the core idea, but you may add 2–3 small, natural details to make the scene vivid.");
  } else if (context.taskType === "email") {
    lines.push("Write a clear, concise, high-quality email that directly solves the user's need.");
    if (context.audience) {
      lines.push(`Audience: ${context.audience}.`);
    }
    if (context.tone) {
      lines.push(`Tone: ${context.tone}.`);
    } else {
      lines.push("Tone: formal but easy to understand.");
    }
  }

  const contextNote = lines.length ? "\n\nContext for this task:\n" + lines.join("\n") : "";
  return raw + contextNote;
}

/**
 * Get role and preset based on requirement
 * @param {string} rawRequirement - User requirement
 * @returns {Object} Role, preset, and label
 */
export function getRoleAndPreset(rawRequirement) {
  const text = rawRequirement.toLowerCase();

  // Basic domain detection
  let role = "expert assistant";
  let preset = "default";
  let label = "General";

  if (text.includes("email") ||
      text.includes("mail") ||
      text.includes("subject:") ||
      text.includes("dear ") ||
      text.includes("notice") ||
      text.includes("letter")) {
    role = "expert communication specialist";
    preset = "communication";
    label = "Communication";
  } else if (text.includes("code") ||
             text.includes("function") ||
             text.includes("bug") ||
             text.includes("error") ||
             text.includes("api") ||
             text.includes("script") ||
             text.includes("program")) {
    role = "expert software developer";
    preset = "coding";
    label = "Coding";
  } else if (text.includes("story") ||
             text.includes("blog") ||
             text.includes("article") ||
             text.includes("essay") ||
             text.includes("post") ||
             text.includes("writeup") ||
             text.includes("creative")) {
    role = "skilled writer";
    preset = "writing";
    label = "Writing";
  } else if (text.includes("analyze") ||
             text.includes("analysis") ||
             text.includes("compare") ||
             text.includes("comparison") ||
             text.includes("review") ||
             text.includes("evaluate")) {
    role = "analytical expert";
    preset = "analysis";
    label = "Analysis";
  }

  return { role, preset, label };
}

/**
 * Create context chips HTML
 * @param {Object} context - Detected context
 * @returns {string} HTML string for chips
 */
export function createContextChipsHTML(context) {
  if (!context || !context.taskType || !context.originalText.trim()) {
    return '';
  }

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

  return chips.map(chip => 
    `<button class="chip context-chip">
      <i class="fas ${chip.icon}"></i> ${chip.label}
    </button>`
  ).join('');
}
