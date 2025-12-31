// Theme Manager - Complete
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
        return this.storage.loadTheme() || 'auto';
    }

    saveTheme(theme) {
        this.currentTheme = theme;
        this.storage.saveTheme(theme);
        return theme;
    }

    applyTheme(theme) {
        const actualTheme = theme === 'auto' ? 
            (this.systemPrefersDark ? 'dark' : 'light') : 
            theme;
        
        document.body.className = actualTheme === 'dark' ? 'dark-theme' : '';
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
            primary: isDark ? '#4F46E5' : '#4F46E5',
            background: isDark ? '#0F172A' : '#F8FAFC',
            card: isDark ? '#1E293B' : '#FFFFFF',
            text: isDark ? '#F1F5F9' : '#0F172A',
            border: isDark ? '#334155' : '#E2E8F0'
        };
    }

    setCSSVariables() {
        const colors = this.getThemeColors();
        const root = document.documentElement;
        
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value);
        });
    }

    destroy() {
        if (this.mediaQueryHandler) {
            window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.mediaQueryHandler);
        }
    }
}

window.ThemeManager = ThemeManager;
