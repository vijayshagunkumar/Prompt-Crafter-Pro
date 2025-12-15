// js/features/card-expander.js - FINAL FIXED VERSION
// This handles ALL card maximize/minimize logic in ONE place

export class CardExpander {
  constructor() {
    this.maximizedCard = null;
    this.minimizedCards = new Set();
    this.isInitialized = false;
    console.log('🔧 CardExpander: Created instance');
  }

  initialize() {
    if (this.isInitialized) {
      console.log('⚠️ CardExpander: Already initialized');
      return;
    }
    
    console.log('🔧 CardExpander: Starting initialization...');
    
    // Create buttons first
    this.createButtons();
    
    // Bind events once
    this.bindEvents();
    
    // Load saved state
    this.loadState();
    
    this.isInitialized = true;
    console.log('✅ CardExpander: Initialization complete');
    
    // Test buttons are working
    this.testButtons();
  }

  createButtons() {
    console.log('🔧 CardExpander: Creating/updating buttons...');
    
    // Clear any duplicate buttons first
    const existingButtons = document.querySelectorAll('.card-expand-btn');
    existingButtons.forEach(btn => btn.remove());
    
    // Add buttons to Card 1 and Card 2
    [1, 2].forEach(num => {
      const cardId = `card-${num}`;
      const card = document.getElementById(cardId);
      
      if (!card) {
        console.warn(`⚠️ CardExpander: ${cardId} not found`);
        return;
      }
      
      const header = card.querySelector('.step-header');
      if (!header) {
        console.warn(`⚠️ CardExpander: No header in ${cardId}`);
        return;
      }
      
      // Create actions container if not exists
      let actions = header.querySelector('.card-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'card-actions';
        header.appendChild(actions);
      }
      
      // Create the maximize button
      const button = document.createElement('button');
      button.className = 'card-expand-btn';
      button.setAttribute('data-card', cardId);
      button.setAttribute('title', 'Maximize');
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `;
      
      // Store reference for direct access
      button._cardExpander = this;
      button._cardId = cardId;
      
      actions.appendChild(button);
      console.log(`✅ CardExpander: Button added to ${cardId}`);
    });
  }

  bindEvents() {
    console.log('🔧 CardExpander: Binding global events...');
    
    // SINGLE global click handler for ALL card buttons
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.card-expand-btn');
      if (!button) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const cardId = button.getAttribute('data-card');
      console.log(`🖱️ CardExpander: Button clicked for ${cardId}`);
      
      this.handleButtonClick(cardId);
    });
    
    // ESC key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.maximizedCard) {
        console.log('⎋ CardExpander: ESC pressed, restoring card');
        this.restoreCard(this.maximizedCard);
      }
    });
    
    console.log('✅ CardExpander: Events bound');
  }

  handleButtonClick(cardId) {
    const card = document.getElementById(cardId);
    if (!card) {
      console.error(`❌ CardExpander: Card ${cardId} not found`);
      return;
    }
    
    const isMaximized = card.classList.contains('is-maximized');
    const isMinimized = card.classList.contains('is-minimized');
    
    console.log(`🔄 CardExpander: ${cardId} state - maximized:${isMaximized}, minimized:${isMinimized}`);
    
    if (isMaximized) {
      this.restoreCard(cardId);
    } else if (isMinimized) {
      this.restoreCard(cardId);
    } else {
      this.maximizeCard(cardId);
    }
  }

  maximizeCard(cardId) {
    console.log(`🔍 CardExpander: Maximizing ${cardId}`);
    
    const card = document.getElementById(cardId);
    if (!card) {
      console.error(`❌ CardExpander: Cannot maximize, ${cardId} not found`);
      return false;
    }
    
    // If another card is maximized, restore it first
    if (this.maximizedCard && this.maximizedCard !== cardId) {
      console.log(`🔄 CardExpander: First restoring ${this.maximizedCard}`);
      this.restoreCard(this.maximizedCard);
    }
    
    // Remove minimized state if present
    if (this.minimizedCards.has(cardId)) {
      this.minimizedCards.delete(cardId);
      card.classList.remove('is-minimized');
    }
    
    // Add maximized state
    card.classList.add('is-maximized');
    document.body.classList.add('card-max-open');
    
    // Update button title
    const button = card.querySelector('.card-expand-btn');
    if (button) {
      button.setAttribute('title', 'Restore');
    }
    
    // Update state
    this.maximizedCard = cardId;
    this.saveState();
    
    console.log(`✅ CardExpander: ${cardId} maximized`);
    return true;
  }

  minimizeCard(cardId) {
    console.log(`🔍 CardExpander: Minimizing ${cardId}`);
    
    const card = document.getElementById(cardId);
    if (!card) return false;
    
    // Remove maximized state if present
    if (this.maximizedCard === cardId) {
      card.classList.remove('is-maximized');
      document.body.classList.remove('card-max-open');
      this.maximizedCard = null;
    }
    
    // Add minimized state
    card.classList.add('is-minimized');
    
    // Update button title
    const button = card.querySelector('.card-expand-btn');
    if (button) {
      button.setAttribute('title', 'Restore');
    }
    
    // Update state
    this.minimizedCards.add(cardId);
    this.saveState();
    
    console.log(`✅ CardExpander: ${cardId} minimized`);
    return true;
  }

  restoreCard(cardId) {
    console.log(`🔍 CardExpander: Restoring ${cardId}`);
    
    const card = document.getElementById(cardId);
    if (!card) return false;
    
    // Remove both states
    card.classList.remove('is-maximized', 'is-minimized');
    
    // Remove body class if no other maximized cards
    const anyMaximized = document.querySelector('.step-card.is-maximized');
    if (!anyMaximized) {
      document.body.classList.remove('card-max-open');
    }
    
    // Update button title
    const button = card.querySelector('.card-expand-btn');
    if (button) {
      button.setAttribute('title', 'Maximize');
    }
    
    // Update state
    if (this.maximizedCard === cardId) {
      this.maximizedCard = null;
    }
    this.minimizedCards.delete(cardId);
    this.saveState();
    
    console.log(`✅ CardExpander: ${cardId} restored`);
    return true;
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
      
      // Apply states after a short delay
      setTimeout(() => {
        if (state.maximizedCardId) {
          this.maximizeCard(state.maximizedCardId);
        }
        
        state.minimizedCardIds?.forEach(cardId => {
          this.minimizeCard(cardId);
        });
      }, 100);
    } catch (e) {
      console.error('❌ CardExpander: Failed to load state:', e);
    }
  }

  testButtons() {
    // Simple test to verify buttons work
    setTimeout(() => {
      const buttons = document.querySelectorAll('.card-expand-btn');
      console.log(`🧪 CardExpander: Found ${buttons.length} buttons`);
      
      buttons.forEach((btn, i) => {
        const cardId = btn.getAttribute('data-card');
        console.log(`🧪 Button ${i + 1}: ${cardId}, has listener: ${!!btn.onclick}`);
      });
    }, 500);
  }

  // Public API
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
    
    localStorage.removeItem('cardExpanderState');
    console.log('🔄 CardExpander: Reset complete');
  }
}

// Simple initialization function
export function initCardExpander() {
  const expander = new CardExpander();
  expander.initialize();
  window.cardExpander = expander;
  return expander;
}
