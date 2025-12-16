import { appState } from '../core/app-state.js';
import { TEMPLATE_CATEGORIES } from '../core/constants.js';
import { truncateText } from '../core/utilities.js';
import { notifications } from '../ui/notifications.js';

export class TemplateManager {
  constructor() {
    this.templates = appState.templates;
    this.editingTemplateId = null;
  }
  
  getAll() {
    return [...this.templates];
  }
  
  getById(id) {
    return this.templates.find(template => template.id === id);
  }
  
  getByCategory(category) {
    if (category === 'all') return this.templates;
    return this.templates.filter(template => template.category === category);
  }
  
  search(query) {
    const q = query.toLowerCase();
    return this.templates.filter(template =>
      template.name.toLowerCase().includes(q) ||
      (template.description || '').toLowerCase().includes(q) ||
      (template.example || '').toLowerCase().includes(q)
    );
  }
  
  add(template) {
    const newTemplate = {
      id: Date.now().toString(),
      usageCount: 0,
      createdAt: Date.now(),
      isDefault: false,
      ...template
    };
    
    this.templates.push(newTemplate);
    appState.templates = this.templates;
    appState.saveTemplates();
    
    return newTemplate;
  }
  
  update(id, updates) {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    this.templates[index] = { ...this.templates[index], ...updates };
    appState.templates = this.templates;
    appState.saveTemplates();
    
    return this.templates[index];
  }
  
  delete(id) {
    const template = this.getById(id);
    if (template?.isDefault) {
      notifications.error('Cannot delete default template');
      return false;
    }
    
    this.templates = this.templates.filter(t => t.id !== id);
    appState.templates = this.templates;
    appState.saveTemplates();
    
    return true;
  }
  
  incrementUsage(id) {
    const template = this.getById(id);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      appState.saveTemplates();
    }
  }
  
  useTemplate(id) {
    const template = this.getById(id);
    if (!template) return false;
    
    // Update usage count
    this.incrementUsage(id);
    
    // Load into UI
    document.getElementById('requirement').value = template.example || '';
    document.getElementById('output').value = template.content;
    
    // Update stats
    this.updateStats(template.content);
    
    // Update UI state
    document.getElementById('convertedBadge').style.display = 'inline-flex';
    
    notifications.success(`Template "${template.name}" loaded`);
    
    return true;
  }
  
  updateStats(content) {
    import('../core/utilities.js').then(module => {
      module.updateStats(content, 'outputCharCount', 'outputWordCount', 'outputLineCount');
    });
  }
  
  renderCategories(elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // Add "All" category
    const allCat = document.createElement('div');
    allCat.className = 'template-category active';
    allCat.dataset.category = 'all';
    allCat.innerHTML = '<i class="fas fa-th"></i> All';
    allCat.addEventListener('click', () => this.filterTemplates('all'));
    container.appendChild(allCat);
    
    // Add other categories
    Object.entries(TEMPLATE_CATEGORIES).forEach(([key, value]) => {
      const div = document.createElement('div');
      div.className = 'template-category';
      div.dataset.category = key;
      div.innerHTML = `<i class="fas ${value.icon}"></i> ${value.name}`;
      div.addEventListener('click', () => this.filterTemplates(key));
      container.appendChild(div);
    });
  }
  
  renderTemplates(elementId, category = 'all', searchQuery = '') {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    let filtered = this.templates;
    
    if (category !== 'all') {
      filtered = filtered.filter(t => t.category === category);
    }
    
    if (searchQuery) {
      filtered = this.search(searchQuery);
    }
    
    if (!filtered.length) {
      const empty = document.getElementById('emptyTemplates');
      if (empty) empty.style.display = 'block';
      container.innerHTML = '';
      return;
    }
    
    const empty = document.getElementById('emptyTemplates');
    if (empty) empty.style.display = 'none';
    
    container.innerHTML = filtered.map(template => {
      const categoryMeta = TEMPLATE_CATEGORIES[template.category] || TEMPLATE_CATEGORIES.other;
      
      return `
        <div class="template-card">
          <div class="template-card-header">
            <div class="template-card-title">${template.name}</div>
            <span class="template-card-meta" style="color:${categoryMeta.color}">
              <i class="fas ${categoryMeta.icon}"></i> ${categoryMeta.name}
            </span>
          </div>
          <div class="template-card-meta">
            Used ${template.usageCount || 0} times
          </div>
          <div class="template-card-description">
            ${truncateText(template.description || '', 120)}
          </div>
          <div class="template-actions">
            <button class="btn-ghost-small use-template-btn" data-id="${template.id}" 
              style="border-color:${categoryMeta.color};color:${categoryMeta.color}">
              <i class="fas fa-play"></i> Use
            </button>
            <button class="btn-ghost-small edit-template-btn" data-id="${template.id}">
              <i class="fas fa-edit"></i>
            </button>
            ${!template.isDefault ? `
              <button class="btn-ghost-small danger delete-template-btn" data-id="${template.id}">
                <i class="fas fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    // Add event listeners
    container.querySelectorAll('.use-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.useTemplate(id);
      });
    });
    
    container.querySelectorAll('.edit-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.editTemplate(id);
      });
    });
    
    container.querySelectorAll('.delete-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Delete this template?')) {
          this.delete(id);
          this.renderTemplates(elementId, category, searchQuery);
        }
      });
    });
  }
  
  filterTemplates(category) {
    const searchQuery = document.getElementById('templateSearch')?.value || '';
    this.renderTemplates('templatesGrid', category, searchQuery);
    
    // Update active category
    document.querySelectorAll('.template-category').forEach(cat => {
      cat.classList.remove('active');
    });
    
    const activeCat = document.querySelector(`.template-category[data-category="${category}"]`);
    if (activeCat) activeCat.classList.add('active');
  }
  
  editTemplate(id) {
    const template = this.getById(id);
    if (!template) return;
    
    this.editingTemplateId = id;
    
    // Fill modal form
    document.getElementById('templateName').value = template.name;
    document.getElementById('templateDescription').value = template.description || '';
    document.getElementById('templateContent').value = template.content || '';
    document.getElementById('templateCategory').value = template.category || 'other';
    document.getElementById('templateExample').value = template.example || '';
    
    // Show modal
    document.getElementById('templateModal').style.display = 'flex';
  }
  
  saveTemplate() {
    const name = document.getElementById('templateName').value.trim();
    const description = document.getElementById('templateDescription').value.trim();
    const content = document.getElementById('templateContent').value.trim();
    const category = document.getElementById('templateCategory').value;
    const example = document.getElementById('templateExample').value.trim();

    if (!name || !content) {
      notifications.error('Name and content are required');
      return;
    }

    const templateData = { name, description, content, category, example };

    if (this.editingTemplateId) {
      this.update(this.editingTemplateId, templateData);
      notifications.success(`Template "${name}" updated`);
    } else {
      this.add(templateData);
      notifications.success(`Template "${name}" created`);
    }

    // Update UI
    this.renderTemplates('templatesGrid');
    
    // Close modal
    document.getElementById('templateModal').style.display = 'none';
    this.editingTemplateId = null;
  }
}

// Singleton instance
export const templateManager = new TemplateManager();
