// Vercel serverless function to proxy Anthropic requests
// Receives { prompt } in POST body and forwards to Anthropic using the API key in process.env.ANTHROPIC_API_KEY

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Missing prompt in body" });

  const key = process.env.ANTHROPIC_API_KEY || process.env.anthropic_api_key || process.env.ANTHROPIC_KEY || process.env.anthropic_key;
  if (!key) {
    return res.status(500).json({ error: "Server misconfigured: ANTHROPIC_API_KEY or anthropic_api_key not set in environment" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await r.text();
    // Proxy the status and body back to the client (pass-through)
    res.status(r.status).setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    return res.send(data);
  } catch (err) {
    console.error("Anthropic proxy error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
