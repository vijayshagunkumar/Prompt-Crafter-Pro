/* ======================================================
   voice.js
   Purpose: Voice input (STT) & output (TTS)
====================================================== */

let recognition = null;
let isListening = false;
let lastFinalTranscript = "";

/* ------------------------------
   Helpers
------------------------------ */
function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function showNotification(message) {
  const n = document.getElementById("notification");
  const t = document.getElementById("notificationText");
  if (!n || !t) return;

  t.textContent = message;
  n.classList.add("show");
  n.classList.remove("hidden");

  setTimeout(() => {
    n.classList.remove("show");
    n.classList.add("hidden");
  }, 2500);
}

/* ------------------------------
   Voice Input (Speech → Text)
------------------------------ */
function setupVoiceInput() {
  const btn = document.getElementById("voiceInputBtn");
  const input = document.getElementById("requirement");

  if (!btn || !input) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    btn.disabled = true;
    btn.title = "Voice input not supported";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = !isMobile();

  recognition.onstart = () => {
    isListening = true;
    lastFinalTranscript = "";
    btn.classList.add("recording");
    btn.innerHTML = '<i class="fas fa-stop"></i>';
  };

  recognition.onresult = event => {
    let finalText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      const transcript = res[0].transcript.trim();

      if (res.isFinal && transcript !== lastFinalTranscript) {
        finalText += transcript + " ";
        lastFinalTranscript = transcript;
      }
    }

    if (finalText) {
      input.value = (input.value + " " + finalText).trim();
      input.dispatchEvent(new Event("input", { bubbles: true }));

      if (isMobile()) {
        stopVoiceInput();
      }
    }
  };

  recognition.onerror = e => {
    stopVoiceInput();
    showNotification("Voice error: " + e.error);
  };

  recognition.onend = () => stopVoiceInput();

  btn.addEventListener("click", () => {
    isListening ? stopVoiceInput() : recognition.start();
  });
}

function stopVoiceInput() {
  const btn = document.getElementById("voiceInputBtn");
  if (!btn) return;

  isListening = false;
  btn.classList.remove("recording");
  btn.innerHTML = '<i class="fas fa-microphone"></i>';

  try {
    recognition && recognition.stop();
  } catch (_) {}
}

/* ------------------------------
   Voice Output (Text → Speech)
------------------------------ */
function setupVoiceOutput() {
  const btn = document.getElementById("voiceOutputBtn");
  const output = document.getElementById("output");

  if (!btn || !output || !window.speechSynthesis) return;

  btn.addEventListener("click", () => {
    const text = output.value.trim();
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  });
}

/* ------------------------------
   Public Initializer
------------------------------ */
export function initializeVoiceFeatures() {
  setupVoiceInput();
  setupVoiceOutput();
}
