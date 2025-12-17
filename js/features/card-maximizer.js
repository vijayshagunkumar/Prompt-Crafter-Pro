// Card maximize functionality - FIXED VERSION (No dancing cards)
export class CardMaximizer {
    constructor() {
        this.maximizedCard = null;
        this.overlay = null;
        this.placeholder = null;
        this.originalCardStyles = null;
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
        // Store original position and styles
        this.originalCardStyles = {
            gridColumn: card.style.gridColumn,
            gridRow: card.style.gridRow,
            position: card.style.position,
            top: card.style.top,
            left: card.style.left,
            width: card.style.width,
            height: card.style.height,
            zIndex: card.style.zIndex,
            margin: card.style.margin,
            padding: card.style.padding,
            border: card.style.border,
            boxShadow: card.style.boxShadow,
            borderRadius: card.style.borderRadius,
            transform: card.style.transform,
            transition: card.style.transition
        };
        
        // Get card position in the grid
        const cardRect = card.getBoundingClientRect();
        const gridRect = card.parentElement.getBoundingClientRect();
        
        // Create a placeholder to keep the grid layout intact
        this.placeholder = document.createElement('div');
        this.placeholder.style.width = cardRect.width + 'px';
        this.placeholder.style.height = cardRect.height + 'px';
        this.placeholder.style.visibility = 'hidden';
        this.placeholder.style.pointerEvents = 'none';
        card.parentNode.insertBefore(this.placeholder, card);
        
        // Create overlay
        this.createOverlay();
        
        // Set fixed position for maximized card
        card.style.position = 'fixed';
        card.style.top = '20px';
        card.style.left = '20px';
        card.style.width = 'calc(100vw - 40px)';
        card.style.height = 'calc(100vh - 40px)';
        card.style.zIndex = '9999';
        card.style.margin = '0';
        card.style.padding = '40px';
        card.style.border = '3px solid #3b82f6';
        card.style.boxShadow = '0 40px 120px rgba(0, 0, 0, 0.8)';
        card.style.borderRadius = '24px';
        card.style.backgroundColor = '#1e293b';
        card.style.transform = 'none';
        card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.overflow = 'auto';
        
        // Move to body to ensure proper z-index
        document.body.appendChild(card);
        
        // Add maximized class
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
            animation: overlayFadeIn 0.3s ease;
        `;
        
        // Add animation if not exists
        if (!document.querySelector('#overlay-animation')) {
            const style = document.createElement('style');
            style.id = 'overlay-animation';
            style.textContent = `
                @keyframes overlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
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
        
        this.originalCardStyles = null;
    }
    
    restoreCard(card) {
        // Remove maximized class
        card.classList.remove('maximized');
        
        // Find original position in grid
        const originalGrid = document.querySelector('.cards-grid');
        
        // Restore original styles
        if (this.originalCardStyles) {
            Object.assign(card.style, this.originalCardStyles);
        } else {
            // Reset to default
            card.style.position = '';
            card.style.top = '';
            card.style.left = '';
            card.style.width = '';
            card.style.height = '';
            card.style.zIndex = '';
            card.style.margin = '';
            card.style.padding = '';
            card.style.border = '';
            card.style.boxShadow = '';
            card.style.borderRadius = '';
            card.style.transform = '';
            card.style.transition = '';
            card.style.overflow = '';
        }
        
        // Move card back to its original position
        if (originalGrid && this.placeholder) {
            originalGrid.insertBefore(card, this.placeholder);
            this.placeholder.remove();
            this.placeholder = null;
        } else if (originalGrid) {
            // If placeholder is missing, insert at the correct position
            const cardIndex = Array.from(originalGrid.children).findIndex(child => 
                child.classList.contains('step-card') && !child.classList.contains('maximized')
            );
            if (cardIndex !== -1) {
                originalGrid.insertBefore(card, originalGrid.children[cardIndex]);
            } else {
                originalGrid.appendChild(card);
            }
        }
        
        // Update button icon
        const maxBtn = card.querySelector('.maximize-card-btn');
        if (maxBtn) {
            maxBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
            maxBtn.title = 'Maximize card';
        }
    }
}

export const cardMaximizer = new CardMaximizer();
