// Voice Manager - Complete Fixed Version
class VoiceManager {
    constructor() {
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.speech = null;
        this.finalTranscript = '';
        this.init();
    }

    init() {
        this.setupSpeechRecognition();
        this.setupSpeechSynthesis();
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
            this.recognition = new SpeechRecognition();
        } else {
            console.warn('Speech recognition not supported');
            return;
        }

        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.finalTranscript = '';
            this.dispatchEvent('listeningStart');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    this.finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            this.dispatchEvent('result', {
                final: this.finalTranscript,
                interim: interimTranscript
            });
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.dispatchEvent('error', event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.dispatchEvent('listeningEnd', this.finalTranscript);
        };
    }

    setupSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.speech = window.speechSynthesis;
        } else {
            console.warn('Speech synthesis not supported');
        }
    }

    startListening() {
        if (!this.recognition) {
            this.showError('Voice input not supported in your browser');
            return false;
        }

        if (this.isListening) {
            this.stopListening();
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start listening:', error);
            this.showError('Please allow microphone access');
            return false;
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    speak(text) {
        if (!this.speech) {
            this.showError('Text-to-speech not supported');
            return false;
        }

        if (this.isSpeaking) {
            this.stopSpeaking();
            return false;
        }

        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => {
                this.isSpeaking = true;
                this.dispatchEvent('speakingStart');
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                this.dispatchEvent('speakingEnd');
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.isSpeaking = false;
                this.dispatchEvent('error', event.error);
            };

            this.speech.speak(utterance);
            return true;
        } catch (error) {
            console.error('Failed to speak:', error);
            return false;
        }
    }

    stopSpeaking() {
        if (this.speech && this.isSpeaking) {
            this.speech.cancel();
            this.isSpeaking = false;
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    toggleSpeaking(text) {
        if (this.isSpeaking) {
            this.stopSpeaking();
        } else if (text) {
            this.speak(text);
        }
    }

    dispatchEvent(type, data = null) {
        const event = new CustomEvent('voice', {
            detail: { type, data }
        });
        document.dispatchEvent(event);
    }

    showError(message) {
        const event = new CustomEvent('notification', {
            detail: { type: 'error', message }
        });
        document.dispatchEvent(event);
    }

    destroy() {
        this.stopListening();
        this.stopSpeaking();
    }
}

window.VoiceManager = VoiceManager;
