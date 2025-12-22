/* ======================================================
   events.js
   Purpose: Stable UI behavior (no dead states)
====================================================== */

import { callBackend } from "./api.js";

const $ = id => document.getElementById(id);

export function initializeEvents() {
  const input = $("requirement");
  const output = $("output");
  const convertBtn = $("convertBtn");
  const resetBtn = $("resetBtn");
  const badge = $("convertedBadge");
  const overlay = $("expandOverlay");

  let activeWrapper = null;

  /* ------------------------------
     Convert
  ------------------------------ */
  input.addEventListener("input", () => {
    convertBtn.disabled = !input.value.trim();
  });

  convertBtn.addEventListener("click", async () => {
    convertBtn.disabled = true;
    convertBtn.textContent = "Converting…";

    try {
      output.value = await callBackend(input.value);
      badge.classList.remove("hidden");
    } catch (e) {
      alert(e.message || "Generation failed");
    } finally {
      convertBtn.textContent = "Convert";
      convertBtn.disabled = false;
    }
  });

  /* ------------------------------
     Reset
  ------------------------------ */
  resetBtn.addEventListener("click", () => {
    input.value = "";
    output.value = "";
    badge.classList.add("hidden");
    $("intentRow").classList.add("hidden");
  });

  /* ------------------------------
     Expand / Minimize
  ------------------------------ */
  function expand(textarea) {
    collapse(); // safety

    const wrapper = textarea.closest(".textarea-wrapper");
    if (!wrapper) return;

    wrapper.classList.add("expanded-wrapper");
    textarea.classList.add("textarea-expanded");
    overlay.classList.remove("hidden");

    activeWrapper = wrapper;
  }

  function collapse() {
    document.querySelectorAll(".expanded-wrapper")
      .forEach(w => w.classList.remove("expanded-wrapper"));

    document.querySelectorAll(".textarea-expanded")
      .forEach(t => t.classList.remove("textarea-expanded"));

    overlay.classList.add("hidden");
    activeWrapper = null;
  }

  $("expandInputBtn").addEventListener("click", () => expand(input));
  $("expandOutputBtn").addEventListener("click", () => expand(output));

  overlay.addEventListener("click", collapse);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") collapse();
  });

  /* ------------------------------
     Explicit Minimize Button
  ------------------------------ */
  document.querySelectorAll(".textarea-wrapper").forEach(wrapper => {
    const closeBtn = wrapper.querySelector(".minimize-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", collapse);
    }
  });

  /* ------------------------------
     AI Tool Buttons
  ------------------------------ */
  const toolUrls = {
    chatgptBtn: "https://chat.openai.com/",
    claudeBtn: "https://claude.ai/",
    geminiBtn: "https://gemini.google.com/",
    perplexityBtn: "https://www.perplexity.ai/",
    deepseekBtn: "https://chat.deepseek.com/",
    copilotBtn: "https://copilot.microsoft.com/",
    grokBtn: "https://x.ai/"
  };

  document.querySelectorAll(".launch-list button").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!output.value.trim()) {
        alert("Generate a prompt first");
        return;
      }

      navigator.clipboard.writeText(output.value).catch(() => {});
      const url = toolUrls[btn.id];
      if (url) window.open(url, "_blank");
    });
  });
}
