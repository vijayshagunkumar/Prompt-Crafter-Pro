// PromptCraft – Secure Backend API
// Purpose: Proxy OpenAI calls so API key is never exposed to browser

export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body || {};

    // Basic validation
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    // Hard safety limits (protect your quota)
    if (prompt.length > 3500) {
      return res.status(400).json({ error: "Prompt too long" });
    }

    // Ensure API key exists
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Server misconfigured" });
    }

    // Call OpenAI
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are PromptCraft. Convert the user's input into a clear, structured AI prompt with Role, Objective, Context, Instructions, and Notes."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 700
        })
      }
    );

    const data = await response.json();

    // Defensive checks
    if (!response.ok || !data?.choices?.[0]?.message?.content) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: "AI generation failed" });
    }

    // Success
    return res.status(200).json({
      result: data.choices[0].message.content
    });

  } catch (err) {
    console.error("PromptCraft backend error:", err);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
