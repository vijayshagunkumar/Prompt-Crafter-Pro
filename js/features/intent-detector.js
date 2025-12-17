import { notifications } from '../ui/notifications.js';

export class IntentDetector {
  constructor() {
    this.currentIntents = [];
    this.currentAttributes = [];
    this.currentTone = null;
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
    
    // Detect multiple intents
    this.currentIntents = this.detectMultipleIntents(text);
    
    // Detect tone
    this.currentTone = this.detectTone(text);
    
    // Detect multiple attributes
    this.currentAttributes = this.detectAttributes(text);
    
    this.updateDisplay();
    
    // Show notification if significant detection
    if (this.currentIntents.length > 0 || this.currentAttributes.length > 0) {
      const detectedItems = [];
      if (this.currentIntents.length > 0) {
        detectedItems.push(this.currentIntents[0].label);
      }
      if (this.currentAttributes.length > 0) {
        detectedItems.push(`${this.currentAttributes.length} attributes`);
      }
      
      notifications.info(`Detected: ${detectedItems.join(', ')}`, 2000);
    }
  }
  
  detectMultipleIntents(text) {
    const intents = [];
    const lower = text.toLowerCase();
    
    // Visual/Image intent
    if (/(image|picture|photo|art|drawing|visual|graphic|logo|illustration|portrait|sketch)/i.test(text)) {
      intents.push({
        type: 'visual',
        label: 'Visual Creation',
        confidence: this.calcConfidence(text, ['image', 'picture', 'art', 'drawing', 'visual']),
        icon: 'fa-image',
        color: '#8b5cf6'
      });
    }
    
    // Code intent
    if (/(code|program|script|function|algorithm|api|sql|python|javascript|java|html|css|react|vue)/i.test(text)) {
      intents.push({
        type: 'code',
        label: 'Code Generation',
        confidence: this.calcConfidence(text, ['code', 'function', 'python', 'javascript', 'sql']),
        icon: 'fa-code',
        color: '#10b981'
      });
    }
    
    // Writing intent
    if (/(write|email|letter|blog|article|post|content|copy|story|creative|draft)/i.test(text)) {
      intents.push({
        type: 'writing',
        label: 'Writing Task',
        confidence: this.calcConfidence(text, ['write', 'email', 'blog', 'article', 'content']),
        icon: 'fa-pen',
        color: '#3b82f6'
      });
    }
    
    // Analysis intent
    if (/(analyze|analysis|research|study|compare|evaluate|review|summary|report|data)/i.test(text)) {
      intents.push({
        type: 'analysis',
        label: 'Analysis',
        confidence: this.calcConfidence(text, ['analyze', 'research', 'data', 'report', 'study']),
        icon: 'fa-chart-bar',
        color: '#f59e0b'
      });
    }
    
    // Business intent
    if (/(business|strategy|plan|proposal|pitch|presentation|marketing|sales|meeting)/i.test(text)) {
      intents.push({
        type: 'business',
        label: 'Business',
        confidence: this.calcConfidence(text, ['business', 'strategy', 'plan', 'marketing', 'sales']),
        icon: 'fa-briefcase',
        color: '#ef4444'
      });
    }
    
    return intents.sort((a, b) => b.confidence - a.confidence);
  }
  
  detectAttributes(text) {
    const attributes = [];
    const lower = text.toLowerCase();
    
    // Character types
    const characterTypes = this.extractCharacters(text);
    if (characterTypes.length > 0) {
      attributes.push({
        type: 'character',
        label: 'Character',
        values: characterTypes,
        icon: 'fa-user'
      });
    }
    
    // Object types
    const objectTypes = this.extractObjects(text);
    if (objectTypes.length > 0) {
      attributes.push({
        type: 'object',
        label: 'Object',
        values: objectTypes,
        icon: 'fa-cube'
      });
    }
    
    // Context/Place
    const contextTypes = this.extractContext(text);
    if (contextTypes.length > 0) {
      attributes.push({
        type: 'context',
        label: 'Context',
        values: contextTypes,
        icon: 'fa-map-marker'
      });
    }
    
    return attributes;
  }
  
  extractCharacters(text) {
    const characters = [];
    const lower = text.toLowerCase();
    
    const characterKeywords = {
      'male': ['man', 'boy', 'gentleman', 'male', 'guy'],
      'female': ['woman', 'girl', 'lady', 'female'],
      'cartoon': ['cartoon', 'animated', 'anime', 'manga'],
      'child': ['child', 'kid', 'baby', 'toddler'],
      'elderly': ['old', 'elder', 'senior', 'grandparent']
    };
    
    for (const [charType, keywords] of Object.entries(characterKeywords)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        characters.push(charType);
      }
    }
    
    return characters.slice(0, 3); // Limit to 3
  }
  
  extractObjects(text) {
    const objects = [];
    const lower = text.toLowerCase();
    
    const objectKeywords = {
      'animal': ['dog', 'cat', 'bird', 'lion', 'tiger', 'elephant', 'animal', 'pet'],
      'fruit': ['apple', 'banana', 'orange', 'fruit', 'berry', 'grape'],
      'vehicle': ['car', 'bike', 'motorcycle', 'vehicle', 'truck', 'bus'],
      'building': ['house', 'building', 'office', 'school', 'hospital'],
      'nature': ['tree', 'flower', 'mountain', 'river', 'ocean', 'forest']
    };
    
    for (const [objType, keywords] of Object.entries(objectKeywords)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        objects.push(objType);
      }
    }
    
    return objects.slice(0, 3); // Limit to 3
  }
  
  extractContext(text) {
    const contexts = [];
    const lower = text.toLowerCase();
    
    const contextKeywords = {
      'indoor': ['room', 'home', 'office', 'kitchen', 'bedroom', 'indoor', 'inside'],
      'outdoor': ['outside', 'outdoor', 'garden', 'park', 'street', 'beach'],
      'urban': ['city', 'urban', 'street', 'building', 'skyscraper'],
      'nature': ['forest', 'mountain', 'river', 'lake', 'nature', 'wilderness'],
      'fantasy': ['magic', 'fantasy', 'dragon', 'castle', 'wizard', 'elf']
    };
    
    for (const [contextType, keywords] of Object.entries(contextKeywords)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        contexts.push(contextType);
      }
    }
    
    return contexts.slice(0, 3); // Limit to 3
  }
  
  detectTone(text) {
    const lower = text.toLowerCase();
    
    if (/(please|kindly|would you|could you|professional|formal|respectfully)/i.test(text)) {
      return {
        type: 'professional',
        label: 'Professional',
        confidence: 0.8,
        icon: 'fa-suitcase'
      };
    } else if (/(hey|hi|hello|thanks|thank you|cheers|cool|awesome|great)/i.test(text)) {
      return {
        type: 'casual',
        label: 'Casual',
        confidence: 0.7,
        icon: 'fa-smile'
      };
    } else if (/(urgent|asap|immediately|right now|quickly|emergency|deadline)/i.test(text)) {
      return {
        type: 'urgent',
        label: 'Urgent',
        confidence: 0.9,
        icon: 'fa-clock'
      };
    } else if (/(love|adore|cherish|heart|❤️|💕|miss you)/i.test(text)) {
      return {
        type: 'emotional',
        label: 'Emotional',
        confidence: 0.8,
        icon: 'fa-heart'
      };
    }
    
    return {
      type: 'neutral',
      label: 'Neutral',
      confidence: 0.5,
      icon: 'fa-comment'
    };
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
    
    if (this.currentIntents.length === 0 && this.currentAttributes.length === 0 && !this.currentTone) {
      badge.style.display = 'none';
      return;
    }
    
    badge.style.display = 'flex';
    badge.className = 'intent-badge';
    
    let html = '';
    
    // Add detection header
    html += `<div class="detection-header">
              <i class="fas fa-bolt"></i>
              <span>Analysis Results</span>
            </div>`;
    
    // Add intents
    if (this.currentIntents.length > 0) {
      html += `<div class="intent-items">`;
      this.currentIntents.slice(0, 2).forEach(intent => {
        if (intent.confidence > 0.3) {
          html += `
            <div class="intent-item" data-type="${intent.type}">
              <i class="fas ${intent.icon}"></i>
              <span>${intent.label}</span>
              <span class="confidence-indicator ${this.getConfidenceClass(intent.confidence)}"></span>
            </div>`;
        }
      });
      html += `</div>`;
    }
    
    // Add tone
    if (this.currentTone && this.currentTone.confidence > 0.4 && this.currentTone.type !== 'neutral') {
      html += `
        <div class="tone-badge" data-tone="${this.currentTone.type}">
          <i class="fas ${this.currentTone.icon}"></i>
          <span>${this.currentTone.label} tone</span>
        </div>`;
    }
    
    // Add multiple attributes
    if (this.currentAttributes.length > 0) {
      html += `<div class="detection-grid">`;
      
      this.currentAttributes.forEach(attribute => {
        if (attribute.values.length > 0) {
          html += `
            <div class="detection-category">
              <i class="fas ${attribute.icon}"></i>
              ${attribute.label}
            </div>
            <div class="detection-values">`;
          
          attribute.values.slice(0, 2).forEach(value => {
            html += `
              <span class="attribute-tag" data-attribute="${attribute.type}">
                ${value}
              </span>`;
          });
          
          html += `</div>`;
        }
      });
      
      html += `</div>`;
    }
    
    badge.innerHTML = html;
  }
  
  getConfidenceClass(confidence) {
    if (confidence > 0.7) return 'confidence-high';
    if (confidence > 0.4) return 'confidence-medium';
    return 'confidence-low';
  }
  
  clearDetection() {
    this.currentIntents = [];
    this.currentAttributes = [];
    this.currentTone = null;
    const badge = document.getElementById('intentBadge');
    if (badge) badge.style.display = 'none';
  }
}

export const intentDetector = new IntentDetector();
