import { appState } from '../core/app-state.js';
import { notifications } from './notifications.js';

export class SettingsManager {
  constructor() {
    this.apiKey = '';
    this.voiceLanguage = 'en-US';
    this.load();
  }
  
  load() {
    // Load API key
    this.apiKey = localStorage.getItem('OPENAI_API_KEY') || '';
    
    // Load other settings from appState
    this.voiceLanguage = localStorage.getItem('voiceLanguage') || 'en-US';
    
    // Update UI
    this.updateUI();
  }
  
  updateUI() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const autoDelayInput = document.getElementById('autoConvertDelay');
    const voiceLanguageSelect = document.getElementById('voiceLanguage');
    const delayValue = document.getElementById('delayValue');
    
    if (apiKeyInput) apiKeyInput.value = this.apiKey;
    if (autoDelayInput) autoDelayInput.value = appState.autoConvertDelay;
    if (voiceLanguageSelect) voiceLanguageSelect.value = this.voiceLanguage;
    if (delayValue) delayValue.textContent = `Current: ${appState.autoConvertDelay} seconds`;
  }
  
  save() {
    const apiKey = (document.getElementById('apiKeyInput').value || '').trim();
    const delay = document.getElementById('autoConvertDelay').value || '60';
    const voiceLang = document.getElementById('voiceLanguage').value || 'en-US';
    
    // Save to localStorage
    localStorage.setItem('OPENAI_API_KEY', apiKey);
    localStorage.setItem('voiceLanguage', voiceLang);
    
    // Update app state
    appState.autoConvertDelay = parseInt(delay, 10);
    appState.autoConvertCountdown = appState.autoConvertDelay;
    appState.saveSettings();
    
    // Update local state
    this.apiKey = apiKey;
    this.voiceLanguage = voiceLang;
    
    // Update voice language if voice features are available
    if (window.voiceFeatures && window.voiceFeatures.updateVoiceLanguage) {
      window.voiceFeatures.updateVoiceLanguage(voiceLang);
    }
    
    notifications.success('Settings saved');
  }
  
  getApiKey() {
    return this.apiKey;
  }
  
  getVoiceLanguage() {
    return this.voiceLanguage;
  }
  
  clearAllData() {
    appState.clearAllData();
    notifications.success('All data cleared. Reloading...');
    
    setTimeout(() => {
      window.location.reload();
    }, 800);
  }
}

// Singleton instance
export const settingsManager = new SettingsManager();
