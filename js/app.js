import { initializeIntentDetection } from "./features/intent.js";
import { initializeAIToolRanking } from "./features/ai-tool-ranker.js";
import { initializeVoiceFeatures } from "./features/voice.js";
import { initializeEvents } from "./core/events.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeIntentDetection();
  initializeAIToolRanking();
  initializeVoiceFeatures();
  initializeEvents();
});
