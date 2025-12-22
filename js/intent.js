/* ======================================================
   PromptCraft – Intent Detection Engine
   Purpose: Detect task, tone, audience, depth, etc.
====================================================== */

(function () {
  function detectIntentAttributes(text) {
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
    } else if (/workout|fitness|diet|meal/i.test(t)) {
      intent.taskType = "fitness";
    }

    /* ---------- TONE ---------- */
    if (/soft|polite|kind|gentle|humble/i.test(t)) {
      intent.tone = "soft";
    } else if (/formal|professional|official/i.test(t)) {
      intent.tone = "formal";
    } else if (/friendly|casual|fun/i.test(t)) {
      intent.tone = "friendly";
    } else if (/strict|firm|direct|assertive/i.test(t)) {
      intent.tone = "firm";
    }

    /* ---------- FORMALITY ---------- */
    if (/sir|madam|respected|dear/i.test(t)) {
      intent.formality = "high";
    } else if (/hey|hi|buddy|bro/i.test(t)) {
      intent.formality = "low";
    }

    /* ---------- EMOTION ---------- */
    if (/angry|complaint|frustrated/i.test(t)) {
      intent.emotion = "angry";
    } else if (/happy|excited|celebrate/i.test(t)) {
      intent.emotion = "positive";
    } else if (/sorry|apologize|regret/i.test(t)) {
      intent.emotion = "empathetic";
    }

    /* ---------- URGENCY ---------- */
    if (/urgent|asap|immediately|now|today/i.test(t)) {
      intent.urgency = "high";
    }

    /* ---------- AUDIENCE ---------- */
    if (/boss|manager|lead|director/i.test(t)) {
      intent.audience = "manager";
    } else if (/client|customer|stakeholder/i.test(t)) {
      intent.audience = "client";
    } else if (/team|developer|engineer/i.test(t)) {
      intent.audience = "team";
    }

    /* ---------- PERSONA ---------- */
    if (/female|woman|girl|wife|mother/i.test(t)) {
      intent.persona = "female";
    } else if (/male|man|boy|husband|father/i.test(t)) {
      intent.persona = "male";
    }

    /* ---------- CONSTRAINTS ---------- */
    if (/short|brief|concise/i.test(t)) intent.constraints.push("short");
    if (/detailed|in detail|deep/i.test(t)) intent.constraints.push("detailed");
    if (/example/i.test(t)) intent.constraints.push("examples");
    if (/bullet|points/i.test(t)) intent.constraints.push("bullets");

    return intent;
  }

  // 🌍 Expose globally (safe & simple)
  window.detectIntentAttributes = detectIntentAttributes;
})();
