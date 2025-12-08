// Application State
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "ft:gpt-3.5-turbo-1106:personal::CkAjxivm";

let currentPreset = 'default';
let autoConvertEnabled = true;
let autoConvertDelay = 60;
let usageCount = 0;
let lastConvertedText = '';
let isConverted = false;
let autoConvertTimer;
let autoConvertCountdown = 60;
let countdownInterval;
let editingTemplateId = null;
let templates = [];

// Template categories
const TEMPLATE_CATEGORIES = {
  'communication': { name: 'Communication', icon: 'fa-envelope', color: '#3b82f6' },
  'coding': { name: 'Coding', icon: 'fa-code', color: '#10b981' },
  'writing': { name: 'Writing', icon: 'fa-pen', color: '#8b5cf6' },
  'analysis': { name: 'Analysis', icon: 'fa-chart-bar', color: '#f59e0b' },
  'business': { name: 'Business', icon: 'fa-briefcase', color: '#ef4444' },
  'creative': { name: 'Creative', icon: 'fa-palette', color: '#ec4899' },
  'education': { name: 'Education', icon: 'fa-graduation-cap', color: '#06b6d4' },
  'other': { name: 'Other', icon: 'fa-th', color: '#6b7280' }
};

// Default templates
const DEFAULT_TEMPLATES = [
  {
    id: '1',
    name: 'Professional Email',
    description: 'Write clear, professional emails for business communication',
    category: 'communication',
    tags: ['email', 'professional', 'business'],
    content: `# Role
You are an expert business communicator skilled in writing professional emails.

# Objective
Write a professional email about [TOPIC] to [RECIPIENT]

# Context
- Recipient: [DESCRIBE RECIPIENT]
- Relationship: [DESCRIBE RELATIONSHIP]
- Purpose: [EMAIL PURPOSE]

# Instructions
1. Use professional but friendly tone
2. Start with appropriate greeting
3. State purpose clearly in first paragraph
4. Provide necessary details
5. Include clear call to action
6. End with professional closing

# Notes
- Keep it concise (150-200 words)
- Use proper email formatting
- Include subject line
- Check for tone appropriateness`,
    example: 'Write a professional email to my manager requesting a meeting to discuss project timeline adjustments.',
    usageCount: 5,
    createdAt: Date.now() - 86400000,
    isDefault: true
  },
  {
    id: '2',
    name: 'Code Review Request',
    description: 'Request code reviews from team members effectively',
    category: 'coding',
    tags: ['code', 'review', 'team'],
    content: `# Role
You are an experienced software developer who needs code review.

# Objective
Request code review for [FEATURE/BUG_FIX] from [TEAM_MEMBER/TEAM]

# Context
- PR/MR Link: [LINK]
- Changes: [BRIEF_DESCRIPTION]
- Testing: [WHAT_WAS_TESTED]

# Instructions
1. Mention specific files/lines to review
2. Explain the change briefly
3. Mention any concerns or trade-offs
4. Specify what kind of feedback you need
5. Provide context if needed

# Notes
- Be specific about what to review
- Mention deadlines if any
- Thank the reviewer in advance`,
    example: 'Request code review for the new user authentication system from the backend team.',
    usageCount: 3,
    createdAt: Date.now() - 172800000,
    isDefault: true
  }
];

// Preset templates (ALL of these tell the target AI to DO the task, not generate prompts)
// Preset templates – execution-focused
const PRESETS = {
  // Simple, works well across ChatGPT / Claude / Gemini / DeepSeek
  'default': (role, requirement) => `
You are an ${role}.

Directly perform the following task now and return the final result (not a description of the task):

${requirement}

Response rules:
- Start immediately with the answer, not with phrases like "Instruction", "Task", or a restatement of the request.
- Do NOT talk about prompts, instructions, or what you are going to do.
- Do NOT rewrite or summarize the task.
- Provide the full, final output in one response.
`.trim(),

  'claude': (role, requirement) => `
You are an ${role}. Perform this task directly:

${requirement}

Guidelines:
- Do not explain your process unless explicitly asked.
- Do not rephrase the instructions.
- Your response should be only the completed result.
`.trim(),

  'chatgpt': (role, requirement) => `
You are an ${role}. The user needs you to perform this task now:

${requirement}

Important:
- Respond only with the finished result.
- Do not include meta-commentary, prompt text, or a restatement of the request.
- Start directly with the answer.
`.trim(),

  'detailed': (role, requirement) => `
You are an ${role}. Your job is to carry out the following task end-to-end and return the finished output:

${requirement}

When you respond:
- Analyze the task carefully.
- Organize your answer into clear sections if helpful.
- Focus on correctness, structure, and readability.
- Do NOT describe the task, generate instructions, or talk about prompts.
- Start your answer with the actual content (analysis, email, code, etc.), not with an explanation.

Return only the final result.
`.trim()
};


// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  loadSettings();
  loadTemplates();
  loadUsageCount();
  setupEventListeners();
  initializeUI();
  document.getElementById('requirement').focus();
}

function loadSettings() {
  const apiKey = localStorage.getItem('OPENAI_API_KEY') || '';
  const delay = localStorage.getItem('autoConvertDelay') || '60';
  const theme = localStorage.getItem('theme') || 'light';
  
  document.getElementById('apiKeyInput').value = apiKey;
  document.getElementById('autoConvertDelay').value = delay;
  document.getElementById('themeSelect').value = theme;
  document.getElementById('delayValue').textContent = `Current: ${delay} seconds`;
  
  autoConvertDelay = parseInt(delay);
  autoConvertCountdown = autoConvertDelay;
}

function loadTemplates() {
  const savedTemplates = localStorage.getItem('promptTemplates');
  if (savedTemplates) {
    templates = JSON.parse(savedTemplates);
  } else {
    templates = DEFAULT_TEMPLATES;
    localStorage.setItem('promptTemplates', JSON.stringify(templates));
  }
}

function loadUsageCount() {
  const savedUsage = localStorage.getItem('promptCrafterUsage');
  if (savedUsage) {
    usageCount = parseInt(savedUsage);
    document.getElementById('usageCount').textContent = `${usageCount} prompts generated`;
  }
}

function setupEventListeners() {
  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'flex';
  });
  
  document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'none';
  });
  
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  
  document.getElementById('clearDataBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data? This will delete all templates, history, and settings.')) {
      clearAllData();
    }
  });
  
  // Auto-convert delay slider
  const delaySlider = document.getElementById('autoConvertDelay');
  const delayValue = document.getElementById('delayValue');
  delaySlider.addEventListener('input', () => {
    delayValue.textContent = `Current: ${delaySlider.value} seconds`;
    autoConvertDelay = parseInt(delaySlider.value);
  });
  
  // Requirement input
  const requirementEl = document.getElementById('requirement');
  requirementEl.addEventListener('input', handleRequirementInput);
  
  // Auto-convert toggle
  document.getElementById('autoConvert').addEventListener('change', (e) => {
    autoConvertEnabled = e.target.checked;
    if (!autoConvertEnabled) {
      clearAutoConvertTimer();
    } else if (requirementEl.value.trim() && !isConverted) {
      resetAutoConvertTimer();
    }
  });
  
  // Preset selection
  document.querySelectorAll('.preset-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.preset-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      currentPreset = option.dataset.preset;
      if (requirementEl.value.trim() && isConverted) {
        isConverted = false;
        generatePrompt();
      }
    });
  });
  
  // Examples
  document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      requirementEl.value = btn.dataset.example;
      requirementEl.focus();
      isConverted = false;
      document.getElementById('convertBtn').disabled = false;
      document.getElementById('convertedBadge').style.display = 'none';
      generatePrompt();
    });
  });
  
  // Convert button
  document.getElementById('convertBtn').addEventListener('click', generatePrompt);
  
  // Copy button
  document.getElementById('copyBtn').addEventListener('click', async () => {
    if (!document.getElementById('output').value) await generatePrompt();
    await copyToClipboard();
    showNotification('Prompt copied to clipboard!');
  });
  
  // AI Tools
  document.getElementById('chatgptBtn').addEventListener('click', () => openAITool('ChatGPT', 'https://chat.openai.com/'));
  document.getElementById('claudeBtn').addEventListener('click', () => openAITool('Claude', 'https://claude.ai/new'));
  document.getElementById('geminiBtn').addEventListener('click', () => openAITool('Gemini', 'https://gemini.google.com/app'));
  document.getElementById('perplexityBtn').addEventListener('click', () => openAITool('Perplexity', 'https://www.perplexity.ai/'));
  document.getElementById('deepseekBtn').addEventListener('click', () => openAITool('DeepSeek', 'https://chat.deepseek.com/'));
  
  // Export
  document.getElementById('exportBtn').addEventListener('click', exportPrompt);
  
  // History
  document.getElementById('toggleHistoryBtn').addEventListener('click', toggleHistory);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
  
  // Template functionality
  setupTemplateListeners();
}

function initializeUI() {
  updateStats('');
  loadHistory();
}

// Core Functions
function handleRequirementInput() {
  const requirementEl = document.getElementById('requirement');
  const convertBtn = document.getElementById('convertBtn');
  
  if (isConverted && requirementEl.value.trim() !== lastConvertedText) {
    isConverted = false;
    convertBtn.disabled = false;
    document.getElementById('convertedBadge').style.display = 'none';
    document.getElementById('timerDisplay').style.display = 'none';
    clearAutoConvertTimer();
  }
  
  if (autoConvertEnabled) {
    resetAutoConvertTimer();
  }
  updateStats(requirementEl.value);
}

function resetAutoConvertTimer() {
  clearAutoConvertTimer();
  
  const requirement = document.getElementById('requirement').value.trim();
  if (autoConvertEnabled && requirement && !isConverted) {
    autoConvertCountdown = autoConvertDelay;
    document.getElementById('timerValue').textContent = `${autoConvertCountdown}s`;
    document.getElementById('timerDisplay').style.display = 'inline-flex';
    
    countdownInterval = setInterval(() => {
      autoConvertCountdown--;
      document.getElementById('timerValue').textContent = `${autoConvertCountdown}s`;
      
      if (autoConvertCountdown <= 0) {
        clearInterval(countdownInterval);
        document.getElementById('timerDisplay').style.display = 'none';
        if (requirement && requirement !== lastConvertedText) {
          generatePrompt();
        }
      }
    }, 1000);
    
    autoConvertTimer = setTimeout(() => {
      const currentRequirement = document.getElementById('requirement').value.trim();
      if (currentRequirement && currentRequirement !== lastConvertedText) {
        generatePrompt();
      }
    }, autoConvertDelay * 1000);
  }
}

function clearAutoConvertTimer() {
  clearTimeout(autoConvertTimer);
  clearInterval(countdownInterval);
  document.getElementById('timerDisplay').style.display = 'none';
}

function getAppropriateRole(text) {
  const lowerText = text.toLowerCase();
  if (/email|mail|send.*to|message.*to/i.test(lowerText)) return "expert email writer";
  if (/write|create|draft|compose|content|blog|article/i.test(lowerText)) return "expert content writer";
  if (/analyze|evaluate|review|assess|research|market/i.test(lowerText)) return "expert analyst";
  if (/code|program|script|develop|software|function|python|javascript/i.test(lowerText)) return "expert developer";
  if (/design|ui|ux|layout|graphic|visual|wireframe/i.test(lowerText)) return "expert designer";
  if (/business|strategy|plan|proposal|marketing|sales/i.test(lowerText)) return "expert business consultant";
  if (/translate|language|localize|interpret/i.test(lowerText)) return "expert translator";
  if (/math|calculate|solve|equation|formula|statistics/i.test(lowerText)) return "expert mathematician";
  if (/teach|explain|educate|tutor|lesson|guide/i.test(lowerText)) return "expert educator";
  if (/recipe|cook|food|meal|ingredient/i.test(lowerText)) return "expert chef";
  if (/workout|exercise|fitness|gym|train/i.test(lowerText)) return "expert fitness trainer";
  return "expert assistant";
}

function updateStats(text) {
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text.split('\n').length;
  
  document.getElementById('charCount').textContent = `${charCount} characters`;
  document.getElementById('wordCount').textContent = `${wordCount} words`;
  document.getElementById('lineCount').textContent = `${lineCount} lines`;
}

// SANITISER: remove any "prompt generator / rewrite / convert to prompt" junk from the final text
function sanitizePrompt(text) {
  if (!text) return '';
  let cleaned = text;

  // Strip code fences if model accidentally adds them
  cleaned = cleaned.replace(/^```[^\n]*\n?/g, '');
  cleaned = cleaned.replace(/```$/g, '');

  const forbiddenLineRegex = /(prompt generator|generate a prompt|rewrite .*requirement|convert .*requirement .*prompt|rewrite .*prompt)/i;

  cleaned = cleaned
    .split('\n')
    .filter(line => !forbiddenLineRegex.test(line))
    .join('\n');

  // Soft replace leftover phrases inside lines
  cleaned = cleaned.replace(/prompt generator/gi, 'assistant');
  cleaned = cleaned.replace(/generate a prompt/gi, 'perform the task and return the final answer');

  return cleaned.trim();
}

async function generatePrompt() {
  const requirementEl = document.getElementById('requirement');
  const outputEl = document.getElementById('output');
  const convertBtn = document.getElementById('convertBtn');
  const raw = requirementEl.value.trim();
  
  if (!raw) {
    showNotification('Please enter a requirement first');
    return '';
  }

  // Track usage
  usageCount++;
  localStorage.setItem('promptCrafterUsage', usageCount);
  document.getElementById('usageCount').textContent = `${usageCount} prompts generated`;

  const apiKey = localStorage.getItem('OPENAI_API_KEY')?.trim();

  // Show converting state
  convertBtn.disabled = true;
  convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
  clearAutoConvertTimer();

  let generatedPrompt;
  
  try {
    if (!apiKey) {
      // Local formatter: just use the preset template directly
      generatedPrompt = localFormatter(raw);
      generatedPrompt = sanitizePrompt(generatedPrompt);
    } else {
      // Use API: tell FT model to fill ROLE + REQUIREMENT into the preset template
      const role = getAppropriateRole(raw);
      const templateWithPlaceholders = PRESETS[currentPreset]('[ROLE]', '[REQUIREMENT]');

      const system = `
You transform the user's requirement into a single, well-structured instruction
that an AI assistant can directly execute to perform the task and return the final answer.

Use exactly this template:

${templateWithPlaceholders}

Rules:
- Replace [ROLE] with this exact expert role: ${role}
- Replace [REQUIREMENT] with the user's requirement text.
- Do NOT change any other wording in the template.
- Do NOT mention "prompt", "prompt generator", or "prompt engineering".
- Do NOT tell the AI to rewrite, convert, or generate prompts.
- Do NOT talk about templates, system messages, or instructions.
- Do NOT wrap the output in code fences.
- Output ONLY the final instruction text that tells the AI to perform the task and return the final answer.
      `.trim();

      const userMessage = raw;

      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userMessage }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (response.ok) {
        const data = await response.json();
        generatedPrompt = data.choices?.[0]?.message?.content?.trim() || localFormatter(raw);
      } else {
        generatedPrompt = localFormatter(raw);
      }

      generatedPrompt = sanitizePrompt(generatedPrompt);
    }

    outputEl.value = generatedPrompt;
    updateStats(generatedPrompt);
    saveToHistory(raw, generatedPrompt);
    
    isConverted = true;
    lastConvertedText = raw;
    convertBtn.disabled = true;
    document.getElementById('convertedBadge').style.display = 'inline-flex';
    
    showNotification('Prompt generated successfully');
    
    if (autoConvertEnabled) {
      resetAutoConvertTimer();
    }
    
    return generatedPrompt;

  } catch (err) {
    console.error('Generation error:', err);
    generatedPrompt = localFormatter(raw);
    generatedPrompt = sanitizePrompt(generatedPrompt);
    outputEl.value = generatedPrompt;
    updateStats(generatedPrompt);
    saveToHistory(raw, generatedPrompt);
    showNotification('Generated with local template');
    
    isConverted = true;
    lastConvertedText = raw;
    convertBtn.disabled = true;
    document.getElementById('convertedBadge').style.display = 'inline-flex';
    
    return generatedPrompt;
  } finally {
    convertBtn.disabled = true;
    convertBtn.innerHTML = '<i class="fas fa-magic"></i> Convert to Prompt';
  }
}

function localFormatter(raw) {
  const clean = (raw || '').trim() || '[No requirement provided]';
  const role = getAppropriateRole(clean);
  const template = PRESETS[currentPreset];
  return template ? template(role, clean) : PRESETS['default'](role, clean);
}

async function copyToClipboard() {
  const outputEl = document.getElementById('output');
  if (!outputEl.value) {
    showNotification('No prompt to copy. Generate one first.');
    return false;
  }
  
  try {
    await navigator.clipboard.writeText(outputEl.value);
    return true;
  } catch (err) {
    const textArea = document.createElement('textarea');
    textArea.value = outputEl.value;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err2) {
      document.body.removeChild(textArea);
      showNotification('Failed to copy. Please copy manually.');
      return false;
    }
  }
}

async function openAITool(platform, url) {
  const outputEl = document.getElementById('output');
  if (!outputEl.value || !isConverted) {
    await generatePrompt();
  }
  
  const copied = await copyToClipboard();
  if (!copied) return;
  
  showNotification(`Prompt copied! Opening ${platform}...`);
  
  try {
    window.open(url, '_blank');
  } catch (err) {
    showNotification(`${platform} blocked by popup blocker. Please allow popups.`);
  }
}

function exportPrompt() {
  const outputEl = document.getElementById('output');
  if (!outputEl.value) {
    showNotification('Generate a prompt first');
    return;
  }
  
  const blob = new Blob([outputEl.value], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompt-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('Prompt exported as .txt file');
}

// Settings Functions
function saveSettings() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  const delay = document.getElementById('autoConvertDelay').value;
  const theme = document.getElementById('themeSelect').value;
  
  localStorage.setItem('OPENAI_API_KEY', apiKey);
  localStorage.setItem('autoConvertDelay', delay);
  localStorage.setItem('theme', theme);
  
  autoConvertDelay = parseInt(delay);
  autoConvertCountdown = autoConvertDelay;
  
  document.getElementById('settingsModal').style.display = 'none';
  showNotification('Settings saved successfully!');
}

function clearAllData() {
  localStorage.removeItem('promptTemplates');
  localStorage.removeItem('promptHistory');
  localStorage.removeItem('promptCrafterUsage');
  
  const apiKey = localStorage.getItem('OPENAI_API_KEY');
  const delay = localStorage.getItem('autoConvertDelay');
  const theme = localStorage.getItem('theme');
  
  localStorage.clear();
  
  if (apiKey) localStorage.setItem('OPENAI_API_KEY', apiKey);
  if (delay) localStorage.setItem('autoConvertDelay', delay);
  if (theme) localStorage.setItem('theme', theme);
  
  usageCount = 0;
  templates = [...DEFAULT_TEMPLATES];
  isConverted = false;
  lastConvertedText = '';
  
  document.getElementById('requirement').value = '';
  document.getElementById('output').value = '';
  document.getElementById('usageCount').textContent = '0 prompts generated';
  document.getElementById('historyList').innerHTML = '';
  document.getElementById('templatesGrid').innerHTML = '';
  updateStats('');
  
  document.getElementById('convertedBadge').style.display = 'none';
  document.getElementById('timerDisplay').style.display = 'none';
  document.getElementById('convertBtn').disabled = false;
  
  localStorage.setItem('promptTemplates', JSON.stringify(templates));
  
  document.getElementById('settingsModal').style.display = 'none';
  showNotification('All data cleared successfully!');
}

// History Functions
function saveToHistory(requirement, prompt) {
  const history = JSON.parse(localStorage.getItem('promptHistory') || '[]');
  const item = {
    id: Date.now(),
    requirement: requirement.substring(0, 100) + (requirement.length > 100 ? '...' : ''),
    prompt: prompt,
    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    date: new Date().toLocaleDateString(),
    fullRequirement: requirement
  };
  
  history.unshift(item);
  if (history.length > 15) history.pop();
  
  localStorage.setItem('promptHistory', JSON.stringify(history));
  localStorage.setItem(`fullReq_${item.id}`, requirement);
  loadHistory();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem('promptHistory') || '[]');
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  if (history.length === 0) {
    historyList.innerHTML = '<div style="text-align: center; color: var(--muted); padding: 20px; font-size: 13px;">No history yet</div>';
    return;
  }
  
  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight:500; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.requirement}</div>
        <div style="font-size:11px;color:var(--muted)">${item.date} ${item.timestamp}</div>
      </div>
      <button class="btn small" style="padding:6px 12px;font-size:12px; flex-shrink: 0;" onclick="event.stopPropagation();useHistoryItem('${item.id}')">Use</button>
    `;
    div.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        const requirementEl = document.getElementById('requirement');
        const outputEl = document.getElementById('output');
        requirementEl.value = localStorage.getItem(`fullReq_${item.id}`) || item.requirement;
        outputEl.value = item.prompt;
        updateStats(item.prompt);
        isConverted = true;
        lastConvertedText = requirementEl.value.trim();
        document.getElementById('convertBtn').disabled = true;
        document.getElementById('convertedBadge').style.display = 'inline-flex';
        showNotification('Prompt loaded from history');
      }
    });
    historyList.appendChild(div);
  });
}

function toggleHistory() {
  const panel = document.getElementById('historyPanel');
  const isVisible = panel.style.display === 'block';
  panel.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) loadHistory();
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    localStorage.removeItem('promptHistory');
    loadHistory();
    showNotification('History cleared');
  }
}

// Template Functions
function setupTemplateListeners() {
  document.getElementById('toggleTemplatesBtn').addEventListener('click', () => {
    const panel = document.getElementById('templatesPanel');
    const btn = document.getElementById('toggleTemplatesBtn');
    
    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
      loadCategories();
      loadTemplatesToUI();
    } else {
      panel.style.display = 'none';
      btn.innerHTML = '<i class="fas fa-eye"></i> Show';
    }
  });
  
  document.getElementById('templateSearch').addEventListener('input', function() {
    const activeCategory = document.querySelector('.template-category.active')?.dataset.category || 'all';
    filterTemplatesUI(activeCategory, this.value);
  });
  
  document.getElementById('newTemplateBtn').addEventListener('click', () => {
    editingTemplateId = null;
    document.getElementById('modalTitle').textContent = 'New Template';
    document.getElementById('templateName').value = '';
    document.getElementById('templateDescription').value = '';
    document.getElementById('templateContent').value = document.getElementById('output').value || '';
    document.getElementById('templateCategory').value = 'communication';
    document.getElementById('templateExample').value = document.getElementById('requirement').value || '';
    document.getElementById('templateModal').style.display = 'flex';
  });
  
  document.getElementById('saveAsTemplateBtn').addEventListener('click', () => {
    if (!document.getElementById('output').value.trim()) {
      showNotification('Generate a prompt first before saving as template');
      return;
    }
    
    editingTemplateId = null;
    document.getElementById('modalTitle').textContent = 'Save as Template';
    document.getElementById('templateName').value = `Prompt ${new Date().toLocaleDateString()}`;
    document.getElementById('templateDescription').value = 'Custom prompt template';
    document.getElementById('templateContent').value = document.getElementById('output').value;
    document.getElementById('templateCategory').value = 'other';
    document.getElementById('templateExample').value = document.getElementById('requirement').value || '';
    document.getElementById('templateModal').style.display = 'flex';
  });
  
  document.getElementById('saveTemplateBtn').addEventListener('click', saveTemplate);
  
  document.getElementById('closeTemplateBtn').addEventListener('click', () => {
    document.getElementById('templateModal').style.display = 'none';
  });
  
  document.getElementById('cancelTemplateBtn').addEventListener('click', () => {
    document.getElementById('templateModal').style.display = 'none';
  });
}

function loadCategories() {
  const container = document.getElementById('templateCategories');
  container.innerHTML = '';
  
  const allCat = document.createElement('div');
  allCat.className = 'template-category active';
  allCat.dataset.category = 'all';
  allCat.innerHTML = '<i class="fas fa-th"></i> All';
  allCat.addEventListener('click', () => filterTemplatesUI('all'));
  container.appendChild(allCat);
  
  Object.keys(TEMPLATE_CATEGORIES).forEach(id => {
    const cat = TEMPLATE_CATEGORIES[id];
    const catEl = document.createElement('div');
    catEl.className = 'template-category';
    catEl.dataset.category = id;
    catEl.innerHTML = `<i class="fas ${cat.icon}"></i> ${cat.name}`;
    catEl.addEventListener('click', () => filterTemplatesUI(id));
    container.appendChild(catEl);
  });
}

function loadTemplatesToUI(filterCategory = 'all', searchQuery = '') {
  const grid = document.getElementById('templatesGrid');
  const empty = document.getElementById('emptyTemplates');
  
  grid.innerHTML = '';
  
  let filtered = templates;
  
  if (filterCategory !== 'all') {
    filtered = filtered.filter(t => t.category === filterCategory);
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }
  
  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  
  empty.style.display = 'none';
  
  filtered.forEach(template => {
    const category = TEMPLATE_CATEGORIES[template.category];
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <div class="template-icon" style="background:${category.color}">
        <i class="fas ${category.icon}"></i>
      </div>
      <div class="template-title">${template.name}</div>
      <div class="template-desc">${template.description}</div>
      <div class="template-meta">
        <span><i class="fas fa-download"></i> Used ${template.usageCount || 0} times</span>
        <span class="tag"><i class="fas fa-tag"></i> ${category.name}</span>
      </div>
      <div class="template-actions">
        <button class="btn small" style="background:${category.color}" onclick="useTemplate('${template.id}')">
          <i class="fas fa-play"></i> Use
        </button>
        <button class="btn small" style="background:#64748b" onclick="editTemplate('${template.id}')">
          <i class="fas fa-edit"></i>
        </button>
        ${!template.isDefault ? `<button class="btn small" style="background:#ef4444" onclick="deleteTemplate('${template.id}')">
          <i class="fas fa-trash"></i>
        </button>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterTemplatesUI(category, searchQuery = '') {
  document.querySelectorAll('.template-category').forEach(cat => {
    cat.classList.remove('active');
  });
  document.querySelector(`.template-category[data-category="${category}"]`).classList.add('active');
  
  const currentSearch = searchQuery || document.getElementById('templateSearch').value;
  loadTemplatesToUI(category, currentSearch);
}

function saveTemplate() {
  const name = document.getElementById('templateName').value.trim();
  const description = document.getElementById('templateDescription').value.trim();
  const content = document.getElementById('templateContent').value.trim();
  const category = document.getElementById('templateCategory').value;
  const example = document.getElementById('templateExample').value.trim();
  
  if (!name || !content) {
    showNotification('Name and content are required');
    return;
  }
  
  if (editingTemplateId) {
    const index = templates.findIndex(t => t.id === editingTemplateId);
    if (index !== -1) {
      templates[index] = {
        ...templates[index],
        name,
        description,
        content,
        category,
        example
      };
    }
  } else {
    const newTemplate = {
      id: Date.now().toString(),
      name,
      description,
      content,
      category,
      example,
      usageCount: 0,
      createdAt: Date.now(),
      isDefault: false
    };
    templates.push(newTemplate);
  }
  
  localStorage.setItem('promptTemplates', JSON.stringify(templates));
  loadTemplatesToUI();
  document.getElementById('templateModal').style.display = 'flex';
  document.getElementById('templateModal').style.display = 'none';
  showNotification(`Template "${name}" saved`);
}

// Utility Functions
function showNotification(message) {
  const notification = document.getElementById('notification');
  document.getElementById('notificationText').textContent = message;
  notification.style.display = 'flex';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// Make functions globally available
window.clearHistory = clearHistory;
window.useTemplate = function(id) {
  const template = templates.find(t => t.id === id);
  if (template) {
    template.usageCount = (template.usageCount || 0) + 1;
    localStorage.setItem('promptTemplates', JSON.stringify(templates));
    
    document.getElementById('requirement').value = template.example || '';
    
    document.getElementById('output').value = template.content;
    updateStats(template.content);
    
    isConverted = true;
    lastConvertedText = document.getElementById('requirement').value.trim();
    document.getElementById('convertBtn').disabled = true;
    document.getElementById('convertedBadge').style.display = 'inline-flex';
    
    showNotification(`Using "${template.name}" template`);
  }
};

window.editTemplate = function(id) {
  const template = templates.find(t => t.id === id);
  if (template) {
    editingTemplateId = id;
    document.getElementById('modalTitle').textContent = 'Edit Template';
    document.getElementById('templateName').value = template.name;
    document.getElementById('templateDescription').value = template.description;
    document.getElementById('templateContent').value = template.content;
    document.getElementById('templateCategory').value = template.category;
    document.getElementById('templateExample').value = template.example || '';
    
    document.getElementById('templateModal').style.display = 'flex';
  }
};

window.deleteTemplate = function(id) {
  if (confirm('Are you sure you want to delete this template?')) {
    templates = templates.filter(t => t.id !== id || t.isDefault);
    localStorage.setItem('promptTemplates', JSON.stringify(templates));
    loadTemplatesToUI();
    showNotification('Template deleted');
  }
};

window.useHistoryItem = function(id) {
  const history = JSON.parse(localStorage.getItem('promptHistory') || '[]');
  const item = history.find(h => h.id == id);
  if (item) {
    document.getElementById('requirement').value = localStorage.getItem(`fullReq_${id}`) || item.requirement;
    generatePrompt();
  }
};
