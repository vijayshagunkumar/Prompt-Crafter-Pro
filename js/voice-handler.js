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

    // ======================
    // SUPPORT CHECK
    // ======================
    checkSupport() {
        const speechRecognitionSupported =
            'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

        const speechSynthesisSupported = 'speechSynthesis' in window;

        return {
            speechRecognition: speechRecognitionSupported,
            speechSynthesis: speechSynthesisSupported,
            fullySupported: speechRecognitionSupported && speechSynthesisSupported
        };
    }

    // ======================
    // INIT
    // ======================
    init() {
        if (!this.supported.speechRecognition) return;

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = false;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = 'en-US';

        this.setupEventListeners();
    }

    // ======================
    // RECOGNITION EVENTS
    // ======================
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
            // Ignore abort / user stop errors
            if (event.error !== 'aborted') {
                this.onError?.(event.error);
            }
            this.forceStopListening();
        };

        this.speechRecognition.onend = () => {
            // DO NOT call stop() again here
            this.isListening = false;
            this.onListeningEnd?.();
        };
    }

    // ======================
    // LISTENING CONTROL
    // ======================
    startListening(language = 'en-US') {
        if (!this.supported.speechRecognition) {
            this.onError?.('Speech recognition not supported');
            return false;
        }

        // 🔒 HARD LOCK: prevent double start
        if (this.isListening) return false;

        try {
            this.speechRecognition.lang = language;
            this.speechRecognition.start();
            return true;
        } catch (error) {
            this.isListening = false;
            this.onError?.('Failed to start voice input');
            return false;
        }
    }

    stopListening() {
        if (!this.isListening) return;
        this.forceStopListening();
    }

    forceStopListening() {
        try {
            this.speechRecognition?.stop();
        } catch (_) {}
        this.isListening = false;
        this.onListeningEnd?.();
    }

    toggleListening(language = 'en-US') {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening(language);
        }
    }

    // ======================
    // SPEECH SYNTHESIS
    // ======================
    speak(text, options = {}) {
        if (!this.supported.speechSynthesis) {
            this.onError?.('Speech synthesis not supported');
            return false;
        }

        // Cancel any existing speech cleanly
        if (this.speechSynthesis.speaking) {
            this.userStoppedSpeech = true;
            this.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = options.lang || 'en-US';
        utterance.rate = options.rate ?? 1.0;
        utterance.pitch = options.pitch ?? 1.0;
        utterance.volume = options.volume ?? 1.0;

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.onSpeakingStart?.();
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            if (!this.userStoppedSpeech) {
                this.onSpeakingEnd?.();
            }
            this.userStoppedSpeech = false;
        };

        utterance.onerror = () => {
            // Suppress error if user stopped manually
            if (!this.userStoppedSpeech) {
                this.onError?.('Speech playback failed');
            }
            this.isSpeaking = false;
            this.userStoppedSpeech = false;
        };

        this.speechSynthesis.speak(utterance);
        return true;
    }

    toggleSpeaking(text, options = {}) {
        if (this.isSpeaking) {
            this.userStoppedSpeech = true;
            this.speechSynthesis.cancel();
            this.isSpeaking = false;
        } else {
            this.speak(text, options);
        }
    }

    // ======================
    // VOICES
    // ======================
    getVoices() {
        return new Promise((resolve) => {
            const voices = this.speechSynthesis.getVoices();
            if (voices.length) {
                resolve(voices);
            } else {
                this.speechSynthesis.onvoiceschanged = () => {
                    resolve(this.speechSynthesis.getVoices());
                };
            }
        });
    }

    async getAvailableLanguages() {
        const voices = await this.getVoices();
        return [...new Set(voices.map(v => v.lang))].sort();
    }

    // ======================
    // CALLBACKS
    // ======================
    setCallbacks(callbacks = {}) {
        this.onListeningStart = callbacks.onListeningStart;
        this.onListeningEnd = callbacks.onListeningEnd;
        this.onTranscript = callbacks.onTranscript;
        this.onSpeakingStart = callbacks.onSpeakingStart;
        this.onSpeakingEnd = callbacks.onSpeakingEnd;
        this.onError = callbacks.onError;
    }

    // ======================
    // CLEANUP
    // ======================
    destroy() {
        this.forceStopListening();
        this.speechSynthesis?.cancel();
        this.speechRecognition = null;
    }
}
