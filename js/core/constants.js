// constants.js - Application Constants

// API Configuration
export const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
export const OPENAI_MODEL = "gpt-3.5-turbo";

// Storage Keys
export const STORAGE_KEYS = {
  templates: "promptCrafterTemplates",
  history: "promptCrafterHistory",
  appTheme: "appTheme",
  voiceLanguage: "voiceLanguage",
  usageCount: "promptCrafterUsage",
  // NEW: Card expander state storage
  cardExpander: "promptcraft_card_expander_state"
};

// Default Values
export const DEFAULTS = {
  theme: "sunset-glow",
  autoConvertDelay: 60,
  voiceLanguage: "en-US",
  // NEW: Card expander defaults
  cardExpander: {
    maximizedCardId: null,
    minimizedCardIds: [],
    cardStates: {}
  }
};

// AI Tools Configuration - ALL TOOLS INCLUDED
export const AI_TOOLS = [
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
      creative: 7
    }
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
      creative: 9
    }
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
      creative: 7
    }
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Excellent for research with citations and sources.",
    icon: "fas fa-search",
    color: "#20808D",
    url: "https://www.perplexity.ai/",
    weights: {
      research: 10,
      analysis: 9,
      web: 10,
      general: 7,
      writing: 6,
      creative: 5
    }
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "Great for coding and technical tasks.",
    icon: "fas fa-robot",
    color: "#00F3FF",
    url: "https://chat.deepseek.com/",
    weights: {
      coding: 10,
      analysis: 8,
      technical: 9,
      general: 7,
      writing: 6,
      creative: 6
    }
  },
  {
    id: "copilot",
    name: "Copilot",
    description: "Microsoft's AI for coding and development.",
    icon: "fas fa-code",
    color: "#199FD7",
    url: "https://copilot.microsoft.com/",
    weights: {
      coding: 10,
      technical: 9,
      analysis: 7,
      general: 6,
      writing: 5,
      creative: 6
    }
  },
  {
    id: "grok",
    name: "Grok",
    description: "X AI with real-time knowledge and wit.",
    icon: "fas fa-brain",
    color: "#FF5E00",
    url: "https://grok.x.ai/",
    weights: {
      general: 9,
      creative: 8,
      writing: 7,
      analysis: 6,
      coding: 5,
      conversation: 9
    }
  }
];

// NEW: Card Configuration
export const CARD_CONFIG = {
  // Card 1: Your Idea / Input
  card1: {
    id: "card-1",
    title: "Your Idea",
    description: "Type or speak your rough requirement",
    allowMaximize: true,
    allowMinimize: true,
    defaultHeight: 650
  },
  
  // Card 2: Structured Prompt / Output
  card2: {
    id: "card-2",
    title: "Structured Prompt",
    description: "AI-ready formatted prompt",
    allowMaximize: true,
    allowMinimize: true,
    defaultHeight: 650
  },
  
  // Card 3: Send to AI
  card3: {
    id: "card-3",
    title: "Send to AI",
    description: "Open with your preferred tool",
    allowMaximize: false,
    allowMinimize: false,
    defaultHeight: 650
  },
  
  // Maximized state configuration
  maximized: {
    width: "90vw",
    height: "90vh",
    maxWidth: "1400px",
    maxHeight: "90vh",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    borderRadius: "16px",
    zIndex: 9999,
    animationDuration: "0.3s"
  },
  
  // Minimized state configuration
  minimized: {
    height: "60px",
    minHeight: "60px",
    animationDuration: "0.2s"
  }
};

// NEW: Card Expander Constants
export const CARD_EXPANDER = {
  // Button configuration
  button: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    background: "rgba(255, 94, 0, 0.1)",
    borderColor: "rgba(255, 94, 0, 0.3)",
    hoverBackground: "rgba(255, 94, 0, 0.2)",
    transitionDuration: "0.2s"
  },
  
  // Icons (SVG paths)
  icons: {
    maximize: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
    </svg>`,
    minimize: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 9L5 9M19 15L5 15" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    restore: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 8V4H8M20 8V4H16M4 16V20H8M20 16V20H16"/>
    </svg>`
  },
  
  // Titles/tooltips
  titles: {
    maximize: "Maximize",
    minimize: "Minimize",
    restore: "Restore"
  },
  
  // Keyboard shortcuts
  shortcuts: {
    escape: "Escape",
    maximizeCard1: "Ctrl+1",
    maximizeCard2: "Ctrl+2",
    restoreAll: "Ctrl+0"
  },
  
  // Local storage version (for migrations)
  version: "1.0.0",
  
  // Animation timing
  animations: {
    maximize: 300,
    minimize: 200,
    fadeIn: 200,
    fadeOut: 150
  }
};

// Template Categories
export const TEMPLATE_CATEGORIES = {
  communication: { name: "Communication", icon: "fa-envelope", color: "#3b82f6" },
  coding: { name: "Coding", icon: "fa-code", color: "#10b981" },
  writing: { name: "Writing", icon: "fa-pen", color: "#8b5cf6" },
  analysis: { name: "Analysis", icon: "fa-chart-line", color: "#f97316" },
  other: { name: "Other", icon: "fa-sparkles", color: "#e5e7eb" }
};

// Default Templates
export const DEFAULT_TEMPLATES = [
  {
    id: "1",
    name: "Professional Email",
    description: "Write clear, professional emails for business communication",
    category: "communication",
    content: `# Role
You are an expert business communicator skilled in writing professional emails.

# Objective
Write a professional email about [TOPIC] to [RECIPIENT]

# Instructions
1. Use a clear subject line
2. Start with an appropriate greeting
3. Explain the purpose of the email clearly
4. Use a polite and professional tone
5. Keep paragraphs short and focused
6. End with a clear call-to-action or next steps
7. Include a professional closing and signature

# Output Format
- Subject line
- Email body in paragraph format

# Notes
- Avoid jargon unless necessary
- Use simple, easy-to-understand English`
  },
  {
    id: "2",
    name: "Product Requirement",
    description: "Structure product ideas into clear requirements",
    category: "analysis",
    content: `# Role
You are a senior product manager.

# Objective
Turn the user's idea into a clear, structured product requirement.

# Instructions
1. Identify the user persona
2. Define the core problem being solved
3. Describe the proposed solution
4. List key features and requirements
5. Outline success metrics
6. Mention dependencies and risks

# Output Format
- Persona
- Problem Statement
- Solution Overview
- Key Requirements (bulleted)
- Success Metrics
- Risks & Dependencies

# Notes
- Use crisp, business-friendly language
- Keep it skimmable for stakeholders`
  }
];
