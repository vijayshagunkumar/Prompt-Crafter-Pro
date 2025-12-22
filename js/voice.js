// voice.js - Voice Input and Output Features for PromptCraft (FIXED FOR MOBILE)

// Voice Recognition State
let voiceRecognition = null;
let isListening = false;
let voiceLanguage = 'en-US';
let lastVoiceResult = ''; // NEW: Track last result to prevent duplicates

// Text-to-Speech State
let voiceSynthesis = window.speechSynthesis;
let isSpeaking = false;
let currentUtterance = null;

// Initialize Voice Features
function initializeVoiceFeatures() {
  // Load voice language preference
  const savedLanguage = localStorage.getItem('voiceLanguage') || 'en-US';
  voiceLanguage = savedLanguage;
  
  // Set language dropdown if exists
  const languageSelect = document.getElementById('voiceLanguage');
  if (languageSelect) {
    languageSelect.value = voiceLanguage;
  }
  
  // Check browser support
  checkVoiceSupport();
  
  // Setup voice input
  setupVoiceInput();
  
  // Setup voice output
  setupVoiceOutput();
}

// Check browser support for voice features
function checkVoiceSupport() {
  const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const hasSynthesis = 'speechSynthesis' in window;
  
  if (!hasRecognition) {
    console.warn('Speech Recognition not supported in this browser');
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    if (voiceInputBtn) {
      voiceInputBtn.title = 'Voice input not supported in this browser';
      voiceInputBtn.style.opacity = '0.5';
      voiceInputBtn.style.cursor = 'not-allowed';
    }
  }
  
  if (!hasSynthesis) {
    console.warn('Speech Synthesis not supported in this browser');
    const voiceOutputBtn = document.getElementById('voiceOutputBtn');
    if (voiceOutputBtn) {
      voiceOutputBtn.title = 'Voice output not supported in this browser';
      voiceOutputBtn.style.opacity = '0.5';
      voiceOutputBtn.style.cursor = 'not-allowed';
    }
  }
}

// Setup Voice Input (Speech-to-Text) - FIXED FOR MOBILE DUPLICATES
function setupVoiceInput() {
  const voiceInputBtn = document.getElementById('voiceInputBtn');
  if (!voiceInputBtn) return;
  
  // Check if browser supports speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    voiceInputBtn.disabled = true;
    voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    return;
  }
  
  // Initialize recognition
  voiceRecognition = new SpeechRecognition();
  voiceRecognition.continuous = true;
  voiceRecognition.interimResults = true;
  voiceRecognition.lang = voiceLanguage;
  voiceRecognition.maxAlternatives = 1; // NEW: Reduce alternatives to prevent duplicates
  
  // Event listeners
  voiceRecognition.onstart = function() {
    isListening = true;
    lastVoiceResult = ''; // Reset last result
    voiceInputBtn.classList.add('recording');
    voiceInputBtn.innerHTML = '<i class="fas fa-stop"></i>';
    voiceInputBtn.title = 'Click to stop recording';
    showVoiceStatus('voiceInputStatus', true);
    console.log('Voice recognition started');
  };
  
  voiceRecognition.onresult = function(event) {
    let interimTranscript = '';
    let finalTranscript = '';
    let isFinal = false;
    
    // NEW: Simplified result processing for mobile
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript.trim();
      
      // Check if this is the same as last result (mobile duplicate prevention)
      if (transcript === lastVoiceResult && event.results[i].isFinal) {
        continue; // Skip duplicates
      }
      
      if (event.results[i].isFinal) {
        finalTranscript = transcript;
        lastVoiceResult = transcript; // Store last result
        isFinal = true;
      } else {
        interimTranscript = transcript;
      }
    }
    
    const requirementEl = document.getElementById('requirement');
    if (requirementEl && finalTranscript) {
      // Only append if we have new final transcript
      const currentValue = requirementEl.value.trim();
      
      // Add space if there's existing text
      const separator = currentValue ? (currentValue.endsWith('.') || currentValue.endsWith('!') || currentValue.endsWith('?') ? ' ' : ' ') : '';
      
      requirementEl.value = currentValue + separator + finalTranscript;
      
      // Trigger input event to update stats and auto-convert
      const inputEvent = new Event('input', { bubbles: true });
      requirementEl.dispatchEvent(inputEvent);
      
      // NEW: For mobile, stop after getting final result to prevent duplicates
      if (isMobileDevice() && isFinal) {
        setTimeout(() => {
          if (isListening) {
            stopVoiceInput();
          }
        }, 500);
      }
    }
  };
  
  voiceRecognition.onerror = function(event) {
    console.error('Voice recognition error:', event.error);
    stopVoiceInput();
    
    let errorMessage = 'Voice input error';
    switch(event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected. Please try again.';
        break;
      case 'audio-capture':
        errorMessage = 'Microphone not accessible. Please check permissions.';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone permission denied.';
        break;
      default:
        errorMessage = `Voice input error: ${event.error}`;
    }
    
    if (typeof showNotification === 'function') {
      showNotification(errorMessage);
    }
  };
  
  voiceRecognition.onend = function() {
    stopVoiceInput();
  };
  
  // Button click handler
  voiceInputBtn.addEventListener('click', toggleVoiceInput);
}

// NEW: Mobile device detection
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Toggle voice input on/off
function toggleVoiceInput() {
  if (isListening) {
    stopVoiceInput();
  } else {
    startVoiceInput();
  }
}

// Start voice input
function startVoiceInput() {
  if (!voiceRecognition) return;
  
  try {
    voiceRecognition.lang = voiceLanguage;
    lastVoiceResult = ''; // Reset last result
    voiceRecognition.start();
    
    if (typeof showNotification === 'function') {
      showNotification('Listening... Speak now (click microphone to stop)');
    }
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    if (typeof showNotification === 'function') {
      showNotification('Could not start voice input');
    }
  }
}

// Stop voice input
function stopVoiceInput() {
  if (!voiceRecognition || !isListening) return;
  
  isListening = false;
  const voiceInputBtn = document.getElementById('voiceInputBtn');
  if (voiceInputBtn) {
    voiceInputBtn.classList.remove('recording');
    voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceInputBtn.title = 'Voice Input';
  }
  showVoiceStatus('voiceInputStatus', false);
  
  try {
    voiceRecognition.stop();
  } catch (error) {
    console.error('Error stopping voice recognition:', error);
  }
  
  if (typeof showNotification === 'function') {
    showNotification('Voice recording stopped');
  }
}

// Setup Voice Output (Text-to-Speech)
function setupVoiceOutput() {
  const voiceOutputBtn = document.getElementById('voiceOutputBtn');
  const outputTextarea = document.getElementById('output');
  
  if (!voiceOutputBtn || !outputTextarea) return;
  
  // Initial check for content
  if (outputTextarea.value.trim()) {
    voiceOutputBtn.style.display = 'flex';
  } else {
    voiceOutputBtn.style.display = 'none';
    stopVoiceOutput();
  }
  
  // Button click handler
  voiceOutputBtn.addEventListener('click', toggleVoiceOutput);
  
  // Listen for content changes in output
  const observer = new MutationObserver(() => {
    if (outputTextarea.value.trim()) {
      voiceOutputBtn.style.display = 'flex';
    } else {
      voiceOutputBtn.style.display = 'none';
      stopVoiceOutput();
    }
  });
  
  observer.observe(outputTextarea, { 
    attributes: true, 
    childList: true, 
    characterData: true,
    subtree: true 
  });
  
  // Also listen to input events
  outputTextarea.addEventListener('input', () => {
    if (outputTextarea.value.trim()) {
      voiceOutputBtn.style.display = 'flex';
    } else {
      voiceOutputBtn.style.display = 'none';
      stopVoiceOutput();
    }
  });
}

// Toggle voice output on/off
function toggleVoiceOutput() {
  if (isSpeaking) {
    stopVoiceOutput();
  } else {
    startVoiceOutput();
  }
}

// Start voice output (read the prompt aloud)
function startVoiceOutput() {
  const outputTextarea = document.getElementById('output');
  const voiceOutputBtn = document.getElementById('voiceOutputBtn');
  
  if (!outputTextarea || !voiceOutputBtn) return;
  
  const text = outputTextarea.value.trim();
  if (!text) {
    if (typeof showNotification === 'function') {
      showNotification('No text to read');
    }
    return;
  }
  
  // Cancel any ongoing speech
  if (voiceSynthesis.speaking) {
    voiceSynthesis.cancel();
  }
  
  // Create utterance
  currentUtterance = new SpeechSynthesisUtterance(text);
  
  // Set language
  currentUtterance.lang = voiceLanguage;
  
  // Set voice (try to find a voice matching the language)
  const voices = voiceSynthesis.getVoices();
  const matchingVoice = voices.find(voice => voice.lang.startsWith(voiceLanguage.split('-')[0]));
  if (matchingVoice) {
    currentUtterance.voice = matchingVoice;
  }
  
  // Speech parameters
  currentUtterance.rate = 1.0;
  currentUtterance.pitch = 1.0;
  currentUtterance.volume = 1.0;
  
  // Event handlers
  currentUtterance.onstart = function() {
    isSpeaking = true;
    voiceOutputBtn.classList.add('speaking');
    voiceOutputBtn.innerHTML = '<i class="fas fa-stop"></i>';
    voiceOutputBtn.title = 'Stop reading';
    showVoiceStatus('voiceOutputStatus', true);
  };
  
  currentUtterance.onend = function() {
    stopVoiceOutput();
  };
  
  currentUtterance.onerror = function(event) {
    console.error('Speech synthesis error:', event);
    stopVoiceOutput();
    if (typeof showNotification === 'function') {
      showNotification('Error reading text aloud');
    }
  };
  
  // Start speaking
  voiceSynthesis.speak(currentUtterance);
  
  if (typeof showNotification === 'function') {
    showNotification('Reading prompt aloud... (click speaker to stop)');
  }
}

// Stop voice output
function stopVoiceOutput() {
  const voiceOutputBtn = document.getElementById('voiceOutputBtn');
  
  isSpeaking = false;
  
  if (voiceOutputBtn) {
    voiceOutputBtn.classList.remove('speaking');
    voiceOutputBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    voiceOutputBtn.title = 'Read Aloud';
  }
  
  showVoiceStatus('voiceOutputStatus', false);
  
  if (voiceSynthesis.speaking) {
    voiceSynthesis.cancel();
  }
  
  currentUtterance = null;
  
  if (typeof showNotification === 'function') {
    showNotification('Reading stopped');
  }
}

// Show/hide voice status indicator
function showVoiceStatus(elementId, show) {
  const statusElement = document.getElementById(elementId);
  if (statusElement) {
    statusElement.style.display = show ? 'flex' : 'none';
  }
}

// Update voice language
function updateVoiceLanguage(language) {
  voiceLanguage = language;
  localStorage.setItem('voiceLanguage', language);
  
  // Update recognition language if active
  if (voiceRecognition) {
    voiceRecognition.lang = language;
    
    // Restart if currently listening
    if (isListening) {
      stopVoiceInput();
      setTimeout(startVoiceInput, 100);
    }
  }
  
  if (typeof showNotification === 'function') {
    showNotification(`Voice language updated to ${language}`);
  }
}

// Save voice language from settings
function saveVoiceLanguage() {
  const languageSelect = document.getElementById('voiceLanguage');
  if (languageSelect) {
    updateVoiceLanguage(languageSelect.value);
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  stopVoiceInput();
  stopVoiceOutput();
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVoiceFeatures);
} else {
  initializeVoiceFeatures();
}

// Export functions for use in app.js if needed
window.voiceFeatures = {
  startVoiceInput,
  stopVoiceInput,
  toggleVoiceInput,
  startVoiceOutput,
  stopVoiceOutput,
  toggleVoiceOutput,
  updateVoiceLanguage,
  saveVoiceLanguage
};
