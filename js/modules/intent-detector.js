class IntentDetector {
    constructor() {
        this.config = {
            tones: ['neutral', 'friendly', 'professional', 'casual', 'humorous', 'persuasive', 'authoritative'],
            formalityLevels: ['very formal', 'formal', 'neutral', 'informal', 'very informal'],
            emotions: ['neutral', 'excited', 'urgent', 'calm', 'serious'],
            urgencyLevels: ['high', 'medium', 'low', 'normal'],
            audiences: ['general', 'beginners', 'experts', 'technical', 'non-technical'],
            formats: ['free', 'bullet points', 'numbered list', 'table', 'structured', 'paragraph', 'email', 'code'],
            depthLevels: ['detailed', 'normal', 'brief', 'high-level', 'step-by-step']
        };
    }

    detect(text) {
        const lower = (text || "").toLowerCase();
        const intent = {
            persona: "neutral",
            tone: "neutral",
            formality: "neutral",
            emotion: "neutral",
            urgency: "normal",
            audience: "general",
            format: "free",
            depth: "normal",
            constraints: [],
            taskType: "general"
        };

        // Task type detection
        if (/email|mail|send.*to|message.*to|follow[- ]up/i.test(lower)) {
            intent.taskType = "email";
            intent.format = "email";
        } else if (/code|program|script|develop|software|function|python|javascript|typescript|java|c#|sql|api|bug fix|refactor/i.test(lower)) {
            intent.taskType = "code";
            intent.format = "code";
        } else if (/analyze|analysis|market|research|evaluate|assessment|review|trend|report|insight|metrics/i.test(lower)) {
            intent.taskType = "analysis";
            intent.depth = "detailed";
        } else if (/blog|article|story|linkedin post|caption|copywriting|content/i.test(lower)) {
            intent.taskType = "writing";
        } else if (/workout|exercise|fitness|gym|diet|meal plan|training plan/i.test(lower)) {
            intent.taskType = "fitness";
            intent.depth = "detailed";
        } else if (/strategy|business plan|roadmap|pitch deck|proposal|go[- ]to[- ]market|g2m/i.test(lower)) {
            intent.taskType = "business";
            intent.depth = "structured";
        } else if (/teach|explain|lesson|tutorial|guide|training material|curriculum/i.test(lower)) {
            intent.taskType = "education";
            intent.depth = "step-by-step";
        }

        // Tone detection
        if (/friendly|warm|cordial|nice|kind/i.test(lower)) {
            intent.tone = "friendly";
        } else if (/professional|formal|business|official/i.test(lower)) {
            intent.tone = "professional";
        } else if (/casual|informal|relaxed|laid-back/i.test(lower)) {
            intent.tone = "casual";
        } else if (/humorous|funny|witty|sarcastic/i.test(lower)) {
            intent.tone = "humorous";
        } else if (/persuasive|convincing|compelling/i.test(lower)) {
            intent.tone = "persuasive";
        } else if (/authoritative|confident|assertive/i.test(lower)) {
            intent.tone = "authoritative";
        }

        // Formality detection
        if (/very formal|highly formal|extremely formal/i.test(lower)) {
            intent.formality = "very formal";
        } else if (/formal|professional|business/i.test(lower)) {
            intent.formality = "formal";
        } else if (/neutral|balanced|moderate/i.test(lower)) {
            intent.formality = "neutral";
        } else if (/informal|casual|relaxed/i.test(lower)) {
            intent.formality = "informal";
        } else if (/very informal|highly casual|slang/i.test(lower)) {
            intent.formality = "very informal";
        }

        // Emotion detection
        if (/excited|enthusiastic|energetic/i.test(lower)) {
            intent.emotion = "excited";
        } else if (/urgent|important|critical|asap/i.test(lower)) {
            intent.emotion = "urgent";
        } else if (/calm|peaceful|serene|relaxed/i.test(lower)) {
            intent.emotion = "calm";
        } else if (/serious|grave|solemn/i.test(lower)) {
            intent.emotion = "serious";
        }

        // Urgency detection
        if (/urgent|asap|immediately|right away|emergency/i.test(lower)) {
            intent.urgency = "high";
        } else if (/soon|shortly|in a bit/i.test(lower)) {
            intent.urgency = "medium";
        } else if (/no rush|whenever|at your convenience/i.test(lower)) {
            intent.urgency = "low";
        }

        // Audience detection
        if (/beginners|newbies|novices|students/i.test(lower)) {
            intent.audience = "beginners";
        } else if (/experts|professionals|advanced/i.test(lower)) {
            intent.audience = "experts";
        } else if (/technical|developers|engineers/i.test(lower)) {
            intent.audience = "technical";
        } else if (/non-technical|general public|everyone/i.test(lower)) {
            intent.audience = "non-technical";
        }

        // Format detection
        if (/bullet points|bulleted list|list format/i.test(lower)) {
            intent.format = "bullet points";
        } else if (/numbered list|step by step|instructions/i.test(lower)) {
            intent.format = "numbered list";
        } else if (/table|tabular|rows and columns/i.test(lower)) {
            intent.format = "table";
        } else if (/json|xml|yaml|code format/i.test(lower)) {
            intent.format = "structured";
        } else if (/paragraph|prose|essay format/i.test(lower)) {
            intent.format = "paragraph";
        }

        // Depth detection
        if (/detailed|comprehensive|in-depth|thorough/i.test(lower)) {
            intent.depth = "detailed";
        } else if (/brief|concise|short|summary/i.test(lower)) {
            intent.depth = "brief";
        } else if (/high-level|overview|summary/i.test(lower)) {
            intent.depth = "high-level";
        }

        // Constraints detection
        if (/as a |i am a |i'm a /i.test(lower)) {
            intent.persona = "specific";
            intent.constraints.push("specific-persona");
        }
        
        if (/like a |similar to a |channeling /i.test(lower)) {
            intent.persona = "styled";
            intent.constraints.push("styled-persona");
        }
        
        if (/short|brief|concise/i.test(lower)) {
            intent.constraints.push("short");
        }
        
        if (/detailed|in detail|deep/i.test(lower)) {
            intent.constraints.push("detailed");
        }
        
        if (/example/i.test(lower)) {
            intent.constraints.push("examples");
        }

        return intent;
    }

    intentToChips(intent) {
        const chips = [];

        if (intent.persona !== "neutral") {
            chips.push(`[${intent.persona}]`);
        }

        if (intent.tone !== "neutral") {
            chips.push(`[tone: ${intent.tone}]`);
        }

        if (intent.formality !== "neutral") {
            chips.push(`[formality: ${intent.formality}]`);
        }

        if (intent.emotion !== "neutral") {
            chips.push(`[emotion: ${intent.emotion}]`);
        }

        if (intent.urgency !== "normal") {
            chips.push(`[urgency: ${intent.urgency}]`);
        }

        if (intent.audience !== "general") {
            chips.push(`[audience: ${intent.audience}]`);
        }

        if (intent.format !== "free") {
            chips.push(`[format: ${intent.format}]`);
        }

        if (intent.depth !== "normal") {
            chips.push(`[depth: ${intent.depth}]`);
        }

        if (Array.isArray(intent.constraints)) {
            intent.constraints.forEach(c => {
                if (c === "specific-persona") chips.push(`[specific persona]`);
                else if (c === "styled-persona") chips.push(`[styled persona]`);
                else if (c === "short") chips.push(`[concise]`);
                else if (c === "detailed") chips.push(`[detailed]`);
                else if (c === "examples") chips.push(`[with examples]`);
                else chips.push(`[${c}]`);
            });
        }

        return chips;
    }

    getRoleAndPreset(text) {
        const lower = (text || "").toLowerCase();
        let role = "expert assistant";
        let preset = "default";
        let label = "General";

        if (/email|mail|send.*to|message.*to|follow[- ]up/i.test(lower)) {
            role = "expert email writer";
            preset = "default";
            label = "Email";
        } else if (/code|program|script|develop|software|function|python|javascript|typescript|java|c#|sql|api|bug fix|refactor/i.test(lower)) {
            role = "expert developer";
            preset = "chatgpt";
            label = "Code";
        } else if (/analyze|analysis|market|research|evaluate|assessment|review|trend|report|insight|metrics/i.test(lower)) {
            role = "expert analyst";
            preset = "detailed";
            label = "Analysis";
        } else if (/blog|article|story|linkedin post|caption|copywriting|content/i.test(lower)) {
            role = "expert content writer";
            preset = "default";
            label = "Writing";
        } else if (/workout|exercise|fitness|gym|diet|meal plan|training plan/i.test(lower)) {
            role = "expert fitness trainer";
            preset = "detailed";
            label = "Workout";
        } else if (/strategy|business plan|roadmap|pitch deck|proposal|go[- ]to[- ]market|g2m/i.test(lower)) {
            role = "expert business consultant";
            preset = "detailed";
            label = "Business";
        } else if (/teach|explain|lesson|tutorial|guide|training material|curriculum/i.test(lower)) {
            role = "expert educator";
            preset = "detailed";
            label = "Education";
        }

        return { role, preset, label };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntentDetector;
}
