// ai-tools.js - AI Tools Management and Dynamic Ordering

import { AI_TOOLS } from '../core/constants.js';

/**
 * Calculate tool scores based on task type and prompt content
 * @param {string} taskType - Detected task type
 * @param {string} promptText - Generated prompt text
 * @returns {Object} Tool scores
 */
export function calculateToolScores(taskType, promptText) {
  const scores = {};
  const lowerText = promptText.toLowerCase();
  
  AI_TOOLS.forEach(tool => {
    let score = 0;
    
    // Base score from task type weights
    score += tool.weights[taskType] || 5;
    
    // Bonus for specific keywords in prompt
    if (taskType === 'writing' && /story|creative|novel|poem|fiction/i.test(lowerText)) {
      if (tool.id === 'claude') score += 3;
    }
    
    if (taskType === 'analysis' && /research|web|search|internet/i.test(lowerText)) {
      if (tool.id === 'gemini') score += 3;
    }
    
    if (taskType === 'coding' && /code|program|debug|script/i.test(lowerText)) {
      if (tool.id === 'chatgpt') score += 2;
    }
    
    if (taskType === 'communication' && /email|formal|professional/i.test(lowerText)) {
      if (tool.id === 'claude') score += 2;
    }
    
    // Additional scoring factors
    if (lowerText.includes('creative') && tool.id === 'claude') score += 2;
    if (lowerText.includes('research') && tool.id === 'gemini') score += 2;
    if (lowerText.includes('general') && tool.id === 'chatgpt') score += 2;
    
    scores[tool.id] = score;
  });
  
  return scores;
}

/**
 * Order tools by their scores
 * @param {Object} scores - Tool scores
 * @returns {Array} Ordered tools with scores
 */
export function orderToolsByScore(scores) {
  return AI_TOOLS
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
  return orderedTools[0] || AI_TOOLS[0];
}

/**
 * Create HTML for AI tool card
 * @param {Object} tool - Tool object
 * @param {boolean} isEnabled - Whether tool is enabled
 * @returns {string} HTML string
 */
export function createToolCardHTML(tool, isEnabled = true) {
  const disabledClass = isEnabled ? '' : 'tool-card-disabled';
  
  return `
    <button class="tool-card ${disabledClass}" data-tool="${tool.id}">
      <div class="tool-icon" style="border-color: ${tool.color}; color: ${tool.color}">
        <i class="${tool.icon}"></i>
      </div>
      <div class="tool-body">
        <h4>${tool.name}</h4>
        <p>${tool.description}</p>
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
  
  return orderedTools.map(tool => 
    createToolCardHTML(tool, isConverted)
  ).join('');
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
      window.open(tool.url, '_blank');
    }, 500);
  } catch (error) {
    console.error('Clipboard error:', error);
    // Open tool even if clipboard fails
    window.open(tool.url, '_blank');
  }
}
