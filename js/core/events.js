import { callBackend } from "./api.js";

const $ = id => document.getElementById(id);

export function initializeEvents() {
  const input = $("requirement");
  const output = $("output");
  const convertBtn = $("convertBtn");
  const resetBtn = $("resetBtn");
  const badge = $("convertedBadge");
  const overlay = $("expandOverlay");

  /* ---------------- Convert ---------------- */
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

  /* ---------------- Expand / Minimize ---------------- */
  function expand(el) {
    el.classList.add("textarea-expanded");
    overlay.classList.remove("hidden");
    el.parentElement.classList.add("expanded-wrapper");
  }

  function collapseAll() {
    document.querySelectorAll(".textarea-expanded")
      .forEach(el => el.classList.remove("textarea-expanded"));
    document.querySelectorAll(".expanded-wrapper")
      .forEach(el => el.classList.remove("expanded-wrapper"));
    overlay.classList.add("hidden");
  }

  $("expandInputBtn").onclick = () => expand(input);
  $("expandOutputBtn").onclick = () => expand(output);
  overlay.onclick = collapseAll;

  /* ---------------- AI Tool Clicks ---------------- */
  document.querySelectorAll(".launch-list button").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!output.value.trim()) {
        alert("Generate a prompt first");
        return;
      }

      navigator.clipboard.writeText(output.value);

      const map = {
        chatgptBtn: "https://chat.openai.com/",
        claudeBtn: "https://claude.ai/",
        geminiBtn: "https://gemini.google.com/",
        perplexityBtn: "https://www.perplexity.ai/",
        deepseekBtn: "https://chat.deepseek.com/",
        copilotBtn: "https://copilot.microsoft.com/",
        grokBtn: "https://x.ai/"
      };

      const url = map[btn.id];
      if (url) window.open(url, "_blank");
    });
  });
}
