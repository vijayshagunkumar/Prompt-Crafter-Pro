// theme-manager.js - Theme Management System

import { STORAGE_KEYS } from './constants.js';

/**
 * Theme Manager Class
 */
class ThemeManager {
    constructor() {
        this.themes = {
            'professional-blue': { 
                name: 'Professional Blue', 
                icon: 'fas fa-briefcase',
                description: 'Clean corporate aesthetic perfect for business use'
            },
            'glassmorphism': { 
                name: 'Glassmorphism', 
                icon: 'fas fa-gem',
                description: 'Frosted glass effects with modern gradients'
            },
            'modern-tech': { 
                name: 'Modern Tech', 
                icon: 'fas fa-rocket',
                description: 'Dark mode with tech-forward cyan accents'
            },
            'executive-dark': { 
                name: 'Executive Dark', 
                icon: 'fas fa-user-tie',
                description: 'Premium dark theme for executive users'
            },
            'corporate-green': { 
                name: 'Corporate Green', 
                icon: 'fas fa-building',
                description: 'Enterprise green theme for corporate environments'
            }
        };
        
        this.themeOrder = [
            'professional-blue',
            'glassmorphism',
            'modern-tech',
            'executive-dark',
            'corporate-green'
        ];
        
        this.init();
    }
    
    /**
     * Initialize theme manager
     */
    init() {
        // Load saved theme or default to professional-blue
        const savedTheme = localStorage.getItem(STORAGE_KEYS.appTheme) || 'professional-blue';
        this.setTheme(savedTheme, false);
        
        // Setup theme toggle button if exists
        this.setupThemeToggle();
        
        // Setup theme modal button if exists
        this.setupThemeModal();
    }
    
    /**
     * Set active theme
     * @param {string} themeName - Theme to activate
     * @param {boolean} showNotification - Show notification
     * @returns {string} Theme name
     */
    setTheme(themeName, showNotification = true) {
        if (!this.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found, using default`);
            themeName = 'professional-blue';
        }
        
        // Update HTML attribute
        document.documentElement.setAttribute('data-theme', themeName);
        
        // Update UI elements
        this.updateThemeUI(themeName);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.appTheme, themeName);
        
        if (showNotification) {
            this.showNotification(themeName);
        }
        
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('theme:change', {
            detail: { theme: themeName }
        }));
        
        return themeName;
    }
    
    /**
     * Update UI elements for theme
     * @param {string} themeName - Theme name
     */
    updateThemeUI(themeName) {
        const theme = this.themes[themeName];
        
        // Update current theme display
        const currentThemeElement = document.getElementById('currentThemeName');
        if (currentThemeElement) {
            currentThemeElement.textContent = theme.name;
        }
        
        // Update theme toggle button icon
        const toggleBtn = document.getElementById('themeToggleBtn');
        if (toggleBtn) {
            toggleBtn.innerHTML = `<i class="${theme.icon}"></i>`;
        }
        
        // Update active theme buttons
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === themeName);
        });
    }
    
    /**
     * Setup theme toggle button
     */
    setupThemeToggle() {
        const toggleBtn = document.getElementById('themeToggleBtn');
        if (!toggleBtn) return;
        
        // Toggle through themes on click
        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const currentIndex = this.themeOrder.indexOf(currentTheme);
            const nextIndex = (currentIndex + 1) % this.themeOrder.length;
            const nextTheme = this.themeOrder[nextIndex];
            
            this.setTheme(nextTheme);
            
            // Show modal button temporarily
            this.showModalButton();
        });
        
        // Show modal button on hover
        toggleBtn.addEventListener('mouseenter', () => {
            this.showModalButton();
        });
    }
    
    /**
     * Setup theme modal button
     */
    setupThemeModal() {
        const modalBtn = document.getElementById('themeModalBtn');
        if (!modalBtn) return;
        
        modalBtn.addEventListener('click', () => {
            this.showThemeSelectionModal();
        });
    }
    
    /**
     * Show theme modal button
     */
    showModalButton() {
        const modalBtn = document.getElementById('themeModalBtn');
        if (!modalBtn) return;
        
        modalBtn.classList.add('show');
        
        // Hide after 3 seconds if not hovered
        setTimeout(() => {
            if (!modalBtn.matches(':hover') && 
                !document.getElementById('themeToggleBtn')?.matches(':hover')) {
                modalBtn.classList.remove('show');
            }
        }, 3000);
    }
    
    /**
     * Show theme change notification
     * @param {string} themeName - Theme name
     */
    showNotification(themeName) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: var(--bg-card);
            color: var(--text-primary);
            padding: 16px 24px;
            border-radius: 16px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
            border: 2px solid var(--border-light);
            backdrop-filter: blur(20px);
            z-index: 1000;
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
        `;
        
        const theme = this.themes[themeName];
        notification.innerHTML = `
            <i class="${theme.icon}" style="color: var(--primary);"></i>
            <span>Theme switched to ${theme.name}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
    
    /**
     * Show theme selection modal
     */
    showThemeSelectionModal() {
        // Create modal overlay
        const overlay = document.createElement('div');
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
            z-index: 2000;
            backdrop-filter: blur(4px);
            animation: fadeIn 0.3s ease;
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: var(--bg-card);
            border-radius: 24px;
            padding: 32px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            border: 2px solid var(--border-light);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;
        
        modal.innerHTML = `
            <div style="margin-bottom: 24px;">
                <h3 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
                    <i class="fas fa-palette"></i> Select Theme
                </h3>
                <p style="color: var(--text-secondary); font-size: 0.875rem;">
                    Choose a professional theme for your workspace
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px;">
                ${Object.entries(this.themes).map(([id, theme]) => {
                    const isActive = document.documentElement.getAttribute('data-theme') === id;
                    return `
                        <div class="theme-card ${isActive ? 'active' : ''}" data-theme="${id}" 
                             style="background: var(--bg-primary); border: 2px solid ${isActive ? 'var(--primary)' : 'var(--border-light)'}; 
                                    border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, var(--primary), var(--secondary)); 
                                      display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="${theme.icon}"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 700; color: var(--text-primary);">${theme.name}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-tertiary);">Click to select</div>
                                </div>
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">
                                ${theme.description}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button id="closeModal" style="padding: 12px 24px; background: var(--bg-secondary); color: var(--text-secondary); 
                       border: 1px solid var(--border-light); border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">
                    Close
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(30px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
        
        // Add click handlers
        modal.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                const theme = card.dataset.theme;
                this.setTheme(theme);
                document.body.removeChild(overlay);
                document.head.removeChild(style);
            });
            
            card.addEventListener('mouseenter', () => {
                if (!card.classList.contains('active')) {
                    card.style.transform = 'translateY(-4px)';
                    card.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.15)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('active')) {
                    card.style.transform = 'translateY(0)';
                    card.style.boxShadow = 'none';
                }
            });
        });
        
        modal.querySelector('#closeModal').addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.head.removeChild(style);
        });
        
        modal.querySelector('#closeModal').addEventListener('mouseenter', () => {
            modal.querySelector('#closeModal').style.background = 'var(--bg-tertiary)';
        });
        
        modal.querySelector('#closeModal').addEventListener('mouseleave', () => {
            modal.querySelector('#closeModal').style.background = 'var(--bg-secondary)';
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                document.head.removeChild(style);
            }
        });
    }
    
    /**
     * Get current theme
     * @returns {string} Current theme
     */
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme');
    }
    
    /**
     * Get all themes
     * @returns {Object} All themes
     */
    getAllThemes() {
        return this.themes;
    }
    
    /**
     * Get theme order
     * @returns {Array} Theme order
     */
    getThemeOrder() {
        return this.themeOrder;
    }
}

// Create and export singleton instance
const themeManager = new ThemeManager();

// Export functions
export function setTheme(themeName, showNotification = true) {
    return themeManager.setTheme(themeName, showNotification);
}

export function getCurrentTheme() {
    return themeManager.getCurrentTheme();
}

export function getAllThemes() {
    return themeManager.getAllThemes();
}

export function getThemeOrder() {
    return themeManager.getThemeOrder();
}

export function showThemeSelectionModal() {
    return themeManager.showThemeSelectionModal();
}

// Default export
export default themeManager;
