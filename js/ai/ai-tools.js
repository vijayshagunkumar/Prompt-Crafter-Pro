// ai-tools.js - Updated with image AI tools

import { AI_TOOLS } from '../core/constants.js';

// Updated AI tools list with DALL-E and Midjourney
export const AI_TOOLS_WITH_IMAGE = [
  {
    id: "dalle",
    name: "DALL·E 3",
    description: "Best for realistic and creative AI images.",
    icon: "fas fa-palette",
    color: "#00A67E",
    url: "https://chat.openai.com/",
    weights: {
      image_generation: 10,
      creative: 9,
      realistic: 8,
      general: 5,
      writing: 3,
      analysis: 2
    },
    categories: ["image"]
  },
  {
    id: "midjourney",
    name: "Midjourney",
    description: "Excellent for artistic and stylized images.",
    icon: "fas fa-paint-brush",
    color: "#1E1E1E",
    url: "https://www.midjourney.com/",
    weights: {
      image_generation: 10,
      artistic: 9,
      stylized: 8,
      creative: 9,
      general: 4,
      writing: 2
    },
    categories: ["image"]
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "Best for general tasks, writing, and reasoning.",
    icon: "fa-brands fa-openai",
    color: "#74AA9C",
    url: "https://chat.openai.com/",
    weights: {
      general: 10,
      writing: 9,
      communication: 8,
      analysis: 7,
      coding: 6,
      creative: 7,
      image_generation: 3
    },
    categories: ["text"]
  },
  {
    id: "claude",
    name: "Claude",
    description: "Great for long-form text and thoughtful responses.",
    icon: "fas fa-sparkles",
    color: "#DE7356",
    url: "https://claude.ai/",
    weights: {
      writing: 10,
      analysis: 9,
      communication: 8,
      general: 7,
      coding: 6,
      creative: 9,
      image_generation: 1
    },
    categories: ["text"]
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Strong on web + research heavy prompts.",
    icon: "fas fa-infinity",
    color: "#4796E3",
    url: "https://gemini.google.com/app",
    weights: {
      analysis: 10,
      research: 9,
      web: 8,
      general: 7,
      coding: 6,
      creative: 7,
      image_generation: 2
    },
    categories: ["text"]
  }
];

/**
 * Enhanced scoring for image tools
 */
export function calculateToolScores(taskType, promptText) {
  const scores = {};
  const lowerText = promptText.toLowerCase();
  const isImagePrompt = taskType === 'image_generation' || 
                       /image|photo|picture|draw|illustrat|art|visual|graphic|design|sketch|poster|thumbnail|logo|banner|icon|cartoon/i.test(lowerText);
  
  AI_TOOLS_WITH_IMAGE.forEach(tool => {
    let score = 0;
    
    // Base score from task type weights
    score += tool.weights[taskType] || 5;
    
    // HUGE bonus for image tools when it's an image prompt
    if (isImagePrompt && tool.categories.includes("image")) {
      score += 15; // Massive boost
    }
    
    // Bonus for specific keywords
    if (isImagePrompt) {
      if (/realistic|photograph|photo/i.test(lowerText) && tool.id === 'dalle') score += 5;
      if (/artistic|painting|style|stylized|art/i.test(lowerText) && tool.id === 'midjourney') score += 5;
    }
    
    // Text task bonuses
    if (taskType === 'writing' && /story|creative|novel|poem|fiction/i.test(lowerText)) {
      if (tool.id === 'claude') score += 3;
    }
    
    if (taskType === 'analysis' && /research|web|search/i.test(lowerText)) {
      if (tool.id === 'gemini') score += 3;
    }
    
    if (taskType === 'coding' && /code|program|debug|script/i.test(lowerText)) {
      if (tool.id === 'chatgpt') score += 2;
    }
    
    scores[tool.id] = Math.max(1, score);
  });
  
  return scores;
}

/**
 * Render AI tools with "Best Match" for image tools
 */
export function renderAIToolsGrid(taskType = 'general', promptText = '', isConverted = false) {
  const scores = calculateToolScores(taskType, promptText);
  const orderedTools = AI_TOOLS_WITH_IMAGE
    .map(tool => ({
      ...tool,
      score: scores[tool.id] || 0
    }))
    .sort((a, b) => b.score - a.score);
  
  // Mark the top tool as best match if it has significantly higher score
  const topScore = orderedTools[0]?.score || 0;
  const secondScore = orderedTools[1]?.score || 0;
  const isClearBestMatch = topScore > secondScore + 3; // Clear winner
  
  return orderedTools.map((tool, index) => {
    const isBestMatch = index === 0 && isConverted && isClearBestMatch;
    
    return `
      <div class="tool-card ${isBestMatch ? 'best-match' : ''}" data-tool="${tool.id}">
        <div class="tool-icon" style="border-color: ${tool.color}; color: ${tool.color}">
          <i class="${tool.icon}"></i>
        </div>
        <div class="tool-info">
          <h4>${tool.name}</h4>
          <p>${tool.description}</p>
        </div>
        <div class="tool-arrow">
          <i class="fas fa-arrow-up-right-from-square"></i>
        </div>
      </div>
    `;
  }).join('');
}

// Keep other functions the same...
