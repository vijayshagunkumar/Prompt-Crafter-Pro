// notifications.js - Notification System

import { NOTIFICATION_TYPES, ANIMATION_DURATIONS } from '../core/constants.js';

/**
 * Notification Manager
 */
class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = new Map();
    this.nextId = 1;
    this.init();
  }

  /**
   * Initialize notification container
   */
  init() {
    // Create container if it doesn't exist
    this.container = document.getElementById('notification-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'notification-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info, warning)
   * @param {number} duration - Auto-close duration in ms (0 for manual close)
   * @returns {string} Notification ID
   */
  show(message, type = NOTIFICATION_TYPES.INFO, duration = 3000) {
    const id = `notification-${this.nextId++}`;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    
    // Get icon based on type
    const icon = this.getIconForType(type);
    
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="${icon}"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">${this.getTitleForType(type)}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close" aria-label="Close notification">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add to container and DOM
    this.container.appendChild(notification);
    this.notifications.set(id, { element: notification, timeout: null });
    
    // Add close handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => this.close(id));
    
    // Auto-close if duration specified
    if (duration > 0) {
      const timeout = setTimeout(() => this.close(id), duration);
      this.notifications.get(id).timeout = timeout;
    }
    
    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    return id;
  }

  /**
   * Close notification
   * @param {string} id - Notification ID
   */
  close(id) {
    const notificationData = this.notifications.get(id);
    if (!notificationData) return;
    
    const { element, timeout } = notificationData;
    
    // Clear timeout if exists
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // Add hide animation
    element.classList.add('hide');
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.notifications.delete(id);
    }, ANIMATION_DURATIONS.BASE);
  }

  /**
   * Close all notifications
   */
  closeAll() {
    for (const id of this.notifications.keys()) {
      this.close(id);
    }
  }

  /**
   * Get icon for notification type
   * @param {string} type - Notification type
   * @returns {string} Icon class
   */
  getIconForType(type) {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'fas fa-check-circle';
      case NOTIFICATION_TYPES.ERROR:
        return 'fas fa-exclamation-circle';
      case NOTIFICATION_TYPES.WARNING:
        return 'fas fa-exclamation-triangle';
      case NOTIFICATION_TYPES.INFO:
      default:
        return 'fas fa-info-circle';
    }
  }

  /**
   * Get title for notification type
   * @param {string} type - Notification type
   * @returns {string} Title
   */
  getTitleForType(type) {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'Success';
      case NOTIFICATION_TYPES.ERROR:
        return 'Error';
      case NOTIFICATION_TYPES.WARNING:
        return 'Warning';
      case NOTIFICATION_TYPES.INFO:
      default:
        return 'Information';
    }
  }

  /**
   * Show success notification
   * @param {string} message - Message
   * @param {number} duration - Duration
   * @returns {string} Notification ID
   */
  success(message, duration = 3000) {
    return this.show(message, NOTIFICATION_TYPES.SUCCESS, duration);
  }

  /**
   * Show error notification
   * @param {string} message - Message
   * @param {number} duration - Duration
   * @returns {string} Notification ID
   */
  error(message, duration = 5000) {
    return this.show(message, NOTIFICATION_TYPES.ERROR, duration);
  }

  /**
   * Show info notification
   * @param {string} message - Message
   * @param {number} duration - Duration
   * @returns {string} Notification ID
   */
  info(message, duration = 3000) {
    return this.show(message, NOTIFICATION_TYPES.INFO, duration);
  }

  /**
   * Show warning notification
   * @param {string} message - Message
   * @param {number} duration - Duration
   * @returns {string} Notification ID
   */
  warning(message, duration = 4000) {
    return this.show(message, NOTIFICATION_TYPES.WARNING, duration);
  }

  /**
   * Update existing notification
   * @param {string} id - Notification ID
   * @param {string} message - New message
   * @param {string} type - New type
   */
  update(id, message, type) {
    const notificationData = this.notifications.get(id);
    if (!notificationData) return;
    
    const { element } = notificationData;
    const icon = this.getIconForType(type);
    const title = this.getTitleForType(type);
    
    element.className = `notification ${type}`;
    element.querySelector('.notification-icon i').className = icon;
    element.querySelector('.notification-title').textContent = title;
    element.querySelector('.notification-message').textContent = message;
  }

  /**
   * Get notification count
   * @returns {number} Number of active notifications
   */
  getCount() {
    return this.notifications.size;
  }

  /**
   * Check if notification exists
   * @param {string} id - Notification ID
   * @returns {boolean} True if exists
   */
  has(id) {
    return this.notifications.has(id);
  }

  /**
   * Destroy notification system
   */
  destroy() {
    this.closeAll();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.notifications.clear();
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Export functions
export function showNotification(message, type = NOTIFICATION_TYPES.INFO, duration = 3000) {
  return notificationManager.show(message, type, duration);
}

export function showSuccess(message, duration = 3000) {
  return notificationManager.success(message, duration);
}

export function showError(message, duration = 5000) {
  return notificationManager.error(message, duration);
}

export function showInfo(message, duration = 3000) {
  return notificationManager.info(message, duration);
}

export function showWarning(message, duration = 4000) {
  return notificationManager.warning(message, duration);
}

export function closeNotification(id) {
  return notificationManager.close(id);
}

export function closeAllNotifications() {
  return notificationManager.closeAll();
}

export function updateNotification(id, message, type) {
  return notificationManager.update(id, message, type);
}

export function getNotificationCount() {
  return notificationManager.getCount();
}

export default notificationManager;
