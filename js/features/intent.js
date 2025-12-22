export function initializeIntentDetection() {
  const input = document.getElementById("requirement");
  const row = document.getElementById("intentRow");
  const scroll = document.getElementById("intentScroll");

  input.addEventListener("input", () => {
    const text = input.value.toLowerCase();
    scroll.innerHTML = "";

    if (!text) {
      row.classList.add("hidden");
      return;
    }

    const chips = [];
    if (text.includes("email")) chips.push("email");
    if (text.includes("code")) chips.push("code");
    if (text.includes("urgent")) chips.push("urgent");

    chips.forEach(c => {
      const s = document.createElement("span");
      s.className = "intent-chip";
      s.textContent = c;
      scroll.appendChild(s);
    });

    row.classList.toggle("hidden", chips.length === 0);

    document.dispatchEvent(new CustomEvent("intent:updated", {
      detail: { taskType: chips[0] || "general" }
    }));
  });
}
