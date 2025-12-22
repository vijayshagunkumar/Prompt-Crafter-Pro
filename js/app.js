// PromptCraft - Complete Working App

document.addEventListener('DOMContentLoaded', function() {
    console.log('PromptCraft loaded successfully!');
    
    // Initialize
    initializeApp();
    
    // Auto-test after 0.5 seconds
    setTimeout(() => {
        if (document.getElementById('inputText').value.trim()) {
            convertPrompt();
        }
    }, 500);
});

function initializeApp() {
    // Get all elements
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const convertBtn = document.getElementById('convertBtn');
    const resetBtn = document.getElementById('resetBtn');
    const convertedBadge = document.getElementById('convertedBadge');
    const intentChips = document.getElementById('intentChips');
    const expandInputBtn = document.getElementById('expandInputBtn');
    const expandOutputBtn = document.getElementById('expandOutputBtn');
    const expandOverlay = document.getElementById('expandOverlay');
    
    // Convert button is ENABLED by default (we have example text)
    convertBtn.disabled = false;
    
    // Update intent chips
    updateIntentChips(inputText.value);
    
    // === EVENT LISTENERS ===
    
    // Input text change
    inputText.addEventListener('input', function() {
        updateIntentChips(this.value);
        convertBtn.disabled = !this.value.trim();
        updateAIToolRanking(this.value);
    });
    
    // Convert button click
    convertBtn.addEventListener('click', convertPrompt);
    
    // Reset button click
    resetBtn.addEventListener('click', resetEverything);
    
    // Expand buttons
    expandInputBtn.addEventListener('click', () => toggleExpand('input'));
    expandOutputBtn.addEventListener('click', () => toggleExpand('output'));
    expandOverlay.addEventListener('click', closeExpandedMode);
    
    // Escape key to close expanded mode
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeExpandedMode();
        }
    });
    
    // Setup AI Tool buttons
    setupAIToolButtons();
    
    // Initial AI tool ranking
    updateAIToolRanking(inputText.value);
}

function updateIntentChips(text) {
    const intentChips = document.getElementById('intentChips');
    intentChips.innerHTML = '';
    
    if (!text.trim()) return;
    
    const lowerText = text.toLowerCase();
    const chips = [];
    
    if (lowerText.includes('email') || lowerText.includes('mail')) {
        chips.push('📧 Email');
    }
    if (lowerText.includes('code') || lowerText.includes('program') || lowerText.includes('script')) {
        chips.push('💻 Code');
    }
    if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('immediately')) {
        chips.push('🚨 Urgent');
    }
    if (lowerText.includes('creative') || lowerText.includes('story') || lowerText.includes('write')) {
        chips.push('🎨 Creative');
    }
    if (lowerText.includes('analysis') || lowerText.includes('analyze') || lowerText.includes('research')) {
        chips.push('📊 Analysis');
    }
    if (lowerText.includes('professional') || lowerText.includes('business') || lowerText.includes('formal')) {
        chips.push('💼 Professional');
    }
    if (lowerText.includes('summary') || lowerText.includes('summarize') || lowerText.includes('brief')) {
        chips.push('📝 Summary');
    }
    
    chips.forEach(chipText => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = chipText;
        intentChips.appendChild(chip);
    });
}

function updateAIToolRanking(text) {
    if (!text) {
        resetAIToolRanking();
        return;
    }
    
    const lowerText = text.toLowerCase();
    
    // AI Tool profiles and their strengths
    const toolProfiles = {
        'chatgptBtn': ['general', 'email', 'writing', 'analysis', 'professional', 'code'],
        'claudeBtn': ['writing', 'analysis', 'business', 'detailed', 'professional'],
        'geminiBtn': ['research', 'analysis', 'education', 'technical', 'code'],
        'perplexityBtn': ['research', 'analysis', 'brief', 'facts', 'summary'],
        'deepseekBtn': ['code', 'technical', 'programming'],
        'copilotBtn': ['code', 'quick', 'development'],
        'grokBtn': ['creative', 'general', 'casual', 'humor', 'story']
    };
    
    // Calculate scores
    const scores = {};
    Object.keys(toolProfiles).forEach(toolId => {
        let score = 0;
        toolProfiles[toolId].forEach(strength => {
            if (lowerText.includes(strength)) {
                score += 10;
            }
        });
        scores[toolId] = score;
    });
    
    // Sort by score
    const sortedTools = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    
    // Reorder buttons
    reorderAITools(sortedTools);
    
    // Mark best match
    markBestMatch(sortedTools[0]);
}

function reorderAITools(sortedTools) {
    const container = document.getElementById('aiToolsContainer');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Add in new order
    sortedTools.forEach(toolId => {
        const btn = document.getElementById(toolId);
        if (btn) {
            container.appendChild(btn);
        }
    });
}

function markBestMatch(toolId) {
    // Remove all best-match classes
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('best-match');
    });
    
    // Add to best match
    const bestBtn = document.getElementById(toolId);
    if (bestBtn) {
        bestBtn.classList.add('best-match');
    }
}

function resetAIToolRanking() {
    const defaultOrder = [
        'chatgptBtn', 'claudeBtn', 'geminiBtn', 
        'perplexityBtn', 'deepseekBtn', 'copilotBtn', 'grokBtn'
    ];
    
    const container = document.getElementById('aiToolsContainer');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Add in default order
    defaultOrder.forEach(toolId => {
        const btn = document.getElementById(toolId);
        if (btn) {
            btn.classList.remove('best-match');
            if (toolId === 'chatgptBtn') {
                btn.classList.add('best-match');
            }
            container.appendChild(btn);
        }
    });
}

async function convertPrompt() {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const convertBtn = document.getElementById('convertBtn');
    const convertedBadge = document.getElementById('convertedBadge');
    
    const text = inputText.value.trim();
    if (!text) {
        showNotification('Please enter some text first!');
        return;
    }
    
    // Show loading
    const originalText = convertBtn.innerHTML;
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
    convertBtn.disabled = true;
    
    try {
        // Try OpenAI API first
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: text })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.result) {
                outputText.value = data.result;
                showNotification('✅ Generated with OpenAI!');
            } else {
                throw new Error('No result from API');
            }
        } else {
            throw new Error(`API error: ${response.status}`);
        }
    } catch (error) {
        console.log('Using local formatting:', error.message);
        // Fallback to local formatting
        outputText.value = createStructuredPrompt(text);
        showNotification('📝 Generated with local formatting');
    }
    
    // Show converted badge
    convertedBadge.style.display = 'inline-block';
    
    // Enable AI tools
    enableAITools();
    
    // Reset button
    convertBtn.innerHTML = originalText;
    convertBtn.disabled = false;
}

function createStructuredPrompt(text) {
    let prompt = `# Structured Prompt\n\n`;
    prompt += `## Objective\n`;
    prompt += `${text}\n\n`;
    
    prompt += `## Context & Requirements\n`;
    
    const lowerText = text.toLowerCase();
    if (lowerText.includes('email')) {
        prompt += `- Target: Professional communication\n`;
        prompt += `- Tone: Formal but approachable\n`;
        prompt += `- Structure: Subject line, greeting, body, closing\n`;
        prompt += `- Length: Concise (100-200 words)\n`;
        prompt += `- Key elements: Clear request, polite tone, contact info\n`;
    } 
    else if (lowerText.includes('code') || lowerText.includes('program')) {
        prompt += `- Language: Appropriate for the task\n`;
        prompt += `- Purpose: Solve the described problem\n`;
        prompt += `- Requirements: Clean, documented, efficient\n`;
        prompt += `- Output: Complete working code\n`;
        prompt += `- Constraints: Best practices, error handling\n`;
    }
    else if (lowerText.includes('analysis') || lowerText.includes('analyze')) {
        prompt += `- Approach: Data-driven, evidence-based\n`;
        prompt += `- Depth: Comprehensive but focused\n`;
        prompt += `- Structure: Introduction, findings, conclusions\n`;
        prompt += `- Tone: Objective, professional\n`;
        prompt += `- Output: Clear insights with supporting data\n`;
    }
    else if (lowerText.includes('creative') || lowerText.includes('story')) {
        prompt += `- Style: Engaging and imaginative\n`;
        prompt += `- Tone: Appropriate for the genre\n`;
        prompt += `- Structure: Beginning, middle, end\n`;
        prompt += `- Length: As specified or appropriate\n`;
        prompt += `- Elements: Characters, setting, plot, conflict\n`;
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

function resetEverything() {
    if (confirm('Are you sure you want to reset everything?')) {
        const inputText = document.getElementById('inputText');
        const outputText = document.getElementById('outputText');
        const convertBtn = document.getElementById('convertBtn');
        const convertedBadge = document.getElementById('convertedBadge');
        const intentChips = document.getElementById('intentChips');
        
        // Clear everything
        inputText.value = '';
        outputText.value = '';
        intentChips.innerHTML = '';
        convertedBadge.style.display = 'none';
        
        // Disable buttons
        convertBtn.disabled = true;
        
        // Disable AI tools
        disableAITools();
        
        // Reset AI tool ranking
        resetAIToolRanking();
        
        showNotification('🔄 Everything has been reset');
    }
}

function setupAIToolButtons() {
    const tools = {
        'chatgptBtn': 'https://chat.openai.com',
        'claudeBtn': 'https://claude.ai',
        'geminiBtn': 'https://gemini.google.com',
        'perplexityBtn': 'https://www.perplexity.ai',
        'deepseekBtn': 'https://chat.deepseek.com',
        'copilotBtn': 'https://copilot.microsoft.com',
        'grokBtn': 'https://x.com/i/grok'
    };
    
    Object.keys(tools).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                const outputText = document.getElementById('outputText');
                const prompt = outputText.value.trim();
                
                if (!prompt) {
                    showNotification('⚠️ Please generate a prompt first!');
                    return;
                }
                
                // Copy to clipboard
                navigator.clipboard.writeText(prompt).then(() => {
                    // Show success
                    const originalText = btn.textContent;
                    btn.textContent = '✓ Copied!';
                    btn.style.background = '#10b981';
                    btn.style.borderColor = '#10b981';
                    
                    const toolName = originalText;
                    showNotification(`📋 Copied! Opening ${toolName}...`);
                    
                    // Reset button after 1.5 seconds
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.background = '';
                        btn.style.borderColor = '';
                    }, 1500);
                    
                    // Open tool
                    setTimeout(() => {
                        window.open(tools[id], '_blank');
                    }, 500);
                    
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    showNotification('❌ Failed to copy');
                    window.open(tools[id], '_blank');
                });
            });
        }
    });
}

function enableAITools() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.disabled = false;
    });
}

function disableAITools() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.disabled = true;
    });
}

function toggleExpand(type) {
    const expandOverlay = document.getElementById('expandOverlay');
    const textarea = type === 'input' 
        ? document.getElementById('inputText')
        : document.getElementById('outputText');
    
    if (textarea.classList.contains('expanded-mode')) {
        // Collapse
        textarea.classList.remove('expanded-mode');
        expandOverlay.style.display = 'none';
    } else {
        // Expand
        textarea.classList.add('expanded-mode');
        expandOverlay.style.display = 'block';
        textarea.focus();
        textarea.select();
    }
}

function closeExpandedMode() {
    const expandOverlay = document.getElementById('expandOverlay');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    
    inputText.classList.remove('expanded-mode');
    outputText.classList.remove('expanded-mode');
    expandOverlay.style.display = 'none';
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.style.display = 'flex';
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}
