/**
 * Speech recognition and synthesis for PromptCraft Pro
 */

class SpeechManager {
    constructor() {
        this.isListening = false;
        this.isSpeaking = false;
        this.speechRecognition = null;
        this.speechSynthesis = window.speechSynthesis;
        this.userStoppedSpeech = false;
        this.currentUtterance = null;
        
        // Callbacks
        this.onTranscript = null;
        this.onSpeechStart = null;
        this.onSpeechEnd = null;
        this.onSpeechError = null;
        this.onListeningStart = null;
        this.onListeningEnd = null;
        
        this.initSpeechRecognition();
        this.initSpeechSynthesis();
    }

    /**
     * Initialize speech recognition
     */
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();
            
            // Configuration
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = true;
            this.speechRecognition.lang = 'en-US';
            this.speechRecognition.maxAlternatives = 1;
            
            // Event handlers
            this.speechRecognition.onstart = () => {
                this.isListening = true;
                if (this.onListeningStart) this.onListeningStart();
            };
            
            this.speechRecognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                if (this.onTranscript) {
                    this.onTranscript(finalTranscript, interimTranscript);
                }
            };
            
            this.speechRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                
                let errorMessage = 'Speech recognition error';
                switch (event.error) {
                    case 'no-speech':
                        errorMessage = 'No speech detected';
                        break;
                    case 'audio-capture':
                        errorMessage = 'No microphone found';
                        break;
                    case 'not-allowed':
                        errorMessage = 'Microphone access denied';
                        break;
                    case 'network':
                        errorMessage = 'Network error occurred';
                        break;
                    case 'service-not-allowed':
                        errorMessage = 'Speech service not allowed';
                        break;
                }
                
                if (this.onSpeechError) this.onSpeechError(errorMessage);
                this.stopListening();
            };
            
            this.speechRecognition.onend = () => {
                this.stopListening();
            };
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
    }

    /**
     * Initialize speech synthesis
     */
    initSpeechSynthesis() {
        if (!this.speechSynthesis) {
            console.warn('Speech synthesis not supported in this browser');
            return;
        }
        
        // Get available voices
        this.getAvailableVoices().then(voices => {
            this.availableVoices = voices;
            console.log(`Loaded ${voices.length} speech synthesis voices`);
        });
    }

    /**
     * Start listening for speech input
     */
    startListening(language = 'en-US') {
        if (!this.speechRecognition) {
            if (this.onSpeechError) {
                this.onSpeechError('Speech recognition not supported');
            }
            return false;
        }
        
        if (this.isListening) {
            this.stopListening();
            return false;
        }
        
        try {
            this.speechRecognition.lang = language;
            this.speechRecognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            if (this.onSpeechError) {
                this.onSpeechError('Failed to start microphone');
            }
            return false;
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.speechRecognition && this.isListening) {
            try {
                this.speechRecognition.stop();
            } catch (error) {
                // Ignore errors when stopping
            }
        }
        
        this.isListening = false;
        if (this.onListeningEnd) this.onListeningEnd();
    }

    /**
     * Speak text
     */
    speak(text, options = {}) {
        if (!this.speechSynthesis) {
            if (this.onSpeechError) {
                this.onSpeechError('Text-to-speech not supported');
            }
            return false;
        }
        
        // Stop any ongoing speech
        if (this.isSpeaking) {
            this.stopSpeaking();
        }
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure options
        utterance.lang = options.lang || 'en-US';
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        
        // Select voice
        if (options.voice) {
            utterance.voice = options.voice;
        } else if (this.availableVoices && this.availableVoices.length > 0) {
            // Try to find a suitable voice
            const preferredVoice = this.availableVoices.find(v => 
                v.lang.startsWith(options.lang || 'en')
            );
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
        }
        
        // Event handlers
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.userStoppedSpeech = false;
            this.currentUtterance = utterance;
            if (this.onSpeechStart) this.onSpeechStart(text);
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            if (!this.userStoppedSpeech && this.onSpeechEnd) {
                this.onSpeechEnd();
            }
        };
        
        utterance.onerror = (event) => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            if (!this.userStoppedSpeech && this.onSpeechError) {
                this.onSpeechError(event.error || 'Speech synthesis error');
            }
        };
        
        // Start speaking
        try {
            this.speechSynthesis.speak(utterance);
            return true;
        } catch (error) {
            console.error('Failed to speak text:', error);
            if (this.onSpeechError) {
                this.onSpeechError('Failed to speak text');
            }
            return false;
        }
    }

    /**
     * Stop speaking
     */
    stopSpeaking() {
        if (this.speechSynthesis && this.isSpeaking) {
            this.userStoppedSpeech = true;
            this.speechSynthesis.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
        }
    }

    /**
     * Pause speech
     */
    pauseSpeaking() {
        if (this.speechSynthesis && this.isSpeaking) {
            this.speechSynthesis.pause();
        }
    }

    /**
     * Resume speech
     */
    resumeSpeaking() {
        if (this.speechSynthesis && this.isSpeaking) {
            this.speechSynthesis.resume();
        }
    }

    /**
     * Get available voices
     */
    async getAvailableVoices() {
        return new Promise((resolve) => {
            const voices = this.speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
            } else {
                // Wait for voices to load
                this.speechSynthesis.onvoiceschanged = () => {
                    resolve(this.speechSynthesis.getVoices());
                };
            }
        });
    }

    /**
     * Set language for speech recognition
     */
    setRecognitionLanguage(language) {
        if (this.speechRecognition) {
            this.speechRecognition.lang = language;
        }
    }

    /**
     * Set language for speech synthesis
     */
    setSynthesisLanguage(language) {
        this.synthesisLanguage = language;
    }

    /**
     * Check if speech recognition is available
     */
    isRecognitionAvailable() {
        return !!this.speechRecognition;
    }

    /**
     * Check if speech synthesis is available
     */
    isSynthesisAvailable() {
        return !!this.speechSynthesis;
    }

    /**
     * Get current speech rate
     */
    getSpeechRate() {
        return this.speechRate || 1.0;
    }

    /**
     * Set speech rate
     */
    setSpeechRate(rate) {
        this.speechRate = Math.max(0.1, Math.min(10, rate));
    }

    /**
     * Get current speech pitch
     */
    getSpeechPitch() {
        return this.speechPitch || 1.0;
    }

    /**
     * Set speech pitch
     */
    setSpeechPitch(pitch) {
        this.speechPitch = Math.max(0, Math.min(2, pitch));
    }

    /**
     * Get current speech volume
     */
    getSpeechVolume() {
        return this.speechVolume || 1.0;
    }

    /**
     * Set speech volume
     */
    setSpeechVolume(volume) {
        this.speechVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Toggle listening state
     */
    toggleListening(language = 'en-US') {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening(language);
        }
    }

    /**
     * Toggle speaking state
     */
    toggleSpeaking(text, options = {}) {
        if (this.isSpeaking) {
            this.stopSpeaking();
        } else if (text) {
            this.speak(text, options);
        }
    }

    /**
     * Set transcript callback
     */
    onTranscript(callback) {
        this.onTranscript = callback;
    }

    /**
     * Set speech start callback
     */
    onSpeechStart(callback) {
        this.onSpeechStart = callback;
    }

    /**
     * Set speech end callback
     */
    onSpeechEnd(callback) {
        this.onSpeechEnd = callback;
    }

    /**
     * Set speech error callback
     */
    onSpeechError(callback) {
        this.onSpeechError = callback;
    }

    /**
     * Set listening start callback
     */
    onListeningStart(callback) {
        this.onListeningStart = callback;
    }

    /**
     * Set listening end callback
     */
    onListeningEnd(callback) {
        this.onListeningEnd = callback;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stopListening();
        this.stopSpeaking();
        
        // Remove callbacks
        this.onTranscript = null;
        this.onSpeechStart = null;
        this.onSpeechEnd = null;
        this.onSpeechError = null;
        this.onListeningStart = null;
        this.onListeningEnd = null;
    }
}

export default SpeechManager;
