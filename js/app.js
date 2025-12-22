// PromptCraft - Complete Working App

document.addEventListener('DOMContentLoaded', function() {
    console.log('PromptCraft loaded successfully!');
    
    // Get all elements
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const convertBtn = document.getElementById('convertBtn');
    const resetBtn = document.getElementById('resetBtn');
    const convertedBadge = document.getElementById('convertedBadge');
    const intentChips = document.getElementById('intentChips');
    
    // AI Tool buttons
    const chatgptBtn = document.getElementById('chatgptBtn');
    const claudeBtn = document.getElementById('claudeBtn');
    const geminiBtn = document.getElementById('geminiBtn');
    const perplexityBtn = document.getElementById('perplexityBtn');
    const deepseekBtn = document.getElementById('deepseekBtn');
    const copilotBtn = document.getElementById('copilotBtn');
    const grokBtn = document.getElementById('grokBtn');
    
    // AI Tool URLs
    const toolUrls = {
        chatgptBtn: 'https://chat.openai.com',
        claudeBtn: 'https://claude.ai',
        geminiBtn: 'https://gemini.google.com',
        perplexityBtn: 'https://www.perplexity.ai',
        deepseekBtn: 'https://chat.deepseek.com',
        copilotBtn: 'https://copilot.microsoft.com',
        grokBtn: 'https://x.com/i/grok'
    };
    
    // Initialize
    updateIntentChips();
    enableAITools(false);
    
    // === EVENT LISTENERS ===
    
    // Input text change
    inputText.addEventListener('input', function() {
        updateIntentChips();
        convertBtn.disabled = !this.value.trim();
    });
    
    // Convert button click
    convertBtn.addEventListener('click', function() {
        convertPrompt();
    });
    
    // Reset button click
    resetBtn.addEventListener('click', function() {
        resetEverything();
    });
    
    // AI Tool buttons
    Object.keys(toolUrls).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', function() {
                openAITool(btnId);
            });
        }
    });
    
    // === FUNCTIONS ===
    
    // Update intent chips based on input
    function updateIntentChips() {
        const text = inputText.value.toLowerCase();
        intentChips.innerHTML = '';
        
        const chips = [];
        
        if (text.includes('email') || text.includes('mail')) {
            chips.push('📧 Email');
        }
        if (text.includes('code') || text.includes('program')) {
            chips.push('💻 Code');
        }
        if (text.includes('urgent') || text.includes('asap')) {
            chips.push('🚨 Urgent');
        }
        if (text.includes('creative') || text.includes('story')) {
            chips.push('🎨 Creative');
        }
        if (text.includes('analysis') || text.includes('analyze')) {
            chips.push('📊 Analysis');
        }
        if (text.includes('professional') || text.includes('business')) {
            chips.push('💼 Professional');
        }
        if (text.includes('summary') || text.includes('summarize')) {
            chips.push('📝 Summary');
        }
        
        chips.forEach(chipText => {
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.textContent = chipText;
            intentChips.appendChild(chip);
        });
    }
    
    // Convert prompt
    function convertPrompt() {
        const input = inputText.value.trim();
        if (!input) return;
        
        // Show loading
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
        convertBtn.disabled = true;
        
        // Generate structured prompt
        setTimeout(() => {
            const structuredPrompt = createStructuredPrompt(input);
            outputText.value = structuredPrompt;
            
            // Show converted badge
            convertedBadge.style.display = 'inline-block';
            
            // Enable AI tools
            enableAITools(true);
            
            // Reset button
            convertBtn.innerHTML = '<i class="fas fa-magic"></i> Convert';
            convertBtn.disabled = false;
            
            // Show success message
            showNotification('✅ Prompt converted successfully!');
        }, 800);
    }
    
    // Create structured prompt
    function createStructuredPrompt(text) {
        let prompt = `# Structured Prompt\n\n`;
        prompt += `## Objective\n`;
        prompt += `${text}\n\n`;
        
        prompt += `## Context & Requirements\n`;
        
        if (text.toLowerCase().includes('email')) {
            prompt += `- Target: Professional communication\n`;
            prompt += `- Tone: Formal but approachable\n`;
            prompt += `- Structure: Subject line, greeting, body, closing\n`;
            prompt += `- Length: Concise (100-200 words)\n`;
            prompt += `- Key elements: Clear request, polite tone, contact info\n`;
        } 
        else if (text.toLowerCase().includes('code')) {
            prompt += `- Language: [Specify programming language]\n`;
            prompt += `- Purpose: [Describe functionality]\n`;
            prompt += `- Requirements: Clean, documented, efficient\n`;
            prompt += `- Output: Complete code with comments\n`;
            prompt += `- Constraints: Best practices, error handling\n`;
        }
        else if (text.toLowerCase().includes('analysis')) {
            prompt += `- Approach: Data-driven, evidence-based\n`;
            prompt += `- Depth: Comprehensive but focused\n`;
            prompt += `- Structure: Introduction, findings, conclusions\n`;
            prompt += `- Tone: Objective, professional\n`;
            prompt += `- Output: Clear insights with supporting data\n`;
        }
        else {
            prompt += `- Tone: Professional and clear\n`;
            prompt += `- Structure: Logical flow with headings\n`;
            prompt += `- Depth: Appropriate for the task\n`;
            prompt += `- Format: Well-organized content\n`;
            prompt += `- Goal: Achieve the stated objective\n`;
        }
        
        prompt += `\n## Instructions\n`;
        prompt += `1. Read the objective carefully\n`;
        prompt += `2. Consider the context and requirements\n`;
        prompt += `3. Generate a complete, ready-to-use response\n`;
        prompt += `4. Ensure quality, accuracy, and professionalism\n`;
        prompt += `5. Do not add meta-commentary or disclaimers\n`;
        
        prompt += `\n## Expected Output\n`;
        prompt += `A complete, high-quality response that directly addresses the objective.`;
        
        return prompt;
    }
    
    // Reset everything
    function resetEverything() {
        if (confirm('Are you sure you want to reset everything?')) {
            inputText.value = '';
            outputText.value = '';
            intentChips.innerHTML = '';
            convertedBadge.style.display = 'none';
            convertBtn.disabled = true;
            enableAITools(false);
            showNotification('🔄 Everything has been reset');
        }
    }
    
    // Enable/disable AI tools
    function enableAITools(enable) {
        const tools = [
            chatgptBtn, claudeBtn, geminiBtn, perplexityBtn, 
            deepseekBtn, copilotBtn, grokBtn
        ];
        
        tools.forEach(tool => {
            if (tool) {
                tool.disabled = !enable;
                tool.style.opacity = enable ? '1' : '0.4';
            }
        });
    }
    
    // Open AI tool with copied prompt
    function openAITool(btnId) {
        const prompt = outputText.value.trim();
        if (!prompt) {
            showNotification('⚠️ Please convert a prompt first!');
            return;
        }
        
        // Copy to clipboard
        navigator.clipboard.writeText(prompt).then(() => {
            // Show success on button
            const btn = document.getElementById(btnId);
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            btn.style.background = '#10b981';
            btn.style.borderColor = '#10b981';
            
            // Show notification
            const toolName = originalText;
            showNotification(`📋 Copied! Opening ${toolName}...`);
            
            // Reset button after 1.5 seconds
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.borderColor = '';
            }, 1500);
            
            // Open tool after short delay
            setTimeout(() => {
                window.open(toolUrls[btnId], '_blank');
            }, 500);
            
        }).catch(err => {
            console.error('Failed to copy:', err);
            showNotification('❌ Failed to copy to clipboard');
            window.open(toolUrls[btnId], '_blank');
        });
    }
    
    // Show notification
    function showNotification(message) {
        // Create notification element
        let notification = document.getElementById('flashNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'flashNotification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #1e293b;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                border-left: 4px solid #3b82f6;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                z-index: 1000;
                font-weight: 500;
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(notification);
        }
        
        notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
        notification.style.display = 'block';
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
        
        // Add animation styles
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Auto-test: Try conversion after 1 second
    setTimeout(() => {
        if (inputText.value.trim()) {
            convertBtn.click();
        }
    }, 1000);
});
