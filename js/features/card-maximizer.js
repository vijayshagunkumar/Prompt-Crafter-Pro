import { notifications } from '../ui/notifications.js';

export class CardMaximizer {
  constructor() {
    this.maximizedCard = null;
    this.originalStates = new Map();
    this.setup();
  }
  
  setup() {
    // Add maximize buttons to card headers
    this.addMaximizeButtons();
    
    // Setup keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.maximizedCard) {
        this.restoreCard(this.maximizedCard);
      }
    });
  }
  
  addMaximizeButtons() {
    const cards = document.querySelectorAll('.step-card');
    
    cards.forEach((card, index) => {
      const header = card.querySelector('.step-header');
      if (!header) return;
      
      // Create maximize button
      const maximizeBtn = document.createElement('button');
      maximizeBtn.className = 'maximize-card-btn';
      maximizeBtn.title = 'Maximize card';
      maximizeBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
      maximizeBtn.dataset.cardIndex = index;
      
      maximizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCardMaximize(card, index);
      });
      
      // Add to header
      const headerMain = card.querySelector('.step-header-main');
      if (headerMain) {
        headerMain.appendChild(maximizeBtn);
      }
    });
  }
  
  toggleCardMaximize(card, index) {
    if (this.maximizedCard === card) {
      this.restoreCard(card);
    } else {
      this.maximizeCard(card, index);
    }
  }
  
  maximizeCard(card, index) {
    // Save original state
    this.originalStates.set(card, {
      parent: card.parentNode,
      nextSibling: card.nextSibling,
      style: {
        width: card.style.width,
        height: card.style.height,
        position: card.style.position,
        top: card.style.top,
        left: card.style.left,
        zIndex: card.style.zIndex,
        margin: card.style.margin,
        gridColumn: card.style.gridColumn
      }
    });
    
    // Hide other cards
    document.querySelectorAll('.step-card').forEach(otherCard => {
      if (otherCard !== card) {
        otherCard.style.display = 'none';
      }
    });
    
    // Move card to maximize container or apply maximize styles
    const maximizeContainer = document.getElementById('maximizeContainer') || this.createMaximizeContainer();
    maximizeContainer.appendChild(card);
    
    // Apply maximize styles
    card.classList.add('maximized');
    card.style.width = '100%';
    card.style.height = '100vh';
    card.style.position = 'fixed';
    card.style.top = '0';
    card.style.left = '0';
    card.style.zIndex = '2000';
    card.style.margin = '0';
    card.style.borderRadius = '0';
    card.style.overflow = 'auto';
    
    // Update button
    const btn = card.querySelector('.maximize-card-btn');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-compress-alt"></i>';
      btn.title = 'Restore card';
    }
    
    this.maximizedCard = card;
    
    // Show overlay
    const overlay = document.getElementById('maximizeOverlay') || this.createOverlay();
    overlay.style.display = 'block';
    
    notifications.info(`Card ${index + 1} maximized. Press ESC to restore.`);
  }
  
  restoreCard(card) {
    if (!this.originalStates.has(card)) return;
    
    const originalState = this.originalStates.get(card);
    
    // Restore original parent and position
    if (originalState.nextSibling) {
      originalState.parent.insertBefore(card, originalState.nextSibling);
    } else {
      originalState.parent.appendChild(card);
    }
    
    // Restore original styles
    card.classList.remove('maximized');
    Object.assign(card.style, originalState.style);
    
    // Show all cards
    document.querySelectorAll('.step-card').forEach(otherCard => {
      otherCard.style.display = '';
    });
    
    // Update button
    const btn = card.querySelector('.maximize-card-btn');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-expand-alt"></i>';
      btn.title = 'Maximize card';
    }
    
    // Hide overlay
    const overlay = document.getElementById('maximizeOverlay');
    if (overlay) overlay.style.display = 'none';
    
    this.maximizedCard = null;
    this.originalStates.delete(card);
  }
  
  createMaximizeContainer() {
    const container = document.createElement('div');
    container.id = 'maximizeContainer';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    container.style.zIndex = '1999';
    container.style.display = 'none';
    document.body.appendChild(container);
    return container;
  }
  
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'maximizeOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '1998';
    overlay.style.display = 'none';
    overlay.style.backdropFilter = 'blur(4px)';
    
    overlay.addEventListener('click', () => {
      if (this.maximizedCard) {
        this.restoreCard(this.maximizedCard);
      }
    });
    
    document.body.appendChild(overlay);
    return overlay;
  }
  
  isCardMaximized() {
    return this.maximizedCard !== null;
  }
  
  getMaximizedCard() {
    return this.maximizedCard;
  }
}

export const cardMaximizer = new CardMaximizer();
