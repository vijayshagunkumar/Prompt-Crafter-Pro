// AI Tool Prioritization - Sorts AI tools based on prompt content
class ToolPrioritizer {
    constructor() {
        this.toolScores = {
            // Writing & General Purpose
            'chatgptBtn': { keywords: ['general', 'writing', 'email', 'blog', 'article', 'content', 'assistant'], weight: 10 },
            'claudeBtn': { keywords: ['writing', 'creative', 'story', 'analysis', 'detailed', 'anthropic'], weight: 9 },
            'geminiBtn': { keywords: ['google', 'integrated', 'search', 'research', 'multimodal'], weight: 8 },
            
            // Research & Analysis
            'perplexityBtn': { keywords: ['research', 'analysis', 'study', 'report', 'citation', 'academic'], weight: 9 },
            
            // Image Generation
            'dalleBtn': { keywords: ['image', 'picture', 'photo', 'visual', 'graphic', 'design', 'art', 'generate image'], weight: 10 },
            'midjourneyBtn': { keywords: ['art', 'creative', 'design', 'visual', 'image', 'picture', 'illustration', 'digital art'], weight: 9 },
            
            // Coding & Technical
            'deepseekBtn': { keywords: ['code', 'programming', 'developer', 'python', 'javascript', 'technical', 'algorithm'], weight: 10 },
            'copilotBtn': { keywords: ['code', 'developer', 'microsoft', 'office', 'technical', 'visual studio'], weight: 8 },
            
            // Real-time & Business
            'grokBtn': { keywords: ['real-time', 'current', 'news', 'trending', 'x', 'twitter', 'elon'], weight: 8 }
        };
    }
    
    analyzePrompt(promptText) {
        if (!promptText || promptText.trim() === '') {
            return {
                bestTool: 'chatgptBtn',
                scores: {},
                sortedTools: ['chatgptBtn', 'claudeBtn', 'geminiBtn', 'perplexityBtn', 'deepseekBtn', 'copilotBtn', 'grokBtn', 'dalleBtn', 'midjourneyBtn']
            };
        }
        
        const text = promptText.toLowerCase();
        const scores = {};
        
        // Calculate scores for each tool
        Object.keys(this.toolScores).forEach(toolId => {
            const tool = this.toolScores[toolId];
            let score = 0;
            
            // Check for keyword matches
            tool.keywords.forEach(keyword => {
                if (text.includes(keyword.toLowerCase())) {
                    score += tool.weight;
                }
            });
            
            scores[toolId] = score;
        });
        
        // Sort tools by score (descending)
        const sortedTools = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
        
        // If no tool has score > 0, default to ChatGPT
        const bestTool = sortedTools.length > 0 && scores[sortedTools[0]] > 0 ? sortedTools[0] : 'chatgptBtn';
        
        return {
            bestTool: bestTool,
            scores: scores,
            sortedTools: sortedTools
        };
    }
    
    prioritizeTools(promptText) {
        try {
            const analysis = this.analyzePrompt(promptText);
            const launchList = document.querySelector('.launch-list');
            
            if (!launchList) return null;
            
            // Get all launch buttons
            const buttons = Array.from(launchList.querySelectorAll('.launch-btn'));
            
            if (buttons.length === 0) return null;
            
            // Sort buttons based on priority
            buttons.sort((a, b) => {
                const scoreA = analysis.scores[a.id] || 0;
                const scoreB = analysis.scores[b.id] || 0;
                return scoreB - scoreA;
            });
            
            // Clear and re-add in sorted order
            launchList.innerHTML = '';
            buttons.forEach(btn => {
                launchList.appendChild(btn);
                
                // Add visual indicator for best tool
                if (btn.id === analysis.bestTool) {
                    btn.classList.add('best-tool');
                    // Add crown icon
                    const icon = btn.querySelector('.launch-icon');
                    if (icon && !icon.querySelector('.crown-icon')) {
                        const crown = document.createElement('span');
                        crown.className = 'crown-icon';
                        crown.innerHTML = '👑';
                        crown.style.position = 'absolute';
                        crown.style.top = '-6px';
                        crown.style.right = '-6px';
                        crown.style.fontSize = '10px';
                        crown.style.zIndex = '5';
                        crown.style.background = 'rgba(245, 158, 11, 0.9)';
                        crown.style.borderRadius = '50%';
                        crown.style.width = '16px';
                        crown.style.height = '16px';
                        crown.style.display = 'flex';
                        crown.style.alignItems = 'center';
                        crown.style.justifyContent = 'center';
                        crown.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                        icon.style.position = 'relative';
                        icon.appendChild(crown);
                    }
                } else {
                    btn.classList.remove('best-tool');
                    // Remove crown if exists
                    const crown = btn.querySelector('.crown-icon');
                    if (crown) {
                        crown.remove();
                    }
                }
            });
            
            // Show notification for best tool
            const toolNames = {
                'chatgptBtn': 'ChatGPT',
                'claudeBtn': 'Claude',
                'geminiBtn': 'Gemini',
                'perplexityBtn': 'Perplexity',
                'dalleBtn': 'DALL·E',
                'midjourneyBtn': 'Midjourney',
                'deepseekBtn': 'DeepSeek',
                'copilotBtn': 'Copilot',
                'grokBtn': 'Grok'
            };
            
            if (analysis.scores[analysis.bestTool] > 0) {
                setTimeout(() => {
                    notifications.info(`✨ ${toolNames[analysis.bestTool]} recommended for this task!`, 3000);
                }, 500);
            }
            
            return analysis.bestTool;
        } catch (error) {
            console.error('Tool prioritization error:', error);
            return null;
        }
    }
}

// Create instance
const toolPrioritizer = new ToolPrioritizer();

// Export both
export { ToolPrioritizer, toolPrioritizer };
