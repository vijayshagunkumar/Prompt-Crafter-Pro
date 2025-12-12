/* main.css - Main CSS file */

/* Import base styles */
@import url('base/reset.css');
@import url('base/variables.css');
@import url('base/typography.css');

/* Import component styles */
@import url('components/sidebar.css');
@import url('components/cards.css');
@import url('components/buttons.css');
@import url('components/forms.css');
@import url('components/modals.css');
@import url('components/tools-grid.css');

/* Import layout styles */
@import url('layouts/grid.css');
@import url('layouts/responsive.css');

/* Import theme styles */
@import url('themes/themes.css');
@import url('themes/cyberpunk.css');

/* ===========================================
   MAIN APP LAYOUT
   =========================================== */

/* App Shell */
.app-shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background: var(--bg-body);
}

/* Main Panel */
.main-panel {
  padding: 30px;
  overflow-y: auto;
  background: var(--bg-body);
}

/* Top Bar */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.page-title h2 {
  font-size: 28px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.page-title p {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}

.top-right {
  display: flex;
  gap: 12px;
}

/* Hero Section */
.hero {
  margin-bottom: 40px;
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 30px;
  margin-bottom: 20px;
}

.hero-top h1 {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
  line-height: 1.2;
}

.hero-top p {
  font-size: 18px;
  color: var(--text-secondary);
  max-width: 700px;
  line-height: 1.5;
  margin-bottom: 0;
}

.hero-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Workflow */
.workflow {
  margin-top: 30px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  align-items: stretch;
}

/* Step Cards - FIXED HEIGHTS */
.step-card {
  background: var(--panel-bg);
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  padding: 30px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 700px;
  position: relative;
  overflow: visible;
}

.step-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 25px;
}

.step-header-main h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.step-header-main p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* Auto-row */
.auto-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
}

/* Chip Row */
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

/* CHIP STYLES - FIXED VISIBILITY */
.chip {
  padding: 10px 16px;
  background: rgba(255, 94, 0, 0.1);
  color: #FF5E00 !important; /* Force orange color */
  border-radius: 8px;
  border: 1px solid rgba(255, 94, 0, 0.3);
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.chip:hover {
  background: rgba(255, 94, 0, 0.2);
  color: #FF8C42 !important;
  transform: translateY(-2px);
}

.chip i {
  font-size: 12px;
  color: #FF5E00 !important;
}

.context-chip {
  background: rgba(0, 243, 255, 0.1) !important;
  border-color: rgba(0, 243, 255, 0.3) !important;
  color: #00F3FF !important; /* Force cyan color */
}

.context-chip i {
  color: #00F3FF !important;
}

/* Preset Row */
.preset-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.preset-left {
  flex: 1;
}

.preset-right {
  display: flex;
  align-items: center;
}

/* Tools Grid */
.tools-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 25px 0;
}

/* Actions Row */
.actions-row {
  margin-top: 25px;
}

/* Helper Text - FIXED SIZE */
.helper-text {
  font-size: 13px !important;
  line-height: 1.4;
  color: var(--text-muted);
}

/* Notification */
.notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: rgba(30, 41, 59, 0.95);
  color: #00F3FF;
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
  display: none;
  align-items: center;
  gap: 12px;
  z-index: 1080;
  border: 1px solid #00F3FF;
  backdrop-filter: blur(10px);
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.notification.show {
  display: flex;
  animation: slideInUp 0.3s ease;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .step-card:nth-child(3) {
    grid-column: span 2;
    min-height: 550px;
  }
}

@media (max-width: 768px) {
  .app-shell {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    display: none;
  }
  
  .main-panel {
    padding: 20px;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .step-card:nth-child(3) {
    grid-column: span 1;
  }
  
  .step-card {
    min-height: 600px;
    padding: 20px;
  }
  
  .hero-top {
    flex-direction: column;
    gap: 20px;
  }
  
  .hero-top h1 {
    font-size: 28px;
  }
  
  .hero-top p {
    font-size: 16px;
  }
  
  .top-bar {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }
  
  .top-right {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .main-panel {
    padding: 15px;
  }
  
  .step-card {
    padding: 15px;
    min-height: 550px;
  }
  
  .hero-top h1 {
    font-size: 24px;
  }
  
  .hero-badges {
    flex-direction: column;
  }
  
  .tools-grid {
    gap: 10px;
  }
  
  .tool-card {
    padding: 15px;
  }
}
