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
        
        // Create export options
        this.showExportMenu(output.value);
    }
    
    showExportMenu(promptText) {
        const menu = document.createElement('div');
        menu.className = 'export-menu';
        menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 20px;
            z-index: 3000;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            min-width: 300px;
        `;
        
        menu.innerHTML = `
            <h3 style="margin-bottom: 20px; color: var(--text-primary);">
                <i class="fas fa-file-export"></i> Export Prompt
            </h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="export-option" data-format="txt">
                    <i class="fas fa-file-alt"></i> As Text File (.txt)
                </button>
                <button class="export-option" data-format="md">
                    <i class="fab fa-markdown"></i> As Markdown (.md)
                </button>
                <button class="export-option" data-format="json">
                    <i class="fas fa-code"></i> As JSON (.json)
                </button>
                <button class="export-option" data-format="clipboard">
                    <i class="fas fa-clipboard"></i> Copy to Clipboard
                </button>
            </div>
            <button id="closeExportMenu" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 24px;
                cursor: pointer;
            ">&times;</button>
        `;
        
        document.body.appendChild(menu);
        
        // Add styles for buttons
        const style = document.createElement('style');
        style.textContent = `
            .export-option {
                padding: 12px 16px;
                background: var(--card-bg-dark);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                color: var(--text-primary);
                cursor: pointer;
                text-align: left;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .export-option:hover {
                background: var(--hover-bg);
                border-color: var(--primary);
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
        
        // Event listeners
        menu.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                this.handleExport(promptText, format);
                document.body.removeChild(menu);
                document.head.removeChild(style);
            });
        });
        
        menu.querySelector('#closeExportMenu').addEventListener('click', () => {
            document.body.removeChild(menu);
            document.head.removeChild(style);
        });
        
        // Close on outside click
        menu.addEventListener('click', (e) => e.stopPropagation());
        document.addEventListener('click', () => {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
                document.head.removeChild(style);
            }
        });
    }
    
    handleExport(text, format) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `prompt-${timestamp}`;
        
        switch(format) {
            case 'txt':
                this.downloadFile(text, `${filename}.txt`, 'text/plain');
                break;
                
            case 'md':
                const mdContent = `# AI Prompt\n\n## Generated: ${new Date().toLocaleString()}\n\n\`\`\`\n${text}\n\`\`\``;
                this.downloadFile(mdContent, `${filename}.md`, 'text/markdown');
                break;
                
            case 'json':
                const jsonContent = {
                    prompt: text,
                    generatedAt: new Date().toISOString(),
                    version: 'PromptCraft v3.2'
                };
                this.downloadFile(
                    JSON.stringify(jsonContent, null, 2),
                    `${filename}.json`,
                    'application/json'
                );
                break;
                
            case 'clipboard':
                navigator.clipboard.writeText(text).then(() => {
                    notifications.success('Prompt copied to clipboard!');
                }).catch(() => {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    notifications.success('Prompt copied to clipboard!');
                });
                break;
        }
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
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
