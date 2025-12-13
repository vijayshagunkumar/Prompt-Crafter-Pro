console.log("🔥 PromptCraft app.js LOADED");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOMContentLoaded fired");

  const ideaCard = document.getElementById("cardIdea");
  const promptCard = document.getElementById("cardPrompt");

  if (!ideaCard || !promptCard) {
    console.error("❌ Cards not found in DOM");
    return;
  }

  const ideaTextarea = ideaCard.querySelector("textarea");
  const promptTextarea = promptCard.querySelector("textarea");
  const convertBtn = ideaCard.querySelector("button.primary-btn");

  if (!ideaTextarea || !promptTextarea || !convertBtn) {
    console.error("❌ Required elements missing", {
      ideaTextarea,
      promptTextarea,
      convertBtn
    });
    return;
  }

  console.log("✅ Elements found, binding click");

  convertBtn.addEventListener("click", () => {
    console.log("👉 Convert clicked");

    const text = ideaTextarea.value.trim();
    if (!text) {
      alert("Type something first");
      return;
    }

    promptTextarea.value =
`# Role
Expert Assistant

# Task
${text}

# Instructions
Return only the final result.`;

    console.log("✅ Prompt written");
  });
});
