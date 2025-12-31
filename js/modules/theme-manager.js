/**
 * Theme Manager
 * Handles theme switching and management
 */
class ThemeManager {
    constructor() {
        this.storage = new StorageService();
        this.themes = window.THEMES || [];
        this.currentTheme = this.loadTheme();
        this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupMediaQueryListener();
    }

    loadTheme() {
        try {
            return this.storage.get('theme', 'dark');
        } catch (error) {
            console.error('Error loading theme:', error);
            return 'dark';
        }
    }

    saveTheme(theme) {
        this.currentTheme = theme;
        return this.storage.set('theme', theme);
    }

    applyTheme(theme) {
        const actualTheme = theme === 'auto' ? 
            (this.systemPrefersDark ? 'dark' : 'light') : 
            theme;
        
        if (actualTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        
        this.emitThemeChange(actualTheme);
        return actualTheme;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getActualTheme() {
        if (this.currentTheme === 'auto') {
            return this.systemPrefersDark ? 'dark' : 'light';
        }
        return this.currentTheme;
    }

    setTheme(theme) {
        if (!this.themes.find(t => t.id === theme) && theme !== 'auto') {
            console.warn(`Theme ${theme} not found`);
            return false;
        }
        
        this.saveTheme(theme);
        this.applyTheme(theme);
        
        if (window.notification) {
            const themeName = this.getThemeName(theme);
            window.notification.success(`Theme changed to ${themeName}`);
        }
        
        return true;
    }

    toggleTheme() {
        const current = this.getActualTheme();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        return this.setTheme(newTheme);
    }

    toggleAutoTheme() {
        const current = this.getCurrentTheme();
        if (current === 'auto') {
            return this.setTheme('dark');
        } else {
            return this.setTheme('auto');
        }
    }

    getThemeName(themeId) {
        if (themeId === 'auto') {
            return 'Auto (System)';
        }
        
        const theme = this.themes.find(t => t.id === themeId);
        return theme ? theme.name : themeId;
    }

    getAvailableThemes() {
        return [
            { id: 'auto', name: 'Auto (System)', mood: 'Follows System Preference', icon: 'fa-robot' },
            ...this.themes
        ];
    }

    renderThemeSelector(selectElement) {
        if (!selectElement) return;
        
        selectElement.innerHTML = '';
        
        this.getAvailableThemes().forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = theme.name;
            if (theme.id === this.currentTheme) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
        
        selectElement.addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });
    }

    setupMediaQueryListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handler = (e) => {
            this.systemPrefersDark = e.matches;
            if (this.currentTheme === 'auto') {
                this.applyTheme('auto');
            }
        };
        
        mediaQuery.addEventListener('change', handler);
        
        this.mediaQueryHandler = handler;
    }

    emitThemeChange(theme) {
        const event = new CustomEvent('themechange', {
            detail: { theme }
        });
        document.dispatchEvent(event);
    }

    isDark() {
        return this.getActualTheme() === 'dark';
    }

    isLight() {
        return this.getActualTheme() === 'light';
    }

    getThemeColors() {
        const isDark = this.isDark();
        return {
            primary: '#4F46E5',
            background: isDark ? '#0F172A' : '#F8FAFC',
            card: isDark ? '#1E293B' : '#FFFFFF',
            text: isDark ? '#F1F5F9' : '#0F172A',
            border: isDark ? '#334155' : '#E2E8F0'
        };
    }

    destroy() {
        if (this.mediaQueryHandler) {
            window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.mediaQueryHandler);
        }
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
} else {
    window.ThemeManager = ThemeManager;
}
