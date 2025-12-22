// Card maximize functionality - FIXED VERSION (No dancing cards)
export class CardMaximizer {
    constructor() {
        this.maximizedCard = null;
        this.overlay = null;
        this.placeholder = null;
        this.originalStyles = {};
        this.setup();
    }
    
    setup() {
        this.addMaximizeButtons();
        
        document.querySelectorAll('.maximize-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.step-card');
                this.toggleMaximize(card);
            });
        });
        
        document.addEventListener('click', (e) => {
            if (this.overlay && e.target === this.overlay) {
                this.closeAll();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.maximizedCard) {
                this.closeAll();
            }
        });
    }
    
    addMaximizeButtons() {
        const cards = document.querySelectorAll('.step-card');
        cards.forEach(card => {
            if (!card.querySelector('.maximize-card-btn')) {
                const button = document.createElement('button');
                button.className = 'maximize-card-btn';
                button.innerHTML = '<i class="fas fa-expand-alt"></i>';
                button.title = 'Maximize card';
                card.appendChild(button);
            }
        });
    }
    
    toggleMaximize(card) {
        if (this.maximizedCard === card) {
            this.closeAll();
        } else {
            this.closeAll();
            this.maximizeCard(card);
        }
    }
    
    maximizeCard(card) {
        // Store original card position and parent
        const parent = card.parentElement;
        const index = Array.from(parent.children).indexOf(card);
        
        // Store original styles
        this.originalStyles = {
            parent: parent,
            index: index,
            display: card.style.display,
            position: card.style.position,
            top: card.style.top,
            left: card.style.left,
            width: card.style.width,
            height: card.style.height,
            zIndex: card.style.zIndex,
            gridColumn: card.style.gridColumn,
            gridRow: card.style.gridRow
        };
        
        // Create placeholder to maintain grid layout
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'card-placeholder';
        this.placeholder.style.width = card.offsetWidth + 'px';
        this.placeholder.style.height = card.offsetHeight + 'px';
        this.placeholder.style.visibility = 'hidden';
        parent.insertBefore(this.placeholder, card);
        
        // Create overlay
        this.createOverlay();
        
        // Maximize the card
        card.style.position = 'fixed';
        card.style.top = '20px';
        card.style.left = '20px';
        card.style.width = 'calc(100vw - 40px)';
        card.style.height = 'calc(100vh - 40px)';
        card.style.zIndex = '9999';
        card.style.display = 'block';
        card.style.border = '3px solid #3b82f6';
        card.style.boxShadow = '0 40px 120px rgba(0, 0, 0, 0.8)';
        card.style.borderRadius = '24px';
        card.style.padding = '40px';
        card.style.margin = '0';
        card.style.overflow = 'auto';
        
        // Move to body for proper z-index stacking
        document.body.appendChild(card);
        
        card.classList.add('maximized');
        this.maximizedCard = card;
        
        // Update button icon
        const maxBtn = card.querySelector('.maximize-card-btn');
        if (maxBtn) {
            maxBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
            maxBtn.title = 'Minimize card';
        }
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'card-maximize-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.98);
            backdrop-filter: blur(10px);
            z-index: 9998;
        `;
        document.body.appendChild(this.overlay);
    }
    
    closeAll() {
        if (this.maximizedCard) {
            this.restoreCard(this.maximizedCard);
            this.maximizedCard = null;
        }
        
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        if (this.placeholder) {
            this.placeholder.remove();
            this.placeholder = null;
        }
    }
    
    restoreCard(card) {
        card.classList.remove('maximized');
        
        // Remove from body
        document.body.removeChild(card);
        
        // Restore to original position
        if (this.originalStyles.parent && this.placeholder) {
            this.placeholder.parentNode.replaceChild(card, this.placeholder);
        } else if (this.originalStyles.parent && this.originalStyles.index !== undefined) {
            // Insert at original position
            const parent = this.originalStyles.parent;
            const sibling = parent.children[this.originalStyles.index];
            if (sibling) {
                parent.insertBefore(card, sibling);
            } else {
                parent.appendChild(card);
            }
        }
        
        // Restore original styles
        card.style.position = this.originalStyles.position || '';
        card.style.top = this.originalStyles.top || '';
        card.style.left = this.originalStyles.left || '';
        card.style.width = this.originalStyles.width || '';
        card.style.height = this.originalStyles.height || '';
        card.style.zIndex = this.originalStyles.zIndex || '';
        card.style.display = this.originalStyles.display || '';
        card.style.border = '';
        card.style.boxShadow = '';
        card.style.borderRadius = '';
        card.style.padding = '';
        card.style.margin = '';
        card.style.overflow = '';
        
        // Restore grid positioning
        if (this.originalStyles.gridColumn) {
            card.style.gridColumn = this.originalStyles.gridColumn;
        }
        if (this.originalStyles.gridRow) {
            card.style.gridRow = this.originalStyles.gridRow;
        }
        
        // Update button icon
        const maxBtn = card.querySelector('.maximize-card-btn');
        if (maxBtn) {
            maxBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
            maxBtn.title = 'Maximize card';
        }
        
        this.originalStyles = {};
    }
}

export const cardMaximizer = new CardMaximizer();
