// theme-manager.js - Theme Management System (UPDATED & COMPLETE)

import { STORAGE_KEYS } from '../core/constants.js';
import { showNotification } from './notifications.js';

/**
 * Theme Manager Class
 */
class ThemeManager {
    constructor() {
        this.themes = {
            'professional-blue': { 
                name: 'Professional Blue', 
                icon: 'fas fa-briefcase',
                description: 'Clean corporate aesthetic perfect for business use',
                colors: {
                    primary: '#4361ee',
                    secondary: '#7209b7',
                    background: '#0f172a',
                    surface: '#1e293b',
                    text: '#f8fafc'
                }
            },
            'glassmorphism': { 
                name: 'Glassmorphism', 
                icon: 'fas fa-gem',
                description: 'Frosted glass effects with modern gradients',
                colors: {
                    primary: '#8b5cf6',
                    secondary: '#ec4899',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    surface: 'rgba(255, 255, 255, 0.1)',
                    text: '#ffffff'
                }
            },
            'modern-tech': { 
                name: 'Modern Tech', 
                icon: 'fas fa-rocket',
                description: 'Dark mode with tech-forward cyan accents',
                colors: {
                    primary: '#00f3ff',
                    secondary: '#ff5e00',
                    background: '#0a0e17',
                    surface: '#111827',
                    text: '#f1f5f9'
                }
            },
            'executive-dark': { 
                name: 'Executive Dark', 
                icon: 'fas fa-user-tie',
                description: 'Premium dark theme for executive users',
                colors: {
                    primary: '#10b981',
                    secondary: '#8b5cf6',
                    background: '#111827',
                    surface: '#1f2937',
                    text: '#f9fafb'
                }
            },
            'corporate-green': { 
                name: 'Corporate Green', 
                icon: 'fas fa-building',
                description: 'Enterprise green theme for corporate environments',
                colors: {
                    primary: '#059669',
                    secondary: '#3b82f6',
                    background: '#0f172a',
                    surface: '#1e293b',
                    text: '#f8fafc'
                }
            },
            'cyberpunk-neon': {
                name: 'Cyberpunk Neon',
                icon: 'fas fa-gamepad',
                description: 'Neon lights and futuristic cyberpunk style',
                colors: {
                    primary: '#ff5e00',
                    secondary: '#00f3ff',
                    background: '#0a0e17',
                    surface: '#111827',
                    text: '#f1f5f9'
                }
            },
            'sunset-glow': {
                name: 'Sunset Glow',
                icon: 'fas fa-sun',
                description: 'Warm sunset colors for creative work',
                colors: {
                    primary: '#ff6b6b',
                    secondary: '#ffa726',
                    background: '#1a1a2e',
                    surface: '#16213e',
                    text: '#f0f0f0'
                }
            },
            'aurora-magic': {
                name: 'Aurora Magic',
                icon: 'fas fa-magic',
                description: 'Northern lights inspired magical theme',
                colors: {
                    primary: '#00d4aa',
                    secondary: '#667eea',
                    background: '#0f0f23',
                    surface: '#1a1a2e',
                    text: '#e2e8f0'
                }
            }
        };
        
        this.themeOrder = [
            'professional-blue',
            'glassmorphism',
            'modern-tech',
            'executive-dark',
            'corporate-green',
            'cyberpunk-neon',
            'sunset-glow',
            'aurora-magic'
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
        
        // Setup theme selector in sidebar
        this.setupThemeSelector();
        
        console.log('🎨 Theme manager initialized');
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
        
        // Update CSS variables
        this.updateCSSVariables(themeName);
        
        // Update UI elements
        this.updateThemeUI(themeName);
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.appTheme, themeName);
        
        // Update theme selector in sidebar
        this.updateThemeSelector(themeName);
        
        if (showNotification) {
            this.showThemeNotification(themeName);
        }
        
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('theme:change', {
            detail: { theme: themeName }
        }));
        
        return themeName;
    }
    
    /**
     * Update CSS variables for theme
     * @param {string} themeName - Theme name
     */
    updateCSSVariables(themeName) {
        const theme = this.themes[themeName];
        const root = document.documentElement;
        
        // Update CSS variables
        root.style.setProperty('--primary', theme.colors.primary);
        root.style.setProperty('--secondary', theme.colors.secondary);
        
        // Handle gradient backgrounds
        if (theme.colors.background.includes('gradient')) {
            root.style.setProperty('--bg-body', theme.colors.background);
        } else {
            root.style.setProperty('--bg-body', theme.colors.background);
        }
        
        root.style.setProperty('--bg-surface', theme.colors.surface);
        root.style.setProperty('--text-primary', theme.colors.text);
        
        // Update gradients
        root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`);
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
        
        // Update logo gradient
        const logoElements = document.querySelectorAll('.brand-logo, .header-logo');
        logoElements.forEach(logo => {
            logo.style.background = `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`;
        });
    }
    
    /**
     * Update theme selector in sidebar
     * @param {string} themeName - Theme name
     */
    updateThemeSelector(themeName) {
        const themeSelect = document.querySelector('.theme-select');
        if (themeSelect) {
            themeSelect.value = themeName;
        }
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
        });
    }
    
    /**
     * Setup theme selector in sidebar
     */
    setupThemeSelector() {
        const themeSelect = document.querySelector('.theme-select');
        if (!themeSelect) return;
        
        // Populate theme options
        themeSelect.innerHTML = '';
        this.themeOrder.forEach(themeId => {
            const theme = this.themes[themeId];
            const option = document.createElement('option');
            option.value = themeId;
            option.textContent = theme.name;
            themeSelect.appendChild(option);
        });
        
        // Set current theme
        const currentTheme = this.getCurrentTheme();
        themeSelect.value = currentTheme;
        
        // Add change event
        themeSelect.addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });
    }
    
    /**
     * Show theme change notification
     * @param {string} themeName - Theme name
     */
    showThemeNotification(themeName) {
        const theme = this.themes[themeName];
        
        // Use the existing notification system
        showNotification(`Theme switched to ${theme.name}`, 'SUCCESS');
        
        // Add visual feedback
        document.documentElement.classList.add('theme-changing');
        setTimeout(() => {
            document.documentElement.classList.remove('theme-changing');
        }, 500);
    }
    
    /**
     * Show theme selection modal
     */
    showThemeSelectionModal() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-backdrop';
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
        modal.className = 'modal theme-selection-modal';
        modal.style.cssText = `
            background: var(--bg-surface);
            border-radius: 24px;
            padding: 32px;
            max-width: 800px;
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
                    Choose a theme that matches your style and workflow
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px;">
                ${this.themeOrder.map(themeId => {
                    const theme = this.themes[themeId];
                    const isActive = this.getCurrentTheme() === themeId;
                    return `
                        <div class="theme-card ${isActive ? 'active' : ''}" data-theme="${themeId}" 
                             style="background: ${theme.colors.surface}; border: 2px solid ${isActive ? theme.colors.primary : 'var(--border-light)'}; 
                                    border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.3s ease; position: relative;">
                            ${isActive ? '<div style="position: absolute; top: 8px; right: 8px; background: var(--primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;"><i class="fas fa-check"></i></div>' : ''}
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}); 
                                      display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="${theme.icon}"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 700; color: var(--text-primary);">${theme.name}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-tertiary);">Click to select</div>
                                </div>
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; margin-top: 8px;">
                                ${theme.description}
                            </div>
                            <div style="display: flex; gap: 4px; margin-top: 12px;">
                                <div style="width: 20px; height: 20px; border-radius: 4px; background: ${theme.colors.primary};"></div>
                                <div style="width: 20px; height: 20px; border-radius: 4px; background: ${theme.colors.secondary};"></div>
                                <div style="width: 20px; height: 20px; border-radius: 4px; background: ${theme.colors.background}; border: 1px solid var(--border-light);"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 12px; padding-top: 20px; border-top: 1px solid var(--border-light);">
                <button id="closeThemeModal" style="padding: 12px 24px; background: var(--bg-secondary); color: var(--text-secondary); 
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
            
            .theme-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
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
        });
        
        modal.querySelector('#closeThemeModal').addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.head.removeChild(style);
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
        return document.documentElement.getAttribute('data-theme') || 'professional-blue';
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
    
    /**
     * Get current theme object
     * @returns {Object} Current theme
     */
    getCurrentThemeObject() {
        return this.themes[this.getCurrentTheme()];
    }
    
    /**
     * Cycle to next theme
     */
    nextTheme() {
        const currentTheme = this.getCurrentTheme();
        const currentIndex = this.themeOrder.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % this.themeOrder.length;
        const nextTheme = this.themeOrder[nextIndex];
        
        this.setTheme(nextTheme);
    }
    
    /**
     * Cycle to previous theme
     */
    previousTheme() {
        const currentTheme = this.getCurrentTheme();
        const currentIndex = this.themeOrder.indexOf(currentTheme);
        const previousIndex = (currentIndex - 1 + this.themeOrder.length) % this.themeOrder.length;
        const previousTheme = this.themeOrder[previousIndex];
        
        this.setTheme(previousTheme);
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

export function nextTheme() {
    return themeManager.nextTheme();
}

export function previousTheme() {
    return themeManager.previousTheme();
}

export function getCurrentThemeObject() {
    return themeManager.getCurrentThemeObject();
}

// Default export
export default themeManager;
