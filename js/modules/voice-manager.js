// Complete Voice Manager
class VoiceManager {
    constructor() {
        this.storage = new StorageService();
        this.settings = this.loadSettings();
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.speech = null;
        this.finalTranscript = '';
        this.audioContext = null;
        
        this.init();
    }

    init() {
        this.setupSpeechRecognition();
        this.setupSpeechSynthesis();
    }

    loadSettings() {
        return this.storage.getVoiceSettings();
    }

    saveSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        return this.storage.saveVoiceSettings(this.settings);
    }

    setupSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.settings.inputLanguage;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.finalTranscript = '';
            this.emitVoiceEvent('listeningStart');
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
            
            this.emitVoiceEvent('result', {
                final: this.finalTranscript,
                interim: interimTranscript
            });
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.emitVoiceEvent('error', event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.emitVoiceEvent('listeningEnd', this.finalTranscript);
        };
    }

    setupSpeechSynthesis() {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return;
        }

        this.speech = window.speechSynthesis;
        this.updateVoice();
    }

    updateVoice() {
        if (!this.speech) return;
        
        const voices = this.speech.getVoices();
        const targetLang = this.settings.outputLanguage;
        
        const matchingVoice = voices.find(voice => 
            voice.lang === targetLang ||
            voice.lang.startsWith(targetLang.split('-')[0])
        );
        
        this.selectedVoice = matchingVoice || voices[0];
    }

    startListening() {
        if (!this.recognition) {
            window.notification?.error('Voice input not supported in your browser');
            return false;
        }

        if (this.isListening) {
            this.stopListening();
            return false;
        }

        try {
            this.recognition.lang = this.settings.inputLanguage;
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start listening:', error);
            window.notification?.error('Failed to start voice input');
            return false;
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    speak(text, options = {}) {
        if (!this.speech || !this.selectedVoice) {
            window.notification?.error('Text-to-speech not supported');
            return false;
        }

        if (this.isSpeaking) {
            this.stopSpeaking();
            return false;
        }

        try {
            const utterance = new SpeechSynthesisUtterance(text);
            
            utterance.voice = this.selectedVoice;
            utterance.lang = this.settings.outputLanguage;
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;

            utterance.onstart = () => {
                this.isSpeaking = true;
                this.emitVoiceEvent('speakingStart');
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                this.emitVoiceEvent('speakingEnd');
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event.error);
                this.isSpeaking = false;
                this.emitVoiceEvent('error', event.error);
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

    setInputLanguage(language) {
        this.settings.inputLanguage = language;
        this.saveSettings(this.settings);
        
        if (this.recognition) {
            this.recognition.lang = language;
        }
    }

    setOutputLanguage(language) {
        this.settings.outputLanguage = language;
        this.saveSettings(this.settings);
        this.updateVoice();
    }

    getAvailableInputLanguages() {
        // Common languages supported by most browsers
        return [
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' },
            { code: 'hi-IN', name: 'Hindi (India)' },
            { code: 'te-IN', name: 'Telugu (India)' },
            { code: 'kn-IN', name: 'Kannada (India)' },
            { code: 'ru-RU', name: 'Russian' },
            { code: 'es-ES', name: 'Spanish' },
            { code: 'fr-FR', name: 'French' },
            { code: 'de-DE', name: 'German' },
            { code: 'ja-JP', name: 'Japanese' },
            { code: 'ko-KR', name: 'Korean' },
            { code: 'zh-CN', name: 'Chinese' }
        ];
    }

    getAvailableOutputLanguages() {
        return this.getAvailableInputLanguages();
    }

    renderLanguageSelectors(inputSelect, outputSelect) {
        if (inputSelect) {
            inputSelect.innerHTML = '';
            this.getAvailableInputLanguages().forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.code;
                option.textContent = lang.name;
                if (lang.code === this.settings.inputLanguage) {
                    option.selected = true;
                }
                inputSelect.appendChild(option);
            });
            
            inputSelect.addEventListener('change', (e) => {
                this.setInputLanguage(e.target.value);
            });
        }

        if (outputSelect) {
            outputSelect.innerHTML = '';
            this.getAvailableOutputLanguages().forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.code;
                option.textContent = lang.name;
                if (lang.code === this.settings.outputLanguage) {
                    option.selected = true;
                }
                outputSelect.appendChild(option);
            });
            
            outputSelect.addEventListener('change', (e) => {
                this.setOutputLanguage(e.target.value);
            });
        }
    }

    emitVoiceEvent(type, data = null) {
        const event = new CustomEvent('voice', {
            detail: { type, data }
        });
        document.dispatchEvent(event);
    }

    // Audio visualization (optional)
    startAudioVisualization(canvas) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Implementation would depend on specific visualization needs
        return false;
    }

    stopAudioVisualization() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    // Cleanup
    destroy() {
        this.stopListening();
        this.stopSpeaking();
        this.stopAudioVisualization();
    }
}

window.VoiceManager = VoiceManager;
