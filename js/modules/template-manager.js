/**
 * Template Manager
 * Handles template loading, rendering, and management
 */
class TemplateManager {
    constructor() {
        this.storage = new StorageService();
        this.templates = this.loadTemplates();
        this.categories = window.TEMPLATE_CATEGORIES || {};
        this.selectedCategory = 'all';
    }

    loadTemplates() {
        try {
            const saved = this.storage.get('templates');
            const defaults = window.DEFAULT_TEMPLATES || [];
            
            if (!saved || saved.length === 0) {
                this.saveTemplates(defaults);
                return defaults;
            }
            
            return saved;
        } catch (error) {
            console.error('Error loading templates:', error);
            return window.DEFAULT_TEMPLATES || [];
        }
    }

    saveTemplates(templates) {
        this.templates = templates;
        return this.storage.set('templates', templates);
    }

    getTemplates(category = null) {
        const cat = category || this.selectedCategory;
        
        if (cat === 'all') {
            return this.templates;
        }
        
        return this.templates.filter(t => t.category === cat);
    }

    getTemplateById(id) {
        return this.templates.find(t => t.id === id);
    }

    addTemplate(template) {
        const newTemplate = {
            ...template,
            id: Date.now().toString(),
            usageCount: 0,
            createdAt: Date.now(),
            isDefault: false
        };
        
        this.templates.unshift(newTemplate);
        this.saveTemplates(this.templates);
        return newTemplate;
    }

    updateTemplate(id, updates) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index === -1) return null;
        
        this.templates[index] = { ...this.templates[index], ...updates };
        this.saveTemplates(this.templates);
        return this.templates[index];
    }

    deleteTemplate(id) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index === -1) return false;
        
        this.templates.splice(index, 1);
        this.saveTemplates(this.templates);
        return true;
    }

    incrementUsage(id) {
        const template = this.getTemplateById(id);
        if (!template) return false;
        
        template.usageCount = (template.usageCount || 0) + 1;
        this.saveTemplates(this.templates);
        return true;
    }

    getCategories() {
        return Object.keys(this.categories).map(key => ({
            id: key,
            ...this.categories[key]
        }));
    }

    renderCategoryButtons(container, onClick) {
        if (!container) return;
        
        container.innerHTML = '';
        
        // "All" button
        const allBtn = document.createElement('button');
        allBtn.className = `template-category-btn ${this.selectedCategory === 'all' ? 'active' : ''}`;
        allBtn.dataset.category = 'all';
        allBtn.innerHTML = `
            <i class="fas fa-th"></i>
            <span>All</span>
        `;
        allBtn.addEventListener('click', () => {
            this.selectedCategory = 'all';
            onClick('all');
            this.updateCategoryButtons(container);
        });
        container.appendChild(allBtn);
        
        // Category buttons
        this.getCategories().forEach(category => {
            const btn = document.createElement('button');
            btn.className = `template-category-btn ${this.selectedCategory === category.id ? 'active' : ''}`;
            btn.dataset.category = category.id;
            btn.innerHTML = `
                <i class="fas ${category.icon}"></i>
                <span>${category.name}</span>
            `;
            btn.style.color = category.color;
            btn.addEventListener('click', () => {
                this.selectedCategory = category.id;
                onClick(category.id);
                this.updateCategoryButtons(container);
            });
            container.appendChild(btn);
        });
    }

    updateCategoryButtons(container) {
        const buttons = container.querySelectorAll('.template-category-btn');
        buttons.forEach(btn => {
            const category = btn.dataset.category;
            btn.classList.toggle('active', category === this.selectedCategory);
        });
    }

    renderTemplatesGrid(container, onSelect) {
        if (!container) return;
        
        const templates = this.getTemplates();
        
        if (templates.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <p>No templates found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        templates.forEach(template => {
            const templateEl = document.createElement('div');
            templateEl.className = 'template-item';
            templateEl.dataset.id = template.id;
            
            const category = this.categories[template.category];
            
            templateEl.innerHTML = `
                <div class="template-icon" style="background: ${category?.color || '#6b7280'}">
                    <i class="fas ${category?.icon || 'fa-file-alt'}"></i>
                </div>
                <div class="template-content">
                    <div class="template-header">
                        <h4 class="template-title">${this.escapeHtml(template.name)}</h4>
                        <span class="template-category" style="color: ${category?.color || '#6b7280'}">
                            ${category?.name || 'Other'}
                        </span>
                    </div>
                    <p class="template-description">${this.escapeHtml(template.description)}</p>
                    <div class="template-footer">
                        <span class="template-usage">
                            <i class="fas fa-chart-line"></i>
                            Used ${template.usageCount || 0} times
                        </span>
                        <button class="template-use-btn">
                            <i class="fas fa-plus"></i>
                            Use
                        </button>
                    </div>
                </div>
            `;
            
            const useBtn = templateEl.querySelector('.template-use-btn');
            useBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.incrementUsage(template.id);
                onSelect(template);
            });
            
            templateEl.addEventListener('click', () => {
                this.incrementUsage(template.id);
                onSelect(template);
            });
            
            container.appendChild(templateEl);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateManager;
} else {
    window.TemplateManager = TemplateManager;
}
