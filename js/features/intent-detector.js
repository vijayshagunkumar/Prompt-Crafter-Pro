import { notifications } from '../ui/notifications.js';

export class IntentDetector {
  constructor() {
    this.currentIntents = [];
    this.currentTones = [];
    this.setup();
  }
  
  setup() {
    const input = document.getElementById('requirement');
    if (!input) return;
    
    let timeout;
    input.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this.analyze(e.target.value), 500);
    });
  }
  
  analyze(text) {
    if (!text.trim()) {
      this.clearDetection();
      return;
    }
    
    const lower = text.toLowerCase();
    this.currentIntents = this.detectIntents(lower, text);
    this.currentTones = this.detectTones(lower, text);
    
    this.updateDisplay();
    
    // Notify if high confidence detection
    if (this.currentIntents.some(i => i.confidence > 0.7)) {
      const primaryIntent = this.currentIntents[0];
      const primaryTone = this.currentTones[0];
      notifications.info(
        `Detected: ${primaryIntent.label} (${primaryTone.label} tone)`, 
        2000
      );
    }
  }
  
  detectIntents(lowerText, fullText) {
    const intents = [];
    
    // Visual/Image Creation
    if (/(generate|create|make).*(image|picture|photo|art|drawing|visual|graphic|logo|design)/i.test(fullText) ||
        /(image|picture|photo|art|design) of/i.test(fullText)) {
      intents.push({
        type: 'visual',
        label: 'Visual Creation',
        confidence: this.calcConfidence(fullText, ['image', 'picture', 'art', 'design', 'generate', 'create']),
        icon: 'fa-image',
        color: '#8b5cf6'
      });
    }
    
    // Code/Programming
    if (/(code|program|script|function|algorithm|api|sql|query|bug|debug|python|javascript|java|html|css)/i.test(fullText) ||
        /\b(def |function |class |import |export |const |let |var )/i.test(fullText)) {
      intents.push({
        type: 'code',
        label: 'Code Generation',
        confidence: this.calcConfidence(fullText, ['code', 'function', 'python', 'javascript', 'sql', 'bug']),
        icon: 'fa-code',
        color: '#10b981'
      });
    }
    
    // Writing/Content
    if (/(write|create|draft|compose|email|letter|message|blog|article|post|content|copy|story|creative)/i.test(fullText)) {
      intents.push({
        type: 'writing',
        label: 'Writing Task',
        confidence: this.calcConfidence(fullText, ['write', 'email', 'blog', 'article', 'content', 'story']),
        icon: 'fa-pen',
        color: '#3b82f6'
      });
    }
    
    // Analysis/Research
    if (/(analyze|analysis|research|study|compare|evaluate|review|summary|report|data|statistics)/i.test(fullText)) {
      intents.push({
        type: 'analysis',
        label: 'Analysis',
        confidence: this.calcConfidence(fullText, ['analyze', 'research', 'data', 'report', 'study']),
        icon: 'fa-chart-bar',
        color: '#f59e0b'
      });
    }
    
    // Business/Strategy
    if (/(business|strategy|plan|proposal|pitch|presentation|marketing|sales|meeting|agenda)/i.test(fullText)) {
      intents.push({
        type: 'business',
        label: 'Business',
        confidence: this.calcConfidence(fullText, ['business', 'strategy', 'plan', 'marketing', 'sales']),
        icon: 'fa-briefcase',
        color: '#ef4444'
      });
    }
    
    // Learning/Explanation
    if (/(explain|teach|learn|understand|how to|what is|why does|tutorial|guide)/i.test(fullText)) {
      intents.push({
        type: 'learning',
        label: 'Learning',
        confidence: this.calcConfidence(fullText, ['explain', 'teach', 'how', 'what', 'why']),
        icon: 'fa-graduation-cap',
        color: '#06b6d4'
      });
    }
    
    // Sort by confidence
    return intents.sort((a, b) => b.confidence - a.confidence);
  }
  
  detectTones(lowerText, fullText) {
    const tones = [];
    
    // Professional
    if (/(please|kindly|would you|could you|professional|formal|respectfully|sincerely)/i.test(fullText) ||
        (fullText.includes('?') && fullText.length > 80)) {
      tones.push({
        type: 'professional',
        label: 'Professional',
        confidence: this.calcConfidence(fullText, ['please', 'professional', 'formal']),
        icon: 'fa-suitcase'
      });
    }
    
    // Casual
    if (/(hey|hi|hello|thanks|thank you|cheers|cool|awesome|great)/i.test(fullText) ||
        fullText.length < 40) {
      tones.push({
        type: 'casual',
        label: 'Casual',
        confidence: this.calcConfidence(fullText, ['hey', 'hi', 'thanks', 'cool']),
        icon: 'fa-smile'
      });
    }
    
    // Emotional
    if (/(!{2,}|\?{2,}|😊|😢|😠|😂|❤️|💔|omg|wow|amazing|terrible|love|hate)/.test(fullText)) {
      tones.push({
        type: 'emotional',
        label: 'Emotional',
        confidence: this.calcConfidence(fullText, ['!', '?', '😊', 'omg', 'wow', 'love']),
        icon: 'fa-heart'
      });
    }
    
    // Technical
    if (/(technical|specification|parameter|configuration|api|json|xml|database|server)/i.test(fullText)) {
      tones.push({
        type: 'technical',
        label: 'Technical',
        confidence: this.calcConfidence(fullText, ['technical', 'api', 'json', 'database']),
        icon: 'fa-cog'
      });
    }
    
    // Urgent
    if (/(urgent|asap|immediately|right now|quickly|emergency|deadline)/i.test(fullText)) {
      tones.push({
        type: 'urgent',
        label: 'Urgent',
        confidence: this.calcConfidence(fullText, ['urgent', 'asap', 'emergency', 'deadline']),
        icon: 'fa-clock'
      });
    }
    
    // Default to neutral
    if (tones.length === 0) {
      tones.push({
        type: 'neutral',
        label: 'Neutral',
        confidence: 0.5,
        icon: 'fa-comment'
      });
    }
    
    return tones.sort((a, b) => b.confidence - a.confidence);
  }
  
  calcConfidence(text, keywords) {
    const lower = text.toLowerCase();
    let matches = 0;
    keywords.forEach(kw => {
      if (lower.includes(kw.toLowerCase())) matches++;
    });
    return Math.min(matches / keywords.length, 0.95);
  }
  
  updateDisplay() {
    const badge = document.getElementById('intentBadge');
    if (!badge) return;
    
    if (this.currentIntents.length === 0) {
      badge.style.display = 'none';
      return;
    }
    
    badge.style.display = 'flex';
    
    // Show top 2 intents and top tone
    const topIntents = this.currentIntents.slice(0, 2);
    const topTone = this.currentTones[0];
    
    let html = '';
    topIntents.forEach(intent => {
      if (intent.confidence > 0.3) {
        html += `
          <span class="intent-tag" style="background:${intent.color}15; border-color:${intent.color}30;">
            <i class="fas ${intent.icon}"></i> ${intent.label}
          </span>
        `;
      }
    });
    
    if (topTone && topTone.confidence > 0.4 && topTone.type !== 'neutral') {
      html += `
        <span class="tone-tag">
          <i class="fas ${topTone.icon}"></i> ${topTone.label}
        </span>
      `;
    }
    
    badge.innerHTML = html;
  }
  
  clearDetection() {
    this.currentIntents = [];
    this.currentTones = [];
    const badge = document.getElementById('intentBadge');
    if (badge) badge.style.display = 'none';
  }
  
  getPrimaryIntent() {
    return this.currentIntents[0] || null;
  }
  
  getPrimaryTone() {
    return this.currentTones[0] || null;
  }
}

export const intentDetector = new IntentDetector();
