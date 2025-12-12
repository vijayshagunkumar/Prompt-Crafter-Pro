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

// AI Tools Configuration
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
      coding: 6
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
      coding: 6
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
      coding: 6
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
