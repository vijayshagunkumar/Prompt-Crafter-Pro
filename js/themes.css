// Theme System for PromptCraft

document.addEventListener('DOMContentLoaded', function() {
    const htmlElement = document.documentElement;
    const themeSamples = document.querySelectorAll('.theme-sample');
    const particlesContainer = document.getElementById('particles');
    
    // Theme configuration
    const themes = [
        { 
            id: 'sunset-glow', 
            name: 'Sunset Glow', 
            mood: 'Warm & Inviting'
        },
        { 
            id: 'aurora-magic', 
            name: 'Aurora Magic', 
            mood: 'Magical & Dreamy'
        },
        { 
            id: 'serenity-bliss', 
            name: 'Serenity Bliss', 
            mood: 'Calm & Peaceful'
        },
        { 
            id: 'cyberpunk-neon', 
            name: 'Cyberpunk Neon', 
            mood: 'Energetic & Futuristic'
        },
        { 
            id: 'ocean-deep', 
            name: 'Ocean Deep', 
            mood: 'Professional & Deep'
        },
        { 
            id: 'auto', 
            name: 'Auto (System)', 
            mood: 'System Matched'
        }
    ];
    
    // Get saved theme or default to sunset-glow
    function getSavedTheme() {
        const savedTheme = localStorage.getItem('appTheme');
        return savedTheme || 'sunset-glow';
    }
    
    // Create floating particles
    function createParticles() {
        if (!particlesContainer) return;
        particlesContainer.innerHTML = '';
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random properties
            const size = Math.random() * 10 + 3;
            const posX = Math.random() * 100;
            const duration = Math.random() * 20 + 15;
            const delay = Math.random() * 5;
            
            // Apply styles
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.background = getComputedStyle(htmlElement).getPropertyValue('--primary-color');
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;
            
            particlesContainer.appendChild(particle);
        }
    }
    
    // Function to set theme
    function setTheme(themeId, animate = true) {
        if (animate) {
            document.body.classList.remove('theme-change');
            void document.body.offsetWidth; // Trigger reflow
            document.body.classList.add('theme-change');
        }
        
        // Handle auto theme
        if (themeId === 'auto') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const autoTheme = systemPrefersDark ? 'aurora-magic' : 'serenity-bliss';
            htmlElement.setAttribute('data-app-theme', autoTheme);
        } else {
            htmlElement.setAttribute('data-app-theme', themeId);
        }
        
        // Save to localStorage
        localStorage.setItem('appTheme', themeId);
        
        // Update UI
        updateThemeUI(themeId);
        
        // Recreate particles with new colors
        setTimeout(() => createParticles(), 300);
    }
    
    // Update UI elements
    function updateThemeUI(themeId) {
        const theme = themes.find(t => t.id === themeId);
        if (!theme) return;
        
        // Update active samples
        themeSamples.forEach(sample => {
            sample.classList.remove('active');
            if (sample.getAttribute('data-theme') === themeId) {
                sample.classList.add('active');
            }
        });
        
        // Update logo shadow
        const logoImg = document.querySelector('.hero-logo img');
        if (logoImg) {
            logoImg.style.boxShadow = `0 6px 16px rgba(var(--primary-rgb), 0.2)`;
        }
        
        // Update theme label
        const themeLabel = document.querySelector('.theme-label');
        if (themeLabel) {
            themeLabel.innerHTML = `<i class="fas fa-palette"></i> ${theme.name}:`;
        }
    }
    
    // Initialize theme
    const initialTheme = getSavedTheme();
    setTheme(initialTheme, false);
    createParticles();
    
    // Theme sample clicks
    themeSamples.forEach(sample => {
        sample.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            setTheme(theme);
        });
    });
    
    // System theme change listener for auto theme
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        const currentTheme = localStorage.getItem('appTheme');
        if (currentTheme === 'auto') {
            setTheme('auto');
        }
    });
    
    // Add floating particles periodically
    setInterval(() => {
        if (Math.random() > 0.7) {
            createParticles();
        }
    }, 20000);
});
