// In your event-handlers.js, add this simple function:
let cardExpanderInstance = null;

export function initializeCardExpander() {
  if (cardExpanderInstance) {
    console.log('✅ Card Expander already initialized in event-handlers');
    return cardExpanderInstance;
  }
  
  console.log('🔧 Event Handlers: Initializing Card Expander...');
  
  // Import and initialize
  import('../features/card-expander.js').then(module => {
    const CardExpander = module.CardExpander;
    cardExpanderInstance = new CardExpander();
    cardExpanderInstance.initialize();
    window.cardExpander = cardExpanderInstance;
    
    console.log('✅ Event Handlers: Card Expander initialized');
  }).catch(error => {
    console.error('❌ Failed to load CardExpander:', error);
  });
  
  return cardExpanderInstance;
}

// In your initializeEventHandlers function:
export function initializeEventHandlers(appState) {
  // Initialize card expander
  initializeCardExpander();
  
  // ... keep your existing code below
  // DON'T add any other card expander code here
}
