// card-expander.js
// Adds Maximize/Restore buttons to Card 1 (requirement) + Card 2 (output)
// Works even if index.html has heavy inline styles (we inject required CSS).
// No layout changes, no re-render loops, no blinking.

function injectExpanderStyles() {
  if (document.getElementById("pc-card-expander-styles")) return;

  const style = document.createElement("style");
  style.id = "pc-card-expander-styles";
  style.textContent = `
    /* ===== PromptCraft Card Expander (Injected) ===== */
    .pc-card-max-btn {
      margin-left: auto;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 94, 0, 0.35);
      background: rgba(255, 94, 0, 0.10);
      color: var(--text-primary, #F1F5F9);
      cursor: pointer;
      transition: transform .15s ease, background .15s ease, border-color .15s ease;
      flex: 0 0 auto;
    }
    .pc-card-max-btn:hover {
      transform: translateY(-1px);
      background: rgba(255, 94, 0, 0.16);
      border-color: rgba(255, 94, 0, 0.55);
    }
    .pc-card-max-btn:active { transform: translateY(0); }

    .pc-card-max-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.72);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 1990;
      display: none;
    }
    body.pc-card-max-open { overflow: hidden; }

    .step-card.pc-is-maximized {
      position: fixed !important;
      inset: 16px !important;
      z-index: 2000 !important;
      width: auto !important;
      height: auto !important;
      max-height: calc(100vh - 32px) !important;
      overflow: auto !important;
      box-shadow: 0 30px 80px rgba(0,0,0,0.6) !important;
    }

    /* make textarea usable in max mode */
    .step-card.pc-is-maximized textarea {
      min-height: 55vh !important;
      max-height: none !important;
    }

    /* avoid header squish when we add the button */
    .step-header {
      gap: 12px;
    }
  `;
  document.head.appendChild(style);
}

function ensureBackdrop() {
  let backdrop = document.querySelector(".pc-card-max-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "pc-card-max-backdrop";
    document.body.appendChild(backdrop);
  }
  return backdrop;
}

function findCardByTextareaId(textareaId) {
  const el = document.getElementById(textareaId);
  if (!el) return null;
  return el.closest(".step-card");
}

function addMaxButtonToCard(card, label) {
  if (!card) return;

  const header = card.querySelector(".step-header");
  if (!header) return;

  // Prevent duplicates
  if (header.querySelector(`[data-pc-max-btn="${label}"]`)) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pc-card-max-btn";
  btn.setAttribute("data-pc-max-btn", label);
  btn.setAttribute("aria-label", "Maximize");
  btn.title = "Maximize";

  // icon (FontAwesome already in your page)
  btn.innerHTML = `<i class="fas fa-up-right-and-down-left-from-center"></i>`;

  header.appendChild(btn);
}

function setButtonState(btn, isMax) {
  if (!btn) return;
  btn.title = isMax ? "Restore" : "Maximize";
  btn.setAttribute("aria-label", isMax ? "Restore" : "Maximize");
  btn.innerHTML = isMax
    ? `<i class="fas fa-down-left-and-up-right-to-center"></i>`
    : `<i class="fas fa-up-right-and-down-left-from-center"></i>`;
}

function closeAnyMaximized() {
  const openCard = document.querySelector(".step-card.pc-is-maximized");
  if (openCard) openCard.classList.remove("pc-is-maximized");

  document.body.classList.remove("pc-card-max-open");

  const backdrop = document.querySelector(".pc-card-max-backdrop");
  if (backdrop) backdrop.style.display = "none";

  // restore button icon(s)
  document.querySelectorAll(".pc-card-max-btn").forEach((btn) => setButtonState(btn, false));
}

export function initCardExpander() {
  injectExpanderStyles();
  const backdrop = ensureBackdrop();

  // Card 1 contains textarea#requirement
  const card1 = findCardByTextareaId("requirement");
  // Card 2 contains textarea#output
  const card2 = findCardByTextareaId("output");

  // Add buttons
  addMaxButtonToCard(card1, "card1");
  addMaxButtonToCard(card2, "card2");

  // Click handler (single delegated listener; no blinking/rebinding loops)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".pc-card-max-btn");
    if (!btn) return;

    const which = btn.getAttribute("data-pc-max-btn");
    const card = which === "card1" ? card1 : card2;
    if (!card) return;

    const isMax = card.classList.contains("pc-is-maximized");

    // if opening this card, close any other maximized first
    if (!isMax) closeAnyMaximized();

    // toggle
    card.classList.toggle("pc-is-maximized");
    const nowMax = card.classList.contains("pc-is-maximized");

    document.body.classList.toggle("pc-card-max-open", nowMax);
    backdrop.style.display = nowMax ? "block" : "none";
    setButtonState(btn, nowMax);
  });

  // Backdrop click closes
  backdrop.addEventListener("click", closeAnyMaximized);

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAnyMaximized();
  });
}
