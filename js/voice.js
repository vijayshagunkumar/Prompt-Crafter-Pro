// voice.js - Simplified Voice Input for PromptCraft

// Voice Recognition State
let voiceRecognition = null;
let isListening = false;

// Initialize Voice Features
function initializeVoiceFeatures() {
  const voiceBtn = document.getElementById('voiceBtn');
  const requirementEl = document.getElementById('requirement');
  
  if (!voiceBtn || !requirementEl) return;
  
  // Check if browser supports speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    voiceBtn.disabled = true;
    voiceBtn.title = 'Voice input not supported in this browser';
    voiceBtn.style.opacity = '0.5';
    voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    return;
  }
  
  // Initialize recognition
  voiceRecognition = new SpeechRecognition();
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = false;
  voiceRecognition.lang = 'en-US';
  voiceRecognition.maxAlternatives = 1;
  
  // Button click handler
  voiceBtn.addEventListener('click', toggleVoiceInput);
  
  // Event listeners
  voiceRecognition.onstart = function() {
    isListening = true;
    voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
    voiceBtn.classList.add('recording');
    voiceBtn.title = 'Stop recording';
    showNotification('Listening... Speak now');
  };
  
  voiceRecognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    requirementEl.value = transcript;
    
    // Trigger input event
    const inputEvent = new Event('input', { bubbles: true });
    requirementEl.dispatchEvent(inputEvent);
    
    showNotification('Voice input captured');
  };
  
  voiceRecognition.onerror = function(event) {
    console.error('Voice recognition error:', event.error);
    stopVoiceInput();
    
    let errorMessage = 'Voice input error';
    switch(event.error) {
      case 'no-speech':
        errorMessage = 'No speech detected. Please try again.';
        break;
      case 'audio-capture':
        errorMessage = 'Microphone not accessible. Please check permissions.';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone permission denied.';
        break;
      default:
        errorMessage = `Voice input error: ${event.error}`;
    }
    
    showNotification(errorMessage);
  };
  
  voiceRecognition.onend = function() {
    stopVoiceInput();
  };
}

// Toggle voice input on/off
function toggleVoiceInput() {
  if (isListening) {
    stopVoiceInput();
  } else {
    startVoiceInput();
  }
}

// Start voice input
function startVoiceInput() {
  if (!voiceRecognition) return;
  
  try {
    voiceRecognition.start();
  } catch (error) {
    console.error('Error starting voice recognition:', error);
    showNotification('Could not start voice input');
  }
}

// Stop voice input
function stopVoiceInput() {
  if (!voiceRecognition || !isListening) return;
  
  isListening = false;
  const voiceBtn = document.getElementById('voiceBtn');
  if (voiceBtn) {
    voiceBtn.classList.remove('recording');
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceBtn.title = 'Voice Input';
  }
  
  try {
    voiceRecognition.stop();
  } catch (error) {
    console.error('Error stopping voice recognition:', error);
  }
}

// Notification helper (simplified version for voice.js)
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(30, 41, 59, 0.95);
    color: #00F3FF;
    padding: 12px 20px;
    border-radius: 4px;
    box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
    display: none;
    align-items: center;
    gap: 10px;
    z-index: 1001;
    border: 1px solid #00F3FF;
    backdrop-filter: blur(10px);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Courier New', monospace;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  notification.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>${message}</span>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.style.display = 'flex';
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVoiceFeatures);
} else {
  initializeVoiceFeatures();
}
