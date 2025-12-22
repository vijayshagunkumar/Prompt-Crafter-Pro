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

  /* ===============================
     TEXTAREA RESIZE — FIXED
     =============================== */
  setupTextareaResizing() {
    const requirementEl = document.getElementById('requirement');
    const outputEl = document.getElementById('output');

    if (!requirementEl || !outputEl) return;

    // Restore saved sizes
    if (appState.textareaSizes.requirement.height) {
      requirementEl.style.height =
        appState.textareaSizes.requirement.height + 'px';
    }

    if (appState.textareaSizes.output.height) {
      outputEl.style.height =
        appState.textareaSizes.output.height + 'px';
    }

    const saveSizes = debounce(() => {
      appState.textareaSizes.requirement.height =
        requirementEl.offsetHeight;
      appState.textareaSizes.output.height =
        outputEl.offsetHeight;
      appState.saveSizes();
    }, 300);

    // Save ONLY after drag finishes
    requirementEl.addEventListener('mouseup', saveSizes);
    outputEl.addEventListener('mouseup', saveSizes);
  }

  /* ===============================
     EXPAND / COLLAPSE
     =============================== */
  setupExpandButtons() {
    const expandInputBtn = document.getElementById('expandInputBtn');
    const expandOutputBtn = document.getElementById('expandOutputBtn');

    if (!expandInputBtn || !expandOutputBtn) return;

    expandInputBtn.addEventListener('click', () =>
      this.toggleExpand('input')
    );
    expandOutputBtn.addEventListener('click', () =>
      this.toggleExpand('output')
    );
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
      this.isInputExpanded
        ? this.collapse('input')
        : this.expand('input');
    } else {
      this.isOutputExpanded
        ? this.collapse('output')
        : this.expand('output');
    }
  }

  expand(type) {
    const textarea =
      document.getElementById(type === 'input' ? 'requirement' : 'output');
    const overlay = document.getElementById('expandOverlay');

    if (!textarea || !overlay) return;

    textarea.classList.add('textarea-expanded');
    overlay.style.display = 'block';

    if (type === 'input') this.isInputExpanded = true;
    else this.isOutputExpanded = true;
  }

  collapse(type) {
    const textarea =
      document.getElementById(type === 'input' ? 'requirement' : 'output');
    const overlay = document.getElementById('expandOverlay');

    if (!textarea) return;

    textarea.classList.remove('textarea-expanded');

    if (type === 'input') this.isInputExpanded = false;
    else this.isOutputExpanded = false;

    if (!this.isInputExpanded && !this.isOutputExpanded) {
      overlay.style.display = 'none';
    }
  }
}

export const cardExpander = new CardExpander();
