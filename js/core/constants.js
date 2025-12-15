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
  usageCount: "promptCrafterUsage"
};

// Default Values
export const DEFAULTS = {
  theme: "sunset-glow",
  autoConvertDelay: 60,
  voiceLanguage: "en-US"
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
