export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI is not configured yet. Add OPENAI_API_KEY in Vercel Project Settings → Environment Variables, then redeploy." });
  }

  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "Please enter a question." });
  if (message.length > 2000) return res.status(413).json({ error: "Keep your question under 2,000 characters." });

  const system = `You are the portfolio assistant for Aadarsh Gupta. Be helpful, concise, friendly, and honest. Answer only using this portfolio context, and say when something is not known.
Context:
- Aadarsh is a Grade 7 student and young builder interested in AI, product design, startups, video editing, robotics, and debating.
- IDL 2025: India rank 11, state rank 2.
- SAI Global Debate semifinalist; theatre team runner-up; ring tennis gold.
- Pragyan 2026 at IIT BHU: Telekinesis team placed 6th.
- Skills: CapCut, Filmora, InShot, video editing, AI prototyping/tools, product ideation, robotics/Arduino workshop, debating and public speaking.
- Setyn is an early privacy-first AI infrastructure concept, not a launched company.
- Portfolio projects may be visible in the Latest Projects gallery; contact options are LinkedIn and WhatsApp.
Never fabricate awards, projects, links, or details.`;

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: message }
        ],
        max_tokens: 350,
        temperature: 0.45
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      console.error("Portfolio AI provider error:", upstream.status, data?.error?.message || "Unknown provider error");
      return res.status(502).json({ error: "The AI provider could not answer right now. Please try again in a moment." });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "The AI returned an empty reply. Please try again." });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Portfolio AI request failed:", error?.message || error);
    return res.status(502).json({ error: "Could not reach the AI service. Please try again." });
  }
}
