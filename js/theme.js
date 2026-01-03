/**
 * Theme Management
 */

class ThemeManager {
    constructor() {
        this.themes = ['light', 'dark', 'auto'];
        this.currentTheme = 'auto';
        this.init();
    }
    
    init() {
        // Load saved theme
        this.loadTheme();
        
        // Apply theme
        this.applyTheme();
        
        // Listen for system theme changes
        if (window.matchMedia) {
            this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.mediaQuery.addEventListener('change', () => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme();
                }
            });
        }
    }
    
    /**
     * Load theme from storage
     */
    loadTheme() {
        try {
            const saved = localStorage.getItem('promptcraft_theme');
            if (saved && this.themes.includes(saved)) {
                this.currentTheme = saved;
            }
        } catch (error) {
            console.warn('Failed to load theme:', error);
        }
    }
    
    /**
     * Save theme to storage
     */
    saveTheme() {
        try {
            localStorage.setItem('promptcraft_theme', this.currentTheme);
        } catch (error) {
            console.warn('Failed to save theme:', error);
        }
    }
    
    /**
     * Apply current theme
     */
    applyTheme() {
        let themeToApply = this.currentTheme;
        
        if (themeToApply === 'auto') {
            // Use system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                themeToApply = 'dark';
            } else {
                themeToApply = 'light';
            }
        }
        
        document.documentElement.setAttribute('data-theme', themeToApply);
        
        // Dispatch theme change event
        this.dispatchEvent('themechanged', { theme: themeToApply });
    }
    
    /**
     * Set theme
     */
    setTheme(theme) {
        if (!this.themes.includes(theme)) {
            console.error('Invalid theme:', theme);
            return false;
        }
        
        this.currentTheme = theme;
        this.saveTheme();
        this.applyTheme();
        
        if (window.showNotification) {
            showNotification(`Theme changed to ${theme}`, 'success');
        }
        return true;
    }
    
    /**
     * Get current theme
     */
    getTheme() {
        return this.currentTheme;
    }
    
    /**
     * Toggle between light and dark
     */
    toggleTheme() {
        if (this.currentTheme === 'auto') {
            // If auto, toggle based on current system preference
            const systemPrefersDark = window.matchMedia && 
                window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(systemPrefersDark ? 'light' : 'dark');
        } else {
            this.setTheme(this.currentTheme === 'dark' ? 'light' : 'dark');
        }
    }
    
    /**
     * Get available themes
     */
    getAvailableThemes() {
        return this.themes;
    }
    
    /**
     * Get theme display name
     */
    getThemeDisplayName(theme) {
        const names = {
            'light': 'Light',
            'dark': 'Dark',
            'auto': 'Auto (System)'
        };
        return names[theme] || theme;
    }
    
    /**
     * Dispatch custom event
     */
    dispatchEvent(name, detail = {}) {
        const event = new CustomEvent(`theme:${name}`, {
            detail: { ...detail, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }
}

// Create singleton instance
window.themeManager = new ThemeManager();

// Make class globally available
window.ThemeManager = ThemeManager;
