// js/features/card-expander.js - FIXED VERSION WITH HORIZONTAL OVERFLOW PREVENTION

export class CardExpander {
  constructor() {
    this.maximizedCard = null;
    this.minimizedCards = new Set();
    this.isInitialized = false;
    console.log('🔧 CardExpander: Created');
  }

  initialize() {
    if (this.isInitialized) {
      console.log('⚠️ CardExpander: Already initialized');
      return;
    }
    
    console.log('🔧 CardExpander: Initializing...');
    
    // Create buttons immediately
    this.createButtons();
    
    // Bind events
    this.bindEvents();
    
    // Load saved state
    this.loadState();
    
    this.isInitialized = true;
    console.log('✅ CardExpander: Ready');
    
    // Test that buttons work
    setTimeout(() => this.testButtons(), 100);
  }

  createButtons() {
    console.log('🔧 CardExpander: Creating buttons for all cards...');
    
    // Create buttons for all cards
    ['card-1', 'card-2', 'card-3'].forEach(cardId => {
      const card = document.getElementById(cardId);
      if (!card) {
        console.warn(`⚠️ ${cardId} not found`);
        return;
      }
      
      const header = card.querySelector('.step-header');
      if (!header) {
        console.warn(`⚠️ No header in ${cardId}`);
        return;
      }
      
      // Create actions container
      let actions = header.querySelector('.card-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'card-actions';
        header.appendChild(actions);
      }
      
      // Clear existing buttons
      actions.innerHTML = '';
      
      // Create maximize button
      const button = document.createElement('button');
      button.className = 'card-expand-btn';
      button.setAttribute('data-card', cardId);
      button.setAttribute('title', 'Maximize');
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `;
      
      actions.appendChild(button);
      console.log(`✅ Added maximize button to ${cardId}`);
    });
  }

  bindEvents() {
    console.log('🔧 CardExpander: Binding events...');
    
    // Single event listener for all maximize buttons
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.card-expand-btn');
      if (!button) return;
      
      e.stopPropagation();
      
      const cardId = button.getAttribute('data-card');
      console.log(`🖱️ Maximize button clicked: ${cardId}`);
      
      this.handleMaximizeClick(cardId);
    });
    
    // ESC key to restore
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.maximizedCard) {
        console.log('⎋ ESC pressed, restoring card');
        this.restoreCard(this.maximizedCard);
      }
    });
    
    // Handle window resize for maximized cards
    window.addEventListener('resize', () => {
      if (this.maximizedCard) {
        this.adjustMaximizedCard(this.maximizedCard);
      }
    });
    
    console.log('✅ CardExpander: Events bound');
  }

  handleMaximizeClick(cardId) {
    const card = document.getElementById(cardId);
    if (!card) {
      console.error(`❌ Card ${cardId} not found`);
      return;
    }
    
    const isMaximized = card.classList.contains('is-maximized');
    const isMinimized = card.classList.contains('is-minimized');
    
    console.log(`🔄 Card ${cardId}: maximized=${isMaximized}, minimized=${isMinimized}`);
    
    if (isMaximized || isMinimized) {
      this.restoreCard(cardId);
    } else {
      this.maximizeCard(cardId);
    }
  }

  maximizeCard(cardId) {
    console.log(`🔍 Maximizing ${cardId}...`);
    
    const card = document.getElementById(cardId);
    if (!card) return false;
    
    // If another card is maximized, restore it first
    if (this.maximizedCard && this.maximizedCard !== cardId) {
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
    
    // Apply horizontal overflow prevention
    this.applyMaximizedStyles(card);
    
    // Update button icon and title
    const button = card.querySelector('.card-expand-btn');
    if (button) {
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3m0 18h3a2 2 0 0 0 2-2v-3m-6 0V8m11 8v3a2 2 0 0 1-2 2h-3m0-18h-3a2 2 0 0 0-2 2v3"/>
        </svg>
      `;
      button.setAttribute('title', 'Restore');
    }
    
    // Update state
    this.maximizedCard = cardId;
    this.saveState();
    
    console.log(`✅ ${cardId} maximized`);
    return true;
  }

  minimizeCard(cardId) {
    console.log(`🔍 Minimizing ${cardId}...`);
    
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
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `;
      button.setAttribute('title', 'Restore');
    }
    
    // Update state
    this.minimizedCards.add(cardId);
    this.saveState();
    
    console.log(`✅ ${cardId} minimized`);
    return true;
  }

  restoreCard(cardId) {
    console.log(`🔍 Restoring ${cardId}...`);
    
    const card = document.getElementById(cardId);
    if (!card) return false;
    
    // Remove both states
    card.classList.remove('is-maximized', 'is-minimized');
    
    // Remove body class if no other maximized cards
    const anyMaximized = document.querySelector('.step-card.is-maximized');
    if (!anyMaximized) {
      document.body.classList.remove('card-max-open');
    }
    
    // Remove maximized styles
    this.removeMaximizedStyles(card);
    
    // Update button icon and title
    const button = card.querySelector('.card-expand-btn');
    if (button) {
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `;
      button.setAttribute('title', 'Maximize');
    }
    
    // Update state
    if (this.maximizedCard === cardId) {
      this.maximizedCard = null;
    }
    this.minimizedCards.delete(cardId);
    this.saveState();
    
    console.log(`✅ ${cardId} restored`);
    return true;
  }

  applyMaximizedStyles(card) {
    // Apply styles to prevent horizontal overflow
    card.style.overflowX = 'hidden';
    card.style.maxWidth = '100%';
    card.style.boxSizing = 'border-box';
    
    // Ensure all child elements don't cause horizontal overflow
    const elements = card.querySelectorAll('*');
    elements.forEach(el => {
      el.style.maxWidth = '100%';
      el.style.boxSizing = 'border-box';
    });
    
    // Specifically handle textareas and containers
    const textareas = card.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      textarea.style.maxWidth = '100%';
      textarea.style.boxSizing = 'border-box';
    });
    
    const containers = card.querySelectorAll('.textarea-container, .tools-container');
    containers.forEach(container => {
      container.style.maxWidth = '100%';
      container.style.boxSizing = 'border-box';
      container.style.overflowX = 'hidden';
    });
  }

  removeMaximizedStyles(card) {
    // Remove inline styles
    card.style.overflowX = '';
    card.style.maxWidth = '';
    card.style.boxSizing = '';
    
    const elements = card.querySelectorAll('*');
    elements.forEach(el => {
      el.style.maxWidth = '';
      el.style.boxSizing = '';
    });
    
    const textareas = card.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      textarea.style.maxWidth = '';
      textarea.style.boxSizing = '';
    });
    
    const containers = card.querySelectorAll('.textarea-container, .tools-container');
    containers.forEach(container => {
      container.style.maxWidth = '';
      container.style.boxSizing = '';
      container.style.overflowX = '';
    });
  }

  adjustMaximizedCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card || !card.classList.contains('is-maximized')) return;
    
    // Reapply maximized styles on resize
    this.applyMaximizedStyles(card);
    
    // Ensure card stays within viewport
    const viewportWidth = window.innerWidth;
    const cardWidth = card.offsetWidth;
    
    if (cardWidth > viewportWidth) {
      card.style.width = '95vw';
      card.style.maxWidth = '95vw';
    }
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
      
      // Apply after a delay
      setTimeout(() => {
        if (state.maximizedCardId) {
          this.maximizeCard(state.maximizedCardId);
        }
        
        state.minimizedCardIds?.forEach(cardId => {
          this.minimizeCard(cardId);
        });
      }, 200);
    } catch (e) {
      console.error('❌ Failed to load card state:', e);
    }
  }

  testButtons() {
    console.log('🧪 Testing buttons...');
    const buttons = document.querySelectorAll('.card-expand-btn');
    console.log(`Found ${buttons.length} maximize buttons`);
    
    buttons.forEach((btn, i) => {
      const cardId = btn.getAttribute('data-card');
      console.log(`Button ${i + 1}: ${cardId}`);
    });
  }

  // Public methods
  getMaximizedCard() {
    return this.maximizedCard;
  }

  getMinimizedCards() {
    return Array.from(this.minimizedCards);
  }
}

// Simple initialization
export function initCardExpander() {
  const expander = new CardExpander();
  expander.initialize();
  window.cardExpander = expander;
  return expander;
}
