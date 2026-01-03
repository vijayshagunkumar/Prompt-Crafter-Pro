/**
 * Notification system for PromptCraft Pro
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.init();
    }
    
    init() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notificationContainer')) {
            this.container = document.createElement('div');
            this.container.id = 'notificationContainer';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notificationContainer');
        }
    }
    
    /**
     * Show a notification
     */
    show(message, type = 'info', duration = 3000) {
        const id = 'notification-' + Date.now();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 12px 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            border-left: 4px solid;
            border-left-color: ${this.getColorForType(type)};
        `;
        
        // Icon based on type
        const iconMap = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas fa-${iconMap[type] || 'info-circle'}" 
               style="color: ${this.getColorForType(type)}; font-size: 18px;">
            </i>
            <span style="flex: 1;">${message}</span>
            <button class="notification-close" 
                    style="background: none; border: none; color: #6B7280; cursor: pointer; font-size: 18px;">
                &times;
            </button>
        `;
        
        // Add to container
        this.container.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Store reference
        this.notifications.push({
            id,
            element: notification,
            timeout: null
        });
        
        // Auto-remove after duration
        if (duration > 0) {
            const timeout = setTimeout(() => {
                this.remove(id);
            }, duration);
            
            this.notifications.find(n => n.id === id).timeout = timeout;
        }
        
        // Close button event
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(id);
        });
        
        return id;
    }
    
    /**
     * Remove a notification
     */
    remove(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;
        
        // Clear timeout if exists
        if (notification.timeout) {
            clearTimeout(notification.timeout);
        }
        
        // Animate out
        notification.element.style.transform = 'translateX(120%)';
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
        }, 300);
        
        // Remove from array
        this.notifications = this.notifications.filter(n => n.id !== id);
    }
    
    /**
     * Remove all notifications
     */
    clearAll() {
        this.notifications.forEach(notification => {
            if (notification.timeout) {
                clearTimeout(notification.timeout);
            }
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
        });
        this.notifications = [];
    }
    
    /**
     * Get color for notification type
     */
    getColorForType(type) {
        const colors = {
            'success': '#10B981',
            'error': '#EF4444',
            'warning': '#F59E0B',
            'info': '#3B82F6'
        };
        return colors[type] || '#3B82F6';
    }
    
    /**
     * Show success notification
     */
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }
    
    /**
     * Show error notification
     */
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }
    
    /**
     * Show warning notification
     */
    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }
    
    /**
     * Show info notification
     */
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

// Create singleton instance
const notifications = new NotificationSystem();

// Make globally available
window.notifications = notifications;
window.NotificationSystem = NotificationSystem;

// Global helper function
window.showNotification = function(message, type = 'info', duration = 3000) {
    return notifications.show(message, type, duration);
};
