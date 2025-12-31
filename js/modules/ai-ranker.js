// AIRanker.js - COMPLETE FIXED VERSION
class AIRanker {
    constructor() {
        this.toolProfiles = window.AI_TOOL_PROFILES || {
            chatgpt: {
                name: "ChatGPT",
                icon: "fas fa-comment-alt",
                color: "#10A37F",
                launchUrl: "https://chat.openai.com/",
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
                icon: "fas fa-brain",
                color: "#D4A574",
                launchUrl: "https://claude.ai/",
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
                icon: "fab fa-google",
                color: "#8B5CF6",
                launchUrl: "https://gemini.google.com/",
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
                icon: "fas fa-search",
                color: "#6B7280",
                launchUrl: "https://www.perplexity.ai/",
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
                icon: "fas fa-code",
                color: "#3B82F6",
                launchUrl: "https://chat.deepseek.com/",
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
                icon: "fab fa-microsoft",
                color: "#0078D4",
                launchUrl: "https://copilot.microsoft.com/",
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
                icon: "fab fa-x-twitter",
                color: "#FF6B35",
                launchUrl: "https://grok.x.ai/",
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

    analyzeIntent(text) {
        if (!text || typeof text !== 'string') {
            return {
                taskType: 'general',
                tone: 'neutral',
                format: 'free',
                depth: 'normal',
                audience: 'general',
                constraints: [],
                urgency: 'normal'
            };
        }
        
        text = text.toLowerCase();
        const intent = {
            taskType: 'general',
            tone: 'neutral',
            format: 'free',
            depth: 'normal',
            audience: 'general',
            constraints: [],
            urgency: 'normal'
        };
        
        // Detect task type
        if (/(email|message|letter|communication)/i.test(text)) {
            intent.taskType = 'email';
        } else if (/(code|programming|algorithm|function|debug|api)/i.test(text)) {
            intent.taskType = 'code';
            intent.constraints.push('code');
        } else if (/(write|story|creative|article|blog|content|marketing)/i.test(text)) {
            intent.taskType = 'writing';
            intent.constraints.push('creative');
        } else if (/(research|study|analysis|data|statistics|report|findings)/i.test(text)) {
            intent.taskType = 'research';
            intent.constraints.push('research');
        } else if (/(business|strategy|plan|proposal|meeting|presentation)/i.test(text)) {
            intent.taskType = 'business';
            intent.constraints.push('business');
        } else if (/(learn|teach|explain|tutorial|guide|education)/i.test(text)) {
            intent.taskType = 'education';
            intent.constraints.push('education');
        } else if (/(summary|brief|quick|fast|urgent|asap)/i.test(text)) {
            intent.taskType = 'summary';
            intent.urgency = 'high';
        }
        
        // Detect tone
        if (/(professional|formal|business|serious)/i.test(text)) {
            intent.tone = 'professional';
        } else if (/(friendly|casual|informal|chat)/i.test(text)) {
            intent.tone = 'casual';
        } else if (/(technical|detailed|complex|advanced)/i.test(text)) {
            intent.tone = 'technical';
        } else if (/(humorous|funny|joke|entertaining)/i.test(text)) {
            intent.tone = 'humorous';
        }
        
        // Detect format preference
        if (/(bullet|points|list|numbered)/i.test(text)) {
            intent.format = 'bullet points';
        } else if (/(code|snippet|function|class)/i.test(text)) {
            intent.format = 'code';
        } else if (/(paragraph|essay|article|long)/i.test(text)) {
            intent.format = 'paragraph';
        } else if (/(email|message|letter)/i.test(text)) {
            intent.format = 'email';
        }
        
        // Detect depth
        if (/(detailed|thorough|comprehensive|complete)/i.test(text)) {
            intent.depth = 'detailed';
        } else if (/(brief|quick|short|concise)/i.test(text)) {
            intent.depth = 'brief';
        } else if (/(simple|basic|beginner|easy)/i.test(text)) {
            intent.depth = 'simple';
        } else if (/(expert|advanced|complex)/i.test(text)) {
            intent.depth = 'expert';
        }
        
        // Detect audience
        if (/(beginner|student|new|learning)/i.test(text)) {
            intent.audience = 'beginners';
        } else if (/(expert|professional|developer|technical)/i.test(text)) {
            intent.audience = 'technical';
        } else if (/(business|executive|manager)/i.test(text)) {
            intent.audience = 'business';
        }
        
        // Detect urgency
        if (/(urgent|asap|quick|fast|now|immediately)/i.test(text)) {
            intent.urgency = 'high';
        }
        
        return intent;
    }

    rankTools(intent) {
        if (!intent) {
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

    renderRankedPlatforms(text) {
        const container = document.getElementById("platformsGrid");
        if (!container) return;
        
        const emptyState = document.getElementById("platformsEmptyState");
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Analyze intent from text
        const intent = this.analyzeIntent(text);
        
        // Get ranked tools
        const toolOrder = this.rankTools(intent);
        const topToolKey = toolOrder[0];
        const topTool = this.toolProfiles[topToolKey];
        
        container.innerHTML = '';
        
        toolOrder.forEach((toolKey, index) => {
            const tool = this.toolProfiles[toolKey];
            if (!tool) return;
            
            const platformCard = document.createElement('div');
            platformCard.className = 'platform-card';
            platformCard.dataset.platform = toolKey;
            
            // Add ranking indicator
            const rank = index + 1;
            const isRecommended = index === 0 && tool.score >= 10;
            
            if (isRecommended) {
                platformCard.classList.add('recommended');
            }
            
            // Calculate match percentage
            const matchPercentage = Math.min(100, Math.round((tool.score / 50) * 100));
            
            platformCard.innerHTML = `
                ${isRecommended ? '<div class="platform-ranking">1</div>' : ''}
                <div class="platform-logo-container" style="background: ${tool.color}">
                    <i class="${tool.icon}"></i>
                </div>
                <div class="platform-info">
                    <div class="platform-name">
                        ${tool.name}
                        ${tool.score > 0 ? `<span class="match-score-badge">${matchPercentage}%</span>` : ''}
                        ${isRecommended ? '<span class="recommended-badge">Best Match</span>' : ''}
                    </div>
                    <div class="platform-desc">${tool.tooltip}</div>
                    <div class="platform-tags">
                        ${tool.bestFor.slice(0, 3).map(item => `<span class="platform-tag">${item}</span>`).join('')}
                        ${tool.matchReason ? `<span class="platform-tag reason" title="${tool.matchReason}"><i class="fas fa-bullseye"></i> ${tool.matchReason.split(',')[0]}</span>` : ''}
                    </div>
                    <div class="platform-score">
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${matchPercentage}%"></div>
                        </div>
                        <span class="score-text">Match: ${matchPercentage}%</span>
                    </div>
                </div>
            `;
            
            // Add click handler
            platformCard.addEventListener('click', (e) => {
                e.preventDefault();
                const outputArea = document.getElementById('outputArea');
                const prompt = outputArea ? outputArea.textContent.trim() : '';
                
                if (prompt && prompt !== 'Your optimized prompt will appear here...' && prompt !== '') {
                    // Copy to clipboard
                    navigator.clipboard.writeText(prompt)
                        .then(() => {
                            // Show notification
                            const event = new CustomEvent('notification', {
                                detail: { 
                                    type: 'success', 
                                    message: `Prompt copied! Opening ${tool.name}...` 
                                }
                            });
                            document.dispatchEvent(event);
                            
                            // Open in new tab after delay
                            setTimeout(() => {
                                if (tool.launchUrl && tool.launchUrl !== '#') {
                                    window.open(tool.launchUrl, '_blank');
                                }
                            }, 500);
                        })
                        .catch(() => {
                            const event = new CustomEvent('notification', {
                                detail: { 
                                    type: 'error', 
                                    message: 'Failed to copy prompt. Please try again.' 
                                }
                            });
                            document.dispatchEvent(event);
                        });
                } else {
                    const event = new CustomEvent('notification', {
                        detail: { 
                            type: 'error', 
                            message: 'Please generate a prompt first' 
                        }
                    });
                    document.dispatchEvent(event);
                }
            });
            
            // Add tooltip
            platformCard.title = `${tool.name}: ${tool.matchReason || tool.tooltip}`;
            
            container.appendChild(platformCard);
        });
        
        return toolOrder;
    }

    resetToDefault() {
        const container = document.getElementById("platformsGrid");
        if (!container) return;
        
        // Show empty state
        const emptyState = document.getElementById("platformsEmptyState");
        if (emptyState) {
            container.innerHTML = '';
            container.appendChild(emptyState);
            emptyState.style.display = 'block';
        }
    }

    setupTooltips() {
        // Tooltip setup if needed
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIRanker;
} else {
    window.AIRanker = AIRanker;
}
