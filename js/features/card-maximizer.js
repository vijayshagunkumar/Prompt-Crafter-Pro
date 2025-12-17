import { notifications } from '../ui/notifications.js';

export class CardMaximizer {
  constructor() {
    this.maximizedCard = null;
    this.originalStyles = new Map();
    this.setup();
  }
  
  setup() {
    setTimeout(() => this.addMaximizeButtons(), 100);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.maximizedCard) this.restoreCurrentCard();
    });
  }
  
  addMaximizeButtons() {
    document.querySelectorAll('.step-card').forEach((card, index) => {
      const header = card.querySelector('.step-header-main');
      if (!header) return;
      
      // Remove existing button if any
      const existingBtn = header.querySelector('.maximize-card-btn');
      if (existingBtn) existingBtn.remove();
      
      // Create new button
      const btn = document.createElement('button');
      btn.className = 'maximize-card-btn';
      btn.innerHTML = '<i class="fas fa-expand-alt"></i>';
      btn.title = 'Maximize card';
      btn.onclick = (e) => {
        e.stopPropagation();
        this.toggleCard(card);
      };
      
      header.appendChild(btn);
    });
  }
  
  toggleCard(card) {
    if (this.maximizedCard === card) {
      this.restoreCard(card);
    } else {
      if (this.maximizedCard) this.restoreCard(this.maximizedCard);
      this.maximizeCard(card);
    }
  }
  
  maximizeCard(card) {
    // Save original styles
    const rect = card.getBoundingClientRect();
    const originalParent = card.parentNode;
    const originalIndex = Array.from(originalParent.children).indexOf(card);
    
    this.originalStyles.set(card, {
      parent: originalParent,
      index: originalIndex,
      styles: {
        position: card.style.position,
        top: card.style.top,
        left: card.style.left,
        width: card.style.width,
        height: card.style.height,
        zIndex: card.style.zIndex,
        margin: card.style.margin,
        borderRadius: card.style.borderRadius,
        transition: card.style.transition
      },
      rect: rect
    });
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'maximizeOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      z-index: 1998;
      animation: fadeIn 0.3s ease-out;
    `;
    overlay.onclick = () => this.restoreCard(card);
    document.body.appendChild(overlay);
    
    // Move card to body for fullscreen
    document.body.appendChild(card);
    
    // Set initial position (same as original)
    card.style.position = 'fixed';
    card.style.top = `${rect.top}px`;
    card.style.left = `${rect.left}px`;
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    card.style.zIndex = '1999';
    card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    card.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.5)';
    
    // Force reflow
    card.offsetHeight;
    
    // Animate to fullscreen
    requestAnimationFrame(() => {
      card.style.top = '50%';
      card.style.left = '50%';
      card.style.width = '90vw';
      card.style.height = '90vh';
      card.style.transform = 'translate(-50%, -50%)';
      card.style.borderRadius = '20px';
      card.style.border = '2px solid var(--primary)';
      card.classList.add('maximized');
    });
    
    this.maximizedCard = card;
    notifications.info('Card maximized. Press ESC or click outside to restore.', 2000);
  }
  
  restoreCard(card) {
    if (!this.originalStyles.has(card)) return;
    
    const original = this.originalStyles.get(card);
    
    // Remove overlay
    const overlay = document.getElementById('maximizeOverlay');
    if (overlay) overlay.remove();
    
    // Animate back
    card.style.top = `${original.rect.top}px`;
    card.style.left = `${original.rect.left}px`;
    card.style.width = `${original.rect.width}px`;
    card.style.height = `${original.rect.height}px`;
    card.style.transform = 'none';
    card.style.borderRadius = '';
    card.style.border = '';
    
    setTimeout(() => {
      // Restore original parent and styles
      if (original.parent && document.body.contains(card)) {
        if (original.index >= original.parent.children.length) {
          original.parent.appendChild(card);
        } else {
          const sibling = original.parent.children[original.index];
          original.parent.insertBefore(card, sibling);
        }
      }
      
      // Restore styles
      Object.keys(original.styles).forEach(prop => {
        card.style[prop] = original.styles[prop];
      });
      
      card.classList.remove('maximized');
      this.maximizedCard = null;
      this.originalStyles.delete(card);
    }, 400);
  }
  
  restoreCurrentCard() {
    if (this.maximizedCard) {
      this.restoreCard(this.maximizedCard);
    }
  }
}

export const cardMaximizer = new CardMaximizer();
