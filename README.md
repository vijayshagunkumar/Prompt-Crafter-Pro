## 📁 Project Structure

The project follows a modular and scalable folder structure to ensure clean separation of concerns, easier maintenance, and future extensibility.

```
Prompt-Crafter-Pro/
│
├── README.md                 # Project documentation
├── index.html                # Main application entry point
├── settings-modal.html       # Settings modal markup
│
├── assets/                   # Static assets
│   ├── icons/                # App icons and favicons
│   └── images/               # Images and logos
│
├── css/                      # Stylesheets
│   ├── base/                 # Base styles and variables
│   ├── components/           # Component-level styles
│   ├── layouts/              # Layout and grid system
│   ├── themes/               # Theme definitions
│   ├── main.css              # Global stylesheet
│   └── emergency-fix.css     # Temporary fixes / overrides
│
├── js/                       # JavaScript source code
│   ├── app.js                # Application bootstrap
│   ├── emergency-fix.js      # Hotfix logic
│   │
│   ├── ai/                   # AI-related logic
│   │   ├── ai-tools.js       # AI tool integrations
│   │   ├── presets.js        # Prompt presets
│   │   └── prompt-generator.js # Core prompt generation logic
│   │
│   ├── core/                 # Core app utilities
│   │   ├── app-state.js      # Global state management
│   │   ├── constants.js      # Application constants
│   │   └── utilities.js      # Helper utilities
│   │
│   ├── features/             # Feature-specific modules
│   │   ├── card-expander.js  # Card maximize/minimize logic
│   │   ├── context-detective.js # Auto context detection
│   │   ├── history.js        # Prompt history handling
│   │   ├── templates.js      # Prompt templates
│   │   └── voice.js          # Voice input/output support
│   │
│   └── ui/                   # UI interaction logic
│       ├── event-handlers.js # DOM event bindings
│       ├── modal-manager.js  # Modal lifecycle handling
│       ├── notifications.js # UI notifications
│       ├── settings-manager.js # Settings persistence
│       └── theme-manager.js  # Theme switching logic
```

---

### 🧩 Architectural Highlights

* **Separation of concerns**: UI, features, core logic, and AI modules are clearly isolated
* **Scalable CSS architecture**: Base → Components → Layouts → Themes
* **Feature-driven JS design**: Each major capability lives in its own module
* **Future-ready**: Easy to add new AI tools, themes, or UI features without breaking existing code

---
14 directories, 45 files
bash: .: filename argument required
## Features
- Convert natural language requirements to structured prompts
- Multiple preset styles (Standard, Claude, ChatGPT, Detailed)
- Template library
- Auto-convert as you type
- History tracking
- Export to various AI tools

## Setup
1. Clone the repository
2. Open `index.html` in a browser
3. Start crafting prompts!

## Usage
1. Type your requirement in the input box
2. Select a prompt style
3. Get your structured prompt
4. Copy to clipboard or export to your favorite AI tool

## File Structure

Perfect 👍
I’ll add **two high-value sections** that fit your repo and look professional on GitHub:

1️⃣ **High-Level Architecture**
2️⃣ **Tech Stack**

You can paste these **directly below the Project Structure section** in `README.md`.

---

## 🏗 High-Level Architecture

Prompt-Crafter-Pro is a **pure front-end, modular web application** designed around feature isolation and clean UI–logic separation.

```
User Input
   │
   ▼
UI Layer (HTML / CSS)
   │
   ▼
Event Handlers (ui/)
   │
   ▼
Feature Modules (features/)
   │
   ├── Context Detection
   ├── Card Expansion
   ├── Voice Input
   ├── Templates & History
   │
   ▼
Core Logic (core/)
   │
   ├── State Management
   ├── Constants
   └── Utilities
   │
   ▼
AI Engine (ai/)
   │
   ├── Prompt Generator
   ├── Presets
   └── AI Tool Mapping
   │
   ▼
Structured Prompt Output
```

### 🔹 Key Design Principles

* **Feature-driven architecture** – each capability is self-contained
* **No framework lock-in** – vanilla JS for maximum control and performance
* **State-aware UI** – centralized app state avoids DOM chaos
* **Theme & settings isolation** – UI customization without logic coupling

---

## 🧰 Tech Stack

### 🌐 Frontend

* **HTML5** – semantic markup
* **CSS3** – modular, layered architecture
* **Vanilla JavaScript (ES6+)** – no framework dependency

### 🎨 Styling Strategy

* Base styles & resets
* Component-level CSS
* Grid & responsive layouts
* Theme-based styling (Cyberpunk / future themes)

### 🧠 Application Design

* Modular JS folders (`core`, `features`, `ui`, `ai`)
* Centralized state management
* Event-driven UI updates

### 🎙 Advanced Capabilities

* **Web Speech API** – voice input & output
* **LocalStorage** – settings, themes, and history persistence
* **Dynamic prompt generation** – AI-tool-agnostic design

### 🛠 Tooling & Platform

* **GitHub** – source control
* **GitHub Codespaces** – browser-based development
* **Netlify** (optional) – deployment & hosting

---

## 🚀 What I recommend adding next (optional but powerful)

You can choose **one** and I’ll write it fully:

1️⃣ **Features Overview** (bullet list of what PromptCraft does)
2️⃣ **How It Works** (step-by-step user flow)
3️⃣ **Future Roadmap** (AI integrations, mobile, monetization)
4️⃣ **Screenshots / GIF section** (very strong for GitHub stars ⭐)

Just tell me the number 👉 **1 / 2 / 3 / 4**
