// ============================================
// AI TOOL RANKING SYSTEM FOR PROMPTCRAFT
// File: ai-tool-ranking.js
// Version: 2.1.0 (Production Fixed)
// ============================================

// 1. AI TOOL CONFIGURATION
const AI_TOOLS = {
  chatgpt: {
    name: "ChatGPT",
    strengths: ["structured-prompt", "business-writing", "strategy", "email", "formatting", "instructions"],
    explanation: "Best for structured prompts and business strategy documents",
    icon: "🤖",
    buttonId: "chatgptBtn",
    weight: 92
  },
  
  claude: {
    name: "Claude",
    strengths: ["enterprise-strategy", "long-form", "analysis", "creative-writing", "documentation", "governance"],
    explanation: "Excellent for enterprise analysis and strategic documentation",
    icon: "🧠",
    buttonId: "claudeBtn",
    weight: 94
  },
  
  gemini: {
    name: "Gemini",
    strengths: ["research", "technical-analysis", "real-time", "multimodal", "fact-checking", "education"],
    explanation: "Great for technical research and competitive analysis",
    icon: "🔍",
    buttonId: "geminiBtn",
    weight: 88
  },
  
  perplexity: {
    name: "Perplexity",
    strengths: ["research", "citation", "academic", "market-research", "technical-analysis", "fact-checking"],
    explanation: "Perfect for market research with citations",
    icon: "📚",
    buttonId: "perplexityBtn",
    weight: 90
  },
  
  deepseek: {
    name: "DeepSeek",
    strengths: ["technical-architecture", "coding", "problem-solving", "math", "reasoning", "architecture"],
    explanation: "Specialized for technical architecture and coding tasks",
    icon: "💻",
    buttonId: "deepseekBtn",
    weight: 95
  }
};

// 1.1 TASK ALIAS MAPPING
const TASK_ALIASES = {
  'technical-architecture': ['architecture'],
  'enterprise-strategy': ['strategy'],
  'migration-planning': ['migration'],
  'governance-compliance': ['governance', 'compliance'],
  'stakeholder-communication': ['stakeholder', 'communication'],
  'digital-transformation': ['transformation', 'digital'],
  'workshop-facilitation': ['workshop', 'facilitation'],
  'risk-assessment': ['risk', 'assessment']
};

// 1.2 USER PREFERENCE SYSTEM (FIXED)
const UserPreferenceManager = {
  prefs: JSON.parse(localStorage.getItem('promptcraft_tool_prefs') || '{}'),
  history: JSON.parse(localStorage.getItem('promptcraft_selection_history') || '[]'),
  
  savePreference(taskType, toolId, explanation) {
    if (!this.prefs[taskType]) {
      this.prefs[taskType] = { 
        tool: toolId, 
        count: 1, 
        lastUsed: Date.now(),
        explanation: explanation
      };
    } else {
      this.prefs[taskType].count += 1;
      this.prefs[taskType].lastUsed = Date.now();
      // Update only after 3+ consistent uses
      if (this.prefs[taskType].tool !== toolId) {
        const taskHistory = this.history.filter(h => h.taskType === taskType);
        const sameToolCount = taskHistory.filter(h => h.toolId === toolId).length;
        if (sameToolCount >= 3) {
          this.prefs[taskType].tool = toolId;
          this.prefs[taskType].explanation = explanation;
        }
      }
    }
    localStorage.setItem('promptcraft_tool_prefs', JSON.stringify(this.prefs));
  },
  
  logSelection(taskType, toolId, wasRecommended, explanation = '') {
    const entry = {
      timestamp: Date.now(),
      taskType,
      toolId,
      wasRecommended,
      explanation,
      promptLength: window.lastGeneratedPrompt?.length || 0
    };
    this.history.push(entry);
    if (this.history.length > 100) this.history = this.history.slice(-50);
    localStorage.setItem('promptcraft_selection_history', JSON.stringify(this.history));
  },
  
  getPreference(taskType) {
    return this.prefs[taskType]?.tool;
  },
  
  getExplanation(taskType) {
    return this.prefs[taskType]?.explanation || '';
  },
  
  getConfidence(taskType) {
    const pref = this.prefs[taskType];
    if (!pref) return 0;
    return Math.min(pref.count / 5, 1);
  },
  
  getStats() {
    const stats = {
      totalSelections: this.history.length,
      recommendationAccuracy: 0,
      taskTypeDistribution: {},
      recentRecommendations: this.history.slice(-10)
    };
    
    if (this.history.length > 0) {
      const recommendedSelections = this.history.filter(h => h.wasRecommended);
      stats.recommendationAccuracy = recommendedSelections.length / this.history.length;
      
      this.history.forEach(h => {
        stats.taskTypeDistribution[h.taskType] = (stats.taskTypeDistribution[h.taskType] || 0) + 1;
      });
    }
    
    return stats;
  }
};

// 2. ROBUST PROMPT ANALYSIS (FIXED: requires 2+ keywords)
function analyzeGeneratedPrompt(promptText) {
  const text = promptText.toLowerCase();
  const analysis = { taskType: "general", confidence: "medium" };

  // ENTERPRISE TASKS (requires 2+ matching terms)
  const ENTERPRISE_CATEGORIES = [
    {
      type: 'enterprise-strategy',
      terms: ['strategy', 'roadmap', 'vision', 'initiative', 'planning'],
      minMatches: 2
    },
    {
      type: 'technical-architecture',
      terms: ['architecture', 'system design', 'infrastructure', 'solution design'],
      minMatches: 2
    },
    {
      type: 'migration-planning',
      terms: ['migration', 'transition', 'upgrade', 'modernization', 'legacy'],
      minMatches: 2
    },
    {
      type: 'governance-compliance',
      terms: ['governance', 'compliance', 'policy', 'standard', 'regulation'],
      minMatches: 2
    },
    {
      type: 'stakeholder-communication',
      terms: ['stakeholder', 'executive', 'board', 'leadership', 'presentation'],
      minMatches: 2
    }
  ];
  
  for (const category of ENTERPRISE_CATEGORIES) {
    const matches = category.terms.filter(term => text.includes(term)).length;
    if (matches >= category.minMatches) {
      analysis.taskType = category.type;
      analysis.confidence = "high";
      return analysis;
    }
  }

  // BUSINESS WRITING (single term is enough)
  const BUSINESS_TERMS = ['email', 'proposal', 'client', 'report', 'business', 'professional', 'presentation', 'deck'];
  for (const term of BUSINESS_TERMS) {
    if (text.includes(term)) {
      analysis.taskType = "business-writing";
      analysis.confidence = "high";
      return analysis;
    }
  }

  // STRUCTURED PROMPTS (exact patterns)
  if (
    (text.includes("task to perform:") && text.includes("requirements:")) ||
    (text.includes("format:") && text.includes("instructions:"))
  ) {
    analysis.taskType = "structured-prompt";
    analysis.confidence = "high";
    return analysis;
  }

  // TECHNICAL/CONTENT TASKS
  const CODING_TERMS = ['code', 'function', 'algorithm', 'program', 'debug', 'api', 'javascript', 'python'];
  if (CODING_TERMS.some(term => text.includes(term))) {
    analysis.taskType = "coding";
    analysis.confidence = "high";
    return analysis;
  }

  const RESEARCH_TERMS = ['research', 'analyze', 'study', 'compare', 'investigate', 'market', 'competitor'];
  if (RESEARCH_TERMS.some(term => text.includes(term))) {
    analysis.taskType = "research";
    analysis.confidence = "high";
    return analysis;
  }

  const CREATIVE_TERMS = ['story', 'creative', 'imagine', 'narrative', 'fiction', 'character'];
  if (CREATIVE_TERMS.some(term => text.includes(term))) {
    analysis.taskType = "creative-writing";
    analysis.confidence = "high";
    return analysis;
  }

  // LENGTH-BASED DETECTION
  if (promptText.length > 800) {
    analysis.taskType = "long-form";
    analysis.confidence = "medium";
    return analysis;
  }

  return analysis;
}

// 3. FIXED TOOL RANKING WITH ALIAS SUPPORT
function rankToolsForTask(taskAnalysis, promptText = '') {
  const scores = {};
  const userPref = UserPreferenceManager.getPreference(taskAnalysis.taskType);
  const userConfidence = UserPreferenceManager.getConfidence(taskAnalysis.taskType);
  const userPrefBoost = Math.floor(15 * userConfidence); // CAPPED at +15
  
  Object.entries(AI_TOOLS).forEach(([toolId, tool]) => {
    let score = tool.weight;
    
    // Check if tool matches task (with alias support)
    let matchesTask = false;
    if (tool.strengths.includes(taskAnalysis.taskType)) {
      matchesTask = true;
    } else if (TASK_ALIASES[taskAnalysis.taskType]) {
      // Check aliases
      matchesTask = TASK_ALIASES[taskAnalysis.taskType].some(alias => 
        tool.strengths.includes(alias)
      );
    }
    
    if (matchesTask) {
      score += 20;
    }
    
    // USER PREFERENCE BOOST (CAPPED)
    if (userPref === toolId && userConfidence > 0.3) {
      score += userPrefBoost;
    }
    
    // ENTERPRISE TASK BOOSTS
    if (taskAnalysis.taskType.startsWith('enterprise-') || 
        taskAnalysis.taskType === 'technical-architecture' ||
        taskAnalysis.taskType === 'migration-planning') {
      if (toolId === "claude") score += 25;
      if (toolId === "chatgpt") score += 15;
      if (toolId === "deepseek" && taskAnalysis.taskType === 'technical-architecture') score += 20;
    }
    
    // BUSINESS WRITING
    if (taskAnalysis.taskType === "business-writing") {
      if (toolId === "chatgpt") score += 25;
      if (toolId === "claude") score += 10;
    }
    
    // RESEARCH TASKS
    if (taskAnalysis.taskType === "research") {
      if (toolId === "gemini" || toolId === "perplexity") score += 15;
      if (toolId === "chatgpt") score += 5;
    }
    
    // CODING TASKS
    if (taskAnalysis.taskType === "coding") {
      if (toolId === "deepseek") score += 25;
      if (toolId === "chatgpt") score += 10;
    }
    
    scores[toolId] = score;
  });
  
  // Apply user preference as tie-breaker
  const ranked = Object.entries(scores)
    .sort((a, b) => {
      if (a[1] === b[1]) {
        if (a[0] === userPref) return -1;
        if (b[0] === userPref) return 1;
      }
      return b[1] - a[1];
    })
    .map(([toolId, score]) => ({ toolId, score }));
  
  return ranked;
}

// 4. FIXED REORDER WITH PROPER EVENT DELEGATION
function reorderToolButtons(rankedTools, taskType, explanation = '') {
  const container = document.getElementById('platformsGrid');
  
  if (!container) {
    console.warn('❌ platformsGrid not found');
    return;
  }
  
  // Cache original buttons BEFORE clearing
  const originalButtons = {};
  container.querySelectorAll('[data-platform]').forEach(el => {
    originalButtons[el.dataset.platform] = el.cloneNode(true);
    
    // Remove old badges and highlights
    el.classList.remove('recommended-tool');
    el.removeAttribute('data-recommendation');
    const badge = el.querySelector('.recommendation-badge');
    if (badge) badge.remove();
  });
  
  // Clear container
  container.innerHTML = '';
  
  // Add ranked buttons in order
  rankedTools.forEach(({ toolId }) => {
    if (originalButtons[toolId]) {
      container.appendChild(originalButtons[toolId]);
    }
  });
  
  // Set up event delegation ONCE at container level
  if (!container.dataset.delegationSet) {
    container.addEventListener('click', function(event) {
      const button = event.target.closest('[data-platform]');
      if (!button) return;
      
      const toolId = button.dataset.platform;
      const wasRecommended = button.classList.contains('recommended-tool');
      const currentTaskType = button.dataset.currentTaskType || 'general';
      const currentExplanation = button.dataset.currentExplanation || '';
      
      UserPreferenceManager.logSelection(currentTaskType, toolId, wasRecommended, currentExplanation);
      UserPreferenceManager.savePreference(currentTaskType, toolId, currentExplanation);
      
      // Optional: Show subtle feedback
      if (!wasRecommended) {
        const tempBadge = document.createElement('span');
        tempBadge.textContent = '✓';
        tempBadge.style.cssText = `
          margin-left: 8px;
          color: #10b981;
          font-weight: bold;
          animation: fadeOut 1s forwards;
        `;
        button.appendChild(tempBadge);
        setTimeout(() => tempBadge.remove(), 1000);
      }
    });
    
    container.dataset.delegationSet = 'true';
  }
  
  // Highlight best match
  const topTool = rankedTools[0];
  if (topTool && originalButtons[topTool.toolId]) {
    const topButton = container.querySelector(`[data-platform="${topTool.toolId}"]`);
    if (topButton) {
      topButton.classList.add('recommended-tool');
      topButton.setAttribute('data-recommendation', 'best-match');
      topButton.dataset.currentTaskType = taskType;
      topButton.dataset.currentExplanation = explanation;
      
      // Add badge with optional user preference indicator
      const badge = document.createElement('span');
      badge.className = 'recommendation-badge';
      
      const userPref = UserPreferenceManager.getPreference(taskType);
      const userConfidence = UserPreferenceManager.getConfidence(taskType);
      
      if (userPref === topTool.toolId && userConfidence > 0.5) {
        badge.textContent = '✨ Your Preferred';
        badge.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
      } else {
        badge.textContent = '✨ Best Match';
      }
      
      badge.style.cssText += `
        margin-left: 8px;
        font-size: 0.75em;
        background: linear-gradient(135deg, #4f46e5, #7c73ff);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: bold;
      `;
      
      topButton.appendChild(badge);
    }
  }
  
  // Store task type on all buttons for event delegation
  container.querySelectorAll('[data-platform]').forEach(btn => {
    btn.dataset.currentTaskType = taskType;
    btn.dataset.currentExplanation = explanation;
  });
}

// 5. FIXED FALLBACK LOGIC
function safeApplyRanking(generatedPrompt) {
  try {
    if (!generatedPrompt || generatedPrompt.length < 50) {
      return { success: false, reason: 'Prompt too short' };
    }
    
    // Analyze the generated prompt
    const taskAnalysis = analyzeGeneratedPrompt(generatedPrompt);
    
    // Rank tools for this task
    const rankedTools = rankToolsForTask(taskAnalysis, generatedPrompt);
    
    // Get explanation for storage
    const topTool = AI_TOOLS[rankedTools[0].toolId];
    const explanation = `${topTool.name}: ${topTool.explanation}`;
    
    // Reorder UI buttons
    reorderToolButtons(rankedTools, taskAnalysis.taskType, explanation);
    
    // Show explanation
    showRankingExplanation(taskAnalysis, rankedTools[0].toolId, rankedTools, explanation);
    
    // Track recommendation
    if (typeof window.trackEvent === 'function') {
      window.trackEvent('tool_recommendation', {
        taskType: taskAnalysis.taskType,
        topTool: rankedTools[0].toolId,
        confidence: taskAnalysis.confidence,
        userHasPreference: !!UserPreferenceManager.getPreference(taskAnalysis.taskType),
        explanation: explanation
      });
    }
    
    console.log(`✅ ${rankedTools[0].toolId} recommended for: ${taskAnalysis.taskType}`);
    
    return {
      success: true,
      topTool: rankedTools[0].toolId,
      taskType: taskAnalysis.taskType,
      confidence: taskAnalysis.confidence,
      explanation: explanation,
      scores: rankedTools,
      userStats: UserPreferenceManager.getStats()
    };
    
  } catch (error) {
    console.error('❌ Tool ranking failed:', error);
    
    // FIXED FALLBACK: Cache before clearing
    const container = document.getElementById('platformsGrid');
    if (container) {
      const buttons = {};
      container.querySelectorAll('[data-platform]').forEach(el => {
        buttons[el.dataset.platform] = el.cloneNode(true);
      });
      
      container.innerHTML = '';
      const defaultOrder = ['chatgpt', 'claude', 'gemini', 'perplexity', 'deepseek'];
      defaultOrder.forEach(toolId => {
        if (buttons[toolId]) container.appendChild(buttons[toolId]);
      });
    }
    
    return { 
      success: false, 
      error: error.message,
      fallback: true 
    };
  }
}

// [Remaining functions unchanged: showRankingExplanation, debouncedRanking, 
//  showMetricsDashboard, and initialization remain the same as v2.0.0]

// 10. EXPORT FOR MODULAR USE
window.PromptCraftRanking = {
  analyzeGeneratedPrompt,
  rankToolsForTask,
  applySmartToolRanking: safeApplyRanking,
  safeApplyRanking,
  AI_TOOLS,
  UserPreferenceManager,
  showMetricsDashboard,
  getRecommendationStats: () => UserPreferenceManager.getStats()
};

console.log('📦 Production AI Tool Ranking System loaded (Version 2.1.0)');
