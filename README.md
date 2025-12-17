## 🏗️ Architecture

PromptCraft follows a **modular, scalable, and separation-of-concerns–driven architecture**.
The codebase is organized to keep **UI, core logic, AI integrations, and assets clearly isolated**, enabling faster iteration, easier debugging, and long-term maintainability.

Replace your Project Structure section with this
### 📁 Project Structure

```text
Prompt-Crafter-Pro/
@vijayshagunkumar ➜ /workspaces/Prompt-Crafter-Pro (main) $ ls
README.md  assets  css  index.html  js  settings-modal.html
@vijayshagunkumar ➜ /workspaces/Prompt-Crafter-Pro (main) $ tree
.
├── README.md
├── assets
│   ├── icons
│   │   ├── abc.ico
│   │   ├── chatgpt.svg
│   │   ├── claude.svg
│   │   ├── copilot.svg
│   │   ├── deepseek.svg
│   │   ├── favicon.ico
│   │   ├── gemini.svg
│   │   ├── grok.svg
│   │   ├── midjourney.svg
│   │   └── perplexity.svg
│   └── images
│       ├── img.jpg
│       └── logo.png
├── css
│   ├── base
│   │   ├── reset.css
│   │   ├── typography.css
│   │   ├── variable-mapping.css
│   │   └── variables.css
│   ├── components
│   │   ├── ai-tools-cards.css
│   │   ├── auto-detection.css
│   │   ├── buttons.css
│   │   ├── cards.css
│   │   ├── forms.css
│   │   ├── modals.css
│   │   ├── notifications.css
│   │   ├── sidebar.css
│   │   └── tools-grid.css
│   ├── layouts
│   │   ├── grid-system.css
│   │   ├── grid.css
│   │   ├── responsive.css
│   │   └── sidebar-layout.css
│   ├── main.css
│   └── themes
│       ├── cyberpunk.css
│       └── themes.css
├── index.html
├── js
│   ├── ai
│   │   ├── ai-tools.js
│   │   ├── presets.js
│   │   └── prompt-generator.js
│   ├── app.js
│   ├── core
│   │   ├── app-state.js
│   │   ├── constants.js
│   │   └── utilities.js
│   ├── features
│   │   ├── card-expander.js
│   │   ├── card-maximizer.js
│   │   ├── context-detective.js
│   │   ├── export-handler.js
│   │   ├── history.js
│   │   ├── intent-detector.js
│   │   ├── launch-buttons.js
│   │   ├── presets.js
│   │   ├── prompt-converter.js
│   │   ├── templates.js
│   │   ├── tool-prioritizer.js
│   │   ├── voice-handler.js
│   │   └── voice.js
│   └── ui
│       ├── event-handlers.js
│       ├── modal-manager.js
│       ├── notifications.js
│       ├── settings-manager.js
│       └── theme-manager.js
└── settings-modal.html

### 🧠 Architectural Principles

* **Separation of Concerns**
  UI, features, AI logic, and core state are isolated into dedicated modules.

* **Modular & Extensible**
  New AI tools, themes, or features can be added without touching existing code.

* **Vanilla JS, No Framework Lock-in**
  Keeps the app lightweight, fast, and easy to reason about.

* **Single Entry Points**

  * `css/main.css` → global style aggregation
  * `js/app.js` → application bootstrap

* **Future-Ready**
  Structure supports:

  * Build tools (Vite / Webpack)
  * Server-side APIs
  * Plugin-based AI tools
  * Mobile or desktop wrappers

---

If you want next, I can:

* Add a **“Data Flow” diagram section**
* Add **“How files interact” explanation**
* Add **Production / Build strategy**
* Convert this into **portfolio-ready documentation**

Just tell me.


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

Excellent choice 👍
Here’s a **clean, powerful “Features Overview” section** tailored specifically for **Prompt-Crafter-Pro**, written in a way that looks **professional, product-grade, and GitHub-ready**.

You can paste this **directly after Tech Stack** in `README.md`.

---

## ✨ Features Overview

Prompt-Crafter-Pro is an intelligent prompt-engineering assistant designed to help users convert raw ideas into **clear, structured, high-quality prompts** for multiple AI tools.

### 🧠 Core Prompt Intelligence

* Converts free-form user ideas into **structured prompts**
* Enforces clear sections such as **Role, Objective, Context, Instructions, and Output Format**
* Improves clarity, completeness, and AI response quality

### 🤖 Multi-AI Tool Support

* Tool-agnostic prompt generation
* Supports prompts optimized for multiple AI platforms
* Centralized mapping of AI tools and prompt presets

### 🧩 Auto Context Detection

* Automatically detects the **use-case and intent** from user input
* Suggests relevant structure and prompt style
* Reduces manual effort and prompt guesswork

### 📚 Prompt Templates & Presets

* Pre-built prompt templates for common scenarios
* Reusable presets to speed up prompt creation
* Easy extension for new templates

### 🎙 Voice Input & Output

* Voice-to-text input using Web Speech API
* Optional text-to-speech output for generated prompts
* Hands-free prompt creation experience

### 🖼 Interactive Card-Based UI

* Clean, modern card layout for input and output
* Maximize / minimize cards for focused work
* Responsive design across screen sizes

### 🌓 Theme & UI Customization

* Theme switching (Cyberpunk and future themes)
* Persistent user preferences via local storage
* Modular styling for easy UI evolution

### 🕘 Prompt History & Reusability

* Automatically stores generated prompts
* Allows users to revisit and reuse past prompts
* Improves productivity over time

### 🔔 UI Notifications & Feedback

* Real-time feedback for user actions
* Non-intrusive notifications for better UX
* Clear visual cues for state changes

### ⚙️ Settings & Configuration

* Centralized settings modal
* Manage themes, voice options, and preferences
* Clean separation between settings and core logic

---

### 🎯 Who Is This For?

* Prompt engineers
* Developers & product managers
* Content creators
* AI power users and beginners




---

