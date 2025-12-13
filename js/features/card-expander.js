// card-expander.js
// Responsible ONLY for maximizing/restoring Card-1 and Card-2
// Does NOT touch Card-3 or AI tools

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

    // Prevent duplicate buttons
    if (header.querySelector('.card-max-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'icon-btn card-max-btn';
    btn.type = 'button';
    btn.title = 'Maximize';
    btn.innerHTML = '<i class="fas fa-expand"></i>';

    header.appendChild(btn);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle(card, btn);
    });
  });

  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  function toggle(card, btn) {
    if (activeCard === card) {
      close();
    } else {
      open(card, btn);
    }
  }

  function open(card, btn) {
    close();
    card.classList.add('is-maximized');
    document.body.classList.add('card-max-open');
    btn.innerHTML = '<i class="fas fa-compress"></i>';
    btn.title = 'Restore';
    backdrop.style.display = 'block';
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

    backdrop.style.display = 'none';
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
