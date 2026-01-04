// ============================================
// AI TOOL RANKING SYSTEM FOR PROMPTCRAFT
// File: ai-tool-ranking.js
// Version: 1.0.1 (Fully Corrected)
// ============================================

// 1. AI TOOL CONFIGURATION
const AI_TOOLS = {
  chatgpt: {
    name: "ChatGPT",
    strengths: ["structured-prompt", "writing", "business", "instruction-following", "formatting"],
    explanation: "Best for structured prompts and exact formatting",
    icon: "🤖",
    buttonId: "chatgptBtn",
    weight: 95
  },
  
  claude: {
    name: "Claude",
    strengths: ["analysis", "writing", "long-context", "ethical", "creative-writing"],
    explanation: "Excellent for analysis and creative long-form content",
    icon: "🧠",
    buttonId: "claudeBtn",
    weight: 94
  },
  
  gemini: {
    name: "Gemini",
    strengths: ["research", "education", "real-time", "multimodal", "free-tier"],
    explanation: "Great for research and real-time information",
    icon: "🔍",
    buttonId: "geminiBtn",
    weight: 88
  },
  
  perplexity: {
    name: "Perplexity",
    strengths: ["research", "citation", "real-time", "academic", "fact-checking"],
    explanation: "Perfect for research with citations",
    icon: "📚",
    buttonId: "perplexityBtn",
    weight: 90
  },
  
  deepseek: {
    name: "DeepSeek",
    strengths: ["coding", "math", "reasoning", "free", "technical"],
    explanation: "Specialized for coding and technical tasks",
    icon: "💻",
    buttonId: "deepseekBtn",
    weight: 92
  }
};

// 2. FIXED: PROMPT ANALYSIS (Priority-based detection)
function analyzeGeneratedPrompt(promptText) {
  const text = promptText.toLowerCase();
  const analysis = { taskType: "general", confidence: "medium" };

  // Priority 1: Structured PromptCraft output (highest priority)
  if (
    text.includes("task to perform:") ||
    text.includes("requirements:") ||
    text.includes("format:")
  ) {
    analysis.taskType = "structured-prompt";
    analysis.confidence = "high";
    return analysis;
  }

  // Priority 2: Coding content
  if (text.includes("code") || text.includes("function") || text.includes("algorithm")) {
    analysis.taskType = "coding";
    analysis.confidence = "high";
    return analysis;
  }

  // Priority 3: Business documents
  if (text.includes("business") || text.includes("report") || text.includes("email")) {
    analysis.taskType = "business-document";
    analysis.confidence = "high";
    return analysis;
  }

  // Priority 4: Research content
  if (text.includes("research") || text.includes("analyze") || text.includes("study")) {
    analysis.taskType = "research";
    analysis.confidence = "high";
    return analysis;
  }

  // Priority 5: Creative writing
  if (text.includes("story") || text.includes("creative") || text.includes("imagine")) {
    analysis.taskType = "creative-writing";
    return analysis;
  }

  return analysis;
}

// 3. TOOL RANKING
function rankToolsForTask(taskAnalysis) {
  const scores = {};
  
  Object.entries(AI_TOOLS).forEach(([toolId, tool]) => {
    let score = tool.weight;
    
    // Boost for matching strengths
    if (tool.strengths.includes(taskAnalysis.taskType)) {
      score += 20;
    }
    
    // Special adjustments
    if (taskAnalysis.taskType === "structured-prompt") {
      if (toolId === "chatgpt" || toolId === "claude") score += 15;
      if (toolId === "gemini") score -= 10;
    }
    
    if (taskAnalysis.taskType === "research") {
      if (toolId === "gemini" || toolId === "perplexity") score += 12;
    }
    
    if (taskAnalysis.taskType === "coding") {
      if (toolId === "deepseek") score += 18;
    }
    
    scores[toolId] = score;
  });
  
  // Sort tools by score
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([toolId]) => toolId);
}

// 4. CORRECTED: SAFE UI REORDERING (using data-platform attributes)
function reorderToolButtons(rankedTools) {
  const container = document.getElementById('platformsGrid');
  
  if (!container) {
    console.warn('❌ platformsGrid not found');
    return;
  }
  
  // Reset all existing highlights safely
  container.querySelectorAll('[data-platform]').forEach(el => {
    el.classList.remove('recommended-tool');
    el.removeAttribute('data-recommendation');
    const badge = el.querySelector('.recommendation-badge');
    if (badge) badge.remove();
  });
  
  // Map platform elements
  const buttons = {};
  rankedTools.forEach(toolId => {
    const el = container.querySelector(`[data-platform="${toolId}"]`);
    if (el) buttons[toolId] = el;
  });
  
  // Reorder safely using fragment
  const fragment = document.createDocumentFragment();
  rankedTools.forEach(toolId => {
    if (buttons[toolId]) {
      fragment.appendChild(buttons[toolId]);
    }
  });
  
  // Clear and re-add buttons
  container.innerHTML = '';
  container.appendChild(fragment);
  
  // Highlight best match
  const topTool = rankedTools[0];
  if (topTool && buttons[topTool]) {
    const topEl = buttons[topTool];
    topEl.classList.add('recommended-tool');
    topEl.setAttribute('data-recommendation', 'best-match');
    
    // Add badge
    const badge = document.createElement('span');
    badge.className = 'recommendation-badge';
    badge.textContent = '✨ Best Match';
    badge.style.cssText = `
      margin-left: 8px;
      font-size: 0.75em;
      background: linear-gradient(135deg, #4f46e5, #7c73ff);
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: bold;
    `;
    
    topEl.appendChild(badge);
  }
}

// 5. ADD EXPLANATION
function showRankingExplanation(taskAnalysis, topToolId) {
  // Remove previous explanation
  const prevExplanation = document.querySelector('.ranking-explanation');
  if (prevExplanation) prevExplanation.remove();
  
  const tool = AI_TOOLS[topToolId];
  const container = document.querySelector('.tool-container, .card-3, .output-section');
  if (!container || !tool) return;
  
  const explanation = document.createElement('div');
  explanation.className = 'ranking-explanation';
  explanation.innerHTML = `
    <div style="
      background: #f8f9ff;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 16px;
      border-left: 4px solid #4f46e5;
      font-size: 0.9em;
    ">
      <strong style="color: #4f46e5;">Why ${tool.name}?</strong>
      <p style="margin: 6px 0 4px 0; color: #333;">${tool.explanation}</p>
      <small style="color: #666; display: block; margin-top: 4px;">
        This prompt appears to be <strong>${taskAnalysis.taskType.replace('-', ' ')}</strong>
        ${taskAnalysis.confidence === 'high' ? '— strong match' : ''}
      </small>
    </div>
  `;
  
  container.appendChild(explanation);
}

// 6. MAIN INTEGRATION FUNCTION
function applySmartToolRanking(generatedPrompt) {
  if (!generatedPrompt || generatedPrompt.length < 50) {
    console.log('Prompt too short for ranking');
    return;
  }
  
  try {
    // Analyze the generated prompt
    const taskAnalysis = analyzeGeneratedPrompt(generatedPrompt);
    
    // Rank tools for this task
    const rankedTools = rankToolsForTask(taskAnalysis);
    
    // Reorder UI buttons safely
    reorderToolButtons(rankedTools);
    
    // Show explanation
    showRankingExplanation(taskAnalysis, rankedTools[0]);
    
    // Optional: Store for analytics
    if (typeof window.trackEvent === 'function') {
      window.trackEvent('tool_recommendation', {
        taskType: taskAnalysis.taskType,
        topTool: rankedTools[0],
        confidence: taskAnalysis.confidence
      });
    }
    
    console.log('✅ AI Tools ranked:', rankedTools, 'for:', taskAnalysis.taskType);
    
    return {
      success: true,
      topTool: rankedTools[0],
      taskType: taskAnalysis.taskType,
      confidence: taskAnalysis.confidence
    };
    
  } catch (error) {
    console.warn('❌ Tool ranking failed (non-critical):', error);
    return { success: false, error: error.message };
  }
}

// 7. FIXED: BULLETPROOF INTEGRATION
function integrateWithPromptCraft() {
  // Try multiple possible integration points
  const handler = 
    window.handlePromptResponse || 
    window.handleGenerationSuccess;
  
  if (handler) {
    const original = handler;
    const hookName = window.handlePromptResponse ? 'handlePromptResponse' : 'handleGenerationSuccess';
    
    window[hookName] = function(response) {
      // Call original handler
      original(response);
      
      // Apply ranking after UI settles
      setTimeout(() => {
        if (response && response.result) {
          applySmartToolRanking(response.result);
        }
      }, 100);
    };
    
    console.log('✅ Hooked into:', hookName);
  }
  
  // Also listen for custom events
  document.addEventListener('promptGenerated', (event) => {
    if (event.detail && event.detail.result) {
      setTimeout(() => {
        applySmartToolRanking(event.detail.result);
      }, 100);
    }
  });
  
  console.log('🚀 AI Tool Ranking System integrated with PromptCraft');
}

// 8. INITIALIZE ON LOAD
document.addEventListener('DOMContentLoaded', function() {
  // Add CSS styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .recommended-tool {
      border-color: #4f46e5 !important;
      background: linear-gradient(135deg, #f0f2ff, #ffffff) !important;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15) !important;
      transform: translateY(-1px);
      transition: all 0.3s ease;
    }
    
    .recommended-tool:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.2) !important;
    }
    
    .ranking-explanation {
      animation: fadeIn 0.3s ease;
    }
  `;
  document.head.appendChild(style);
  
  // Initialize integration (after app loads)
  setTimeout(integrateWithPromptCraft, 1000);
});

// 9. EXPORT FOR MODULAR USE
window.PromptCraftRanking = {
  analyzeGeneratedPrompt,
  rankToolsForTask,
  applySmartToolRanking,
  AI_TOOLS
};

console.log('📦 AI Tool Ranking System loaded (Version 1.0.1)');
