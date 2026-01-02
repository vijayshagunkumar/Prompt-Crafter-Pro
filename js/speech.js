/**
 * Speech Recognition and Synthesis Service
 * Handles voice input and output for PromptCraft Pro
 */

class SpeechService {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.speechQueue = [];
        this.currentUtterance = null;
        
        // Default settings
        this.settings = {
            language: 'en-US',
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            voice: null
        };
        
        // Load settings from localStorage
        this.loadSettings();
        
        // Initialize speech recognition
        this.initRecognition();
        
        // Initialize speech synthesis
        this.initSynthesis();
    }
    
    /**
     * Initialize speech recognition
     */
    initRecognition() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return false;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configuration
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.settings.language;
        this.recognition.maxAlternatives = 1;
        
        // Event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            this.dispatchEvent('speechstart');
        };
        
        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            this.dispatchEvent('speechresult', { transcript, isFinal: event.results[0].isFinal });
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.dispatchEvent('speecherror', { error: event.error });
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.dispatchEvent('speechend');
        };
        
        return true;
    }
    
    /**
     * Initialize speech synthesis
     */
    initSynthesis() {
        if (!this.synthesis) {
            console.warn('Speech synthesis not supported in this browser');
            return false;
        }
        
        // Load available voices
        this.loadVoices();
        
        // Voice changed event
        this.synthesis.onvoiceschanged = () => {
            this.loadVoices();
        };
        
        return true;
    }
    
    /**
     * Load available voices
     */
    loadVoices() {
        if (!this.synthesis) return;
        
        const voices = this.synthesis.getVoices();
        this.voices = voices;
        
        // Try to find a voice matching the current language
        if (voices.length > 0 && !this.settings.voice) {
            const preferredVoice = voices.find(voice => 
                voice.lang === this.settings.language
            ) || voices[0];
            
            this.settings.voice = preferredVoice;
        }
        
        this.dispatchEvent('voiceschanged', { voices });
    }
    
    /**
     * Start speech recognition
     */
    startListening() {
        if (!this.recognition) {
            this.dispatchEvent('speecherror', { error: 'Speech recognition not available' });
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
            console.error('Failed to start speech recognition:', error);
            this.dispatchEvent('speecherror', { error: error.message });
            return false;
        }
    }
    
    /**
     * Stop speech recognition
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
        
        this.isListening = false;
        this.dispatchEvent('speechend');
    }
    
    /**
     * Speak text
     */
    speak(text, options = {}) {
        if (!this.synthesis || !text) {
            return false;
        }
        
        // If already speaking, add to queue
        if (this.isSpeaking) {
            this.speechQueue.push({ text, options });
            return true;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        utterance.rate = options.rate || this.settings.rate;
        utterance.pitch = options.pitch || this.settings.pitch;
        utterance.volume = options.volume || this.settings.volume;
        utterance.lang = options.lang || this.settings.language;
        utterance.voice = options.voice || this.settings.voice;
        
        // Event handlers
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.currentUtterance = utterance;
            this.dispatchEvent('speakstart', { text, options });
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.dispatchEvent('speakend', { text, options });
            
            // Process next in queue
            this.processSpeechQueue();
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.dispatchEvent('speakerror', { error: event.error, text, options });
            
            // Process next in queue
            this.processSpeechQueue();
        };
        
        try {
            this.synthesis.speak(utterance);
            return true;
        } catch (error) {
            console.error('Failed to speak:', error);
            this.dispatchEvent('speakerror', { error: error.message, text, options });
            return false;
        }
    }
    
    /**
     * Stop speaking
     */
    stopSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.speechQueue = [];
            this.dispatchEvent('speakend', { text: 'Cancelled', options: {} });
        }
    }
    
    /**
     * Process speech queue
     */
    processSpeechQueue() {
        if (this.speechQueue.length > 0 && !this.isSpeaking) {
            const next = this.speechQueue.shift();
            this.speak(next.text, next.options);
        }
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('promptcraft_speech_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                Object.assign(this.settings, settings);
            }
        } catch (error) {
            console.warn('Failed to load speech settings:', error);
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('promptcraft_speech_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save speech settings:', error);
        }
    }
    
    /**
     * Update settings
     */
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        
        // Update recognition language if changed
        if (this.recognition && newSettings.language) {
            this.recognition.lang = newSettings.language;
        }
        
        this.saveSettings();
        this.dispatchEvent('settingschanged', { settings: this.settings });
    }
    
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }
    
    /**
     * Get available languages for speech recognition
     */
    getRecognitionLanguages() {
        return [
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' },
            { code: 'es-ES', name: 'Spanish (Spain)' },
            { code: 'fr-FR', name: 'French (France)' },
            { code: 'de-DE', name: 'German' },
            { code: 'it-IT', name: 'Italian' },
            { code: 'pt-BR', name: 'Portuguese (Brazil)' },
            { code: 'ru-RU', name: 'Russian' },
            { code: 'ja-JP', name: 'Japanese' },
            { code: 'ko-KR', name: 'Korean' },
            { code: 'zh-CN', name: 'Chinese (Simplified)' },
            { code: 'hi-IN', name: 'Hindi (India)' }
        ];
    }
    
    /**
     * Get available voices
     */
    getVoices() {
        return this.voices || [];
    }
    
    /**
     * Set voice by name or language
     */
    setVoice(voiceNameOrLang) {
        if (!this.voices || this.voices.length === 0) {
            return false;
        }
        
        const voice = this.voices.find(v => 
            v.name === voiceNameOrLang || v.lang === voiceNameOrLang
        );
        
        if (voice) {
            this.settings.voice = voice;
            this.saveSettings();
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if speech recognition is supported
     */
    isRecognitionSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    
    /**
     * Check if speech synthesis is supported
     */
    isSynthesisSupported() {
        return !!window.speechSynthesis;
    }
    
    /**
     * Check if currently listening
     */
    getIsListening() {
        return this.isListening;
    }
    
    /**
     * Check if currently speaking
     */
    getIsSpeaking() {
        return this.isSpeaking;
    }
    
    /**
     * Dispatch custom events
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`speech:${eventName}`, { 
            detail: { ...detail, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Pause speaking
     */
    pauseSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.pause();
            this.dispatchEvent('speakpause');
        }
    }
    
    /**
     * Resume speaking
     */
    resumeSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.resume();
            this.dispatchEvent('speakresume');
        }
    }
    
    /**
     * Clear speech queue
     */
    clearQueue() {
        this.speechQueue = [];
    }
}

// Create singleton instance
const speechService = new SpeechService();

// Make globally available
window.SpeechService = SpeechService;
window.speechService = speechService;

// Export for module usage
export { SpeechService };
