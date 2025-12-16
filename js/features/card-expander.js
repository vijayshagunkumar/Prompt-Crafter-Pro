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
    
    // Apply saved sizes
    if (appState.textareaSizes.requirement.height) {
      requirementEl.style.height = `${appState.textareaSizes.requirement.height}px`;
      this.updateSizeInfo('inputSizeInfo', appState.textareaSizes.requirement.height);
    }
    
    if (appState.textareaSizes.output.height) {
      outputEl.style.height = `${appState.textareaSizes.output.height}px`;
      this.updateSizeInfo('outputSizeInfo', appState.textareaSizes.output.height);
    }
    
    // Setup resize observers
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        const textareaId = entry.target.id;
        
        if (textareaId === 'requirement') {
          appState.textareaSizes.requirement.height = height;
          this.updateSizeInfo('inputSizeInfo', height);
        } else if (textareaId === 'output') {
          appState.textareaSizes.output.height = height;
          this.updateSizeInfo('outputSizeInfo', height);
        }
        
        // Visual feedback
        entry.target.classList.add('size-changing');
        setTimeout(() => {
          entry.target.classList.remove('size-changing');
        }, 300);
        
        // Save with debounce
        debounce(() => appState.saveSizes(), 500)();
      }
    });
    
    resizeObserver.observe(requirementEl);
    resizeObserver.observe(outputEl);
    
    // Manual drag events
    requirementEl.addEventListener('mouseup', () => debounce(() => appState.saveSizes(), 300)());
    outputEl.addEventListener('mouseup', () => debounce(() => appState.saveSizes(), 300)());
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
    
    // Escape key to collapse
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        overlay.click();
      }
    });
  }
  
  toggleExpand(type) {
    if (type === 'input') {
      if (this.isInputExpanded) {
        this.collapse('input');
      } else {
        this.expand('input');
      }
    } else if (type === 'output') {
      if (this.isOutputExpanded) {
        this.collapse('output');
      } else {
        this.expand('output');
      }
    }
  }
  
  expand(type) {
    const textarea = document.getElementById(type === 'input' ? 'requirement' : 'output');
    const button = document.getElementById(type === 'input' ? 'expandInputBtn' : 'expandOutputBtn');
    const overlay = document.getElementById('expandOverlay');
    
    if (!textarea || !button || !overlay) return;
    
    // Save current height before expanding
    const currentHeight = textarea.offsetHeight;
    if (type === 'input' && currentHeight > 140) {
      appState.textareaSizes.requirement.height = currentHeight;
    } else if (type === 'output' && currentHeight > 200) {
      appState.textareaSizes.output.height = currentHeight;
    }
    
    // Expand
    textarea.classList.add('textarea-expanded');
    button.classList.add('expanded');
    button.innerHTML = '<i class="fas fa-compress-alt"></i>';
    button.title = 'Collapse';
    overlay.style.display = 'block';
    
    if (type === 'input') {
      this.isInputExpanded = true;
      textarea.focus();
      // Scroll to cursor position
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
    
    // Collapse
    textarea.classList.remove('textarea-expanded');
    button.classList.remove('expanded');
    button.innerHTML = '<i class="fas fa-expand-alt"></i>';
    button.title = 'Expand';
    
    if (type === 'input') {
      this.isInputExpanded = false;
      // Restore saved height
      if (appState.textareaSizes.requirement.height) {
        textarea.style.height = `${appState.textareaSizes.requirement.height}px`;
      }
    } else {
      this.isOutputExpanded = false;
      // Restore saved height
      if (appState.textareaSizes.output.height) {
        textarea.style.height = `${appState.textareaSizes.output.height}px`;
      }
    }
    
    // Hide overlay if nothing is expanded
    if (!this.isInputExpanded && !this.isOutputExpanded) {
      overlay.style.display = 'none';
    }
  }
  
  updateSizeInfo(elementId, height) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = `${Math.round(height)}px`;
    }
  }
  
  resetSizes() {
    appState.resetTextareaSizes();
    
    const requirementEl = document.getElementById('requirement');
    const outputEl = document.getElementById('output');
    
    if (requirementEl) {
      requirementEl.style.height = '140px';
      this.updateSizeInfo('inputSizeInfo', 140);
    }
    
    if (outputEl) {
      outputEl.style.height = '200px';
      this.updateSizeInfo('outputSizeInfo', 200);
    }
    
    import('../ui/notifications.js').then(module => {
      module.notifications.success('Textarea sizes reset to default');
    });
  }
}

// Singleton instance
export const cardExpander = new CardExpander();
