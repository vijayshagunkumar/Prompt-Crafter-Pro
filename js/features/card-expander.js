export function initCardExpander() {
  const buttons = document.querySelectorAll(".card-max-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      toggle(card, btn);
    });
  });
}

function toggle(card, btn) {
  const isOpen = card.classList.contains("is-maximized");

  closeAll();

  if (!isOpen) {
    card.classList.add("is-maximized");
    document.body.classList.add("card-max-open");
    btn.innerHTML = '<i class="fa-solid fa-compress"></i>';
  }
}

function closeAll() {
  document.querySelectorAll(".card.is-maximized").forEach(card => {
    card.classList.remove("is-maximized");
    const btn = card.querySelector(".card-max-btn");
    if (btn) btn.innerHTML = '<i class="fa-solid fa-expand"></i>';
  });

  document.body.classList.remove("card-max-open");
}
