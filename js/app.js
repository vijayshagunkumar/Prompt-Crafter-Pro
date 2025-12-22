/* ======================================================
   app.js
   Purpose: Application bootstrap only
====================================================== */

import { initializeIntentDetection } from "./features/intent.js";
import { initializeAIToolRanking } from "./features/ai-tool-ranker.js";
import { initializeVoiceFeatures } from "./features/voice.js";
import { initializeUI } from "./ui/cards.js";
import { initializeEvents } from "./core/events.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeUI();
  initializeIntentDetection();
  initializeAIToolRanking();
  initializeVoiceFeatures();
  initializeEvents();
});
