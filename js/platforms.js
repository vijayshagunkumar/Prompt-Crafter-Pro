/**
 * AI Platforms data and handlers for PromptCraft Pro
 * FIXED VERSION – FULL FILE
 */

class PlatformsManager {
    constructor() {
        this.platforms = [
            {
                id: 'gemini',
                name: 'Google Gemini',
                icon: 'fab fa-google',
                color: '#8B5CF6',
                description: 'Advanced reasoning and multimodal capabilities',
                tags: ['Multimodal', 'Advanced', 'Google'],
                launchUrl: 'https://gemini.google.com/',
                params: { prompt: '' },
                recommended: true,
                logoUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
                provider: 'Google',
                supportedModels: ['gemini-3-flash-preview', 'gemini-1.5-flash-latest']
            },
            {
                id: 'chatgpt',
                name: 'ChatGPT',
                icon: 'fas fa-comment-alt',
                color: '#10A37F',
                description: 'Industry-leading conversational AI',
                tags: ['Conversational', 'Popular', 'OpenAI'],
                launchUrl: 'https://chat.openai.com/',
                params: { text: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/openai-2.svg',
                provider: 'OpenAI',
                supportedModels: ['gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo']
            },
            {
                id: 'claude',
                name: 'Anthropic Claude',
                icon: 'fas fa-brain',
                color: '#D4A574',
                description: 'Constitutional AI with safety focus',
                tags: ['Safe', 'Contextual', 'Anthropic'],
                launchUrl: 'https://claude.ai/',
                params: { query: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/anthropic-1.svg',
                provider: 'Anthropic',
                supportedModels: ['claude-3-haiku', 'claude-3-sonnet']
            },
            {
                id: 'perplexity',
                name: 'Perplexity AI',
                icon: 'fas fa-search',
                color: '#6B7280',
                description: 'Search-enhanced AI with citations',
                tags: ['Search', 'Citations', 'Real-time'],
                launchUrl: 'https://www.perplexity.ai/',
                params: { q: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/perplexity-1.svg',
                provider: 'Perplexity',
                supportedModels: ['sonar', 'sonar-pro']
            },
            {
                id: 'deepseek',
                name: 'DeepSeek',
                icon: 'fas fa-code',
                color: '#3B82F6',
                description: 'Code-focused AI with reasoning',
                tags: ['Code', 'Developer', 'Reasoning'],
                launchUrl: 'https://chat.deepseek.com/',
                params: { message: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/deepseek-1.svg',
                provider: 'DeepSeek',
                supportedModels: ['deepseek-coder', 'deepseek-chat']
            },
            {
                id: 'copilot',
                name: 'Microsoft Copilot',
                icon: 'fab fa-microsoft',
                color: '#0078D4',
                description: 'Microsoft-powered AI assistant',
                tags: ['Microsoft', 'Productivity', 'Office'],
                launchUrl: 'https://copilot.microsoft.com/',
                params: { prompt: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/microsoft-copilot.svg',
                provider: 'Microsoft',
                supportedModels: ['gpt-4', 'gpt-4-turbo']
            },
            {
                id: 'grok',
                name: 'Grok AI',
                icon: 'fab fa-x-twitter',
                color: '#FF6B35',
                description: 'Real-time knowledge AI',
                tags: ['Real-time', 'X', 'Elon'],
                launchUrl: 'https://grok.x.ai/',
                params: { query: '' },
                logoUrl: 'https://cdn.worldvectorlogo.com/logos/x-social-media-logo.svg',
                provider: 'xAI',
                supportedModels: ['grok-1', 'grok-2']
            }
        ];

        this.selectedPlatform = null;
    }

    /* ================= CORE GETTERS ================= */

    getAllPlatforms() {
        return this.platforms;
    }

    getPlatform(id) {
        return this.platforms.find(p => p.id === id);
    }

    getRecommendedPlatform() {
        return this.platforms.find(p => p.recommended) || this.platforms[0];
    }

    selectPlatform(platformId) {
        const platform = this.getPlatform(platformId);
        if (platform) {
            this.selectedPlatform = platform;
            return platform;
        }
        return null;
    }

    getSelectedPlatform() {
        return this.selectedPlatform;
    }

    clearSelectedPlatform() {
        this.selectedPlatform = null;
    }

    /* ================= URL HANDLING ================= */

    generatePlatformUrl(platformId, prompt) {
        const platform = this.getPlatform(platformId);
        if (!platform) return null;

        try {
            return platform.launchUrl;
        } catch {
            return platform.launchUrl;
        }
    }

    /* ================= UI CARD CREATION ================= */

    createPlatformCard(platform) {
        const card = document.createElement('div');
        card.className = 'platform-card';
        card.dataset.platform = platform.id;
        card.tabIndex = 0;
        card.style.cursor = 'pointer';

        if (platform.recommended) {
            card.classList.add('recommended');
        }

        const logoHtml = platform.logoUrl
            ? `<img src="${platform.logoUrl}" alt="${platform.name} logo"
                onerror="this.onerror=null;this.replaceWith(document.createElement('i')).className='${platform.icon}'">`
            : `<i class="${platform.icon}"></i>`;

        card.innerHTML = `
            <div class="platform-icon">${logoHtml}</div>
            <div class="platform-info">
                <h4>${platform.name}</h4>
                <p>${platform.description}</p>
            </div>
        `;

        const handleLaunch = () => {
            const outputEl = document.getElementById('outputArea');
            const prompt = outputEl ? outputEl.innerText.trim() : '';

            if (!prompt) return;

            navigator.clipboard.writeText(prompt).catch(() => {});
            const url = this.generatePlatformUrl(platform.id, prompt);
            window.open(url, '_blank', 'noopener,noreferrer');
        };

        card.addEventListener('click', handleLaunch);
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLaunch();
            }
        });

        return card;
    }

    /* ================= FILTERING / SORTING ================= */

    getPlatformsForModel(modelId) {
        return this.platforms.filter(p =>
            !p.supportedModels || p.supportedModels.includes(modelId)
        );
    }

    filterPlatformsByTag(tag) {
        return this.platforms.filter(p =>
            p.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
        );
    }

    searchPlatforms(query) {
        const q = query.toLowerCase();
        return this.platforms.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some(t => t.toLowerCase().includes(q)) ||
            p.provider.toLowerCase().includes(q)
        );
    }

    sortPlatforms(criteria = 'name', order = 'asc') {
        const sorted = [...this.platforms];
        sorted.sort((a, b) => {
            const av = a[criteria]?.toString().toLowerCase() || '';
            const bv = b[criteria]?.toString().toLowerCase() || '';
            return order === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        });
        return sorted;
    }

    /* ================= STATS & EXPORT ================= */

    getPlatformStats() {
        return {
            total: this.platforms.length,
            recommended: this.platforms.filter(p => p.recommended).length,
            providers: [...new Set(this.platforms.map(p => p.provider))]
        };
    }

    exportPlatformsData(format = 'json') {
        const data = {
            timestamp: new Date().toISOString(),
            platforms: this.platforms
        };
        return format === 'json'
            ? JSON.stringify(data, null, 2)
            : data;
    }

    resetToDefault() {
        this.selectedPlatform = null;
    }
}

export default PlatformsManager;
