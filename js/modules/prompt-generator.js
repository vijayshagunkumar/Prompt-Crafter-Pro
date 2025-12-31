class PromptGenerator {
    constructor() {
        this.currentPreset = "default";
        this.userPresetLocked = false;
        this.lastPresetSource = "auto";
        this.lastTaskLabel = "General";
        this.lastRole = "expert assistant";
    }

    setPreset(presetId) {
        if (!window.PRESETS || !window.PRESETS[presetId]) return;
        
        this.currentPreset = presetId;
        this.userPresetLocked = true;
        this.lastPresetSource = "manual";
        
        return presetId;
    }

    getPreset(presetId = null) {
        const preset = presetId || this.currentPreset;
        return window.PRESETS[preset] || window.PRESETS.default;
    }

    generate(requirement, role = null, preset = null) {
        if (!requirement || !requirement.trim()) return "";
        
        const intentDetector = new (window.IntentDetector || (() => {
            // Fallback if intent detector not loaded
            return { getRoleAndPreset: () => ({ role: "expert assistant", preset: "default", label: "General" }) };
        }))();
        
        const { role: detectedRole, preset: detectedPreset } = intentDetector.getRoleAndPreset(requirement);
        
        const finalRole = role || detectedRole || this.lastRole;
        const finalPreset = preset || detectedPreset || this.currentPreset;
        
        if (!this.userPresetLocked && detectedPreset && window.PRESETS[detectedPreset]) {
            this.currentPreset = detectedPreset;
            this.lastPresetSource = "auto";
        }
        
        this.lastRole = finalRole;
        this.lastTaskLabel = intentDetector.getRoleAndPreset(requirement).label;
        
        const presetFunction = this.getPreset(finalPreset);
        if (typeof presetFunction === 'function') {
            return presetFunction(finalRole, requirement);
        }
        
        // Fallback to default if preset is not a function
        return window.PRESETS.default(finalRole, requirement);
    }

    sanitizePrompt(text) {
        if (!text) return "";
        let cleaned = text;

        // Remove code block markers
        cleaned = cleaned.replace(/^```[^\n]*\n?/g, "");
        cleaned = cleaned.replace(/```$/g, "");

        const forbiddenLineRegex =
            /(prompt generator|generate a prompt|convert .*requirement .*prompt|rewrite .*prompt|rewrite .*requirement)/i;

        cleaned = cleaned
            .split("\n")
            .filter((line) => {
                const trimmed = line.trim();
                if (/^```/.test(trimmed)) return false;
                if (forbiddenLineRegex.test(trimmed)) return false;
                return true;
            })
            .join("\n");

        cleaned = cleaned.replace(/prompt generator/gi, "assistant");
        cleaned = cleaned.replace(
            /generate a prompt/gi,
            "perform the task and return the final answer"
        );

        return cleaned.trim();
    }

    async generateWithAI(requirement, model = null) {
        if (!requirement || !requirement.trim()) {
            throw new Error("Requirement is required");
        }

        try {
            const selectedModel = model || localStorage.getItem("promptcrafter_model") || "gemini-1.5-flash";
            const modelName = window.MODEL_CONFIG?.[selectedModel]?.name || selectedModel;
            
            console.log(`Generating with model: ${selectedModel} (${modelName})`);

            // Call Cloudflare Worker
            const WORKER_URL = window.API_CONFIG?.WORKER_URL || "https://promptcraft-api.vijay-shagunkumar.workers.dev";
            const API_KEY = window.API_CONFIG?.DEFAULT_API_KEY || "promptcraft-app-secret-123";
            
            const response = await fetch(WORKER_URL, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "x-api-key": API_KEY
                },
                body: JSON.stringify({ 
                    prompt: requirement,
                    model: selectedModel
                }),
                signal: AbortSignal.timeout(window.API_CONFIG?.TIMEOUT || 30000)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error || `API error: ${response.status}`;
                throw new Error(errorMsg);
            }
            
            const data = await response.json();
            let generatedPrompt = data.result || "";

            // Sanitize the prompt
            generatedPrompt = this.sanitizePrompt(generatedPrompt);

            return {
                prompt: generatedPrompt,
                model: selectedModel,
                modelName: modelName,
                provider: data.provider || "unknown",
                usage: data.usage || {},
                success: true
            };

        } catch (error) {
            console.error("AI generation error:", error);
            
            // Fallback to local generation
            const localPrompt = this.generate(requirement);
            
            return {
                prompt: localPrompt,
                model: "local-fallback",
                modelName: "Local Fallback",
                provider: "local",
                usage: {},
                success: false,
                error: error.message,
                fallback: true
            };
        }
    }

    // Template management
    loadTemplates() {
        try {
            const saved = localStorage.getItem("promptTemplates");
            return saved ? JSON.parse(saved) : window.DEFAULT_TEMPLATES || [];
        } catch (error) {
            console.error("Error loading templates:", error);
            return window.DEFAULT_TEMPLATES || [];
        }
    }

    saveTemplates(templates) {
        try {
            localStorage.setItem("promptTemplates", JSON.stringify(templates));
            return true;
        } catch (error) {
            console.error("Error saving templates:", error);
            return false;
        }
    }

    addTemplate(template) {
        const templates = this.loadTemplates();
        const newTemplate = {
            ...template,
            id: template.id || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            usageCount: 0,
            createdAt: template.createdAt || Date.now(),
            isDefault: template.isDefault || false
        };
        
        templates.push(newTemplate);
        this.saveTemplates(templates);
        return newTemplate;
    }

    updateTemplate(id, updates) {
        const templates = this.loadTemplates();
        const index = templates.findIndex(t => t.id === id);
        
        if (index === -1) return null;
        
        templates[index] = { ...templates[index], ...updates };
        this.saveTemplates(templates);
        return templates[index];
    }

    deleteTemplate(id) {
        const templates = this.loadTemplates();
        const filtered = templates.filter(t => t.id !== id);
        this.saveTemplates(filtered);
        return filtered;
    }

    useTemplate(id) {
        const templates = this.loadTemplates();
        const template = templates.find(t => t.id === id);
        
        if (!template) return null;
        
        // Increment usage count
        template.usageCount = (template.usageCount || 0) + 1;
        this.saveTemplates(templates);
        
        return template;
    }

    getTemplateCategories() {
        return window.TEMPLATE_CATEGORIES || {};
    }

    filterTemplates(category = "all", searchQuery = "") {
        let templates = this.loadTemplates();
        
        if (category !== "all") {
            templates = templates.filter(t => t.category === category);
        }
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            templates = templates.filter(
                t => t.name.toLowerCase().includes(q) ||
                    (t.description || "").toLowerCase().includes(q) ||
                    (t.example || "").toLowerCase().includes(q)
            );
        }
        
        return templates;
    }

    // History management
    saveToHistory(requirement, prompt) {
        try {
            const history = this.loadHistory();
            const historyItem = {
                id: Date.now(),
                requirement,
                prompt,
                timestamp: new Date().toISOString(),
                preset: this.currentPreset,
                role: this.lastRole
            };
            
            history.unshift(historyItem);
            // Keep only last 50 items
            const trimmedHistory = history.slice(0, 50);
            
            localStorage.setItem("promptHistory", JSON.stringify(trimmedHistory));
            return historyItem;
        } catch (error) {
            console.error("Error saving to history:", error);
            return null;
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem("promptHistory");
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Error loading history:", error);
            return [];
        }
    }

    clearHistory() {
        localStorage.removeItem("promptHistory");
        return [];
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptGenerator;
}
