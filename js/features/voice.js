// Voice input/output functionality - FIXED MIC BUTTON
export class VoiceFeatures {
  constructor() {
    this.isListening = false;
    this.isSpeaking = false;
    this.recognition = null;
    this.synthesis = null;
    this.voiceLanguage = 'en-US';
    this.init();
  }
  
  init() {
    // Check for browser support
    this.checkSupport();
    this.setupEventListeners();
  }
  
  checkSupport() {
    // Check for Speech Recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
    
    // Check for Speech Synthesis support
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }
  
  setupRecognition() {
    if (!this.recognition) return;
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.voiceLanguage;
    
    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateVoiceUI('input', 'listening');
    };
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.handleVoiceInput(transcript);
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      this.updateVoiceUI('input', 'muted'); // Changed from 'idle' to 'muted' on error
      
      import('../ui/notifications.js').then(module => {
        module.notifications.error(`Voice input error: ${event.error}`);
      });
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      this.updateVoiceUI('input', 'idle'); // Changed back to idle when done
    };
  }
  
  setupEventListeners() {
    // Voice input button - FIXED LOGIC
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    if (voiceInputBtn) {
      // Set initial state - Mic with cut sign (muted/off)
      voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      voiceInputBtn.title = 'Click to enable voice input';
      voiceInputBtn.classList.add('muted');
      
      voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
    }
    
    // Voice output button
    const voiceOutputBtn = document.getElementById('voiceOutputBtn');
    if (voiceOutputBtn) {
      voiceOutputBtn.addEventListener('click', () => {
        const output = document.getElementById('output').value;
        if (output) {
          this.speakText(output);
        }
      });
    }
  }
  
  toggleVoiceInput() {
    if (!this.recognition) {
      import('../ui/notifications.js').then(module => {
        module.notifications.error('Speech recognition not supported in your browser');
      });
      return;
    }
    
    if (this.isListening) {
      this.stopVoiceInput();
    } else {
      this.startVoiceInput();
    }
  }
  
  startVoiceInput() {
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      this.updateVoiceUI('input', 'muted'); // Show muted state on error
      import('../ui/notifications.js').then(module => {
        module.notifications.error('Failed to start voice input');
      });
    }
  }
  
  stopVoiceInput() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }
  
  handleVoiceInput(transcript) {
    const requirementEl = document.getElementById('requirement');
    if (requirementEl) {
      // Append to existing text or replace if empty
      const currentText = requirementEl.value;
      if (currentText) {
        requirementEl.value = currentText + ' ' + transcript;
      } else {
        requirementEl.value = transcript;
      }
      
      // Trigger input event to update stats and auto-convert
      requirementEl.dispatchEvent(new Event('input'));
      
      import('../ui/notifications.js').then(module => {
        module.notifications.success('Voice input received');
      });
    }
  }
  
  speakText(text) {
    if (!this.synthesis) {
      import('../ui/notifications.js').then(module => {
        module.notifications.error('Text-to-speech not supported in your browser');
      });
      return;
    }
    
    if (this.isSpeaking) {
      this.stopSpeaking();
      return;
    }
    
    // Split text into chunks to avoid interruption limits
    const chunks = this.splitTextIntoChunks(text, 200);
    
    if (chunks.length === 0) return;
    
    this.isSpeaking = true;
    this.updateVoiceUI('output', 'speaking');
    
    // Speak first chunk
    this.speakChunk(chunks, 0);
  }
  
  speakChunk(chunks, index) {
    if (index >= chunks.length || !this.isSpeaking) {
      this.isSpeaking = false;
      this.updateVoiceUI('output', 'idle');
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = this.voiceLanguage;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      this.speakChunk(chunks, index + 1);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
      this.updateVoiceUI('output', 'idle');
      
      import('../ui/notifications.js').then(module => {
        module.notifications.error('Speech synthesis failed');
      });
    };
    
    this.synthesis.speak(utterance);
  }
  
  stopSpeaking() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.updateVoiceUI('output', 'idle');
    }
  }
  
  splitTextIntoChunks(text, maxLength) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        if (sentence.length <= maxLength) {
          currentChunk = sentence;
        } else {
          // Sentence is too long, split by words
          const words = sentence.split(' ');
          currentChunk = '';
          for (const word of words) {
            if ((currentChunk + ' ' + word).length <= maxLength) {
              currentChunk += (currentChunk ? ' ' : '') + word;
            } else {
              if (currentChunk) chunks.push(currentChunk);
              currentChunk = word;
            }
          }
        }
      }
    }
    
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }
  
  updateVoiceUI(type, state) {
    const buttonEl = document.getElementById(`voice${type === 'input' ? 'Input' : 'Output'}Btn`);
    
    if (buttonEl) {
      // Clear all states first
      buttonEl.classList.remove('listening', 'speaking', 'muted');
      
      if (state === 'listening') {
        buttonEl.classList.add('listening');
        // FIX: Show regular mic icon (no slash) when listening
        buttonEl.innerHTML = '<i class="fas fa-microphone"></i>';
        buttonEl.title = 'Listening... Click to stop';
      } 
      else if (state === 'speaking') {
        buttonEl.classList.add('speaking');
        buttonEl.innerHTML = '<i class="fas fa-volume-up"></i>';
        buttonEl.title = 'Speaking... Click to stop';
      }
      else if (state === 'muted') {
        buttonEl.classList.add('muted');
        buttonEl.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        buttonEl.title = 'Microphone muted. Click to enable';
      }
      else {
        // Idle state - Default to muted with slash
        buttonEl.classList.add('muted');
        buttonEl.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        buttonEl.title = type === 'input' ? 'Click to enable voice input' : 'Read Aloud';
      }
    }
  }
  
  updateVoiceLanguage(language) {
    this.voiceLanguage = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }
}

// Make it globally available for settings manager
window.voiceFeatures = new VoiceFeatures();
