// js/features/card-expander.js
// Card expander for maximize/minimize functionality

export class CardExpander {
  constructor() {
    this.maximizedCard = null;
    this.minimizedCards = new Set();
    this.isInitialized = false;
    this.buttonsAdded = false; // Track if buttons are already added
  }

  initialize() {
    if (this.isInitialized) return;
    
    console.log('🔧 Initializing Card Expander...');
    
    // Check if buttons already exist
    this.checkAndCreateButtons();
    this.bindEvents();
    this.loadState();
    this.isInitialized = true;
    
    console.log('✅ Card Expander initialized');
  }

  checkAndCreateButtons() {
    // Only add buttons if they don't exist
    const existingButtons = document.querySelectorAll('.card-expand-btn');
    
    if (existingButtons.length === 0) {
      console.log('🔄 Creating maximize buttons for cards...');
      this.createExpandButtons();
      this.buttonsAdded = true;
    } else {
      console.log('✅ Maximize buttons already exist');
      this.buttonsAdded = true;
    }
  }

  createExpandButtons() {
    // Add buttons to Card 1 and Card 2 only
    const card1 = document.getElementById('card-1');
    const card2 = document.getElementById('card-2');

    [card1, card2].forEach((card, index) => {
      if (!card) {
        console.warn(`⚠️ Card ${index + 1} not found`);
        return;
      }

      // Find or create card header
      let header = card.querySelector('.step-header');
      if (!header) {
        console.warn(`⚠️ Header not found for Card ${index + 1}`);
        return;
      }

      // Check if button already exists
      const existingBtn = header.querySelector('.card-expand-btn');
      if (existingBtn) {
        console.log(`✅ Button already exists on Card ${index + 1}`);
        return;
      }

      // Create actions container
      let actions = header.querySelector('.card-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'card-actions';
        header.appendChild(actions);
      }

      // Create maximize/minimize button
      const expandBtn = document.createElement('button');
      expandBtn.className = 'card-expand-btn';
      expandBtn.setAttribute('data-card', card.id);
      expandBtn.setAttribute('title', 'Maximize');
      expandBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `;
      
      actions.appendChild(expandBtn);
      console.log(`✅ Added maximize button to ${card.id}`);
    });
  }

  bindEvents() {
    console.log('🔗 Binding card expander events...');
    
    // Remove any existing listeners first
    document.removeEventListener('click', this.handleClick);
    
    // Add new event listener
    this.handleClick = this.handleClick.bind(this);
    document.addEventListener('click', this.handleClick);

    // ESC key to restore maximized card
    document.removeEventListener('keydown', this.handleKeydown);
    this.handleKeydown = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.handleKeydown);
    
    console.log('✅ Events bound successfully');
  }

  handleClick(e) {
    const expandBtn = e.target.closest('.card-expand-btn');
    if (!expandBtn) return;

    const cardId = expandBtn.getAttribute('data-card');
    const card = document.getElementById(cardId);
    
    if (card) {
      console.log(`🔄 Toggling ${cardId}`);
      this.toggle(card, expandBtn);
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape' && this.maximizedCard) {
      console.log('⎋ ESC pressed, restoring maximized card');
      const card = document.getElementById(this.maximizedCard);
      if (card) {
        const btn = card.querySelector('.card-expand-btn');
        this.restore(card, btn);
      }
    }
  }

  toggle(card, btn) {
    const isMaximized = card.classList.contains('is-maximized');
    const isMinimized = card.classList.contains('is-minimized');

    console.log(`🔄 Card state: maximized=${isMaximized}, minimized=${isMinimized}`);

    if (isMaximized) {
      this.restore(card, btn);
    } else if (isMinimized) {
      this.restore(card, btn);
    } else {
      this.maximize(card, btn);
    }
  }

  maximize(card, btn) {
    console.log(`🔍 Maximizing ${card.id}`);
    
    // Store original state
    card.dataset.originalPosition = card.style.position || '';
    card.dataset.originalTop = card.style.top || '';
    card.dataset.originalLeft = card.style.left || '';
    card.dataset.originalWidth = card.style.width || '';
    card.dataset.originalHeight = card.style.height || '';

    // Restore currently maximized card if any
    if (this.maximizedCard) {
      console.log(`🔄 Restoring previously maximized card ${this.maximizedCard}`);
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
    const grid = card.closest('.cards-grid');
    if (grid) {
      grid.classList.add('has-maximized-card');
    }

    // Update state
    this.maximizedCard = card.id;
    this.saveState();
    
    console.log(`✅ ${card.id} maximized`);
  }

  minimize(card, btn) {
    console.log(`🔍 Minimizing ${card.id}`);
    
    // Store original height
    card.dataset.originalHeight = card.offsetHeight + 'px';

    // Remove maximized state if present
    if (this.maximizedCard === card.id) {
      card.classList.remove('is-maximized');
      document.body.classList.remove('card-max-open');
      this.maximizedCard = null;
      
      const grid = card.closest('.cards-grid');
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
    
    console.log(`✅ ${card.id} minimized`);
  }

  restore(card, btn) {
    console.log(`🔍 Restoring ${card.id}`);
    
    // Remove both states
    card.classList.remove('is-maximized', 'is-minimized');
    
    // Remove body class if no other maximized cards
    if (document.querySelectorAll('.step-card.is-maximized').length === 0) {
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
    const grid = card.closest('.cards-grid');
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
    
    console.log(`✅ ${card.id} restored`);
  }

  saveState() {
    const state = {
      maximizedCardId: this.maximizedCard,
      minimizedCardIds: Array.from(this.minimizedCards)
    };
    localStorage.setItem('cardExpanderState', JSON.stringify(state));
    console.log('💾 Card state saved:', state);
  }

  loadState() {
    try {
      const saved = localStorage.getItem('cardExpanderState');
      if (!saved) {
        console.log('📭 No saved card state found');
        return;
      }

      const state = JSON.parse(saved);
      console.log('📂 Loading saved card state:', state);
      
      // Restore maximized card
      if (state.maximizedCardId) {
        setTimeout(() => {
          const card = document.getElementById(state.maximizedCardId);
          const btn = card?.querySelector('.card-expand-btn');
          if (card && btn) {
            console.log(`📂 Restoring maximized card: ${state.maximizedCardId}`);
            this.maximize(card, btn);
          }
        }, 100);
      }

      // Restore minimized cards
      state.minimizedCardIds?.forEach(cardId => {
        setTimeout(() => {
          const card = document.getElementById(cardId);
          const btn = card?.querySelector('.card-expand-btn');
          if (card && btn) {
            console.log(`📂 Restoring minimized card: ${cardId}`);
            this.minimize(card, btn);
          }
        }, 100);
      });
    } catch (e) {
      console.error('❌ Failed to load card expander state:', e);
    }
  }

  // Public API methods
  maximizeCard(cardId) {
    const card = document.getElementById(cardId);
    const btn = card?.querySelector('.card-expand-btn');
    if (card && btn) {
      this.maximize(card, btn);
      return true;
    }
    return false;
  }

  minimizeCard(cardId) {
    const card = document.getElementById(cardId);
    const btn = card?.querySelector('.card-expand-btn');
    if (card && btn) {
      this.minimize(card, btn);
      return true;
    }
    return false;
  }

  restoreCard(cardId) {
    const card = document.getElementById(cardId);
    const btn = card?.querySelector('.card-expand-btn');
    if (card && btn) {
      this.restore(card, btn);
      return true;
    }
    return false;
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
    console.log('🔄 Card expander reset');
  }
}

// Legacy function for backward compatibility
export function initCardExpander() {
  const expander = new CardExpander();
  expander.initialize();
  return expander;
}
