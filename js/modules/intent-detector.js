// intent-detector.js - Intent detection from user input
export class IntentDetector {
    static patterns = {
        email: /\b(email|mail|message|follow.?up|respond|inquiry|query)\b/i,
        code: /\b(code|function|program|script|algorithm|debug|fix|implement|develop|API)\b/i,
        analysis: /\b(analyze|analysis|report|summary|insight|data|statistics|trends|metrics)\b/i,
        creative: /\b(story|creative|write|narrative|imaginative|poem|fiction|plot|character)\b/i,
        business: /\b(business|strategy|plan|proposal|market|sales|marketing|financial|budget)\b/i,
        research: /\b(research|study|findings|paper|academic|thesis|dissertation|literature)\b/i,
        technical: /\b(technical|specification|documentation|manual|guide|tutorial|how.?to)\b/i,
        social: /\b(social|media|post|tweet|caption|content|engagement|viral|trending)\b/i
    };

    static analyzeInput(text) {
        if (!text || text.trim().length < 10) {
            return {
                taskType: 'general',
                format: 'free',
                depth: 'normal',
                audience: 'general',
                constraints: [],
                allIntents: ['general']
            };
        }

        const detectedIntents = [];
        const constraints = [];
        let format = 'free';
        let depth = 'normal';
        let audience = 'general';

        // Detect intents
        for (const [intent, pattern] of Object.entries(this.patterns)) {
            if (pattern.test(text)) {
                detectedIntents.push(intent);
            }
        }

        // Detect format
        if (/\b(email|mail)\b/i.test(text)) format = 'email';
        if (/\b(code|program|script)\b/i.test(text)) format = 'code';
        if (/\b(document|report|paper)\b/i.test(text)) format = 'document';

        // Detect depth
        if (/\b(detailed|comprehensive|thorough|in.?depth)\b/i.test(text)) depth = 'deep';
        if (/\b(concise|brief|short|quick)\b/i.test(text)) depth = 'normal';

        // Detect audience
        if (/\b(business|professional|corporate|executive)\b/i.test(text)) audience = 'business';
        if (/\b(academic|educational|student|research)\b/i.test(text)) audience = 'academic';
        if (/\b(technical|developer|engineer|programmer)\b/i.test(text)) audience = 'technical';

        // Detect constraints
        if (/\b(formal|professional|official)\b/i.test(text)) constraints.push('formal');
        if (/\b(casual|informal|friendly)\b/i.test(text)) constraints.push('casual');
        if (/\b(persuasive|convincing|sales)\b/i.test(text)) constraints.push('persuasive');
        if (/\b(educational|explanatory|tutorial)\b/i.test(text)) constraints.push('educational');

        // Determine primary task type
        let taskType = 'general';
        if (detectedIntents.includes('email')) taskType = 'email';
        else if (detectedIntents.includes('code')) taskType = 'code';
        else if (detectedIntents.includes('analysis')) taskType = 'analysis';
        else if (detectedIntents.includes('creative')) taskType = 'creative';
        else if (detectedIntents.includes('business')) taskType = 'business';
        else if (detectedIntents.length > 0) taskType = detectedIntents[0];

        return {
            taskType,
            format,
            depth,
            audience,
            constraints,
            allIntents: detectedIntents.length > 0 ? detectedIntents : ['general']
        };
    }

    static getIntentColor(intent) {
        const colors = {
            email: '#3B82F6',      // Blue
            code: '#10B981',       // Green
            analysis: '#8B5CF6',   // Purple
            creative: '#F59E0B',   // Yellow
            business: '#EF4444',   // Red
            research: '#06B6D4',   // Cyan
            technical: '#6366F1',  // Indigo
            social: '#EC4899',     // Pink
            general: '#6B7280'     // Gray
        };
        return colors[intent] || colors.general;
    }

    static getIntentIcon(intent) {
        const icons = {
            email: 'fas fa-envelope',
            code: 'fas fa-code',
            analysis: 'fas fa-chart-bar',
            creative: 'fas fa-paint-brush',
            business: 'fas fa-briefcase',
            research: 'fas fa-search',
            technical: 'fas fa-cogs',
            social: 'fas fa-share-alt',
            general: 'fas fa-question-circle'
        };
        return icons[intent] || icons.general;
    }
}
