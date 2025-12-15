// js/features/card-expander.js - COMPLETE WORKING VERSION

export class CardExpander {
  constructor() {
    this.maximizedCard = null;
    this.minimizedCards = new Set();
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;

    this.createButtons();
    this.bindEvents();
    this.loadState();

    this.isInitialized = true;
  }

  createButtons() {
    document.querySelectorAll('.card-expand-btn').forEach(btn => btn.remove());

    ['card-1', 'card-2'].forEach(cardId => {
      const card = document.getElementById(cardId);
      if (!card) return;

      const header = card.querySelector('.step-header');
      if (!header) return;

      let actions = header.querySelector('.card-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'card-actions';
        header.appendChild(actions);
      }

      const button = document.createElement('button');
      button.className = 'card-expand-btn';
      button.dataset.card = cardId;
      button.title = 'Maximize';
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      `;
      actions.appendChild(button);
    });
  }

  bindEvents() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.card-expand-btn');
      if (!btn) return;

      e.stopPropagation();
      this.toggle(btn.dataset.card);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.maximizedCard) {
        this.restore(this.maximizedCard);
      }
    });
  }

  toggle(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    if (card.classList.contains('is-maximized') ||
        card.classList.contains('is-minimized')) {
      this.restore(cardId);
    } else {
      this.maximize(cardId);
    }
  }

  maximize(cardId) {
    if (this.maximizedCard && this.maximizedCard !== cardId) {
      this.restore(this.maximizedCard);
    }

    const card = document.getElementById(cardId);
    if (!card) return;

    card.classList.remove('is-minimized');
    card.classList.add('is-maximized');
    document.body.classList.add('card-max-open');

    this.maximizedCard = cardId;
    this.saveState();
  }

  restore(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    card.classList.remove('is-maximized', 'is-minimized');

    if (!document.querySelector('.step-card.is-maximized')) {
      document.body.classList.remove('card-max-open');
    }

    this.maximizedCard = null;
    this.minimizedCards.delete(cardId);
    this.saveState();
  }

  saveState() {
    localStorage.setItem(
      'cardExpanderState',
      JSON.stringify({
        maximizedCardId: this.maximizedCard,
        minimizedCardIds: Array.from(this.minimizedCards)
      })
    );
  }

  loadState() {
    const saved = localStorage.getItem('cardExpanderState');
    if (!saved) return;

    const state = JSON.parse(saved);
    setTimeout(() => {
      if (state.maximizedCardId) {
        this.maximize(state.maximizedCardId);
      }
    }, 200);
  }
}

export function initCardExpander() {
  const expander = new CardExpander();
  expander.initialize();
  window.cardExpander = expander;
  return expander;
}
