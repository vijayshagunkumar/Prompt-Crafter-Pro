// theme-manager.js - Theme system management
export class ThemeManager {
    constructor() {
        this.themes = {
            dark: {
                name: 'Cyberpunk',
                mood: 'Futuristic neon interface',
                primary: '#FF5E00',
                secondary: '#00F3FF',
                accent: '#8A2BE2',
                bg: '#0A0E17',
                preview: 'cyberpunk-neon-preview'
            },
            light: {
                name: 'Light',
                mood: 'Clean minimal interface',
                primary: '#3B82F6',
                secondary: '#10B981',
                accent: '#8B5CF6',
                bg: '#F8FAFC',
                preview: 'light-preview'
            },
            sunset: {
                name: 'Sunset Glow',
                mood: 'Warm sunset tones',
                primary: '#FF6B35',
                secondary: '#FFA500',
                accent: '#FFD700',
                bg: '#0F172A',
                preview: 'sunset-glow-preview'
            },
            aurora: {
                name: 'Aurora Magic',
                mood: 'Northern lights magic',
                primary: '#8A2BE2',
                secondary: '#00CED1',
                accent: '#7CFC00',
                bg: '#0A0A1A',
                preview: 'aurora-magic-preview'
            }
        };
        
        this.currentTheme = 'dark';
    }

    apply(theme) {
        if (!this.themes[theme]) {
            console.warn(`Theme "${theme}" not found, using default`);
            theme = 'dark';
        }

        this.currentTheme = theme;
        
        // Update data attribute on body
        document.body.setAttribute('data-theme', theme);
        
        // Update CSS variables
        this.updateCSSVariables(theme);
        
        // Save to localStorage
        localStorage.setItem('promptCraftTheme', theme);
        
        // Update theme display if exists
        this.updateThemeDisplay();
        
        return theme;
    }

    updateCSSVariables(theme) {
        const themeData = this.themes[theme];
        const root = document.documentElement;
        
        // Update CSS variables
        root.style.setProperty('--primary', themeData.primary);
        root.style.setProperty('--secondary', themeData.secondary);
        root.style.setProperty('--accent', themeData.accent);
        root.style.setProperty('--bg-body', themeData.bg);
        
        // Update RGB values
        const primaryRGB = this.hexToRgb(themeData.primary);
        const secondaryRGB = this.hexToRgb(themeData.secondary);
        const accentRGB = this.hexToRgb(themeData.accent);
        
        if (primaryRGB) {
            root.style.setProperty('--primary-rgb', primaryRGB.join(', '));
        }
        
        if (secondaryRGB) {
            root.style.setProperty('--secondary-rgb', secondaryRGB.join(', '));
        }
        
        if (accentRGB) {
            root.style.setProperty('--accent-rgb', accentRGB.join(', '));
        }
    }

    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse hex values
        let r, g, b;
        
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else {
            return null;
        }
        
        return [r, g, b];
    }

    updateThemeDisplay() {
        const themeDisplay = document.getElementById('themeDisplay');
        if (themeDisplay) {
            themeDisplay.textContent = `${this.themes[this.currentTheme].name} Theme`;
        }
    }

    getCurrentTheme() {
        return {
            id: this.currentTheme,
            ...this.themes[this.currentTheme]
        };
    }

    getAllThemes() {
        return Object.entries(this.themes).map(([id, theme]) => ({
            id,
            ...theme
        }));
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('promptCraftTheme');
        if (savedTheme && this.themes[savedTheme]) {
            this.apply(savedTheme);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.apply(prefersDark ? 'dark' : 'light');
        }
    }

    createThemeCard(themeId, themeData, isActive = false) {
        const card = document.createElement('div');
        card.className = `theme-card ${isActive ? 'active' : ''}`;
        card.dataset.theme = themeId;
        
        card.innerHTML = `
            <div class="theme-card-preview ${themeData.preview}">
                ${this.getThemePreviewOverlay(themeId)}
            </div>
            <div class="theme-card-info">
                <div class="theme-card-name">
                    <i class="fas fa-palette"></i>
                    ${themeData.name}
                </div>
                <div class="theme-card-mood">${themeData.mood}</div>
            </div>
            ${isActive ? '<div class="theme-card-badge active-badge">Active</div>' : ''}
        `;
        
        return card;
    }

    getThemePreviewOverlay(themeId) {
        const overlays = {
            dark: `
                <div class="circuit-overlay">
                    <div class="circuit-line-h"></div>
                    <div class="circuit-line-v"></div>
                </div>
            `,
            sunset: `
                <div class="sun-overlay"></div>
            `,
            aurora: `
                <div class="aurora-overlay"></div>
            `,
            light: `
                <div class="leaf-overlay"></div>
            `
        };
        
        return overlays[themeId] || '';
    }

    setupThemeModal() {
        const themeGrid = document.getElementById('themeGrid');
        if (!themeGrid) return;
        
        themeGrid.innerHTML = '';
        
        const allThemes = this.getAllThemes();
        allThemes.forEach(theme => {
            const isActive = theme.id === this.currentTheme;
            const card = this.createThemeCard(theme.id, theme, isActive);
            
            card.addEventListener('click', () => {
                this.apply(theme.id);
                this.closeThemeModal();
                
                // Update notification
                if (window.app?.notificationService) {
                    window.app.notificationService.show(`Theme changed to ${theme.name}`, 'info');
                }
            });
            
            themeGrid.appendChild(card);
        });
    }

    openThemeModal() {
        const modal = document.getElementById('themeModal');
        if (modal) {
            this.setupThemeModal();
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.style.opacity = '1';
            }, 10);
        }
    }

    closeThemeModal() {
        const modal = document.getElementById('themeModal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    initThemeToggle() {
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                this.openThemeModal();
            });
        }
        
        // Close modal on backdrop click
        const modal = document.getElementById('themeModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeThemeModal();
                }
            });
        }
        
        // Close button
        const closeBtn = document.getElementById('closeThemeBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeThemeModal();
            });
        }
    }
}
