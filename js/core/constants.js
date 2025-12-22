// Application-wide constants
export const APP_CONFIG = {
  VERSION: '3.1',
  APP_NAME: 'PromptCraft',
  STORAGE_KEYS: {
    API_KEY: 'OPENAI_API_KEY',
    TEMPLATES: 'promptTemplates',
    HISTORY: 'promptHistory',
    USAGE: 'promptCrafterUsage',
    SETTINGS: 'appSettings',
    SIZES: 'textareaSizes',
    THEME: 'appTheme'
  },
  DEFAULT_TEMPLATES: [
    {
      id: "1",
      name: "Professional Email",
      description: "Write clear, professional emails for business communication",
      category: "communication",
      content: `# Role
You are an expert business communicator skilled in writing professional emails.

# Objective
Write a professional email about [TOPIC] to [RECIPIENT]

# Context
- Recipient: [DESCRIBE RECIPIENT]
- Relationship: [DESCRIBE RELATIONSHIP]
- Purpose: [EMAIL PURPOSE]

# Instructions
1. Use professional but friendly tone
2. Start with appropriate greeting
3. State purpose clearly in first paragraph
4. Provide necessary details
5. Include clear call to action
6. End with professional closing

# Notes
- Keep it concise (150-200 words)
- Use proper email formatting
- Include subject line
- Check for tone appropriateness`,
      example: "Write a professional email to my manager requesting a meeting to discuss project timeline adjustments.",
      usageCount: 5,
      createdAt: Date.now() - 86400000,
      isDefault: true
    }
  ]
};

export const AI_TOOLS = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com/', icon: 'fa-brands fa-openai' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', icon: 'fas fa-robot' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', icon: 'fa-brands fa-google' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', icon: 'fas fa-compass' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com/', icon: 'fas fa-brain' },
  { id: 'copilot', name: 'Copilot', url: 'https://copilot.microsoft.com/', icon: 'fa-brands fa-microsoft' },
  { id: 'grok', name: 'Grok', url: 'https://x.ai/', icon: 'fas fa-bolt' }
];

export const TEMPLATE_CATEGORIES = {
  communication: { name: "Communication", icon: "fa-envelope", color: "#3b82f6" },
  coding:        { name: "Coding", icon: "fa-code", color: "#10b981" },
  writing:       { name: "Writing", icon: "fa-pen", color: "#8b5cf6" },
  analysis:      { name: "Analysis", icon: "fa-chart-bar", color: "#f59e0b" },
  business:      { name: "Business", icon: "fa-briefcase", color: "#ef4444" },
  creative:      { name: "Creative", icon: "fa-palette", color: "#ec4899" },
  education:     { name: "Education", icon: "fa-graduation-cap", color: "#06b6d4" },
  other:         { name: "Other", icon: "fa-th", color: "#6b7280" }
};

export const PRESET_NAMES = {
  default: "Standard",
  chatgpt: "ChatGPT",
  claude: "Claude",
  detailed: "Detailed"
};
