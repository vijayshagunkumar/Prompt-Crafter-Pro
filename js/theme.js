// theme.js - Complete Theme System for PromptCraft
document.addEventListener('DOMContentLoaded', function() {
    const htmlElement = document.documentElement;
    const themeModal = document.getElementById('themeModal');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const closeThemeBtn = document.getElementById('closeThemeBtn');
    const particlesContainer = document.getElementById('particles');
    
    // Theme configuration
    const themes = [
        { 
            id: 'cyberpunk-neon', 
            name: 'Cyberpunk Neon', 
            mood: 'Energetic & Futuristic',
            icon: 'fa-bolt'
        },
        { 
            id: 'sunset-glow', 
            name: 'Sunset Glow', 
            mood: 'Warm & Inviting',
            icon: 'fa-sun'
        },
        { 
            id: 'aurora-magic', 
            name: 'Aurora Magic', 
            mood: 'Magical & Dreamy',
            icon: 'fa-magic'
        },
        { 
            id: 'serenity-bliss', 
            name: 'Serenity Bliss', 
            mood: 'Calm & Peaceful',
            icon: 'fa-spa'
        },
        { 
            id: 'ocean-deep', 
            name: 'Ocean Deep', 
            mood: 'Professional & Deep',
            icon: 'fa-water'
        },
        { 
            id: 'auto', 
            name: 'Auto (System)', 
            mood: 'Follows System Preference',
            icon: 'fa-robot'
        }
    ];
    
    // Get saved theme or default to cyberpunk-neon
    function getSavedTheme() {
        const savedTheme = localStorage.getItem('appTheme');
        return savedTheme || 'cyberpunk-neon';
    }
    
    // Create floating particles
    function createParticles() {
        if (!particlesContainer) return;
        particlesContainer.innerHTML = '';
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 10 + 3;
            const posX = Math.random() * 100;
            const duration = Math.random() * 20 + 15;
            const delay = Math.random() * 5;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.background = getComputedStyle(htmlElement).getPropertyValue('--primary');
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;
            
            particlesContainer.appendChild(particle);
        }
    }
    
    // Function to set theme
    function setTheme(themeId, animate = true) {
        if (animate) {
            document.body.classList.remove('theme-change');
            void document.body.offsetWidth;
            document.body.classList.add('theme-change');
        }
        
        let actualTheme = themeId;
        if (themeId === 'auto') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            actualTheme = systemPrefersDark ? 'aurora-magic' : 'serenity-bliss';
            htmlElement.setAttribute('data-app-theme', actualTheme);
        } else {
            htmlElement.setAttribute('data-app-theme', actualTheme);
        }
        
        localStorage.setItem('appTheme', themeId);
        updateThemeUI(themeId);
        
        setTimeout(() => createParticles(), 300);
        
        if (themeModal) {
            themeModal.style.display = 'none';
        }
        
        const theme = themes.find(t => t.id === themeId);
        showNotification(`Theme changed to ${theme.name}`);
    }
    
    // Update theme UI
    function updateThemeUI(themeId) {
        const theme = themes.find(t => t.id === themeId);
        if (!theme) return;
        
        const currentThemeName = document.getElementById('currentThemeName');
        const currentThemeMood = document.getElementById('currentThemeMood');
        
        if (currentThemeName) currentThemeName.textContent = theme.name;
        if (currentThemeMood) currentThemeMood.textContent = theme.mood;
        
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.remove('active');
            if (card.dataset.theme === themeId) card.classList.add('active');
        });
        
        if (themeToggleBtn) {
            themeToggleBtn.style.background = `linear-gradient(135deg, 
                rgba(${getComputedStyle(htmlElement).getPropertyValue('--primary-rgb')}, 0.2), 
                rgba(${getComputedStyle(htmlElement).getPropertyValue('--primary-rgb')}, 0.4))`;
        }
    }
    
    // Show notification
    function showNotification(message) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        const textEl = document.getElementById('notificationText');
        if (textEl) textEl.textContent = message;
        
        notification.style.display = "flex";
        setTimeout(() => notification.classList.add("show"), 10);

        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => notification.style.display = "none", 300);
        }, 2000);
    }
    
    // Initialize theme
    const initialTheme = getSavedTheme();
    setTheme(initialTheme, false);
    createParticles();
    
    // Theme modal event listeners
    if (themeToggleBtn && themeModal) {
        themeToggleBtn.addEventListener('click', () => {
            themeModal.style.display = 'flex';
            updateThemeUI(getSavedTheme());
        });
    }
    
    if (closeThemeBtn && themeModal) {
        closeThemeBtn.addEventListener('click', () => {
            themeModal.style.display = 'none';
        });
    }
    
    if (themeModal) {
        themeModal.addEventListener('click', (e) => {
            if (e.target === themeModal) themeModal.style.display = 'none';
        });
    }
    
    // Theme card click listeners
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', function() {
            const theme = this.dataset.theme;
            setTheme(theme);
        });
    });
    
    // System theme change listener
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        const currentTheme = localStorage.getItem('appTheme');
        if (currentTheme === 'auto') setTheme('auto');
    });
    
    // Refresh particles periodically
    setInterval(() => {
        if (Math.random() > 0.7) createParticles();
    }, 20000);
    
    window.setTheme = setTheme;
});
