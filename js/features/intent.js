// Intent detection for PromptCraft
export function detectIntentAttributes(text) {
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
  
  // Task type detection
  if (/email|mail|message|reply/i.test(t)) {
    intent.taskType = "email";
    intent.format = "email";
  } else if (/code|script|function|api|program/i.test(t)) {
    intent.taskType = "code";
    intent.format = "code";
  } else if (/analyze|analysis|research|report/i.test(t)) {
    intent.taskType = "analysis";
    intent.depth = "deep";
  } else if (/explain|teach|learn|guide|tutorial/i.test(t)) {
    intent.taskType = "education";
    intent.depth = "step-by-step";
  } else if (/write|blog|article|content|copy/i.test(t)) {
    intent.taskType = "writing";
  } else if (/plan|strategy|business|proposal/i.test(t)) {
    intent.taskType = "business";
    intent.depth = "structured";
  } else if (/creative|story|imagine|fiction/i.test(t)) {
    intent.taskType = "creative";
  }
  
  // Tone detection
  if (/formal|professional|official/i.test(t)) {
    intent.tone = "formal";
  } else if (/friendly|casual|fun|humor/i.test(t)) {
    intent.tone = "friendly";
  } else if (/urgent|asap|immediately|emergency/i.test(t)) {
    intent.urgency = "high";
  }
  
  return intent;
}

// Make available globally
window.detectIntentAttributes = detectIntentAttributes;
