// Application state management
class AppState {
    constructor() {
        this.state = {
            currentStep: 1,
            hasGeneratedPrompt: false,
            promptModified: false,
            isListening: false,
            isSpeaking: false,
            selectedPlatform: null,
            originalPrompt: null,
            undoStack: [],
            redoStack: []
        };
    }
    
    setState(key, value) {
        this.state[key] = value;
    }
    
    getState(key) {
        return this.state[key];
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
} else {
    window.AppState = AppState;
}
