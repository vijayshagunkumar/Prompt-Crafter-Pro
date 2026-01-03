// template-manager.js - Template management
(function() {
    'use strict';
    
    class TemplateManager {
        constructor() {
            this.templates = this.getDefaultTemplates();
            this.storage = new StorageService();
            this.loadTemplates();
        }
        
        getDefaultTemplates() {
            return [
                {
                    id: 'email',
                    name: 'Business Email',
                    category: 'communication',
                    icon: 'fas fa-envelope',
                    description: 'Professional email templates',
                    template: `Subject: {subject}

Dear {recipient},

{body}

Best regards,
{name}
{position}
{company}`
                },
                {
                    id: 'code',
                    name: 'Code Generation',
                    category: 'technical',
                    icon: 'fas fa-code',
                    description: 'Generate code with specific requirements',
                    template: `Task: {task}

Requirements:
- Programming Language: {language}
- Framework: {framework}
- Functionality: {functionality}
- Input: {input}
- Output: {output}
- Constraints: {constraints}

Please provide:
1. Complete code implementation
2. Comments explaining key sections
3. Error handling
4. Test cases
5. Usage examples`
                },
                {
                    id: 'analysis',
                    name: 'Data Analysis',
                    category: 'analytical',
                    icon: 'fas fa-chart-bar',
                    description: 'Analyze data and provide insights',
                    template: `Analysis Request: {analysis_type}

Data Description:
{data_description}

Objectives:
{objectives}

Key Questions:
{questions}

Please provide:
1. Methodology
2. Analysis results
3. Visualizations
4. Insights
5. Recommendations
6. Limitations`
                }
            ];
        }
        
        loadTemplates() {
            const saved = this.storage.get('templates');
            if (saved && saved.length > 0) {
                this.templates = saved;
            }
        }
        
        saveTemplates() {
            this.storage.set('templates', this.templates);
        }
        
        getAll() {
            return this.templates;
        }
        
        getById(id) {
            return this.templates.find(t => t.id === id);
        }
        
        getByCategory(category) {
            return this.templates.filter(t => t.category === category);
        }
        
        addTemplate(template) {
            template.id = 'template_' + Date.now();
            this.templates.push(template);
            this.saveTemplates();
            return template.id;
        }
        
        updateTemplate(id, updates) {
            const index = this.templates.findIndex(t => t.id === id);
            if (index !== -1) {
                this.templates[index] = { ...this.templates[index], ...updates };
                this.saveTemplates();
                return true;
            }
            return false;
        }
        
        deleteTemplate(id) {
            const index = this.templates.findIndex(t => t.id === id);
            if (index !== -1) {
                this.templates.splice(index, 1);
                this.saveTemplates();
                return true;
            }
            return false;
        }
        
        applyTemplate(templateId, variables = {}) {
            const template = this.getById(templateId);
            if (!template) return null;
            
            let result = template.template;
            
            // Replace variables
            Object.entries(variables).forEach(([key, value]) => {
                const placeholder = `{${key}}`;
                result = result.replace(new RegExp(placeholder, 'g'), value || '');
            });
            
            // Remove any remaining placeholders
            result = result.replace(/\{[^}]+\}/g, '');
            
            return result.trim();
        }
        
        createFromPrompt(prompt, name, category) {
            const template = {
                id: 'custom_' + Date.now(),
                name: name || 'Custom Template',
                category: category || 'custom',
                icon: 'fas fa-star',
                description: 'Custom template created from prompt',
                template: prompt
            };
            
            this.addTemplate(template);
            return template.id;
        }
    }
    
    // Export to global scope
    window.TemplateManager = TemplateManager;
    
})();
