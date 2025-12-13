// ai-tools.js - AI Tools Management and Dynamic Ordering (STREAMLINED & COMPLETE)

import { AI_TOOLS } from '../core/constants.js';
import { showNotification, showSuccess, showError } from '../ui/notifications.js';

// Enhanced AI Tools with CONCISE content and official icons
const ENHANCED_AI_TOOLS = [
  {
    id: "dalle",
    name: "DALL·E 3",
    description: "Best for realistic and creative AI images.",
    specialty: "Realistic Images",
    icon: "fas fa-robot", // OpenAI official style
    brandIcon: "fab fa-openai", // OpenAI brand
    color: "#00A67E",
    url: "https://chat.openai.com/",
    weights: {
      image_generation: 15,
      realistic: 10,
      creative: 8,
      artistic: 7
    },
    isImageTool: true,
    officialIcon: true
  },
  {
    id: "midjourney",
    name: "Midjourney",
    description: "Excellent for artistic and stylized images.",
    specialty: "Artistic Styles",
    icon: "fas fa-paint-brush",
    brandIcon: "fas fa-crown", // Midjourney crown icon
    color: "#1E1E1E",
    url: "https://www.midjourney.com/",
    weights: {
      image_generation: 15,
      artistic: 10,
      stylized: 10,
      creative: 9,
      realistic: 6
    },
    isImageTool: true,
    officialIcon: true
  },
  {
    id: "stable-diffusion",
    name: "Stable Diffusion",
    description: "Open-source image generation with control.",
    specialty: "Open-Source Control",
    icon: "fas fa-cube",
    brandIcon: "fas fa-code-branch", // Open source icon
    color: "#8B5CF6",
    url: "https://stablediffusionweb.com/",
    weights: {
      image_generation: 14,
      control: 10,
      artistic: 9,
      creative: 9,
      realistic: 7
    },
    isImageTool: true,
    officialIcon: false
  },
  // Text AI Tools - Streamlined
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "Best for general tasks, writing, and reasoning.",
    specialty: "General AI Assistant",
    icon: "fab fa-openai",
    brandIcon: "fab fa-openai",
    color: "#74AA9C",
    url: "https://chat.openai.com/",
    weights: {
      general: 10,
      writing: 9,
      communication: 8,
      coding: 6
    },
    isImageTool: false,
    officialIcon: true
  },
  {
    id: "claude",
    name: "Claude",
    description: "Great for long-form text and thoughtful responses.",
    specialty: "Long-Form Writing",
    icon: "fas fa-sparkles",
    brandIcon: "fas fa-brain", // Anthropic brain icon
    color: "#DE7356",
    url: "https://claude.ai/",
    weights: {
      writing: 10,
      analysis: 9,
      communication: 8,
      creative: 9
    },
    isImageTool: false,
    officialIcon: true
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Strong on web + research heavy prompts.",
    specialty: "Web Research",
    icon: "fas fa-infinity",
    brandIcon: "fas fa-google", // Google brand
    color: "#4796E3",
    url: "https://gemini.google.com/app",
    weights: {
      research: 10,
      web: 9,
      analysis: 8
    },
    isImageTool: false,
    officialIcon: true
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Excellent for research with citations and sources.",
    specialty: "Cited Research",
    icon: "fas fa-search",
    brandIcon: "fas fa-question", // Perplexity question mark
    color: "#20808D",
    url: "https://www.perplexity.ai/",
    weights: {
      research: 10,
      web: 10,
      analysis: 9
    },
    isImageTool: false,
    officialIcon: true
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "Great for coding and technical tasks.",
    specialty: "Coding Tasks",
    icon: "fas fa-robot",
    brandIcon: "fas fa-terminal", // Code terminal
    color: "#00F3FF",
    url: "https://chat.deepseek.com/",
    weights: {
      coding: 10,
      technical: 9,
      analysis: 8
    },
    isImageTool: false,
    officialIcon: true
  },
  {
    id: "copilot",
    name: "Copilot",
    description: "Microsoft's AI for coding and development.",
    specialty: "Development",
    icon: "fas fa-code",
    brandIcon: "fab fa-microsoft", // Microsoft brand
    color: "#199FD7",
    url: "https://copilot.microsoft.com/",
    weights: {
      coding: 10,
      technical: 9
    },
    isImageTool: false,
    officialIcon: true
  },
  {
    id: "grok",
    name: "Grok",
    description: "X AI with real-time knowledge and wit.",
    specialty: "Real-Time Knowledge",
    icon: "fas fa-brain",
    brandIcon: "fab fa-twitter", // X/Twitter brand
    color: "#FF5E00",
    url: "https://grok.x.ai/",
    weights: {
      general: 9,
      conversation: 9,
      creative: 8
    },
    isImageTool: false,
    officialIcon: true
  }
];

/**
 * Calculate tool scores based on task type and prompt content
 * @param {string} taskType - Detected task type
 * @param {string} promptText - Generated prompt text
 * @returns {Object} Tool scores
 */
export function calculateToolScores(taskType, promptText) {
  const scores = {};
  const lowerText = (promptText || '').toLowerCase();
  
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
      if (/control|precise|detailed|specific|自定义|컨트롤/i.test(lowerText) && tool.id === 'stable-diffusion') {
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
    
    // Cap score at reasonable maximum
    scores[tool.id] = Math.min(100, Math.max(1, score));
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
      score: scores[tool.id] || 0,
      formattedScore: (scores[tool.id] || 0).toFixed(1)
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
 * Get top N tools for task
 * @param {string} taskType - Detected task type
 * @param {string} promptText - Generated prompt text
 * @param {number} count - Number of tools to return
 * @returns {Array} Top N tools
 */
export function getTopTools(taskType, promptText, count = 3) {
  const scores = calculateToolScores(taskType, promptText);
  const orderedTools = orderToolsByScore(scores);
  return orderedTools.slice(0, count);
}

/**
 * Create HTML for AI tool card - STREAMLINED VERSION
 * @param {Object} tool - Tool object
 * @param {boolean} isEnabled - Whether tool is enabled
 * @param {boolean} isBestMatch - Whether this is the best match
 * @returns {string} HTML string
 */
export function createToolCardHTML(tool, isEnabled = true, isBestMatch = false) {
  const disabledClass = isEnabled ? '' : 'disabled';
  const bestMatchClass = isBestMatch ? 'best-match' : '';
  const hasOfficialIcon = tool.officialIcon;
  
  // Use official brand icon when available
  const displayIcon = hasOfficialIcon && tool.brandIcon ? tool.brandIcon : tool.icon;
  
  return `
    <div class="ai-tool-card ${disabledClass} ${bestMatchClass}" data-tool="${tool.id}" role="button" tabindex="0">
      <div class="ai-tool-header">
        <div class="ai-tool-icon" style="background: ${tool.color || 'var(--gradient-primary)'};">
          <i class="${displayIcon}"></i>
          ${hasOfficialIcon ? '<span class="official-badge" title="Official Brand Icon">✓</span>' : ''}
        </div>
        <div class="ai-tool-info">
          <h4 class="ai-tool-name">${tool.name}</h4>
          <div class="ai-tool-specialty">${tool.specialty || 'AI Assistant'}</div>
        </div>
      </div>
      <div class="ai-tool-footer">
        <div class="ai-tool-action">
          <span class="ai-tool-action-text">Use this AI</span>
          <i class="fas fa-arrow-up-right-from-square"></i>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render AI tools grid - STREAMLINED CONTENT
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
    showNotification("Generate a prompt first", "ERROR");
    return;
  }

  if (!tool || !tool.url) {
    showNotification("Tool not configured yet", "ERROR");
    return;
  }

  try {
    // Show loading state
    const originalText = showNotification(`Opening ${tool.name}...`, "INFO");
    
    // Copy prompt to clipboard
    let copySuccess = false;
    try {
      await navigator.clipboard.writeText(prompt);
      copySuccess = true;
    } catch (clipboardError) {
      console.warn('Clipboard API failed, trying fallback:', clipboardError);
      // Try fallback method
      const textArea = document.createElement('textarea');
      textArea.value = prompt;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      copySuccess = document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    if (copySuccess) {
      showNotification(`Prompt copied! Opening ${tool.name}...`, "SUCCESS");
    } else {
      showNotification(`Opening ${tool.name}... (Copy failed)`, "WARNING");
    }
    
    // Open tool in new tab after short delay
    setTimeout(() => {
      const newWindow = window.open(tool.url, '_blank', 'noopener,noreferrer');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup blocked or failed to open
        showNotification(`Popup blocked! Please allow popups for ${tool.name} or manually visit: ${tool.url}`, "ERROR", 5000);
      }
    }, 500);
  } catch (error) {
    console.error('Tool click error:', error);
    showNotification(`Failed to open ${tool.name}: ${error.message}`, "ERROR");
  }
}

/**
 * Setup tool click handlers
 * @param {Function} showNotification - Notification function
 */
export function setupToolClickHandlers(showNotification) {
  document.addEventListener('click', (e) => {
    const toolCard = e.target.closest('.ai-tool-card');
    if (!toolCard || toolCard.classList.contains('disabled')) {
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
  
  // Add keyboard accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const toolCard = document.activeElement;
      if (toolCard && toolCard.classList.contains('ai-tool-card') && !toolCard.classList.contains('disabled')) {
        e.preventDefault();
        toolCard.click();
      }
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
 * Get all available tools
 * @returns {Array} All AI tools
 */
export function getAllTools() {
  return ENHANCED_AI_TOOLS;
}

/**
 * Get tool by ID
 * @param {string} toolId - Tool ID
 * @returns {Object|null} Tool object or null
 */
export function getToolById(toolId) {
  return ENHANCED_AI_TOOLS.find(tool => tool.id === toolId) || null;
}

/**
 * Get tools by category
 * @param {string} category - Tool category
 * @returns {Array} Filtered tools
 */
export function getToolsByCategory(category) {
  switch (category) {
    case 'image':
      return ENHANCED_AI_TOOLS.filter(tool => tool.isImageTool);
    case 'text':
      return ENHANCED_AI_TOOLS.filter(tool => !tool.isImageTool);
    case 'coding':
      return ENHANCED_AI_TOOLS.filter(tool => 
        tool.id === 'chatgpt' || 
        tool.id === 'claude' || 
        tool.id === 'deepseek' || 
        tool.id === 'copilot'
      );
    case 'research':
      return ENHANCED_AI_TOOLS.filter(tool => 
        tool.id === 'gemini' || 
        tool.id === 'perplexity'
      );
    default:
      return ENHANCED_AI_TOOLS;
  }
}

/**
 * Export tools configuration
 * @returns {Object} Tools configuration
 */
export function exportToolsConfig() {
  return {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    tools: ENHANCED_AI_TOOLS.map(tool => ({
      id: tool.id,
      name: tool.name,
      specialty: tool.specialty,
      url: tool.url,
      category: tool.isImageTool ? 'image' : 'text'
    }))
  };
}

/**
 * Import tools configuration
 * @param {Object} config - Tools configuration
 */
export function importToolsConfig(config) {
  // This would merge imported config with existing tools
  console.log('Importing tools config:', config);
  // Implementation would depend on specific requirements
}

/**
 * Validate tool URLs
 * @returns {Array} Validation results
 */
export function validateToolUrls() {
  return ENHANCED_AI_TOOLS.map(tool => ({
    id: tool.id,
    name: tool.name,
    url: tool.url,
    isValid: tool.url && tool.url.startsWith('http'),
    message: tool.url ? (tool.url.startsWith('http') ? 'Valid' : 'Invalid URL') : 'No URL'
  }));
}

/**
 * Search tools by keyword
 * @param {string} keyword - Search keyword
 * @returns {Array} Filtered tools
 */
export function searchTools(keyword) {
  const searchTerm = keyword.toLowerCase();
  return ENHANCED_AI_TOOLS.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm) ||
    tool.specialty.toLowerCase().includes(searchTerm) ||
    tool.description.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get tools statistics
 * @returns {Object} Tools statistics
 */
export function getToolsStatistics() {
  const totalTools = ENHANCED_AI_TOOLS.length;
  const imageTools = ENHANCED_AI_TOOLS.filter(tool => tool.isImageTool).length;
  const textTools = totalTools - imageTools;
  const officialTools = ENHANCED_AI_TOOLS.filter(tool => tool.officialIcon).length;
  
  return {
    total: totalTools,
    imageTools,
    textTools,
    officialTools,
    categories: {
      image: imageTools,
      text: textTools,
      official: officialTools,
      free: ENHANCED_AI_TOOLS.filter(tool => 
        tool.id === 'chatgpt' || 
        tool.id === 'gemini' || 
        tool.id === 'claude'
      ).length,
      paid: ENHANCED_AI_TOOLS.filter(tool => 
        tool.id === 'midjourney' || 
        tool.id === 'dalle'
      ).length
    }
  };
}

/**
 * Get tool specialties (for filtering)
 * @returns {Array} Unique specialties
 */
export function getToolSpecialties() {
  const specialties = new Set();
  ENHANCED_AI_TOOLS.forEach(tool => {
    if (tool.specialty) {
      specialties.add(tool.specialty);
    }
  });
  return Array.from(specialties).sort();
}

/**
 * Filter tools by specialty
 * @param {string} specialty - Specialty to filter by
 * @returns {Array} Filtered tools
 */
export function filterToolsBySpecialty(specialty) {
  return ENHANCED_AI_TOOLS.filter(tool => tool.specialty === specialty);
}

/**
 * Get tool color scheme
 * @param {string} toolId - Tool ID
 * @returns {Object} Color scheme
 */
export function getToolColorScheme(toolId) {
  const tool = getToolById(toolId);
  if (!tool) return { primary: '#FF5E00', secondary: '#00F3FF' };
  
  return {
    primary: tool.color,
    secondary: tool.color === '#FF5E00' ? '#00F3FF' : '#FF5E00',
    gradient: `linear-gradient(135deg, ${tool.color} 0%, ${tool.color === '#FF5E00' ? '#00F3FF' : '#FF5E00'} 100%)`
  };
}

/**
 * Get tool preview data for Card 3
 * @param {string} toolId - Tool ID
 * @returns {Object} Preview data
 */
export function getToolPreview(toolId) {
  const tool = getToolById(toolId);
  if (!tool) return null;
  
  return {
    name: tool.name,
    specialty: tool.specialty,
    icon: tool.officialIcon && tool.brandIcon ? tool.brandIcon : tool.icon,
    color: tool.color,
    isOfficial: tool.officialIcon,
    bestFor: tool.description,
    category: tool.isImageTool ? 'image' : 'text'
  };
}

/**
 * Sort tools by score, name, or category
 * @param {Array} tools - Tools to sort
 * @param {string} sortBy - Sort criteria ('score', 'name', 'category')
 * @returns {Array} Sorted tools
 */
export function sortTools(tools, sortBy = 'score') {
  const toolsCopy = [...tools];
  
  switch (sortBy) {
    case 'name':
      return toolsCopy.sort((a, b) => a.name.localeCompare(b.name));
    case 'category':
      return toolsCopy.sort((a, b) => {
        const categoryA = a.isImageTool ? 'image' : 'text';
        const categoryB = b.isImageTool ? 'image' : 'text';
        return categoryA.localeCompare(categoryB) || a.name.localeCompare(b.name);
      });
    case 'score':
    default:
      return toolsCopy.sort((a, b) => b.score - a.score);
  }
}
