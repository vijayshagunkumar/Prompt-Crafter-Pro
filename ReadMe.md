Prompt-Crafter-Pro
├── css
│   ├── components.css        # Reusable UI components
│   ├── main.css              # Core layout and global styles
│   ├── themes.css            # Theme definitions (dark/light/etc.)
│   └── ui-components.css     # Buttons, cards, modals, controls
│
├── js
│   ├── app-bundle.js         # Bundled production-ready script
│   ├── app.js                # Application bootstrap & initialization
│   ├── state.js              # Global state management
│   │
│   ├── modules               # Core feature modules
│   │   ├── ai-ranker.js      # AI tool ranking & recommendation logic
│   │   ├── history-manager.js# Prompt history handling
│   │   ├── intent-detector.js# User intent analysis
│   │   ├── prompt-generator.js# Structured prompt generation engine
│   │   ├── template-manager.js# Prompt templates handling
│   │   ├── theme-manager.js  # Theme switching & persistence
│   │   └── voice-manager.js  # Voice input & speech handling
│   │
│   ├── services              # External & internal services
│   │   ├── api-service.js    # API interaction layer
│   │   ├── notification-service.js # Toasts, alerts, messages
│   │   └── storage-service.js# Local/session storage abstraction
│   │
│   ├── utils                 # Utility helpers
│   │   ├── constants.js      # App-wide constants
│   │   ├── debounce.js       # Debounce utilities
│   │   └── helpers.js        # Common helper functions
│
├── index.html                # Application entry point
└── README.md                 # Project documentation
