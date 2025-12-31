// Theme Manager - Complete Fixed Version
class ThemeManager {
    constructor() {
        this.storage = new StorageService();
        this.themes = [
            { 
                id: 'cyberpunk', 
                name: 'Cyberpunk Neon', 
                primary: '#ff00ff',
                secondary: '#00ffff',
                background: '#0a0a0a',
                card: '#1a1a2e',
                text: '#ffffff',
                icon: 'fa-bolt'
            },
            { 
                id: 'sunset', 
                name: 'Sunset Glow', 
                primary: '#ff6b6b',
                secondary: '#ffa726',
                background: '#fff3e0',
                card: '#ffffff',
                text: '#333333',
                icon: 'fa-sun'
            },
            { 
                id: 'ocean', 
                name: 'Ocean Deep', 
                primary: '#2196f3',
                secondary: '#00bcd4',
                background: '#e3f2fd',
                card: '#ffffff',
                text: '#1565c0',
                icon: 'fa-water'
            },
            { 
                id: 'forest', 
                name: 'Forest Green', 
                primary: '#4caf50',
                secondary: '#8bc34a',
                background: '#f1f8e9',
                card: '#ffffff',
                text: '#2e7d32',
                icon: 'fa-tree'
            },
            { 
                id: 'midnight', 
                name: 'Midnight Blue', 
                primary: '#5c6bc0',
                secondary: '#7986cb',
                background: '#1a237e',
                card: '#283593',
                text: '#e8eaf6',
                icon: 'fa-moon'
            },
            { 
                id: 'rose', 
                name: 'Rose Gold', 
                primary: '#e91e63',
                secondary: '#ff4081',
                background: '#fce4ec',
                card: '#ffffff',
                text: '#880e4f',
                icon: 'fa-heart'
            }
        ];
        
        this.currentTheme = this.loadTheme();
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupThemeSelector();
    }

    loadTheme() {
        return this.storage.get('theme', 'dark');
    }

    saveTheme(theme) {
        this.currentTheme = theme;
        return this.storage.set('theme', theme);
    }

    applyTheme(themeId) {
        // Remove all theme classes
        document.body.classList.remove('dark-theme', 'light-theme', 'cyberpunk-theme', 'sunset-theme', 'ocean-theme', 'forest-theme', 'midnight-theme', 'rose-theme');
        
        if (themeId === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (themeId === 'light') {
            document.body.classList.add('light-theme');
        } else {
            // Apply custom theme
            const theme = this.themes.find(t => t.id === themeId);
            if (theme) {
                document.body.classList.add(`${themeId}-theme`);
                this.applyCustomTheme(theme);
            } else {
                document.body.classList.add('dark-theme');
            }
        }
        
        this.saveTheme(themeId);
        this.dispatchThemeChange(themeId);
        
        // Update theme display
        const currentThemeEl = document.getElementById('currentTheme');
        if (currentThemeEl) {
            const themeName = this.getThemeName(themeId);
            currentThemeEl.textContent = themeName;
        }
    }

    applyCustomTheme(theme) {
        const root = document.documentElement;
        
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--primary-light', this.lightenColor(theme.primary, 20));
        root.style.setProperty('--primary-dark', this.darkenColor(theme.primary, 20));
        root.style.setProperty('--secondary', theme.secondary);
        root.style.setProperty('--bg-color', theme.background);
        root.style.setProperty('--card-bg', theme.card);
        root.style.setProperty('--text-primary', theme.text);
        
        // Update primary gradient
        root.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`);
        root.style.setProperty('--header-gradient', `linear-gradient(135deg, ${theme.primary} 0%, ${this.darkenColor(theme.primary, 30)} 100%)`);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return "#" + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
            (G > 0 ? G : 0) * 0x100 +
            (B > 0 ? B : 0)).toString(16).slice(1);
    }

    setupThemeSelector() {
        const themeSelect = document.getElementById('themeSelect');
        if (!themeSelect) return;
        
        // Clear existing options
        themeSelect.innerHTML = '';
        
        // Add default themes
        const defaultThemes = [
            { id: 'dark', name: 'Dark Theme' },
            { id: 'light', name: 'Light Theme' },
            { id: 'auto', name: 'Auto (System)' }
        ];
        
        defaultThemes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = theme.name;
            if (theme.id === this.currentTheme) {
                option.selected = true;
            }
            themeSelect.appendChild(option);
        });
        
        // Add custom themes
        this.themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = theme.name;
            if (theme.id === this.currentTheme) {
                option.selected = true;
            }
            themeSelect.appendChild(option);
        });
        
        // Add event listener
        themeSelect.addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
        });
    }

    getThemeName(themeId) {
        if (themeId === 'dark') return 'Dark';
        if (themeId === 'light') return 'Light';
        if (themeId === 'auto') return 'Auto';
        
        const theme = this.themes.find(t => t.id === themeId);
        return theme ? theme.name : 'Dark';
    }

    dispatchThemeChange(themeId) {
        const event = new CustomEvent('themechange', {
            detail: { theme: themeId }
        });
        document.dispatchEvent(event);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    toggleTheme() {
        const current = this.getCurrentTheme();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        return newTheme;
    }
}

window.ThemeManager = ThemeManager;
