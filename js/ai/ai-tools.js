// ai-tools.js - AI Tools Management with Beautiful Elegant Cards

import { AI_TOOLS } from '../core/constants.js';
import { showNotification, showSuccess, showError } from '../ui/notifications.js';

// Enhanced AI Tools with ELEGANT CARD STRUCTURE
const ENHANCED_AI_TOOLS = [
  {
    id: "dalle",
    name: "DALL·E 3",
    description: "Best for realistic and creative AI images.",
    specialty: "Realistic Images",
    icon: "fas fa-robot",
    brandIcon: "fab fa-openai",
    color: "#00A67E",
    url: "https://chat.openai.com/",
    weights: {
      image_generation: 15,
      realistic: 10,
      creative: 8,
      artistic: 7
    },
    isImageTool: true,
    isPopular: true,
    tags: ["Images", "AI Art", "OpenAI"]
  },
  {
    id: "midjourney",
    name: "Midjourney",
    description: "Excellent for artistic and stylized images.",
    specialty: "Artistic Styles",
    icon: "fas fa-paint-brush",
    brandIcon: "fas fa-crown",
    color: "#1E1E1E",
    url: "https://www.midjourney.com/",
    weights: {
      image_generation: 15,
      artistic: 10,
      stylized: 10,
      creative: 9
    },
    isImageTool: true,
    isPopular: true,
    tags: ["Art", "Design", "Premium"]
  },
  {
    id: "stable-diffusion",
    name: "Stable Diffusion",
    description: "Open-source image generation with control.",
    specialty: "Open-Source Control",
    icon: "fas fa-cube",
    brandIcon: "fas fa-code-branch",
    color: "#8B5CF6",
    url: "https://stablediffusionweb.com/",
    weights: {
      image_generation: 14,
      control: 10,
      artistic: 9
    },
    isImageTool: true,
    isPopular: false,
    tags: ["Open Source", "Customizable", "Free"]
  },
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
    isPopular: true,
    tags: ["Chat", "Writing", "Coding"]
  },
  {
    id: "claude",
    name: "Claude",
    description: "Great for long-form text and thoughtful responses.",
    specialty: "Long-Form Writing",
    icon: "fas fa-sparkles",
    brandIcon: "fas fa-brain",
    color: "#DE7356",
    url: "https://claude.ai/",
    weights: {
      writing: 10,
      analysis: 9,
      communication: 8
    },
    isImageTool: false,
    isPopular: true,
    tags: ["Writing", "Analysis", "Documents"]
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Strong on web + research heavy prompts.",
    specialty: "Web Research",
    icon: "fas fa-infinity",
    brandIcon: "fas fa-google",
    color: "#4796E3",
    url: "https://gemini.google.com/app",
    weights: {
      research: 10,
      web: 9,
      analysis: 8
    },
    isImageTool: false,
    isPopular: true,
    tags: ["Research", "Web", "Google"]
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Excellent for research with citations and sources.",
    specialty: "Cited Research",
    icon: "fas fa-search",
    brandIcon: "fas fa-question",
    color: "#20808D",
    url: "https://www.perplexity.ai/",
    weights: {
      research: 10,
      web: 10,
      analysis: 9
    },
    isImageTool: false,
    isPopular: false,
    tags: ["Research", "Citations", "Sources"]
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "Great for coding and technical tasks.",
    specialty: "Coding Tasks",
    icon: "fas fa-robot",
    brandIcon: "fas fa-terminal",
    color: "#00F3FF",
    url: "https://chat.deepseek.com/",
    weights: {
      coding: 10,
      technical: 9,
      analysis: 8
    },
    isImageTool: false,
    isPopular: false,
    tags: ["Coding", "Technical", "Free"]
  },
  {
    id: "copilot",
    name: "Copilot",
    description: "Microsoft's AI for coding and development.",
    specialty: "Development",
    icon: "fas fa-code",
    brandIcon: "fab fa-microsoft",
    color: "#199FD7",
    url: "https://copilot.microsoft.com/",
    weights: {
      coding: 10,
      technical: 9
    },
    isImageTool: false,
    isPopular: true,
    tags: ["Coding", "Microsoft", "Dev Tools"]
  },
  {
    id: "grok",
    name: "Grok",
    description: "X AI with real-time knowledge and wit.",
    specialty: "Real-Time Knowledge",
    icon: "fas fa-brain",
    brandIcon: "fab fa-twitter",
    color: "#FF5E00",
    url: "https://grok.x.ai/",
    weights: {
      general: 9,
      conversation: 9,
      creative: 8
    },
    isImageTool: false,
    isPopular: true,
    tags: ["Real-time", "Conversation", "X/Twitter"]
  }
];

// Calculate tool scores (same as before)
export function calculateToolScores(taskType, promptText) {
  const scores = {};
  const lowerText = (promptText || '').toLowerCase();
  const isImagePrompt = taskType === 'image_generation' || 
                       /image|photo|picture|draw|illustrat|art|visual|graphic|design|sketch|poster|thumbnail|logo|banner|icon|cartoon|painting|sketch|drawing|visualize|generate.*image|create.*image/i.test(lowerText);
  
  ENHANCED_AI_TOOLS.forEach(tool => {
    let score = tool.weights[taskType] || 5;
    
    if (isImagePrompt && tool.isImageTool) {
      score += 25;
    }
    
    if (isImagePrompt) {
      if (/realistic|photograph|photo/i.test(lowerText) && tool.id === 'dalle') score += 8;
      if (/artistic|painting|style|stylized|art|artwork|illustration|cartoon/i.test(lowerText) && tool.id === 'midjourney') score += 8;
      if (/control|precise|detailed|specific/i.test(lowerText) && tool.id === 'stable-diffusion') score += 8;
    }
    
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
    
    scores[tool.id] = Math.min(100, Math.max(1, score));
  });
  
  return scores;
}

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
 * Create BEAUTIFUL ELEGANT CARD for each AI tool
 * @param {Object} tool - Tool object
 * @param {boolean} isEnabled - Whether tool is enabled
 * @param {boolean} isBestMatch - Whether this is the best match
 * @returns {string} HTML string for elegant card
 */
export function createToolCardHTML(tool, isEnabled = true, isBestMatch = false) {
  const disabledClass = isEnabled ? '' : 'disabled';
  const bestMatchClass = isBestMatch ? 'best-match' : '';
  const popularClass = tool.isPopular ? 'popular' : '';
  const isImageTool = tool.isImageTool ? 'image-tool' : 'text-tool';
  
  // Use brand icon if available, otherwise regular icon
  const displayIcon = tool.brandIcon || tool.icon;
  const isBrandIcon = !!tool.brandIcon;
  
  // Score indicator color based on score
  const score = tool.score || 0;
  let scoreClass = 'score-low';
  if (score >= 30) scoreClass = 'score-medium';
  if (score >= 60) scoreClass = 'score-high';
  
  // Generate tags HTML
  const tagsHTML = tool.tags.map(tag => 
    `<span class="tool-tag">${tag}</span>`
  ).join('');
  
  return `
    <div class="ai-tool-card elegant-card ${disabledClass} ${bestMatchClass} ${popularClass} ${isImageTool}" 
         data-tool="${tool.id}" 
         data-score="${score}"
         role="button" 
         tabindex="0"
         aria-label="Open ${tool.name} - ${tool.specialty}">
      
      <!-- Card Header with Icon and Name -->
      <div class="card-header">
        <div class="tool-icon-container ${isBrandIcon ? 'brand-icon' : ''}">
          <i class="${displayIcon}"></i>
          ${tool.isPopular ? '<span class="popular-badge" title="Popular AI Tool">🔥</span>' : ''}
        </div>
        <div class="tool-name-section">
          <h3 class="tool-name">${tool.name}</h3>
          <p class="tool-specialty">${tool.specialty}</p>
        </div>
      </div>
      
      <!-- Card Body with Description -->
      <div class="card-body">
        <p class="tool-description">${tool.description}</p>
        
        <!-- Tags -->
        <div class="tool-tags">
          ${tagsHTML}
        </div>
      </div>
      
      <!-- Card Footer with Score and Action -->
      <div class="card-footer">
        <div class="score-indicator ${scoreClass}" title="Relevance score: ${score.toFixed(1)}">
          <span class="score-value">${score.toFixed(1)}</span>
          <span class="score-label">Match</span>
        </div>
        
        <div class="card-action">
          <button class="open-tool-btn" ${!isEnabled ? 'disabled' : ''}>
            <span>Open</span>
            <i class="fas fa-external-link-alt"></i>
          </button>
        </div>
      </div>
      
      <!-- Best Match Ribbon -->
      ${isBestMatch ? `
        <div class="best-match-ribbon" title="Best match for your task">
          <i class="fas fa-star"></i>
          Best Match
        </div>
      ` : ''}
      
      <!-- Tool Type Badge -->
      <div class="tool-type-badge ${tool.isImageTool ? 'image-badge' : 'text-badge'}">
        <i class="fas ${tool.isImageTool ? 'fa-image' : 'fa-font'}"></i>
        ${tool.isImageTool ? 'Image AI' : 'Text AI'}
      </div>
    </div>
  `;
}

/**
 * Render AI tools grid with ELEGANT CARDS
 * @param {string} taskType - Detected task type
 * @param {string} promptText - Generated prompt text
 * @param {boolean} isConverted - Whether prompt is generated
 * @returns {string} HTML for tools grid
 */
export function renderAIToolsGrid(taskType = 'general', promptText = '', isConverted = false) {
  const scores = calculateToolScores(taskType, promptText);
  const orderedTools = orderToolsByScore(scores);
  
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

// Handle tool click (same as before)
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
    await navigator.clipboard.writeText(prompt);
    showNotification(`Prompt copied! Opening ${tool.name}...`, "SUCCESS");
    
    setTimeout(() => {
      window.open(tool.url, '_blank', 'noopener,noreferrer');
    }, 500);
  } catch (error) {
    console.error('Tool click error:', error);
    showNotification(`Failed to open ${tool.name}`, "ERROR");
  }
}

// Setup tool click handlers
export function setupToolClickHandlers(showNotification) {
  document.addEventListener('click', (e) => {
    const toolCard = e.target.closest('.ai-tool-card');
    const openBtn = e.target.closest('.open-tool-btn');
    
    if (!toolCard || toolCard.classList.contains('disabled')) return;
    
    // Handle clicks on the card or the open button
    const clickTarget = openBtn || toolCard;
    const toolId = toolCard.dataset.tool;
    const outputEl = document.getElementById('output');
    const prompt = outputEl ? outputEl.value.trim() : '';
    
    const tool = ENHANCED_AI_TOOLS.find(t => t.id === toolId);
    if (tool) {
      handleToolClick(tool, prompt, showNotification);
    }
  });
  
  // Keyboard accessibility
  document.addEventListener('keydown', (e) => {
    const toolCard = document.activeElement;
    if ((e.key === 'Enter' || e.key === ' ') && 
        toolCard && 
        toolCard.classList.contains('ai-tool-card') && 
        !toolCard.classList.contains('disabled')) {
      e.preventDefault();
      toolCard.click();
    }
  });
}

// Update AI tools grid
export function updateAIToolsGrid(taskType, promptText, isConverted) {
  const toolsGrid = document.getElementById('aiToolsGrid');
  if (toolsGrid) {
    toolsGrid.innerHTML = renderAIToolsGrid(taskType, promptText, isConverted);
  }
}

// Get all tools
export function getAllTools() {
  return ENHANCED_AI_TOOLS;
}

// Get tool by ID
export function getToolById(toolId) {
  return ENHANCED_AI_TOOLS.find(tool => tool.id === toolId) || null;
}

// Get tools by category
export function getToolsByCategory(category) {
  switch (category) {
    case 'image':
      return ENHANCED_AI_TOOLS.filter(tool => tool.isImageTool);
    case 'text':
      return ENHANCED_AI_TOOLS.filter(tool => !tool.isImageTool);
    default:
      return ENHANCED_AI_TOOLS;
  }
}

// Export tools configuration
export function exportToolsConfig() {
  return {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    tools: ENHANCED_AI_TOOLS.map(tool => ({
      id: tool.id,
      name: tool.name,
      specialty: tool.specialty,
      url: tool.url,
      category: tool.isImageTool ? 'image' : 'text',
      tags: tool.tags
    }))
  };
}

// Get tool specialties
export function getToolSpecialties() {
  const specialties = new Set();
  ENHANCED_AI_TOOLS.forEach(tool => {
    if (tool.specialty) specialties.add(tool.specialty);
  });
  return Array.from(specialties).sort();
}

// Get popular tools
export function getPopularTools() {
  return ENHANCED_AI_TOOLS.filter(tool => tool.isPopular);
}

// Get image tools
export function getImageTools() {
  return ENHANCED_AI_TOOLS.filter(tool => tool.isImageTool);
}

// Get text tools
export function getTextTools() {
  return ENHANCED_AI_TOOLS.filter(tool => !tool.isImageTool);
}

// Filter tools by tag
export function filterToolsByTag(tag) {
  return ENHANCED_AI_TOOLS.filter(tool => 
    tool.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

// Get all unique tags
export function getAllTags() {
  const tags = new Set();
  ENHANCED_AI_TOOLS.forEach(tool => {
    tool.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
}

// Sort tools by various criteria
export function sortTools(tools, criteria = 'score') {
  const toolsCopy = [...tools];
  
  switch (criteria) {
    case 'name':
      return toolsCopy.sort((a, b) => a.name.localeCompare(b.name));
    case 'popularity':
      return toolsCopy.sort((a, b) => {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return b.score - a.score;
      });
    case 'type':
      return toolsCopy.sort((a, b) => {
        if (a.isImageTool && !b.isImageTool) return -1;
        if (!a.isImageTool && b.isImageTool) return 1;
        return b.score - a.score;
      });
    case 'score':
    default:
      return toolsCopy.sort((a, b) => b.score - a.score);
  }
}

// Get tool statistics
export function getToolsStatistics() {
  const totalTools = ENHANCED_AI_TOOLS.length;
  const imageTools = ENHANCED_AI_TOOLS.filter(tool => tool.isImageTool).length;
  const textTools = totalTools - imageTools;
  const popularTools = ENHANCED_AI_TOOLS.filter(tool => tool.isPopular).length;
  
  return {
    total: totalTools,
    imageTools,
    textTools,
    popularTools,
    categories: {
      image: imageTools,
      text: textTools,
      popular: popularTools
    }
  };
}

// Get tool color scheme
export function getToolColorScheme(toolId) {
  const tool = getToolById(toolId);
  if (!tool) return { primary: '#FF5E00', accent: '#00F3FF' };
  
  return {
    primary: tool.color,
    accent: tool.color === '#FF5E00' ? '#00F3FF' : '#FF5E00',
    gradient: `linear-gradient(135deg, ${tool.color} 0%, ${tool.color === '#FF5E00' ? '#00F3FF' : '#FF5E00'} 100%)`
  };
}

// Get tool preview for hover effects
export function getToolPreview(toolId) {
  const tool = getToolById(toolId);
  if (!tool) return null;
  
  return {
    name: tool.name,
    specialty: tool.specialty,
    icon: tool.brandIcon || tool.icon,
    color: tool.color,
    isPopular: tool.isPopular,
    tags: tool.tags,
    description: tool.description
  };
}
