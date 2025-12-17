import { appState } from '../core/app-state.js';
import { notifications } from '../ui/notifications.js';
import { historyManager } from './history.js';

export class TemplateManager {
  constructor() {
    this.templates = appState.templates || [];
    this.setup();
  }
  
  setup() {
    // Save template button in Card 1
    const saveBtn = document.getElementById('saveTemplateBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.openSaveModal());
    }
    
    // Save template button in modal
    const saveModalBtn = document.getElementById('saveTemplateBtnModal');
    if (saveModalBtn) {
      saveModalBtn.addEventListener('click', () => this.saveTemplate());
    }
    
    // Template search
    const searchInput = document.getElementById('templateSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.searchTemplates(e.target.value));
    }
    
    // Close template modal
    const closeTemplateBtn = document.getElementById('closeTemplateBtn');
    if (closeTemplateBtn) {
      closeTemplateBtn.addEventListener('click', () => {
        document.getElementById('templateModal').style.display = 'none';
      });
    }
    
    // Toggle templates panel
    const toggleBtn = document.getElementById('toggleTemplatesBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleTemplatesPanel());
    }
    
    // Load templates initially
    this.renderTemplates();
    this.setupCategoryFilters();
  }
  
  openSaveModal() {
    const requirement = document.getElementById('requirement').value.trim();
    const output = document.getElementById('output').value.trim();
    
    if (!output) {
      notifications.error('Please generate a prompt first');
      return;
    }
    
    // Auto-generate name from requirement
    const defaultName = requirement 
      ? `Template: ${requirement.substring(0, 40)}${requirement.length > 40 ? '...' : ''}`
      : 'My Template';
    
    document.getElementById('templateName').value = defaultName;
    document.getElementById('templateModal').style.display = 'flex';
  }
  
  saveTemplate() {
    const name = document.getElementById('templateName').value.trim();
    const category = document.getElementById('templateCategory').value;
    const requirement = document.getElementById('requirement').value.trim();
    const output = document.getElementById('output').value.trim();
    
    if (!name) {
      notifications.error('Please enter a template name');
      return;
    }
    
    if (!output) {
      notifications.error('No prompt content to save');
      return;
    }
    
    const newTemplate = {
      id: Date.now().toString(),
      name,
      category,
      content: output,
      example: requirement,
      usageCount: 0,
      createdAt: Date.now(),
      isDefault: false
    };
    
    // Add to templates
    this.templates.unshift(newTemplate);
    appState.templates = this.templates;
    localStorage.setItem('promptTemplates', JSON.stringify(this.templates));
    
    // Also save to history
    if (historyManager) {
      historyManager.add(requirement, output, `Template: ${name}`);
    }
    
    // Update UI
    this.renderTemplates();
    
    // Close modal and notify
    document.getElementById('templateModal').style.display = 'none';
    notifications.success(`Template "${name}" saved successfully!`);
    
    // Show template library
    const panel = document.getElementById('templatesPanel');
    if (panel) panel.style.display = 'block';
  }
  
  searchTemplates(query) {
    if (!query.trim()) {
      this.renderTemplates();
      return;
    }
    
    const filtered = this.templates.filter(t => 
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      (t.example && t.example.toLowerCase().includes(query.toLowerCase()))
    );
    
    this.renderTemplates(filtered);
  }
  
  filterByCategory(category) {
    if (category === 'all') {
      this.renderTemplates();
      return;
    }
    
    const filtered = this.templates.filter(t => t.category === category);
    this.renderTemplates(filtered);
    
    // Update active category
    document.querySelectorAll('.template-category').forEach(el => {
      el.classList.remove('active');
      if (el.dataset.category === category) {
        el.classList.add('active');
      }
    });
  }
  
  setupCategoryFilters() {
    // This will be called when categories are rendered
    setTimeout(() => {
      document.querySelectorAll('.template-category').forEach(el => {
        el.addEventListener('click', () => {
          this.filterByCategory(el.dataset.category);
        });
      });
    }, 100);
  }
  
  toggleTemplatesPanel() {
    const panel = document.getElementById('templatesPanel');
    if (!panel) return;
    
    if (panel.style.display === 'block') {
      panel.style.display = 'none';
    } else {
      panel.style.display = 'block';
      this.renderTemplates();
    }
  }
  
  renderTemplates(templatesToShow = this.templates) {
    const grid = document.getElementById('templatesGrid');
    const categories = document.getElementById('templateCategories');
    if (!grid) return;
    
    if (templatesToShow.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No templates found. Save your first template!</p>
        </div>
      `;
      return;
    }
    
    // Render templates
    grid.innerHTML = templatesToShow.map(template => `
      <div class="template-card" data-category="${template.category}">
        <div class="template-card-header">
          <div class="template-card-title">${template.name}</div>
          <span class="template-card-meta">${template.category}</span>
        </div>
        ${template.example ? `
          <div class="template-card-description">
            "${template.example.substring(0, 80)}${template.example.length > 80 ? '...' : ''}"
          </div>
        ` : ''}
        <div class="template-card-meta">
          Used ${template.usageCount || 0} times
        </div>
        <div class="template-card-actions">
          <button class="btn-ghost-small" onclick="templateManager.loadTemplate('${template.id}')">
            <i class="fas fa-play"></i> Use
          </button>
          <button class="btn-ghost-small" onclick="templateManager.deleteTemplate('${template.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
    
    // Setup categories
    if (categories && templatesToShow === this.templates) {
      const allCats = ['all', 'writing', 'coding', 'business', 'creative', 'analysis'];
      const catNames = {
        'all': 'All Templates',
        'writing': 'Writing',
        'coding': 'Coding',
        'business': 'Business',
        'creative': 'Creative',
        'analysis': 'Analysis'
      };
      
      categories.innerHTML = allCats.map(cat => `
        <div class="template-category ${cat === 'all' ? 'active' : ''}" 
             data-category="${cat}">
          ${catNames[cat]}
        </div>
      `).join('');
      
      this.setupCategoryFilters();
    }
  }
  
  loadTemplate(templateId) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Load into output
    document.getElementById('output').value = template.content;
    
    // Update counters
    template.usageCount = (template.usageCount || 0) + 1;
    appState.templates = this.templates;
    localStorage.setItem('promptTemplates', JSON.stringify(this.templates));
    
    // Update display
    this.updateCounters();
    
    // Show notification
    notifications.success(`Loaded template: ${template.name}`);
    
    // Enable launch buttons
    document.querySelectorAll('.launch-btn').forEach(btn => {
      btn.disabled = false;
    });
    
    // Show success badge
    const badge = document.getElementById('convertedBadge');
    if (badge) {
      badge.style.display = 'flex';
    }
  }
  
  deleteTemplate(templateId) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    this.templates = this.templates.filter(t => t.id !== templateId);
    appState.templates = this.templates;
    localStorage.setItem('promptTemplates', JSON.stringify(this.templates));
    
    this.renderTemplates();
    notifications.info('Template deleted');
  }
  
  updateCounters() {
    const usageElement = document.getElementById('usageCount');
    if (usageElement) {
      const totalUsage = this.templates.reduce((sum, t) => sum + (t.usageCount || 0), 0);
      usageElement.innerHTML = `<i class="fas fa-bolt"></i> ${totalUsage} prompts`;
    }
  }
  
  loadDefaultTemplates() {
    // Add some default templates if empty
    if (this.templates.length === 0) {
      this.templates = [
        {
          id: '1',
          name: 'Professional Email Draft',
          category: 'writing',
          content: `Compose a professional email with the following structure:

Subject: [Clear and concise subject line]

Greeting: [Appropriate salutation]

Body:
- Introduction with context
- Clear request or information
- Specific details or requirements
- Timeline or deadline (if applicable)
- Call to action

Closing: [Professional sign-off]

Additional instructions:
- Maintain professional tone
- Use clear and concise language
- Include all necessary details
- Ensure proper formatting`,
          example: 'Email to client about project delay',
          usageCount: 5,
          createdAt: Date.now() - 86400000,
          isDefault: true
        },
        {
          id: '2',
          name: 'Python Function Helper',
          category: 'coding',
          content: `Write a Python function that:
1. Has a descriptive name following snake_case
2. Includes type hints for parameters and return value
3. Has a clear docstring with:
   - One-line description
   - Args section
   - Returns section
   - Example usage
4. Includes error handling where appropriate
5. Follows PEP 8 style guidelines

Provide:
- Complete function code
- Test cases
- Explanation of algorithm`,
          example: 'Function to calculate factorial',
          usageCount: 8,
          createdAt: Date.now() - 172800000,
          isDefault: true
        }
      ];
      
      appState.templates = this.templates;
      localStorage.setItem('promptTemplates', JSON.stringify(this.templates));
      this.renderTemplates();
    }
  }
}

export const templateManager = new TemplateManager();
