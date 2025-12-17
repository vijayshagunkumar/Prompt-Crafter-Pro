import { notifications } from '../ui/notifications.js';

export class ExportHandler {
    constructor() {
        this.setup();
    }
    
    setup() {
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportPrompt());
        }
    }
    
    exportPrompt() {
        const output = document.getElementById('output');
        if (!output || !output.value.trim()) {
            notifications.error('No prompt to export');
            return;
        }
        
        const prompt = output.value;
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `prompt-${timestamp}.txt`;
        
        // Create blob and download
        const blob = new Blob([prompt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        notifications.success(`Prompt exported as ${filename}`);
    }
}

export const exportHandler = new ExportHandler();
