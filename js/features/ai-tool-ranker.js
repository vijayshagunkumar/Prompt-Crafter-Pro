/* ======================================================
   ai-tool-ranker.js
   Purpose: Rank & reorder AI tools based on user intent
====================================================== */

/* ------------------------------
   AI Tool Capability Matrix
------------------------------ */
const AI_TOOL_PROFILES = {
  chatgpt: {
    strengths: ["writing", "email", "education", "general", "analysis"],
    depth: ["normal", "deep"],
    format: ["email", "free"]
  },
  claude: {
    strengths: ["writing", "analysis", "business"],
    depth: ["deep", "structured"],
    format: ["free"]
  },
  gemini: {
    strengths: ["research", "analysis", "education"],
    depth: ["deep"],
    format: ["free"]
  },
  perplexity: {
    strengths: ["research", "analysis"],
    depth: ["deep"],
    format: ["free"]
  },
  deepseek: {
    strengths: ["code"],
    depth: ["deep"],
    format: ["code"]
  },
  copilot: {
    strengths: ["code"],
    depth: ["normal"],
    format: ["code"]
  },
  grok: {
    strengths: ["general", "creative"],
    depth: ["normal"],
    format: ["free"]
  }
};

/* ------------------------------
   Ranking Logic
------------------------------ */
function rankAITools(intent) {
  if (!intent) return [];

  const scores = {};
  Object.keys(AI_TOOL_PROFILES).forEach(k => (scores[k] = 0));

  Object.entries(AI_TOOL_PROFILES).forEach(([key, tool]) => {
    if (tool.strengths.includes(intent.taskType)) scores[key] += 4;
    if (tool.format.includes(intent.format)) scores[key] += 3;
    if (tool.depth.includes(intent.depth)) scores[key] += 2;

    if (intent.constraints?.includes("detailed")) scores[key] += 1;

    if (
      intent.audience === "business" &&
      tool.strengths.includes("business")
    ) {
      scores[key] += 2;
    }
  });

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

/* ------------------------------
   UI Reordering
------------------------------ */
function reorderButtons(order) {
  const container = document.querySelector(".launch-list");
  if (!container || !order.length) return;

  const buttons = Array.from(container.children);

  order.forEach((toolKey, index) => {
    const btn = buttons.find(b => b.id === `${toolKey}Btn`);
    if (!btn) return;

    container.appendChild(btn);
    btn.classList.toggle("best-match", index === 0);
  });
}

/* ------------------------------
   Public Initializer
------------------------------ */
export function initializeAIToolRanking() {
  document.addEventListener("intent:updated", e => {
    const orderedTools = rankAITools(e.detail);
    reorderButtons(orderedTools);
  });
}
