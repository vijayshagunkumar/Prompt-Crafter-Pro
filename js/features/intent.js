/* ======================================================
   intent.js
   Purpose: Intent detection & chip rendering
====================================================== */

/* ------------------------------
   Intent Detection Logic
------------------------------ */
function detectIntent(text) {
  const t = (text || "").toLowerCase();

  const intent = {
    taskType: "general",
    tone: "neutral",
    formality: "neutral",
    depth: "normal",
    emotion: "neutral",
    urgency: "normal",
    audience: "general",
    persona: "neutral",
    format: "free",
    constraints: []
  };

  /* ---------- TASK TYPE ---------- */
  if (/email|mail|message|reply|follow[- ]?up/i.test(t)) {
    intent.taskType = "email";
    intent.format = "email";
  } else if (/code|script|function|api|bug|fix|refactor/i.test(t)) {
    intent.taskType = "code";
    intent.format = "code";
  } else if (/analyze|analysis|evaluate|market|trend|report/i.test(t)) {
    intent.taskType = "analysis";
    intent.depth = "deep";
  } else if (/explain|teach|learn|guide|tutorial/i.test(t)) {
    intent.taskType = "education";
    intent.depth = "step-by-step";
  } else if (/write|blog|article|post|content/i.test(t)) {
    intent.taskType = "writing";
  } else if (/plan|strategy|roadmap|proposal|g2m/i.test(t)) {
    intent.taskType = "business";
    intent.depth = "structured";
  }

  /* ---------- TONE ---------- */
  if (/soft|polite|kind|gentle/i.test(t)) intent.tone = "soft";
  if (/formal|professional|official/i.test(t)) intent.tone = "formal";
  if (/friendly|casual|fun/i.test(t)) intent.tone = "friendly";
  if (/strict|firm|direct|assertive/i.test(t)) intent.tone = "firm";

  /* ---------- FORMALITY ---------- */
  if (/sir|madam|respected/i.test(t)) intent.formality = "high";
  if (/hey|hi|buddy|bro/i.test(t)) intent.formality = "low";

  /* ---------- EMOTION ---------- */
  if (/angry|complaint|frustrated/i.test(t)) intent.emotion = "angry";
  if (/happy|excited|celebrate/i.test(t)) intent.emotion = "positive";
  if (/sorry|apologize|regret/i.test(t)) intent.emotion = "empathetic";

  /* ---------- URGENCY ---------- */
  if (/urgent|asap|immediately|today|now/i.test(t)) {
    intent.urgency = "high";
  }

  /* ---------- AUDIENCE ---------- */
  if (/boss|manager|lead|director/i.test(t)) intent.audience = "manager";
  if (/client|customer|stakeholder/i.test(t)) intent.audience = "client";
  if (/team|developer|engineer/i.test(t)) intent.audience = "team";

  /* ---------- CONSTRAINTS ---------- */
  if (/short|brief|concise/i.test(t)) intent.constraints.push("short");
  if (/detailed|elaborate|in-depth/i.test(t))
    intent.constraints.push("detailed");

  return intent;
}

/* ------------------------------
   Chip Rendering
------------------------------ */
function intentToChips(intent) {
  if (!intent) return [];

  const chips = [];

  if (intent.taskType !== "general") chips.push(intent.taskType);
  if (intent.tone !== "neutral") chips.push(`tone:${intent.tone}`);
  if (intent.formality !== "neutral")
    chips.push(`formality:${intent.formality}`);
  if (intent.depth !== "normal") chips.push(`depth:${intent.depth}`);
  if (intent.urgency !== "normal") chips.push(`urgency:${intent.urgency}`);

  intent.constraints.forEach(c => chips.push(c));

  return chips;
}

function renderIntentChips(chips) {
  const row = document.getElementById("intentRow");
  const scroll = document.getElementById("intentScroll");

  if (!row || !scroll) return;

  scroll.innerHTML = "";

  if (!chips.length) {
    row.classList.add("hidden");
    return;
  }

  chips.forEach(label => {
    const chip = document.createElement("span");
    chip.className = "intent-chip";
    chip.textContent = label;
    scroll.appendChild(chip);
  });

  row.classList.remove("hidden");
}

/* ------------------------------
   Public Initializer
------------------------------ */
export function initializeIntentDetection() {
  const input = document.getElementById("requirement");
  if (!input) return;

  input.addEventListener("input", () => {
    const intent = detectIntent(input.value);
    const chips = intentToChips(intent);
    renderIntentChips(chips);

    // Broadcast intent for other modules
    document.dispatchEvent(
      new CustomEvent("intent:updated", { detail: intent })
    );
  });
}
