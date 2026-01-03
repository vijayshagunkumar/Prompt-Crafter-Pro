// ai-ranker.js - Rank AI platforms based on prompt
(function() {
    'use strict';
    
    class AIRanker {
        constructor() {
            this.platforms = [
                {
                    id: 'gemini',
                    name: 'Google Gemini',
                    icon: 'fab fa-google',
                    color: '#8B5CF6',
                    description: 'Advanced reasoning and multimodal capabilities',
                    tags: ['Multimodal', 'Advanced', 'Google'],
                    launchUrl: 'https://gemini.google.com/',
                    strengths: ['reasoning', 'multimodal', 'code', 'analysis'],
                    weaknesses: ['creativity'],
                    bestFor: ['Complex reasoning', 'Multimodal tasks', 'Technical analysis']
                },
                {
                    id: 'chatgpt',
                    name: 'ChatGPT',
                    icon: 'fas fa-comment-alt',
                    color: '#10A37F',
                    description: 'Industry-leading conversational AI',
                    tags: ['Conversational', 'Popular', 'OpenAI'],
                    launchUrl: 'https://chat.openai.com/',
                    strengths: ['conversation', 'creativity', 'versatility'],
                    weaknesses: ['reasoning'],
                    bestFor: ['Creative writing', 'Conversation', 'General tasks']
                },
                {
                    id: 'claude',
                    name: 'Anthropic Claude',
                    icon: 'fas fa-brain',
                    color: '#D4A574',
                    description: 'Constitutional AI with safety focus',
                    tags: ['Safe', 'Contextual', 'Anthropic'],
                    launchUrl: 'https://claude.ai/',
                    strengths: ['safety', 'context', 'analysis'],
                    weaknesses: ['creativity'],
                    bestFor: ['Business documents', 'Analysis', 'Safety-critical tasks']
                },
                {
                    id: 'perplexity',
                    name: 'Perplexity AI',
                    icon: 'fas fa-search',
                    color: '#4F46E5',
                    description: 'AI-powered research and search engine',
                    tags: ['Research', 'Search', 'Citations'],
                    launchUrl: 'https://www.perplexity.ai/',
                    strengths: ['research', 'citations', 'accuracy'],
                    weaknesses: ['creativity'],
                    bestFor: ['Research', 'Fact-finding', 'Citations']
                }
            ];
        }
        
        rank(promptText, intent = 'general') {
            const scores = {};
            
            this.platforms.forEach(platform => {
                let score = 50; // Base score
                
                // Adjust based on intent
                switch(intent) {
                    case 'coding':
                        if (platform.strengths.includes('code')) score += 30;
                        break;
                    case 'analysis':
                        if (platform.strengths.includes('analysis')) score += 25;
                        break;
                    case 'creative':
                        if (platform.strengths.includes('creativity')) score += 30;
                        break;
                    case 'business':
                        if (platform.strengths.includes('safety')) score += 20;
                        break;
                    case 'research':
                        if (platform.strengths.includes('research')) score += 30;
                        break;
                }
                
                // Adjust based on prompt length
                const wordCount = promptText.split(/\s+/).length;
                if (wordCount > 500 && platform.id === 'claude') {
                    score += 20; // Claude has large context
                }
                
                // Adjust based on complexity
                if (this.isComplexPrompt(promptText) && platform.id === 'gemini') {
                    score += 15; // Gemini good for complex reasoning
                }
                
                scores[platform.id] = {
                    score: Math.min(100, score),
                    platform: platform
                };
            });
            
            // Sort by score
            return Object.values(scores)
                .sort((a, b) => b.score - a.score)
                .map(item => ({
                    ...item.platform,
                    matchScore: item.score
                }));
        }
        
        isComplexPrompt(promptText) {
            const complexIndicators = [
                'analyze', 'compare', 'evaluate', 'explain', 'discuss',
                'critically', 'comprehensive', 'detailed', 'complex'
            ];
            
            return complexIndicators.some(indicator => 
                promptText.toLowerCase().includes(indicator)
            );
        }
        
        getRecommendations(rankedPlatforms, limit = 3) {
            return rankedPlatforms.slice(0, limit);
        }
    }
    
    // Export to global scope
    window.AIRanker = AIRanker;
    
})();
