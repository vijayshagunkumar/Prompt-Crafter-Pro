// state.js - Application state management
(function() {
    'use strict';
    
    class AppState {
        constructor() {
            this.settings = {
                theme: 'dark',
                voiceLanguage: 'en-US',
                autoConvert: true,
                autoConvertDelay: 5000,
                promptStyle: 'detailed',
                maxHistoryItems: 25,
                notificationDuration: 3000,
                uiDensity: 'comfortable'
            };
            
            this.currentStep = 1;
            this.isListening = false;
            this.isSpeaking = false;
            this.isEditorOpen = false;
            this.currentEditor = null;
            this.selectedPlatform = null;
            this.originalPrompt = null;
            this.promptModified = false;
            this.hasGeneratedPrompt = false;
            
            this.promptHistory = [];
            this.undoStack = [];
            this.redoStack = [];
            this.templates = [];
        }
    }
    
    window.AppState = AppState;
})();
