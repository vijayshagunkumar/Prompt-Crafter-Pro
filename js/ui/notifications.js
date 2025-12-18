// js/ui/notifications.js

/**
 * NotificationSystem
 * Centralized, instance-based notification manager
 * Supports: success, error, info, warning
 * Features: cooldown, deduplication, animations, auto-dismiss
 */

export class NotificationSystem {
  constructor() {
    this.container = null;
    this.lastNotification = null;
    this.notificationCooldown = 1000; // 1s dedupe window
    this._init();
  }

  _init() {
    this._createContainer();
    this._injectStyles();
  }

  _createContainer() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  _injectStyles() {
    if (document.getElementById('notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(120%); }
        to { opacity: 1; transform: translateX(0); }
      }

      @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(120%); }
      }

      .notification {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        border-radius: 12px;
        font-family: Inter, system-ui, sans-serif;
        font-size: 14px;
        font-weight: 500;
        backdrop-filter: blur(12px);
        border: 1px solid;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        animation: slideInRight 0.35s ease-out;
      }

      .notification.success {
        background: rgba(16,185,129,0.15);
        border-color: rgba(16,185,129,0.35);
        color: #10b981;
      }

      .notification.error {
        background: rgba(239,68,68,0.15);
        border-color: rgba(239,68,68,0.35);
        color: #ef4444;
      }

      .notification.info {
        background: rgba(59,130,246,0.15);
        border-color: rgba(59,130,246,0.35);
        color: #3b82f6;
      }

      .notification.warning {
        background: rgba(245,158,11,0.15);
        border-color: rgba(245,158,11,0.35);
        color: #f59e0b;
      }

      .notification i {
        font-size: 18px;
        opacity: 0.9;
      }

      .notification-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        opacity: 0.7;
        margin-left: auto;
      }

      .notification-close:hover {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  _dedupe(message, type) {
    const now = Date.now();
    if (
      this.lastNotification &&
      this.lastNotification.message === message &&
      this.lastNotification.type === type &&
      now - this.lastNotification.time < this.notificationCooldown
    ) {
      return true;
    }

    this.lastNotification = { message, type, time: now };
    return false;
  }

  show(message, type = 'info', duration = 4000) {
    if (!message) return null;
    if (this._dedupe(message, type)) return null;

    this._createContainer();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      info: 'fa-info-circle',
      warning: 'fa-exclamation-triangle'
    };

    notification.innerHTML = `
      <i class="fas ${icons[type] || icons.info}"></i>
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    `;

    this.container.appendChild(notification);

    notification.querySelector('.notification-close')
      .addEventListener('click', () => this.remove(notification));

    if (duration > 0) {
      setTimeout(() => this.remove(notification), duration);
    }

    return notification;
  }

  remove(notification) {
    if (!notification) return;

    notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => {
      notification?.remove();
    }, 300);
  }

  success(msg, duration = 4000) {
    return this.show(msg, 'success', duration);
  }

  error(msg, duration = 4000) {
    return this.show(msg, 'error', duration);
  }

  info(msg, duration = 4000) {
    return this.show(msg, 'info', duration);
  }

  warning(msg, duration = 4000) {
    return this.show(msg, 'warning', duration);
  }
}

/* -------------------------------------------------------
   Singleton export (USE THIS EVERYWHERE)
-------------------------------------------------------- */
export const notifications = new NotificationSystem();

/* Optional global exposure for debugging / fallback */
if (typeof window !== 'undefined') {
  window.notifications = notifications;
}
