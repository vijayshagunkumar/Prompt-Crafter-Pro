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
  
  setupExpand
