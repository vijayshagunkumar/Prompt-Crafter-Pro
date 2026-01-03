// voice-manager.js - Voice input and output management
(function() {
    'use strict';
    
    class VoiceManager {
        constructor() {
            this.speechRecognition = null;
            this.speechSynthesis = window.speechSynthesis;
            this.isListening = false;
            this.isSpeaking = false;
            this.supported = this.checkSupport();
            this.currentLanguage = 'en-US';
        }
        
        checkSupport() {
            return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
        }
        
        initialize() {
            if (this.supported) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.speechRecognition = new SpeechRecognition();
                this.speechRecognition.continuous = false;
                this.speechRecognition.interimResults = false;
                this.speechRecognition.maxAlternatives = 1;
                
                this.speechRecognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    this.onTranscript(transcript);
                };
                
                this.speechRecognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    this.isListening = false;
                };
                
                this.speechRecognition.onend = () => {
                    this.isListening = false;
                };
            }
            return Promise.resolve(this.supported);
        }
        
        startListening(language = 'en-US') {
            return new Promise((resolve, reject) => {
                if (!this.supported) {
                    reject(new Error('Speech recognition not supported'));
                    return;
                }
                
                if (this.isListening) {
                    this.stopListening();
                }
                
                this.speechRecognition.lang = language;
                this.currentLanguage = language;
                
                try {
                    this.speechRecognition.start();
                    this.isListening = true;
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        }
        
        stopListening() {
            if (this.speechRecognition && this.isListening) {
                this.speechRecognition.stop();
                this.isListening = false;
            }
        }
        
        onTranscript(transcript) {
            const event = new CustomEvent('voiceTranscript', {
                detail: { transcript }
            });
            document.dispatchEvent(event);
        }
        
        speak(text, language = 'en-US') {
            return new Promise((resolve, reject) => {
                if (!this.speechSynthesis) {
                    reject(new Error('Speech synthesis not supported'));
                    return;
                }
                
                if (this.isSpeaking) {
                    this.stopSpeaking();
                }
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = language;
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                
                utterance.onend = () => {
                    this.isSpeaking = false;
                    resolve();
                };
                
                utterance.onerror = (event) => {
                    this.isSpeaking = false;
                    reject(event.error);
                };
                
                this.speechSynthesis.speak(utterance);
                this.isSpeaking = true;
            });
        }
        
        stopSpeaking() {
            if (this.speechSynthesis && this.isSpeaking) {
                this.speechSynthesis.cancel();
                this.isSpeaking = false;
            }
        }
        
        getAvailableVoices() {
            if (!this.speechSynthesis) return [];
            return this.speechSynthesis.getVoices();
        }
        
        getAvailableLanguages() {
            const voices = this.getAvailableVoices();
            const languages = new Set();
            
            voices.forEach(voice => {
                languages.add(voice.lang);
            });
            
            return Array.from(languages);
        }
    }
    
    // Export to global scope
    window.VoiceManager = VoiceManager;
    
})();
