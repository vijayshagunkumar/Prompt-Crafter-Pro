// notification-service.js - Toast notifications
export class NotificationService {
    constructor() {
        this.container = document.getElementById('notification');
        this.messageElement = document.getElementById('notificationMessage');
        this.currentTimeout = null;
        this.defaultDuration = 3000;
    }

    show(message, type = 'info') {
        // Clear any existing notification
        this.hide();

        // Set message and type
        this.messageElement.textContent = message;
        
        // Update styling based on type
        this.container.className = 'notification';
        this.container.classList.add(`notification-${type}`);
        
        // Set icon based on type
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const iconElement = this.container.querySelector('i');
        if (iconElement) {
            iconElement.className = iconMap[type] || iconMap.info;
        }
        
        // Show notification
        this.container.style.display = 'flex';
        this.container.style.animation = 'slideInUp 0.3s ease';
        
        // Auto-hide after duration
        const duration = this.getDuration();
        if (duration > 0) {
            this.currentTimeout = setTimeout(() => {
                this.hide();
            }, duration);
        }
        
        // Add click to dismiss
        this.container.onclick = () => this.hide();
    }

    hide() {
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        
        if (this.container.style.display !== 'none') {
            this.container.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                this.container.style.display = 'none';
            }, 300);
        }
    }

    getDuration() {
        // Could load from settings
        return this.defaultDuration;
    }

    setDuration(duration) {
        this.defaultDuration = duration;
    }

    // Quick methods for common notification types
    success(message) {
        this.show(message, 'success');
    }

    error(message) {
        this.show(message, 'error');
    }

    warning(message) {
        this.show(message, 'warning');
    }

    info(message) {
        this.show(message, 'info');
    }
}
