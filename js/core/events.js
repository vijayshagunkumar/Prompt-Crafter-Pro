import { callBackend } from "./api.js";

const $ = id => document.getElementById(id);

export function initializeEvents() {
  const input = $("requirement");
  const output = $("output");
  const convertBtn = $("convertBtn");
  const resetBtn = $("resetBtn");
  const badge = $("convertedBadge");
  const overlay = $("expandOverlay");

  input.addEventListener("input", () => {
    convertBtn.disabled = !input.value.trim();
  });

  convertBtn.addEventListener("click", async () => {
    convertBtn.disabled = true;
    try {
      output.value = await callBackend(input.value);
      badge.classList.remove("hidden");
    } catch (e) {
      alert(e.message);
    } finally {
      convertBtn.disabled = false;
    }
  });

  resetBtn.addEventListener("click", () => {
    input.value = "";
    output.value = "";
    badge.classList.add("hidden");
    $("intentRow").classList.add("hidden");
  });

  function expand(el) {
    el.classList.add("textarea-expanded");
    overlay.classList.remove("hidden");
  }

  function collapse() {
    document.querySelectorAll(".textarea-expanded")
      .forEach(el => el.classList.remove("textarea-expanded"));
    overlay.classList.add("hidden");
  }

  $("expandInputBtn").onclick = () => expand(input);
  $("expandOutputBtn").onclick = () => expand(output);
  overlay.onclick = collapse;
}
