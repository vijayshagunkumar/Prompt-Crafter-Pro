// AI Ranker - Complete Fixed Version
class AIRanker {
    constructor() {
        this.tools = {
            chatgpt: {
                name: "ChatGPT",
                icon: "fa-comment-dots",
                color: "#10a37f",
                strengths: ["General tasks", "Writing", "Analysis", "Education", "Conversation", "Creative writing", "Problem solving"],
                weaknesses: ["Real-time data", "Latest information", "Free tier limited"],
                description: "Best for general-purpose tasks, creative writing, and detailed explanations",
                score: 0,
                bestFor: ["General queries", "Creative writing", "Code explanation", "Email drafting", "Brainstorming", "Learning", "Analysis"]
            },
            gemini: {
                name: "Gemini",
                icon: "fa-google",
                color: "#4285f4",
                strengths: ["Research", "Coding", "Multimodal", "Free tier", "Real-time", "Technical"],
                weaknesses: ["Creative writing", "Long-form content"],
                description: "Great for research, technical tasks, coding, and multimodal understanding",
                score: 0,
                bestFor: ["Research", "Coding help", "Technical analysis", "Web searches", "Learning", "Multimodal tasks"]
            },
            claude: {
                name: "Claude",
                icon: "fa-brain",
                color: "#d4a017",
                strengths: ["Long-form writing", "Analysis", "Business documents", "Reasoning", "Ethical responses"],
                weaknesses: ["Code generation", "Creative", "Multimodal"],
                description: "Excellent for long-form content, analysis, business writing, and reasoning",
                score: 0,
                bestFor: ["Long articles", "Business documents", "Analysis reports", "Legal writing", "Academic papers", "Detailed analysis"]
            },
            perplexity: {
                name: "Perplexity",
                icon: "fa-search",
                color: "#000000",
                strengths: ["Research", "Citations", "Facts", "Web search", "Accuracy", "Summaries"],
                weaknesses: ["Creative writing", "Long-form", "Conversational"],
                description: "Perfect for research, fact-checking, citations, and accurate information",
                score: 0,
                bestFor: ["Research papers", "Fact-checking", "Citations", "News summaries", "Web research", "Academic work"]
            },
            copilot: {
                name: "Copilot",
                icon: "fa-code",
                color: "#0078d4",
                strengths: ["Coding", "Development", "Snippets", "Integration", "Debugging", "Assistance"],
                weaknesses: ["General writing", "Creative", "Non-technical"],
                description: "Ideal for coding assistance, snippets, debugging, and development workflow",
                score: 0,
                bestFor: ["Code generation", "Debugging", "Code review", "API documentation", "Development", "Technical solutions"]
            },
            grok: {
                name: "Grok",
                icon: "fa-bolt",
                color: "#bf3989",
                strengths: ["Creative", "Humor", "Casual", "Entertainment", "Trends", "Social"],
                weaknesses: ["Professional", "Technical", "Formal"],
                description: "Fun for creative writing, humor, casual chat, and trending topics",
                score: 0,
                bestFor: ["Creative writing", "Humor", "Casual chat", "Social media", "Entertainment", "Storytelling"]
            }
        };
    }

    analyzeIntent(text) {
        text = text.toLowerCase();
        let intent = {
            isTechnical: false,
            isCreative: false,
            isResearch: false,
            isBusiness: false,
            isEducational: false,
            isCoding: false
        };

        // Detect intent
        const technicalKeywords = ['code', 'programming', 'algorithm', 'software', 'api', 'database', 'function', 'debug', 'technical', 'develop'];
        const creativeKeywords = ['write', 'story', 'creative', 'poem', 'script', 'marketing', 'social media', 'content', 'advertisement'];
        const researchKeywords = ['research', 'study', 'analysis', 'data', 'statistics', 'survey', 'report', 'findings', 'evidence'];
        const businessKeywords = ['business', 'strategy', 'plan', 'proposal', 'meeting', 'email', 'presentation', 'report', 'executive'];
        const educationalKeywords = ['learn', 'teach', 'explain', 'tutorial', 'guide', 'education', 'student', 'study', 'understanding'];
        const codingKeywords = ['javascript', 'python', 'java', 'c++', 'html', 'css', 'react', 'node', 'function', 'variable', 'loop'];

        technicalKeywords.forEach(keyword => {
            if (text.includes(keyword)) intent.isTechnical = true;
        });

        creativeKeywords.forEach(keyword => {
            if (text.includes(keyword)) intent.isCreative = true;
        });

        researchKeywords.forEach(keyword => {
            if (text.includes(keyword)) intent.isResearch = true;
        });

        businessKeywords.forEach(keyword => {
            if (text.includes(keyword)) intent.isBusiness = true;
        });

        educationalKeywords.forEach(keyword => {
            if (text.includes(keyword)) intent.isEducational = true;
        });

        codingKeywords.forEach(keyword => {
            if (text.includes(keyword)) intent.isCoding = true;
        });

        return intent;
    }

    rankTools(intent) {
        // Reset scores
        Object.keys(this.tools).forEach(tool => {
            this.tools[tool].score = 0;
        });

        // Score based on intent
        if (intent.isTechnical || intent.isCoding) {
            this.tools.copilot.score += 30;
            this.tools.gemini.score += 25;
            this.tools.chatgpt.score += 20;
            this.tools.perplexity.score += 15;
        }

        if (intent.isCreative) {
            this.tools.grok.score += 30;
            this.tools.chatgpt.score += 25;
            this.tools.claude.score += 20;
            this.tools.gemini.score += 10;
        }

        if (intent.isResearch) {
            this.tools.perplexity.score += 30;
            this.tools.gemini.score += 25;
            this.tools.claude.score += 20;
            this.tools.chatgpt.score += 15;
        }

        if (intent.isBusiness) {
            this.tools.claude.score += 30;
            this.tools.chatgpt.score += 25;
            this.tools.gemini.score += 20;
            this.tools.perplexity.score += 15;
        }

        if (intent.isEducational) {
            this.tools.chatgpt.score += 30;
            this.tools.gemini.score += 25;
            this.tools.perplexity.score += 20;
            this.tools.claude.score += 15;
        }

        // Add base scores
        Object.keys(this.tools).forEach(tool => {
            this.tools[tool].score += 10; // Base score
        });

        // Sort tools by score
        const rankedTools = Object.keys(this.tools)
            .map(key => ({ ...this.tools[key], id: key }))
            .sort((a, b) => b.score - a.score);

        return rankedTools;
    }

    renderRankedPlatforms(intent) {
        const platformsGrid = document.getElementById('platformsGrid');
        const emptyState = document.getElementById('platformsEmptyState');
        
        if (!platformsGrid) return;

        // Clear existing content
        platformsGrid.innerHTML = '';

        // Get ranked tools
        const rankedTools = this.rankTools(intent);

        if (rankedTools.length === 0 && emptyState) {
            platformsGrid.appendChild(emptyState);
            return;
        }

        // Render platforms
        rankedTools.forEach((tool, index) => {
            const platformCard = document.createElement('div');
            platformCard.className = 'platform-card';
            if (index === 0) platformCard.classList.add('recommended');
            
            platformCard.innerHTML = `
                <div class="platform-logo-container" style="background: ${tool.color}">
                    <i class="fas ${tool.icon}"></i>
                </div>
                <div class="platform-info">
                    <div class="platform-name">
                        ${tool.name}
                        ${index === 0 ? '<span class="recommended-badge">Recommended</span>' : ''}
                    </div>
                    <p class="platform-desc">${tool.description}</p>
                    <div class="platform-tags">
                        ${tool.bestFor.slice(0, 3).map(tag => `<span class="platform-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="platform-score">
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${Math.min(100, tool.score)}%"></div>
                        </div>
                        <span class="score-text">Match: ${tool.score}%</span>
                    </div>
                </div>
            `;

            platformsGrid.appendChild(platformCard);
        });
    }
}

window.AIRanker = AIRanker;
