import { appState } from '../core/app-state.js';
import { debounce } from '../core/utilities.js';

export class CardExpander {
  constructor() {
    this.isInputExpanded = false;
    this.isOutputExpanded = false;
    this.setup();
  }
  
  setup() {
    this.setupTextareaResizing();
    this.setupExpandButtons();
    this.setupExpandOverlay();
  }
  
  setupTextareaResizing() {
    const requirementEl = document.getElementById('requirement');
    const outputEl = document.getElementById('output');
    
    if (!requirementEl || !outputEl) return;

    // 🔑 Detect manual resize intent
    [requirementEl, outputEl].forEach(el => {
      el.addEventListener('mousedown', (e) => {
        const rect = el.getBoundingClientRect();
        if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) {
          el.dataset.userResized = 'true';
        }
      });
    });
    
    // Apply saved sizes (ONLY ON LOAD)
    if (appState.textareaSizes.requirement.height) {
      requirementEl.style.height = `${appState.textareaSizes.requirement.height}px`;
      this.updateSizeInfo('inputSizeInfo', appState.textareaSizes.requirement.height);
    }
    
    if (appState.textareaSizes.output.height) {
      outputEl.style.height = `${appState.textareaSizes.output.height}px`;
      this.updateSizeInfo('outputSizeInfo', appState.textareaSizes.output.height);
    }
    
    // Observe resize WITHOUT OVERRIDING USER CONTROL
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const textarea = entry.target;
        const height = entry.contentRect.height;

        // ❌ Do NOT fight user resize
        if (textarea.dataset.userResized === 'true') {
          if (textarea.id === 'requirement') {
            appState.textareaSizes.requirement.height = height;
            this.updateSizeInfo('inputSizeInfo', height);
          } else if (textarea.id === 'output') {
            appState.textareaSizes.output.height = height;
            this.updateSizeInfo('outputSizeInfo', height);
          }
          debounce(() => appState.saveSizes(), 500)();
          return;
        }

        // ✅ Programmatic resize only
        if (textarea.id === 'requirement') {
          appState.textareaSizes.requirement.height = height;
          this.updateSizeInfo('inputSizeInfo', height);
        } else if (textarea.id === 'output') {
          appState.textareaSizes.output.height = height;
          this.updateSizeInfo('outputSizeInfo', height);
        }

        textarea.classList.add('size-changing');
        setTimeout(() => textarea.classList.remove('size-changing'), 300);
        debounce(() => appState.saveSizes(), 500)();
      }
    });
    
    resizeObserver.observe(requirementEl);
    resizeObserver.observe(outputEl);
  }
  
  setupExpandButtons() {
    const expandInputBtn = document.getElementById('expandInputBtn');
    const expandOutputBtn = document.getElementById('expandOutputBtn');
    
    if (!expandInputBtn || !expandOutputBtn) return;
    
    expandInputBtn.addEventListener('click', () => this.toggleExpand('input'));
    expandOutputBtn.addEventListener('click', () => this.toggleExpand('output'));
  }
  
  setupExpandOverlay() {
    const overlay = document.getElementById('expandOverlay');
    if (!overlay) return;
    
    overlay.addEventListener('click', () => {
      if (this.isInputExpanded) this.collapse('input');
      if (this.isOutputExpanded) this.collapse('output');
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') overlay.click();
    });
  }
  
  toggleExpand(type) {
    if (type === 'input') {
      this.isInputExpanded ? this.collapse('input') : this.expand('input');
    } else {
      this.isOutputExpanded ? this.collapse('output') : this.expand('output');
    }
  }
  
  expand(type) {
    const textarea = document.getElementById(type === 'input' ? 'requirement' : 'output');
    const button = document.getElementById(type === 'input' ? 'expandInputBtn' : 'expandOutputBtn');
    const overlay = document.getElementById('expandOverlay');
    
    if (!textarea || !button || !overlay) return;

    textarea.dataset.userResized = 'false';

    textarea.classList.add('textarea-expanded');
    button.classList.add('expanded');
    button.innerHTML = '<i class="fas fa-compress-alt"></i>';
    overlay.style.display = 'block';
    
    if (type === 'input') {
      this.isInputExpanded = true;
      textarea.focus();
      textarea.scrollTop = textarea.scrollHeight;
    } else {
      this.isOutputExpanded = true;
    }
  }
  
  collapse(type) {
    const textarea = document.getElementById(type === 'input' ? 'requirement' : 'output');
    const button = document.getElementById(type === 'input' ? 'expandInputBtn' : 'expandOutputBtn');
    const overlay = document.getElementById('expandOverlay');
    
    if (!textarea || !button) return;

    textarea.classList.remove('textarea-expanded');
    button.classList.remove('expanded');
    button.innerHTML = '<i class="fas fa-expand-alt"></i>';

    if (!this.isInputExpanded && !this.isOutputExpanded) {
      overlay.style.display = 'none';
    }

    textarea.dataset.userResized = 'false';
  }
  
  updateSizeInfo(elementId, height) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = `${Math.round(height)}px`;
  }
}

// Singleton
export const cardExpander = new CardExpander();
