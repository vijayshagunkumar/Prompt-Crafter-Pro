// AI Tool Ranking System for PromptCraft

(function() {
  const AI_TOOL_PROFILES = {
    chatgpt: {
      name: "ChatGPT",
      strengths: ["general", "writing", "email", "education", "analysis"],
      score: 0
    },
    claude: {
      name: "Claude",
      strengths: ["writing", "analysis", "business", "detailed"],
      score: 0
    },
    gemini: {
      name: "Gemini",
      strengths: ["research", "analysis", "education", "technical"],
      score: 0
    },
    perplexity: {
      name: "Perplexity",
      strengths: ["research", "analysis", "brief", "facts"],
      score: 0
    },
    deepseek: {
      name: "DeepSeek",
      strengths: ["code", "technical", "programming"],
      score: 0
    },
    copilot: {
      name: "Copilot",
      strengths: ["code", "quick", "development"],
      score: 0
    },
    grok: {
      name: "Grok",
      strengths: ["creative", "general", "casual", "humor"],
      score: 0
    }
  };
  
  function rankAITools(intent) {
    if (!intent) return ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    
    // Reset scores
    Object.values(AI_TOOL_PROFILES).forEach(tool => {
      tool.score = 0;
    });
    
    // Score each tool
    Object.entries(AI_TOOL_PROFILES).forEach(([key, tool]) => {
      if (tool.strengths.includes(intent.taskType)) {
        tool.score += 10;
      }
      if (tool.strengths.includes(intent.tone)) {
        tool.score += 5;
      }
      if (tool.strengths.includes(intent.format)) {
        tool.score += 5;
      }
    });
    
    // Sort by score
    return Object.entries(AI_TOOL_PROFILES)
      .sort((a, b) => b[1].score - a[1].score)
      .map(([key]) => key);
  }
  
  function reorderLaunchButtons(toolOrder) {
    const container = document.querySelector(".launch-list");
    if (!container) return;
    
    // Clear existing best-match
    document.querySelectorAll('.launch-btn').forEach(btn => {
      btn.classList.remove("best-match");
    });
    
    // Reorder
    toolOrder.forEach(toolKey => {
      const btn = document.getElementById(`${toolKey}Btn`);
      if (btn) container.appendChild(btn);
    });
    
    // Mark best match
    if (toolOrder.length > 0 && AI_TOOL_PROFILES[toolOrder[0]].score > 0) {
      const bestBtn = document.getElementById(`${toolOrder[0]}Btn`);
      if (bestBtn) {
        bestBtn.classList.add("best-match");
      }
    }
  }
  
  function resetToDefault() {
    const defaultOrder = ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    const container = document.querySelector(".launch-list");
    
    if (!container) return;
    
    // Clear best-match
    document.querySelectorAll('.launch-btn').forEach(btn => {
      btn.classList.remove("best-match");
    });
    
    // Reorder to default
    defaultOrder.forEach(toolKey => {
      const btn = document.getElementById(`${toolKey}Btn`);
      if (btn) container.appendChild(btn);
    });
  }
  
  function setupTooltips() {
    const buttons = document.querySelectorAll('.launch-btn');
    buttons.forEach(btn => {
      btn.addEventListener('mouseenter', function() {
        // Add tooltip if needed
      });
    });
  }
  
  // Public API
  window.AIToolRanker = {
    rankAndReorder(intent) {
      const ordered = rankAITools(intent);
      reorderLaunchButtons(ordered);
    },
    resetToDefault,
    setupTooltips
  };
})();
