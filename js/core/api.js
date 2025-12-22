/* ======================================================
   api.js
   Purpose: Secure backend API communication
====================================================== */

/**
 * Call PromptCraft backend to generate structured prompt
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function callBackend(prompt) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Prompt generation failed");
  }

  return data.result;
}
