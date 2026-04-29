export const config = {
  maxDuration: 60, // seconds — serverless Node.js runtime (supports up to 300s on Pro)
};

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting (in-memory, best-effort per edge instance).
// For production-grade limiting, use Vercel KV + a sliding-window approach.
// ─────────────────────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT   = 20;               // requests per window per IP
const RATE_WINDOW  = 60 * 1000;       // 60-second window (ms)
const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB — allows base64-encoded reference images

/** Returns true if the request is within rate limit. */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Allowed Gemini model name pattern — prevents path injection
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_MODEL_RE = /^[a-zA-Z0-9][a-zA-Z0-9\-\.]{1,80}$/;

// ─────────────────────────────────────────────────────────────────────────────
// Edge handler
// ─────────────────────────────────────────────────────────────────────────────
export default async function handler(req: Request): Promise<Response> {
  // ── Only POST allowed ───────────────────────────────────────────────────
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return json(
      { error: "Too many requests. Please wait a moment before retrying." },
      429,
      { "Retry-After": "60" }
    );
  }

  // ── Body size guard ──────────────────────────────────────────────────────
  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: "Request body too large." }, 413);
  }

  // ── Parse + validate body ────────────────────────────────────────────────
  let body: {
    model?: unknown;
    contents?: unknown;
    generationConfig?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  // model — validate to prevent path traversal / injection
  const model =
    typeof body.model === "string" ? body.model.trim() : "";
  if (!model || !ALLOWED_MODEL_RE.test(model)) {
    return json({ error: "Invalid or missing model name." }, 400);
  }

  // contents must be a non-empty array
  if (!Array.isArray(body.contents) || body.contents.length === 0) {
    return json({ error: "Missing or empty contents array." }, 400);
  }

  // ── API key ──────────────────────────────────────────────────────────────
  const apiKey = (process.env as Record<string, string | undefined>).GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: "API not configured." }, 503);
  }

  // ── Forward to Gemini ────────────────────────────────────────────────────
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const payload: Record<string, unknown> = {
      contents: body.contents,
    };
    if (body.generationConfig !== undefined) {
      payload.generationConfig = body.generationConfig;
    }

    const upstream = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return json({ error: "Upstream request failed." }, 502);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
function json(
  body: unknown,
  status = 200,
  extra: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}
