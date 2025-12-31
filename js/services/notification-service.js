// Toast notification system
class NotificationService {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.defaultDuration = 3000; // 3 seconds
        this.nextId = 1;
        this.init();
    }

    init() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notificationContainer')) {
            this.container = document.createElement('div');
            this.container.id = 'notificationContainer';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notificationContainer');
        }

        // Load settings
        const savedDuration = localStorage.getItem('notificationDuration');
        if (savedDuration) {
            this.defaultDuration = parseInt(savedDuration, 10);
        }
    }

    show(message, type = 'info', duration = null) {
        const id = `notification-${this.nextId++}`;
        const actualDuration = duration || this.defaultDuration;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification ${type}`;
        
        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="notification-icon ${icons[type] || icons.info}"></i>
            <div class="notification-message">${this.escapeHtml(message)}</div>
            <button class="notification-close" data-id="${id}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to container
        this.container.appendChild(notification);
        
        // Store reference
        this.notifications.set(id, {
            element: notification,
            timeout: null
        });
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Auto-dismiss if duration > 0
        if (actualDuration > 0) {
            const timeout = setTimeout(() => {
                this.dismiss(id);
            }, actualDuration);
            
            this.notifications.get(id).timeout = timeout;
        }
        
        // Add close button event
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.dismiss(id);
        });
        
        return id;
    }

    dismiss(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        // Clear timeout if exists
        if (notification.timeout) {
            clearTimeout(notification.timeout);
        }
        
        // Animate out
        notification.element.classList.remove('show');
        notification.element.classList.add('hiding');
        
        // Remove after animation
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    dismissAll() {
        for (const id of this.notifications.keys()) {
            this.dismiss(id);
        }
    }

    update(id, message, type = null) {
        const notification = this.notifications.get(id);
        if (!notification) return false;
        
        const element = notification.element;
        
        if (message) {
            const messageEl = element.querySelector('.notification-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
        
        if (type) {
            // Update type classes
            element.classList.remove('success', 'error', 'warning', 'info');
            element.classList.add(type);
            
            // Update icon
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };
            
            const iconEl = element.querySelector('.notification-icon');
            if (iconEl) {
                iconEl.className = `notification-icon ${icons[type] || icons.info}`;
            }
        }
        
        return true;
    }

    // Success shortcut
    success(message, duration = null) {
        return this.show(message, 'success', duration);
    }

    // Error shortcut
    error(message, duration = null) {
        return this.show(message, 'error', duration);
    }

    // Warning shortcut
    warning(message, duration = null) {
        return this.show(message, 'warning', duration);
    }

    // Info shortcut
    info(message, duration = null) {
        return this.show(message, 'info', duration);
    }

    // Loading notification
    showLoading(message = 'Loading...') {
        const id = this.show(message, 'info', 0); // Persistent
        const notification = this.notifications.get(id);
        
        if (notification) {
            const icon = notification.element.querySelector('.notification-icon');
            if (icon) {
                icon.className = 'notification-icon fas fa-spinner fa-spin';
            }
        }
        
        return id;
    }

    // Complete loading with success/error
    completeLoading(id, success = true, message = null) {
        const finalMessage = message || (success ? 'Completed!' : 'Failed!');
        const type = success ? 'success' : 'error';
        
        this.update(id, finalMessage, type);
        
        // Auto-dismiss after 2 seconds
        setTimeout(() => {
            this.dismiss(id);
        }, 2000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
} else {
    window.NotificationService = NotificationService;
}
