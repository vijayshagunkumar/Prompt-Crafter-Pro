// Card maximize functionality - FIXED VERSION (No dancing)
export class CardMaximizer {
    constructor() {
        this.maximizedCard = null;
        this.overlay = null;
        this.setup();
    }
    
    setup() {
        // Add maximize buttons to cards if they don't exist
        this.addMaximizeButtons();
        
        // Add maximize button event listeners
        document.querySelectorAll('.maximize-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.step-card');
                this.toggleMaximize(card);
            });
        });
        
        // Close on overlay click
        document.addEventListener('click', (e) => {
            if (this.overlay && e.target === this.overlay) {
                this.closeAll();
            }
        });
        
        // Close on escape key
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
            this.closeAll(); // Close any currently maximized card first
            this.maximizeCard(card);
        }
    }
    
    maximizeCard(card) {
        // Store original card data
        const originalStyle = {
            position: card.style.position,
            top: card.style.top,
            left: card.style.left,
            width: card.style.width,
            height: card.style.height,
            margin: card.style.margin,
            padding: card.style.padding,
            borderRadius: card.style.borderRadius,
            zIndex: card.style.zIndex,
            transform: card.style.transform,
            transition: card.style.transition
        };
        
        // Store original parent and sibling reference
        const parent = card.parentNode;
        const nextSibling = card.nextSibling;
        
        // Create overlay
        this.createOverlay();
        
        // Calculate fixed position
        const rect = card.getBoundingClientRect();
        
        // Set fixed position BEFORE adding to body
        card.style.position = 'fixed';
        card.style.top = '20px';
        card.style.left = '20px';
        card.style.width = 'calc(100vw - 40px)';
        card.style.height = 'calc(100vh - 40px)';
        card.style.zIndex = '9999';
        card.style.margin = '0';
        card.style.padding = '40px';
        card.style.borderRadius = '24px';
        card.style.border = '3px solid #3b82f6';
        card.style.boxShadow = '0 40px 120px rgba(0, 0, 0, 0.8)';
        card.style.backgroundColor = '#1e293b';
        card.style.backdropFilter = 'blur(20px)';
        card.style.transform = 'none';
        card.style.transition = 'none';
        card.style.overflow = 'auto';
        
        // Add maximized class
        card.classList.add('maximized');
        
        // Store original data
        card.dataset.originalStyle = JSON.stringify(originalStyle);
        card.dataset.originalParent = parent.id || '';
        card.dataset.originalNextSibling = nextSibling ? nextSibling.id || '' : '';
        
        // Move to body
        document.body.appendChild(card);
        
        // Set as maximized
        this.maximizedCard = card;
        
        // Update maximize button icon
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
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            z-index: 9998;
            animation: fadeIn 0.3s ease;
        `;
        document.body.appendChild(this.overlay);
        
        // Add fadeIn animation if not exists
        if (!document.getElementById('maximize-animations')) {
            const style = document.createElement('style');
            style.id = 'maximize-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
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
    }
    
    restoreCard(card) {
        // Remove maximized class
        card.classList.remove('maximized');
        
        // Restore original style
        if (card.dataset.originalStyle) {
            const originalStyle = JSON.parse(card.dataset.originalStyle);
            Object.assign(card.style, originalStyle);
        } else {
            // Default restore
            card.style.position = '';
            card.style.top = '';
            card.style.left = '';
            card.style.width = '';
            card.style.height = '';
            card.style.zIndex = '';
            card.style.margin = '';
            card.style.padding = '';
            card.style.borderRadius = '';
            card.style.border = '';
            card.style.boxShadow = '';
            card.style.backgroundColor = '';
            card.style.backdropFilter = '';
            card.style.overflow = '';
        }
        
        // Try to restore to original position
        const parentId = card.dataset.originalParent;
        const nextSiblingId = card.dataset.originalNextSibling;
        
        let parent = document.getElementById(parentId) || document.querySelector('.cards-grid');
        if (parent) {
            // Remove from body
            document.body.removeChild(card);
            
            // Insert at original position
            if (nextSiblingId) {
                const nextSibling = document.getElementById(nextSiblingId);
                if (nextSibling) {
                    parent.insertBefore(card, nextSibling);
                } else {
                    parent.appendChild(card);
                }
            } else {
                parent.appendChild(card);
            }
        }
        
        // Update maximize button icon
        const maxBtn = card.querySelector('.maximize-card-btn');
        if (maxBtn) {
            maxBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
            maxBtn.title = 'Maximize card';
        }
        
        // Clear stored data
        delete card.dataset.originalStyle;
        delete card.dataset.originalParent;
        delete card.dataset.originalNextSibling;
    }
}

export const cardMaximizer = new CardMaximizer();
