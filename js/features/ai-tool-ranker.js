export function initializeAIToolRanking() {
  document.addEventListener("intent:updated", e => {
    const type = e.detail.taskType;
    const order =
      type === "code"
        ? ["deepseekBtn", "copilotBtn", "chatgptBtn"]
        : ["chatgptBtn", "claudeBtn", "geminiBtn"];

    const container = document.querySelector(".launch-list");
    order.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) container.appendChild(btn);
    });
  });
}
