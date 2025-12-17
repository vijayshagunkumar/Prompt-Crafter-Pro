import { AI_TOOLS } from '../core/constants.js';
import { intentDetector } from './intent-detector.js';

export class ToolPrioritizer {
  constructor() {
    this.bestMatch = null;
    this.toolRankings = this.initializeToolRankings();
    this.setup();
  }
  
  initializeToolRankings() {
    return {
      // Image generation tasks
      'image_generation': [
        { id: 'dalle', name: 'DALL·E', icon: 'fa-robot', score: 95, reason: 'Best for AI image generation' },
        { id: 'midjourney', name: 'Midjourney', icon: 'fa-palette', score: 90, reason: 'Excellent for artistic images' },
        { id: 'chatgpt', name: 'ChatGPT', icon: 'fa-comment-dots', score: 60, reason: 'Can generate image prompts' }
      ],
      
      // Code generation tasks
      'code_generation': [
        { id: 'chatgpt', name: 'ChatGPT', icon: 'fa-comment-dots', score: 95, reason: 'Excellent for coding assistance' },
        { id: 'claude', name: 'Claude', icon: 'fa-robot', score: 90, reason: 'Strong coding capabilities' },
        { id: 'github', name: 'GitHub Copilot', icon: 'fa-code', score: 85, reason: 'Specialized for code completion' },
        { id: 'deepseek', name: 'DeepSeek', icon: 'fa-brain', score: 80, reason: 'Good for coding and analysis' }
      ],
      
      // Writing tasks
      'email_writing': [
        { id: 'claude', name: 'Claude', icon: 'fa-robot', score: 90, reason: 'Great for professional writing' },
        { id: 'chatgpt', name: 'ChatGPT', icon: 'fa-comment-dots', score: 85, reason: 'Versatile for all writing tasks' },
        { id: 'gemini', name: 'Gemini', icon: 'fa-google', score: 80, reason: 'Good for business communication' }
      ],
      
      'content_writing': [
        { id: 'chatgpt', name: 'ChatGPT', icon: 'fa-comment-dots', score: 90, reason: 'Versatile content creation' },
        { id: 'claude', name: 'Claude', icon: 'fa-robot', score: 85, reason: 'Strong long-form writing' },
        { id: 'gemini', name: 'Gemini', icon: 'fa-google', score: 80, reason: 'Good for SEO content' }
      ],
      
      'creative_writing': [
        { id: 'claude', name: 'Claude', icon: 'fa-robot', score: 95, reason: 'Excellent creative writing' },
        { id: 'chatgpt', name: 'ChatGPT', icon: 'fa-comment-dots', score: 85, reason: 'Good for creative tasks' }
      ],
      
      // Research tasks
      'research_analysis': [
        { id: 'perplexity', name: 'Perplexity', icon: 'fa-compass', score: 95, reason: 'Research-focused with citations' },
        { id: 'chatgpt', name: 'ChatGPT', icon: 'fa-comment-dots', score: 80, reason: 'Good for analysis and summaries' },
        { id: 'claude', name: 'Claude', icon: 'fa-robot', score: 75, reason: 'Strong analytical thinking' }
      ],
      
      // Emotional tasks
      'emotional_response': [
        { id: 'chatgpt', name: 'ChatGPT', icon: 'fa-comment-dots', score: 85, reason: 'Good at empathetic responses' },
        { id: 'claude', name: 'Claude', icon: 'fa-robot', score: 80, reason: 'Thoughtful and considerate' }
      ],
      
      // Business tasks
      'business_strategy': [
        { id: 'claude', name: 'Claude', icon: 'fa-robot', score: 90, reason: 'Strong analytical thinking' },
        { id: 'chatgpt', name: 'ChatGPT', icon: 'fa-comment-dots', score: 85, reason: 'Good for business planning' },
        { id: 'gemini', name: 'Gemini', icon: 'fa-google', score: 75, reason: 'Business-focused features' }
      ],
      
      // General tasks
      'general_qa': [
        { id: 'chatgpt', name: 'ChatGPT', icon: 'fa-comment-dots', score: 90, reason: 'General purpose AI assistant' },
        { id: 'claude', name: 'Claude', icon: 'fa-robot', score: 85, reason: 'Thoughtful and detailed responses' },
        { id: 'gemini', name: 'Gemini', icon: 'fa-google', score: 80, reason: 'Google-powered knowledge' }
      ]
    };
  }
  
  setup() {
    // Listen for intent changes
    const requirementEl = document.getElementById('requirement');
    if (requirementEl) {
      requirementEl.addEventListener('input', () => {
        setTimeout(() => this.updateToolPrioritization(), 300);
      });
    }
  }
  
  updateToolPrioritization() {
    const intent = intentDetector.getCurrentIntent();
    const tone = intentDetector.getCurrentTone();
    
    if (!intent) {
      this.hideBestMatch();
      this.resetToolOrder();
      return;
    }
    
    // Get rankings for this intent
    const rankings = this.toolRankings[intent.type] || this.toolRankings.general_qa;
    
    // Update best match display
    this.updateBestMatchDisplay(rankings[0], intent.label);
    
    // Reorder tools in Card 3
    this.reorderTools(rankings);
    
    // Apply visual highlights
    this.highlightTopTools(rankings.slice(0, 3));
  }
  
  updateBestMatchDisplay(bestTool, intentLabel) {
    let bestMatchEl = document.getElementById('bestMatchDisplay');
    
    if (!bestMatchEl) {
      bestMatchEl = document.createElement('div');
      bestMatchEl.id = 'bestMatchDisplay';
      bestMatchEl.className = 'best-match-display';
      
      // Remove the old hint text
      const launchHint = document.querySelector('.launch-hint');
      if (launchHint) {
        launchHint.replaceWith(bestMatchEl);
      } else {
        // Insert at the beginning of Card 3
        const card3 = document.querySelector('.step-card:nth-child(3) .step-header-main');
        if (card3) {
          card3.appendChild(bestMatchEl);
        }
      }
    }
    
    bestMatchEl.innerHTML = `
      <div class="best-match-header">
        <i class="fas fa-star"></i>
        <span class="best-match-label">Best Match:</span>
        <span class="best-match-tool">${bestTool.name}</span>
        <span class="best-match-reason">(${intentLabel})</span>
      </div>
      <div class="best-match-details">
        <i class="fas ${bestTool.icon}"></i>
        <span>${bestTool.reason}</span>
      </div>
    `;
    
    this.bestMatch = bestTool;
  }
  
  hideBestMatch() {
    const bestMatchEl = document.getElementById('bestMatchDisplay');
    if (bestMatchEl) {
      bestMatchEl.style.display = 'none';
    }
  }
  
  reorderTools(rankings) {
    const launchList = document.querySelector('.launch-list');
    if (!launchList) return;
    
    // Create a map of tool IDs to their elements
    const toolElements = {};
    Array.from(launchList.children).forEach(child => {
      const toolId = child.id.replace('Btn', '');
      toolElements[toolId] = child;
    });
    
    // Clear the list
    launchList.innerHTML = '';
    
    // Add tools in ranked order
    rankings.forEach(rank => {
      if (toolElements[rank.id]) {
        launchList.appendChild(toolElements[rank.id]);
      }
    });
    
    // Add any remaining tools
    Object.keys(toolElements).forEach(toolId => {
      if (!rankings.find(r => r.id === toolId)) {
        launchList.appendChild(toolElements[toolId]);
      }
    });
  }
  
  highlightTopTools(topTools) {
    // Remove all highlights first
    document.querySelectorAll('.launch-btn').forEach(btn => {
      btn.classList.remove('top-match', 'second-match', 'third-match');
    });
    
    // Apply highlights
    topTools.forEach((tool, index) => {
      const btn = document.getElementById(`${tool.id}Btn`);
      if (btn) {
        if (index === 0) btn.classList.add('top-match');
        if (index === 1) btn.classList.add('second-match');
        if (index === 2) btn.classList.add('third-match');
      }
    });
  }
  
  resetToolOrder() {
    const launchList = document.querySelector('.launch-list');
    if (!launchList) return;
    
    // Default order
    const defaultOrder = ['chatgpt', 'claude', 'gemini', 'perplexity', 'dalle', 'midjourney', 'deepseek', 'copilot', 'grok'];
    
    // Reorder to default
    const toolElements = {};
    Array.from(launchList.children).forEach(child => {
      const toolId = child.id.replace('Btn', '');
      toolElements[toolId] = child;
    });
    
    launchList.innerHTML = '';
    defaultOrder.forEach(toolId => {
      if (toolElements[toolId]) {
        launchList.appendChild(toolElements[toolId]);
      }
    });
    
    // Remove highlights
    document.querySelectorAll('.launch-btn').forEach(btn => {
      btn.classList.remove('top-match', 'second-match', 'third-match');
    });
  }
  
  getBestMatch() {
    return this.bestMatch;
  }
}

export const toolPrioritizer = new ToolPrioritizer();
