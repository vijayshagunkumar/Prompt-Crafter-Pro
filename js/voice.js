// voice.js - Voice Input and Output Features for PromptCraft

// -------------------------
// State
// -------------------------
let voiceRecognition = null;
let isListening = false;
let voiceLanguage = "en-US";
let lastVoiceResult = "";

let isSpeaking = false;
let currentUtterance = null;

// -------------------------
// Helpers
// -------------------------
function getEl(id) {
  return document.getElementById(id);
}

function safeNotify(message) {
  // Use global notification helper from app.js if available
  if (typeof window.showNotification === "function") {
    window.showNotification(message);
  } else {
    console.log("[Voice]", message);
  }
}

// -------------------------
// Voice INPUT (speech → text)
// -------------------------
function initRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    safeNotify("Voice input not supported in this browser.");
    return null;
  }

  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = voiceLanguage;
  return rec;
}

function startVoiceInput() {
  if (isListening) return;

  if (!voiceRecognition) {
    voiceRecognition = initRecognition();
  }
  if (!voiceRecognition) return;

  const micBtn = getEl("voiceInputBtn");
  const status = getEl("voiceInputStatus");

  try {
    isListening = true;
    lastVoiceResult = "";

    micBtn?.classList.add("recording");
    if (status) {
      status.style.display = "flex";
      status.querySelector("span").textContent = "Listening… speak your idea";
    }

    voiceRecognition.lang = voiceLanguage;

    voiceRecognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcript = transcript.trim();
      lastVoiceResult = transcript;

      const textarea = getEl("requirement");
      if (!textarea) return;

      const current = textarea.value.trim();
      const separator = current ? " " : "";
      textarea.value = current + separator + transcript;
      // trigger app.js listeners
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("keyup", { bubbles: true }));
    };

    voiceRecognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      safeNotify("Voice input error or permission blocked.");
      stopVoiceInput();
    };

    voiceRecognition.onend = () => {
      stopVoiceInput();
    };

    voiceRecognition.start();
    safeNotify("Voice input started");
  } catch (err) {
    console.error("Voice start error:", err);
    safeNotify("Could not start voice input.");
    stopVoiceInput();
  }
}

function stopVoiceInput() {
  if (!isListening) return;

  try {
    if (voiceRecognition) {
      voiceRecognition.onresult = null;
      voiceRecognition.onend = null;
      voiceRecognition.onerror = null;
      voiceRecognition.stop();
    }
  } catch (err) {
    console.log("Voice stop error:", err);
  }

  isListening = false;

  const micBtn = getEl("voiceInputBtn");
  const status = getEl("voiceInputStatus");
  micBtn?.classList.remove("recording");
  if (status) {
    status.style.display = "none";
  }
}

function toggleVoiceInput() {
  if (isListening) {
    stopVoiceInput();
  } else {
    startVoiceInput();
  }
}

// -------------------------
// Voice OUTPUT (text → speech)
// -------------------------
function startVoiceOutput() {
  if (isSpeaking) {
    stopVoiceOutput();
    return;
  }

  const outputEl = getEl("output");
  if (!outputEl) return;

  const text = outputEl.value.trim();
  if (!text) {
    safeNotify("Nothing to read. Generate a prompt first.");
    return;
  }

  const status = getEl("voiceOutputStatus");
  const btn = getEl("voiceOutputBtn");

  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      isSpeaking = true;
      currentUtterance = utterance;
      btn?.classList.add("speaking");
      if (status) {
        status.style.display = "flex";
        status.querySelector("span").textContent = "Reading your prompt…";
      }
    };

    utterance.onend = () => {
      stopVoiceOutput();
    };

    utterance.onerror = () => {
      stopVoiceOutput();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Voice output error:", err);
    safeNotify("Could not start voice output.");
    stopVoiceOutput();
  }
}

function stopVoiceOutput() {
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch (err) {
    console.log("speechSynthesis.cancel error:", err);
  }

  isSpeaking = false;
  currentUtterance = null;

  const status = getEl("voiceOutputStatus");
  const btn = getEl("voiceOutputBtn");
  btn?.classList.remove("speaking");
  if (status) {
    status.style.display = "none";
  }
}

function toggleVoiceOutput() {
  if (isSpeaking) {
    stopVoiceOutput();
  } else {
    startVoiceOutput();
  }
}

// -------------------------
// Language preference
// -------------------------
function updateVoiceLanguage(lang) {
  voiceLanguage = lang || "en-US";
  try {
    localStorage.setItem("promptCrafterVoiceLang", voiceLanguage);
  } catch (e) {
    console.log("Could not store voice language:", e);
  }
  if (voiceRecognition) {
    voiceRecognition.lang = voiceLanguage;
  }
  safeNotify("Voice language set to " + voiceLanguage);
}

function loadVoiceLanguage() {
  try {
    const saved = localStorage.getItem("promptCrafterVoiceLang");
    if (saved) {
      voiceLanguage = saved;
      const select = getEl("voiceLanguage");
      if (select) {
        select.value = saved;
      }
    }
  } catch (e) {
    console.log("Could not load voice language:", e);
  }
}

// -------------------------
// Init wiring
// -------------------------
function initializeVoiceFeatures() {
  loadVoiceLanguage();

  const micBtn = getEl("voiceInputBtn");
  const clearBtn = getEl("clearInputBtn");
  const outBtn = getEl("voiceOutputBtn");
  const langSelect = getEl("voiceLanguage");
  const outputEl = getEl("output");

  if (micBtn) {
    micBtn.addEventListener("click", toggleVoiceInput);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const textarea = getEl("requirement");
      if (textarea) {
        textarea.value = "";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("keyup", { bubbles: true }));
      }
    });
  }

  if (outBtn) {
    outBtn.addEventListener("click", toggleVoiceOutput);
  }

  if (langSelect) {
    langSelect.addEventListener("change", (e) =>
      updateVoiceLanguage(e.target.value)
    );
  }

  // Show / hide "Read Aloud" button depending on whether we have output text
  if (outputEl && outBtn) {
    const observer = new MutationObserver(() => {
      const hasText = !!outputEl.value.trim();
      outBtn.style.display = hasText ? "inline-flex" : "none";
    });

    observer.observe(outputEl, {
      characterData: true,
      subtree: true,
      childList: true
    });

    // Also run once initially
    const hasText = !!outputEl.value.trim();
    outBtn.style.display = hasText ? "inline-flex" : "none";

    // Fallback: listen to input event as well
    outputEl.addEventListener("input", () => {
      const hasTextNow = !!outputEl.value.trim();
      outBtn.style.display = hasTextNow ? "inline-flex" : "none";
    });
  }
}

// Auto-init once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeVoiceFeatures);
} else {
  initializeVoiceFeatures();
}

// Expose a tiny API if needed by app.js
window.voiceFeatures = {
  startVoiceInput,
  stopVoiceInput,
  toggleVoiceInput,
  startVoiceOutput,
  stopVoiceOutput,
  toggleVoiceOutput,
  updateVoiceLanguage
};
