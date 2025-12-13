// modal-manager.js - Modal Management System

import { ANIMATION_DURATIONS, Z_INDEX } from '../core/constants.js';
import { showError } from './notifications.js';

/**
 * Modal Manager
 */
class ModalManager {
  constructor() {
    this.activeModal = null;
    this.modalStack = [];
    this.backdrop = null;
    this.init();
  }

  /**
   * Initialize modal system
   */
  init() {
    this.createBackdrop();
    this.setupEscapeHandler();
  }

  /**
   * Create modal backdrop
   */
  createBackdrop() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';
    this.backdrop.setAttribute('aria-hidden', 'true');
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.closeCurrentModal();
      }
    });
    document.body.appendChild(this.backdrop);
  }

  /**
   * Setup escape key handler
   */
  setupEscapeHandler() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.closeCurrentModal();
      }
    });
  }

  /**
   * Open modal by ID
   * @param {string} modalId - Modal element ID
   * @param {Object} options - Modal options
   * @returns {boolean} Success status
   */
  open(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      showError(`Modal "${modalId}" not found`);
      return false;
    }

    // Prevent opening same modal twice
    if (this.activeModal === modal) {
      return false;
    }

    // Close current modal if exists
    if (this.activeModal) {
      this.closeCurrentModal();
    }

    // Add to stack
    this.modalStack.push(modal);
    this.activeModal = modal;

    // Set options
    const { onOpen, onClose, closeOnBackdropClick = true } = options;
    
    // Store callbacks
    modal._modalOptions = { onOpen, onClose, closeOnBackdropClick };

    // Show modal and backdrop
    modal.style.display = 'block';
    modal.style.zIndex = Z_INDEX.MODAL + this.modalStack.length;
    this.backdrop.style.display = 'block';
    this.backdrop.style.zIndex = Z_INDEX.MODAL_BACKDROP + this.modalStack.length - 1;

    // Add animation class
    setTimeout(() => {
      modal.classList.add('show');
      this.backdrop.classList.add('show');
    }, 10);

    // Focus first focusable element
    this.focusFirstInput(modal);

    // Call onOpen callback
    if (onOpen && typeof onOpen === 'function') {
      onOpen(modal);
    }

    // Dispatch event
    modal.dispatchEvent(new CustomEvent('modal:open', { detail: { modalId } }));

    return true;
  }

  /**
   * Close current modal
   * @returns {boolean} Success status
   */
  closeCurrentModal() {
    if (!this.activeModal) return false;

    const modal = this.activeModal;
    const modalId = modal.id;
    const options = modal._modalOptions || {};

    // Remove from stack
    this.modalStack.pop();
    this.activeModal = this.modalStack[this.modalStack.length - 1] || null;

    // Hide modal with animation
    modal.classList.remove('show');
    this.backdrop.classList.remove('show');

    // Remove from DOM after animation
    setTimeout(() => {
      modal.style.display = 'none';
      
      // Hide backdrop if no more modals
      if (!this.activeModal) {
        this.backdrop.style.display = 'none';
      } else {
        // Update z-index for remaining modal
        this.activeModal.style.zIndex = Z_INDEX.MODAL + this.modalStack.length;
        this.backdrop.style.zIndex = Z_INDEX.MODAL_BACKDROP + this.modalStack.length - 1;
      }
    }, ANIMATION_DURATIONS.BASE);

    // Call onClose callback
    if (options.onClose && typeof options.onClose === 'function') {
      options.onClose(modal);
    }

    // Dispatch event
    modal.dispatchEvent(new CustomEvent('modal:close', { detail: { modalId } }));

    // Restore focus to previous element
    this.restoreFocus();

    return true;
  }

  /**
   * Close specific modal by ID
   * @param {string} modalId - Modal ID to close
   * @returns {boolean} Success status
   */
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal || !this.modalStack.includes(modal)) {
      return false;
    }

    // If it's the active modal, use closeCurrentModal
    if (modal === this.activeModal) {
      return this.closeCurrentModal();
    }

    // Remove from stack
    const index = this.modalStack.indexOf(modal);
    if (index > -1) {
      this.modalStack.splice(index, 1);
    }

    // Hide modal
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, ANIMATION_DURATIONS.BASE);

    return true;
  }

  /**
   * Close all modals
   */
  closeAll() {
    while (this.activeModal) {
      this.closeCurrentModal();
    }
  }

  /**
   * Focus first input in modal
   * @param {HTMLElement} modal - Modal element
   */
  focusFirstInput(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      modal.focus();
    }
  }

  /**
   * Restore focus to previous element
   */
  restoreFocus() {
    // This would ideally track the element that had focus before modal opened
    // For simplicity, we'll focus on the body
    document.body.focus();
  }

  /**
   * Get active modal
   * @returns {HTMLElement|null} Active modal
   */
  getActiveModal() {
    return this.activeModal;
  }

  /**
   * Check if modal is open
   * @param {string} modalId - Modal ID
   * @returns {boolean} True if open
   */
  isOpen(modalId) {
    return this.modalStack.some(modal => modal.id === modalId);
  }

  /**
   * Get open modal count
   * @returns {number} Number of open modals
   */
  getOpenCount() {
    return this.modalStack.length;
  }

  /**
   * Update modal options
   * @param {string} modalId - Modal ID
   * @param {Object} options - New options
   */
  updateOptions(modalId, options) {
    const modal = document.getElementById(modalId);
    if (modal && modal._modalOptions) {
      modal._modalOptions = { ...modal._modalOptions, ...options };
    }
  }

  /**
   * Create and open a dynamic modal
   * @param {Object} config - Modal configuration
   * @returns {HTMLElement} Created modal element
   */
  createDynamicModal(config) {
    const {
      title,
      content,
      size = 'md',
      showCloseButton = true,
      showFooter = true,
      buttons = [],
      onOpen,
      onClose
    } = config;

    // Generate unique ID
    const modalId = `dynamic-modal-${Date.now()}`;

    // Create modal element
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = `modal modal-${size}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `${modalId}-title`);

    // Build modal HTML
    let footerHTML = '';
    if (showFooter && buttons.length > 0) {
      footerHTML = `
        <div class="modal-footer">
          ${buttons.map(btn => `
            <button type="button" class="btn btn-${btn.variant || 'primary'}" data-action="${btn.action || 'close'}">
              ${btn.text}
            </button>
          `).join('')}
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="modal-header">
        <h3 id="${modalId}-title">${title}</h3>
        ${showCloseButton ? `
          <button type="button" class="modal-close" aria-label="Close">
            <i class="fas fa-times"></i>
          </button>
        ` : ''}
      </div>
      <div class="modal-body">
        ${content}
      </div>
      ${footerHTML}
    `;

    // Add to DOM
    document.body.appendChild(modal);

    // Setup event listeners
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close(modalId));
    }

    // Setup button actions
    modal.querySelectorAll('[data-action="close"]').forEach(btn => {
      btn.addEventListener('click', () => this.close(modalId));
    });

    // Open the modal
    this.open(modalId, { onOpen, onClose });

    return modal;
  }

  /**
   * Destroy modal manager
   */
  destroy() {
    this.closeAll();
    if (this.backdrop && this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop);
    }
    this.modalStack = [];
    this.activeModal = null;
  }
}

// Create singleton instance
const modalManager = new ModalManager();

// Export functions
export function openModal(modalId, options = {}) {
  return modalManager.open(modalId, options);
}

export function closeModal(modalId) {
  return modalManager.close(modalId);
}

export function closeCurrentModal() {
  return modalManager.closeCurrentModal();
}

export function closeAllModals() {
  return modalManager.closeAll();
}

export function getActiveModal() {
  return modalManager.getActiveModal();
}

export function isModalOpen(modalId) {
  return modalManager.isOpen(modalId);
}

export function createDynamicModal(config) {
  return modalManager.createDynamicModal(config);
}

export default modalManager;
