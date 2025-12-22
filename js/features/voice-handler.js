import { notifications } from '../ui/notifications.js';

export class VoiceHandler {
    constructor() {
        this.isListening = false;
        this.setup();
    }
    
    setup() {
        const voiceBtn = document.getElementById('voiceInputBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        }
    }
    
    toggleVoiceInput() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            notifications.error('Voice input not supported in your browser');
            return;
        }
        
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    startListening() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            this.isListening = true;
            const voiceBtn = document.getElementById('voiceInputBtn');
            if (voiceBtn) {
                voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                voiceBtn.style.color = '#ef4444';
            }
            notifications.info('Listening... Speak now');
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('requirement');
            if (input) {
                input.value = transcript;
                // Trigger any input events
                input.dispatchEvent(new Event('input'));
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            notifications.error('Voice input failed: ' + event.error);
        };
        
        recognition.onend = () => {
            this.isListening = false;
            const voiceBtn = document.getElementById('voiceInputBtn');
            if (voiceBtn) {
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceBtn.style.color = '';
            }
        };
        
        recognition.start();
    }
    
    stopListening() {
        this.isListening = false;
        const voiceBtn = document.getElementById('voiceInputBtn');
        if (voiceBtn) {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.style.color = '';
        }
    }
}

export const voiceHandler = new VoiceHandler();
