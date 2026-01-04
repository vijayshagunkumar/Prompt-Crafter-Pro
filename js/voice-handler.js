/**
 * Voice Handler for Speech Recognition and Synthesis
 * Production-ready with intelligent progressive result handling
 * @class VoiceHandler
 */
class VoiceHandler {
    /**
     * Create a VoiceHandler instance
     * @param {Object} config - Configuration options
     * @param {boolean} config.continuous - Continuous listening mode
     * @param {boolean} config.interimResults - Show interim results
     * @param {string} config.defaultLang - Default language
     * @param {boolean} config.autoRestart - Auto-restart after silence
     * @param {number} config.maxListenTime - Maximum listening time in ms
     * @param {number} config.debounceDelay - Debounce delay for transcripts in ms
     * @param {boolean} config.mergeProgressiveResults - Merge progressive results
     * @param {boolean} config.removeArticles - Remove articles for deduplication
     */
    constructor(config = {}) {
        // Default configuration - optimized for production
        this.config = {
            continuous: false, // ALWAYS FALSE for one-shot recognition
            interimResults: true,
            defaultLang: 'en-US',
            autoRestart: false,
            maxListenTime: 30000, // 30 seconds
            debounceDelay: 300, // 300ms debounce (400ms for mobile)
            mergeProgressiveResults: true, // Merge partial results
            removeArticles: false, // Preserve semantics by default
            ...config
        };

        // State management
        this.isListening = false;
        this.isSpeaking = false;
        this.userStoppedSpeech = false;
        
        // Transcript handling
        this.lastTranscript = '';
        this.lastFinalTranscript = '';
        this.transcriptTimeout = null;
        this.silenceTimeout = null;
        
        // Progressive result tracking
        this.progressiveResults = [];
        this.isProgressiveResult = false;
        
        // Speech API instances
        this.speechRecognition = null;
        this.speechSynthesis = window.speechSynthesis;
        
        // Timeouts and intervals
        this.listenTimeout = null;
        
        // Support detection
        this.supported = this.checkSupport();
        
        // Callbacks
        this.onListeningStart = null;
        this.onListeningEnd = null;
        this.onTranscript = null;
        this.onSpeakingStart = null;
        this.onSpeakingEnd = null;
        this.onError = null;
        
        // Initialize if supported
        if (this.supported.speechRecognition) {
            this.init();
        }
    }

    // ======================
    // SUPPORT CHECK
    // ======================
    /**
     * Check browser support for speech APIs
     * @returns {Object} Support status
     */
    checkSupport() {
        const speechRecognitionSupported = 
            'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        const speechSynthesisSupported = 'speechSynthesis' in window;

        return {
            speechRecognition: speechRecognitionSupported,
            speechSynthesis: speechSynthesisSupported,
            fullySupported: speechRecognitionSupported && speechSynthesisSupported,
            soundEvents: 'onsoundstart' in (window.webkitSpeechRecognition || window.SpeechRecognition || {})
        };
    }

    // ======================
    // INITIALIZATION
    // ======================
    /**
     * Initialize speech recognition
     */
    init() {
        if (!this.supported.speechRecognition) return;

        const SpeechRecognition = 
            window.SpeechRecognition || window.webkitSpeechRecognition;

        this.speechRecognition = new SpeechRecognition();
        
        // Critical: Always use continuous = false for one-shot recognition
        this.speechRecognition.continuous = false;
        
        this.speechRecognition.interimResults = this.config.interimResults;
        this.speechRecognition.lang = this.config.defaultLang;
        
        // Set up event listeners
        this.setupEventListeners();
    }

    // ======================
    // EVENT LISTENERS
    // ======================
    /**
     * Set up speech recognition event listeners
     */
    setupEventListeners() {
        if (!this.speechRecognition) return;

        this.speechRecognition.onstart = () => {
            console.log('🔊 Speech recognition started');
            this.isListening = true;
            this.resetTranscriptState();
            
            // Set maximum listening time
            if (this.config.maxListenTime > 0) {
                this.listenTimeout = setTimeout(() => {
                    if (this.isListening) {
                        console.log('⏱️ Max listening time reached');
                        this.stopListening();
                    }
                }, this.config.maxListenTime);
            }
            
            this.onListeningStart?.();
        };

        this.speechRecognition.onresult = (event) => {
            this.resetSilenceDetection();
            
            let hasFinal = false;
            let finalTranscript = '';
            let interimTranscript = '';
            
            // Process all results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;
                
                if (result.isFinal) {
                    hasFinal = true;
                    finalTranscript += (finalTranscript && !finalTranscript.endsWith(' ') ? ' ' : '') + transcript;
                } else {
                    interimTranscript += (interimTranscript && !interimTranscript.endsWith(' ') ? ' ' : '') + transcript;
                }
            }
            
            // Handle final results
            if (hasFinal && finalTranscript.trim()) {
                this.handleFinalResult(finalTranscript.trim());
            } 
            // Handle interim results
            else if (interimTranscript.trim() && this.config.interimResults) {
                this.handleInterimResult(interimTranscript.trim());
            }
        };

        this.speechRecognition.onerror = (event) => {
            // Ignore abort errors (user stopped)
            if (event.error === 'aborted' || event.error === 'not-allowed') {
                console.log('🛑 Speech recognition stopped by user');
                return;
            }
            
            console.error('❌ Speech recognition error:', event.error);
            
            this.clearTimeouts();
            this.forceStopListening();
            this.onError?.(`Speech recognition error: ${event.error}`);
        };

        this.speechRecognition.onend = () => {
            console.log('🔇 Speech recognition ended');
            
            this.clearTimeouts();
            this.isListening = false;
            this.resetTranscriptState();
            
            // Auto-restart if configured
            if (this.config.autoRestart && !this.userStoppedSpeech) {
                console.log('🔄 Auto-restarting speech recognition');
                setTimeout(() => {
                    if (!this.isListening) {
                        this.startListening(this.speechRecognition.lang);
                    }
                }, 500);
            } else {
                this.onListeningEnd?.();
            }
        };

        // Optional sound events (Chrome-specific)
        if (this.supported.soundEvents) {
            this.speechRecognition.onsoundstart = () => {
                console.log('🔈 Sound detected');
                this.resetSilenceDetection();
            };

            this.speechRecognition.onsoundend = () => {
                console.log('🔇 Sound ended');
                this.startSilenceDetection();
            };
        }
    }

    // ======================
    // TRANSCRIPT STATE MANAGEMENT
    // ======================
    /**
     * Reset transcript tracking state
     */
    resetTranscriptState() {
        this.lastTranscript = '';
        this.lastFinalTranscript = '';
        this.progressiveResults = [];
        this.isProgressiveResult = false;
    }

    // ======================
    // INTELLIGENT TRANSCRIPT HANDLING
    // ======================
    /**
     * Handle final recognition result
     * @param {string} finalTranscript - Final transcript text
     */
    handleFinalResult(finalTranscript) {
        console.log('✅ Final result:', finalTranscript);
        
        if (this.config.mergeProgressiveResults && this.isProgressiveResult) {
            const mergedTranscript = this.mergeProgressiveResults(finalTranscript);
            this.isProgressiveResult = false;
            this.sendTranscript(mergedTranscript, true);
        } else {
            this.sendTranscript(finalTranscript, true);
        }
        
        this.lastFinalTranscript = finalTranscript;
        this.progressiveResults = [];
    }

    /**
     * Handle interim recognition result
     * @param {string} interimTranscript - Interim transcript text
     */
    handleInterimResult(interimTranscript) {
        console.log('⏳ Interim result:', interimTranscript);
        
        this.progressiveResults.push(interimTranscript);
        this.isProgressiveResult = true;
        
        if (this.isMeaningfulInterimUpdate(interimTranscript)) {
            this.debounceTranscript(interimTranscript, false);
        }
    }

    /**
     * Merge progressive results into a single transcript
     * @param {string} finalTranscript - The final transcript
     * @returns {string} Merged transcript
     */
    mergeProgressiveResults(finalTranscript) {
        if (this.progressiveResults.length === 0) {
            return finalTranscript;
        }
        
        const allResults = [...this.progressiveResults, finalTranscript];
        let merged = finalTranscript;
        
        for (const result of this.progressiveResults) {
            const normalizedResult = this.normalizeForComparison(result);
            const normalizedMerged = this.normalizeForComparison(merged);
            
            if (normalizedResult.length > normalizedMerged.length * 0.8 && 
                !merged.toLowerCase().includes(result.toLowerCase())) {
                merged = this.mergeTranscripts(merged, result);
            }
        }
        
        console.log('🔗 Merged progressive results:', merged);
        return merged;
    }

    /**
     * Merge two transcripts intelligently
     * @param {string} base - Base transcript
     * @param {string} addition - Additional transcript
     * @returns {string} Merged transcript
     */
    mergeTranscripts(base, addition) {
        const baseWords = base.toLowerCase().split(/\s+/);
        const additionWords = addition.toLowerCase().split(/\s+/);
        
        // Find natural overlap points
        for (let i = Math.min(baseWords.length, 5); i >= 0; i--) {
            const baseEnd = baseWords.slice(-i).join(' ');
            const additionStart = additionWords.slice(0, i).join(' ');
            
            if (baseEnd && additionStart && baseEnd === additionStart) {
                return base + additionWords.slice(i).join(' ');
            }
        }
        
        return base + ' ' + addition;
    }

    /**
     * Send transcript to callback
     * @param {string} transcript - Transcript text
     * @param {boolean} isFinal - Whether it's final
     */
    sendTranscript(transcript, isFinal = false) {
        const normalized = this.normalizeForComparison(transcript);
        
        if (normalized !== this.lastTranscript) {
            this.lastTranscript = normalized;
            
            if (this.transcriptTimeout) {
                clearTimeout(this.transcriptTimeout);
                this.transcriptTimeout = null;
            }
            
            this.onTranscript?.(transcript, { 
                isFinal,
                final: isFinal ? transcript : null,
                interim: !isFinal ? transcript : null,
                normalized: normalized,
                timestamp: Date.now()
            });
        } else {
            console.log('⏭️ Skipping duplicate transcript');
        }
    }

    /**
     * Normalize transcript for comparison
     * @param {string} transcript - Transcript text
     * @returns {string} Normalized transcript
     */
    normalizeForComparison(transcript) {
        let normalized = transcript
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s.,!?']/g, '')
            .trim();
        
        if (this.config.removeArticles) {
            normalized = normalized.replace(/\b(a|an|the|and|or|but)\b/g, '');
        }
        
        return normalized.replace(/\s+/g, ' ').trim();
    }

    /**
     * Check if interim update is meaningful
     * @param {string} newText - New transcript
     * @returns {boolean} Whether update is meaningful
     */
    isMeaningfulInterimUpdate(newText) {
        const normalizedNew = this.normalizeForComparison(newText);
        const normalizedLast = this.normalizeForComparison(this.lastTranscript);
        
        if (!normalizedLast) return true;
        if (normalizedNew === normalizedLast) return false;
        
        // Check for minor extensions
        if (normalizedNew.startsWith(normalizedLast)) {
            const addedChars = normalizedNew.length - normalizedLast.length;
            if (addedChars < 10) return false;
        }
        
        const oldWords = normalizedLast.split(/\s+/).length;
        const newWords = normalizedNew.split(/\s+/).length;
        
        if (newWords <= oldWords + 2 && normalizedNew.includes(normalizedLast)) {
            return false;
        }
        
        return true;
    }

    /**
     * Debounce interim transcript results
     * @param {string} transcript - Transcript text
     * @param {boolean} isFinal - Whether it's a final result
     */
    debounceTranscript(transcript, isFinal) {
        if (this.transcriptTimeout) {
            clearTimeout(this.transcriptTimeout);
        }
        
        this.transcriptTimeout = setTimeout(() => {
            const normalized = this.normalizeForComparison(transcript);
            if (normalized !== this.lastTranscript || isFinal) {
                this.lastTranscript = normalized;
                this.onTranscript?.(transcript, { isFinal });
            }
            this.transcriptTimeout = null;
        }, this.config.debounceDelay);
    }

    // ======================
    // UTILITY METHODS
    // ======================
    /**
     * Clear all pending timeouts
     */
    clearTimeouts() {
        if (this.transcriptTimeout) {
            clearTimeout(this.transcriptTimeout);
            this.transcriptTimeout = null;
        }
        
        if (this.listenTimeout) {
            clearTimeout(this.listenTimeout);
            this.listenTimeout = null;
        }
        
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
            this.silenceTimeout = null;
        }
    }

    /**
     * Start silence detection timer
     */
    startSilenceDetection() {
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
        }
        
        this.silenceTimeout = setTimeout(() => {
            if (this.isListening && !this.config.continuous) {
                console.log('🤫 Silence detected, stopping recognition');
                this.speechRecognition.stop();
            }
        }, 2000);
    }

    /**
     * Reset silence detection timer
     */
    resetSilenceDetection() {
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
            this.silenceTimeout = null;
        }
    }

    // ======================
    // LISTENING CONTROL
    // ======================
    /**
     * Start listening for speech input
     * @param {string} language - Language code (e.g., 'en-US')
     * @returns {boolean} Success status
     */
    startListening(language = this.config.defaultLang) {
        if (!this.supported.speechRecognition) {
            this.onError?.('Speech recognition not supported');
            return false;
        }

        if (this.isListening) {
            console.log('⚠️ Already listening');
            return false;
        }

        if (!this.validateLanguage(language)) {
            this.onError?.('Invalid language code');
            return false;
        }

        try {
            this.userStoppedSpeech = false;
            this.resetTranscriptState();
            
            this.speechRecognition.lang = language;
            this.speechRecognition.start();
            
            console.log(`🎤 Started listening (${language})`);
            return true;
        } catch (error) {
            console.error('❌ Failed to start listening:', error);
            this.isListening = false;
            this.onError?.('Failed to start voice input');
            return false;
        }
    }

    /**
     * Stop listening for speech input
     */
    stopListening() {
        if (!this.isListening) return;
        
        console.log('🛑 Stopping listening');
        this.userStoppedSpeech = true;
        this.forceStopListening();
    }

    /**
     * Force stop listening (internal use)
     */
    forceStopListening() {
        try {
            if (this.speechRecognition) {
                this.speechRecognition.abort();
            }
        } catch (error) {
            // Ignore abort errors
        } finally {
            this.clearTimeouts();
            this.isListening = false;
            this.resetTranscriptState();
            this.onListeningEnd?.();
        }
    }

    /**
     * Toggle listening state
     * @param {string} language - Language code
     */
    toggleListening(language = this.config.defaultLang) {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening(language);
        }
    }

    /**
     * Validate language code format
     * @param {string} lang - Language code
     * @returns {boolean} Validation result
     */
    validateLanguage(lang) {
        const langRegex = /^[a-z]{2,3}(-[A-Z]{2,3})?$/;
        return langRegex.test(lang);
    }

    // ======================
    // SPEECH SYNTHESIS
    // ======================
    /**
     * Speak text using speech synthesis
     * @param {string} text - Text to speak
     * @param {Object} options - Synthesis options
     * @returns {boolean} Success status
     */
    speak(text, options = {}) {
        if (!this.supported.speechSynthesis) {
            this.onError?.('Speech synthesis not supported');
            return false;
        }

        if (!text || typeof text !== 'string') {
            this.onError?.('Invalid text');
            return false;
        }

        if (this.speechSynthesis.speaking) {
            this.userStoppedSpeech = true;
            this.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.lang = options.lang || this.config.defaultLang;
        utterance.rate = Math.min(Math.max(options.rate || 1.0, 0.1), 10);
        utterance.pitch = Math.min(Math.max(options.pitch || 1.0, 0), 2);
        utterance.volume = Math.min(Math.max(options.volume || 1.0, 0), 1);
        
        if (options.voice) {
            const voices = this.speechSynthesis.getVoices();
            const voice = voices.find(v => v.voiceURI === options.voice);
            if (voice) utterance.voice = voice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.userStoppedSpeech = false;
            this.onSpeakingStart?.();
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            if (!this.userStoppedSpeech) {
                this.onSpeakingEnd?.();
            }
            this.userStoppedSpeech = false;
        };

        utterance.onerror = (event) => {
            this.isSpeaking = false;
            if (!this.userStoppedSpeech) {
                this.onError?.(`Speech synthesis error: ${event.error}`);
            }
            this.userStoppedSpeech = false;
        };

        try {
            this.speechSynthesis.speak(utterance);
            return true;
        } catch (error) {
            this.onError?.('Failed to speak text');
            return false;
        }
    }

    /**
     * Toggle speech synthesis
     * @param {string} text - Text to speak
     * @param {Object} options - Synthesis options
     */
    toggleSpeaking(text, options = {}) {
        if (this.isSpeaking) {
            this.userStoppedSpeech = true;
            this.speechSynthesis.cancel();
            this.isSpeaking = false;
        } else {
            this.speak(text, options);
        }
    }

    /**
     * Stop speech synthesis
     */
    stopSpeaking() {
        if (this.isSpeaking) {
            this.userStoppedSpeech = true;
            this.speechSynthesis.cancel();
            this.isSpeaking = false;
        }
    }

    // ======================
    // VOICE MANAGEMENT
    // ======================
    /**
     * Get available voices
     * @returns {Promise<Array>} Array of voices
     */
    getVoices() {
        return new Promise((resolve) => {
            const voices = this.speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
            } else {
                const onVoicesChanged = () => {
                    this.speechSynthesis.onvoiceschanged = null;
                    resolve(this.speechSynthesis.getVoices());
                };
                this.speechSynthesis.onvoiceschanged = onVoicesChanged;
                
                setTimeout(() => {
                    if (this.speechSynthesis.onvoiceschanged === onVoicesChanged) {
                        this.speechSynthesis.onvoiceschanged = null;
                        resolve(this.speechSynthesis.getVoices());
                    }
                }, 1000);
            }
        });
    }

    /**
     * Get available languages
     * @returns {Promise<Array>} Array of language codes
     */
    async getAvailableLanguages() {
        const voices = await this.getVoices();
        return [...new Set(voices.map(v => v.lang))].sort();
    }

    // ======================
    // CALLBACK MANAGEMENT
    // ======================
    /**
     * Set callback functions
     * @param {Object} callbacks - Callback functions
     */
    setCallbacks(callbacks = {}) {
        this.onListeningStart = callbacks.onListeningStart;
        this.onListeningEnd = callbacks.onListeningEnd;
        this.onTranscript = callbacks.onTranscript;
        this.onSpeakingStart = callbacks.onSpeakingStart;
        this.onSpeakingEnd = callbacks.onSpeakingEnd;
        this.onError = callbacks.onError;
    }

    // ======================
    // STATE MANAGEMENT
    // ======================
    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            isListening: this.isListening,
            isSpeaking: this.isSpeaking,
            supported: this.supported,
            currentLang: this.speechRecognition?.lang || this.config.defaultLang,
            config: { ...this.config },
            progressiveResults: this.progressiveResults.length
        };
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.forceStopListening();
        this.stopSpeaking();
        this.clearTimeouts();
        this.resetTranscriptState();
        this.userStoppedSpeech = false;
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        if (this.speechRecognition) {
            this.speechRecognition.continuous = this.config.continuous;
            this.speechRecognition.interimResults = this.config.interimResults;
        }
    }

    // ======================
    // CLEANUP
    // ======================
    /**
     * Clean up resources
     */
    destroy() {
        console.log('🧹 Destroying VoiceHandler');
        
        this.forceStopListening();
        this.stopSpeaking();
        this.clearTimeouts();
        
        if (this.speechRecognition) {
            this.speechRecognition.onstart = null;
            this.speechRecognition.onresult = null;
            this.speechRecognition.onerror = null;
            this.speechRecognition.onend = null;
            if (this.supported.soundEvents) {
                this.speechRecognition.onsoundstart = null;
                this.speechRecognition.onsoundend = null;
            }
        }
        
        this.setCallbacks({});
        this.speechRecognition = null;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceHandler;
}

// Export for ES6 modules
if (typeof window !== 'undefined') {
    window.VoiceHandler = VoiceHandler;
}
