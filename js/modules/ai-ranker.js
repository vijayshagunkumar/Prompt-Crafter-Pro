class AIRanker {
    constructor() {
        this.toolProfiles = window.AI_TOOL_PROFILES || {
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
        
        this.defaultOrder = ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    }

    rankTools(intent) {
        if (!intent || !intent.taskType) {
            return this.defaultOrder;
        }
        
        // Reset scores
        Object.values(this.toolProfiles).forEach(tool => {
            tool.score = 0;
            tool.matchReason = "";
        });
        
        // Score each tool
        Object.entries(this.toolProfiles).forEach(([toolKey, tool]) => {
            let score = 0;
            let reasons = [];
            
            // 1. Task type matching (highest weight)
            if (tool.strengths.includes(intent.taskType)) {
                score += 15;
                reasons.push(`excels at ${intent.taskType}`);
            } else if (tool.strengths.some(strength => 
                strength.includes(intent.taskType) || intent.taskType.includes(strength)
            )) {
                score += 10;
                reasons.push(`good for ${intent.taskType}`);
            }
            
            // 2. Tone matching
            if (intent.tone && intent.tone !== "neutral") {
                if (tool.tone.includes(intent.tone)) {
                    score += 8;
                    reasons.push(`${intent.tone} tone`);
                } else if (intent.tone === "humorous" && toolKey === "grok") {
                    score += 10;
                    reasons.push("humorous style");
                } else if (intent.tone === "technical" && (toolKey === "deepseek" || toolKey === "copilot" || toolKey === "gemini")) {
                    score += 8;
                    reasons.push("technical expertise");
                }
            }
            
            // 3. Format matching
            if (intent.format && intent.format !== "free") {
                if ((intent.format === "code" || intent.format === "structured") && 
                    (toolKey === "deepseek" || toolKey === "copilot" || toolKey === "gemini")) {
                    score += 12;
                    reasons.push(`${intent.format} output`);
                } else if (tool.format.includes(intent.format)) {
                    score += 6;
                    reasons.push(`${intent.format} format`);
                }
            }
            
            // 4. Depth matching
            if (intent.depth && intent.depth !== "normal") {
                if (intent.depth === "detailed" && (toolKey === "claude" || toolKey === "gemini")) {
                    score += 10;
                    reasons.push("detailed analysis");
                } else if (intent.depth === "brief" && (toolKey === "perplexity" || toolKey === "copilot")) {
                    score += 8;
                    reasons.push("concise answers");
                } else if (tool.depth.includes(intent.depth)) {
                    score += 5;
                    reasons.push(`${intent.depth} depth`);
                }
            }
            
            // 5. Audience matching
            if (intent.audience && intent.audience !== "general") {
                if (intent.audience === "technical" && (toolKey === "deepseek" || toolKey === "copilot" || toolKey === "gemini")) {
                    score += 10;
                    reasons.push("technical audience");
                } else if (intent.audience === "beginners" && (toolKey === "chatgpt" || toolKey === "perplexity")) {
                    score += 8;
                    reasons.push("beginner-friendly");
                } else if (tool.audience.includes(intent.audience)) {
                    score += 6;
                    reasons.push(`${intent.audience} audience`);
                }
            }
            
            // 6. Specific constraints
            if (intent.constraints && intent.constraints.length > 0) {
                // Code-related tasks
                if (intent.constraints.includes("code")) {
                    if (toolKey === "deepseek") { score += 20; reasons.push("coding specialist"); }
                    if (toolKey === "copilot") { score += 18; reasons.push("code assistant"); }
                    if (toolKey === "gemini") { score += 15; reasons.push("technical coding"); }
                }
                // Creative tasks
                if (intent.constraints.includes("creative")) {
                    if (toolKey === "grok") { score += 18; reasons.push("creative specialist"); }
                    if (toolKey === "chatgpt") { score += 12; reasons.push("creative writing"); }
                }
                // Research tasks
                if (intent.constraints.includes("research")) {
                    if (toolKey === "perplexity") { score += 20; reasons.push("research specialist"); }
                    if (toolKey === "gemini") { score += 15; reasons.push("research & analysis"); }
                }
                // Business tasks
                if (intent.constraints.includes("business")) {
                    if (toolKey === "claude") { score += 16; reasons.push("business writing"); }
                    if (toolKey === "chatgpt") { score += 12; reasons.push("professional content"); }
                }
                // Educational tasks
                if (intent.constraints.includes("education")) {
                    if (toolKey === "gemini") { score += 15; reasons.push("educational content"); }
                    if (toolKey === "chatgpt") { score += 12; reasons.push("learning assistance"); }
                }
                // Urgent tasks
                if (intent.urgency === "high") {
                    if (toolKey === "perplexity") { score += 10; reasons.push("quick answers"); }
                    if (toolKey === "copilot") { score += 8; reasons.push("fast assistance"); }
                }
            }
            
            // 7. Special enhancements
            // Real-time info
            if (/(news|latest|current|today|recent)/i.test(JSON.stringify(intent))) {
                if (toolKey === "perplexity" || toolKey === "gemini") {
                    score += 10;
                    reasons.push("real-time info");
                }
            }
            // Free tier preference
            if (/(free|budget|cost|cheap)/i.test(JSON.stringify(intent))) {
                if (toolKey === "deepseek" || toolKey === "perplexity") {
                    score += 8;
                    reasons.push("free access");
                }
            }
            
            // Penalize weaknesses
            if (tool.weaknesses.includes(intent.taskType)) {
                score -= 12;
            }
            
            tool.score = score;
            tool.matchReason = reasons.slice(0, 3).join(", ");
        });
        
        // Sort by score descending
        const sorted = Object.entries(this.toolProfiles)
            .sort((a, b) => b[1].score - a[1].score)
            .map(([key]) => key);
        
        // Only reorder if there's a clear winner (score difference > 5)
        const topScore = this.toolProfiles[sorted[0]].score;
        const secondScore = this.toolProfiles[sorted[1]].score;
        
        if (topScore - secondScore < 5 && topScore < 10) {
            return this.defaultOrder;
        }
        
        return sorted;
    }

    renderRankedPlatforms(intent, containerId = "platformsGrid") {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const toolOrder = this.rankTools(intent);
        const topToolKey = toolOrder[0];
        const topTool = this.toolProfiles[topToolKey];
        
        container.innerHTML = '';
        
        if (containerId === "platformsGrid" && document.getElementById("platformsEmptyState")) {
            document.getElementById("platformsEmptyState").style.display = "none";
        }
        
        toolOrder.forEach((toolKey, index) => {
            const tool = this.toolProfiles[toolKey];
            if (!tool) return;
            
            const platformCard = document.createElement('div');
            platformCard.className = 'platform-card';
            platformCard.dataset.platform = toolKey;
            
            // Add ranking indicator
            const rank = index + 1;
            
            // Mark as recommended if it's the top tool and has a good score
            const isRecommended = index === 0 && tool.score >= 10;
            if (isRecommended) {
                platformCard.classList.add('recommended');
            }
            
            // Platform-specific data
            const platformData = {
                chatgpt: {
                    icon: 'fas fa-comment-alt',
                    color: '#10A37F',
                    launchUrl: 'https://chat.openai.com/',
                    description: 'Industry-leading conversational AI',
                    tags: ['Conversational', 'Popular', 'OpenAI']
                },
                claude: {
                    icon: 'fas fa-brain',
                    color: '#D4A574',
                    launchUrl: 'https://claude.ai/',
                    description: 'Constitutional AI with safety focus',
                    tags: ['Safe', 'Contextual', 'Anthropic']
                },
                gemini: {
                    icon: 'fab fa-google',
                    color: '#8B5CF6',
                    launchUrl: 'https://gemini.google.com/',
                    description: 'Advanced reasoning and multimodal capabilities',
                    tags: ['Multimodal', 'Advanced', 'Google']
                },
                perplexity: {
                    icon: 'fas fa-search',
                    color: '#6B7280',
                    launchUrl: 'https://www.perplexity.ai/',
                    description: 'Search-enhanced AI with citations',
                    tags: ['Search', 'Citations', 'Real-time']
                },
                deepseek: {
                    icon: 'fas fa-code',
                    color: '#3B82F6',
                    launchUrl: 'https://chat.deepseek.com/',
                    description: 'Code-focused AI with reasoning',
                    tags: ['Code', 'Developer', 'Reasoning']
                },
                copilot: {
                    icon: 'fab fa-microsoft',
                    color: '#0078D4',
                    launchUrl: 'https://copilot.microsoft.com/',
                    description: 'Microsoft-powered AI assistant',
                    tags: ['Microsoft', 'Productivity', 'Office']
                },
                grok: {
                    icon: 'fab fa-x-twitter',
                    color: '#FF6B35',
                    launchUrl: 'https://grok.x.ai/',
                    description: 'Real-time knowledge AI',
                    tags: ['Real-time', 'X', 'Elon']
                }
            }[toolKey] || {
                icon: 'fas fa-robot',
                color: '#6B7280',
                launchUrl: '#',
                description: 'AI Platform',
                tags: ['AI']
            };
            
            platformCard.innerHTML = `
                ${isRecommended ? '<div class="platform-ranking">1</div>' : ''}
                <div class="platform-logo-container" style="background: ${platformData.color}">
                    <i class="${platformData.icon}"></i>
                </div>
                <div class="platform-info">
                    <div class="platform-name">
                        ${tool.name}
                        ${tool.score > 0 ? `<span class="match-score-badge">${Math.min(100, Math.round((tool.score / 50) * 100))}%</span>` : ''}
                        ${isRecommended ? '<span class="recommended-badge">Best Match</span>' : ''}
                    </div>
                    <div class="platform-desc">${platformData.description}</div>
                    <div class="platform-tags">
                        ${platformData.tags.map(tag => `<span class="platform-tag">${tag}</span>`).join('')}
                        ${tool.matchReason ? `<span class="platform-tag reason" title="${tool.matchReason}"><i class="fas fa-bullseye"></i> ${tool.matchReason.split(',')[0]}</span>` : ''}
                    </div>
                </div>
            `;
            
            // Add click handler
            platformCard.addEventListener('click', async (e) => {
                e.preventDefault();
                const prompt = document.getElementById('outputArea')?.textContent.trim();
                if (prompt && prompt !== 'Your optimized prompt will appear here...') {
                    try {
                        await navigator.clipboard.writeText(prompt);
                        
                        // Show success notification
                        if (window.notificationService) {
                            window.notificationService.show(`Prompt copied! Opening ${tool.name}...`, 'success');
                        }
                        
                        // Open platform in new tab
                        setTimeout(() => {
                            window.open(platformData.launchUrl, '_blank');
                        }, 500);
                        
                    } catch (err) {
                        if (window.notificationService) {
                            window.notificationService.show('Failed to copy prompt. Please try again.', 'error');
                        }
                    }
                } else {
                    if (window.notificationService) {
                        window.notificationService.show('Please generate a prompt first', 'error');
                    }
                }
            });
            
            // Add tooltip for match reason
            if (tool.matchReason) {
                platformCard.title = `${tool.name}: ${tool.matchReason}`;
            }
            
            container.appendChild(platformCard);
        });
        
        return toolOrder;
    }

    resetToDefault() {
        const container = document.getElementById("platformsGrid");
        if (!container) return;
        
        // Clear any ranking indicators
        document.querySelectorAll('.platform-card').forEach(card => {
            card.classList.remove('recommended');
            const ranking = card.querySelector('.platform-ranking');
            if (ranking) ranking.remove();
            const matchBadge = card.querySelector('.match-score-badge');
            if (matchBadge) matchBadge.remove();
        });
    }

    setupTooltips() {
        // This would setup custom tooltips for each platform
        // You can implement this based on your UI needs
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIRanker;
}
