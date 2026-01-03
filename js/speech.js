/**
 * Speech Recognition and Synthesis Service
 */

class SpeechService {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.speechQueue = [];
        this.currentUtterance = null;
        
        // Settings
        this.settings = {
            language: 'en-US',
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            voice: null
        };
        
        // Load saved settings
        this.loadSettings();
        
        // Initialize
        this.initRecognition();
        this.initSynthesis();
    }
    
    /**
     * Initialize speech recognition
     */
    initRecognition() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            Config.warn('Speech recognition not supported');
            return false;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = this.settings.language;
        this.recognition.maxAlternatives = 1;
        
        // Event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            this.dispatchEvent('listeningstart');
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.dispatchEvent('listeningresult', { transcript });
        };
        
        this.recognition.onerror = (event) => {
            this.isListening = false;
            this.dispatchEvent('listeningerror', { error: event.error });
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.dispatchEvent('listeningend');
        };
        
        return true;
    }
    
    /**
     * Initialize speech synthesis
     */
    initSynthesis() {
        if (!this.synthesis) {
            Config.warn('Speech synthesis not supported');
            return false;
        }
        
        // Load voices
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
        
        this.voices = this.synthesis.getVoices();
        
        // Try to find preferred voice
        if (this.voices.length > 0 && !this.settings.voice) {
            const preferredVoice = this.voices.find(voice => 
                voice.lang === this.settings.language
            ) || this.voices[0];
            
            this.settings.voice = preferredVoice;
        }
        
        this.dispatchEvent('voiceschanged', { voices: this.voices });
    }
    
    /**
     * Start voice input
     */
    startListening() {
        if (!this.recognition) {
            Config.error('Speech recognition not available');
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
            Config.error('Failed to start listening:', error);
            return false;
        }
    }
    
    /**
     * Stop voice input
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (error) {
                Config.error('Error stopping recognition:', error);
            }
        }
        
        this.isListening = false;
        this.dispatchEvent('listeningend');
    }
    
    /**
     * Speak text
     */
    speak(text, options = {}) {
        if (!this.synthesis || !text) {
            return false;
        }
        
        // Add to queue if already speaking
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
            this.dispatchEvent('speakingstart', { text, options });
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.dispatchEvent('speakingend', { text, options });
            this.processQueue();
        };
        
        utterance.onerror = (event) => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.dispatchEvent('speakingerror', { error: event.error, text, options });
            this.processQueue();
        };
        
        try {
            this.synthesis.speak(utterance);
            return true;
        } catch (error) {
            Config.error('Failed to speak:', error);
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
            this.dispatchEvent('speakingend', { text: 'Cancelled' });
        }
    }
    
    /**
     * Process speech queue
     */
    processQueue() {
        if (this.speechQueue.length > 0 && !this.isSpeaking) {
            const next = this.speechQueue.shift();
            this.speak(next.text, next.options);
        }
    }
    
    /**
     * Load settings from storage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(Config.getStorageKey('speech_settings'));
            if (saved) {
                Object.assign(this.settings, JSON.parse(saved));
            }
        } catch (error) {
            Config.warn('Failed to load speech settings:', error);
        }
    }
    
    /**
     * Save settings to storage
     */
    saveSettings() {
        try {
            localStorage.setItem(
                Config.getStorageKey('speech_settings'),
                JSON.stringify(this.settings)
            );
        } catch (error) {
            Config.warn('Failed to save speech settings:', error);
        }
    }
    
    /**
     * Update settings
     */
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        
        // Update recognition if language changed
        if (this.recognition && newSettings.language) {
            this.recognition.lang = newSettings.language;
        }
        
        this.saveSettings();
        this.dispatchEvent('settingschanged', { settings: this.settings });
    }
    
    /**
     * Get available voices
     */
    getVoices() {
        return this.voices || [];
    }
    
    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }
    
    /**
     * Dispatch custom event
     */
    dispatchEvent(name, detail = {}) {
        const event = new CustomEvent(`speech:${name}`, { 
            detail: { ...detail, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Check if speech recognition is available
     */
    isRecognitionAvailable() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    
    /**
     * Check if speech synthesis is available
     */
    isSynthesisAvailable() {
        return !!window.speechSynthesis;
    }
}

// Create singleton instance
const speechService = new SpeechService();

// Make globally available
window.SpeechService = SpeechService;
window.speechService = speechService;
