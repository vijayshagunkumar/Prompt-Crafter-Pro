// presets.js - Prompt Presets

/**
 * PRESETS: How the final structured prompt is shaped
 */
export const PRESETS = {
  default: (role, requirement) => `# Role
${role}

# Objective
Carry out the following task for the user and return the finished output:

${requirement}

# Instructions
- Focus on delivering the final result (answer, email, code, etc.).
- Do not talk about prompts, prompt generation, or rewriting instructions.
- Do not restate or summarize the user's request.
- Return only the completed output.

# Notes
Maintain professional quality and clarity in your response.`,

  communication: (role, requirement) => `# Role
You are a highly skilled communication specialist.

# Objective
Turn the user's request into a clear, effective piece of communication:

${requirement}

# Instructions
- Use a tone that matches the context (professional, friendly, or neutral as appropriate).
- Structure the message with a clear beginning, middle, and end.
- Avoid jargon and keep the language simple and understandable.
- Do NOT mention that you are rewriting or optimizing a prompt.
- Deliver the communication piece ready to send.

# Output Format
Return only the final message ready to send.

# Notes
Keep it concise, specific, and audience-appropriate.`,

  coding: (role, requirement) => `# Role
You are an expert software developer.

# Objective
Fulfill the following coding-related task:

${requirement}

# Instructions
- If code is required, provide complete, working code with comments where helpful.
- Explain reasoning briefly if it helps understanding, but focus on the final code.
- Do NOT talk about prompts, prompt generation, or rewriting instructions.
- Optimize for readability and maintainability.

# Output Format
- Code (in appropriate language)
- Brief explanation only if essential.

# Notes
Follow best practices and handle edge cases when possible.`,

  writing: (role, requirement) => `# Role
You are a skilled writer and editor.

# Objective
Create a polished written piece based on this request:

${requirement}

# Instructions
- Choose the appropriate style (formal, informal, storytelling, etc.) based on context.
- Make the writing clear, engaging, and cohesive.
- Do NOT mention prompts, prompt generation, or rewriting instructions.
- Fix any grammar, clarity, or structure issues implicitly.

# Output Format
Return only the final written content.

# Notes
Aim for readability and impact.`,

  analysis: (role, requirement) => `# Role
You are an analytical expert with strong critical thinking skills.

# Objective
Respond to this analytical or comparative request:

${requirement}

# Instructions
- Break down complex ideas into clear, structured sections.
- Highlight key insights, pros/cons, and trade-offs where relevant.
- Do NOT mention prompts, prompt generation, or rewriting instructions.
- Keep explanations rigorous but understandable.

# Output Format
Use headings or bullet points if helpful, but focus on clarity of reasoning.

# Notes
Support statements with logical arguments or examples where possible.`
};

/**
 * Format prompt using local formatter (offline mode)
 * @param {string} raw - Raw requirement
 * @param {string} forcedRole - Forced role (optional)
 * @param {string} preset - Preset name
 * @param {Function} getRoleAndPreset - Function to get role from requirement
 * @returns {string} Formatted prompt
 */
export function localFormatter(raw, forcedRole, preset = "default", getRoleAndPreset) {
  const requirement = raw;
  const roleToUse = forcedRole || (getRoleAndPreset ? getRoleAndPreset(requirement).role : "expert assistant");
  
  if (PRESETS[preset]) {
    return PRESETS[preset](roleToUse, requirement);
  }
  
  // Fallback to default
  return PRESETS.default(roleToUse, requirement);
}
