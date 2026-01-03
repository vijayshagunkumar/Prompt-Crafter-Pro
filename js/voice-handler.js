// Voice Handler for Speech Recognition and Synthesis
class VoiceHandler {
    constructor() {
        this.isListening = false;
        this.isSpeaking = false;
        this.speechRecognition = null;
        this.speechSynthesis = window.speechSynthesis;
        this.userStoppedSpeech = false;
        this.supported = this.checkSupport();
        
        this.init();
    }

    // Check browser support
    checkSupport() {
        const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        const speechSynthesisSupported = 'speechSynthesis' in window;
        
        return {
            speechRecognition: speechRecognitionSupported,
            speechSynthesis: speechSynthesisSupported,
            fullySupported: speechRecognitionSupported && speechSynthesisSupported
        };
    }

    // Initialize speech recognition
    init() {
        if (this.supported.speechRecognition) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = true;
            this.speechRecognition.lang = 'en-US';
            
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        if (!this.speechRecognition) return;

        this.speechRecognition.onstart = () => {
            this.isListening = true;
            this.onListeningStart?.();
        };

        this.speechRecognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            this.onTranscript?.(transcript);
        };

        this.speechRecognition.onerror = (event) => {
            this.onError?.(event.error);
            this.stopListening();
        };

        this.speechRecognition.onend = () => {
            this.stopListening();
        };
    }

    // Start voice input
    startListening(language = 'en-US') {
        if (!this.supported.speechRecognition) {
            this.onError?.('Speech recognition not supported');
            return false;
        }

        try {
            this.speechRecognition.lang = language;
            this.speechRecognition.start();
            return true;
        } catch (error) {
            this.onError?.('Failed to start voice input');
            return false;
        }
    }

    // Stop voice input
    stopListening() {
        if (this.speechRecognition && this.isListening) {
            try {
                this.speechRecognition.stop();
            } catch (e) {
                // Ignore errors when stopping
            }
        }
        this.isListening = false;
        this.onListeningEnd?.();
    }

    // Toggle listening state
    toggleListening(language = 'en-US') {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening(language);
        }
    }

    // Speak text
    speak(text, options = {}) {
        if (!this.supported.speechSynthesis) {
            this.onError?.('Speech synthesis not supported');
            return false;
        }

        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply options
        utterance.lang = options.lang || 'en-US';
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.onSpeakingStart?.();
        };
        
        utterance.onend = () => {
            if (!this.userStoppedSpeech) {
                this.onSpeakingEnd?.();
            }
            this.stopSpeaking();
        };
        
        utterance.onerror = (event) => {
            if (!this.userStoppedSpeech) {
                this.onError?.(event.error);
            }
            this.stopSpeaking();
        };

        this.speechSynthesis.speak(utterance);
        return true;
    }

    // Stop speaking
    stopSpeaking() {
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        this.userStoppedSpeech = false;
    }

    // Toggle speaking
    toggleSpeaking(text, options = {}) {
        if (this.isSpeaking) {
            this.userStoppedSpeech = true;
            this.stopSpeaking();
        } else {
            this.speak(text, options);
        }
    }

    // Get available voices
    getVoices() {
        return new Promise((resolve) => {
            const voices = this.speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
            } else {
                this.speechSynthesis.onvoiceschanged = () => {
                    resolve(this.speechSynthesis.getVoices());
                };
            }
        });
    }

    // Get languages with available voices
    async getAvailableLanguages() {
        const voices = await this.getVoices();
        const languages = new Set();
        
        voices.forEach(voice => {
            languages.add(voice.lang);
        });
        
        return Array.from(languages).sort();
    }

    // Set callbacks
    setCallbacks(callbacks) {
        this.onListeningStart = callbacks.onListeningStart;
        this.onListeningEnd = callbacks.onListeningEnd;
        this.onTranscript = callbacks.onTranscript;
        this.onSpeakingStart = callbacks.onSpeakingStart;
        this.onSpeakingEnd = callbacks.onSpeakingEnd;
        this.onError = callbacks.onError;
    }

    // Cleanup
    destroy() {
        this.stopListening();
        this.stopSpeaking();
        this.speechRecognition = null;
    }
}
