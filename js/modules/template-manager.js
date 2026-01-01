// template-manager.js - Template management
(function() {
    'use strict';
    
    class TemplateManager {
        constructor() {
            this.storage = new StorageService();
            this.templates = this.loadTemplates();
            this.categories = {
                communication: { name: "Communication", icon: "fa-envelope", color: "#3b82f6" },
                coding: { name: "Coding", icon: "fa-code", color: "#10b981" },
                writing: { name: "Writing", icon: "fa-pen", color: "#8b5cf6" },
                analysis: { name: "Analysis", icon: "fa-chart-bar", color: "#f59e0b" },
                business: { name: "Business", icon: "fa-briefcase", color: "#ef4444" },
                creative: { name: "Creative", icon: "fa-palette", color: "#ec4899" },
                education: { name: "Education", icon: "fa-graduation-cap", color: "#06b6d4" }
            };
        }
        
        loadTemplates() {
            const saved = this.storage.get('templates');
            if (saved && Array.isArray(saved)) {
                return saved;
            }
            
            // Load default templates
            const defaultTemplates = [
                {
                    id: 'template-email-1',
                    name: 'Professional Email',
                    category: 'communication',
                    description: 'Write clear, professional emails for business communication',
                    content: `# Role
You are an expert business communicator skilled in writing professional emails.

# Objective
Write a professional email about [TOPIC] to [RECIPIENT]

# Context
- Recipient: [DESCRIBE RECIPIENT]
- Relationship: [DESCRIBE RELATIONSHIP]
- Purpose: [EMAIL PURPOSE]

# Instructions
1. Use professional but friendly tone
2. Start with appropriate greeting
3. State purpose clearly in first paragraph
4. Provide necessary details
5. Include clear call to action
6. End with professional closing

# Notes
- Keep it concise (150-200 words)
- Use proper email formatting
- Include subject line
- Check for tone appropriateness`,
                    usageCount: 0,
                    isFavorite: false,
                    createdAt: Date.now(),
                    tags: ['email', 'business', 'communication']
                },
                {
                    id: 'template-code-1',
                    name: 'Code Review',
                    category: 'coding',
                    description: 'Analyze and improve code quality',
                    content: `# Role
You are an expert software engineer performing a comprehensive code review.

# Objective
Review and improve the following code for quality, performance, and best practices.

# Context
- Language: [PROGRAMMING LANGUAGE]
- Framework: [FRAMEWORK IF ANY]
- Purpose: [WHAT THE CODE IS SUPPOSED TO DO]

# Instructions
1. Analyze code structure and organization
2. Identify potential bugs or edge cases
3. Check for security vulnerabilities
4. Review performance optimizations
5. Ensure adherence to coding standards
6. Provide specific improvement suggestions

# Notes
- Include code examples for improvements
- Focus on actionable feedback
- Consider scalability and maintainability`,
                    usageCount: 0,
                    isFavorite: false,
                    createdAt: Date.now(),
                    tags: ['code', 'review', 'programming']
                },
                {
                    id: 'template-analysis-1',
                    name: 'Data Analysis',
                    category: 'analysis',
                    description: 'Analyze data and provide insights',
                    content: `# Role
You are an expert data analyst with experience in interpreting complex datasets.

# Objective
Analyze the provided data and extract meaningful insights.

# Context
- Data Type: [STRUCTURED/UNSTRUCTURED/TIME SERIES]
- Data Volume: [APPROXIMATE SIZE]
- Business Context: [WHAT DECISIONS WILL THIS INFORM]

# Instructions
1. Clean and prepare the data (describe steps)
2. Perform exploratory data analysis
3. Identify key trends and patterns
4. Calculate relevant metrics and statistics
5. Create visualizations (describe types)
6. Provide actionable recommendations

# Notes
- Focus on business impact
- Consider data limitations
- Suggest next steps for further analysis`,
                    usageCount: 0,
                    isFavorite: false,
                    createdAt: Date.now(),
                    tags: ['data', 'analysis', 'insights']
                }
            ];
            
            this.storage.set('templates', defaultTemplates);
            return defaultTemplates;
        }
        
        saveTemplates() {
            return this.storage.set('templates', this.templates);
        }
        
        getAllTemplates() {
            return [...this.templates];
        }
        
        getTemplatesByCategory(category) {
            return this.templates.filter(template => template.category === category);
        }
        
        getTemplateById(id) {
            return this.templates.find(template => template.id === id);
        }
        
        addTemplate(template) {
            const newTemplate = {
                id: `template-${Date.now()}`,
                createdAt: Date.now(),
                usageCount: 0,
                isFavorite: false,
                ...template
            };
            
            this.templates.push(newTemplate);
            this.saveTemplates();
            return newTemplate;
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
            const initialLength = this.templates.length;
            this.templates = this.templates.filter(t => t.id !== id);
            
            if (this.templates.length < initialLength) {
                this.saveTemplates();
                return true;
            }
            return false;
        }
        
        incrementUsage(id) {
            const template = this.getTemplateById(id);
            if (template) {
                template.usageCount = (template.usageCount || 0) + 1;
                this.saveTemplates();
                return template.usageCount;
            }
            return 0;
        }
        
        toggleFavorite(id) {
            const template = this.getTemplateById(id);
            if (template) {
                template.isFavorite = !template.isFavorite;
                this.saveTemplates();
                return template.isFavorite;
            }
            return false;
        }
        
        searchTemplates(query) {
            const searchTerm = query.toLowerCase();
            return this.templates.filter(template => 
                template.name.toLowerCase().includes(searchTerm) ||
                template.description.toLowerCase().includes(searchTerm) ||
                (template.tags && template.tags.some(tag => 
                    tag.toLowerCase().includes(searchTerm)
                ))
            );
        }
        
        getPopularTemplates(limit = 5) {
            return [...this.templates]
                .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
                .slice(0, limit);
        }
        
        getFavoriteTemplates() {
            return this.templates.filter(template => template.isFavorite);
        }
        
        getCategories() {
            return { ...this.categories };
        }
        
        exportTemplates() {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                templates: this.templates
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `promptcraft-templates-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        importTemplates(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const importData = JSON.parse(e.target.result);
                        
                        if (importData.templates && Array.isArray(importData.templates)) {
                            // Merge with existing templates
                            const existingIds = new Set(this.templates.map(t => t.id));
                            const newTemplates = importData.templates.filter(t => !existingIds.has(t.id));
                            
                            this.templates.push(...newTemplates);
                            this.saveTemplates();
                            
                            resolve({
                                success: true,
                                imported: newTemplates.length,
                                skipped: importData.templates.length - newTemplates.length
                            });
                        } else {
                            reject(new Error('Invalid template file format'));
                        }
                    } catch (error) {
                        reject(new Error('Failed to parse template file'));
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('Failed to read template file'));
                };
                
                reader.readAsText(file);
            });
        }
        
        // Generate template suggestion based on user input
        suggestTemplate(userInput) {
            const inputLower = userInput.toLowerCase();
            const suggestions = [];
            
            this.templates.forEach(template => {
                let score = 0;
                
                // Check name match
                if (template.name.toLowerCase().includes(inputLower)) {
                    score += 3;
                }
                
                // Check description match
                if (template.description.toLowerCase().includes(inputLower)) {
                    score += 2;
                }
                
                // Check tags match
                if (template.tags) {
                    template.tags.forEach(tag => {
                        if (tag.toLowerCase().includes(inputLower)) {
                            score += 1;
                        }
                    });
                }
                
                // Check category keywords
                const categoryKeywords = {
                    communication: ['email', 'message', 'write', 'communicate', 'professional'],
                    coding: ['code', 'program', 'develop', 'function', 'algorithm', 'debug'],
                    analysis: ['analyze', 'data', 'research', 'insight', 'trend', 'statistic'],
                    business: ['business', 'strategy', 'plan', 'proposal', 'report'],
                    creative: ['creative', 'story', 'write', 'generate', 'imagine']
                };
                
                if (categoryKeywords[template.category]) {
                    categoryKeywords[template.category].forEach(keyword => {
                        if (inputLower.includes(keyword)) {
                            score += 1;
                        }
                    });
                }
                
                if (score > 0) {
                    suggestions.push({
                        template,
                        score,
                        matchReason: this.getMatchReason(template, inputLower)
                    });
                }
            });
            
            return suggestions
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);
        }
        
        getMatchReason(template, inputLower) {
            if (template.name.toLowerCase().includes(inputLower)) {
                return `Matches template name: "${template.name}"`;
            }
            
            if (template.description.toLowerCase().includes(inputLower)) {
                return `Matches description: "${template.description.substring(0, 50)}..."`;
            }
            
            return `Suggested based on category: ${this.categories[template.category].name}`;
        }
        
        // Get statistics about templates
        getStats() {
            const stats = {
                total: this.templates.length,
                byCategory: {},
                favorites: 0,
                totalUsage: 0,
                mostPopular: null,
                recent: []
            };
            
            this.templates.forEach(template => {
                // Count by category
                stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1;
                
                // Count favorites
                if (template.isFavorite) {
                    stats.favorites++;
                }
                
                // Sum total usage
                stats.totalUsage += template.usageCount || 0;
                
                // Track most popular
                if (!stats.mostPopular || template.usageCount > stats.mostPopular.usageCount) {
                    stats.mostPopular = template;
                }
            });
            
            // Get recent templates (last 7 days)
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            stats.recent = this.templates
                .filter(t => t.createdAt > sevenDaysAgo)
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 5);
            
            return stats;
        }
    }
    
    // Export to global scope
    window.TemplateManager = TemplateManager;
    
})();
