// Notification system
export class NotificationSystem {
    constructor() {
        this.container = null;
        this.lastNotification = null;
        this.notificationCooldown = 1000; // 1 second cooldown
        this.setup();
    }
    
    setup() {
        this.createContainer();
    }
    
    createContainer() {
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
        `;
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = 4000) {
        // Prevent duplicate notifications within cooldown period
        const now = Date.now();
        if (this.lastNotification && 
            this.lastNotification.message === message && 
            this.lastNotification.type === type &&
            now - this.lastNotification.timestamp < this.notificationCooldown) {
            return null; // Skip duplicate notification
        }
        
        if (!this.container) this.createContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            padding: 16px 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            border: 1px solid;
            animation: slideInRight 0.3s ease-out;
            backdrop-filter: blur(10px);
        `;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'} notification-icon"></i>
            <span class="notification-content">${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        this.container.appendChild(notification);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(notification);
        });
        
        // Auto-remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
        
        // Add CSS animation if not exists
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .notification { transition: all 0.3s; }
                .notification.success { 
                    background: rgba(16, 185, 129, 0.15); 
                    border-color: rgba(16, 185, 129, 0.3); 
                    color: #10b981; 
                }
                .notification.error { 
                    background: rgba(239, 68, 68, 0.15); 
                    border-color: rgba(239, 68, 68, 0.3); 
                    color: #ef4444; 
                }
                .notification.info { 
                    background: rgba(59, 130, 246, 0.15); 
                    border-color: rgba(59, 130, 246, 0.3); 
                    color: #3b82f6; 
                }
                .notification.warning { 
                    background: rgba(245, 158, 11, 0.15); 
                    border-color: rgba(245, 158, 11, 0.3); 
                    color: #f59e0b; 
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: inherit;
                    opacity: 0.7;
                    cursor: pointer;
                    font-size: 20px;
                    padding: 0 4px;
                }
                .notification-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Store last notification info
        this.lastNotification = {
            message,
            type,
            timestamp: now
        };
        
        return notification;
    }
    
    remove(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
    
    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }
    
    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }
    
    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }
}

export const notifications = new NotificationSystem();
