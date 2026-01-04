/**
 * Voice Handler for Speech Recognition and Synthesis
 * Handles voice input and output with robust error handling and debouncing
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
     */
    constructor(config = {}) {
        // Default configuration
        this.config = {
            continuous: false, // ALWAYS FALSE for one-shot recognition
            interimResults: true,
            defaultLang: 'en-US',
            autoRestart: false,
            maxListenTime: 30000, // 30 seconds
            debounceDelay: 300, // 300ms debounce
            mergeProgressiveResults: true, // NEW: Merge partial results
            ...config
        };

        // State management
        this.isListening = false;
        this.isSpeaking = false;
        this.userStoppedSpeech = false;
        this.isProcessing = false;
        
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
        this.silenceTimer = null;
        
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
            fullySupported: speechRecognitionSupported && speechSynthesisSupported
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
        
        // 🔥 CRITICAL FIX: ALWAYS use continuous = false for one-shot recognition
        // This prevents Chrome from firing multiple onresult events
        this.speechRecognition.continuous = false; // ALWAYS FALSE
        
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
            console.log('Speech recognition started');
            this.isListening = true;
            this.isProcessing = false;
            this.lastTranscript = '';
            this.lastFinalTranscript = '';
            this.progressiveResults = [];
            this.isProgressiveResult = false;
            
            // Set maximum listening time
            if (this.config.maxListenTime > 0) {
                this.listenTimeout = setTimeout(() => {
                    if (this.isListening) {
                        console.log('Max listening time reached');
                        this.stopListening();
                    }
                }, this.config.maxListenTime);
            }
            
            this.onListeningStart?.();
        };

        this.speechRecognition.onresult = (event) => {
            // Reset silence detection
            this.resetSilenceDetection();
            
            let hasFinal = false;
            let finalTranscript = '';
            let interimTranscript = '';
            
            // Process all results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript.trim();
                
                if (result.isFinal) {
                    hasFinal = true;
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript + ' ';
                }
            }
            
            // Clean up transcripts
            finalTranscript = finalTranscript.trim();
            interimTranscript = interimTranscript.trim();
            
            // Handle final results
            if (hasFinal && finalTranscript) {
                this.handleFinalResult(finalTranscript);
            } 
            // Handle interim results
            else if (interimTranscript && this.config.interimResults) {
                this.handleInterimResult(interimTranscript);
            }
        };

        this.speechRecognition.onerror = (event) => {
            // Ignore abort errors (user stopped)
            if (event.error === 'aborted' || event.error === 'not-allowed') {
                console.log('Speech recognition stopped by user');
                return;
            }
            
            console.error('Speech recognition error:', event.error);
            
            // Clear all timeouts
            this.clearTimeouts();
            
            // Force stop and notify
            this.forceStopListening();
            this.onError?.(`Speech recognition error: ${event.error}`);
        };

        this.speechRecognition.onend = () => {
            console.log('Speech recognition ended');
            
            // Clear timeouts
            this.clearTimeouts();
            
            // Update state
            this.isListening = false;
            this.progressiveResults = [];
            this.isProgressiveResult = false;
            
            // Auto-restart if configured
            if (this.config.autoRestart && !this.userStoppedSpeech) {
                console.log('Auto-restarting speech recognition');
                setTimeout(() => {
                    if (!this.isListening) {
                        this.startListening(this.speechRecognition.lang);
                    }
                }, 500);
            } else {
                this.onListeningEnd?.();
            }
        };

        // Silence detection
        this.speechRecognition.onsoundstart = () => {
            console.log('Sound detected');
            this.resetSilenceDetection();
        };

        this.speechRecognition.onsoundend = () => {
            console.log('Sound ended, starting silence detection');
            this.startSilenceDetection();
        };
    }

    // ======================
    // INTELLIGENT TRANSCRIPT HANDLING
    // ======================
    /**
     * Handle final recognition result
     * @param {string} finalTranscript - Final transcript text
     */
    handleFinalResult(finalTranscript) {
        console.log('Final result received:', finalTranscript);
        
        // Check if this is a progressive result (building on previous)
        if (this.config.mergeProgressiveResults && this.isProgressiveResult) {
            // Merge with previous progressive results
            const mergedTranscript = this.mergeProgressiveResults(finalTranscript);
            this.isProgressiveResult = false;
            
            // Send merged result
            this.sendTranscript(mergedTranscript, true);
        } else {
            // Send as-is
            this.sendTranscript(finalTranscript, true);
        }
        
        // Store for future reference
        this.lastFinalTranscript = finalTranscript;
        this.progressiveResults = [];
    }

    /**
     * Handle interim recognition result
     * @param {string} interimTranscript - Interim transcript text
     */
    handleInterimResult(interimTranscript) {
        console.log('Interim result received:', interimTranscript);
        
        // Track progressive results
        this.progressiveResults.push(interimTranscript);
        this.isProgressiveResult = true;
        
        // Debounce interim results
        this.debounceTranscript(interimTranscript, false);
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
        
        // Start with all progressive results
        let merged = [...this.progressiveResults, finalTranscript].join(' ');
        
        // Remove duplicates (common words that appear multiple times)
        merged = this.removeProgressiveDuplicates(merged);
        
        // Normalize
        merged = this.normalizeTranscript(merged);
        
        console.log('Merged progressive results:', merged);
        return merged;
    }

    /**
     * Remove duplicates from progressive results
     * @param {string} text - Text with possible duplicates
     * @returns {string} Cleaned text
     */
    removeProgressiveDuplicates(text) {
        // Split into sentences or phrases
        const phrases = text.split(/(?<=[.!?])\s+/);
        
        // Keep only unique phrases (case-insensitive)
        const uniquePhrases = [];
        const seen = new Set();
        
        for (const phrase of phrases) {
            const normalizedPhrase = this.normalizeTranscript(phrase);
            if (!seen.has(normalizedPhrase)) {
                seen.add(normalizedPhrase);
                uniquePhrases.push(phrase.trim());
            }
        }
        
        // Also remove word-level duplicates within phrases
        let result = uniquePhrases.join(' ');
        result = result.replace(/\b(\w+)\b(?=.*\b\1\b)/gi, '').replace(/\s+/g, ' ').trim();
        
        return result;
    }

    /**
     * Send transcript to callback
     * @param {string} transcript - Transcript text
     * @param {boolean} isFinal - Whether it's final
     */
    sendTranscript(transcript, isFinal = false) {
        const normalized = this.normalizeTranscript(transcript);
        
        // Skip if same as last transcript (prevents duplicates)
        if (normalized !== this.lastTranscript) {
            this.lastTranscript = normalized;
            
            // Clear any pending debounce timeout
            if (this.transcriptTimeout) {
                clearTimeout(this.transcriptTimeout);
                this.transcriptTimeout = null;
            }
            
            this.onTranscript?.(transcript, { 
                isFinal,
                final: isFinal ? transcript : null,
                interim: !isFinal ? transcript : null 
            });
        } else {
            console.log('Skipping duplicate transcript:', normalized);
        }
    }

    /**
     * Normalize transcript for duplicate detection
     * @param {string} transcript - Transcript text
     * @returns {string} Normalized transcript
     */
    normalizeTranscript(transcript) {
        return transcript
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')        // Remove extra spaces
            .replace(/[^\w\s.,!?]/g, '') // Remove special chars except basic punctuation
            .replace(/\b(a|an|the|and|or|but)\b/gi, '') // Remove common articles
            .replace(/\s+/g, ' ')        // Clean up spaces again
            .trim();
    }

    /**
     * Debounce interim transcript results
     * @param {string} transcript - Transcript text
     * @param {boolean} isFinal - Whether it's a final result
     */
    debounceTranscript(transcript, isFinal) {
        // Clear existing timeout
        if (this.transcriptTimeout) {
            clearTimeout(this.transcriptTimeout);
        }
        
        // Set new timeout
        this.transcriptTimeout = setTimeout(() => {
            // For interim results, we want to send them but they might be partial
            // Only send if significantly different from last
            const normalized = this.normalizeTranscript(transcript);
            const lastNormalized = this.normalizeTranscript(this.lastTranscript);
            
            // Check if this is a meaningful update (not just a small addition)
            if (isFinal || this.isMeaningfulUpdate(normalized, lastNormalized)) {
                this.lastTranscript = normalized;
                this.onTranscript?.(transcript, { isFinal });
            }
            this.transcriptTimeout = null;
        }, this.config.debounceDelay);
    }

    /**
     * Check if update is meaningful (not just adding a word to existing text)
     * @param {string} newText - New transcript
     * @param {string} oldText - Old transcript
     * @returns {boolean} Whether update is meaningful
     */
    isMeaningfulUpdate(newText, oldText) {
        if (!oldText) return true;
        if (newText === oldText) return false;
        
        // Check if new text just adds to old text
        if (newText.startsWith(oldText) && newText.length > oldText.length + 5) {
            return false; // It's just adding more words, not a meaningful change
        }
        
        // Check word count difference
        const oldWords = oldText.split(/\s+/).length;
        const newWords = newText.split(/\s+/).length;
        
        // If it's just adding 1-2 words to the end, it's likely progressive
        if (newWords <= oldWords + 2 && newText.includes(oldText)) {
            return false;
        }
        
        return true;
    }

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

    // ======================
    // SILENCE DETECTION
    // ======================
    /**
     * Start silence detection timer
     */
    startSilenceDetection() {
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
        }
        
        // Stop after 2 seconds of silence
        this.silenceTimeout = setTimeout(() => {
            if (this.isListening && !this.config.continuous) {
                console.log('Silence detected, stopping recognition');
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

        // Prevent double-start
        if (this.isListening) {
            console.log('Already listening, ignoring duplicate start');
            return false;
        }

        // Validate language format
        if (!this.validateLanguage(language)) {
            this.onError?.('Invalid language code format');
            return false;
        }

        try {
            // Reset state
            this.userStoppedSpeech = false;
            this.lastTranscript = '';
            this.lastFinalTranscript = '';
            this.progressiveResults = [];
            this.isProgressiveResult = false;
            
            // Set language and start
            this.speechRecognition.lang = language;
            this.speechRecognition.start();
            console.log(`Started listening with language: ${language}`);
            return true;
        } catch (error) {
            console.error('Failed to start listening:', error);
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
        
        console.log('Stopping listening (user initiated)');
        this.userStoppedSpeech = true;
        this.forceStopListening();
    }

    /**
     * Force stop listening (internal use)
     */
    forceStopListening() {
        try {
            if (this.speechRecognition) {
                this.speechRecognition.abort(); // Use abort instead of stop
            }
        } catch (error) {
            // Ignore errors on abort
        } finally {
            this.clearTimeouts();
            this.isListening = false;
            this.progressiveResults = [];
            this.isProgressiveResult = false;
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
        // Basic language code validation (e.g., en-US, fr-FR, es-ES)
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
     * @param {string} options.lang - Language code
     * @param {number} options.rate - Speech rate (0.1-10)
     * @param {number} options.pitch - Speech pitch (0-2)
     * @param {number} options.volume - Volume (0-1)
     * @param {string} options.voice - Voice URI
     * @returns {boolean} Success status
     */
    speak(text, options = {}) {
        if (!this.supported.speechSynthesis) {
            this.onError?.('Speech synthesis not supported');
            return false;
        }

        if (!text || typeof text !== 'string') {
            this.onError?.('Invalid text for speech synthesis');
            return false;
        }

        // Cancel any ongoing speech
        if (this.speechSynthesis.speaking) {
            this.userStoppedSpeech = true;
            this.speechSynthesis.cancel();
        }

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set options
        utterance.lang = options.lang || this.config.defaultLang;
        utterance.rate = Math.min(Math.max(options.rate || 1.0, 0.1), 10);
        utterance.pitch = Math.min(Math.max(options.pitch || 1.0, 0), 2);
        utterance.volume = Math.min(Math.max(options.volume || 1.0, 0), 1);
        
        // Set voice if specified
        if (options.voice) {
            const voices = this.speechSynthesis.getVoices();
            const voice = voices.find(v => v.voiceURI === options.voice);
            if (voice) utterance.voice = voice;
        }

        // Event handlers
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

        // Start speaking
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
     * @returns {Promise<Array>} Array of SpeechSynthesisVoice objects
     */
    getVoices() {
        return new Promise((resolve) => {
            const voices = this.speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
            } else {
                // Wait for voices to load
                const onVoicesChanged = () => {
                    this.speechSynthesis.onvoiceschanged = null;
                    resolve(this.speechSynthesis.getVoices());
                };
                this.speechSynthesis.onvoiceschanged = onVoicesChanged;
                
                // Fallback timeout
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

    /**
     * Get voices for a specific language
     * @param {string} lang - Language code
     * @returns {Promise<Array>} Array of voices
     */
    async getVoicesForLanguage(lang) {
        const voices = await this.getVoices();
        return voices.filter(voice => voice.lang === lang);
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
            config: { ...this.config }
        };
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.forceStopListening();
        this.stopSpeaking();
        this.clearTimeouts();
        this.lastTranscript = '';
        this.lastFinalTranscript = '';
        this.progressiveResults = [];
        this.isProgressiveResult = false;
        this.userStoppedSpeech = false;
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Update speech recognition if needed
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
        console.log('Destroying VoiceHandler');
        
        // Stop listening and speaking
        this.forceStopListening();
        this.stopSpeaking();
        
        // Clear all timeouts
        this.clearTimeouts();
        
        // Remove event listeners
        if (this.speechRecognition) {
            this.speechRecognition.onstart = null;
            this.speechRecognition.onresult = null;
            this.speechRecognition.onerror = null;
            this.speechRecognition.onend = null;
            this.speechRecognition.onsoundstart = null;
            this.speechRecognition.onsoundend = null;
        }
        
        // Clear callbacks
        this.setCallbacks({});
        
        // Nullify references
        this.speechRecognition = null;
        this.speechSynthesis = null;
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
