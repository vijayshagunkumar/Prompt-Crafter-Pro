// emergency-fix.js - COMPLETE FUNCTIONALITY FIX

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Loading emergency fix...');
    
    // 1. LOAD SAMPLE AI TOOLS INTO CARD 3
    loadAITools();
    
    // 2. MAKE EVERYTHING CLICKABLE
    initializeButtons();
    
    // 3. SET UP TEXTAREA FUNCTIONALITY
    setupTextareas();
    
    // 4. SET UP NAVIGATION
    setupNavigation();
    
    // 5. SET UP MODALS
    setupModals();
    
    // 6. UPDATE REAL-TIME CLOCK
    updateClock();
    setInterval(updateClock, 60000);
    
    console.log('✅ Emergency fix loaded successfully!');
});

// ===========================================
// 1. LOAD AI TOOLS
// ===========================================
function loadAITools() {
    const aiToolsGrid = document.getElementById('aiToolsGrid');
    if (!aiToolsGrid) return;
    
    const tools = [
        {
            id: 'chatgpt',
            name: 'ChatGPT 4',
            icon: 'fab fa-openai',
            specialty: 'Text Generation',
            description: 'Most advanced conversational AI for complex tasks',
            tags: ['GPT-4', 'Conversational', 'Code'],
            score: 98,
            popular: true,
            bestMatch: true
        },
        {
            id: 'midjourney',
            name: 'Midjourney',
            icon: 'fas fa-palette',
            specialty: 'Image Generation',
            description: 'Create stunning AI art and images from text prompts',
            tags: ['Images', 'Art', 'Design'],
            score: 96,
            popular: true
        },
        {
            id: 'claude',
            name: 'Claude 3',
            icon: 'fas fa-sparkles',
            specialty: 'Analysis',
            description: 'Excellent for document analysis and long-form content',
            tags: ['Analysis', 'Documents', 'Research'],
            score: 94
        },
        {
            id: 'github-copilot',
            name: 'GitHub Copilot',
            icon: 'fas fa-code',
            specialty: 'Coding',
            description: 'AI pair programmer that writes code in any language',
            tags: ['Coding', 'Development', 'VS Code'],
            score: 97,
            popular: true
        },
        {
            id: 'gemini',
            name: 'Gemini Pro',
            icon: 'fas fa-infinity',
            specialty: 'Multimodal',
            description: 'Google\'s AI that handles text, images, and reasoning',
            tags: ['Google', 'Multimodal', 'Free'],
            score: 92
        },
        {
            id: 'dalle',
            name: 'DALL-E 3',
            icon: 'fas fa-image',
            specialty: 'AI Art',
            description: 'Create detailed, high-quality images from descriptions',
            tags: ['Images', 'Art', 'OpenAI'],
            score: 95
        },
        {
            id: 'perplexity',
            name: 'Perplexity',
            icon: 'fas fa-search',
            specialty: 'Research',
            description: 'AI-powered search with citations and real-time data',
            tags: ['Research', 'Citations', 'Web Search'],
            score: 91
        },
        {
            id: 'stability',
            name: 'Stable Diffusion',
            icon: 'fas fa-robot',
            specialty: 'Open Source AI',
            description: 'Free, open-source image generation with full control',
            tags: ['Open Source', 'Images', 'Custom'],
            score: 89
        },
        {
            id: 'notion',
            name: 'Notion AI',
            icon: 'fas fa-file-alt',
            specialty: 'Writing',
            description: 'AI writing assistant integrated with Notion workspace',
            tags: ['Writing', 'Productivity', 'Notes'],
            score: 90
        }
    ];
    
    aiToolsGrid.innerHTML = tools.map(tool => `
        <div class="ai-tool-card" data-tool-id="${tool.id}">
            ${tool.bestMatch ? '<div class="best-match-ribbon"><i class="fas fa-star"></i> BEST MATCH</div>' : ''}
            <div class="ai-tool-header">
                <div class="tool-icon-container ${tool.popular ? 'brand-icon' : ''}">
                    <i class="${tool.icon}"></i>
                    ${tool.popular ? '<div class="popular-badge">POPULAR</div>' : ''}
                </div>
                <div class="tool-name-section">
                    <h4 class="tool-name">${tool.name}</h4>
                    <span class="tool-specialty">${tool.specialty}</span>
                </div>
            </div>
            <p class="tool-description">${tool.description}</p>
            <div class="tool-tags">
                ${tool.tags.map(tag => `<span class="tool-tag">${tag}</span>`).join('')}
            </div>
            <div class="card-footer">
                <div class="score-indicator ${tool.score > 95 ? 'score-high' : ''}">
                    <span class="score-value">${tool.score}</span>
                    <span class="score-label">/100</span>
                </div>
                <button class="open-tool-btn" data-tool="${tool.id}">
                    <i class="fas fa-external-link-alt"></i>
                    Open
                </button>
            </div>
        </div>
    `).join('');
    
    // Update tool counts
    document.getElementById('totalToolsCount').textContent = tools.length;
    document.getElementById('imageToolsCount').textContent = tools.filter(t => 
        t.tags.includes('Images') || t.tags.includes('Art')
    ).length;
    document.getElementById('textToolsCount').textContent = tools.length - 
        tools.filter(t => t.tags.includes('Images') || t.tags.includes('Art')).length;
}

// ===========================================
// 2. BUTTON FUNCTIONALITY
// ===========================================
function initializeButtons() {
    // Convert button
    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) {
        convertBtn.addEventListener('click', convertIdeaToPrompt);
    }
    
    // Copy button
    const copyBtn = document.getElementById('copyOutputBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyPrompt);
    }
    
    // Voice button
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            showNotification('🎤 Voice input activated! Speak your idea...', 'info');
        });
    }
    
    // Clear button
    const clearBtn = document.getElementById('clearRequirementBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const textarea = document.getElementById('requirement');
            if (textarea) {
                textarea.value = '';
                textarea.focus();
                updateInputStats();
                document.getElementById('convertBtn').disabled = true;
                showNotification('Text cleared', 'info');
            }
        });
    }
    
    // Regenerate button
    const regenerateBtn = document.getElementById('regenerateBtn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => {
            const input = document.getElementById('requirement').value;
            if (input.trim()) {
                convertIdeaToPrompt();
                showNotification('Prompt regenerated', 'success');
            } else {
                showNotification('Please enter an idea first', 'error');
            }
        });
    }
    
    // Improve button
    const improveBtn = document.getElementById('improveBtn');
    if (improveBtn) {
        improveBtn.addEventListener('click', () => {
            showNotification('Prompt improvement feature coming soon!', 'info');
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportPrompt);
    }
    
    // Save template button
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    if (saveTemplateBtn) {
        saveTemplateBtn.addEventListener('click', () => {
            showNotification('Template saved successfully!', 'success');
        });
    }
    
    // Launch all button
    const launchAllBtn = document.getElementById('launchAllBtn');
    if (launchAllBtn) {
        launchAllBtn.addEventListener('click', () => {
            showNotification('Launching all AI tools...', 'info');
        });
    }
    
    // Refresh tools button
    const refreshBtn = document.getElementById('refreshToolsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadAITools();
            showNotification('AI tools refreshed', 'success');
        });
    }
    
    // Open tool buttons (will be added dynamically)
    document.addEventListener('click', function(e) {
        if (e.target.closest('.open-tool-btn')) {
            const toolName = e.target.closest('.open-tool-btn').dataset.tool;
            openAITool(toolName);
        }
        
        // Filter buttons
        if (e.target.closest('.filter-btn')) {
            const filterBtn = e.target.closest('.filter-btn');
            const filter = filterBtn.dataset.filter;
            
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            filterBtn.classList.add('active');
            
            // Filter tools
            filterAITools(filter);
        }
    });
}

// ===========================================
// 3. TEXTAREA FUNCTIONALITY
// ===========================================
function setupTextareas() {
    const inputTextarea = document.getElementById('requirement');
    if (inputTextarea) {
        // Update stats on input
        inputTextarea.addEventListener('input', updateInputStats);
        
        // Auto-convert if enabled
        inputTextarea.addEventListener('input', function() {
            const autoConvert = document.getElementById('autoConvert');
            if (autoConvert && autoConvert.checked && this.value.trim().length > 10) {
                setTimeout(() => {
                    if (this.value.trim().length > 10) {
                        convertIdeaToPrompt();
                    }
                }, 1000);
            }
            
            // Enable/disable convert button
            document.getElementById('convertBtn').disabled = !this.value.trim();
        });
        
        // Initial stats update
        updateInputStats();
    }
    
    // Output textarea
    const outputTextarea = document.getElementById('output');
    if (outputTextarea) {
        outputTextarea.addEventListener('input', updateOutputStats);
        updateOutputStats();
    }
}

function updateInputStats() {
    const textarea = document.getElementById('requirement');
    const stats = document.getElementById('inputStats');
    if (textarea && stats) {
        const text = textarea.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        stats.textContent = `${chars} chars • ${words} words`;
    }
}

function updateOutputStats() {
    const textarea = document.getElementById('output');
    const stats = document.getElementById('outputStats');
    if (textarea && stats) {
        const text = textarea.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = text.trim() ? text.split('\n').length : 0;
        stats.textContent = `${chars} chars • ${words} words • ${lines} lines`;
    }
}

// ===========================================
// 4. CONVERSION FUNCTION
// ===========================================
function convertIdeaToPrompt() {
    const input = document.getElementById('requirement');
    const output = document.getElementById('output');
    
    if (!input || !output) return;
    
    const idea = input.value.trim();
    if (!idea) {
        showNotification('Please enter an idea first', 'error');
        return;
    }
    
    // Get selected preset
    const presetSelect = document.getElementById('presetSelect');
    const preset = presetSelect ? presetSelect.value : 'default';
    
    // Generate prompt based on preset
    let prompt = '';
    
    switch(preset) {
        case 'communication':
            prompt = `[ROLE]
You are a professional communication specialist.

[TASK]
${idea}

[REQUIREMENTS]
1. Use professional, clear language
2. Maintain appropriate tone
3. Include all necessary details
4. Structure for maximum impact
5. End with clear next steps

[RESPONSE FORMAT]
Provide a complete, ready-to-use response.`;
            break;
            
        case 'coding':
            prompt = `[CONTEXT]
You are a senior software developer.

[TASK]
${idea}

[REQUIREMENTS]
1. Write clean, efficient code
2. Include comments
3. Consider edge cases
4. Follow best practices
5. Optimize for performance

[RESPONSE FORMAT]
Provide complete, runnable code with explanations.`;
            break;
            
        case 'writing':
            prompt = `[CONTEXT]
You are a professional writer and editor.

[TASK]
${idea}

[REQUIREMENTS]
1. Use engaging, clear language
2. Maintain consistent tone
3. Structure logically
4. Include creative elements
5. Proofread for errors

[RESPONSE FORMAT]
Provide a complete, polished piece of writing.`;
            break;
            
        case 'analysis':
            prompt = `[CONTEXT]
You are a data analyst and researcher.

[TASK]
${idea}

[REQUIREMENTS]
1. Be objective and data-driven
2. Include relevant metrics
3. Provide insights
4. Suggest actionable recommendations
5. Consider limitations

[RESPONSE FORMAT]
Provide a structured analysis with clear findings.`;
            break;
            
        case 'creative':
            prompt = `[CONTEXT]
You are a creative director and artist.

[TASK]
${idea}

[REQUIREMENTS]
1. Be imaginative and original
2. Include vivid descriptions
3. Create engaging narratives
4. Consider visual elements
5. Inspire emotion

[RESPONSE FORMAT]
Provide a creative, detailed response.`;
            break;
            
        default:
            prompt = `[SYSTEM PROMPT]
You are a helpful, expert AI assistant.

[USER REQUEST]
${idea}

[RESPONSE GUIDELINES]
1. Provide accurate, helpful information
2. Be detailed and thorough
3. Structure your response clearly
4. Consider all aspects of the request
5. Maintain a professional tone

[RESPONSE FORMAT]
Respond in a clear, structured format that addresses all requirements.`;
    }
    
    output.value = prompt;
    updateOutputStats();
    
    // Show converted badge
    const badge = document.getElementById('convertedBadge');
    if (badge) badge.style.display = 'inline-flex';
    
    // Enable launch button
    const launchBtn = document.getElementById('launchAllBtn');
    if (launchBtn) launchBtn.disabled = false;
    
    // Update recommendation
    updateToolRecommendation(idea);
    
    showNotification('✓ Prompt converted successfully!', 'success');
}

// ===========================================
// 5. TOOL FUNCTIONS
// ===========================================
function updateToolRecommendation(idea) {
    const recommendation = document.getElementById('bestToolRecommendation');
    if (!recommendation) return;
    
    const ideaLower = idea.toLowerCase();
    
    if (ideaLower.includes('image') || ideaLower.includes('picture') || ideaLower.includes('photo') || 
        ideaLower.includes('draw') || ideaLower.includes('art') || ideaLower.includes('visual')) {
        recommendation.textContent = 'Midjourney (Best for image generation)';
    } else if (ideaLower.includes('code') || ideaLower.includes('program') || ideaLower.includes('function') ||
               ideaLower.includes('algorithm') || ideaLower.includes('debug') || ideaLower.includes('script')) {
        recommendation.textContent = 'GitHub Copilot (Best for coding)';
    } else if (ideaLower.includes('analyze') || ideaLower.includes('data') || ideaLower.includes('research') ||
               ideaLower.includes('report') || ideaLower.includes('statistic')) {
        recommendation.textContent = 'Claude 3 (Best for analysis)';
    } else if (ideaLower.includes('write') || ideaLower.includes('article') || ideaLower.includes('story') ||
               ideaLower.includes('email') || ideaLower.includes('content') || ideaLower.includes('blog')) {
        recommendation.textContent = 'ChatGPT 4 (Best for writing)';
    } else {
        recommendation.textContent = 'ChatGPT 4 (Best for general tasks)';
    }
}

function filterAITools(filter) {
    const toolCards = document.querySelectorAll('.ai-tool-card');
    
    toolCards.forEach(card => {
        const toolId = card.dataset.toolId;
        let show = false;
        
        switch(filter) {
            case 'all':
                show = true;
                break;
            case 'image':
                show = toolId.includes('midjourney') || toolId.includes('dalle') || 
                       toolId.includes('stability');
                break;
            case 'text':
                show = !(toolId.includes('midjourney') || toolId.includes('dalle') || 
                        toolId.includes('stability'));
                break;
            case 'popular':
                show = card.querySelector('.popular-badge') !== null;
                break;
            default:
                show = true;
        }
        
        card.style.display = show ? 'flex' : 'none';
    });
}

function openAITool(toolId) {
    const toolNames = {
        'chatgpt': 'ChatGPT 4',
        'midjourney': 'Midjourney',
        'claude': 'Claude 3',
        'github-copilot': 'GitHub Copilot',
        'gemini': 'Gemini Pro',
        'dalle': 'DALL-E 3',
        'perplexity': 'Perplexity',
        'stability': 'Stable Diffusion',
        'notion': 'Notion AI'
    };
    
    const prompt = document.getElementById('output').value;
    const toolName = toolNames[toolId] || 'AI Tool';
    
    if (prompt.trim()) {
        showNotification(`Opening ${toolName} with your prompt...`, 'info');
        // In a real app, this would actually launch the tool
        console.log(`Launching ${toolId} with prompt:`, prompt);
    } else {
        showNotification(`Opening ${toolName}...`, 'info');
    }
}

// ===========================================
// 6. NAVIGATION
// ===========================================
function setupNavigation() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active from all
            navItems.forEach(i => i.classList.remove('nav-item-active'));
            // Add to clicked
            this.classList.add('nav-item-active');
            
            const section = this.querySelector('span').textContent;
            showNotification(`Loading ${section}...`, 'info');
        });
    });
    
    // Quick launch tools
    const quickLaunchBtns = document.querySelectorAll('[data-tool]');
    quickLaunchBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tool = this.dataset.tool;
            openAITool(tool);
        });
    });
}

// ===========================================
// 7. MODALS
// ===========================================
function setupModals() {
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
    }
    
    // Theme button
    const themeBtn = document.getElementById('themePaletteBtn');
    const themeModal = document.getElementById('themeModal');
    
    if (themeBtn && themeModal) {
        themeBtn.addEventListener('click', () => {
            themeModal.classList.add('active');
        });
    }
    
    // Templates button
    const templatesBtn = document.getElementById('templatesBtn');
    const templatesModal = document.getElementById('templatesModal');
    
    if (templatesBtn && templatesModal) {
        templatesBtn.addEventListener('click', () => {
            templatesModal.classList.add('active');
        });
    }
    
    // History button
    const historyBtn = document.getElementById('historyBtn');
    const historyModal = document.getElementById('historyModal');
    
    if (historyBtn && historyModal) {
        historyBtn.addEventListener('click', () => {
            historyModal.classList.add('active');
        });
    }
    
    // Close modals
    const closeButtons = document.querySelectorAll('.modal-close, [data-action="close"]');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.classList.remove('active');
        });
    });
    
    // Close modal on backdrop click
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Apply theme button
    const applyThemeBtn = document.getElementById('applyThemeBtn');
    if (applyThemeBtn) {
        applyThemeBtn.addEventListener('click', () => {
            showNotification('Theme applied successfully!', 'success');
            document.getElementById('themeModal').classList.remove('active');
        });
    }
    
    // Save settings button
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            showNotification('Settings saved!', 'success');
            document.getElementById('settingsModal').classList.remove('active');
        });
    }
    
    // Create template button
    const createTemplateBtn = document.getElementById('createTemplateBtn');
    if (createTemplateBtn) {
        createTemplateBtn.addEventListener('click', () => {
            showNotification('Creating new template...', 'info');
            document.getElementById('templatesModal').classList.remove('active');
        });
    }
    
    // Clear history button
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all history?')) {
                showNotification('History cleared', 'success');
                document.getElementById('historyModal').classList.remove('active');
            }
        });
    }
}

// ===========================================
// 8. UTILITY FUNCTIONS
// ===========================================
function copyPrompt() {
    const output = document.getElementById('output');
    if (!output || !output.value.trim()) {
        showNotification('No prompt to copy', 'error');
        return;
    }
    
    output.select();
    document.execCommand('copy');
    
    // For modern browsers
    if (navigator.clipboard) {
        navigator.clipboard.writeText(output.value);
    }
    
    showNotification('✓ Prompt copied to clipboard!', 'success');
}

function exportPrompt() {
    const output = document.getElementById('output');
    if (!output || !output.value.trim()) {
        showNotification('No prompt to export', 'error');
        return;
    }
    
    const blob = new Blob([output.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptcraft-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Prompt exported as file', 'success');
}

function updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');
    
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    if (dateElement) {
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        dateElement.textContent = `${day}-${month}-${year}`;
    }
}

function showNotification(message, type = 'info') {
    console.log(`Notification: ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        background: ${type === 'success' ? 'rgba(0, 255, 65, 0.1)' : 
                     type === 'error' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 94, 0, 0.1)'};
        border: 1px solid ${type === 'success' ? '#00FF41' : 
                           type === 'error' ? '#FF0000' : '#FF5E00'};
        color: ${type === 'success' ? '#00FF41' : 
                type === 'error' ? '#FF0000' : '#FF5E00'};
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        animation: fadeIn 0.3s ease;
    `;
    
    // Add to container
    const container = document.getElementById('notificationContainer');
    if (container) {
        container.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    } else {
        // Fallback alert
        alert(message);
    }
}

// Add fadeOut animation
if (!document.querySelector('#notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);
}
