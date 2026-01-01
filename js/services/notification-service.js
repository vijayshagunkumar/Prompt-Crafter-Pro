// notification-service.js - Toast notifications
(function() {
    'use strict';
    
    class NotificationService {
        constructor() {
            this.container = document.getElementById('notificationContainer');
            if (!this.container) {
                this.createContainer();
            }
        }
        
        createContainer() {
            this.container = document.createElement('div');
            this.container.id = 'notificationContainer';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
        
        show(message, type = 'info', duration = 3000) {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            
            const icon = this.getIconForType(type);
            
            notification.innerHTML = `
                <div class="notification-icon">${icon}</div>
                <div class="notification-content">${message}</div>
                <button class="notification-close">&times;</button>
            `;
            
            this.container.appendChild(notification);
            
            // Add close functionality
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                this.removeNotification(notification);
            });
            
            // Auto-remove after duration
            if (duration > 0) {
                setTimeout(() => {
                    this.removeNotification(notification);
                }, duration);
            }
            
            // Add CSS if not present
            if (!document.getElementById('notification-styles')) {
                this.addNotificationStyles();
            }
            
            return notification;
        }
        
        removeNotification(notification) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
        
        getIconForType(type) {
            const icons = {
                success: '<i class="fas fa-check-circle"></i>',
                error: '<i class="fas fa-exclamation-circle"></i>',
                warning: '<i class="fas fa-exclamation-triangle"></i>',
                info: '<i class="fas fa-info-circle"></i>'
            };
            return icons[type] || icons.info;
        }
        
        addNotificationStyles() {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    max-width: 350px;
                }
                
                .notification {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: var(--border-radius-md);
                    padding: var(--spacing-md);
                    margin-bottom: var(--spacing-sm);
                    box-shadow: var(--shadow-lg);
                    display: flex;
                    align-items: center;
                    animation: slideIn 0.3s ease;
                }
                
                .notification-success {
                    border-left: 4px solid #10B981;
                }
                
                .notification-error {
                    border-left: 4px solid #EF4444;
                }
                
                .notification-warning {
                    border-left: 4px solid #F59E0B;
                }
                
                .notification-info {
                    border-left: 4px solid #3B82F6;
                }
                
                .notification-icon {
                    margin-right: var(--spacing-sm);
                    font-size: 1.2em;
                }
                
                .notification-success .notification-icon {
                    color: #10B981;
                }
                
                .notification-error .notification-icon {
                    color: #EF4444;
                }
                
                .notification-warning .notification-icon {
                    color: #F59E0B;
                }
                
                .notification-info .notification-icon {
                    color: #3B82F6;
                }
                
                .notification-content {
                    flex: 1;
                    color: var(--text-primary);
                    font-size: var(--font-size-sm);
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 1.2em;
                    margin-left: var(--spacing-sm);
                    padding: 0;
                }
                
                .notification-close:hover {
                    color: var(--text-primary);
                }
                
                .fade-out {
                    animation: fadeOut 0.3s ease forwards;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Export to global scope
    window.NotificationService = NotificationService;
    
})();
