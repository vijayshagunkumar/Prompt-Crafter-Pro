/* ======================================================
   FIXED & ENHANCED AI TOOL RANKING ENGINE (CARD 3)
   Purpose: Rank & reorder AI tools based on user intent
====================================================== */

(function () {
  /* ------------------------------------------
     ENHANCED AI Tool Capability Matrix
  ------------------------------------------ */

  const AI_TOOL_PROFILES = {
    chatgpt: {
      name: "ChatGPT",
      strengths: ["general", "writing", "email", "education", "analysis", "professional", "formal", "conversational", "creative", "technical"],
      weaknesses: ["real-time", "latest", "free", "image"],
      tone: ["professional", "friendly", "formal", "authoritative", "casual", "humorous", "persuasive"],
      format: ["free", "bullet points", "numbered list", "paragraph", "email", "code"],
      depth: ["normal", "detailed", "brief", "high-level", "step-by-step"],
      audience: ["general", "beginners", "experts", "technical", "non-technical", "business", "students"],
      bestFor: ["emails", "content writing", "analysis", "education", "general tasks", "brainstorming", "explanations"],
      score: 0,
      matchReason: "",
      tooltip: "Best for general tasks, writing, analysis, and explanations. Supports multiple formats."
    },
    claude: {
      name: "Claude",
      strengths: ["writing", "analysis", "business", "detailed", "long-form", "reasoning", "ethical", "safe"],
      weaknesses: ["code", "creative", "image", "real-time"],
      tone: ["professional", "formal", "authoritative", "serious", "ethical"],
      format: ["free", "paragraph", "structured", "long-form"],
      depth: ["detailed", "normal", "comprehensive"],
      audience: ["experts", "technical", "business", "professional"],
      bestFor: ["long-form content", "analysis", "business documents", "detailed writing", "reasoning tasks"],
      score: 0,
      matchReason: "",
      tooltip: "Excellent for long-form content, analysis, and business writing with strong reasoning."
    },
    gemini: {
      name: "Gemini",
      strengths: ["research", "analysis", "education", "technical", "code", "multimodal", "latest", "real-time"],
      weaknesses: ["creative", "casual", "long-form"],
      tone: ["professional", "technical", "informative"],
      format: ["free", "structured", "code", "bullet points"],
      depth: ["detailed", "normal", "technical"],
      audience: ["technical", "experts", "beginners", "students"],
      bestFor: ["research", "technical analysis", "learning", "coding", "real-time information"],
      score: 0,
      matchReason: "",
      tooltip: "Great for research, technical tasks, coding, and real-time information with multimodal support."
    },
    perplexity: {
      name: "Perplexity",
      strengths: ["research", "analysis", "brief", "concise", "factual", "citations", "web", "latest"],
      weaknesses: ["creative", "long-form", "conversational"],
      tone: ["professional", "casual", "factual"],
      format: ["free", "bullet points", "concise"],
      depth: ["brief", "high-level", "factual"],
      audience: ["general", "beginners", "researchers"],
      bestFor: ["quick research", "summaries", "facts", "web searches", "citations", "news"],
      score: 0,
      matchReason: "",
      tooltip: "Perfect for research, fact-checking, summaries, and web searches with citations."
    },
    deepseek: {
      name: "DeepSeek",
      strengths: ["code", "technical", "structured", "mathematical", "programming", "algorithms", "free"],
      weaknesses: ["creative", "casual", "general", "non-technical"],
      tone: ["technical", "professional", "precise"],
      format: ["structured", "code", "technical"],
      depth: ["detailed", "normal", "technical"],
      audience: ["technical", "experts", "developers"],
      bestFor: ["coding", "technical solutions", "APIs", "algorithms", "debugging", "mathematical problems"],
      score: 0,
      matchReason: "",
      tooltip: "Specialized for coding, technical solutions, algorithms, and mathematical problems."
    },
    copilot: {
      name: "Copilot",
      strengths: ["code", "quick", "assistance", "snippets", "development", "integrated", "contextual"],
      weaknesses: ["long-form", "creative", "analysis", "non-technical"],
      tone: ["technical", "casual", "assistive"],
      format: ["code", "structured", "snippets"],
      depth: ["normal", "brief", "contextual"],
      audience: ["technical", "beginners", "developers"],
      bestFor: ["quick code help", "snippets", "debugging", "code completion", "development assistance"],
      score: 0,
      matchReason: "",
      tooltip: "Ideal for code assistance, snippets, debugging, and development workflow integration."
    },
    grok: {
      name: "Grok",
      strengths: ["creative", "general", "casual", "humorous", "entertainment", "conversational", "trendy"],
      weaknesses: ["professional", "technical", "serious", "formal"],
      tone: ["casual", "humorous", "friendly", "sarcastic", "entertaining"],
      format: ["free", "paragraph", "conversational"],
      depth: ["normal", "brief", "casual"],
      audience: ["general", "beginners", "casual"],
      bestFor: ["creative writing", "casual chat", "entertainment", "humor", "trendy topics", "social"],
      score: 0,
      matchReason: "",
      tooltip: "Fun for creative writing, casual chat, humor, entertainment, and trendy topics."
    }
  };

  /* ------------------------------------------
     ENHANCED: Score AI Tools Based on Intent
  ------------------------------------------ */

  function rankAITools(intent) {
    if (!intent || !intent.taskType) {
      // If no specific intent, return default order
      return ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    }
    
    // Reset scores
    Object.values(AI_TOOL_PROFILES).forEach(tool => {
      tool.score = 0;
      tool.matchReason = "";
    });
    
    // Score each tool
    Object.entries(AI_TOOL_PROFILES).forEach(([toolKey, tool]) => {
      let score = 0;
      let reasons = [];
      
      // 1. Task type matching (highest weight)
      if (tool.strengths.includes(intent.taskType)) {
        score += 15;
        reasons.push(`excels at ${intent.taskType}`);
      } else if (tool.strengths.some(strength => 
        strength.includes(intent.taskType) || intent.taskType.includes(strength)
      )) {
        score += 10;
        reasons.push(`good for ${intent.taskType}`);
      }
      
      // 2. Tone matching
      if (intent.tone && intent.tone !== "neutral") {
        if (tool.tone.includes(intent.tone)) {
          score += 8;
          reasons.push(`${intent.tone} tone`);
        } else if (intent.tone === "humorous" && toolKey === "grok") {
          score += 10;
          reasons.push("humorous style");
        } else if (intent.tone === "technical" && (toolKey === "deepseek" || toolKey === "copilot" || toolKey === "gemini")) {
          score += 8;
          reasons.push("technical expertise");
        }
      }
      
      // 3. Format matching
      if (intent.format && intent.format !== "free") {
        if ((intent.format === "code" || intent.format === "structured") && 
            (toolKey === "deepseek" || toolKey === "copilot" || toolKey === "gemini")) {
          score += 12;
          reasons.push(`${intent.format} output`);
        } else if (tool.format.includes(intent.format)) {
          score += 6;
          reasons.push(`${intent.format} format`);
        }
      }
      
      // 4. Depth matching
      if (intent.depth && intent.depth !== "normal") {
        if (intent.depth === "detailed" && (toolKey === "claude" || toolKey === "gemini")) {
          score += 10;
          reasons.push("detailed analysis");
        } else if (intent.depth === "brief" && (toolKey === "perplexity" || toolKey === "copilot")) {
          score += 8;
          reasons.push("concise answers");
        } else if (tool.depth.includes(intent.depth)) {
          score += 5;
          reasons.push(`${intent.depth} depth`);
        }
      }
      
      // 5. Audience matching
      if (intent.audience && intent.audience !== "general") {
        if (intent.audience === "technical" && (toolKey === "deepseek" || toolKey === "copilot" || toolKey === "gemini")) {
          score += 10;
          reasons.push("technical audience");
        } else if (intent.audience === "beginners" && (toolKey === "chatgpt" || toolKey === "perplexity")) {
          score += 8;
          reasons.push("beginner-friendly");
        } else if (tool.audience.includes(intent.audience)) {
          score += 6;
          reasons.push(`${intent.audience} audience`);
        }
      }
      
      // 6. Specific constraints
      if (intent.constraints && intent.constraints.length > 0) {
        // Code-related tasks
        if (intent.constraints.includes("code")) {
          if (toolKey === "deepseek") { score += 20; reasons.push("coding specialist"); }
          if (toolKey === "copilot") { score += 18; reasons.push("code assistant"); }
          if (toolKey === "gemini") { score += 15; reasons.push("technical coding"); }
        }
        // Creative tasks
        if (intent.constraints.includes("creative")) {
          if (toolKey === "grok") { score += 18; reasons.push("creative specialist"); }
          if (toolKey === "chatgpt") { score += 12; reasons.push("creative writing"); }
        }
        // Research tasks
        if (intent.constraints.includes("research")) {
          if (toolKey === "perplexity") { score += 20; reasons.push("research specialist"); }
          if (toolKey === "gemini") { score += 15; reasons.push("research & analysis"); }
        }
        // Business tasks
        if (intent.constraints.includes("business")) {
          if (toolKey === "claude") { score += 16; reasons.push("business writing"); }
          if (toolKey === "chatgpt") { score += 12; reasons.push("professional content"); }
        }
        // Educational tasks
        if (intent.constraints.includes("education")) {
          if (toolKey === "gemini") { score += 15; reasons.push("educational content"); }
          if (toolKey === "chatgpt") { score += 12; reasons.push("learning assistance"); }
        }
        // Urgent tasks
        if (intent.urgency === "high") {
          if (toolKey === "perplexity") { score += 10; reasons.push("quick answers"); }
          if (toolKey === "copilot") { score += 8; reasons.push("fast assistance"); }
        }
      }
      
      // 7. Special enhancements
      // Real-time info
      if (/(news|latest|current|today|recent)/i.test(JSON.stringify(intent))) {
        if (toolKey === "perplexity" || toolKey === "gemini") {
          score += 10;
          reasons.push("real-time info");
        }
      }
      // Free tier preference
      if (/(free|budget|cost|cheap)/i.test(JSON.stringify(intent))) {
        if (toolKey === "deepseek" || toolKey === "perplexity") {
          score += 8;
          reasons.push("free access");
        }
      }
      
      // Penalize weaknesses
      if (tool.weaknesses.includes(intent.taskType)) {
        score -= 12;
      }
      
      tool.score = score;
      tool.matchReason = reasons.slice(0, 3).join(", ");
    });
    
    // Sort by score descending
    const sorted = Object.entries(AI_TOOL_PROFILES)
      .sort((a, b) => b[1].score - a[1].score)
      .map(([key]) => key);
    
    // Only reorder if there's a clear winner (score difference > 5)
    const topScore = AI_TOOL_PROFILES[sorted[0]].score;
    const secondScore = AI_TOOL_PROFILES[sorted[1]].score;
    
    if (topScore - secondScore < 5 && topScore < 10) {
      // No clear winner, return default order
      return ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    }
    
    return sorted;
  }

  /* ------------------------------------------
     Reorder Card-3 Buttons & Add Best Match Tag
  ------------------------------------------ */

  function reorderLaunchButtons(toolOrder) {
    const container = document.querySelector(".launch-list");
    if (!container || !toolOrder.length) return;
    
    const buttons = Array.from(container.querySelectorAll(".launch-btn"));
    if (!buttons.length) return;
    
    // Clear existing best-match tags and tooltips
    buttons.forEach(btn => {
      btn.classList.remove("best-match");
      const existingTag = btn.querySelector(".best-match-tag");
      if (existingTag) existingTag.remove();
      
      const existingExplanation = btn.querySelector(".inline-explanation");
      if (existingExplanation) existingExplanation.remove();
    });
    
    // Store original order
    const originalOrder = ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    
    // Check if we should reorder
    const allSame = toolOrder.every((tool, i) => originalOrder[i] === tool);
    const topTool = AI_TOOL_PROFILES[toolOrder[0]];
    
    if (allSame && (!topTool || topTool.score < 10)) {
      // No significant ranking, keep default order
      resetToDefault();
      return;
    }
    
    // Reorder buttons based on ranking
    toolOrder.forEach((toolKey, index) => {
      const btn = buttons.find(b => b.id === `${toolKey}Btn`);
      if (!btn) return;
      
      container.appendChild(btn);
    });
  }

  /* ------------------------------------------
     Reset to Default Order
  ------------------------------------------ */

  function resetToDefault() {
    const defaultOrder = ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    const container = document.querySelector(".launch-list");
    
    if (!container) return;
    
    // Clear existing best-match tags
    const buttons = container.querySelectorAll(".launch-btn");
    buttons.forEach(btn => {
      btn.classList.remove("best-match");
      const existingTag = btn.querySelector(".best-match-tag");
      if (existingTag) existingTag.remove();
      
      const existingExplanation = btn.querySelector(".inline-explanation");
      if (existingExplanation) existingExplanation.remove();
    });
    
    // Reorder to default
    defaultOrder.forEach(toolKey => {
      const btn = document.getElementById(`${toolKey}Btn`);
      if (btn) container.appendChild(btn);
    });
  }

  /* ------------------------------------------
     Update Best Match Display
  ------------------------------------------ */

  function updateBestMatchDisplay(intent, orderedTools) {
    if (!intent || !orderedTools || orderedTools.length === 0) return;
    
    // Clear existing best-match tags from ALL buttons first
    document.querySelectorAll('.launch-btn').forEach(btn => {
      btn.classList.remove("best-match");
      const existingTag = btn.querySelector(".best-match-tag");
      if (existingTag) existingTag.remove();
      const existingScore = btn.querySelector(".match-score");
      if (existingScore) existingScore.remove();
    });
    
    // Only add "Best Match" to the FIRST tool (index 0) if it meets threshold
    const topToolKey = orderedTools[0];
    const topTool = AI_TOOL_PROFILES[topToolKey];
    
    if (!topTool || topTool.score < 10) return;
    
    const topToolBtn = document.getElementById(`${topToolKey}Btn`);
    if (!topToolBtn) return;
    
    // Add best match styling to only the top tool
    topToolBtn.classList.add("best-match");
    
    // Create ONLY ONE tag with 100% score
    const bestMatchTag = document.createElement("span");
    bestMatchTag.className = "best-match-tag";
    bestMatchTag.textContent = "✨ Best Match: 100%";
    bestMatchTag.style.background = "linear-gradient(135deg, #00FF41, #00F3FF)";
    bestMatchTag.style.color = "#000";
    bestMatchTag.style.fontSize = "10px";
    bestMatchTag.style.fontWeight = "700";
    bestMatchTag.style.padding = "3px 10px";
    bestMatchTag.style.borderRadius = "12px";
    bestMatchTag.style.position = "absolute";
    bestMatchTag.style.top = "-10px";
    bestMatchTag.style.left = "50%";
    bestMatchTag.style.transform = "translateX(-50%)";
    bestMatchTag.style.zIndex = "10";
    bestMatchTag.style.boxShadow = "0 0 10px rgba(0, 255, 65, 0.8)";
    bestMatchTag.style.border = "2px solid #000";
    bestMatchTag.style.pointerEvents = "none";
    bestMatchTag.style.textTransform = "uppercase";
    bestMatchTag.style.letterSpacing = "1px";
    bestMatchTag.style.fontFamily = "'Courier New', monospace";
    bestMatchTag.style.textAlign = "center";
    bestMatchTag.style.minWidth = "120px";
    bestMatchTag.style.whiteSpace = "nowrap";
    
    topToolBtn.appendChild(bestMatchTag);
  }

  /* ------------------------------------------
     Add Hover Tooltips
  ------------------------------------------ */

  function setupTooltips() {
    const launchButtons = document.querySelectorAll(".launch-btn");
    
    launchButtons.forEach(btn => {
      const toolId = btn.id.replace("Btn", "");
      const toolProfile = AI_TOOL_PROFILES[toolId];
      
      if (toolProfile) {
        // Remove any existing tooltip
        btn.removeAttribute("title");
        
        // Create custom tooltip
        btn.addEventListener("mouseenter", function(e) {
          if (!toolProfile) return;
          
          // Remove any existing custom tooltip
          const existingTooltip = document.querySelector(".custom-tooltip");
          if (existingTooltip) {
            existingTooltip.remove();
          }
          
          // Create new tooltip
          const tooltip = document.createElement("div");
          tooltip.className = "custom-tooltip";
          tooltip.innerHTML = `
            <div class="tooltip-header">
              <strong>${toolProfile.name}</strong>
               <span class="tooltip-match">${toolProfile.score > 0 ? `Match Score: ${toolProfile.score}/50` : ''}</span>
            </div>
            <div class="tooltip-body">${toolProfile.tooltip}</div>
            ${toolProfile.matchReason ? `<div class="tooltip-reason"><i class="fas fa-bullseye"></i> ${toolProfile.matchReason}</div>` : ''}
            <div class="tooltip-footer">
              <span><i class="fas fa-star"></i> Best for: ${toolProfile.bestFor.slice(0, 3).join(", ")}</span>
            </div>
          `;
          
          document.body.appendChild(tooltip);
          
          // Position tooltip
          const rect = btn.getBoundingClientRect();
          tooltip.style.left = `${rect.left + window.scrollX}px`;
          tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;
          
          // Adjust if tooltip goes off screen
          if (rect.top - tooltip.offsetHeight - 10 < 0) {
            tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
          }
        });
        
        btn.addEventListener("mouseleave", function() {
          const tooltip = document.querySelector(".custom-tooltip");
          if (tooltip) {
            tooltip.remove();
          }
        });
      }
    });
  }

  /* ------------------------------------------
     Public API
  ------------------------------------------ */

  window.AIToolRanker = {
    rankAndReorder(intent) {
      if (!intent) {
        resetToDefault();
        return;
      }
      
      const ordered = rankAITools(intent);
      reorderLaunchButtons(ordered);
      
      // Clear ALL best-match tags before adding new ones
      document.querySelectorAll('.launch-btn').forEach(btn => {
        btn.classList.remove("best-match");
        const existingTag = btn.querySelector(".best-match-tag");
        if (existingTag) existingTag.remove();
        const existingScore = btn.querySelector(".match-score");
        if (existingScore) existingScore.remove();
      });
      
      // Update best match display
      if (ordered.length > 0) {
        updateBestMatchDisplay(intent, ordered);
      }
      
      // Setup tooltips
      setTimeout(setupTooltips, 100);
    },
    
    resetToDefault,
    setupTooltips
  };
})();
