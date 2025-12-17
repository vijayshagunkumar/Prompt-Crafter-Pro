import { notifications } from '../ui/notifications.js';

export class IntentDetector {
  constructor() {
    this.currentIntent = null;
    this.currentTone = null;
    this.setup();
  }
  
  setup() {
    const requirementEl = document.getElementById('requirement');
    if (requirementEl) {
      requirementEl.addEventListener('input', this.detectIntent.bind(this));
    }
  }
  
  detectIntent(event) {
    const text = event.target.value.trim();
    if (!text) {
      this.currentIntent = null;
      this.currentTone = null;
      this.updateUI();
      return;
    }
    
    // Detect intent
    const intent = this.analyzeIntent(text);
    const tone = this.analyzeTone(text);
    
    this.currentIntent = intent;
    this.currentTone = tone;
    
    this.updateUI();
    this.notifyIfSignificantChange(intent, tone);
  }
  
  analyzeIntent(text) {
    const lower = text.toLowerCase();
    
    // Image generation
    if (/(generate|create|make).*(image|picture|photo|art|illustration|drawing|visual|graphic|logo|design|poster|banner)/i.test(text) ||
        /(image|picture|photo|art|illustration|drawing|visual|graphic|logo|design)/i.test(text) && 
        /(generate|create|make|design)/i.test(text)) {
      return { type: 'image_generation', confidence: 0.9, label: 'Image Generation' };
    }
    
    // Code generation
    if (/(code|program|script|function|algorithm|api|endpoint|database|sql|query|bug|fix|debug|refactor|optimize)/i.test(text) ||
        /\b(python|javascript|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|typescript|html|css|react|vue|angular|node\.js)\b/i.test(text)) {
      return { type: 'code_generation', confidence: 0.85, label: 'Code Generation' };
    }
    
    // Email writing
    if (/(email|mail|send.*to|message.*to|follow-up|professional.*email|business.*email)/i.test(text)) {
      return { type: 'email_writing', confidence: 0.8, label: 'Email Writing' };
    }
    
    // Blog/Article writing
    if (/(blog|article|post|content|copy|copywriting|marketing|seo|social.*media|linkedin|twitter|thread)/i.test(text)) {
      return { type: 'content_writing', confidence: 0.75, label: 'Content Writing' };
    }
    
    // Story/Creative writing
    if (/(story|narrative|fiction|creative|poem|script|screenplay|dialogue|character|plot)/i.test(text)) {
      return { type: 'creative_writing', confidence: 0.8, label: 'Creative Writing' };
    }
    
    // Research/Analysis
    if (/(research|analyze|analysis|study|compare|contrast|evaluate|assess|review|summary|report|findings)/i.test(text)) {
      return { type: 'research_analysis', confidence: 0.7, label: 'Research & Analysis' };
    }
    
    // Emotional/Empathetic
    if (/(feel|feeling|emotion|emotional|empathy|support|help|advice|comfort|sorry|apologize|thank|grateful)/i.test(text) ||
        /(sad|happy|angry|frustrated|excited|anxious|worried|nervous|stressed|overwhelmed)/i.test(text)) {
      return { type: 'emotional_response', confidence: 0.8, label: 'Emotional Response' };
    }
    
    // Business/Strategy
    if (/(business|strategy|plan|proposal|pitch|deck|presentation|meeting|agenda|minutes|roadmap|timeline)/i.test(text)) {
      return { type: 'business_strategy', confidence: 0.75, label: 'Business Strategy' };
    }
    
    // General Q&A
    return { type: 'general_qa', confidence: 0.6, label: 'General Q&A' };
  }
  
  analyzeTone(text) {
    const lower = text.toLowerCase();
    
    // Professional tone indicators
    if (/(please|kindly|would.*you|could.*you|professional|business|formal|respectfully)/i.test(text) ||
        text.includes('?') && text.length > 50) {
      return 'professional';
    }
    
    // Casual tone indicators
    if (/(hey|hi|hello|thanks|thank you|cheers|quick|simple|easy|basic)/i.test(text) ||
        text.length < 30 && text.includes('?')) {
      return 'casual';
    }
    
    // Emotional tone indicators
    if (/(!{2,}|\?{2,}|😊|😢|😠|😂|❤️|💔|😭|😡)/.test(text) ||
        /(omg|wow|awesome|amazing|terrible|horrible|frustrating|exciting)/i.test(text)) {
      return 'emotional';
    }
    
    // Technical tone indicators
    if (/(technical|specification|requirement|parameter|configuration|implementation|architecture)/i.test(text) ||
        /\b(api|http|https|json|xml|database|server|client|frontend|backend)\b/i.test(text)) {
      return 'technical';
    }
    
    return 'neutral';
  }
  
  updateUI() {
    // Update intent badge in Card 1
    const intentBadge = document.getElementById('intentBadge');
    if (!intentBadge) return;
    
    if (this.currentIntent) {
      intentBadge.style.display = 'inline-flex';
      intentBadge.innerHTML = `
        <i class="fas ${this.getIntentIcon(this.currentIntent.type)}"></i>
        ${this.currentIntent.label}
        ${this.currentTone !== 'neutral' ? `<span class="tone-badge">${this.currentTone}</span>` : ''}
      `;
    } else {
      intentBadge.style.display = 'none';
    }
  }
  
  getIntentIcon(intentType) {
    const icons = {
      'image_generation': 'fa-image',
      'code_generation': 'fa-code',
      'email_writing': 'fa-envelope',
      'content_writing': 'fa-pen',
      'creative_writing': 'fa-feather-alt',
      'research_analysis': 'fa-chart-bar',
      'emotional_response': 'fa-heart',
      'business_strategy': 'fa-briefcase',
      'general_qa': 'fa-question-circle'
    };
    return icons[intentType] || 'fa-lightbulb';
  }
  
  notifyIfSignificantChange(intent, tone) {
    // Only notify on significant changes (not on every keystroke)
    if (intent?.confidence > 0.8) {
      notifications.info(`Detected: ${intent.label} (${tone} tone)`);
    }
  }
  
  getCurrentIntent() {
    return this.currentIntent;
  }
  
  getCurrentTone() {
    return this.currentTone;
  }
  
  getBestToolMatch() {
    if (!this.currentIntent) return null;
    
    const toolMatches = {
      'image_generation': { tool: 'dalle', name: 'DALL·E', reason: 'Best for image generation' },
      'code_generation': { tool: 'chatgpt', name: 'ChatGPT', reason: 'Excellent for coding assistance' },
      'email_writing': { tool: 'claude', name: 'Claude', reason: 'Great for professional writing' },
      'content_writing': { tool: 'chatgpt', name: 'ChatGPT', reason: 'Versatile for content creation' },
      'creative_writing': { tool: 'claude', name: 'Claude', reason: 'Strong creative writing capabilities' },
      'research_analysis': { tool: 'perplexity', name: 'Perplexity', reason: 'Research-focused with citations' },
      'emotional_response': { tool: 'chatgpt', name: 'ChatGPT', reason: 'Good at empathetic responses' },
      'business_strategy': { tool: 'claude', name: 'Claude', reason: 'Strong analytical thinking' },
      'general_qa': { tool: 'chatgpt', name: 'ChatGPT', reason: 'General purpose AI assistant' }
    };
    
    return toolMatches[this.currentIntent.type] || { tool: 'chatgpt', name: 'ChatGPT', reason: 'General purpose' };
  }
}

export const intentDetector = new IntentDetector();
