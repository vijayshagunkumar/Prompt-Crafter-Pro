// Main Application - Your Logic with Clean Implementation
import { detectIntentAttributes } from './features/intent.js';

// App state
let isConverted = false;
let lastConvertedText = "";
let isInputExpanded = false;
let isOutputExpanded = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('PromptCraft initializing...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize AI tool ranking
    initializeAIToolRanking();
    
    // Show initial ranking
    updateAIToolRanking();
});

function setupEventListeners() {
    // Get elements
    const requirement = document.getElementById('requirement');
    const output = document.getElementById('output');
    const convertBtn = document.getElementById('convertBtn');
    const resetBtn = document.getElementById('resetBtn');
    const convertedBadge = document.getElementById('convertedBadge');
    const expandInputBtn = document.getElementById('expandInputBtn');
    const expandOutputBtn = document.getElementById('expandOutputBtn');
    const expandOverlay = document.getElementById('expandOverlay');
    
    // Convert button is ENABLED by default since we have example text
    convertBtn.disabled = false;
    
    // === REQUIREMENT INPUT ===
    requirement.addEventListener('input', function() {
        const text = this.value.trim();
        
        // Enable/disable convert button
        convertBtn.disabled = !text;
        
        // Update intent chips
        updateIntentChips(text);
        
        // Update AI tool ranking
        updateAIToolRanking();
        
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
    
    // === EXPAND BUTTONS ===
    expandInputBtn.addEventListener('click', () => toggleExpand('input'));
    expandOutputBtn.addEventListener('click', () => toggleExpand('output'));
    
    // Close expanded mode when clicking overlay
    expandOverlay.addEventListener('click', () => {
        if (isInputExpanded) toggleExpand('input');
        if (isOutputExpanded) toggleExpand('output');
    });
    
    // === AI TOOL BUTTONS ===
    setupAIToolButtons();
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
    
    // Add constraints chips
    if (intent.constraints && intent.constraints.length > 0) {
        intent.constraints.forEach(constraint => {
            if (constraint !== 'general') {
                chips.push('🔧 ' + constraint);
            }
        });
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

async function generatePrompt() {
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
    
    try {
        // REAL API CALL to your Vercel endpoint
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: text })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Use OpenAI's response
        output.value = data.result;
        convertedBadge.classList.remove('hidden');
        
        // Enable AI tools
        enableAITools();
        
        // Update state
        isConverted = true;
        lastConvertedText = text;
        
        // Save to localStorage
        saveToHistory(text, data.result);
        
        // Show notification
        showNotification('✅ Prompt generated with OpenAI!');
        
    } catch (error) {
        console.error('API Error:', error);
        
        // Fallback to local formatting if API fails
        const formattedPrompt = formatStructuredPrompt(text);
        output.value = formattedPrompt;
        convertedBadge.classList.remove('hidden');
        enableAITools();
        
        showNotification(`⚠️ Using local formatting (API: ${error.message})`);
    } finally {
        // Reset button
        convertBtn.innerHTML = originalText;
        convertBtn.disabled = false;
    }
}

function formatStructuredPrompt(text) {
    // Use your intent detection for better formatting
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
    if (intent.persona && intent.persona !== 'neutral') {
        prompt += `- Persona: ${intent.persona}\n`;
    }
    
    prompt += `\n## Requirements\n`;
    
    // Task-specific requirements
    switch(intent.taskType) {
        case 'email':
            prompt += `- Professional email format with subject line\n`;
            prompt += `- Appropriate greeting and professional closing\n`;
            prompt += `- Clear, concise message with specific details\n`;
            prompt += `- Polite tone and proper formatting\n`;
            break;
        case 'code':
            prompt += `- Clean, readable code with proper indentation\n`;
            prompt += `- Comprehensive comments and documentation\n`;
            prompt += `- Error handling and edge case consideration\n`;
            prompt += `- Follow language-specific best practices\n`;
            break;
        case 'analysis':
            prompt += `- Data-driven insights with evidence\n`;
            prompt += `- Clear structure: introduction, findings, conclusions\n`;
            prompt += `- Visual representations if applicable\n`;
            prompt += `- Actionable recommendations with reasoning\n`;
            break;
        case 'writing':
            prompt += `- Engaging opening and strong conclusion\n`;
            prompt += `- Logical flow with transitions\n`;
            prompt += `- Appropriate length for the medium\n`;
            prompt += `- Target audience consideration\n`;
            break;
        default:
            prompt += `- Professional and clear communication\n`;
            prompt += `- Well-structured response\n`;
            prompt += `- Complete and comprehensive answer\n`;
            prompt += `- High quality output\n`;
    }
    
    // Add constraints if any
    if (intent.constraints && intent.constraints.length > 0) {
        prompt += `\n## Constraints\n`;
        intent.constraints.forEach(constraint => {
            if (constraint !== 'general') {
                prompt += `- ${constraint.charAt(0).toUpperCase() + constraint.slice(1)}\n`;
            }
        });
    }
    
    prompt += `\n## Instructions\n`;
    prompt += `1. Address the objective directly and completely\n`;
    prompt += `2. Consider all context and requirements\n`;
    prompt += `3. Provide ready-to-use output\n`;
    prompt += `4. Maintain specified tone and format\n`;
    prompt += `5. Ensure accuracy, quality, and professionalism\n`;
    
    prompt += `\n## Expected Output\n`;
    prompt += `A complete, high-quality response that can be used immediately.`;
    
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
        
        // Reset AI tool ranking to default
        resetAIToolRanking();
        
        // Reset state
        isConverted = false;
        lastConvertedText = '';
        
        showNotification('🔄 Everything has been reset');
    }
}

function toggleExpand(type) {
    const expandOverlay = document.getElementById('expandOverlay');
    const textarea = type === 'input' 
        ? document.getElementById('requirement')
        : document.getElementById('output');
    
    if (type === 'input') {
        isInputExpanded = !isInputExpanded;
    } else {
        isOutputExpanded = !isOutputExpanded;
    }
    
    if (textarea.classList.contains('textarea-expanded')) {
        // Collapse
        textarea.classList.remove('textarea-expanded');
        expandOverlay.classList.add('hidden');
    } else {
        // Expand
        textarea.classList.add('textarea-expanded');
        expandOverlay.classList.remove('hidden');
        textarea.focus();
        textarea.select();
    }
}

function initializeAIToolRanking() {
    // Your AI Tool Ranking Logic
    const AI_TOOL_PROFILES = {
        chatgpt: { name: "ChatGPT", strengths: ["general", "writing", "email", "analysis"], score: 100 },
        claude: { name: "Claude", strengths: ["writing", "analysis", "business", "detailed"], score: 95 },
        gemini: { name: "Gemini", strengths: ["research", "analysis", "education", "technical"], score: 90 },
        perplexity: { name: "Perplexity", strengths: ["research", "analysis", "brief", "facts"], score: 85 },
        deepseek: { name: "DeepSeek", strengths: ["code", "technical", "programming"], score: 80 },
        copilot: { name: "Copilot", strengths: ["code", "quick", "development"], score: 75 },
        grok: { name: "Grok", strengths: ["creative", "general", "casual", "humor"], score: 70 }
    };
    
    window.AIToolRanker = {
        rankAndReorder: function(intent) {
            const taskType = intent.taskType || 'general';
            const tools = Object.keys(AI_TOOL_PROFILES);
            
            // Calculate scores based on intent
            tools.forEach(tool => {
                const profile = AI_TOOL_PROFILES[tool];
                if (profile.strengths.includes(taskType)) {
                    profile.score = 100;
                } else if (profile.strengths.some(s => taskType.includes(s) || s.includes(taskType))) {
                    profile.score = 90;
                } else if (taskType === 'general') {
                    profile.score = profile.strengths.includes('general') ? 95 : 75;
                } else {
                    profile.score = 70;
                }
            });
            
            // Sort by score
            const sortedTools = tools.sort((a, b) => AI_TOOL_PROFILES[b].score - AI_TOOL_PROFILES[a].score);
            
            // Update UI
            updateToolScores(sortedTools);
            reorderTools(sortedTools);
            
            // Show ranking explanation
            const explanation = document.getElementById('rankingExplanation');
            if (explanation) {
                explanation.innerHTML = `<i class="fas fa-info-circle"></i> Ranked for: ${taskType} tasks`;
            }
        },
        
        resetToDefault: function() {
            const defaultOrder = ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
            resetAIToolRanking();
        }
    };
}

function updateAIToolRanking() {
    const text = document.getElementById('requirement').value.trim();
    if (!text) {
        resetAIToolRanking();
        return;
    }
    
    const intent = detectIntentAttributes(text);
    if (window.AIToolRanker) {
        window.AIToolRanker.rankAndReorder(intent);
    }
}

function updateToolScores(sortedTools) {
    const AI_TOOL_PROFILES = {
        chatgpt: { name: "ChatGPT", baseScore: 100 },
        claude: { name: "Claude", baseScore: 95 },
        gemini: { name: "Gemini", baseScore: 90 },
        perplexity: { name: "Perplexity", baseScore: 85 },
        deepseek: { name: "DeepSeek", baseScore: 80 },
        copilot: { name: "Copilot", baseScore: 75 },
        grok: { name: "Grok", baseScore: 70 }
    };
    
    // Update scores based on position
    sortedTools.forEach((tool, index) => {
        const btn = document.getElementById(`${tool}Btn`);
        if (btn) {
            const scoreElement = btn.querySelector('.tool-score');
            if (scoreElement) {
                // Calculate dynamic score based on position
                const score = 100 - (index * 4);
                scoreElement.textContent = `${score}%`;
                
                // Mark best match
                if (index === 0) {
                    btn.classList.add('best-match');
                } else {
                    btn.classList.remove('best-match');
                }
            }
        }
    });
}

function reorderTools(sortedTools) {
    const container = document.getElementById('aiToolsContainer');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Add tools in new order
    sortedTools.forEach(tool => {
        const btn = document.getElementById(`${tool}Btn`);
        if (btn) {
            container.appendChild(btn);
        }
    });
}

function resetAIToolRanking() {
    const defaultOrder = ["chatgpt", "claude", "gemini", "perplexity", "deepseek", "copilot", "grok"];
    const container = document.getElementById('aiToolsContainer');
    
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Add tools in default order
    defaultOrder.forEach(tool => {
        const btn = document.getElementById(`${tool}Btn`);
        if (btn) {
            btn.classList.remove('best-match');
            if (tool === 'chatgpt') {
                btn.classList.add('best-match');
            }
            const scoreElement = btn.querySelector('.tool-score');
            if (scoreElement) {
                const scores = { chatgpt: 100, claude: 95, gemini: 90, perplexity: 85, deepseek: 80, copilot: 75, grok: 70 };
                scoreElement.textContent = `${scores[tool]}%`;
            }
            container.appendChild(btn);
        }
    });
    
    // Reset explanation
    const explanation = document.getElementById('rankingExplanation');
    if (explanation) {
        explanation.innerHTML = `<i class="fas fa-info-circle"></i> Tools are ranked based on your input intent`;
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
                    const toolName = btn.querySelector('.tool-name').textContent;
                    btn.innerHTML = `<span class="tool-icon">✓</span><span class="tool-name">Copied!</span>`;
                    btn.style.background = '#10b981';
                    btn.style.borderColor = '#10b981';
                    
                    showNotification(`📋 Copied! Opening ${toolName}...`);
                    
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
                    showNotification('Failed to copy to clipboard');
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

function saveToHistory(requirement, prompt) {
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

function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

// Make functions available globally
window.generatePrompt = generatePrompt;
window.resetEverything = resetEverything;
window.updateAIToolRanking = updateAIToolRanking;
