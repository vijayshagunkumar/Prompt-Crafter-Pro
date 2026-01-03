// ======================
// MODEL CONFIGURATION
// ======================
const MODEL_CONFIG = {
    "gemini-1.5-flash": {
        name: "Gemini 1.5 Flash",
        provider: "Google",
        free: true,
        recommended: true,
        description: "Fast, reliable, free default with daily quotas"
    },
    "gpt-4o-mini": {
        name: "GPT-4o Mini",
        provider: "OpenAI",
        free: true,
        description: "Excellent prompt quality with limited free usage"
    },
    "llama-3": {
        name: "Llama 3 (70B)",
        provider: "Groq",
        free: true,
        description: "Open-source, community-hosted model"
    }
};

// ======================
// TEMPLATE CATEGORIES
// ======================
const TEMPLATE_CATEGORIES = {
    communication: { name: "Communication", icon: "fa-envelope", color: "#3b82f6" },
    coding:        { name: "Coding",        icon: "fa-code",     color: "#10b981" },
    writing:       { name: "Writing",       icon: "fa-pen",      color: "#8b5cf6" },
    analysis:      { name: "Analysis",      icon: "fa-chart-bar",color: "#f59e0b" },
    business:      { name: "Business",      icon: "fa-briefcase",color: "#ef4444" },
    creative:      { name: "Creative",      icon: "fa-palette",  color: "#ec4899" },
    education:     { name: "Education",     icon: "fa-graduation-cap", color: "#06b6d4" },
    other:         { name: "Other",         icon: "fa-th",       color: "#6b7280" }
};

// ======================
// DEFAULT TEMPLATES
// ======================
const DEFAULT_TEMPLATES = [
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
    },
    {
        id: "2",
        name: "Code Review",
        description: "Analyze and improve code quality",
        category: "coding",
        content: `# Role
You are an expert software engineer performing a comprehensive code review.

# Objective
Review and improve the following code for quality, performance, and best practices.

# Context
- Language: [PROGRAMMING LANGUAGE]
- Framework: [FRAMEWORK IF ANY]
- Purpose: [WHAT THE CODE IS SUPPOSED TO DO]

# Instructions
1. Analyze code structure and organization
2. Identify potential bugs or edge cases
3. Check for security vulnerabilities
4. Review performance optimizations
5. Ensure adherence to coding standards
6. Provide specific improvement suggestions

# Notes
- Include code examples for improvements
- Focus on actionable feedback
- Consider scalability and maintainability`,
        example: "Review this Python function for calculating Fibonacci sequence and suggest improvements.",
        usageCount: 3,
        createdAt: Date.now() - 172800000,
        isDefault: true
    }
];

// ======================
// PRESET TEMPLATES
// ======================
const PRESETS = {
    default: (role, requirement) =>
        `# Role
You are an ${role} who will directly perform the user's task.

# Objective
${requirement}

# Context
(Add relevant background information or constraints here, if needed.)

# Instructions
1. Perform the task described in the Objective.
2. Focus on delivering the final result (email, analysis, code, etc.).
3. Do **not** talk about prompts, prompt generation, or rewriting instructions.
4. Do **not** rewrite or summarize the task itself.
5. Return the completed output in one response.

# Notes
- Use a clear, professional tone.
- Structure the answer with headings or bullet points when helpful.
- Include examples only if they improve clarity.`,

    claude: (role, requirement) =>
        `# Role
You are an ${role}.

# Objective
Perform the following task and return the final result:

${requirement}

# Instructions
- Do not explain your process unless explicitly asked.
- Do not rephrase or restate the Objective.
- Respond only with the completed result, not with a description of the task.

# Notes
Keep the answer clear and well-structured.`,

    chatgpt: (role, requirement) =>
        `# Role
You are an ${role}.

# Objective
Carry out the following task for the user and return the finished output:

${requirement}

# Instructions
- Start directly with the answer.
- Do not include meta-commentary or a restatement of the request.
- Do not talk about prompts or instructions.
- Output only the final result.

# Notes
Maintain professional quality and clarity in your response.`,

    detailed: (role, requirement) =>
        `# Role
You are an ${role}.

# Objective
Execute the following task end-to-end and provide the final output:

${requirement}

# Context
- Add any important background, constraints, or assumptions here if needed.

# Instructions
1. Analyze the task carefully.
2. Break the solution into clear, logical sections where useful.
3. Ensure correctness, structure, and readability.
4. Do **not** generate instructions or "prompts" for another AI.
5. Do **not** rewrite or summarize the task; just solve it.

# Notes
- Use headings, bullet points, or numbered lists as appropriate.
- Include examples or explanations only if they help the user apply the result.`
};

// ======================
// AI TOOL PROFILES (for ranking)
// ======================
const AI_TOOL_PROFILES = {
    chatgpt: {
        name: "ChatGPT",
        strengths: ["general", "writing", "email", "education", "analysis", "professional", "formal", "conversational", "creative", "technical"],
        weaknesses: ["real-time", "latest", "free", "image"],
        tone: ["professional", "friendly", "formal", "authoritative", "casual", "humorous", "persuasive"],
        format: ["free", "bullet points", "numbered list", "paragraph", "email", "code"],
        depth: ["normal", "detailed", "brief", "high-level", "step-by-step"],
        audience: ["general", "beginners", "experts", "technical", "non-technical", "business", "students"],
        bestFor: ["emails", "content writing", "analysis", "education", "general tasks", "brainstorming", "explanations"],
        score: 0,
        matchReason: "",
        tooltip: "Best for general tasks, writing, analysis, and explanations. Supports multiple formats."
    },
    claude: {
        name: "Claude",
        strengths: ["writing", "analysis", "business", "detailed", "long-form", "reasoning", "ethical", "safe"],
        weaknesses: ["code", "creative", "image", "real-time"],
        tone: ["professional", "formal", "authoritative", "serious", "ethical"],
        format: ["free", "paragraph", "structured", "long-form"],
        depth: ["detailed", "normal", "comprehensive"],
        audience: ["experts", "technical", "business", "professional"],
        bestFor: ["long-form content", "analysis", "business documents", "detailed writing", "reasoning tasks"],
        score: 0,
        matchReason: "",
        tooltip: "Excellent for long-form content, analysis, and business writing with strong reasoning."
    },
    gemini: {
        name: "Gemini",
        strengths: ["research", "analysis", "education", "technical", "code", "multimodal", "latest", "real-time"],
        weaknesses: ["creative", "casual", "long-form"],
        tone: ["professional", "technical", "informative"],
        format: ["free", "structured", "code", "bullet points"],
        depth: ["detailed", "normal", "technical"],
        audience: ["technical", "experts", "beginners", "students"],
        bestFor: ["research", "technical analysis", "learning", "coding", "real-time information"],
        score: 0,
        matchReason: "",
        tooltip: "Great for research, technical tasks, coding, and real-time information with multimodal support."
    },
    perplexity: {
        name: "Perplexity",
        strengths: ["research", "analysis", "brief", "concise", "factual", "citations", "web", "latest"],
        weaknesses: ["creative", "long-form", "conversational"],
        tone: ["professional", "casual", "factual"],
        format: ["free", "bullet points", "concise"],
        depth: ["brief", "high-level", "factual"],
        audience: ["general", "beginners", "researchers"],
        bestFor: ["quick research", "summaries", "facts", "web searches", "citations", "news"],
        score: 0,
        matchReason: "",
        tooltip: "Perfect for research, fact-checking, summaries, and web searches with citations."
    },
    deepseek: {
        name: "DeepSeek",
        strengths: ["code", "technical", "structured", "mathematical", "programming", "algorithms", "free"],
        weaknesses: ["creative", "casual", "general", "non-technical"],
        tone: ["technical", "professional", "precise"],
        format: ["structured", "code", "technical"],
        depth: ["detailed", "normal", "technical"],
        audience: ["technical", "experts", "developers"],
        bestFor: ["coding", "technical solutions", "APIs", "algorithms", "debugging", "mathematical problems"],
        score: 0,
        matchReason: "",
        tooltip: "Specialized for coding, technical solutions, algorithms, and mathematical problems."
    },
    copilot: {
        name: "Copilot",
        strengths: ["code", "quick", "assistance", "snippets", "development", "integrated", "contextual"],
        weaknesses: ["long-form", "creative", "analysis", "non-technical"],
        tone: ["technical", "casual", "assistive"],
        format: ["code", "structured", "snippets"],
        depth: ["normal", "brief", "contextual"],
        audience: ["technical", "beginners", "developers"],
        bestFor: ["quick code help", "snippets", "debugging", "code completion", "development assistance"],
        score: 0,
        matchReason: "",
        tooltip: "Ideal for code assistance, snippets, debugging, and development workflow integration."
    },
    grok: {
        name: "Grok",
        strengths: ["creative", "general", "casual", "humorous", "entertainment", "conversational", "trendy"],
        weaknesses: ["professional", "technical", "serious", "formal"],
        tone: ["casual", "humorous", "friendly", "sarcastic", "entertaining"],
        format: ["free", "paragraph", "conversational"],
        depth: ["normal", "brief", "casual"],
        audience: ["general", "beginners", "casual"],
        bestFor: ["creative writing", "casual chat", "entertainment", "humor", "trendy topics", "social"],
        score: 0,
        matchReason: "",
        tooltip: "Fun for creative writing, casual chat, humor, entertainment, and trendy topics."
    }
};

// ======================
// THEMES CONFIGURATION
// ======================
const THEMES = [
    { 
        id: 'cyberpunk-neon', 
        name: 'Cyberpunk Neon', 
        mood: 'Energetic & Futuristic',
        icon: 'fa-bolt'
    },
    { 
        id: 'sunset-glow', 
        name: 'Sunset Glow', 
        mood: 'Warm & Inviting',
        icon: 'fa-sun'
    },
    { 
        id: 'aurora-magic', 
        name: 'Aurora Magic', 
        mood: 'Magical & Dreamy',
        icon: 'fa-magic'
    },
    { 
        id: 'serenity-bliss', 
        name: 'Serenity Bliss', 
        mood: 'Calm & Peaceful',
        icon: 'fa-spa'
    },
    { 
        id: 'ocean-deep', 
        name: 'Ocean Deep', 
        mood: 'Professional & Deep',
        icon: 'fa-water'
    },
    { 
        id: 'auto', 
        name: 'Auto (System)', 
        mood: 'Follows System Preference',
        icon: 'fa-robot'
    }
];

// ======================
// API CONFIGURATION
// ======================
const API_CONFIG = {
    WORKER_URL: "https://promptcraft-api.vijay-shagunkumar.workers.dev",
    API_KEY_HEADER: "x-api-key",
    DEFAULT_API_KEY: "promptcraft-app-secret-123",
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 2
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MODEL_CONFIG,
        TEMPLATE_CATEGORIES,
        DEFAULT_TEMPLATES,
        PRESETS,
        AI_TOOL_PROFILES,
        THEMES,
        API_CONFIG
    };
}
