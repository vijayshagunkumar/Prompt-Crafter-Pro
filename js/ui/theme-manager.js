import { APP_CONFIG } from '../core/constants.js';

export class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.load();
  }
  
  load() {
    // Load saved theme or default to dark
    this.currentTheme = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.THEME) || 'dark';
    this.applyTheme();
  }
  
  applyTheme() {
    document.body.className = `theme-${this.currentTheme}`;
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.THEME, this.currentTheme);
  }
  
  setTheme(theme) {
    if (['light', 'dark', 'cyberpunk'].includes(theme)) {
      this.currentTheme = theme;
      this.applyTheme();
    }
  }
  
  toggleTheme() {
    const themes = ['light', 'dark', 'cyberpunk'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }
  
  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Singleton instance
export const themeManager = new ThemeManager();
