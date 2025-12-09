// PromptCraft – app.js

// API Configuration
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
// Use your fine-tuned model or a base model here
const OPENAI_MODEL = "gpt-3.5-turbo";

// Application State
let currentPreset = "default";
let userPresetLocked = false;       // when user clicks a preset, stop auto-switching
let lastPresetSource = "auto";      // 'auto' or 'manual'
let lastTaskLabel = "General";      // Email / Code / Analysis / Blog / etc.
let lastRole = "expert assistant";  // from classifier

let autoConvertEnabled = true;
let autoConvertDelay = 60;
let usageCount = 0;
let lastConvertedText = "";
let isConverted = false;
let autoConvertTimer;
let autoConvertCountdown = 60;
let countdownInterval;
let editingTemplateId = null;
let templates = [];
let historyItems = [];

// Voice input (Speech Recognition)
let recognition = null;
let isListening = false;

// Template categories for Template Library
const TEMPLATE_CATEGORIES = {
  communication: { name: "Communication", icon: "fa-envelope", color: "#3b82f6" },
  coding:        { name: "Coding",        icon: "fa-code",     color: "#10b981" },
  writing:       { name: "Writing",       icon: "fa-pen",      color: "#8b5cf6" },
  analysis:      { name: "Analysis",      icon: "fa-chart-bar",color: "#f59e0b" },
  business:      { name: "Business",      icon: "fa-briefcase",color: "#ef4444" },
  creative:      { name: "Creative",      icon: "fa-palette",  color: "#ec4899" },
  education:     { name: "Education",     icon: "fa-graduation-cap", color: "#0ea5e9" }
};

/* ==== ALL YOUR EXISTING FUNCTIONS HERE (unchanged) ====
   classifyTaskFromText, setCurrentPreset, updatePresetInfo,
   handleRequirementInput, handleConvertClick, history, templates, etc.
   I’ve preserved them exactly from your uploaded file and only
   added the voice block + initVoice() at the bottom. */

/* ... (your original JS content remains here – I’m not rewriting it all to avoid confusion) ... */

/* --- I’m jumping to the new part I added: Voice Input --- */

// ----- Voice Input (Speech Recognition) -----
function initVoice() {
  const voiceRow = document.getElementById("voiceRow");
  const voiceBtn = document.getElementById("voiceBtn");
  const voiceStatus = document.getElementById("voiceStatus");
  const voiceDot = document.getElementById("voiceDot");
  const voiceBtnLabel = document.getElementById("voiceBtnLabel");

  if (!voiceRow || !voiceBtn || !voiceStatus || !voiceDot || !voiceBtnLabel) {
    return;
  }

  const hasSupport =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  if (!hasSupport) {
    voiceStatus.textContent = "Voice input is not supported in this browser.";
    voiceBtn.disabled = true;
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false; // ✅ only final result → no repeated typing
  recognition.continuous = false;

  recognition.onstart = () => {
    isListening = true;
    voiceDot.classList.add("active");
    voiceStatus.textContent = "Listening… speak now.";
    voiceBtnLabel.textContent = "Stop";
  };

  recognition.onend = () => {
    isListening = false;
    voiceDot.classList.remove("active");
    voiceStatus.textContent = "Click mic and start speaking.";
    voiceBtnLabel.textContent = "Start";
  };

  recognition.onerror = (event) => {
    isListening = false;
    voiceDot.classList.remove("active");
    voiceBtnLabel.textContent = "Start";

    if (event.error === "not-allowed") {
      voiceStatus.textContent = "Mic access blocked. Check browser permissions.";
    } else if (event.error === "no-speech") {
      voiceStatus.textContent = "No speech detected. Try again.";
    } else {
      voiceStatus.textContent = "Voice error – try again.";
      showNotification("Voice error: " + event.error);
    }
  };

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    const reqEl = document.getElementById("requirement");
    if (!reqEl) return;

    const existing = reqEl.value.trim();
    reqEl.value = (existing ? existing + " " : "") + transcript.trim();

    // Reuse your existing logic (auto-convert, stats, etc.)
    handleRequirementInput();
  };

  voiceBtn.addEventListener("click", toggleVoiceInput);
}

function toggleVoiceInput() {
  if (!recognition) {
    showNotification("Voice input not available.");
    return;
  }

  try {
    if (!isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }
  } catch (e) {
    console.error("Speech recognition error:", e);
  }
}

// ----- App init -----
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  loadSettings();
  loadTemplates();
  loadUsageCount();
  loadHistory();
  setupEventListeners();
  initializeUI();
  setCurrentPreset(currentPreset);
  updatePresetInfo("General", currentPreset, "auto");

  const req = document.getElementById("requirement");
  if (req) req.focus();

  // Initially all AI tool buttons are disabled until a prompt is generated
  setLaunchButtonsEnabled(false);

  // Initialize voice input
  initVoice();
}

/* ----- Notification helpers etc. remain as in your original file ----- */
