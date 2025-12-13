import { detectContextFromText } from "./features/context-detective.js";
import { initCardExpander } from "./features/card-expander.js";
import { renderAITools } from "./ai/ai-tools.js";

// DOM references
const ideaTextarea = document.querySelector("#cardIdea textarea");
const promptTextarea = document.querySelector("#cardPrompt textarea");
const convertBtn = document.querySelector("#cardIdea .primary-btn");

// INIT APP
document.addEventListener("DOMContentLoaded", () => {
  initCardExpander();
  bindConvert();
});

function bindConvert() {
  convertBtn.addEventListener("click", handleConvert);
}

function handleConvert() {
  const rawText = ideaTextarea.value.trim();
  if (!rawText) return;

  const context = detectContextFromText(rawText);

  const structuredPrompt = `
# Role
Expert Assistant

# Objective
Carry out the following task and return the final result only.

${rawText}

# Instructions
- Follow the task carefully
- Do not explain the prompt
- Return only the completed output
  `.trim();

  promptTextarea.value = structuredPrompt;

  renderAITools(context.taskType);
}
