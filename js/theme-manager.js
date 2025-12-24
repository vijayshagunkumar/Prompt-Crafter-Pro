// theme-manager.js - Complete Theme Management System

const themes = [
  { 
    id: 'cyberpunk', 
    name: 'Cyberpunk Core', 
    mood: 'Classic orange/cyan cyberpunk aesthetic',
    icon: 'fas fa-bolt'
  },
  { 
    id: 'sunset', 
    name: 'Sunset Orange', 
    mood: 'Warm sunset tones and gradients',
    icon: 'fas fa-sun'
  },
  { 
    id: 'aurora', 
    name: 'Aurora Purple', 
    mood: 'Purple and teal aurora effects',
    icon: 'fas fa-magic'
  },
  { 
    id: 'serenity', 
    name: 'Serenity Green', 
    mood: 'Calm green and blue nature tones',
    icon: 'fas fa-leaf'
  },
  { 
    id: 'ocean', 
    name: 'Ocean Blue', 
    mood: 'Deep ocean blues and waves',
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
    id: 'toxic', 
    name: 'Toxic Green', 
    mood: 'Neon toxic green glow',
    icon: 'fas fa-skull-crossbones'
  },
  { 
    id: 'solar', 
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
    icon: 'fas fa-adjust'
  }
];

// Initialize theme system
function initThemeSystem() {
  // Load saved theme or default
  const savedTheme = localStorage.getItem('selectedTheme') || 'cyberpunk';
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // If auto theme, determine based on system preference
  let initialTheme = savedTheme;
  if (savedTheme === 'auto') {
    initialTheme = systemPrefersDark ? 'cyberpunk' : 'cyberpunk';
  }
  
  // Apply theme
  setTheme(initialTheme);
  
  // Initialize theme modal if it exists
  if (document.getElementById('themeModal')) {
    initThemeModal();
  }
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (document.documentElement.getAttribute('data-theme') === 'auto') {
      setTheme('auto');
    }
  });
}

// Set theme function
function setTheme(themeId) {
  // Validate theme
  const theme = themes.find(t => t.id === themeId);
  if (!theme) {
    console.warn(`Theme "${themeId}" not found, using default`);
    themeId = 'cyberpunk';
  }
  
  // Apply theme to document
  document.documentElement.setAttribute('data-theme', themeId);
  
  // Save to localStorage
  localStorage.setItem('selectedTheme', themeId);
  
  // Update UI if needed
  updateThemeUI(themeId);
  
  // Dispatch theme change event
  document.dispatchEvent(new CustomEvent('themechange', { 
    detail: { theme: themeId, themeData: theme }
  }));
  
  console.log(`Theme changed to: ${themeId}`);
}

// Update UI elements with current theme
function updateThemeUI(themeId) {
  // Update theme button text if exists
  const themeBtn = document.querySelector('.theme-toggle-btn');
  if (themeBtn) {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      themeBtn.innerHTML = `<i class="fas fa-palette"></i> ${theme.name}`;
    }
  }
  
  // Update current theme display in modal if open
  const currentThemeName = document.getElementById('currentThemeName');
  const currentThemeMood = document.getElementById('currentThemeMood');
  if (currentThemeName && currentThemeMood) {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      currentThemeName.textContent = theme.name;
      currentThemeMood.textContent = theme.mood;
    }
  }
}

// Initialize theme modal
function initThemeModal() {
  const themeGrid = document.getElementById('themeGrid');
  if (!themeGrid) return;
  
  const currentTheme = document.documentElement.getAttribute('data-theme');
  
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
  
  // Add click handlers
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
      
      // Show notification
      const theme = themes.find(t => t.id === themeId);
      if (theme) {
        showNotification(`Theme changed to "${theme.name}"`);
      }
      
      // Close modal after selection (optional)
      setTimeout(() => {
        const modal = document.getElementById('themeModal');
        if (modal) {
          modal.style.display = 'none';
          document.getElementById('themeModalBackdrop').style.display = 'none';
        }
      }, 500);
    });
  });
}

// Get theme preview HTML
function getThemePreview(themeId) {
  switch(themeId) {
    case 'cyberpunk':
      return '<div class="circuit-overlay"><div class="circuit-line-h"></div><div class="circuit-line-v"></div></div>';
    case 'sunset':
      return '<div class="sun-overlay"></div>';
    case 'aurora':
      return '<div class="aurora-overlay"></div>';
    case 'serenity':
      return '<div class="leaf-overlay"></div>';
    case 'ocean':
      return '<div class="wave-overlay"></div>';
    case 'matrix':
      return '<div class="circuit-overlay" style="opacity:0.4;"><div class="circuit-line-h" style="background:#00FF41;"></div><div class="circuit-line-v" style="background:#00FF41;"></div></div>';
    case 'cybernoir':
      return '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;color:white;opacity:0.8;">🎬</div>';
    case 'neon-dream':
      return '<div class="circuit-overlay" style="opacity:0.6;"><div class="circuit-line-h" style="background:#FF00FF;"></div><div class="circuit-line-v" style="background:#00FFFF;"></div></div>';
    case 'vaporwave':
      return '<div class="aurora-overlay" style="background:linear-gradient(45deg, transparent 30%, rgba(255,113,206,0.4) 50%, transparent 70%);"></div>';
    case 'toxic':
      return '<div class="circuit-overlay" style="opacity:0.6;"><div class="circuit-line-h" style="background:#39FF14;"></div><div class="circuit-line-v" style="background:#CCFF00;"></div></div>';
    case 'solar':
      return '<div class="sun-overlay" style="background:radial-gradient(circle, #FFD700, transparent 70%);"></div>';
    case 'deep-space':
      return '<div class="aurora-overlay" style="background:linear-gradient(45deg, transparent 30%, rgba(65,105,225,0.4) 50%, transparent 70%);"></div>';
    case 'monochrome':
      return '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;color:white;opacity:0.8;">⚫⚪</div>';
    case 'auto':
      return '<div class="auto-icon">⚙️</div>';
    default:
      return '<div class="circuit-overlay"><div class="circuit-line-h"></div><div class="circuit-line-v"></div></div>';
  }
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  if (!notification) return;
  
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  notification.style.display = 'flex';
  
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// Theme switcher button handler
function setupThemeSwitcher() {
  const themeBtn = document.querySelector('.theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      openThemeModal();
    });
  }
}

// Open theme modal
function openThemeModal() {
  const modal = document.getElementById('themeModal');
  const backdrop = document.getElementById('themeModalBackdrop');
  if (!modal || !backdrop) return;
  
  // Refresh theme grid in case themes changed
  initThemeModal();
  
  modal.style.display = 'block';
  backdrop.style.display = 'block';
  
  // Update current theme display
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const theme = themes.find(t => t.id === currentTheme);
  if (theme) {
    document.getElementById('currentThemeName').textContent = theme.name;
    document.getElementById('currentThemeMood').textContent = theme.mood;
  }
}

// Close theme modal
function closeThemeModal() {
  const modal = document.getElementById('themeModal');
  const backdrop = document.getElementById('themeModalBackdrop');
  if (!modal || !backdrop) return;
  
  modal.style.display = 'none';
  backdrop.style.display = 'none';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initThemeSystem();
  setupThemeSwitcher();
  
  // Close modal handlers
  const closeBtns = document.querySelectorAll('.modal-close, .modal-backdrop');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', closeThemeModal);
  });
  
  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeThemeModal();
    }
  });
});

// Export for module usage (if using ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    themes,
    setTheme,
    initThemeSystem,
    getThemePreview
  };
}
