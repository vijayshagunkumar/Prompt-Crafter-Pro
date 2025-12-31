class VoiceManager {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.voiceLanguage = 'en-US';
        this.lastVoiceResult = '';
        
        this.init();
    }

    init() {
        this.loadVoiceSettings();
        this.checkBrowserSupport();
    }

    loadVoiceSettings() {
        const savedLanguage = localStorage.getItem('voiceLanguage') || 'en-US';
        this.voiceLanguage = savedLanguage;
    }

    checkBrowserSupport() {
        const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        const hasSynthesis = 'speechSynthesis' in window;
        
        if (!hasRecognition) {
            console.warn('Speech Recognition not supported');
            const micBtn = document.getElementById('micBtn');
            if (micBtn) {
                micBtn.style.display = 'none';
            }
        }
        
        if (!hasSynthesis) {
            console.warn('Speech Synthesis not supported');
            const speakBtn = document.getElementById('speakBtn');
            if (speakBtn) {
                speakBtn.style.display = 'none';
            }
        }
    }

    setupVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error('Speech Recognition API not available');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.voiceLanguage;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.lastVoiceResult = '';
            this.updateMicButton(true);
            this.showVoiceStatus(true);
            console.log('Voice recognition started');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            let isFinal = false;

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.trim();
                
                if (transcript === this.lastVoiceResult && event.results[i].isFinal) {
                    continue;
                }
                
                if (event.results[i].isFinal) {
                    finalTranscript = transcript;
                    this.lastVoiceResult = transcript;
                    isFinal = true;
                } else {
                    interimTranscript = transcript;
                }
            }

            const userInput = document.getElementById('userInput');
            const editorTextarea = document.getElementById('editorTextarea');
            
            if (finalTranscript && (userInput || editorTextarea)) {
                const target = userInput || editorTextarea;
                const currentValue = target.value.trim();
                const separator = currentValue ? (currentValue.endsWith('.') || currentValue.endsWith('!') || currentValue.endsWith('?') ? ' ' : ' ') : '';
                
                target.value = currentValue + separator + finalTranscript;
                
                // Trigger input event
                const inputEvent = new Event('input', { bubbles: true });
                target.dispatchEvent(inputEvent);
                
                // For mobile, stop after getting final result
                if (this.isMobileDevice() && isFinal) {
                    setTimeout(() => {
                        if (this.isListening) {
                            this.stopVoiceInput();
                        }
                    }, 500);
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.stopVoiceInput();
            
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
            
            this.showNotification(errorMessage, 'error');
        };

        this.recognition.onend = () => {
            this.stopVoiceInput();
        };

        return true;
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    toggleVoiceInput() {
        if (this.isListening) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    startVoiceInput() {
        if (!this.recognition) {
            if (!this.setupVoiceRecognition()) {
                this.showNotification('Voice input not available in this browser', 'error');
                return;
            }
        }

        try {
            this.recognition.lang = this.voiceLanguage;
            this.lastVoiceResult = '';
            this.recognition.start();
            this.showNotification('Listening... Speak now (click microphone to stop)', 'info');
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            this.showNotification('Could not start voice input', 'error');
        }
    }

    stopVoiceInput() {
        if (!this.recognition || !this.isListening) return;

        this.isListening = false;
        this.updateMicButton(false);
        this.showVoiceStatus(false);

        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Error stopping voice recognition:', error);
        }

        this.showNotification('Voice recording stopped', 'info');
    }

    updateMicButton(listening) {
        const micBtn = document.getElementById('micBtn');
        const editorMicBtn = document.getElementById('editorMicBtn');
        
        if (micBtn) {
            if (listening) {
                micBtn.classList.add('recording');
                micBtn.innerHTML = '<i class="fas fa-stop"></i>';
                micBtn.title = 'Stop recording';
            } else {
                micBtn.classList.remove('recording');
                micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                micBtn.title = 'Voice Input';
            }
        }
        
        if (editorMicBtn) {
            if (listening) {
                editorMicBtn.classList.add('recording');
                editorMicBtn.innerHTML = '<i class="fas fa-stop"></i>';
                editorMicBtn.title = 'Stop recording';
            } else {
                editorMicBtn.classList.remove('recording');
                editorMicBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                editorMicBtn.title = 'Voice Input';
            }
        }
    }

    showVoiceStatus(show) {
        // You can implement a status indicator if needed
    }

    toggleSpeechOutput() {
        if (this.isSpeaking) {
            this.stopSpeech();
            this.showNotification('Speech playback stopped', 'info');
        } else {
            this.speakText();
        }
    }

    speakText() {
        const outputArea = document.getElementById('outputArea');
        const text = outputArea?.textContent.trim();
        
        if (!text || text === 'Your optimized prompt will appear here...') {
            this.showNotification('No text to read', 'info');
            return;
        }

        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.voiceLanguage;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find a matching voice
        const voices = this.synthesis.getVoices();
        const matchingVoice = voices.find(voice => voice.lang.startsWith(this.voiceLanguage.split('-')[0]));
        if (matchingVoice) {
            utterance.voice = matchingVoice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateSpeakButton(true);
        };

        utterance.onend = () => {
            this.stopSpeech();
            this.showNotification('Finished reading prompt', 'info');
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.stopSpeech();
            this.showNotification('Error reading text aloud', 'error');
        };

        this.synthesis.speak(utterance);
        this.showNotification('Reading prompt aloud... (click speaker to stop)', 'info');
    }

    stopSpeech() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        this.isSpeaking = false;
        this.updateSpeakButton(false);
    }

    updateSpeakButton(speaking) {
        const speakBtn = document.getElementById('speakBtn');
        if (speakBtn) {
            if (speaking) {
                speakBtn.classList.add('speaking');
                speakBtn.innerHTML = '<i class="fas fa-stop"></i>';
                speakBtn.title = 'Stop reading';
            } else {
                speakBtn.classList.remove('speaking');
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                speakBtn.title = 'Read Aloud';
            }
        }
    }

    updateVoiceLanguage(language) {
        this.voiceLanguage = language;
        localStorage.setItem('voiceLanguage', language);
        
        if (this.recognition) {
            this.recognition.lang = language;
            
            if (this.isListening) {
                this.stopVoiceInput();
                setTimeout(() => this.startVoiceInput(), 100);
            }
        }
        
        this.showNotification(`Voice language updated to ${language}`, 'success');
    }

    showNotification(message, type = 'info') {
        // Use your existing notification system
        if (window.notificationService) {
            window.notificationService.show(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }

    // Cleanup
    cleanup() {
        this.stopVoiceInput();
        this.stopSpeech();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceManager;
}
