// constants.js - Application Constants (UPDATED & COMPLETE)

// API Configuration
export const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
export const OPENAI_MODEL = "gpt-3.5-turbo";
export const OPENAI_MAX_TOKENS = 700;
export const OPENAI_TEMPERATURE = 0.1;

// Storage Keys
export const STORAGE_KEYS = {
  templates: "promptCrafterTemplates",
  history: "promptCrafterHistory",
  appTheme: "appTheme",
  voiceLanguage: "voiceLanguage",
  usageCount: "promptCrafterUsage",
  settings: "promptCraftSettings",
  lastSession: "promptCraftLastSession",
  apiKey: "OPENAI_API_KEY"
};

// Default Values
export const DEFAULTS = {
  theme: "professional-blue",
  autoConvertDelay: 60,
  voiceLanguage: "en-US",
  uiLanguage: "en",
  fontSize: "medium",
  maxHistoryItems: 200
};

// AI Tools Configuration - ALL TOOLS INCLUDED (UPDATED)
export const AI_TOOLS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "Best for general tasks, writing, and reasoning.",
    icon: "fab fa-openai",
    color: "#74AA9C",
    url: "https://chat.openai.com/",
    weights: {
      general: 10,
      writing: 9,
      communication: 8,
      analysis: 7,
      coding: 6,
      creative: 7,
      research: 6
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
      creative: 9,
      research: 8
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
      creative: 7,
      communication: 6
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
      creative: 5,
      communication: 5
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
      creative: 6,
      research: 7
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
      creative: 6,
      research: 5
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
      conversation: 9,
      research: 6
    }
  },
  {
    id: "dalle",
    name: "DALL·E 3",
    description: "Best for realistic and creative AI images.",
    icon: "fas fa-palette",
    color: "#00A67E",
    url: "https://chat.openai.com/",
    weights: {
      creative: 10,
      image_generation: 15,
      artistic: 8,
      realistic: 10,
      general: 5,
      writing: 3,
      analysis: 2
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
    weights: {
      creative: 10,
      image_generation: 15,
      artistic: 10,
      stylized: 10,
      realistic: 6,
      general: 4,
      writing: 2
    },
    isImageTool: true
  },
  {
    id: "stable-diffusion",
    name: "Stable Diffusion",
    description: "Open-source image generation with control.",
    icon: "fas fa-cube",
    color: "#8B5CF6",
    url: "https://stablediffusionweb.com/",
    weights: {
      creative: 9,
      image_generation: 14,
      artistic: 9,
      control: 10,
      realistic: 7,
      general: 4
    },
    isImageTool: true
  }
];

// Template Categories
export const TEMPLATE_CATEGORIES = {
  communication: { name: "Communication", icon: "fa-envelope", color: "#3b82f6" },
  coding: { name: "Coding", icon: "fa-code", color: "#10b981" },
  writing: { name: "Writing", icon: "fa-pen", color: "#8b5cf6" },
  analysis: { name: "Analysis", icon: "fa-chart-line", color: "#f97316" },
  creative: { name: "Creative", icon: "fa-paint-brush", color: "#ec4899" },
  research: { name: "Research", icon: "fa-search", color: "#06b6d4" },
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
  },
  {
    id: "3",
    name: "Code Review",
    description: "Review and improve code with best practices",
    category: "coding",
    content: `# Role
You are an experienced software engineer conducting a code review.

# Objective
Review the following code and provide constructive feedback.

# Instructions
1. Check for code quality and readability
2. Identify potential bugs or edge cases
3. Suggest performance improvements
4. Recommend best practices
5. Point out security concerns
6. Provide specific examples for improvements

# Output Format
- Summary of findings
- Critical issues (if any)
- Improvement suggestions
- Code examples for fixes

# Notes
- Be constructive and specific
- Focus on learning and improvement`
  },
  {
    id: "4",
    name: "Creative Story",
    description: "Generate engaging creative stories",
    category: "creative",
    content: `# Role
You are a creative writer with expertise in storytelling.

# Objective
Write a creative story based on the following premise.

# Instructions
1. Establish engaging characters
2. Build an interesting setting
3. Create a compelling plot with conflict
4. Use descriptive language and imagery
5. Include dialogue where appropriate
6. Build toward a satisfying resolution

# Output Format
- A complete short story
- Consistent tone and style
- Proper pacing and structure

# Notes
- Show, don't tell
- Engage the reader's senses
- Maintain consistent point of view`
  }
];

// Language Codes for Voice Input
export const VOICE_LANGUAGES = [
  { code: "en-US", name: "English (US)", nativeName: "English (United States)" },
  { code: "en-GB", name: "English (UK)", nativeName: "English (United Kingdom)" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी" },
  { code: "es-ES", name: "Spanish", nativeName: "Español" },
  { code: "fr-FR", name: "French", nativeName: "Français" },
  { code: "de-DE", name: "German", nativeName: "Deutsch" },
  { code: "ja-JP", name: "Japanese", nativeName: "日本語" },
  { code: "ko-KR", name: "Korean", nativeName: "한국어" },
  { code: "zh-CN", name: "Chinese", nativeName: "中文" },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية" }
];

// UI Languages
export const UI_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" }
];

// Task Types for Context Detection
export const TASK_TYPES = {
  GENERAL: "general",
  COMMUNICATION: "communication",
  CODING: "coding",
  WRITING: "writing",
  ANALYSIS: "analysis",
  CREATIVE: "creative",
  RESEARCH: "research",
  IMAGE_GENERATION: "image_generation"
};

// Preset Names
export const PRESET_NAMES = {
  DEFAULT: "default",
  COMMUNICATION: "communication",
  CODING: "coding",
  WRITING: "writing",
  ANALYSIS: "analysis",
  CREATIVE: "creative"
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning"
};

// Animation Durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  BASE: 250,
  SLOW: 350,
  VERY_SLOW: 500
};

// Breakpoints for Responsive Design
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536
};

// Z-index Layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
  MAXIMIZED_CARD: 2000
};

// Export Default Config
export const CONFIG = {
  VERSION: "2.0.0",
  BUILD_DATE: "2024-01-20",
  FEATURES: {
    VOICE_INPUT: true,
    THEME_SWITCHING: true,
    SETTINGS_MANAGEMENT: true,
    HISTORY: true,
    TEMPLATES: true,
    AI_TOOLS: true,
    EXPORT_IMPORT: true
  }
};
