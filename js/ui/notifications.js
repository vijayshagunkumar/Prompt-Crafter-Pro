// Notification system
export class NotificationManager {
  constructor(containerId = 'notification') {
    this.container = document.getElementById(containerId);
    this.textElement = document.getElementById('notificationText');
    this.timeout = null;
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
}

// Singleton instance
export const notifications = new NotificationManager();
