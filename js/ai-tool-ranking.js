// ============================================
// AI TOOL RANKING SYSTEM FOR PROMPTCRAFT
// File: ai-tool-ranking.js
// Version: 2.3.1 (Production Fixed - Clean DOM)
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

// 4. FIXED CLEAN DOM MOVEMENT (NO CLONING, NO CLEARING)
function reorderToolButtons(rankedTools, taskType, explanation = '') {
  const container = document.getElementById('platformsGrid');
  
  if (!container) {
    console.warn('❌ platformsGrid not found');
    return;
  }
  
  // Remove badges and highlights (DON'T CLONE!)
  container.querySelectorAll('[data-platform]').forEach(el => {
    el.classList.remove('recommended-tool');
    el.removeAttribute('data-recommendation');
    el.removeAttribute('data-current-task-type');
    el.removeAttribute('data-current-explanation');
    
    const badge = el.querySelector('.recommendation-badge');
    if (badge) badge.remove();
  });
  
  // CLEAN DOM REORDER: Just move elements (appendChild automatically moves)
  rankedTools.forEach(({ toolId }) => {
    const el = container.querySelector(`[data-platform="${toolId}"]`);
    if (el) {
      // appendChild automatically moves node to end (reorders)
      container.appendChild(el);
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
          position: absolute;
          top: -8px;
          right: -8px;
          background: #10b981;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          z-index: 100;
          animation: fadeOut 1s forwards;
        `;
        
        button.style.position = 'relative';
        button.appendChild(tempBadge);
        setTimeout(() => tempBadge.remove(), 1000);
      }
    });
    
    container.dataset.delegationSet = 'true';
  }
  
  // Highlight best match
  const topTool = rankedTools[0];
  if (topTool) {
    const topButton = container.querySelector(`[data-platform="${topTool.toolId}"]`);
    if (topButton) {
      topButton.classList.add('recommended-tool');
      topButton.setAttribute('data-recommendation', 'best-match');
      topButton.dataset.currentTaskType = taskType;
      topButton.dataset.currentExplanation = explanation;
      
      // Add badge
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
      
      badge.style.cssText = `
        position: absolute;
        top: -10px;
        right: -10px;
        font-size: 0.7em;
        background: linear-gradient(135deg, #4f46e5, #7c73ff);
        color: white;
        padding: 3px 8px;
        border-radius: 12px;
        font-weight: bold;
        z-index: 10;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      
      topButton.style.position = 'relative';
      topButton.appendChild(badge);
    }
  }
  
  // Store task type on all buttons for event delegation
  container.querySelectorAll('[data-platform]').forEach(btn => {
    btn.dataset.currentTaskType = taskType;
    btn.dataset.currentExplanation = explanation;
  });
}

// 5. ENHANCED EXPLANATION WITH USER PREFERENCE
function showRankingExplanation(taskAnalysis, topToolId, rankedTools, explanation = '') {
  // Remove previous explanation
  const prevExplanation = document.querySelector('.ranking-explanation');
  if (prevExplanation) prevExplanation.remove();
  
  const tool = AI_TOOLS[topToolId];
  const container = document.querySelector('.tool-container, .card-3, .output-section');
  if (!container || !tool) return;
  
  const userPref = UserPreferenceManager.getPreference(taskAnalysis.taskType);
  const userStats = UserPreferenceManager.getStats();
  
  let preferenceNote = '';
  if (userPref === topToolId && userStats.totalSelections > 0) {
    const prefCount = UserPreferenceManager.prefs[taskAnalysis.taskType]?.count || 0;
    preferenceNote = `<small style="color: #10b981; display: block; margin-top: 4px;">
      ✓ Based on your previous ${prefCount} selection${prefCount !== 1 ? 's' : ''} for similar tasks
    </small>`;
  }
  
  // Build explanation HTML
  const explanationEl = document.createElement('div');
  explanationEl.className = 'ranking-explanation';
  explanationEl.innerHTML = `
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
        Detected: <strong>${taskAnalysis.taskType.replace(/-/g, ' ')}</strong>
        ${taskAnalysis.confidence === 'high' ? '(strong match)' : ''}
      </small>
      ${preferenceNote}
    </div>
  `;
  
  container.appendChild(explanationEl);
}

// 6. SAFE APPLICATION WITH ERROR BOUNDARY
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
    
    // FIXED FALLBACK: Just don't do anything
    // Don't try to reorder or clear - just leave UI as-is
    // The icons will remain intact
    
    return { 
      success: false, 
      error: error.message,
      fallback: true 
    };
  }
}

// 7. DEBOUNCED INTEGRATION
const debouncedRanking = (function() {
  let timeout;
  return function(prompt) {
    clearTimeout(timeout);
    timeout = setTimeout(() => safeApplyRanking(prompt), 200);
  };
})();

// 8. SAFE METRICS DASHBOARD (OPTIONAL)
// Comment this function out if you don't want metrics
function showMetricsDashboard() {
  const stats = UserPreferenceManager.getStats();
  const dashboard = document.createElement('div');
  dashboard.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 1000;
    font-family: system-ui;
    font-size: 12px;
    max-width: 300px;
  `;
  
  dashboard.innerHTML = `
    <h4 style="margin-top:0; color:#4f46e5">📊 Ranking Metrics</h4>
    <div style="margin: 8px 0">
      <strong>Recommendation Accuracy:</strong><br>
      ${(stats.recommendationAccuracy * 100).toFixed(1)}% (${stats.totalSelections} selections)
    </div>
    <div style="margin: 8px 0">
      <strong>Most Common Tasks:</strong><br>
      ${Object.entries(stats.taskTypeDistribution || {})
        .sort((a,b) => b[1] - a[1])
        .slice(0,3)
        .map(([task, count]) => \`\${task.replace(/-/g,' ')}: \${count}\`)
        .join('<br>')}
    </div>
    <div style="margin: 8px 0">
      <strong>Recent Selections:</strong><br>
      ${stats.recentRecommendations?.slice(-3).map(rec => 
        \`\${rec.taskType.replace(/-/g,' ')} → \${AI_TOOLS[rec.toolId]?.name || rec.toolId}\`
      ).join('<br>') || 'None yet'}
    </div>
    <button onclick="this.parentElement.remove()" style="
      margin-top: 8px;
      background: #ef4444;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
    ">Close</button>
  `;
  
  document.body.appendChild(dashboard);
}

// 9. SAFE INITIALIZATION WITH OPTIONAL METRICS
document.addEventListener('DOMContentLoaded', function() {
  // Add CSS styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
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
    
    /* Safe badge positioning - no global position:relative */
    .recommendation-badge {
      position: absolute !important;
      top: -10px !important;
      right: -10px !important;
      font-size: 0.7em !important;
      background: linear-gradient(135deg, #4f46e5, #7c73ff) !important;
      color: white !important;
      padding: 3px 8px !important;
      border-radius: 12px !important;
      font-weight: bold !important;
      z-index: 10 !important;
      white-space: nowrap !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
    }
  `;
  document.head.appendChild(style);
  
  // Only add metrics toggle if dashboard function exists
  if (typeof showMetricsDashboard === 'function') {
    // Add metrics toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'metrics-toggle';
    toggleBtn.textContent = '📊';
    toggleBtn.title = 'Show ranking metrics';
    toggleBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
      z-index: 999;
    `;
    toggleBtn.onclick = showMetricsDashboard;
    document.body.appendChild(toggleBtn);
  }
  
  // Initialize integration (after app loads)
  setTimeout(() => {
    document.addEventListener('promptGenerated', (event) => {
      if (event.detail?.result) {
        // Use debounced ranking
        if (typeof debouncedRanking === 'function') {
          debouncedRanking(event.detail.result);
        } else {
          safeApplyRanking(event.detail.result);
        }
      }
    });
    
    console.log('🚀 Production AI Tool Ranking System v2.3.1 loaded');
    console.log('User preferences loaded:', UserPreferenceManager.getStats());
  }, 1000);
});

// 10. SAFE EXPORT WITH OPTIONAL FEATURES
window.PromptCraftRanking = {
  analyzeGeneratedPrompt,
  rankToolsForTask,
  applySmartToolRanking: safeApplyRanking,
  safeApplyRanking,
  AI_TOOLS,
  UserPreferenceManager,
  showMetricsDashboard: typeof showMetricsDashboard === 'function' 
    ? showMetricsDashboard 
    : function() { 
        console.warn('Metrics dashboard not available'); 
        return null; 
      },
  getRecommendationStats: () => UserPreferenceManager.getStats()
};

console.log('📦 Production AI Tool Ranking System loaded (Version 2.3.1)');
