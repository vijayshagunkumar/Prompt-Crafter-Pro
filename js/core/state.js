// state.js - Application State Management
export class AppState {
    constructor() {
        // Default settings
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
        
        // Application state
        this.currentStep = 1;
        this.isListening = false;
        this.isSpeaking = false;
        this.isEditorOpen = false;
        this.currentEditor = null;
        this.selectedPlatform = null;
        this.originalPrompt = null;
        this.promptModified = false;
        this.hasGeneratedPrompt = false;
        
        // Data
        this.promptHistory = [];
        this.undoStack = [];
        this.redoStack = [];
        this.templates = [];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        return this.settings;
    }

    saveSettings() {
        try {
            localStorage.setItem('promptCraftSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('promptCraftSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
        return this.settings;
    }

    addToHistory(input, output) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
            output: output.substring(0, 200) + (output.length > 200 ? '...' : ''),
            fullInput: input,
            fullOutput: output
        };

        this.promptHistory.unshift(historyItem);

        // Limit history size
        if (this.promptHistory.length > this.settings.maxHistoryItems) {
            this.promptHistory = this.promptHistory.slice(0, this.settings.maxHistoryItems);
        }

        this.saveHistory();
        return historyItem;
    }

    saveHistory() {
        try {
            localStorage.setItem('promptCraftHistory', JSON.stringify(this.promptHistory));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('promptCraftHistory');
            if (saved) {
                this.promptHistory = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
        return this.promptHistory;
    }

    clearHistory() {
        this.promptHistory = [];
        localStorage.removeItem('promptCraftHistory');
    }

    addToUndoStack(value, type) {
        this.undoStack.push({
            value,
            type,
            timestamp: Date.now()
        });

        // Keep only last 50 undo steps
        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }

        this.redoStack = []; // Clear redo stack on new action
    }

    undo() {
        if (this.undoStack.length === 0) return null;
        
        const lastState = this.undoStack.pop();
        this.redoStack.push(lastState);
        
        // Return previous state
        if (this.undoStack.length > 0) {
            return this.undoStack[this.undoStack.length - 1];
        }
        return { value: '', type: lastState.type };
    }

    redo() {
        if (this.redoStack.length === 0) return null;
        
        const nextState = this.redoStack.pop();
        this.undoStack.push(nextState);
        return nextState;
    }

    reset() {
        this.currentStep = 1;
        this.isListening = false;
        this.isSpeaking = false;
        this.isEditorOpen = false;
        this.currentEditor = null;
        this.selectedPlatform = null;
        this.originalPrompt = null;
        this.promptModified = false;
        this.hasGeneratedPrompt = false;
        this.undoStack = [];
        this.redoStack = [];
        
        return this;
    }
}
