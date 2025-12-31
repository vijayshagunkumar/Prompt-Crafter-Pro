// Intent detection module
class IntentDetector {
    constructor() {
        this.intentPatterns = {
            // Writing intents
            email: ['email', 'mail', 'send', 'compose', 'write to'],
            report: ['report', 'analysis', 'analyze', 'summary', 'summarize'],
            content: ['blog', 'article', 'post', 'content', 'write'],
            creative: ['story', 'creative', 'fiction', 'poem', 'script'],
            
            // Technical intents
            code: ['code', 'program', 'function', 'script', 'algorithm'],
            debug: ['debug', 'fix', 'error', 'bug', 'issue'],
            explain: ['explain', 'how to', 'what is', 'understand'],
            
            // Business intents
            strategy: ['strategy', 'plan', 'proposal', 'business', 'marketing'],
            analysis: ['analyze', 'research', 'study', 'market', 'competitor'],
            meeting: ['meeting', 'agenda', 'minutes', 'presentation'],
            
            // Education intents
            learn: ['learn', 'study', 'explain', 'teach', 'understand'],
            quiz: ['quiz', 'test', 'exam', 'questions', 'assessment'],
            summary: ['summarize', 'summary', 'overview', 'key points'],
            
            // Format intents
            list: ['list', 'bullet points', 'items', 'steps'],
            table: ['table', 'chart', 'graph', 'data', 'spreadsheet'],
            structured: ['structured', 'format', 'template', 'outline']
        };
        
        this.tones = {
            professional: ['professional', 'formal', 'business', 'official'],
            casual: ['casual', 'informal', 'friendly', 'relaxed'],
            technical: ['technical', 'detailed', 'specific', 'precise'],
            simple: ['simple', 'basic', 'easy', 'clear', 'concise']
        };
    }

    detect(text) {
        const textLower = text.toLowerCase();
        const intents = new Set();
        const tones = new Set();
        const formats = new Set();
        
        // Detect intents
        for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
            if (patterns.some(pattern => textLower.includes(pattern))) {
                intents.add(intent);
            }
        }
        
        // Detect tones
        for (const [tone, patterns] of Object.entries(this.tones)) {
            if (patterns.some(pattern => textLower.includes(pattern))) {
                tones.add(tone);
            }
        }
        
        // Detect formats
        if (textLower.includes('list') || textLower.includes('bullet')) {
            formats.add('list');
        }
        if (textLower.includes('table') || textLower.includes('chart')) {
            formats.add('table');
        }
        if (textLower.includes('code') || textLower.includes('program')) {
            formats.add('code');
        }
        
        // Determine primary intent
        let primaryIntent = 'general';
        if (intents.has('code') || intents.has('debug')) {
            primaryIntent = 'code';
        } else if (intents.has('email')) {
            primaryIntent = 'email';
        } else if (intents.has('report') || intents.has('analysis')) {
            primaryIntent = 'analysis';
        } else if (intents.has('creative')) {
            primaryIntent = 'creative';
        } else if (intents.size > 0) {
            primaryIntent = Array.from(intents)[0];
        }
        
        // Determine primary tone
        let primaryTone = 'professional';
        if (tones.has('casual')) {
            primaryTone = 'casual';
        } else if (tones.has('technical')) {
            primaryTone = 'technical';
        } else if (tones.has('simple')) {
            primaryTone = 'simple';
        }
        
        // Determine primary format
        let primaryFormat = 'paragraph';
        if (formats.has('list')) {
            primaryFormat = 'list';
        } else if (formats.has('table')) {
            primaryFormat = 'table';
        } else if (formats.has('code')) {
            primaryFormat = 'code';
        }
        
        return {
            text: text,
            intents: Array.from(intents),
            tones: Array.from(tones),
            formats: Array.from(formats),
            primaryIntent: primaryIntent,
            primaryTone: primaryTone,
            primaryFormat: primaryFormat,
            wordCount: text.split(/\s+/).length,
            hasCode: intents.has('code') || formats.has('code'),
            hasStructure: intents.has('structured') || formats.has('list') || formats.has('table'),
            requiresDetail: textLower.includes('detailed') || textLower.includes('comprehensive')
        };
    }

    intentToChips(intent) {
        const chips = [];
        
        // Add primary intent chip
        if (intent.primaryIntent && intent.primaryIntent !== 'general') {
            chips.push(intent.primaryIntent);
        }
        
        // Add tone chip if not default
        if (intent.primaryTone && intent.primaryTone !== 'professional') {
            chips.push(intent.primaryTone);
        }
        
        // Add format chip if not default
        if (intent.primaryFormat && intent.primaryFormat !== 'paragraph') {
            chips.push(intent.primaryFormat);
        }
        
        // Add special chips
        if (intent.hasCode) {
            chips.push('code');
        }
        if (intent.requiresDetail) {
            chips.push('detailed');
        }
        if (intent.wordCount > 200) {
            chips.push('long-form');
        }
        
        return chips.map(chip => this.formatChipText(chip));
    }

    formatChipText(chip) {
        const chipTexts = {
            email: '📧 Email',
            report: '📊 Report',
            content: '📝 Content',
            creative: '🎨 Creative',
            code: '💻 Code',
            debug: '🐛 Debug',
            explain: '📚 Explain',
            strategy: '🎯 Strategy',
            analysis: '🔍 Analysis',
            meeting: '👥 Meeting',
            learn: '🧠 Learn',
            quiz: '📝 Quiz',
            summary: '📋 Summary',
            list: '📋 List',
            table: '📊 Table',
            structured: '🏗️ Structured',
            professional: '💼 Professional',
            casual: '😊 Casual',
            technical: '🔧 Technical',
            simple: '✨ Simple',
            detailed: '🔬 Detailed',
            'long-form': '📖 Long-form'
        };
        
        return chipTexts[chip] || chip.charAt(0).toUpperCase() + chip.slice(1);
    }

    getRoleAndPreset(text) {
        const textLower = text.toLowerCase();
        let role = 'assistant';
        let preset = 'default';
        
        if (textLower.includes('claude') || textLower.includes('anthropic')) {
            preset = 'claude';
            role = 'Claude';
        } else if (textLower.includes('chatgpt') || textLower.includes('gpt')) {
            preset = 'chatgpt';
            role = 'ChatGPT';
        } else if (textLower.includes('code') || textLower.includes('program')) {
            preset = 'detailed';
            role = 'Developer';
        } else if (textLower.includes('creative') || textLower.includes('story')) {
            preset = 'detailed';
            role = 'Creative Writer';
        } else if (textLower.includes('business') || textLower.includes('professional')) {
            preset = 'detailed';
            role = 'Business Consultant';
        }
        
        return { role, preset };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntentDetector;
} else {
    window.IntentDetector = IntentDetector;
}
