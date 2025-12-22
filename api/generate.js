export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    if (prompt.length > 3000) {
      return res.status(400).json({ error: "Prompt too long" });
    }

    const openaiResponse = await fetch(
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
                "You are PromptCraft. Convert the user's idea into a clear, structured AI prompt with role, objective, context, instructions, and notes."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.4,
          max_tokens: 600
        })
      }
    );

    const data = await openaiResponse.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "Invalid OpenAI response" });
    }

    return res.status(200).json({
      result: data.choices[0].message.content
    });

  } catch (err) {
    console.error("PromptCraft API error:", err);
    return res.status(500).json({ error: "Generation failed" });
  }
}
