// Import your modules
import { detectIntentAttributes } from './features/intent.js';
import { initializeVoiceFeatures } from './features/voice.js';
import { initializeTheme } from './theme.js';

// App state
let currentPreset = "default";
let isConverted = false;
let lastConvertedText = "";

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('PromptCraft initializing...');
    
    // Initialize theme
    initializeTheme();
    
    // Initialize voice features
    initializeVoiceFeatures();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize AI tool ranking
    if (window.AIToolRanker) {
        window.AIToolRanker.setupTooltips();
    }
    
    // Load saved data
    loadSavedData();
});

function setupEventListeners() {
    // Get elements
    const requirement = document.getElementById('requirement');
    const output = document.getElementById('output');
    const convertBtn = document.getElementById('convertBtn');
    const resetBtn = document.getElementById('resetBtn');
    const convertedBadge = document.getElementById('convertedBadge');
    
    // === REQUIREMENT INPUT ===
    requirement.addEventListener('input', function() {
        const text = this.value.trim();
        
        // Enable/disable convert button
        convertBtn.disabled = !text;
        
        // Update intent chips
        updateIntentChips(text);
        
        // Update AI tool ranking
        if (text && window.AIToolRanker) {
            const intent = detectIntentAttributes(text);
            window.AIToolRanker.rankAndReorder(intent);
        }
        
        // Clear output if input is cleared
        if (!text) {
            output.value = '';
            convertedBadge.classList.add('hidden');
            disableAITools();
        }
    });
    
    // === CONVERT BUTTON ===
    convertBtn.addEventListener('click', generatePrompt);
    
    // === RESET BUTTON ===
    resetBtn.addEventListener('click', resetEverything);
    
    // === AI TOOL BUTTONS ===
    setupAIToolButtons();
    
    // === EXPAND BUTTONS ===
    setupExpandButtons();
}

function updateIntentChips(text) {
    const intentRow = document.getElementById('intentRow');
    const intentScroll = document.getElementById('intentScroll');
    
    if (!text) {
        intentRow.classList.add('hidden');
        intentScroll.innerHTML = '';
        return;
    }
    
    // Use your intent detection
    const intent = detectIntentAttributes(text);
    const chips = [];
    
    // Add task type chip
    if (intent.taskType && intent.taskType !== 'general') {
        chips.push(getChipIcon(intent.taskType) + ' ' + intent.taskType);
    }
    
    // Add tone chip
    if (intent.tone && intent.tone !== 'neutral') {
        chips.push('🎭 ' + intent.tone);
    }
    
    // Add urgency chip
    if (intent.urgency && intent.urgency !== 'normal') {
        chips.push('⏰ ' + intent.urgency);
    }
    
    // Add format chip
    if (intent.format && intent.format !== 'free') {
        chips.push('📄 ' + intent.format);
    }
    
    // Update UI
    if (chips.length > 0) {
        intentScroll.innerHTML = chips.map(chip => 
            `<span class="intent-chip">${chip}</span>`
        ).join('');
        intentRow.classList.remove('hidden');
    } else {
        intentRow.classList.add('hidden');
        intentScroll.innerHTML = '';
    }
}

function getChipIcon(taskType) {
    const icons = {
        'email': '📧',
        'code': '💻',
        'analysis': '📊',
        'education': '🎓',
        'writing': '📝',
        'business': '💼',
        'creative': '🎨',
        'research': '🔍',
        'fitness': '💪'
    };
    return icons[taskType] || '✨';
}

function generatePrompt() {
    const requirement = document.getElementById('requirement');
    const output = document.getElementById('output');
    const convertBtn = document.getElementById('convertBtn');
    const convertedBadge = document.getElementById('convertedBadge');
    
    const text = requirement.value.trim();
    if (!text) return;
    
    // Show loading state
    const originalText = convertBtn.innerHTML;
    convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
    convertBtn.disabled = true;
    
    // Your formatting logic
    const formattedPrompt = formatStructuredPrompt(text);
    
    // Simulate processing time
    setTimeout(() => {
        output.value = formattedPrompt;
        convertedBadge.classList.remove('hidden');
        convertBtn.innerHTML = originalText;
        convertBtn.disabled = false;
        
        // Enable AI tools
        enableAITools();
        
        // Update state
        isConverted = true;
        lastConvertedText = text;
        
        // Save to localStorage
        saveToHistory(text, formattedPrompt);
        
        // Show notification
        showNotification('Prompt converted successfully!');
    }, 800);
}

function formatStructuredPrompt(text) {
    // Your existing formatting logic
    const intent = detectIntentAttributes(text);
    
    let prompt = `# Prompt Structure\n\n`;
    prompt += `## Objective\n${text}\n\n`;
    
    prompt += `## Context\n`;
    if (intent.tone && intent.tone !== 'neutral') {
        prompt += `- Tone: ${intent.tone}\n`;
    }
    if (intent.audience && intent.audience !== 'general') {
        prompt += `- Audience: ${intent.audience}\n`;
    }
    if (intent.urgency && intent.urgency !== 'normal') {
        prompt += `- Urgency: ${intent.urgency}\n`;
    }
    
    prompt += `\n## Requirements\n`;
    
    switch(intent.taskType) {
        case 'email':
            prompt += `- Professional email format\n`;
            prompt += `- Clear subject line\n`;
            prompt += `- Appropriate greeting and closing\n`;
            prompt += `- Concise but complete message\n`;
            break;
        case 'code':
            prompt += `- Clean, readable code\n`;
            prompt += `- Proper comments and documentation\n`;
            prompt += `- Error handling\n`;
            prompt += `- Follow best practices\n`;
            break;
        case 'analysis':
            prompt += `- Data-driven insights\n`;
            prompt += `- Clear structure\n`;
            prompt += `- Evidence-based conclusions\n`;
            prompt += `- Actionable recommendations\n`;
            break;
        default:
            prompt += `- Professional tone\n`;
            prompt += `- Clear structure\n`;
            prompt += `- Complete response\n`;
            prompt += `- High quality output\n`;
    }
    
    prompt += `\n## Instructions\n`;
    prompt += `1. Address the objective directly\n`;
    prompt += `2. Consider all requirements\n`;
    prompt += `3. Provide complete response\n`;
    prompt += `4. Maintain appropriate tone\n`;
    prompt += `5. Ensure accuracy and quality\n`;
    
    return prompt;
}

function resetEverything() {
    if (confirm('Are you sure you want to reset everything?')) {
        const requirement = document.getElementById('requirement');
        const output = document.getElementById('output');
        const convertBtn = document.getElementById('convertBtn');
        const convertedBadge = document.getElementById('convertedBadge');
        const intentRow = document.getElementById('intentRow');
        
        // Clear everything
        requirement.value = '';
        output.value = '';
        intentRow.classList.add('hidden');
        document.getElementById('intentScroll').innerHTML = '';
        
        // Reset UI
        convertBtn.disabled = true;
        convertedBadge.classList.add('hidden');
        
        // Disable AI tools
        disableAITools();
        
        // Reset AI tool ranking
        if (window.AIToolRanker && window.AIToolRanker.resetToDefault) {
            window.AIToolRanker.resetToDefault();
        }
        
        // Reset state
        isConverted = false;
        lastConvertedText = '';
        
        showNotification('Everything has been reset');
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
                const output = document.getElementById('output');
                const prompt = output.value.trim();
                
                if (!prompt) {
                    showNotification('Please generate a prompt first!');
                    return;
                }
                
                // Copy to clipboard
                navigator.clipboard.writeText(prompt).then(() => {
                    // Show copied state
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = `<span class="tool-icon">✓</span><span class="tool-name">Copied!</span>`;
                    btn.style.background = '#10b981';
                    btn.style.borderColor = '#10b981';
                    
                    showNotification('Prompt copied! Opening AI tool...');
                    
                    // Reset button after 1.5s
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.style.background = '';
                        btn.style.borderColor = '';
                    }, 1500);
                    
                    // Open tool
                    setTimeout(() => {
                        window.open(tools[id], '_blank');
                    }, 500);
                    
                }).catch(err => {
                    console.error('Copy failed:', err);
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

function setupExpandButtons() {
    // You can implement expand functionality here
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

function saveToHistory(requirement, prompt) {
    // Your history saving logic
    const history = JSON.parse(localStorage.getItem('promptHistory') || '[]');
    history.unshift({
        id: Date.now(),
        requirement,
        prompt,
        date: new Date().toISOString()
    });
    
    // Keep only last 20 items
    const limitedHistory = history.slice(0, 20);
    localStorage.setItem('promptHistory', JSON.stringify(limitedHistory));
}

function loadSavedData() {
    // Load history if needed
    const history = localStorage.getItem('promptHistory');
    if (history) {
        console.log('Loaded history:', JSON.parse(history).length, 'items');
    }
}

// Make functions available globally
window.generatePrompt = generatePrompt;
window.resetEverything = resetEverything;
