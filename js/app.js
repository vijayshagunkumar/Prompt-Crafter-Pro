// Main application entry point
import './features/intent.js';
import './features/ai-tool-ranker.js';
import './features/voice.js';
import './core/events.js';

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('PromptCraft initialized');
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize AI tool ranking
  if (window.AIToolRanker) {
    window.AIToolRanker.setupTooltips();
  }
});

function setupEventListeners() {
  const requirement = document.getElementById('requirement');
  const convertBtn = document.getElementById('convertBtn');
  const resetBtn = document.getElementById('resetBtn');
  const output = document.getElementById('output');
  
  // Requirement input handler
  if (requirement) {
    requirement.addEventListener('input', handleRequirementInput);
  }
  
  // Convert button
  if (convertBtn) {
    convertBtn.addEventListener('click', generatePrompt);
  }
  
  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', resetEverything);
  }
  
  // AI Tool buttons
  setupAIToolButtons();
  
  // Expand buttons
  setupExpandButtons();
}

function handleRequirementInput() {
  const requirement = document.getElementById('requirement');
  const convertBtn = document.getElementById('convertBtn');
  const text = requirement.value.trim();
  
  // Enable/disable convert button
  convertBtn.disabled = !text;
  
  // Show/hide intent chips
  updateIntentChips(text);
  
  // Update AI tool ranking
  if (window.AIToolRanker && text) {
    const intent = window.detectIntentAttributes?.(text) || { taskType: 'general' };
    window.AIToolRanker.rankAndReorder(intent);
  }
}

function updateIntentChips(text) {
  const intentRow = document.getElementById('intentRow');
  const intentScroll = document.getElementById('intentScroll');
  
  if (!text) {
    intentRow.classList.add('hidden');
    intentScroll.innerHTML = '';
    return;
  }
  
  const chips = [];
  
  // Simple intent detection
  if (text.toLowerCase().includes('email') || text.toLowerCase().includes('mail')) {
    chips.push('📧 Email');
  }
  if (text.toLowerCase().includes('code') || text.toLowerCase().includes('program')) {
    chips.push('💻 Code');
  }
  if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('asap')) {
    chips.push('🚨 Urgent');
  }
  if (text.toLowerCase().includes('creative') || text.toLowerCase().includes('story')) {
    chips.push('🎨 Creative');
  }
  if (text.toLowerCase().includes('analysis') || text.toLowerCase().includes('analyze')) {
    chips.push('📊 Analysis');
  }
  
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

function generatePrompt() {
  const requirement = document.getElementById('requirement');
  const output = document.getElementById('output');
  const convertBtn = document.getElementById('convertBtn');
  const convertedBadge = document.getElementById('convertedBadge');
  
  const text = requirement.value.trim();
  if (!text) return;
  
  // Show loading state
  convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
  convertBtn.disabled = true;
  
  // Format the prompt
  const prompt = formatStructuredPrompt(text);
  
  // Simulate API call with timeout
  setTimeout(() => {
    output.value = prompt;
    convertedBadge.classList.remove('hidden');
    convertBtn.innerHTML = '<i class="fas fa-magic"></i> Convert';
    convertBtn.disabled = false;
    
    // Enable AI tool buttons
    enableAIToolButtons();
    
    // Show notification
    showNotification('Prompt converted successfully!');
  }, 800);
}

function formatStructuredPrompt(rawText) {
  const lines = rawText.split('\n').filter(line => line.trim());
  
  let prompt = '# Prompt Structure\n\n';
  prompt += '## Objective\n';
  prompt += `${rawText}\n\n`;
  
  prompt += '## Context\n';
  prompt += '- Professional tone\n';
  prompt += '- Clear and concise\n';
  prompt += '- Action-oriented\n\n';
  
  prompt += '## Requirements\n';
  if (rawText.toLowerCase().includes('email')) {
    prompt += '- Subject line\n- Professional greeting\n- Clear request\n- Polite closing\n- Contact information\n';
  } else if (rawText.toLowerCase().includes('code')) {
    prompt += '- Clean, readable code\n- Comments for explanation\n- Error handling\n- Best practices\n';
  } else {
    prompt += '- Professional tone\n- Clear objectives\n- Specific requirements\n- Expected outcome\n';
  }
  
  prompt += '\n## Output Format\n';
  prompt += 'Well-structured, professional response';
  
  return prompt;
}

function resetEverything() {
  const requirement = document.getElementById('requirement');
  const output = document.getElementById('output');
  const convertBtn = document.getElementById('convertBtn');
  const convertedBadge = document.getElementById('convertedBadge');
  const intentRow = document.getElementById('intentRow');
  const intentScroll = document.getElementById('intentScroll');
  
  // Clear textareas
  requirement.value = '';
  output.value = '';
  
  // Reset UI
  convertBtn.disabled = true;
  convertBtn.innerHTML = '<i class="fas fa-magic"></i> Convert';
  convertedBadge.classList.add('hidden');
  intentRow.classList.add('hidden');
  intentScroll.innerHTML = '';
  
  // Disable AI tool buttons
  disableAIToolButtons();
  
  // Reset AI tool ranking
  if (window.AIToolRanker && window.AIToolRanker.resetToDefault) {
    window.AIToolRanker.resetToDefault();
  }
  
  showNotification('Everything has been reset');
}

function setupAIToolButtons() {
  const aiTools = {
    'chatgptBtn': 'https://chat.openai.com',
    'claudeBtn': 'https://claude.ai',
    'geminiBtn': 'https://gemini.google.com',
    'perplexityBtn': 'https://www.perplexity.ai',
    'deepseekBtn': 'https://chat.deepseek.com',
    'copilotBtn': 'https://copilot.microsoft.com',
    'grokBtn': 'https://x.com/i/grok'
  };
  
  Object.keys(aiTools).forEach(id => {
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
          // Show copied notification
          const originalText = btn.querySelector('.launch-name')?.textContent || btn.textContent;
          btn.innerHTML = '<span class="launch-icon">✓</span><span class="launch-text"><span class="launch-name">Copied!</span></span>';
          btn.style.background = '#10b981';
          
          setTimeout(() => {
            btn.innerHTML = `<span class="launch-icon">${originalText.charAt(0)}</span><span class="launch-text"><span class="launch-name">${originalText}</span></span>`;
            btn.style.background = '';
          }, 1000);
          
          // Open AI tool
          setTimeout(() => {
            window.open(aiTools[id], '_blank');
          }, 300);
        }).catch(err => {
          console.error('Failed to copy:', err);
          window.open(aiTools[id], '_blank');
        });
      });
    }
  });
}

function enableAIToolButtons() {
  document.querySelectorAll('.launch-btn').forEach(btn => {
    btn.disabled = false;
    btn.style.opacity = '1';
  });
}

function disableAIToolButtons() {
  document.querySelectorAll('.launch-btn').forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.5';
  });
}

function setupExpandButtons() {
  const expandInputBtn = document.getElementById('expandInputBtn');
  const expandOutputBtn = document.getElementById('expandOutputBtn');
  const expandOverlay = document.getElementById('expandOverlay');
  
  if (expandInputBtn) {
    expandInputBtn.addEventListener('click', () => toggleExpand('input'));
  }
  
  if (expandOutputBtn) {
    expandOutputBtn.addEventListener('click', () => toggleExpand('output'));
  }
  
  if (expandOverlay) {
    expandOverlay.addEventListener('click', () => {
      expandOverlay.classList.add('hidden');
      document.querySelectorAll('.textarea-expanded').forEach(el => {
        el.classList.remove('textarea-expanded');
      });
    });
  }
}

function toggleExpand(type) {
  const expandOverlay = document.getElementById('expandOverlay');
  const textarea = type === 'input' 
    ? document.getElementById('requirement')
    : document.getElementById('output');
  
  if (textarea.classList.contains('textarea-expanded')) {
    // Collapse
    textarea.classList.remove('textarea-expanded');
    expandOverlay.classList.add('hidden');
  } else {
    // Expand
    textarea.classList.add('textarea-expanded');
    expandOverlay.classList.remove('hidden');
    textarea.focus();
  }
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

// Make functions available globally
window.generatePrompt = generatePrompt;
window.resetEverything = resetEverything;
