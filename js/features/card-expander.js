// Card expander for maximize/minimize functionality
// Handles Card 1 (Your Idea/Input) and Card 2 (Structured Prompt/Output)

export class CardExpander {
  constructor() {
    this.maximizedCard = null;
    this.minimizedCards = new Set();
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    
    this.createExpandButtons();
    this.bindEvents();
    this.loadState();
    this.isInitialized = true;
  }

  createExpandButtons() {
    // Add buttons to Card 1 and Card 2 only
    const card1 = document.getElementById('card-1');
    const card2 = document.getElementById('card-2');

    [card1, card2].forEach((card, index) => {
      if (!card) return;

      // Ensure card has ID
      if (!card.id) {
        card.id = `card-${index + 1}`;
      }

      // Find or create card header
      let header = card.querySelector('.card-header');
      if (!header) {
        header = document.createElement('div');
        header.className = 'card-header';
        card.insertBefore(header, card.firstChild);
      }

      // Add title if missing
      let title = header.querySelector('.card-title');
      if (!title) {
        title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = index === 0 ? 'Your Idea / Input' : 'Structured Prompt / Output';
        header.appendChild(title);
      }

      // Add actions container
      let actions = header.querySelector('.card-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'card-actions';
        header.appendChild(actions);
      }

      // Clear existing expand buttons
      const existingBtns = actions.querySelectorAll('.card-expand-btn');
      existingBtns.forEach(btn => btn.remove());

      // Add maximize/minimize button
      const expandBtn = document.createElement('button');
      expandBtn.className = 'btn-icon card-expand-btn';
      expandBtn.setAttribute('data-card', card.id);
      expandBtn.setAttribute('title', 'Maximize');
      expandBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `;
      actions.appendChild(expandBtn);
    });
  }

  bindEvents() {
    // Delegate clicks to card expand buttons
    document.addEventListener('click', (e) => {
      const expandBtn = e.target.closest('.card-expand-btn');
      if (!expandBtn) return;

      const cardId = expandBtn.getAttribute('data-card');
      const card = document.getElementById(cardId);
      
      if (card) {
        this.toggle(card, expandBtn);
      }
    });

    // ESC key to restore maximized card
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.maximizedCard) {
        const card = document.getElementById(this.maximizedCard);
        if (card) {
          const btn = card.querySelector('.card-expand-btn');
          this.restore(card, btn);
        }
      }
    });
  }

  toggle(card, btn) {
    const isMaximized = card.classList.contains('is-maximized');
    const isMinimized = card.classList.contains('is-minimized');

    if (isMaximized) {
      this.restore(card, btn);
    } else if (isMinimized) {
      this.restore(card, btn);
    } else {
      this.maximize(card, btn);
    }
  }

  maximize(card, btn) {
    // Store original state
    card.dataset.originalPosition = card.style.position || '';
    card.dataset.originalTop = card.style.top || '';
    card.dataset.originalLeft = card.style.left || '';
    card.dataset.originalWidth = card.style.width || '';
    card.dataset.originalHeight = card.style.height || '';

    // Restore currently maximized card if any
    if (this.maximizedCard) {
      const otherCard = document.getElementById(this.maximizedCard);
      const otherBtn = otherCard?.querySelector('.card-expand-btn');
      if (otherCard && otherBtn) {
        this.restore(otherCard, otherBtn);
      }
    }

    // Remove minimized state if present
    if (this.minimizedCards.has(card.id)) {
      this.minimizedCards.delete(card.id);
      card.classList.remove('is-minimized');
    }

    // Add maximized state
    card.classList.add('is-maximized');
    document.body.classList.add('card-max-open');
    
    // Update button icon and title
    if (btn) {
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `;
      btn.setAttribute('title', 'Restore');
    }

    // Update grid layout
    const grid = card.closest('.grid');
    if (grid) {
      grid.classList.add('has-maximized-card');
    }

    // Update state
    this.maximizedCard = card.id;
    this.saveState();
  }

  minimize(card, btn) {
    // Store original height
    card.dataset.originalHeight = card.offsetHeight + 'px';

    // Remove maximized state if present
    if (this.maximizedCard === card.id) {
      card.classList.remove('is-maximized');
      document.body.classList.remove('card-max-open');
      this.maximizedCard = null;
      
      const grid = card.closest('.grid');
      if (grid) {
        grid.classList.remove('has-maximized-card');
      }
    }

    // Add minimized state
    card.classList.add('is-minimized');
    
    // Update button icon and title
    if (btn) {
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 9L5 9M19 15L5 15" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
      btn.setAttribute('title', 'Restore');
    }

    // Update state
    this.minimizedCards.add(card.id);
    this.saveState();
  }

  restore(card, btn) {
    // Remove both states
    card.classList.remove('is-maximized', 'is-minimized');
    
    // Remove body class if no other maximized cards
    if (document.querySelectorAll('.card.is-maximized').length === 0) {
      document.body.classList.remove('card-max-open');
    }

    // Restore original styles
    if (card.dataset.originalPosition) {
      card.style.position = card.dataset.originalPosition;
    }
    if (card.dataset.originalTop) {
      card.style.top = card.dataset.originalTop;
    }
    if (card.dataset.originalLeft) {
      card.style.left = card.dataset.originalLeft;
    }
    if (card.dataset.originalWidth) {
      card.style.width = card.dataset.originalWidth;
    }
    if (card.dataset.originalHeight) {
      card.style.height = card.dataset.originalHeight;
    }

    // Update grid layout
    const grid = card.closest('.grid');
    if (grid) {
      grid.classList.remove('has-maximized-card');
    }

    // Update button icon and title
    if (btn) {
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `;
      btn.setAttribute('title', 'Maximize');
    }

    // Update state
    if (this.maximizedCard === card.id) {
      this.maximizedCard = null;
    }
    this.minimizedCards.delete(card.id);
    this.saveState();
  }

  saveState() {
    const state = {
      maximizedCardId: this.maximizedCard,
      minimizedCardIds: Array.from(this.minimizedCards)
    };
    localStorage.setItem('cardExpanderState', JSON.stringify(state));
  }

  loadState() {
    try {
      const saved = localStorage.getItem('cardExpanderState');
      if (!saved) return;

      const state = JSON.parse(saved);
      
      // Restore maximized card
      if (state.maximizedCardId) {
        const card = document.getElementById(state.maximizedCardId);
        const btn = card?.querySelector('.card-expand-btn');
        if (card && btn) {
          this.maximize(card, btn);
        }
      }

      // Restore minimized cards
      state.minimizedCardIds?.forEach(cardId => {
        const card = document.getElementById(cardId);
        const btn = card?.querySelector('.card-expand-btn');
        if (card && btn) {
          this.minimize(card, btn);
        }
      });
    } catch (e) {
      console.error('Failed to load card expander state:', e);
    }
  }

  // Public API methods
  maximizeCard(cardId) {
    const card = document.getElementById(cardId);
    const btn = card?.querySelector('.card-expand-btn');
    if (card && btn) {
      this.maximize(card, btn);
    }
  }

  minimizeCard(cardId) {
    const card = document.getElementById(cardId);
    const btn = card?.querySelector('.card-expand-btn');
    if (card && btn) {
      this.minimize(card, btn);
    }
  }

  restoreCard(cardId) {
    const card = document.getElementById(cardId);
    const btn = card?.querySelector('.card-expand-btn');
    if (card && btn) {
      this.restore(card, btn);
    }
  }

  getMaximizedCard() {
    return this.maximizedCard;
  }

  getMinimizedCards() {
    return Array.from(this.minimizedCards);
  }

  reset() {
    // Restore all cards
    if (this.maximizedCard) {
      this.restoreCard(this.maximizedCard);
    }
    
    this.getMinimizedCards().forEach(cardId => {
      this.restoreCard(cardId);
    });
    
    this.maximizedCard = null;
    this.minimizedCards.clear();
    localStorage.removeItem('cardExpanderState');
  }
}

// Legacy function for backward compatibility
export function initCardExpander() {
  const expander = new CardExpander();
  expander.initialize();
  return expander;
}
