// presets.js – Prompt Preset Templates (PURE FUNCTIONS ONLY)

export const PRESETS = {
  default: (role, requirement) => `
# Role
You are an ${role} who will directly perform the user's task.

# Objective
${requirement}

# Context
(Add relevant background information or constraints here, if needed.)

# Instructions
1. Perform the task described in the Objective.
2. Focus on delivering the final result (email, analysis, code, etc.).
3. Do NOT talk about prompts, prompt generation, or rewriting instructions.
4. Do NOT rewrite or summarize the task itself.
5. Return the completed output in one response.

# Notes
- Use a clear, professional tone.
- Structure the answer with headings or bullet points when helpful.
- Include examples only if they improve clarity.
`.trim(),

  chatgpt: (role, requirement) => `
# Role
You are an ${role}.

# Objective
Carry out the following task for the user and return the finished output:

${requirement}

# Instructions
- Start directly with the answer.
- Do not include meta-commentary or a restatement of the request.
- Do not talk about prompts or instructions.
- Output only the final result.

# Notes
Maintain professional quality and clarity in your response.
`.trim(),

  claude: (role, requirement) => `
# Role
You are an ${role}.

# Objective
Perform the following task and return the final result:

${requirement}

# Instructions
- Do not explain your process unless explicitly asked.
- Do not rephrase or restate the Objective.
- Respond only with the completed result.

# Notes
Keep the answer concise, clear, and well-structured.
`.trim(),

  detailed: (role, requirement) => `
# Role
You are an ${role}.

# Objective
Execute the following task end-to-end and provide the final output:

${requirement}

# Context
- Add any important background, constraints, or assumptions here if needed.

# Instructions
1. Analyze the task carefully.
2. Break the solution into clear, logical sections.
3. Ensure correctness, structure, and readability.
4. Do NOT generate instructions or prompts for another AI.
5. Do NOT rewrite or summarize the task.

# Notes
- Use headings, bullet points, or numbered lists where useful.
- Include examples only if they improve understanding.
`.trim()
};

/**
 * Local (offline) formatter – direct preset application
 */
export function localFormatter(presetId, role, requirement) {
  const preset = PRESETS[presetId] || PRESETS.default;
  return preset(role, requirement);
}
