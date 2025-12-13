const TOOL_MAP = {
  image_generation: [
    { name: "DALL·E", url: "https://chat.openai.com" },
    { name: "Midjourney", url: "https://www.midjourney.com" },
    { name: "Stable Diffusion", url: "https://stablediffusionweb.com" }
  ],
  writing: [
    { name: "ChatGPT", url: "https://chat.openai.com" },
    { name: "Claude", url: "https://claude.ai" }
  ],
  coding: [
    { name: "ChatGPT", url: "https://chat.openai.com" },
    { name: "Copilot", url: "https://copilot.microsoft.com" }
  ],
  analysis: [
    { name: "ChatGPT", url: "https://chat.openai.com" },
    { name: "Perplexity", url: "https://www.perplexity.ai" }
  ],
  general: [
    { name: "ChatGPT", url: "https://chat.openai.com" }
  ]
};

export function renderAITools(type = "general") {
  const grid = document.querySelector(".tools-grid");
  grid.innerHTML = "";

  const tools = TOOL_MAP[type] || TOOL_MAP.general;

  tools.forEach(tool => {
    const card = document.createElement("div");
    card.className = "tool-card";
    card.innerHTML = `
      <strong>${tool.name}</strong>
      <button class="ghost-btn open-tool">Open</button>
    `;

    card.querySelector(".open-tool").onclick = () => {
      window.open(tool.url, "_blank");
    };

    grid.appendChild(card);
  });
}
