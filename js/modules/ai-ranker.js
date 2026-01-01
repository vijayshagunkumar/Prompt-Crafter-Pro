// ai-ranker.js - AI Tool Ranking Engine (updated from ai-tool-ranker.js)
export class AIRanker {
    static AI_TOOL_PROFILES = {
        chatgpt: {
            name: 'ChatGPT',
            strengths: ["writing", "email", "education", "general", "analysis"],
            depth: ["normal", "deep"],
            format: ["email", "free"],
            icon: 'fas fa-comment-alt',
            color: '#10A37F',
            url: 'https://chat.openai.com/'
        },
        claude: {
            name: 'Claude',
            strengths: ["writing", "analysis", "business"],
            depth: ["deep", "structured"],
            format: ["free"],
            icon: 'fas fa-brain',
            color: '#D4A574',
            url: 'https://claude.ai/'
        },
        gemini: {
            name: 'Google Gemini',
            strengths: ["research", "analysis", "education"],
            depth: ["deep"],
            format: ["free"],
            icon: 'fab fa-google',
            color: '#8B5CF6',
            url: 'https://gemini.google.com/'
        },
        perplexity: {
            name: 'Perplexity',
            strengths: ["research", "analysis"],
            depth: ["deep"],
            format: ["free"],
            icon: 'fas fa-search',
            color: '#6B7280',
            url: 'https://www.perplexity.ai/'
        },
        deepseek: {
            name: 'DeepSeek',
            strengths: ["code"],
            depth: ["deep"],
            format: ["code"],
            icon: 'fas fa-code',
            color: '#3B82F6',
            url: 'https://chat.deepseek.com/'
        },
        copilot: {
            name: 'Copilot',
            strengths: ["code"],
            depth: ["normal"],
            format: ["code"],
            icon: 'fab fa-microsoft',
            color: '#0078D4',
            url: 'https://copilot.microsoft.com/'
        },
        grok: {
            name: 'Grok',
            strengths: ["general", "creative"],
            depth: ["normal"],
            format: ["free"],
            icon: 'fab fa-x-twitter',
            color: '#FF6B35',
            url: 'https://grok.x.ai/'
        }
    };

    static rankTools(intent) {
        if (!intent) return Object.keys(this.AI_TOOL_PROFILES);

        const scores = {};
        Object.keys(this.AI_TOOL_PROFILES).forEach(k => (scores[k] = 0));

        Object.entries(this.AI_TOOL_PROFILES).forEach(([key, tool]) => {
            // Major points for matching task type
            if (tool.strengths.includes(intent.taskType)) scores[key] += 4;
            
            // Points for matching format
            if (tool.format.includes(intent.format)) scores[key] += 3;
            
            // Points for matching depth
            if (tool.depth.includes(intent.depth)) scores[key] += 2;
            
            // Bonus points for detailed prompts
            if (intent.constraints?.includes("detailed")) scores[key] += 1;
            
            // Bonus for business audience
            if (intent.audience === "business" && tool.strengths.includes("business")) {
                scores[key] += 2;
            }
        });

        return Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .map(([key, score]) => ({ key, score }));
    }

    static rankAndReorder(intent) {
        const rankedTools = this.rankTools(intent);
        this.reorderLaunchButtons(rankedTools);
        return rankedTools;
    }

    static reorderLaunchButtons(rankedTools) {
        const container = document.querySelector(".launch-list");
        if (!container || !rankedTools.length) return;

        const buttons = Array.from(container.children);

        rankedTools.forEach(({ key }, index) => {
            const btn = buttons.find(b => b.id === `${key}Btn`);
            if (!btn) return;

            container.appendChild(btn);
            
            // Add best-match class to top ranked
            btn.classList.toggle("best-match", index === 0);
            
            // Add match score
            const scoreElement = btn.querySelector('.match-score');
            const rankedTool = rankedTools.find(t => t.key === key);
            if (scoreElement && rankedTool) {
                scoreElement.textContent = `${rankedTool.score} pts`;
            }
        });
    }

    static getToolInfo(key) {
        return this.AI_TOOL_PROFILES[key] || null;
    }

    static getAllTools() {
        return Object.entries(this.AI_TOOL_PROFILES).map(([key, tool]) => ({
            id: key,
            ...tool
        }));
    }
}
