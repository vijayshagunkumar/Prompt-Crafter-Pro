// prompt-generator.js - Generate optimized prompts
export class PromptGenerator {
    static styles = {
        detailed: {
            name: 'Detailed & Structured',
            icon: 'fas fa-file-alt',
            description: 'Comprehensive prompts with clear structure'
        },
        concise: {
            name: 'Concise & Direct',
            icon: 'fas fa-bolt',
            description: 'Short and to-the-point prompts'
        },
        creative: {
            name: 'Creative & Engaging',
            icon: 'fas fa-paint-brush',
            description: 'Imaginative prompts with creative flair'
        },
        professional: {
            name: 'Professional & Formal',
            icon: 'fas fa-briefcase',
            description: 'Business-appropriate formal prompts'
        }
    };

    static templates = {
        email: `Compose a professional email that:

Context: [USER_INPUT]

Requirements:
1. Use formal but approachable tone
2. Include clear subject line
3. Structure with greeting, body, and closing
4. Be concise (under 200 words)
5. Include appropriate call-to-action
6. Add professional signature if needed

Please craft an email that achieves the above goals effectively.`,

        code: `Write code that:

Task: [USER_INPUT]

Requirements:
1. Use proper coding standards and conventions
2. Include comprehensive comments
3. Add error handling where appropriate
4. Optimize for readability and maintainability
5. Include usage examples if applicable
6. Consider edge cases and performance

Please provide clean, well-documented code that solves the problem effectively.`,

        analysis: `Provide analysis for:

Data/Context: [USER_INPUT]

Analysis Requirements:
1. Provide executive summary first
2. Include key findings and insights
3. Use data-driven observations
4. Structure with clear sections
5. Highlight trends and patterns
6. Offer actionable recommendations
7. Include potential limitations

Please deliver a comprehensive, evidence-based analysis.`,

        creative: `Create creative content about:

Theme: [USER_INPUT]

Creative Requirements:
1. Use engaging and vivid language
2. Show, don't tell
3. Include sensory details
4. Develop compelling narrative
5. Maintain consistent tone and style
6. Be original and imaginative
7. Evoke appropriate emotions

Please craft creative content that captivates and engages the audience.`
    };

    static generate(input, style = 'detailed') {
        const basePrompt = `You are an expert AI assistant. Your task is to:

User Request: ${input}

Please provide a comprehensive response that addresses all aspects of the request.`;

        const stylePrompts = {
            detailed: `${basePrompt}

Response Requirements:
1. Provide thorough, detailed analysis
2. Structure with clear sections (Introduction, Analysis, Conclusion)
3. Include specific examples and evidence
4. Use professional terminology appropriately
5. Consider multiple perspectives and edge cases
6. Offer practical, actionable recommendations
7. Maintain formal but accessible tone

Format: Well-structured with headings and bullet points where appropriate.`,

            concise: `Task: ${input}

Provide a direct, concise response focusing on key points. Use clear language and avoid unnecessary elaboration. Get straight to the point.`,

            creative: `Creative Prompt: ${input}

Approach this with innovative thinking and imaginative solutions. Use engaging language, storytelling elements where appropriate, and focus on unique perspectives. Be original and inspiring in your response.`,

            professional: `Professional Request: ${input}

Prepare a formal, business-appropriate response that includes:
• Executive summary
• Background and context
• Detailed analysis
• Strategic recommendations
• Implementation considerations
• Risk assessment
• Next steps

Use professional tone and formal structure suitable for business communications.`
        };

        return stylePrompts[style] || stylePrompts.detailed;
    }

    static applyTemplate(templateType, input) {
        const template = this.templates[templateType];
        if (!template) return this.generate(input);

        return template.replace('[USER_INPUT]', input);
    }

    static getStyleInfo(style) {
        return this.styles[style] || this.styles.detailed;
    }

    static getAllStyles() {
        return Object.entries(this.styles).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }

    static getAllTemplates() {
        return Object.entries(this.templates).map(([key]) => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            icon: this.getTemplateIcon(key)
        }));
    }

    static getTemplateIcon(templateType) {
        const icons = {
            email: 'fas fa-envelope',
            code: 'fas fa-code',
            analysis: 'fas fa-chart-bar',
            creative: 'fas fa-paint-brush',
            business: 'fas fa-briefcase',
            research: 'fas fa-search'
        };
        return icons[templateType] || 'fas fa-file-alt';
    }
}
