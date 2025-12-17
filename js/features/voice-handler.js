import { notifications } from '../ui/notifications.js';

export class VoiceHandler {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.setup();
    }
    
    setup() {
        const voiceBtn = document.getElementById('voiceInputBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        }
        
        // Initialize speech recognition
        this.initSpeechRecognition();
    }
    
    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceButton(true);
            notifications.info('Listening... Speak now', 3000);
        };
        
        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    transcript += event.results[i][0].transcript;
                } else {
                    transcript += event.results[i][0].transcript;
                }
            }
            
            const input = document.getElementById('requirement');
            if (input) {
                input.value = transcript;
                
                // Trigger input event for auto-convert
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateVoiceButton(false);
            
            if (event.error === 'not-allowed') {
                notifications.error('Microphone access denied');
            } else if (event.error === 'audio-capture') {
                notifications.error('No microphone found');
            } else {
                notifications.error('Voice input failed: ' + event.error);
            }
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceButton(false);
            notifications.info('Voice input stopped', 2000);
        };
    }
    
    toggleVoiceInput() {
        if (!this.recognition) {
            notifications.error('Voice input not supported in your browser');
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Failed to start speech recognition:', error);
                notifications.error('Failed to start voice input');
            }
        }
    }
    
    updateVoiceButton(listening) {
        const voiceBtn = document.getElementById('voiceInputBtn');
        if (!voiceBtn) return;
        
        if (listening) {
            voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            voiceBtn.style.color = 'var(--danger)';
            voiceBtn.style.animation = 'pulse 1.5s infinite';
        } else {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.style.color = '';
            voiceBtn.style.animation = '';
        }
    }
    
    startVoiceInput() {
        if (!this.isListening && this.recognition) {
            this.recognition.start();
        }
    }
    
    stopVoiceInput() {
        if (this.isListening && this.recognition) {
            this.recognition.stop();
        }
    }
}

export const voiceHandler = new VoiceHandler();
