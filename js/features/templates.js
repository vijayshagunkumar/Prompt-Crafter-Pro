// templates.js - Template Management

import { TEMPLATE_CATEGORIES, DEFAULT_TEMPLATES } from '../core/constants.js';
import appState from '../core/app-state.js';
import { generateId } from '../core/utilities.js';

/**
 * Load templates into app state
 */
export function loadTemplates() {
  if (appState.templates.length === 0) {
    // Load default templates on first run
    appState.templates = [...DEFAULT_TEMPLATES];
    appState.saveTemplates();
  }
}

/**
 * Render templates grid
 * @returns {string} HTML for templates grid
 */
export function renderTemplatesGrid() {
  if (appState.templates.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-layer-group"></i>
        <p>No templates yet. Create your first template!</p>
      </div>
    `;
  }

  return appState.templates.map(template => {
    const category = TEMPLATE_CATEGORIES[template.category] || TEMPLATE_CATEGORIES.other;
    
    return `
      <article class="template-card" data-id="${template.id}">
        <header class="template-card-header">
          <div class="template-badge" style="border-color: ${category.color}; color: ${category.color}">
            <i class="fas ${category.icon}"></i>
            <span>${category.name}</span>
          </div>
          <div class="template-actions">
            <button class="icon-btn template-edit" title="Edit template">
              <i class="fas fa-pen"></i>
            </button>
            <button class="icon-btn template-delete" title="Delete template">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </header>
        <div class="template-card-body">
          <h4>${template.name}</h4>
          <p>${template.description}</p>
        </div>
        <footer class="template-card-footer">
          <button class="ghost-btn template-use">
            <i class="fas fa-bolt"></i>
            Use Template
          </button>
        </footer>
      </article>
    `;
  }).join('');
}

/**
 * Create new template
 * @param {Object} templateData - Template data
 * @returns {Object} Created template
 */
export function createTemplate(templateData) {
  const template = {
    id: generateId(),
    category: templateData.category || 'other',
    ...templateData
  };

  const createdTemplate = appState.addTemplate(template);
  return createdTemplate;
}

/**
 * Update existing template
 * @param {string} id - Template ID
 * @param {Object} updates - Template updates
 * @returns {Object|null} Updated template or null
 */
export function updateTemplate(id, updates) {
  return appState.updateTemplate(id, updates);
}

/**
 * Delete template
 * @param {string} id - Template ID
 * @returns {boolean} Success status
 */
export function deleteTemplate(id) {
  appState.deleteTemplate(id);
  return true;
}

/**
 * Get template by ID
 * @param {string} id - Template ID
 * @returns {Object|null} Template or null
 */
export function getTemplate(id) {
  return appState.getTemplate(id);
}

/**
 * Use template (insert into requirement textarea)
 * @param {string} id - Template ID
 * @param {Function} setRequirement - Function to set requirement text
 */
export function useTemplate(id, setRequirement) {
  const template = getTemplate(id);
  if (template && setRequirement) {
    setRequirement(template.content);
    return true;
  }
  return false;
}

/**
 * Filter templates by category
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered templates
 */
export function filterTemplatesByCategory(category) {
  if (category === 'all') return appState.templates;
  return appState.templates.filter(t => t.category === category);
}

/**
 * Search templates by keyword
 * @param {string} keyword - Search keyword
 * @returns {Array} Filtered templates
 */
export function searchTemplates(keyword) {
  const searchTerm = keyword.toLowerCase();
  return appState.templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.content.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get template categories with counts
 * @returns {Object} Categories with template counts
 */
export function getTemplateCategoriesWithCounts() {
  const categories = {};
  
  Object.keys(TEMPLATE_CATEGORIES).forEach(category => {
    categories[category] = {
      ...TEMPLATE_CATEGORIES[category],
      count: appState.templates.filter(t => t.category === category).length
    };
  });
  
  // Add "All" category
  categories.all = {
    name: "All Templates",
    icon: "fa-layer-group",
    color: "#FF5E00",
    count: appState.templates.length
  };
  
  return categories;
}
