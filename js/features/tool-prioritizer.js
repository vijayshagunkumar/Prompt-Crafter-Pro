// AI Tool Prioritization - Sorts AI tools based on prompt content
class ToolPrioritizer {
    constructor() {
        this.toolScores = {
            // Writing & General Purpose
            'chatgptBtn': { keywords: ['general', 'writing', 'email', 'blog', 'article', 'content'], weight: 10 },
            'claudeBtn': { keywords: ['writing', 'creative', 'story', 'analysis', 'detailed'], weight: 9 },
            'geminiBtn': { keywords: ['google', 'integrated', 'search', 'research'], weight: 8 },
            
            // Research & Analysis
            'perplexityBtn': { keywords: ['research', 'analysis', 'study', 'report', 'citation'], weight: 9 },
            
            // Image Generation
            'dalleBtn': { keywords: ['image', 'picture', 'photo', 'visual', 'graphic', 'design', 'art'], weight: 10 },
            'midjourneyBtn': { keywords: ['art', 'creative', 'design', 'visual', 'image', 'picture'], weight: 9 },
            
            // Coding & Technical
            'deepseekBtn': { keywords: ['code', 'programming', 'developer', 'python', 'javascript', 'technical'], weight: 10 },
            'copilotBtn': { keywords: ['code', 'developer', 'microsoft', 'office', 'technical'], weight: 8 },
            
            // Real-time & Business
            'grokBtn': { keywords: ['real-time', 'current', 'news', 'trending', 'x', 'twitter'], weight: 8 }
        };
    }
    
    analyzePrompt(promptText) {
        const text = promptText.toLowerCase();
        const scores = {};
        
        // Calculate scores for each tool
        Object.keys(this.toolScores).forEach(toolId => {
            const tool = this.toolScores[toolId];
            let score = 0;
            
            // Check for keyword matches
            tool.keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    score += tool.weight;
                }
            });
            
            scores[toolId] = score;
        });
        
        // Sort tools by score (descending)
        const sortedTools = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
        
        return {
            bestTool: sortedTools[0],
            scores: scores,
            sortedTools: sortedTools
        };
    }
    
    prioritizeTools(promptText) {
        const analysis = this.analyzePrompt(promptText);
        const launchList = document.querySelector('.launch-list');
        
        if (!launchList) return;
        
        // Get all launch buttons
        const buttons = Array.from(launchList.querySelectorAll('.launch-btn'));
        
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
            
            // Add visual indicator for best tool (first one)
            if (btn.id === analysis.bestTool) {
                btn.classList.add('best-tool');
                // Add crown icon
                const icon = btn.querySelector('.launch-icon');
                if (icon && !icon.querySelector('.crown-icon')) {
                    const crown = document.createElement('span');
                    crown.className = 'crown-icon';
                    crown.innerHTML = '👑';
                    crown.style.position = 'absolute';
                    crown.style.top = '-8px';
                    crown.style.right = '-8px';
                    crown.style.fontSize = '12px';
                    crown.style.zIndex = '5';
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
        
        return analysis.bestTool;
    }
}

// Create instance and export it
const toolPrioritizer = new ToolPrioritizer();

// Export both the class and the instance
export { ToolPrioritizer, toolPrioritizer };
