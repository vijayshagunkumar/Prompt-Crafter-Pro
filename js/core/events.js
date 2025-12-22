/* ======================================================
   events.js
   Purpose: Central event wiring & UI behavior
====================================================== */

import { callBackend } from "./api.js";

/* ------------------------------
   Helpers
------------------------------ */
function $(id) {
  return document.getElementById(id);
}

function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

/* ------------------------------
   Expand / Collapse Textarea
------------------------------ */
function setupExpandButtons() {
  const overlay = $("expandOverlay");

  function expand(textarea) {
    textarea.classList.add("textarea-expanded");
    show(overlay);
  }

  function collapse(textarea) {
    textarea.classList.remove("textarea-expanded");
    hide(overlay);
  }

  $("expandInputBtn")?.addEventListener("click", () =>
    expand($("requirement"))
  );

  $("expandOutputBtn")?.addEventListener("click", () =>
    expand($("output"))
  );

  overlay?.addEventListener("click", () => {
    collapse($("requirement"));
    collapse($("output"));
  });
}

/* ------------------------------
   Convert Button Logic
------------------------------ */
function setupConvertButton() {
  const input = $("requirement");
  const output = $("output");
  const btn = $("convertBtn");
  const badge = $("convertedBadge");

  if (!input || !output || !btn) return;

  input.addEventListener("input", () => {
    btn.disabled = !input.value.trim();
  });

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Converting`;

    try {
      const result = await callBackend(input.value);
      output.value = result;
      show(badge);
    } catch (err) {
      alert(err.message);
    } finally {
      btn.innerHTML = `<i class="fas fa-magic"></i> Convert`;
      btn.disabled = false;
    }
  });
}

/* ------------------------------
   Reset Button
------------------------------ */
function setupResetButton() {
  $("resetBtn")?.addEventListener("click", () => {
    $("requirement").value = "";
    $("output").value = "";

    hide($("intentRow"));
    hide($("convertedBadge"));
  });
}

/* ------------------------------
   Public Initializer
------------------------------ */
export function initializeEvents() {
  setupExpandButtons();
  setupConvertButton();
  setupResetButton();
}
