// HistoryManager.js - COMPLETE & SAFE VERSION

class HistoryManager {
    constructor() {
        this.storage = new StorageService();
        this.maxItems = 50;
        this.history = this.loadHistory();
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('History Manager initialized with', this.history.length, 'items');
    }

    /* =========================
       STORAGE
    ========================= */

    loadHistory() {
        try {
            const saved = this.storage.get('prompt_history', []);
            return Array.isArray(saved)
                ? saved.filter(item =>
                    item &&
                    item.id &&
                    item.timestamp &&
                    (item.input || item.prompt)
                )
                : [];
        } catch (err) {
            console.error('Error loading history:', err);
            return [];
        }
    }

    saveHistory(history) {
        this.history = history;
        this.storage.set('prompt_history', history);
    }

    /* =========================
       ADD HISTORY (SAFE)
    ========================= */

    add(input, prompt = '', model = 'gemini-1.5-flash', metadata = {}) {
        try {
            const safeInput =
                typeof input === 'string'
                    ? input
                    : typeof input === 'object' && input !== null
                        ? input.input || input.text || input.prompt || JSON.stringify(input)
                        : '';

            const safePrompt =
                typeof prompt === 'string'
                    ? prompt
                    : typeof prompt === 'object' && prompt !== null
                        ? prompt.prompt || prompt.text || JSON.stringify(prompt)
                        : '';

            if (!safeInput && !safePrompt) return null;

            const item = {
                id: Date.now().toString(),
                input: safeInput.substring(0, 500),
                prompt: safePrompt.substring(0, 5000),
                model,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                time: new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                tags: this.extractTags(safeInput),
                ...metadata
            };

            this.history.unshift(item);

            if (this.history.length > this.maxItems) {
                this.history = this.history.slice(0, this.maxItems);
            }

            this.saveHistory(this.history);
            this.dispatchHistoryUpdate();

            return item;

        } catch (err) {
            console.error('Error adding to history:', err);
            return null;
        }
    }

    /* =========================
       GETTERS
    ========================= */

    getAll() {
        return [...this.history];
    }

    getRecent(limit = 10) {
        return this.history.slice(0, limit);
    }

    getById(id) {
        return this.history.find(item => item.id === id);
    }

    getByModel(model) {
        return this.history.filter(item => item.model === model);
    }

    search(query) {
        const q = (query || '').toLowerCase();
        return this.history.filter(item =>
            (item.input || '').toLowerCase().includes(q) ||
            (item.prompt || '').toLowerCase().includes(q) ||
            (item.tags || []).some(tag => tag.toLowerCase().includes(q))
        );
    }

    /* =========================
       DELETE
    ========================= */

    delete(id) {
        const index = this.history.findIndex(item => item.id === id);
        if (index !== -1) {
            this.history.splice(index, 1);
            this.saveHistory(this.history);
            this.dispatchHistoryUpdate();
            return true;
        }
        return false;
    }

    deleteAll() {
        this.history = [];
        this.saveHistory(this.history);
        this.dispatchHistoryUpdate();
        return true;
    }

    clear() {
        return this.deleteAll();
    }

    /* =========================
       TAGGING
    ========================= */

    extractTags(text) {
        const t = (text || '').toLowerCase();
        const tags = [];

        if (/(email|message|letter)/i.test(t)) tags.push('email');
        if (/(code|programming|function|debug|api)/i.test(t)) tags.push('code');
        if (/(write|creative|story|content|blog)/i.test(t)) tags.push('writing');
        if (/(research|analysis|data|report)/i.test(t)) tags.push('research');
        if (/(business|strategy|plan|proposal)/i.test(t)) tags.push('business');
        if (/(learn|teach|explain|tutorial)/i.test(t)) tags.push('education');
        if (/(urgent|quick|fast|asap)/i.test(t)) tags.push('urgent');

        return tags;
    }

    /* =========================
       EVENTS
    ========================= */

    setupEventListeners() {
        document.addEventListener('prompt:generated', (e) => {
            const { input, prompt, model, metadata } = e.detail || {};
            if (input || prompt) {
                this.add(input, prompt, model, metadata);
            }
        });
    }

    dispatchHistoryUpdate() {
        document.dispatchEvent(new CustomEvent('history:updated', {
            detail: { history: this.history }
        }));
    }

    /* =========================
       UI HELPERS
    ========================= */

    truncateText(text, max = 80) {
        if (!text) return '';
        return text.length > max
            ? this.escapeHtml(text.substring(0, max)) + '...'
            : this.escapeHtml(text);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        document.dispatchEvent(new CustomEvent('notification', {
            detail: { type, message }
        }));
    }

    /* =========================
       EXPORT / IMPORT
    ========================= */

    exportHistory() {
        return JSON.stringify({
            version: '1.0',
            exportedAt: new Date().toISOString(),
            history: this.history
        }, null, 2);
    }

    importHistory(data) {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            if (!Array.isArray(parsed.history)) return false;

            parsed.history.forEach(item => {
                if (!this.history.some(h => h.id === item.id)) {
                    this.history.push(item);
                }
            });

            this.history.sort((a, b) =>
                new Date(b.timestamp) - new Date(a.timestamp)
            );

            if (this.history.length > this.maxItems) {
                this.history = this.history.slice(0, this.maxItems);
            }

            this.saveHistory(this.history);
            this.dispatchHistoryUpdate();
            return true;

        } catch (err) {
            console.error('Import error:', err);
            return false;
        }
    }
}

/* =========================
   GLOBAL EXPORT
========================= */

window.HistoryManager = HistoryManager;
