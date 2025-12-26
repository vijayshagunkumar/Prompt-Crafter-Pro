// app.js – PromptCraft Application Logic

// DOM Elements
const userInput = document.getElementById('userInput');
const outputCard = document.getElementById('outputCard');
const aiCard = document.getElementById('aiCard');
const outputArea = document.getElementById('outputArea');
const charCount = document.getElementById('charCount');
const advancedSection = document.getElementById('advancedSection');
const advancedToggle = document.getElementById('advancedToggle');
const toggleIcon = document.getElementById('toggleIcon');
const otherTools = document.getElementById('otherTools');
const otherToolsToggle = document.getElementById('otherToolsToggle');
const toolsIcon = document.getElementById('toolsIcon');
const bestAIButton = document.getElementById('bestAIButton');
const aiExplanation = document.getElementById('aiExplanation');
const copyBtn = document.getElementById('copyBtn');
const useInAI = document.getElementById('useInAI');
const prepareBtn = document.getElementById('prepareBtn');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const inputError = document.getElementById('inputError');
const autoConvertCheckbox = document.getElementById('autoConvert');
const syntaxToggle = document.getElementById('syntaxToggle');
const textareaExpandBtn = document.getElementById('textareaExpandBtn');
const outputExpandBtn = document.getElementById('outputExpandBtn');
const closeMaximizeBtn = document.getElementById('closeMaximizeBtn');
const convertedBadge = document.getElementById('convertedBadge');
const historyList = document.getElementById('historyList');

// State
let showAdvanced = false;
let showOtherTools = false;
let currentIntent = 'detailed';
let currentBestModel = 'chatgpt';
let autoConvertTimer = null;
let syntaxHighlightEnabled = false;
let lastInput = '';
let isTextareaMaximized = false;
let isOutputMaximized = false;
let history = [];

// Model Configuration
const MODEL_CONFIG = {
    chatgpt: {
        name: 'ChatGPT',
        icon: 'fab fa-openai',
        color: '#10a37f',
        strengths: ['creative writing', 'conversation', 'general tasks', 'email'],
        explanation: 'Best for creative and conversational tasks',
        confidence: 'High match'
    },
    claude: {
        name: 'Claude 3.5',
        icon: 'fas fa-brain',
        color: '#DE7356',
        strengths: ['code', 'long reasoning', 'document analysis', 'structured'],
        explanation: 'Best for coding and complex reasoning',
        confidence: 'High match'
    },
    gemini: {
        name: 'Gemini Pro',
        icon: 'fas fa-google',
        color: '#4796E3',
        strengths: ['analysis', 'research', 'data', 'reasoning'],
        explanation: 'Best for analysis and data-driven tasks',
        confidence: 'High match'
    },
    deepseek: {
        name: 'DeepSeek',
        icon: 'fas fa-search',
        color: '#3b82f6',
        strengths: ['technical', 'research', 'academic', 'detailed'],
        explanation: 'Best for technical and research tasks',
        confidence: 'High match'
    },
    perplexity: {
        name: 'Perplexity',
        icon: 'fas fa-compass',
        color: '#20808D',
        strengths: ['research', 'citations', 'current events', 'web search'],
        explanation: 'Best for research with citations',
        confidence: 'High match'
    },
    copilot: {
        name: 'Copilot',
        icon: 'fab fa-microsoft',
        color: '#199FD7',
        strengths: ['code', 'development', 'assistance', 'integration'],
        explanation: 'Best for developers and code assistance',
        confidence: 'High match'
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupEventListeners();
    initializeExamples();
    updateCharCount();
    
    // Show welcome example if first visit
    if (!localStorage.getItem('promptcraft_visited')) {
        setTimeout(() => {
            insertExample('email');
            localStorage.setItem('promptcraft_visited', 'true');
        }, 500);
    }
});

// Load from localStorage
function loadFromLocalStorage() {
    const savedInput = localStorage.getItem('promptcraft_input');
    const savedIntent = localStorage.getItem('promptcraft_intent');
    const savedHistory = localStorage.getItem('promptcraft_history');
    
    if (savedInput) {
        userInput.value = savedInput;
    }
    
    if (savedIntent) {
        currentIntent = savedIntent;
        updateIntentChips(savedIntent);
    }
    
    if (savedHistory) {
        try {
            history = JSON.parse(savedHistory);
            updateHistoryList();
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }
}

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('promptcraft_input', userInput.value);
    localStorage.setItem('promptcraft_intent', currentIntent);
    localStorage.setItem('promptcraft_history', JSON.stringify(history));
}

// Setup event listeners
function setupEventListeners() {
    // User input events
    userInput.addEventListener('input', handleInput);
    
    // Intent chips
    document.querySelectorAll('.intent-chip').forEach(button => {
        button.addEventListener('click', function() {
            currentIntent = this.dataset.intent;
            updateIntentChips(currentIntent);
            saveToLocalStorage();
        });
    });
    
    // Auto-convert checkbox
    autoConvertCheckbox.addEventListener('change', handleAutoConvertChange);
    
    // Copy button
    copyBtn.addEventListener('click', copyPrompt);
    
    // Use in AI button
    useInAI.addEventListener('click', () => {
        bestAIButton.click();
    });
    
    // Best AI button
    bestAIButton.addEventListener('click', openBestAI);
    
    // Other AI tools
    document.querySelectorAll('#otherTools .launch-btn').forEach(button => {
        button.addEventListener('click', function() {
            openOtherAI(this.dataset.model);
        });
    });
    
    // Escape key for closing maximized views
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && (isTextareaMaximized || isOutputMaximized)) {
            closeAllMaximized();
        }
    });
    
    // Close maximize button
    closeMaximizeBtn.addEventListener('click', closeAllMaximized);
}

// Handle user input
function handleInput() {
    updateCharCount();
    saveToLocalStorage();
    
    // Auto-convert logic
    if (autoConvertCheckbox.checked && userInput.value.length > 10) {
        if (autoConvertTimer) clearTimeout(autoConvertTimer);
        autoConvertTimer = setTimeout(() => {
            if (userInput.value === lastInput && userInput.value.trim().length > 10) {
                preparePrompt();
                showConvertedBadge();
            }
        }, 3000);
        lastInput = userInput.value;
    }
}

// Update character count
function updateCharCount() {
    const count = userInput.value.length;
    charCount.textContent = count;
}

// Clear error
function clearError() {
    inputError.classList.add('hidden');
}

// Show converted badge
function showConvertedBadge() {
    convertedBadge.classList.remove('hidden');
    setTimeout(() => {
        convertedBadge.classList.add('hidden');
    }, 3000);
}

// Toggle textarea maximize/minimize
function toggleTextareaMaximize() {
    isTextareaMaximized = !isTextareaMaximized;
    
    if (isTextareaMaximized) {
        userInput.classList.add('maximized');
        textareaExpandBtn.innerHTML = '<i class="fas fa-compress"></i>';
        closeMaximizeBtn.classList.add('active');
        document.body.classList.add('no-scroll');
        setTimeout(() => userInput.focus(), 10);
    } else {
        userInput.classList.remove('maximized');
        textareaExpandBtn.innerHTML = '<i class="fas fa-expand"></i>';
        if (!isOutputMaximized) {
            closeMaximizeBtn.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    }
}

// Toggle output maximize/minimize
function toggleOutputMaximize() {
    isOutputMaximized = !isOutputMaximized;
    
    if (isOutputMaximized) {
        outputArea.classList.add('maximized');
        outputExpandBtn.innerHTML = '<i class="fas fa-compress"></i>';
        closeMaximizeBtn.classList.add('active');
        document.body.classList.add('no-scroll');
    } else {
        outputArea.classList.remove('maximized');
        outputExpandBtn.innerHTML = '<i class="fas fa-expand"></i>';
        if (!isTextareaMaximized) {
            closeMaximizeBtn.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    }
}

// Close all maximized views
function closeAllMaximized() {
    if (isTextareaMaximized) {
        userInput.classList.remove('maximized');
        textareaExpandBtn.innerHTML = '<i class="fas fa-expand"></i>';
        isTextareaMaximized = false;
    }
    
    if (isOutputMaximized) {
        outputArea.classList.remove('maximized');
        outputExpandBtn.innerHTML = '<i class="fas fa-expand"></i>';
        isOutputMaximized = false;
    }
    
    closeMaximizeBtn.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

// Update intent chips
function updateIntentChips(intent) {
    document.querySelectorAll('.intent-chip').forEach(btn => {
        if (btn.dataset.intent === intent) {
            btn.classList.add('active');
            btn.style.background = 'var(--primary)';
            btn.style.color = 'var(--text-on-primary)';
            btn.setAttribute('aria-pressed', 'true');
        } else {
            btn.classList.remove('active');
            btn.style.background = 'rgba(var(--primary-rgb), 0.1)';
            btn.style.color = 'var(--primary)';
            btn.setAttribute('aria-pressed', 'false');
        }
    });
}

// Insert example
function insertExample(type) {
    userInput.value = getExampleText(type);
    updateCharCount();
    clearError();
    saveToLocalStorage();
    
    const intentMap = {
        email: 'detailed',
        code: 'analytical',
        analysis: 'analytical',
        creative: 'creative',
        research: 'analytical',
        summary: 'concise'
    };
    
    if (intentMap[type]) {
        currentIntent = intentMap[type];
        updateIntentChips(currentIntent);
        saveToLocalStorage();
    }
}

// Get example text
function getExampleText(type) {
    const examples = {
        email: "Write a professional email to decline a meeting invitation while maintaining good relationships. The tone should be polite but firm. Include:\n- Appropriate greeting\n- Clear but gentle decline\n- Reason for unavailability\n- Alternative suggestion\n- Professional closing",
        
        code: "Create a Python function to calculate Fibonacci sequence with memoization.\n\nRequirements:\n- Use type hints\n- Include docstring with examples\n- Add error handling for negative numbers\n- Implement memoization with dictionary\n- Include performance optimization",
        
        analysis: "Analyze quarterly sales data and identify top 3 performing products and regions.\n\nPlease provide:\n- Key metrics comparison\n- Trend analysis\n- Growth opportunities\n- Recommendations for improvement\n- Visual data presentation suggestions",
        
        creative: "Write a short story about a robot discovering human emotions for the first time.\n\nElements to include:\n- Character development\n- Emotional arc\n- Sensory descriptions\n- Dialogue\n- Theme about humanity and technology",
        
        research: "Research the impact of artificial intelligence on job markets in the next 5 years.\n\nInclude:\n- Current trends\n- Predicted changes\n- Affected industries\n- Skills needed\n- Policy recommendations",
        
        summary: "Summarize the key findings of the latest climate change report in 3 bullet points:\n1. \n2. \n3. \n\nKeep it concise and actionable."
    };
    
    return examples[type] || examples.email;
}

// Initialize example chips
function initializeExamples() {
    const examples = [
        { type: 'email', icon: 'fas fa-envelope', label: 'Email' },
        { type: 'code', icon: 'fas fa-code', label: 'Code' },
        { type: 'analysis', icon: 'fas fa-chart-bar', label: 'Analysis' },
        { type: 'creative', icon: 'fas fa-palette', label: 'Creative' },
        { type: 'research', icon: 'fas fa-search', label: 'Research' },
        { type: 'summary', icon: 'fas fa-file-alt', label: 'Summary' }
    ];
    
    // Example chips are already in HTML, just add click handlers
}

// Toggle advanced section
function toggleAdvanced() {
    showAdvanced = !showAdvanced;
    advancedToggle.setAttribute('aria-expanded', showAdvanced);
    
    if (showAdvanced) {
        advancedSection.classList.add('expanded');
        toggleIcon.classList.remove('fa-chevron-down');
        toggleIcon.classList.add('fa-chevron-up');
    } else {
        advancedSection.classList.remove('expanded');
        toggleIcon.classList.remove('fa-chevron-up');
        toggleIcon.classList.add('fa-chevron-down');
    }
}

// Toggle other tools section
function toggleOtherTools() {
    showOtherTools = !showOtherTools;
    otherToolsToggle.setAttribute('aria-expanded', showOtherTools);
    
    if (showOtherTools) {
        otherTools.classList.add('expanded');
        toolsIcon.classList.remove('fa-chevron-down');
        toolsIcon.classList.add('fa-chevron-up');
    } else {
        otherTools.classList.remove('expanded');
        toolsIcon.classList.remove('fa-chevron-up');
        toolsIcon.classList.add('fa-chevron-down');
    }
}

// Handle auto-convert change
function handleAutoConvertChange() {
    if (autoConvertTimer) {
        clearTimeout(autoConvertTimer);
        autoConvertTimer = null;
    }
}

// Toggle syntax highlighting
function toggleSyntaxHighlight() {
    syntaxHighlightEnabled = !syntaxHighlightEnabled;
    
    if (syntaxHighlightEnabled) {
        syntaxToggle.style.color = 'var(--primary)';
        applySyntaxHighlighting();
    } else {
        syntaxToggle.style.color = 'var(--text-secondary)';
        removeSyntaxHighlighting();
    }
}

// Apply syntax highlighting
function applySyntaxHighlighting() {
    const text = outputArea.textContent;
    if (!text) return;
    
    let highlighted = text
        .replace(/def\s+\w+/g, '<span class="syntax-keyword">$&</span>')
        .replace(/import\s+\w+/g, '<span class="syntax-keyword">$&</span>')
        .replace(/class\s+\w+/g, '<span class="syntax-keyword">$&</span>')
        .replace(/\bif\b|\belse\b|\bfor\b|\bwhile\b|\breturn\b/g, '<span class="syntax-keyword">$&</span>')
        .replace(/\/\/.*$/gm, '<span class="syntax-comment">$&</span>')
        .replace(/#.*$/gm, '<span class="syntax-comment">$&</span>')
        .replace(/"""[\s\S]*?"""/g, '<span class="syntax-string">$&</span>')
        .replace(/"([^"]*)"/g, '<span class="syntax-string">"$1"</span>')
        .replace(/'([^']*)'/g, '<span class="syntax-string">\'$1\'</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="syntax-number">$1</span>')
        .replace(/\b(true|false|null|undefined)\b/g, '<span class="syntax-literal">$&</span>');
    
    outputArea.innerHTML = highlighted;
}

// Remove syntax highlighting
function removeSyntaxHighlighting() {
    outputArea.innerHTML = outputArea.textContent.replace(/<[^>]*>/g, '');
}

// Determine best AI model
function determineBestModel(input) {
    const lower = input.toLowerCase();
    const scores = {
        chatgpt: 0,
        claude: 0,
        gemini: 0,
        deepseek: 0,
        perplexity: 0,
        copilot: 0
    };
    
    // Score based on keywords
    const keywordPatterns = {
        chatgpt: ['creative', 'story', 'write', 'email', 'conversation', 'content', 'marketing'],
        claude: ['code', 'python', 'javascript', 'function', 'algorithm', 'technical', 'document'],
        gemini: ['analyze', 'data', 'research', 'stat', 'report', 'business', 'trend'],
        deepseek: ['technical', 'research', 'academic', 'detailed', 'explain', 'understanding'],
        perplexity: ['research', 'citation', 'current', 'news', 'web', 'search', 'latest'],
        copilot: ['code', 'debug', 'develop', 'programming', 'software', 'github', 'vs code']
    };
    
    for (const [model, keywords] of Object.entries(keywordPatterns)) {
        keywords.forEach(keyword => {
            if (lower.includes(keyword)) {
                scores[model] += 2;
            }
        });
    }
    
    // Additional scoring based on length and complexity
    if (lower.length > 500) {
        scores.claude += 3; // Good for long content
        scores.deepseek += 2;
    }
    
    if (lower.includes('?')) {
        scores.perplexity += 2; // Good for questions
    }
    
    if (lower.split('\n').length > 10) {
        scores.claude += 2; // Good for structured content
    }
    
    // Find best model
    let bestModel = 'chatgpt';
    let highestScore = 0;
    
    for (const [model, score] of Object.entries(scores)) {
        if (score > highestScore) {
            highestScore = score;
            bestModel = model;
        }
    }
    
    return bestModel;
}

// Get routing explanation
function getRoutingExplanation(input, modelKey) {
    const model = MODEL_CONFIG[modelKey];
    const lower = input.toLowerCase();
    
    if (modelKey === 'claude' && (lower.includes('code') || lower.includes('function'))) {
        return 'Best for coding and technical tasks';
    } else if (modelKey === 'gemini' && (lower.includes('analyze') || lower.includes('data'))) {
        return 'Best for analysis and data-driven tasks';
    } else if (modelKey === 'chatgpt' && (lower.includes('creative') || lower.includes('email'))) {
        return 'Best for creative writing and communication';
    } else if (modelKey === 'deepseek' && (lower.includes('research') || lower.includes('technical'))) {
        return 'Best for technical and research tasks';
    } else if (modelKey === 'perplexity' && (lower.includes('research') || lower.includes('?'))) {
        return 'Best for research with citations';
    } else if (modelKey === 'copilot' && lower.includes('code')) {
        return 'Best for developers and code assistance';
    }
    
    return model.explanation;
}

// Prepare prompt
async function preparePrompt() {
    const input = userInput.value.trim();
    
    // Clear any existing timer
    if (autoConvertTimer) {
        clearTimeout(autoConvertTimer);
        autoConvertTimer = null;
    }
    
    // Validate input
    if (!input) {
        inputError.classList.remove('hidden');
        inputError.setAttribute('role', 'alert');
        userInput.focus();
        return;
    }
    
    // Show loading state
    prepareBtn.disabled = true;
    btnText.textContent = 'Preparing...';
    btnLoading.classList.remove('hidden');
    
    // Determine best AI model
    currentBestModel = determineBestModel(input);
    const bestModel = MODEL_CONFIG[currentBestModel];
    const explanation = getRoutingExplanation(input, currentBestModel);
    
    // Simulate API call with timeout
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    try {
        // Generate prompt based on input and intent
        const prompt = generatePrompt(input, currentIntent);
        
        // Update UI
        outputArea.textContent = prompt;
        
        if (syntaxHighlightEnabled) {
            applySyntaxHighlighting();
        }
        
        // Update best AI button
        updateBestAIButton(bestModel, explanation);
        
        // Show output and AI cards
        showResults();
        
        // Add to history
        addToHistory(input, prompt);
        
    } catch (error) {
        console.error('Error preparing prompt:', error);
        outputArea.textContent = 'Error generating prompt. Please try again.';
    } finally {
        // Reset loading state
        prepareBtn.disabled = false;
        btnText.textContent = 'Prepare Prompt';
        btnLoading.classList.add('hidden');
    }
}

// Generate prompt
function generatePrompt(input, intent) {
    const intentTemplates = {
        concise: `Provide a concise response to: ${input}\n\nFormat: Bullet points or short paragraphs.`,
        detailed: `You are an expert assistant. Provide a detailed response to: ${input}\n\nInclude:\n1. Clear explanation\n2. Step-by-step guidance\n3. Best practices\n4. Common pitfalls to avoid`,
        creative: `You are a creative professional. Respond to: ${input}\n\nFocus on:\n- Original ideas\n- Engaging content\n- Emotional impact\n- Memorable delivery`,
        analytical: `As an analytical expert, analyze: ${input}\n\nProvide:\n- Data-driven insights\n- Logical reasoning\n- Evidence-based conclusions\n- Actionable recommendations`
    };
    
    const template = intentTemplates[intent] || intentTemplates.detailed;
    
    return `Based on your request: "${input}"

${template}

Please ensure your response is:
✓ Well-structured
✓ Easy to understand
✓ Practical and actionable
✓ Tailored to the specific context

Response format: Use clear headings, bullet points, and examples where appropriate.`;
}

// Update best AI button
function updateBestAIButton(model, explanation) {
    bestAIButton.innerHTML = `
        <div class="launch-icon" style="background: ${model.color}20; border-color: ${model.color}40;">
            <i class="${model.icon}" style="color: ${model.color};"></i>
        </div>
        <div class="launch-text">
            <div class="launch-name">${model.name}</div>
            <div class="launch-sub">${explanation}</div>
        </div>
        <div class="best-match-tag">Best Match</div>
    `;
    
    aiExplanation.innerHTML = `
        <i class="fas fa-info-circle"></i>
        ${explanation}
    `;
    
    // Update button classes
    bestAIButton.className = `launch-btn best-match launch-${currentBestModel}`;
}

// Show results
function showResults() {
    // Show output card
    outputCard.classList.remove('hidden');
    outputCard.classList.add('animate-slideUp');
    
    // Show AI card after delay
    setTimeout(() => {
        aiCard.classList.remove('hidden');
        aiCard.classList.add('animate-slideUp');
    }, 300);
}

// Copy prompt to clipboard
async function copyPrompt() {
    const text = outputArea.textContent;
    if (!text || text.includes('Your optimized prompt will appear here')) {
        return;
    }
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Show success feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard. Please try again.');
    }
}

// Open best AI
function openBestAI() {
    const model = MODEL_CONFIG[currentBestModel];
    const prompt = outputArea.textContent;
    
    // In a real app, this would open the AI tool with the prompt
    // For now, show a mock alert
    alert(`Opening ${model.name} with your prepared prompt...\n\nThis would typically open the AI tool in a new tab/window with the prompt pre-filled.`);
    
    // Log action
    console.log('Opening', model.name, 'with prompt:', prompt.substring(0, 100) + '...');
}

// Open other AI
function openOtherAI(modelKey) {
    const model = MODEL_CONFIG[modelKey];
    const prompt = outputArea.textContent;
    
    alert(`Opening ${model.name} with your prepared prompt...\n\nYou can manually choose any AI tool.`);
    
    // Log action
    console.log('Opening alternative:', model.name, 'with prompt:', prompt.substring(0, 100) + '...');
}

// Add to history
function addToHistory(input, prompt) {
    const historyItem = {
        id: Date.now(),
        input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
        prompt: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: currentBestModel
    };
    
    history.unshift(historyItem);
    
    // Keep only last 10 items
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    
    updateHistoryList();
    saveToLocalStorage();
}

// Update history list
function updateHistoryList() {
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-clock"></i>
                <p>No recent history</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item" onclick="loadFromHistory('${item.id}')">
            <div class="history-item-title">${item.input}</div>
            <div class="history-item-meta">
                <i class="fas fa-${getModelIcon(item.model)}"></i>
                ${item.timestamp} • ${MODEL_CONFIG[item.model]?.name || 'Unknown'}
            </div>
        </div>
    `).join('');
}

// Get model icon
function getModelIcon(modelKey) {
    const icons = {
        chatgpt: 'robot',
        claude: 'brain',
        gemini: 'google',
        deepseek: 'search',
        perplexity: 'compass',
        copilot: 'microsoft'
    };
    
    return icons[modelKey] || 'robot';
}

// Load from history
function loadFromHistory(id) {
    const item = history.find(h => h.id === parseInt(id));
    if (item) {
        userInput.value = item.input;
        updateCharCount();
        
        // Find the original full prompt if available
        const fullItem = history.find(h => h.id === parseInt(id));
        if (fullItem && fullItem.prompt) {
            outputArea.textContent = fullItem.prompt;
            if (syntaxHighlightEnabled) {
                applySyntaxHighlighting();
            }
            
            // Update best AI button
            const model = MODEL_CONFIG[item.model];
            const explanation = getRoutingExplanation(item.input, item.model);
            updateBestAIButton(model, explanation);
            
            // Show cards
            showResults();
        }
    }
}

// Clear history
function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        history = [];
        updateHistoryList();
        saveToLocalStorage();
    }
}

// Read output aloud
function readOutput() {
    const text = outputArea.textContent;
    if (!text || text.includes('Your optimized prompt will appear here')) {
        return;
    }
    
    if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = 'en-US';
        speech.rate = 1;
        speech.pitch = 1;
        speech.volume = 1;
        
        window.speechSynthesis.speak(speech);
    } else {
        alert('Text-to-speech is not supported in your browser.');
    }
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('promptcraft_theme', newTheme);
    
    // Update button icon
    const icon = document.querySelector('.theme-toggle-btn i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Toggle settings (placeholder)
function toggleSettings() {
    alert('Settings panel would open here.\n\nAvailable settings:\n• API key configuration\n• Default AI preferences\n• Output formatting options\n• Export settings');
}

// Check for saved theme
const savedTheme = localStorage.getItem('promptcraft_theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update button icon
    const icon = document.querySelector('.theme-toggle-btn i');
    if (icon) {
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Add CSS for syntax highlighting
const style = document.createElement('style');
style.textContent = `
    .syntax-keyword { color: var(--primary); font-weight: 600; }
    .syntax-string { color: var(--accent); }
    .syntax-comment { color: var(--text-muted); font-style: italic; }
    .syntax-number { color: var(--secondary); font-weight: 600; }
    .syntax-literal { color: var(--warning); font-weight: 600; }
    
    .copied {
        background: var(--success) !important;
        color: var(--text-on-primary) !important;
        border-color: var(--success) !important;
    }
`;
document.head.appendChild(style);
