// modal-manager.js - Modal Management

/**
 * Modal Manager Class
 */
class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.init();
  }

  /**
   * Initialize modal manager
   */
  init() {
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
      }
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (this.activeModal && e.target.classList.contains('modal-backdrop')) {
        this.close(this.activeModal);
      }
    });
  }

  /**
   * Register a modal
   * @param {string} id - Modal ID
   * @param {HTMLElement} element - Modal element
   */
  register(id, element) {
    this.modals.set(id, element);
    
    // Setup close button if exists
    const closeBtn = element.querySelector('.modal-close, [data-close-modal]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close(id));
    }
  }

  /**
   * Open a modal
   * @param {string} id - Modal ID
   */
  open(id) {
    const modal = this.modals.get(id);
    if (!modal) {
      console.error(`Modal "${id}" not found`);
      return;
    }

    // Close current modal if open
    if (this.activeModal && this.activeModal !== id) {
      this.close(this.activeModal);
    }

    // Show modal
    modal.style.display = 'block';
    const backdrop = modal.closest('.modal-backdrop');
    if (backdrop) {
      backdrop.style.display = 'flex';
      backdrop.classList.add('open');
    }
    
    modal.classList.add('open');
    this.activeModal = id;

    // Focus first focusable element
    setTimeout(() => {
      const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
    }, 100);
  }

  /**
   * Close a modal
   * @param {string} id - Modal ID
   */
  close(id) {
    const modal = this.modals.get(id);
    if (!modal) return;

    // Hide modal
    modal.style.display = 'none';
    const backdrop = modal.closest('.modal-backdrop');
    if (backdrop) {
      backdrop.style.display = 'none';
      backdrop.classList.remove('open');
    }
    
    modal.classList.remove('open');
    
    if (this.activeModal === id) {
      this.activeModal = null;
    }
  }

  /**
   * Toggle a modal
   * @param {string} id - Modal ID
   */
  toggle(id) {
    const modal = this.modals.get(id);
    if (!modal) return;

    if (modal.classList.contains('open')) {
      this.close(id);
    } else {
      this.open(id);
    }
  }

  /**
   * Check if modal is open
   * @param {string} id - Modal ID
   * @returns {boolean} Open status
   */
  isOpen(id) {
    const modal = this.modals.get(id);
    return modal ? modal.classList.contains('open') : false;
  }

  /**
   * Get active modal ID
   * @returns {string|null} Active modal ID
   */
  getActiveModal() {
    return this.activeModal;
  }

  /**
   * Close all modals
   */
  closeAll() {
    this.modals.forEach((modal, id) => {
      this.close(id);
    });
    this.activeModal = null;
  }

  /**
   * Create a simple alert modal
   * @param {string} title - Modal title
   * @param {string} message - Modal message
   * @param {string} type - Modal type (info, success, error, warning)
   */
  alert(title, message, type = 'info') {
    const modalId = `alert-${Date.now()}`;
    
    const typeConfig = {
      info: { icon: 'fa-info-circle', color: '#00F3FF' },
      success: { icon: 'fa-check-circle', color: '#00FF41' },
      error: { icon: 'fa-exclamation-circle', color: '#FF4444' },
      warning: { icon: 'fa-triangle-exclamation', color: '#FFA726' }
    };
    
    const config = typeConfig[type] || typeConfig.info;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';
    
    const modal = document.createElement('div');
    modal.className = 'modal alert-modal';
    modal.id = modalId;
    
    modal.innerHTML = `
      <div class="modal-header" style="border-color: ${config.color}">
        <h3 style="color: ${config.color}">
          <i class="fas ${config.icon}"></i> ${title}
        </h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p style="color: var(--text-secondary); line-height: 1.5;">${message}</p>
        <div class="modal-actions" style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button class="btn-primary" data-close-modal>OK</button>
        </div>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Register and open
    this.register(modalId, modal);
    this.open(modalId);
    
    // Auto-close after 5 seconds for non-error alerts
    if (type !== 'error') {
      setTimeout(() => {
        if (this.isOpen(modalId)) {
          this.close(modalId);
          document.body.removeChild(overlay);
        }
      }, 5000);
    }
    
    // Remove from DOM when closed
    modal.addEventListener('modal:close', () => {
      setTimeout(() => {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
      }, 300);
    });
  }
}

// Create singleton instance
const modalManager = new ModalManager();

// Export functions
export function registerModal(id, element) {
  modalManager.register(id, element);
}

export function openModal(id) {
  modalManager.open(id);
}

export function closeModal(id) {
  modalManager.close(id);
}

export function toggleModal(id) {
  modalManager.toggle(id);
}

export function isModalOpen(id) {
  return modalManager.isOpen(id);
}

export function closeAllModals() {
  modalManager.closeAll();
}

export function showAlert(title, message, type = 'info') {
  modalManager.alert(title, message, type);
}

// Default export
export default modalManager;
