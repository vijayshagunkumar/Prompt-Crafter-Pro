// voice-manager.js - Voice Input and Output Features (updated from voice.js)
export class VoiceManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.voiceLanguage = 'en-US';
        this.lastVoiceResult = '';
        this.currentUtterance = null;
    }

    async initialize() {
        this.voiceLanguage = localStorage.getItem('voiceLanguage') || 'en-US';
        this.setupVoiceInput();
        this.setupVoiceOutput();
        
        // Load voices for speech synthesis
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.voices = window.speechSynthesis.getVoices();
            };
        }
    }

    setupVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported');
            this.disableVoiceInput();
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.voiceLanguage;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.lastVoiceResult = '';
            this.updateVoiceInputUI(true);
            console.log('Voice recognition started');
        };

        this.recognition.onresult = (event) => {
            this.handleRecognitionResult(event);
        };

        this.recognition.onerror = (event) => {
            this.handleRecognitionError(event);
        };

        this.recognition.onend = () => {
            this.stopVoiceInput();
        };

        this.bindVoiceInputButton();
    }

    bindVoiceInputButton() {
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        if (!voiceInputBtn) return;

        voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
    }

    handleRecognitionResult(event) {
        let finalTranscript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.trim();
            
            // Skip duplicates
            if (transcript === this.lastVoiceResult && event.results[i].isFinal) {
                continue;
            }
            
            if (event.results[i].isFinal) {
                finalTranscript = transcript;
                this.lastVoiceResult = transcript;
                isFinal = true;
            }
        }

        if (finalTranscript) {
            this.appendToInput(finalTranscript);
            
            // Auto-stop on mobile after final result
            if (this.isMobileDevice() && isFinal) {
                setTimeout(() => {
                    if (this.isListening) {
                        this.stopVoiceInput();
                    }
                }, 500);
            }
        }
    }

    appendToInput(text) {
        const inputElements = [
            document.getElementById('userInput'),
            document.getElementById('requirement'),
            document.querySelector('.textarea-idea')
        ].filter(el => el);

        inputElements.forEach(element => {
            const currentValue = element.value.trim();
            const separator = currentValue ? (currentValue.endsWith('.') || currentValue.endsWith('!') || currentValue.endsWith('?') ? ' ' : ' ') : '';
            element.value = currentValue + separator + text;
            
            // Trigger input event
            const inputEvent = new Event('input', { bubbles: true });
            element.dispatchEvent(inputEvent);
        });
    }

    handleRecognitionError(event) {
        console.error('Voice recognition error:', event.error);
        this.stopVoiceInput();
        
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
        
        if (window.app?.notificationService) {
            window.app.notificationService.show(errorMessage, 'error');
        }
    }

    setupVoiceOutput() {
        const voiceOutputBtn = document.getElementById('voiceOutputBtn');
        if (!voiceOutputBtn) return;

        voiceOutputBtn.addEventListener('click', () => this.toggleVoiceOutput());
        
        // Check for output content
        this.checkOutputContent();
    }

    checkOutputContent() {
        const outputElements = [
            document.getElementById('output'),
            document.getElementById('outputArea'),
            document.querySelector('.output-textarea')
        ].filter(el => el);

        const voiceOutputBtn = document.getElementById('voiceOutputBtn');
        if (!voiceOutputBtn) return;

        const hasContent = outputElements.some(el => el.value.trim() || el.textContent.trim());
        voiceOutputBtn.style.display = hasContent ? 'flex' : 'none';
        
        // Observe content changes
        outputElements.forEach(element => {
            element.addEventListener('input', () => this.checkOutputContent());
        });
    }

    toggleVoiceInput() {
        if (this.isListening) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }

    startVoiceInput() {
        if (!this.recognition) return;

        try {
            this.recognition.lang = this.voiceLanguage;
            this.lastVoiceResult = '';
            this.recognition.start();
            
            if (window.app?.notificationService) {
                window.app.notificationService.show('Listening... Speak now', 'info');
            }
        } catch (error) {
            console.error('Error starting voice recognition:', error);
        }
    }

    stopVoiceInput() {
        if (!this.recognition || !this.isListening) return;

        this.isListening = false;
        this.updateVoiceInputUI(false);

        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Error stopping voice recognition:', error);
        }

        if (window.app?.notificationService) {
            window.app.notificationService.show('Voice recording stopped', 'info');
        }
    }

    toggleVoiceOutput() {
        if (this.isSpeaking) {
            this.stopVoiceOutput();
        } else {
            this.startVoiceOutput();
        }
    }

    startVoiceOutput() {
        const outputElements = [
            document.getElementById('output'),
            document.getElementById('outputArea'),
            document.querySelector('.output-textarea')
        ].filter(el => el);

        const text = outputElements.map(el => el.value || el.textContent).join(' ').trim();
        
        if (!text) {
            if (window.app?.notificationService) {
                window.app.notificationService.show('No text to read', 'warning');
            }
            return;
        }

        // Cancel any ongoing speech
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.lang = this.voiceLanguage;
        
        // Try to find matching voice
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(voice => voice.lang.startsWith(this.voiceLanguage.split('-')[0]));
        if (matchingVoice) {
            this.currentUtterance.voice = matchingVoice;
        }

        this.currentUtterance.rate = 1.0;
        this.currentUtterance.pitch = 1.0;
        this.currentUtterance.volume = 1.0;

        this.currentUtterance.onstart = () => {
            this.isSpeaking = true;
            this.updateVoiceOutputUI(true);
        };

        this.currentUtterance.onend = () => {
            this.stopVoiceOutput();
        };

        this.currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.stopVoiceOutput();
        };

        window.speechSynthesis.speak(this.currentUtterance);
    }

    stopVoiceOutput() {
        this.isSpeaking = false;
        this.updateVoiceOutputUI(false);

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        this.currentUtterance = null;
    }

    updateVoiceInputUI(active) {
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        if (!voiceInputBtn) return;

        if (active) {
            voiceInputBtn.classList.add('recording');
            voiceInputBtn.innerHTML = '<i class="fas fa-stop"></i>';
            voiceInputBtn.title = 'Stop recording';
        } else {
            voiceInputBtn.classList.remove('recording');
            voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceInputBtn.title = 'Voice Input';
        }
    }

    updateVoiceOutputUI(active) {
        const voiceOutputBtn = document.getElementById('voiceOutputBtn');
        if (!voiceOutputBtn) return;

        if (active) {
            voiceOutputBtn.classList.add('speaking');
            voiceOutputBtn.innerHTML = '<i class="fas fa-stop"></i>';
            voiceOutputBtn.title = 'Stop reading';
        } else {
            voiceOutputBtn.classList.remove('speaking');
            voiceOutputBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            voiceOutputBtn.title = 'Read Aloud';
        }
    }

    updateVoiceLanguage(language) {
        this.voiceLanguage = language;
        localStorage.setItem('voiceLanguage', language);

        if (this.recognition) {
            this.recognition.lang = language;
            
            // Restart if currently listening
            if (this.isListening) {
                this.stopVoiceInput();
                setTimeout(() => this.startVoiceInput(), 100);
            }
        }
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    disableVoiceInput() {
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        if (voiceInputBtn) {
            voiceInputBtn.disabled = true;
            voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            voiceInputBtn.title = 'Voice input not supported';
        }
    }

    disableVoiceOutput() {
        const voiceOutputBtn = document.getElementById('voiceOutputBtn');
        if (voiceOutputBtn) {
            voiceOutputBtn.disabled = true;
            voiceOutputBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            voiceOutputBtn.title = 'Voice output not supported';
        }
    }
}
