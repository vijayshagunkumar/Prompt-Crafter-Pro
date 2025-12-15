// In your existing event-handlers.js, ADD THESE FUNCTIONS:

let cardExpanderInstance = null;

export function initializeCardExpander() {
  if (cardExpanderInstance) {
    console.log('✅ Card expander already initialized');
    return cardExpanderInstance;
  }
  
  console.log('🔧 Initializing card expander from event handlers...');
  
  import('../features/card-expander.js').then(module => {
    const CardExpander = module.CardExpander;
    cardExpanderInstance = new CardExpander();
    cardExpanderInstance.initialize();
    window.cardExpander = cardExpanderInstance;
    
    console.log('✅ Card expander initialized successfully');
  }).catch(error => {
    console.error('❌ Failed to load card expander:', error);
  });
  
  return cardExpanderInstance;
}

// Then in your main initializeEventHandlers function, call it:
export function initializeEventHandlers(appState) {
  // Initialize card expander FIRST
  initializeCardExpander();
  
  // ... rest of your existing code stays here
  setupRequirementHandlers();
  setupOutputHandlers();
  setupToolHandlers();
  setupModalHandlers();
  setupVoiceHandlers();
  setupUIHandlers();
}
