// intent-detector.js - Detect user intent from input
(function() {
    'use strict';
    
    class IntentDetector {
        constructor() {
            this.intents = {
                writing: ['write', 'create', 'draft', 'compose', 'generate text'],
                coding: ['code', 'program', 'function', 'script', 'algorithm', 'debug'],
                analysis: ['analyze', 'analyze', 'evaluate', 'assess', 'review', 'examine'],
                creative: ['creative', 'story', 'poem', 'art', 'design', 'imagine'],
                business: ['business', 'strategy', 'plan', 'proposal', 'report', 'presentation'],
                email: ['email', 'message', 'letter', 'correspondence', 'mail'],
                research: ['research', 'study', 'investigate', 'explore', 'find'],
                translation: ['translate', 'convert language', 'interpret'],
                summary: ['summarize', 'brief', 'overview', 'abstract', 'recap'],
                explanation: ['explain', 'describe', 'clarify', 'define', 'teach']
            };
        }
        
        detect(inputText) {
            const text = inputText.toLowerCase();
            const detectedIntents = [];
            
            for (const [intent, keywords] of Object.entries(this.intents)) {
                if (keywords.some(keyword => text.includes(keyword))) {
                    detectedIntents.push(intent);
                }
            }
            
            // If no intent detected, return general
            if (detectedIntents.length === 0) {
                detectedIntents.push('general');
            }
            
            // Return primary intent (first detected)
            return {
                primary: detectedIntents[0],
                all: detectedIntents,
                confidence: this.calculateConfidence(detectedIntents, text)
            };
        }
        
        calculateConfidence(intents, text) {
            if (intents.length > 1) {
                return 0.7; // Multiple intents detected
            }
            
            const wordCount = text.split(/\s+/).length;
            if (wordCount < 5) {
                return 0.5; // Low confidence for short inputs
            }
            
            return 0.9; // High confidence for clear intent
        }
        
        getRecommendation(intent) {
            const recommendations = {
                writing: 'Consider specifying tone, audience, and key points for better results.',
                coding: 'Include programming language, framework, and specific requirements.',
                analysis: 'Provide data sources, metrics, and desired output format.',
                creative: 'Mention style, mood, themes, and creative constraints.',
                business: 'Include stakeholders, objectives, timeline, and budget.',
                email: 'Specify recipient, purpose, tone, and key messages.',
                research: 'Define scope, sources, methodology, and expected findings.',
                translation: 'Mention source and target languages, context, and formality.',
                summary: 'Include source material length, key points, and summary length.',
                explanation: 'Define target audience, complexity level, and key concepts.',
                general: 'Provide as much context as possible for optimal results.'
            };
            
            return recommendations[intent] || recommendations.general;
        }
    }
    
    // Export to global scope
    window.IntentDetector = IntentDetector;
    
})();
