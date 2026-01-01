// template-manager.js - Template library management
export class TemplateManager {
    constructor() {
        this.templates = this.loadTemplates();
    }

    loadTemplates() {
        const defaultTemplates = [
            {
                id: 'email_client',
                name: 'Client Email',
                category: 'email',
                description: 'Professional email to a client',
                content: `Compose a professional email to a client regarding [topic]. The email should:
1. Start with appropriate greeting
2. Clearly state the purpose
3. Provide necessary details
4. Include call-to-action
5. End with professional closing
6. Maintain professional tone throughout`
            },
            {
                id: 'code_function',
                name: 'Python Function',
                category: 'code',
                description: 'Python function with documentation',
                content: `Write a Python function that [function purpose]. Requirements:
1. Include docstring with parameters and return values
2. Add type hints
3. Include error handling
4. Add comments for complex logic
5. Follow PEP 8 style guide
6. Include usage example`
            },
            {
                id: 'analysis_report',
                name: 'Data Analysis',
                category: 'analysis',
                description: 'Data analysis report template',
                content: `Analyze the following data and provide insights:
Data: [describe data]
Analysis requirements:
1. Executive summary
2. Key findings
3. Trends and patterns
4. Comparative analysis
5. Recommendations
6. Limitations
7. Visual suggestions`
            },
            {
                id: 'creative_story',
                name: 'Short Story',
                category: 'creative',
                description: 'Creative short story template',
                content: `Write a short story about [theme]. Include:
1. Engaging opening
2. Character development
3. Plot progression
4. Conflict and resolution
5. Descriptive language
6. Emotional depth
7. Satisfying conclusion`
            }
        ];

        // Load saved templates from localStorage
        const saved = localStorage.getItem('customTemplates');
        const customTemplates = saved ? JSON.parse(saved) : [];
        
        return [...defaultTemplates, ...customTemplates];
    }

    getTemplatesByCategory(category) {
        if (!category) return this.templates;
        return this.templates.filter(t => t.category === category);
    }

    getTemplate(id) {
        return this.templates.find(t => t.id === id);
    }

    addTemplate(template) {
        template.id = `custom_${Date.now()}`;
        this.templates.push(template);
        this.saveTemplates();
        return template;
    }

    updateTemplate(id, updates) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index !== -1) {
            this.templates[index] = { ...this.templates[index], ...updates };
            this.saveTemplates();
            return this.templates[index];
        }
        return null;
    }

    deleteTemplate(id) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index !== -1) {
            const deleted = this.templates.splice(index, 1);
            this.saveTemplates();
            return deleted[0];
        }
        return null;
    }

    saveTemplates() {
        const customTemplates = this.templates.filter(t => t.id.startsWith('custom_'));
        localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
    }

    getCategories() {
        const categories = new Set(this.templates.map(t => t.category));
        return Array.from(categories);
    }

    searchTemplates(query) {
        const lowerQuery = query.toLowerCase();
        return this.templates.filter(t => 
            t.name.toLowerCase().includes(lowerQuery) ||
            t.description.toLowerCase().includes(lowerQuery) ||
            t.category.toLowerCase().includes(lowerQuery)
        );
    }

    applyTemplate(templateId, userInput) {
        const template = this.getTemplate(templateId);
        if (!template) return userInput;
        
        return template.content.replace('[topic]', userInput)
                               .replace('[function purpose]', userInput)
                               .replace('[describe data]', userInput)
                               .replace('[theme]', userInput);
    }
}
