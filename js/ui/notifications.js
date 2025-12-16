// Notification system
export class NotificationManager {
  constructor() {
    this.container = document.getElementById('notification');
    this.textElement = document.getElementById('notificationText');
    this.timeout = null;
    this.setup();
  }
  
  setup() {
    if (!this.container || !this.textElement) {
      console.warn('Notification elements not found');
      return;
    }
  }
  
  show(message, type = 'success', duration = 3000) {
    if (!this.container || !this.textElement) {
      console.log(`[${type.toUpperCase()}] ${message}`);
      return;
    }
    
    // Clear existing timeout
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.container.classList.remove('show');
    }
    
    // Set message and type
    this.textElement.textContent = message;
    this.container.className = `notification notification-${type}`;
    
    // Set icon based on type
    const icon = this.container.querySelector('i');
    if (icon) {
      switch(type) {
        case 'success':
          icon.className = 'fas fa-check-circle';
          break;
        case 'error':
          icon.className = 'fas fa-exclamation-circle';
          break;
        case 'info':
          icon.className = 'fas fa-info-circle';
          break;
        case 'warning':
          icon.className = 'fas fa-exclamation-triangle';
          break;
      }
    }
    
    // Show notification
    this.container.style.display = 'flex';
    
    // Trigger animation
    setTimeout(() => {
      this.container.classList.add('show');
    }, 10);
    
    // Auto-hide
    this.timeout = setTimeout(() => {
      this.hide();
    }, duration);
  }
  
  hide() {
    if (!this.container) return;
    
    this.container.classList.remove('show');
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 300);
  }
  
  success(message, duration = 3000) {
    this.show(message, 'success', duration);
  }
  
  error(message, duration = 4000) {
    this.show(message, 'error', duration);
  }
  
  info(message, duration = 3000) {
    this.show(message, 'info', duration);
  }
  
  warning(message, duration = 3000) {
    this.show(message, 'warning', duration);
  }
}

// Singleton instance
export const notifications = new NotificationManager();
