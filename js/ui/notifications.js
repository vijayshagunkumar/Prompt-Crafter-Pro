// notifications.js - Notification System

/**
 * Notification types and styles
 */
const NOTIFICATION_TYPES = {
  SUCCESS: {
    icon: 'fa-check-circle',
    color: '#00FF41',
    background: 'rgba(0, 255, 65, 0.1)',
    border: 'rgba(0, 255, 65, 0.3)'
  },
  ERROR: {
    icon: 'fa-exclamation-circle',
    color: '#FF4444',
    background: 'rgba(255, 68, 68, 0.1)',
    border: 'rgba(255, 68, 68, 0.3)'
  },
  INFO: {
    icon: 'fa-info-circle',
    color: '#00F3FF',
    background: 'rgba(0, 243, 255, 0.1)',
    border: 'rgba(0, 243, 255, 0.3)'
  },
  WARNING: {
    icon: 'fa-triangle-exclamation',
    color: '#FFA726',
    background: 'rgba(255, 167, 38, 0.1)',
    border: 'rgba(255, 167, 38, 0.3)'
  }
};

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {number} duration - Duration in milliseconds
 */
export function showNotification(message, type = 'INFO', duration = 3000) {
  const notificationType = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.INFO;
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${notificationType.background};
    color: ${notificationType.color};
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 0 20px ${notificationType.border};
    display: none;
    align-items: center;
    gap: 10px;
    z-index: 1080;
    border: 1px solid ${notificationType.border};
    backdrop-filter: blur(10px);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Courier New', monospace;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  notification.innerHTML = `
    <i class="fas ${notificationType.icon}"></i>
    <span>${message}</span>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Show notification with animation
  setTimeout(() => {
    notification.style.display = 'flex';
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
  }, 10);
  
  // Remove after duration
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
  
  return notification;
}

/**
 * Show success notification
 * @param {string} message - Success message
 * @param {number} duration - Duration in milliseconds
 */
export function showSuccess(message, duration = 3000) {
  return showNotification(message, 'SUCCESS', duration);
}

/**
 * Show error notification
 * @param {string} message - Error message
 * @param {number} duration - Duration in milliseconds
 */
export function showError(message, duration = 4000) {
  return showNotification(message, 'ERROR', duration);
}

/**
 * Show info notification
 * @param {string} message - Info message
 * @param {number} duration - Duration in milliseconds
 */
export function showInfo(message, duration = 3000) {
  return showNotification(message, 'INFO', duration);
}

/**
 * Show warning notification
 * @param {string} message - Warning message
 * @param {number} duration - Duration in milliseconds
 */
export function showWarning(message, duration = 3500) {
  return showNotification(message, 'WARNING', duration);
}

/**
 * Show loading notification
 * @param {string} message - Loading message
 * @returns {Function} Function to hide the loading notification
 */
export function showLoading(message = 'Loading...') {
  const notification = document.createElement('div');
  notification.className = 'notification loading';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 243, 255, 0.1);
    color: #00F3FF;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1080;
    border: 1px solid rgba(0, 243, 255, 0.3);
    backdrop-filter: blur(10px);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Courier New', monospace;
  `;
  
  notification.innerHTML = `
    <i class="fas fa-spinner fa-spin"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Return function to hide the loading notification
  return () => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  };
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when cancelled
 */
export function showConfirmation(message, onConfirm, onCancel = () => {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-backdrop';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1040;
    backdrop-filter: blur(4px);
  `;
  
  const modal = document.createElement('div');
  modal.className = 'modal confirmation-modal';
  modal.style.cssText = `
    background: var(--panel-bg);
    border-radius: 8px;
    border: 1px solid var(--primary);
    box-shadow: 0 0 30px rgba(255, 94, 0, 0.3);
    max-width: 400px;
    width: 90%;
    overflow: hidden;
  `;
  
  modal.innerHTML = `
    <div class="modal-header">
      <h3><i class="fas fa-question-circle"></i> Confirm Action</h3>
    </div>
    <div class="modal-body">
      <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
      <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
        <button class="btn-secondary" id="cancelBtn">Cancel</button>
        <button class="btn-primary" id="confirmBtn">Confirm</button>
      </div>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Add event listeners
  modal.querySelector('#confirmBtn').addEventListener('click', () => {
    document.body.removeChild(overlay);
    if (onConfirm) onConfirm();
  });
  
  modal.querySelector('#cancelBtn').addEventListener('click', () => {
    document.body.removeChild(overlay);
    if (onCancel) onCancel();
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
      if (onCancel) onCancel();
    }
  });
}
