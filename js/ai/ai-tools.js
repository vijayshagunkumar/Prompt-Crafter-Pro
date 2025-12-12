// ai-tools.js - AI Tools Management and Dynamic Ordering

import { AI_TOOLS } from '../core/constants.js';

// Add DALL-E and Midjourney to the tools with CORRECT URLs
const ENHANCED_AI_TOOLS = [
  {
    id: "dalle",
    name: "DALL·E 3",
    description: "Best for realistic and creative AI images.",
    icon: "fas fa-palette",
    color: "#00A67E",
    url: "https://openai.com/index/dall-e-3/", // CORRECT DALL-E URL
    weights: {
      general: 5,
      writing: 3,
      communication: 2,
      analysis: 2,
      coding: 1,
      creative: 8,
      image_generation: 15,
      artistic: 7,
      realistic: 10
    },
    isImageTool: true
  },
  {
    id: "midjourney",
    name: "Midjourney",
    description: "Excellent for artistic and stylized images.",
    icon: "fas fa-paint-brush",
    color: "#1E1E1E",
    url: "https://www.midjourney.com/", // CORRECT Midjourney URL
    weights: {
      general: 4,
      writing: 2,
      communication: 1,
      analysis: 1,
      coding: 1,
      creative: 9,
      image_generation: 15,
      artistic: 10,
      stylized: 10,
      realistic: 6
    },
    isImageTool: true
  },
  ...AI_TOOLS.map(tool => {
    // Ensure ChatGPT has correct URL
    if (tool.id === "chatgpt") {
      return {
        ...tool,
        url: "https://chat.openai.com/"
      };
    }
    return tool;
  })
];

/**
 * Calculate tool scores based on task type and prompt content
 * @param {string} taskType - Detected task type
 * @param {string} promptText - Generated prompt text
 * @returns {Object} Tool scores
 */
export function calculateToolScores(taskType, promptText) {
  const scores = {};
  const lowerText = promptText.toLowerCase();
  
  // Check if it's an image-related prompt
  const isImagePrompt = taskType === 'image_generation' || 
                       /image|photo|picture|draw|illustrat|art|visual|graphic|design|sketch|poster|thumbnail|logo|banner|icon|cartoon|painting|sketch|drawing|visualize|generate.*image|create.*image/i.test(lowerText);
  
  ENHANCED_AI_TOOLS.forEach(tool => {
    let score = 0;
    
    // Base score from task type weights
    score += tool.weights[taskType] || 5;
    
    // HUGE bonus for image tools when it's an image prompt
    if (isImagePrompt && tool.isImageTool) {
      score += 25; // Massive boost to ensure they appear first
    }
    
    // Additional image-specific scoring
    if (isImagePrompt) {
      if (/realistic|photograph|photo|真实|사진|写真/i.test(lowerText) && tool.id === 'dalle') {
        score += 8;
      }
      if (/artistic|painting|style|stylized|art|artwork|illustration|cartoon|drawing|sketch|艺术家|그림|イラスト/i.test(lowerText) && tool.id === 'midjourney') {
        score += 8;
      }
    }
    
    // Original scoring logic for other tools
    if (taskType === 'writing' && /story|creative|novel|poem|fiction/i.test(lowerText)) {
      if (tool.id === 'claude') score += 3;
      if (tool.id === 'grok') score += 2;
    }
    
    if (taskType === 'analysis' && /research|web|search|internet/i.test(lowerText)) {
      if (tool.id === 'gemini') score += 3;
      if (tool.id === 'perplexity') score += 4;
    }
    
    if (taskType === 'coding' && /code|program|debug|script/i.test(lowerText)) {
      if (tool.id === 'chatgpt') score += 2;
      if (tool.id === 'deepseek') score += 3;
      if (tool.id === 'copilot') score += 4;
    }
    
    if (taskType === 'communication' && /email|formal|professional/i.test(lowerText)) {
      if (tool.id === 'claude') score += 2;
      if (tool.id === 'chatgpt') score += 2;
    }
    
    // Additional scoring factors
    if (lowerText.includes('creative') && tool.id === 'claude') score += 2;
    if (lowerText.includes('research') && tool.id === 'gemini') score += 2;
    if (lowerText.includes('general') && tool.id === 'chatgpt') score += 2;
    if (lowerText.includes('conversation') && tool.id === 'grok') score += 2;
    if (lowerText.includes('technical') && tool.id === 'deepseek') score += 2;
    
    scores[tool.id] = Math.max(1, score);
  });
  
  return scores;
}

/**
 * Order tools by their scores
 * @param {Object} scores - Tool scores
 * @returns {Array} Ordered tools with scores
 */
export function orderToolsByScore(scores) {
  return ENHANCED_AI_TOOLS
    .map(tool => ({
      ...tool,
      score: scores[tool.id] || 0
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Get recommended tool for task
 * @param {string} taskType - Detected task type
 * @param {string} promptText - Generated prompt text
 * @returns {Object} Recommended tool
 */
export function getRecommendedTool(taskType, promptText) {
  const scores = calculateToolScores(taskType, promptText);
  const orderedTools = orderToolsByScore(scores);
  return orderedTools[0] || ENHANCED_AI_TOOLS[0];
}

/**
 * Create HTML for AI tool card
 * @param {Object} tool - Tool object
 * @param {boolean} isEnabled - Whether tool is enabled
 * @param {boolean} isBestMatch - Whether this is the best match
 * @returns {string} HTML string
 */
export function createToolCardHTML(tool, isEnabled = true, isBestMatch = false) {
  const disabledClass = isEnabled ? '' : 'tool-card-disabled';
  const bestMatchClass = isBestMatch ? 'best-match' : '';
  const toolDescription = tool.description || 'Open this AI tool with your prompt';
  
  return `
    <button class="tool-card ${disabledClass} ${bestMatchClass}" data-tool="${tool.id}" ${!isEnabled ? 'disabled' : ''}>
      <div class="tool-icon" style="border-color: ${tool.color}; color: ${tool.color}">
        <i class="${tool.icon}"></i>
      </div>
      <div class="tool-body">
        <h4>${tool.name}</h4>
        <p>${toolDescription}</p>
      </div>
      <div class="tool-footer">
        <span>Open</span>
        <i class="fas fa-arrow-up-right-from-square"></i>
      </div>
    </button>
  `;
}

/**
 * Render AI tools grid
 * @param {string} taskType - Detected task type
 * @param {string} promptText - Generated prompt text
 * @param {boolean} isConverted - Whether prompt is generated
 * @returns {string} HTML for tools grid
 */
export function renderAIToolsGrid(taskType = 'general', promptText = '', isConverted = false) {
  const scores = calculateToolScores(taskType, promptText);
  const orderedTools = orderToolsByScore(scores);
  
  // Mark the top tool as best match if it has significantly higher score
  const topScore = orderedTools[0]?.score || 0;
  const secondScore = orderedTools[1]?.score || 0;
  const isClearBestMatch = isConverted && (topScore > secondScore + 5);
  
  const toolsWithBestMatch = orderedTools.map((tool, index) => ({
    ...tool,
    isBestMatch: index === 0 && isClearBestMatch
  }));
  
  return toolsWithBestMatch.map(tool => {
    return createToolCardHTML(tool, isConverted, tool.isBestMatch);
  }).join('');
}

/**
 * Handle tool card click
 * @param {Object} tool - Tool object
 * @param {string} prompt - Generated prompt text
 * @param {Function} showNotification - Notification function
 */
export async function handleToolClick(tool, prompt, showNotification) {
  if (!prompt) {
    showNotification("Generate a prompt first");
    return;
  }

  if (!tool || !tool.url) {
    showNotification("Tool not configured yet");
    return;
  }

  try {
    // Copy prompt to clipboard
    await navigator.clipboard.writeText(prompt);
    showNotification(`Prompt copied! Opening ${tool.name}...`);
    
    // Open tool in new tab after short delay
    setTimeout(() => {
      window.open(tool.url, '_blank', 'noopener,noreferrer');
    }, 500);
  } catch (error) {
    console.error('Clipboard error:', error);
    showNotification(`Opening ${tool.name}...`);
    // Open tool even if clipboard fails
    window.open(tool.url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Setup tool click handlers
 * @param {Function} showNotification - Notification function
 */
export function setupToolClickHandlers(showNotification) {
  document.addEventListener('click', (e) => {
    const toolCard = e.target.closest('.tool-card');
    if (!toolCard || toolCard.classList.contains('tool-card-disabled')) {
      return;
    }

    const toolId = toolCard.dataset.tool;
    const outputEl = document.getElementById('output');
    const prompt = outputEl.value.trim();
    
    // Find the tool
    const tool = ENHANCED_AI_TOOLS.find(t => t.id === toolId);
    if (tool) {
      handleToolClick(tool, prompt, showNotification);
    }
  });
}

/**
 * Update AI tools grid dynamically
 * @param {string} taskType - Task type
 * @param {string} promptText - Prompt text
 * @param {boolean} isConverted - Whether converted
 */
export function updateAIToolsGrid(taskType, promptText, isConverted) {
  const toolsGrid = document.getElementById('aiToolsGrid');
  if (toolsGrid) {
    toolsGrid.innerHTML = renderAIToolsGrid(taskType, promptText, isConverted);
  }
}
