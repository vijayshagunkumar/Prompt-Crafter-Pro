// voice.js - Voice Input Features

/**
 * Voice Recognition State
 */
class VoiceRecognition {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.language = 'en-US';
    this.lastResult = '';
    this.init();
  }

  /**
   * Initialize voice recognition
   */
  init() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return false;
    }

    // Initialize recognition
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = 1;

    return true;
  }

  /**
   * Start listening
   * @returns {boolean} Success status
   */
  start() {
    if (!this.recognition || this.isListening) return false;

    try {
      this.recognition.start();
      this.isListening = true;
      this.lastResult = '';
      return true;
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    } finally {
      this.isListening = false;
    }
  }

  /**
   * Toggle listening state
   * @returns {boolean} New listening state
   */
  toggle() {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      return this.start();
    }
  }

  /**
   * Set recognition language
   * @param {string} language - Language code
   */
  setLanguage(language) {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  /**
   * Get supported languages
   * @returns {Array} List of supported languages
   */
  getSupportedLanguages() {
    // This is a simplified list. In a real app, you'd check browser support
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Spanish' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'hi-IN', name: 'Hindi' }
    ];
  }

  /**
   * Check if browser supports voice recognition
   * @returns {boolean} Support status
   */
  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Get current listening state
   * @returns {boolean} Listening state
   */
  getListeningState() {
    return this.isListening;
  }
}

// Create singleton instance
const voiceRecognition = new VoiceRecognition();

// Export functions
export function initializeVoice() {
  return voiceRecognition.init();
}

export function startVoiceInput() {
  return voiceRecognition.start();
}

export function stopVoiceInput() {
  voiceRecognition.stop();
}

export function toggleVoiceInput() {
  return voiceRecognition.toggle();
}

export function setVoiceLanguage(language) {
  voiceRecognition.setLanguage(language);
}

export function isVoiceSupported() {
  return voiceRecognition.isSupported();
}

export function isListening() {
  return voiceRecognition.getListeningState();
}

export function getVoiceLanguages() {
  return voiceRecognition.getSupportedLanguages();
}

/**
 * Setup voice input button
 * @param {HTMLElement} button - Voice button element
 * @param {HTMLElement} textarea - Textarea element
 * @param {Function} onResult - Callback for results
 */
export function setupVoiceButton(button, textarea, onResult) {
  if (!voiceRecognition.isSupported()) {
    button.disabled = true;
    button.title = 'Voice input not supported';
    button.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    return;
  }

  // Setup recognition event handlers
  voiceRecognition.recognition.onstart = () => {
    button.innerHTML = '<i class="fas fa-stop"></i>';
    button.classList.add('recording');
    button.title = 'Stop recording';
  };

  voiceRecognition.recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    voiceRecognition.lastResult = transcript;
    
    if (textarea) {
      textarea.value = transcript;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (onResult) {
      onResult(transcript);
    }
  };

  voiceRecognition.recognition.onerror = (event) => {
    console.error('Voice recognition error:', event.error);
    
    let errorMessage = 'Voice input error';
    switch(event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected';
        break;
      case 'audio-capture':
        errorMessage = 'Microphone not accessible';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone permission denied';
        break;
    }
    
    if (onResult && typeof onResult === 'function') {
      onResult(null, errorMessage);
    }
  };

  voiceRecognition.recognition.onend = () => {
    button.innerHTML = '<i class="fas fa-microphone"></i>';
    button.classList.remove('recording');
    button.title = 'Voice Input';
    voiceRecognition.isListening = false;
  };

  // Setup button click handler
  button.addEventListener('click', () => {
    voiceRecognition.toggle();
  });
}
