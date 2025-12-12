// card-expander.js - Card Expansion System

/**
 * Card Expander Class
 */
class CardExpander {
    constructor() {
        this.expandedCard = null;
        this.overlay = null;
        this.init();
    }
    
    /**
     * Initialize card expander
     */
    init() {
        this.createOverlay();
        this.setupExpandButtons();
        this.setupCloseButtons();
        this.setupEscapeKey();
    }
    
    /**
     * Create overlay element
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'card-overlay';
        this.overlay.id = 'cardOverlay';
        document.body.appendChild(this.overlay);
        
        // Close on overlay click
        this.overlay.addEventListener('click', () => {
            this.closeExpandedCard();
        });
    }
    
    /**
     * Setup expand buttons
     */
    setupExpandButtons() {
        // Setup existing expand buttons
        document.querySelectorAll('.expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cardId = e.currentTarget.dataset.card;
                this.toggleCard(cardId);
            });
        });
        
        // Also listen for dynamically added buttons
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const expandButtons = node.querySelectorAll ? node.querySelectorAll('.expand-btn') : [];
                        expandButtons.forEach(btn => {
                            if (!btn.dataset.listenerAdded) {
                                btn.addEventListener('click', (e) => {
                                    const cardId = e.currentTarget.dataset.card;
                                    this.toggleCard(cardId);
                                });
                                btn.dataset.listenerAdded = 'true';
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Setup close buttons
     */
    setupCloseButtons() {
        document.querySelectorAll('.close-expanded').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cardId = e.currentTarget.dataset.card;
                this.closeCard(cardId);
            });
        });
    }
    
    /**
     * Setup Escape key listener
     */
    setupEscapeKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.expandedCard) {
                this.closeExpandedCard();
            }
        });
    }
    
    /**
     * Toggle card expansion
     * @param {string} cardId - Card ID to toggle
     */
    toggleCard(cardId) {
        const card = document.getElementById(cardId);
        
        if (!card) {
            console.warn(`Card with ID "${cardId}" not found`);
            return;
        }
        
        if (card.classList.contains('expanded')) {
            this.closeCard(cardId);
        } else {
            this.expandCard(cardId);
        }
    }
    
    /**
     * Expand card to full view
     * @param {string} cardId - Card ID to expand
     */
    expandCard(cardId) {
        // Close any currently expanded card
        if (this.expandedCard) {
            this.closeCard(this.expandedCard);
        }
        
        const card = document.getElementById(cardId);
        const expandBtn = card.querySelector('.expand-btn');
        
        if (!card || !expandBtn) return;
        
        // Store original position and dimensions
        const rect = card.getBoundingClientRect();
        card.dataset.originalLeft = rect.left + 'px';
        card.dataset.originalTop = rect.top + 'px';
        card.dataset.originalWidth = rect.width + 'px';
        card.dataset.originalHeight = rect.height + 'px';
        
        // Add expanded class
        card.classList.add('expanded');
        
        // Update expand button
        if (expandBtn) {
            expandBtn.classList.add('expanded');
            expandBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
            expandBtn.title = 'Minimize window';
        }
        
        // Show overlay
        this.overlay.classList.add('show');
        
        // Disable body scroll
        document.body.style.overflow = 'hidden';
        
        // Update state
        this.expandedCard = cardId;
        
        // Focus textarea if present
        this.focusCardTextarea(card);
        
        // Show expansion notification
        this.showExpansionNotification(cardId);
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('card:expand', {
            detail: { cardId }
        }));
    }
    
    /**
     * Close expanded card
     * @param {string} cardId - Card ID to close
     */
    closeCard(cardId) {
        const card = document.getElementById(cardId);
        const expandBtn = card?.querySelector('.expand-btn');
        
        if (!card) return;
        
        // Remove expanded class
        card.classList.remove('expanded');
        
        // Update expand button
        if (expandBtn) {
            expandBtn.classList.remove('expanded');
            expandBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
            expandBtn.title = 'Expand window';
        }
        
        // Hide overlay
        this.overlay.classList.remove('show');
        
        // Enable body scroll
        document.body.style.overflow = '';
        
        // Update state
        if (this.expandedCard === cardId) {
            this.expandedCard = null;
        }
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('card:close', {
            detail: { cardId }
        }));
    }
    
    /**
     * Close currently expanded card
     */
    closeExpandedCard() {
        if (this.expandedCard) {
            this.closeCard(this.expandedCard);
        }
    }
    
    /**
     * Focus textarea in expanded card
     * @param {HTMLElement} card - Card element
     */
    focusCardTextarea(card) {
        const textarea = card.querySelector('textarea');
        if (textarea && !textarea.readOnly) {
            setTimeout(() => {
                textarea.focus();
                // Scroll to cursor position
                textarea.selectionStart = textarea.value.length;
                textarea.selectionEnd = textarea.value.length;
                textarea.scrollTop = textarea.scrollHeight;
            }, 300);
        }
    }
    
    /**
     * Show expansion notification
     * @param {string} cardId - Card ID
     */
    showExpansionNotification(cardId) {
        const cardNames = {
            'card1': 'Your Idea',
            'card2': 'Structured Prompt',
            'requirement-card': 'Your Idea',
            'prompt-card': 'Structured Prompt',
            'tools-card': 'Send to AI'
        };
        
        const cardName = cardNames[cardId] || 'Card';
        
        // Create notification
        const toast = document.createElement('div');
        toast.className = 'theme-notification card-expand-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-card);
            color: var(--text-primary);
            padding: 16px 24px;
            border-radius: 16px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
            border: 2px solid var(--border-light);
            backdrop-filter: blur(20px);
            z-index: 2001;
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
        `;
        
        toast.innerHTML = `
            <i class="fas fa-expand-alt" style="color: var(--primary);"></i>
            <span>${cardName} expanded. Press <kbd style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-family: monospace;">ESC</kbd> to close.</span>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 500);
        }, 3000);
    }
    
    /**
     * Check if any card is expanded
     * @returns {boolean} True if a card is expanded
     */
    isCardExpanded() {
        return this.expandedCard !== null;
    }
    
    /**
     * Get currently expanded card ID
     * @returns {string|null} Expanded card ID or null
     */
    getExpandedCard() {
        return this.expandedCard;
    }
    
    /**
     * Add expand button to a card
     * @param {string} cardId - Card ID
     * @param {string} position - Position ('top-right', 'top-left', 'bottom-right', 'bottom-left')
     */
    addExpandButton(cardId, position = 'top-right') {
        const card = document.getElementById(cardId);
        if (!card) return;
        
        // Remove existing expand button
        const existingBtn = card.querySelector('.expand-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Create expand button
        const expandBtn = document.createElement('button');
        expandBtn.className = 'expand-btn';
        expandBtn.dataset.card = cardId;
        expandBtn.title = 'Expand window';
        expandBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
        
        // Position the button
        const positions = {
            'top-right': { top: '20px', right: '20px', left: 'auto', bottom: 'auto' },
            'top-left': { top: '20px', left: '20px', right: 'auto', bottom: 'auto' },
            'bottom-right': { bottom: '20px', right: '20px', top: 'auto', left: 'auto' },
            'bottom-left': { bottom: '20px', left: '20px', top: 'auto', right: 'auto' }
        };
        
        const pos = positions[position] || positions['top-right'];
        Object.assign(expandBtn.style, {
            position: 'absolute',
            ...pos,
            width: '36px',
            height: '36px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: '10px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '0.875rem',
            zIndex: '10'
        });
        
        // Add hover effects
        expandBtn.addEventListener('mouseenter', () => {
            expandBtn.style.background = 'var(--primary-soft)';
            expandBtn.style.color = 'var(--primary)';
            expandBtn.style.borderColor = 'var(--primary)';
            expandBtn.style.transform = 'scale(1.1)';
            expandBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        expandBtn.addEventListener('mouseleave', () => {
            if (!card.classList.contains('expanded')) {
                expandBtn.style.background = 'var(--bg-secondary)';
                expandBtn.style.color = 'var(--text-secondary)';
                expandBtn.style.borderColor = 'var(--border-light)';
                expandBtn.style.transform = 'scale(1)';
                expandBtn.style.boxShadow = 'none';
            }
        });
        
        // Add click handler
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCard(cardId);
        });
        
        card.style.position = 'relative';
        card.appendChild(expandBtn);
        
        // Add close button for expanded state
        this.addCloseButton(cardId);
    }
    
    /**
     * Add close button to a card
     * @param {string} cardId - Card ID
     */
    addCloseButton(cardId) {
        const card = document.getElementById(cardId);
        if (!card) return;
        
        // Remove existing close button
        const existingBtn = card.querySelector('.close-expanded');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-expanded';
        closeBtn.dataset.card = cardId;
        closeBtn.title = 'Close expanded view';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        
        // Style close button
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '20px',
            right: '60px',
            width: '36px',
            height: '36px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: '10px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '1rem',
            zIndex: '10',
            opacity: '0',
            visibility: 'hidden'
        });
        
        // Add hover effects
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'var(--error, #EF4444)';
            closeBtn.style.color = 'white';
            closeBtn.style.borderColor = 'var(--error, #EF4444)';
            closeBtn.style.transform = 'scale(1.1)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            if (card.classList.contains('expanded')) {
                closeBtn.style.background = 'var(--bg-secondary)';
                closeBtn.style.color = 'var(--text-secondary)';
                closeBtn.style.borderColor = 'var(--border-light)';
                closeBtn.style.transform = 'scale(1)';
            }
        });
        
        // Add click handler
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeCard(cardId);
        });
        
        card.appendChild(closeBtn);
    }
}

// Create and export singleton instance
const cardExpander = new CardExpander();

// Export functions
export function toggleCard(cardId) {
    return cardExpander.toggleCard(cardId);
}

export function expandCard(cardId) {
    return cardExpander.expandCard(cardId);
}

export function closeCard(cardId) {
    return cardExpander.closeCard(cardId);
}

export function closeExpandedCard() {
    return cardExpander.closeExpandedCard();
}

export function isCardExpanded() {
    return cardExpander.isCardExpanded();
}

export function getExpandedCard() {
    return cardExpander.getExpandedCard();
}

export function addExpandButton(cardId, position = 'top-right') {
    return cardExpander.addExpandButton(cardId, position);
}

// Default export
export default cardExpander;
