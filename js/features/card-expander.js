// card-expander.js
// Responsible ONLY for maximizing/restoring Card-1 and Card-2
// Single source of truth for card maximize behavior (prevents double-binding / blinking)

export function initCardExpander() {
  const cards = [
    { id: 'cardIdea', title: 'Your Idea' },
    { id: 'cardPrompt', title: 'Structured Prompt' }
  ];

  const backdrop = createBackdrop();
  let activeCard = null;

  cards.forEach(({ id }) => {
    const card = document.getElementById(id);
    if (!card) return;

    const header = card.querySelector('.step-header');
    if (!header) return;

    // Prefer an existing maximize button from HTML, else create one.
    let btn = header.querySelector('.card-max-btn');

    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'icon-btn card-max-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Maximize card');
      btn.innerHTML = '<i class="fas fa-expand"></i>';
      header.appendChild(btn);
    }

    // Avoid double-binding
    if (btn.dataset.maxBound === '1') return;
    btn.dataset.maxBound = '1';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggle(card, btn);
    });
  });

  // Backdrop click closes
  if (backdrop.dataset.bound !== '1') {
    backdrop.dataset.bound = '1';
    backdrop.addEventListener('click', close);
  }

  // ESC closes
  if (!document.body.dataset.cardExpanderEscBound) {
    document.body.dataset.cardExpanderEscBound = '1';
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  function toggle(card, btn) {
    if (activeCard === card) close();
    else open(card, btn);
  }

  function open(card, btn) {
    close();

    card.classList.add('is-maximized');
    document.body.classList.add('card-max-open');

    btn.innerHTML = '<i class="fas fa-compress"></i>';
    btn.title = 'Restore';

    backdrop.classList.add('show');
    activeCard = card;
  }

  function close() {
    if (!activeCard) return;

    activeCard.classList.remove('is-maximized');
    document.body.classList.remove('card-max-open');

    const btn = activeCard.querySelector('.card-max-btn');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-expand"></i>';
      btn.title = 'Maximize';
    }

    backdrop.classList.remove('show');
    activeCard = null;
  }
}

function createBackdrop() {
  let el = document.getElementById('cardMaxBackdrop');
  if (el) return el;

  el = document.createElement('div');
  el.id = 'cardMaxBackdrop';
  el.className = 'card-max-backdrop';
  document.body.appendChild(el);
  return el;
}
