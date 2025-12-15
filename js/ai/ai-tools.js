// ai-tools.js - AI Tools Management and Dynamic Ordering - FIXED VERSION

import { AI_TOOLS } from '../core/constants.js';

// Enhanced AI Tools with IMAGE TOOLS and BRAND ICONS
const ENHANCED_AI_TOOLS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "Best for general tasks, writing, and reasoning.",
    icon: "fa-brands fa-openai",
    color: "#74AA9C",
    url: "https://chat.openai.com/",
    brandIcon: "chatgpt", // SVG filename in assets/icons/
    weights: {
      general: 10,
      writing: 9,
      communication: 8,
      analysis: 7,
      coding: 6,
      creative: 7,
      image_generation: 3
    }
  },
  {
    id: "claude",
    name: "Claude",
    description: "Great for long-form text and thoughtful responses.",
    icon: "fa-brands fa-anthropic",
    color: "#DE7356",
    url: "https://claude.ai/",
    brandIcon: "claude", // SVG filename in assets/icons/
    weights: {
      writing: 10,
      analysis: 9,
      communication: 8,
      general: 7,
      coding: 6,
      creative: 9,
      image_generation: 2
    }
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Strong on web + research heavy prompts.",
    icon: "fa-brands fa-google",
    color: "#4796E3",
    url: "https://gemini.google.com/app",
    brandIcon: "gemini", // SVG filename in assets/icons/
    weights: {
      analysis: 10,
      research: 9,
      web: 8,
      general: 7,
      coding: 6,
      creative: 7,
      image_generation: 4
    }
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Excellent for research with citations and sources.",
    icon: "fas fa-search",
    color: "#20808D",
    url: "https://www.perplexity.ai/",
    brandIcon: "perplexity", // SVG filename in assets/icons/
    weights: {
      research: 10,
      analysis: 9,
      web: 10,
      general: 7,
      writing: 6,
      creative: 5,
      image_generation: 2
    }
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "Great for coding and technical tasks.",
    icon: "fas fa-robot",
    color: "#00F3FF",
    url: "https://chat.deepseek.com/",
    brandIcon: "deepseek", // SVG filename in assets/icons/
    weights: {
      coding: 10,
      analysis: 8,
      technical: 9,
      general: 7,
      writing: 6,
      creative: 6,
      image_generation: 2
    }
  },
  {
    id: "copilot",
    name: "Copilot",
    description: "Microsoft's AI for coding and development.",
    icon: "fa-brands fa-microsoft",
    color: "#199FD7",
    url: "https://copilot.microsoft.com/",
    brandIcon: "copilot", // SVG filename in assets/icons/
    weights: {
      coding: 10,
      technical: 9,
      analysis: 7,
      general: 6,
      writing: 5,
      creative: 6,
      image_generation: 3
    }
  },
  {
    id: "grok",
    name: "Grok",
    description: "X AI with real-time knowledge and wit.",
    icon: "fa-brands fa-x-twitter",
    color: "#FF5E00",
    url: "https://grok.x.ai/",
    brandIcon: "grok", // SVG filename in assets/icons/
    weights: {
      general: 9,
      creative: 8,
      writing: 7,
      analysis: 6,
      coding: 5,
      conversation: 9,
      image_generation: 3
    }
  },
  // IMAGE GENERATION TOOLS - Added with proper URLs
  {
    id: "dalle",
    name: "DALL·E 3",
    description: "Best for realistic and creative AI images.",
    icon: "fas fa-palette",
    color: "#00A67E",
    url: "https://chat.openai.com/", // ChatGPT has DALL-E built in
    brandIcon: "dalle", // SVG filename in assets/icons/
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
    url: "https://www.midjourney.com/",
    brandIcon: "midjourney", // SVG filename in assets/icons/
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
  }
];

// NEW: SVG icon mapping for brand icons
const SVG_ICONS = {
  chatgpt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#74AA9C">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-10h4v2h-4zm0 4h4v2h-4z"/>
  </svg>`,
  claude: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#DE7356">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
  </svg>`,
  gemini: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#4796E3">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-10h4v2h-4zm0 4h4v2h-4z"/>
  </svg>`,
  perplexity: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#20808D">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
  </svg>`,
  deepseek: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#00F3FF">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-10h4v2h-4zm0 4h4v2h-4z"/>
  </svg>`,
  copilot: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#199FD7">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-10h4v2h-4zm0 4h4v2h-4z"/>
  </svg>`,
  grok: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#FF5E00">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-10h4v2h-4zm0 4h4v2h-4z"/>
  </svg>`,
  dalle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#00A67E">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-10h4v2h-4zm0 4h4v2h-4z"/>
  </svg>`,
  midjourney: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#1E1E1E">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-10h4v2h-4zm0 4h4v2h-4z"/>
  </svg>`
};

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
 * Create HTML for AI tool card with BRAND ICONS
 * @param {Object} tool - Tool object
 * @param {boolean} isEnabled - Whether tool is enabled
 * @param {boolean} isBestMatch - Whether this is the best match
 * @returns {string} HTML string
 */
export function createToolCardHTML(tool, isEnabled = true, isBestMatch = false) {
  const disabledClass = isEnabled ? '' : 'tool-card-disabled';
  const bestMatchClass = isBestMatch ? 'best-match' : '';
  const toolDescription = tool.description || 'Open this AI tool with your prompt';
  
  // Use SVG brand icon if available, fallback to Font Awesome
  const iconHTML = SVG_ICONS[tool.brandIcon] 
    ? `<div class="tool-icon-svg">${SVG_ICONS[tool.brandIcon]}</div>`
    : `<i class="${tool.icon}"></i>`;
  
  return `
    <button class="tool-card ${disabledClass} ${bestMatchClass}" data-tool="${tool.id}" ${!isEnabled ? 'disabled' : ''}>
      <div class="tool-icon" style="border-color: ${tool.color}; color: ${tool.color}">
        ${iconHTML}
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
    const prompt = outputEl ? outputEl.value.trim() : '';
    
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

/**
 * Get all AI tools
 * @returns {Array} All AI tools
 */
export function getAllAITools() {
  return ENHANCED_AI_TOOLS;
}

/**
 * Load SVG icons for tool cards
 * This should be called once on page load
 */
export function loadBrandIcons() {
  // Add CSS for SVG icons
  const style = document.createElement('style');
  style.textContent = `
    .tool-icon-svg {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .tool-icon-svg svg {
      width: 16px;
      height: 16px;
    }
  `;
  document.head.appendChild(style);
}
