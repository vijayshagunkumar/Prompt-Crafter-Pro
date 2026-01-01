// theme-manager.js - Theme management
(function() {
    'use strict';
    
    class ThemeManager {
        constructor() {
            this.themes = {
                dark: {
                    name: 'Dark',
                    class: 'dark-theme',
                    colors: {
                        primary: '#8B5CF6',
                        secondary: '#10B981',
                        accent: '#F59E0B',
                        background: '#0F172A',
                        surface: '#1E293B',
                        text: '#F1F5F9',
                        textSecondary: '#94A3B8'
                    }
                },
                light: {
                    name: 'Light',
                    class: 'light-theme',
                    colors: {
                        primary: '#7C3AED',
                        secondary: '#059669',
                        accent: '#D97706',
                        background: '#F8FAFC',
                        surface: '#FFFFFF',
                        text: '#1E293B',
                        textSecondary: '#64748B'
                    }
                }
            };
            
            this.currentTheme = 'dark';
        }
        
        apply(themeName) {
            const theme = this.themes[themeName];
            if (!theme) return false;
            
            // Remove existing theme classes
            Object.values(this.themes).forEach(t => {
                document.body.classList.remove(t.class);
            });
            
            // Apply new theme
            document.body.classList.add(theme.class);
            this.currentTheme = themeName;
            
            // Update CSS variables
            this.updateCSSVariables(theme);
            
            // Save to storage
            localStorage.setItem('promptCraft_theme', themeName);
            
            return true;
        }
        
        updateCSSVariables(theme) {
            const root = document.documentElement;
            
            root.style.setProperty('--primary-color', theme.colors.primary);
            root.style.setProperty('--secondary-color', theme.colors.secondary);
            root.style.setProperty('--accent-color', theme.colors.accent);
            root.style.setProperty('--background-color', theme.colors.background);
            root.style.setProperty('--surface-color', theme.colors.surface);
            root.style.setProperty('--text-primary', theme.colors.text);
            root.style.setProperty('--text-secondary', theme.colors.textSecondary);
        }
        
        getCurrentTheme() {
            return this.themes[this.currentTheme];
        }
        
        toggle() {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            return this.apply(newTheme);
        }
        
        loadSavedTheme() {
            const savedTheme = localStorage.getItem('promptCraft_theme');
            if (savedTheme && this.themes[savedTheme]) {
                this.apply(savedTheme);
                return savedTheme;
            }
            
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                this.apply('light');
                return 'light';
            }
            
            // Default to dark
            this.apply('dark');
            return 'dark';
        }
        
        createCustomTheme(name, colors) {
            const themeId = 'custom_' + Date.now();
            this.themes[themeId] = {
                name: name,
                class: 'custom-theme-' + themeId,
                colors: colors
            };
            return themeId;
        }
    }
    
    // Export to global scope
    window.ThemeManager = ThemeManager;
    
})();
