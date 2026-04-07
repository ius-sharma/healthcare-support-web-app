import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const ROOT = path.dirname(__filename);
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const value = rawValue.replace(/^['\"]|['\"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getApiKey() {
  return process.env.GROQ_API_KEY || process.env.YOUR_GROQ_API_KEY || "";
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
  };
  return map[ext] || "application/octet-stream";
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const fullPath = path.join(ROOT, safePath);

  if (!fullPath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(500);
      res.end("Server error");
      return;
    }

    res.writeHead(200, { "Content-Type": getContentType(fullPath) });
    res.end(content);
  });
}

async function handleGroqChat(req, res) {
  const apiKey = getApiKey();
  if (!apiKey) {
    sendJson(res, 500, {
      error:
        "Missing Groq API key. Add GROQ_API_KEY in .env and restart server.",
    });
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) {
      req.destroy();
    }
  });

  req.on("end", async () => {
    try {
      const payload = JSON.parse(body || "{}");
      const messages = Array.isArray(payload.messages) ? payload.messages : [];
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
  });
}

loadEnvFile();

const server = http.createServer((req, res) => {
  const urlPath = (req.url || "/").split("?")[0];

  if (urlPath === "/api/groq/chat" && req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method === "POST" && urlPath === "/api/groq/chat") {
    handleGroqChat(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end("Method Not Allowed");
});

server.listen(PORT, () => {
  console.log(`MediCare app running at http://localhost:${PORT}`);
});
