// templates.js - Template Management - FIXED VERSION with UI

import { TEMPLATE_CATEGORIES, DEFAULT_TEMPLATES } from '../core/constants.js';
import appState from '../core/app-state.js';
import { generateId, formatDate } from '../core/utilities.js';

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
 * Render templates grid with enhanced UI
 * @returns {string} HTML for templates grid
 */
export function renderTemplatesGrid() {
  if (appState.templates.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-layer-group"></i>
        <h4>No templates yet</h4>
        <p>Create your first template to save time on repetitive prompts</p>
        <button class="btn btn-primary" id="create-first-template">
          <i class="fas fa-plus"></i> Create Template
        </button>
      </div>
    `;
  }

  return `
    <div class="templates-header">
      <div class="templates-stats">
        <span class="badge">${appState.templates.length} templates</span>
      </div>
      <button class="btn btn-primary" id="create-template-btn">
        <i class="fas fa-plus"></i> New Template
      </button>
    </div>
    <div class="templates-grid">
      ${appState.templates.map(template => {
        const category = TEMPLATE_CATEGORIES[template.category] || TEMPLATE_CATEGORIES.other;
        const date = formatDate(template.createdAt || template.id, 'short');
        
        return `
          <article class="template-card" data-id="${template.id}">
            <header class="template-card-header">
              <div class="template-badge" style="border-color: ${category.color}; color: ${category.color}">
                <i class="fas ${category.icon}"></i>
                <span>${category.name}</span>
              </div>
              <div class="template-actions">
                <button class="icon-btn template-use-btn" title="Use this template">
                  <i class="fas fa-bolt"></i>
                </button>
                <button class="icon-btn template-edit-btn" title="Edit template">
                  <i class="fas fa-pen"></i>
                </button>
                <button class="icon-btn template-delete-btn" title="Delete template">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </header>
            <div class="template-card-body">
              <h4>${template.name}</h4>
              <p>${template.description}</p>
            </div>
            <footer class="template-card-footer">
              <div class="template-meta">
                <span class="template-date">
                  <i class="fas fa-calendar"></i> ${date}
                </span>
                <span class="template-stats">
                  <i class="fas fa-chart-bar"></i> ${template.usageCount || 0} uses
                </span>
              </div>
            </footer>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Create new template
 * @param {Object} templateData - Template data
 * @returns {Object} Created template
 */
export function createTemplate(templateData) {
  const template = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    usageCount: 0,
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
    // Increment usage count
    updateTemplate(id, { 
      usageCount: (template.usageCount || 0) + 1,
      lastUsedAt: new Date().toISOString()
    });
    
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
    template.content.toLowerCase().includes(searchTerm) ||
    template.category.toLowerCase().includes(searchTerm)
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

/**
 * Export templates to JSON file
 */
export function exportTemplates() {
  const templateData = {
    exportedAt: new Date().toISOString(),
    count: appState.templates.length,
    templates: appState.templates
  };

  const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `promptcraft-templates-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Import templates from JSON file
 * @param {File} file - JSON file
 * @returns {Promise<Object>} Import result
 */
export async function importTemplates(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (data.templates && Array.isArray(data.templates)) {
          // Merge imported templates
          const newTemplates = data.templates.map(template => ({
            ...template,
            id: generateId(), // Generate new IDs to avoid conflicts
            createdAt: template.createdAt || new Date().toISOString()
          }));
          
          appState.templates = [...newTemplates, ...appState.templates];
          appState.saveTemplates();
          
          resolve({
            success: true,
            count: data.templates.length,
            message: `Successfully imported ${data.templates.length} templates`
          });
        } else {
          reject(new Error('Invalid template file format'));
        }
      } catch (error) {
        reject(new Error('Failed to parse template file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Create template modal HTML
 * @returns {string} Modal HTML
 */
export function createTemplateModalHTML() {
  const categories = getTemplateCategoriesWithCounts();
  
  return `
    <div class="modal-backdrop" id="templates-modal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3><i class="fas fa-layer-group"></i> Template Library</h3>
          <button class="modal-close" id="close-templates-modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="templates-container">
            <!-- Templates will be rendered here by renderTemplatesGrid() -->
          </div>
        </div>
        <div class="modal-footer">
          <div class="modal-footer-actions">
            <button class="btn btn-ghost" id="export-templates-btn">
              <i class="fas fa-download"></i> Export All
            </button>
            <label class="btn btn-secondary" for="import-templates-file">
              <i class="fas fa-upload"></i> Import
              <input type="file" id="import-templates-file" accept=".json" hidden>
            </label>
            <button class="btn btn-primary" id="create-template-modal-btn">
              <i class="fas fa-plus"></i> Create Template
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create template editor modal HTML
 * @param {Object} template - Template data (optional, for editing)
 * @returns {string} Editor modal HTML
 */
export function createTemplateEditorHTML(template = null) {
  const isEdit = !!template;
  const categories = getTemplateCategoriesWithCounts();
  
  return `
    <div class="modal-backdrop" id="template-editor-modal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>
            <i class="fas ${isEdit ? 'fa-pen' : 'fa-plus'}"></i>
            ${isEdit ? 'Edit Template' : 'Create Template'}
          </h3>
          <button class="modal-close" id="close-template-editor">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="template-form">
            <div class="form-group">
              <label class="field-label" for="template-name">Template Name</label>
              <input type="text" 
                     id="template-name" 
                     class="input-text" 
                     placeholder="e.g., Professional Email Template"
                     value="${template?.name || ''}"
                     required>
            </div>
            
            <div class="form-group">
              <label class="field-label" for="template-description">Description</label>
              <textarea id="template-description" 
                        class="input-text" 
                        rows="2"
                        placeholder="Describe what this template is for..."
                        required>${template?.description || ''}</textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="field-label" for="template-category">Category</label>
                <select id="template-category" class="input-text" required>
                  ${Object.keys(categories).map(key => `
                    <option value="${key}" 
                            ${template?.category === key ? 'selected' : ''}
                            style="color: ${categories[key].color}">
                      ${categories[key].name} (${categories[key].count})
                    </option>
                  `).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label class="field-label" for="template-tags">Tags</label>
                <input type="text" 
                       id="template-tags" 
                       class="input-text" 
                       placeholder="email, professional, communication"
                       value="${template?.tags?.join(', ') || ''}">
              </div>
            </div>
            
            <div class="form-group">
              <label class="field-label" for="template-content">
                Template Content
                <span class="form-hint">
                  <i class="fas fa-info-circle"></i>
                  This will be inserted into the requirement textarea
                </span>
              </label>
              <textarea id="template-content" 
                        class="textarea-idea" 
                        rows="8"
                        placeholder="Enter your template content here..."
                        required>${template?.content || ''}</textarea>
              <div class="helper-row">
                <span class="helper-text">
                  <i class="fas fa-lightbulb"></i>
                  Use variables like [TOPIC], [RECIPIENT], etc.
                </span>
                <span class="char-counter">
                  <span id="template-char-count">0</span> chars
                </span>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="cancel-template-editor">
            Cancel
          </button>
          <button type="submit" 
                  form="template-form" 
                  class="btn btn-primary" 
                  id="save-template-btn">
            <i class="fas fa-save"></i>
            ${isEdit ? 'Update Template' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Setup template event handlers
 * @param {Function} showNotification - Notification function
 * @param {Function} setRequirement - Function to set requirement text
 */
export function setupTemplateEventHandlers(showNotification, setRequirement) {
  // Open templates modal
  document.addEventListener('click', (e) => {
    // Handle Save as Template button in Card 2
    if (e.target.closest('#save-as-template-btn') || 
        e.target.closest('.save-template-btn')) {
      e.preventDefault();
      e.stopPropagation();
      openTemplateEditor();
    }
    
    // Handle View Templates button (you need to add this button to your UI)
    if (e.target.closest('#view-templates-btn')) {
      e.preventDefault();
      e.stopPropagation();
      openTemplatesModal();
    }
    
    // Handle template card actions inside templates modal
    if (e.target.closest('.template-use-btn')) {
      const templateCard = e.target.closest('.template-card');
      const templateId = templateCard?.dataset.id;
      if (templateId) {
        useTemplate(templateId, setRequirement);
        showNotification('Template applied to requirement');
        closeTemplatesModal();
      }
    }
    
    if (e.target.closest('.template-edit-btn')) {
      const templateCard = e.target.closest('.template-card');
      const templateId = templateCard?.dataset.id;
      if (templateId) {
        const template = getTemplate(templateId);
        openTemplateEditor(template);
      }
    }
    
    if (e.target.closest('.template-delete-btn')) {
      const templateCard = e.target.closest('.template-card');
      const templateId = templateCard?.dataset.id;
      if (templateId && confirm('Are you sure you want to delete this template?')) {
        deleteTemplate(templateId);
        showNotification('Template deleted');
        refreshTemplatesModal();
      }
    }
  });
  
  // Handle character count for template editor
  document.addEventListener('input', (e) => {
    if (e.target.id === 'template-content') {
      const charCount = e.target.value.length;
      const counter = document.getElementById('template-char-count');
      if (counter) {
        counter.textContent = charCount;
      }
    }
  });
}

/**
 * Open templates modal
 */
export function openTemplatesModal() {
  // Create and show modal
  const modalHTML = createTemplateModalHTML();
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);
  
  // Render templates inside modal
  const templatesContainer = modalContainer.querySelector('.templates-container');
  if (templatesContainer) {
    templatesContainer.innerHTML = renderTemplatesGrid();
  }
  
  // Show modal
  const modal = modalContainer.querySelector('#templates-modal');
  modal.classList.add('open');
  
  // Setup modal event handlers
  setupTemplatesModalHandlers(modalContainer);
}

/**
 * Open template editor modal
 * @param {Object} template - Template to edit (optional)
 */
export function openTemplateEditor(template = null) {
  const editorHTML = createTemplateEditorHTML(template);
  const editorContainer = document.createElement('div');
  editorContainer.innerHTML = editorHTML;
  document.body.appendChild(editorContainer);
  
  // Show modal
  const modal = editorContainer.querySelector('#template-editor-modal');
  modal.classList.add('open');
  
  // Setup editor event handlers
  setupTemplateEditorHandlers(editorContainer, template);
  
  // Initialize character count
  const contentTextarea = editorContainer.querySelector('#template-content');
  const charCount = contentTextarea?.value.length || 0;
  const counter = editorContainer.querySelector('#template-char-count');
  if (counter && charCount) {
    counter.textContent = charCount;
  }
}

/**
 * Setup templates modal handlers
 * @param {HTMLElement} modalContainer - Modal container element
 */
function setupTemplatesModalHandlers(modalContainer) {
  // Close button
  const closeBtn = modalContainer.querySelector('#close-templates-modal');
  const modal = modalContainer.querySelector('#templates-modal');
  
  closeBtn?.addEventListener('click', () => {
    modal.classList.remove('open');
    setTimeout(() => modalContainer.remove(), 300);
  });
  
  // Close on backdrop click
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
      setTimeout(() => modalContainer.remove(), 300);
    }
  });
  
  // Create template button
  const createBtn = modalContainer.querySelector('#create-template-btn') || 
                   modalContainer.querySelector('#create-template-modal-btn') ||
                   modalContainer.querySelector('#create-first-template');
  
  createBtn?.addEventListener('click', () => {
    modal.classList.remove('open');
    setTimeout(() => {
      modalContainer.remove();
      openTemplateEditor();
    }, 300);
  });
  
  // Export templates button
  const exportBtn = modalContainer.querySelector('#export-templates-btn');
  exportBtn?.addEventListener('click', () => {
    exportTemplates();
  });
  
  // Import templates button
  const importInput = modalContainer.querySelector('#import-templates-file');
  importInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await importTemplates(file);
        refreshTemplatesModal();
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import templates. Please check the file format.');
      }
    }
  });
}

/**
 * Setup template editor handlers
 * @param {HTMLElement} editorContainer - Editor container element
 * @param {Object} template - Template being edited (if any)
 */
function setupTemplateEditorHandlers(editorContainer, template = null) {
  const closeBtn = editorContainer.querySelector('#close-template-editor');
  const cancelBtn = editorContainer.querySelector('#cancel-template-editor');
  const modal = editorContainer.querySelector('#template-editor-modal');
  const form = editorContainer.querySelector('#template-form');
  
  // Close buttons
  const closeModal = () => {
    modal.classList.remove('open');
    setTimeout(() => editorContainer.remove(), 300);
  };
  
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  
  // Close on backdrop click
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Form submission
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const templateData = {
      name: document.getElementById('template-name').value,
      description: document.getElementById('template-description').value,
      category: document.getElementById('template-category').value,
      content: document.getElementById('template-content').value,
      tags: document.getElementById('template-tags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)
    };
    
    if (template) {
      // Update existing template
      updateTemplate(template.id, templateData);
      console.log('Template updated:', template.id);
    } else {
      // Create new template
      createTemplate(templateData);
      console.log('Template created');
    }
    
    closeModal();
    
    // Show notification (you'll need to implement this)
    // showNotification(template ? 'Template updated!' : 'Template created!');
  });
}

/**
 * Refresh templates modal
 */
function refreshTemplatesModal() {
  const modal = document.querySelector('#templates-modal');
  const templatesContainer = modal?.querySelector('.templates-container');
  
  if (templatesContainer) {
    templatesContainer.innerHTML = renderTemplatesGrid();
  }
}

/**
 * Close templates modal
 */
function closeTemplatesModal() {
  const modal = document.querySelector('#templates-modal');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => modal.parentElement?.remove(), 300);
  }
}
