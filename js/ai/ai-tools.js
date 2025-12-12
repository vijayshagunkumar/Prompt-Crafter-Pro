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
    
    scores[tool.id] = Math.max(1, score); // Ensure minimum score of 1
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
  const toolDescription = tool.description || 'Open this AI tool with your prompt';
  
  return `
    <button class="tool-card ${disabledClass}" data-tool="${tool.id}" ${!isEnabled ? 'disabled' : ''}>
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
  
  // Mark the top tool as best match
  const toolsWithBestMatch = orderedTools.map((tool, index) => ({
    ...tool,
    isBestMatch: index === 0 && isConverted && tool.score > 7
  }));
  
  return toolsWithBestMatch.map(tool => {
    const bestMatchClass = tool.isBestMatch ? 'best-match' : '';
    return createToolCardHTML(tool, isConverted).replace('tool-card', `tool-card ${bestMatchClass}`);
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
      window.open(tool.url, '_blank');
    }, 500);
  } catch (error) {
    console.error('Clipboard error:', error);
    showNotification(`Opening ${tool.name}...`);
    // Open tool even if clipboard fails
    window.open(tool.url, '_blank');
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
    const tool = AI_TOOLS.find(t => t.id === toolId);
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
