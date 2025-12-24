// theme-manager.js - Complete Theme Management System

const themes = [
  { 
    id: 'cyberpunk-neon', 
    name: 'Cyberpunk Neon', 
    mood: 'Energetic & Futuristic',
    icon: 'fas fa-bolt'
  },
  { 
    id: 'sunset-glow', 
    name: 'Sunset Glow', 
    mood: 'Warm & Inviting',
    icon: 'fas fa-sun'
  },
  { 
    id: 'aurora-magic', 
    name: 'Aurora Magic', 
    mood: 'Magical & Dreamy',
    icon: 'fas fa-magic'
  },
  { 
    id: 'serenity-bliss', 
    name: 'Serenity Bliss', 
    mood: 'Calm & Peaceful',
    icon: 'fas fa-spa'
  },
  { 
    id: 'ocean-deep', 
    name: 'Ocean Deep', 
    mood: 'Professional & Deep',
    icon: 'fas fa-water'
  },
  { 
    id: 'matrix', 
    name: 'The Matrix', 
    mood: 'Green digital rain style',
    icon: 'fas fa-terminal'
  },
  { 
    id: 'cybernoir', 
    name: 'Cyber Noir', 
    mood: 'Black/white/red noir style',
    icon: 'fas fa-film'
  },
  { 
    id: 'neon-dream', 
    name: 'Neon Dream', 
    mood: 'Magenta and cyan neon lights',
    icon: 'fas fa-star'
  },
  { 
    id: 'vaporwave', 
    name: 'Vaporwave', 
    mood: 'Pink/cyan aesthetic nostalgia',
    icon: 'fas fa-cloud'
  },
  { 
    id: 'toxic-green', 
    name: 'Toxic Green', 
    mood: 'Neon toxic green glow',
    icon: 'fas fa-skull-crossbones'
  },
  { 
    id: 'solar-flare', 
    name: 'Solar Flare', 
    mood: 'Orange and gold solar energy',
    icon: 'fas fa-fire'
  },
  { 
    id: 'deep-space', 
    name: 'Deep Space', 
    mood: 'Cosmic purple and blue space',
    icon: 'fas fa-rocket'
  },
  { 
    id: 'monochrome', 
    name: 'Monochrome', 
    mood: 'Black and white minimal',
    icon: 'fas fa-moon'
  },
  { 
    id: 'auto', 
    name: 'Auto (System)', 
    mood: 'Follows system preference',
    icon: 'fas fa-robot'
  }
];

// Initialize theme system
function initThemeSystem() {
  // Load saved theme or default
  const savedTheme = localStorage.getItem('selectedTheme') || 'cyberpunk-neon';
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Apply theme
  setTheme(savedTheme);
  
  // Update theme button
  updateThemeButton(savedTheme);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (document.documentElement.getAttribute('data-theme') === 'auto') {
      setTheme('auto');
    }
  });
  
  console.log('Theme system initialized with:', savedTheme);
}

// Set theme function
function setTheme(themeId) {
  // Validate theme
  const theme = themes.find(t => t.id === themeId);
  if (!theme) {
    console.warn(`Theme "${themeId}" not found, using default`);
    themeId = 'cyberpunk-neon';
  }
  
  // Apply theme to document
  document.documentElement.setAttribute('data-theme', themeId);
  
  // Save to localStorage
  localStorage.setItem('selectedTheme', themeId);
  
  // Update UI
  updateThemeButton(themeId);
  
  // Show notification
  showThemeNotification(theme);
  
  // Dispatch theme change event
  document.dispatchEvent(new CustomEvent('themechange', { 
    detail: { theme: themeId, themeData: theme }
  }));
  
  console.log(`Theme changed to: ${themeId}`);
}

// Update theme button text
function updateThemeButton(themeId) {
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      themeBtn.innerHTML = `<i class="fas fa-palette"></i> ${theme.name}`;
    }
  }
}

// Show theme notification
function showThemeNotification(theme) {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.innerHTML = `
      <i class="fas fa-palette"></i>
      <span>Theme changed to "${theme.name}"</span>
    `;
    notification.style.display = 'flex';
    
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }
}

// Initialize theme modal
function initThemeModal() {
  const themeGrid = document.getElementById('themeGrid');
  if (!themeGrid) return;
  
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'cyberpunk-neon';
  
  // Clear and populate theme grid
  themeGrid.innerHTML = themes.map(theme => {
    const isActive = theme.id === currentTheme;
    return `
      <div class="theme-card ${isActive ? 'active' : ''}" 
           data-theme-id="${theme.id}"
           title="${theme.mood}">
        <div class="theme-card-preview ${theme.id}-preview">
          ${getThemePreview(theme.id)}
        </div>
        <div class="theme-card-info">
          <div class="theme-card-name">
            <i class="${theme.icon}"></i>
            ${theme.name}
          </div>
          <div class="theme-card-mood">${theme.mood}</div>
        </div>
        ${isActive ? '<div class="theme-card-badge active-badge">Active</div>' : ''}
        ${theme.id === 'auto' ? '<div class="theme-card-badge system-badge">System</div>' : ''}
      </div>
    `;
  }).join('');
  
  // Add click handlers to theme cards
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const themeId = card.dataset.themeId;
      setTheme(themeId);
      
      // Update active state
      document.querySelectorAll('.theme-card').forEach(c => 
        c.classList.remove('active'));
      card.classList.add('active');
      
      // Update badges
      document.querySelectorAll('.theme-card-badge.active-badge').forEach(badge => 
        badge.remove());
      card.insertAdjacentHTML('beforeend', 
        '<div class="theme-card-badge active-badge">Active</div>');
      
      // Update current theme display
      const theme = themes.find(t => t.id === themeId);
      if (theme) {
        document.getElementById('currentThemeName').textContent = theme.name;
        document.getElementById('currentThemeMood').textContent = theme.mood;
      }
    });
  });
}

// Get theme preview HTML
function getThemePreview(themeId) {
  switch(themeId) {
    case 'cyberpunk-neon':
      return '<div class="circuit-overlay"><div class="circuit-line-h"></div><div class="circuit-line-v"></div></div>';
    case 'sunset-glow':
      return '<div class="sun-overlay"></div>';
    case 'aurora-magic':
      return '<div class="aurora-overlay"></div>';
    case 'serenity-bliss':
      return '<div class="leaf-overlay"></div>';
    case 'ocean-deep':
      return '<div class="wave-overlay"></div>';
    case 'matrix':
      return '<div class="circuit-overlay" style="opacity:0.4;"><div class="circuit-line-h" style="background:#00FF41;"></div><div class="circuit-line-v" style="background:#00FF41;"></div></div>';
    case 'cybernoir':
      return '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;color:white;opacity:0.8;">🎬</div>';
    case 'neon-dream':
      return '<div class="circuit-overlay" style="opacity:0.6;"><div class="circuit-line-h" style="background:#FF00FF;"></div><div class="circuit-line-v" style="background:#00FFFF;"></div></div>';
    case 'vaporwave':
      return '<div class="aurora-overlay" style="background:linear-gradient(45deg, transparent 30%, rgba(255,113,206,0.4) 50%, transparent 70%);"></div>';
    case 'toxic-green':
      return '<div class="circuit-overlay" style="opacity:0.6;"><div class="circuit-line-h" style="background:#39FF14;"></div><div class="circuit-line-v" style="background:#CCFF00;"></div></div>';
    case 'solar-flare':
      return '<div class="sun-overlay" style="background:radial-gradient(circle, #FFD700, transparent 70%);"></div>';
    case 'deep-space':
      return '<div class="aurora-overlay" style="background:linear-gradient(45deg, transparent 30%, rgba(65,105,225,0.4) 50%, transparent 70%);"></div>';
    case 'monochrome':
      return '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;color:white;opacity:0.8;">⚫⚪</div>';
    case 'auto':
      return '<div class="auto-icon"><i class="fas fa-desktop"></i></div>';
    default:
      return '<div class="circuit-overlay"><div class="circuit-line-h"></div><div class="circuit-line-v"></div></div>';
  }
}

// Open theme modal
function openThemeModal() {
  const modal = document.getElementById('themeModal');
  if (!modal) return;
  
  // Initialize theme grid
  initThemeModal();
  
  // Update current theme display
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'cyberpunk-neon';
  const theme = themes.find(t => t.id === currentTheme);
  if (theme) {
    document.getElementById('currentThemeName').textContent = theme.name;
    document.getElementById('currentThemeMood').textContent = theme.mood;
  }
  
  // Show modal
  modal.style.display = 'block';
  
  // Add close handler
  const closeBtn = document.getElementById('closeThemeBtn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };
  }
  
  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
  
  // Close on escape key
  document.addEventListener('keydown', function closeOnEscape(e) {
    if (e.key === 'Escape') {
      modal.style.display = 'none';
      document.removeEventListener('keydown', closeOnEscape);
    }
  });
}

// Close theme modal
function closeThemeModal() {
  const modal = document.getElementById('themeModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Reset to default theme
function resetToDefaultTheme() {
  setTheme('cyberpunk-neon');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme system
  initThemeSystem();
  
  // Setup theme button click handler
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', openThemeModal);
  }
  
  // Setup reset button in modal
  const resetBtn = document.querySelector('.btn-primary[onclick*="setTheme"]');
  if (resetBtn) {
    resetBtn.onclick = resetToDefaultTheme;
  }
  
  // Setup close button
  const closeBtn = document.getElementById('closeThemeBtn');
  if (closeBtn) {
    closeBtn.onclick = closeThemeModal;
  }
  
  // Close modal on backdrop click
  const modal = document.getElementById('themeModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeThemeModal();
      }
    });
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    themes,
    setTheme,
    initThemeSystem,
    getThemePreview
  };
}
