const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

function getApiKey() {
  return process.env.GROQ_API_KEY || process.env.YOUR_GROQ_API_KEY || "";
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, payload) {
  setCorsHeaders(res);
  res.status(status).json(payload);
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    sendJson(res, 500, {
      error: "Missing GROQ_API_KEY in environment variables.",
    });
    return;
  }

  try {
    const payload =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const messages = Array.isArray(payload?.messages) ? payload.messages : [];

    if (messages.length === 0) {
      sendJson(res, 400, { error: "Request must include messages array." });
      return;
    }

    const upstreamRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: payload.model || DEFAULT_MODEL,
        max_tokens: Number(payload.max_tokens) || 1000,
        messages,
      }),
    });

    const result = await upstreamRes.json();
    sendJson(res, upstreamRes.status, result);
  } catch (error) {
    sendJson(res, 500, { error: "Invalid request or upstream error." });
  }
};
