// prompt-generator.js - Generate optimized prompts
(function() {
    'use strict';
    
    class PromptGenerator {
        constructor() {
            this.templates = {
                detailed: (input) => `
You are an expert AI assistant with specialized knowledge in this domain. Your task is to:

Context:
${input}

Requirements:
1. Provide comprehensive, detailed analysis
2. Include specific examples and actionable insights
3. Structure the response with clear sections
4. Use professional terminology appropriately
5. Consider potential edge cases and limitations
6. Offer practical recommendations

Please deliver a thorough, well-structured response that addresses all aspects of the task. Begin with an executive summary, then proceed with detailed analysis, and conclude with clear next steps.
                `.trim(),
                
                concise: (input) => `
Task: ${input}

Provide a direct, concise response focusing on key points. Use clear language and avoid unnecessary elaboration. Structure the response for maximum clarity and efficiency.
                `.trim(),
                
                creative: (input) => `
Creative Prompt:
${input}

Approach this with innovative thinking and imaginative solutions. Use engaging language, storytelling elements where appropriate, and focus on unique perspectives. Be original and inspiring in your response. Think outside conventional boundaries while maintaining coherence and purpose.
                `.trim(),
                
                professional: (input) => `
Professional Request: ${input}

Prepare a formal, business-appropriate response that includes:
• Executive summary
• Background and context
• Detailed analysis
• Strategic recommendations
• Implementation considerations
• Risk assessment
• Next steps

Use professional tone and formal structure suitable for business communications. Ensure the response is data-driven and evidence-based where applicable.
                `.trim(),
                
                analytical: (input) => `
Analytical Task: ${input}

Provide a technical, data-driven analysis. Include:
1. Problem statement and objectives
2. Methodology and approach
3. Data analysis and findings
4. Insights and interpretations
5. Limitations and assumptions
6. Conclusions and implications

Use precise language, include relevant metrics, and support claims with evidence. Structure the response logically and include visual representation suggestions where applicable.
                `.trim()
            };
        }
        
        generate(input, style = 'detailed') {
            const template = this.templates[style] || this.templates.detailed;
            return template(input);
        }
        
        enhance(existingPrompt, enhancements = []) {
            let enhanced = existingPrompt;
            
            enhancements.forEach(enhancement => {
                switch(enhancement.type) {
                    case 'add_context':
                        enhanced += `\n\nAdditional Context: ${enhancement.value}`;
                        break;
                    case 'add_format':
                        enhanced += `\n\nRequired Format: ${enhancement.value}`;
                        break;
                    case 'add_constraints':
                        enhanced += `\n\nConstraints: ${enhancement.value}`;
                        break;
                    case 'add_examples':
                        enhanced += `\n\nExamples: ${enhancement.value}`;
                        break;
                }
            });
            
            return enhanced;
        }
        
        estimateTokenCount(prompt) {
            // Rough estimation: ~4 characters per token for English
            return Math.ceil(prompt.length / 4);
        }
        
        optimizeForModel(prompt, model = 'gemini') {
            const optimizations = {
                gemini: 'Ensure the prompt is clear and provides sufficient context for multimodal understanding if needed.',
                chatgpt: 'Structure the prompt conversationally and include specific instructions for the desired output format.',
                claude: 'Focus on safety and ethical considerations, and provide clear task boundaries.',
                perplexity: 'Include specific data points and research requirements.',
                deepseek: 'Emphasize technical depth and coding requirements if applicable.'
            };
            
            const optimization = optimizations[model] || '';
            if (optimization) {
                return prompt + '\n\n' + optimization;
            }
            return prompt;
        }
    }
    
    // Export to global scope
    window.PromptGenerator = PromptGenerator;
    
})();
