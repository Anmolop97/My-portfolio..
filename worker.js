/**
 * Cloudflare Worker — Strict Security Headers Wrapper
 * Preserves 100% of existing static asset routing while injecting
 * Content-Security-Policy, X-Content-Type-Options, Referrer-Policy,
 * X-Frame-Options, and Permissions-Policy into every HTTP response.
 */

const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' https://cdnjs.cloudflare.com",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "media-src 'self'",
    "connect-src 'self' https://script.google.com https://script.googleusercontent.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin"
};

const BLOCKED_PATHS = new Set([
  "/wrangler.toml",
  "/worker.js",
  "/_headers",
  "/.gitignore",
  "/README.md",
  "/LICENSE",
  "/package.json",
  "/package-lock.json"
]);

function isPathForbidden(pathname) {
  if (BLOCKED_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/.") || pathname.includes("/..")) return true;
  return false;
}

// Remove null bytes, non-printable control characters, and dangerous invisible unicode
function stripControlChars(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // ASCII control characters
    .replace(/[\u200B-\u200D\uFEFF]/g, "");           // Zero-width invisible characters
}

// Neutralize CSV / Spreadsheet Formula Execution (OWASP CWE-1236)
// Prevents =, +, -, @, |, % at start of string or start of any line from executing
function neutralizeFormula(str) {
  if (typeof str !== "string") return "";
  return str.replace(/(^|[\r\n]+)\s*([=+\-@|%])/g, "$1'$2");
}

// Encode HTML entities to prevent HTML execution or formatting breakage
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Master input sanitizer
function sanitizeInput(str, isSingleLine = false) {
  if (typeof str !== "string") return "";
  let cleaned = stripControlChars(str).trim();

  // Strip single-line fields (e.g. name) of any newlines to block CRLF email header injection
  if (isSingleLine) {
    cleaned = cleaned.replace(/[\r\n]+/g, " ").trim();
  } else {
    // Normalize multiline breaks to standard \n
    cleaned = cleaned.replace(/\r\n|\r/g, "\n");
  }

  // 1. Strip raw HTML tags
  cleaned = cleaned.replace(/<[^>]*>?/gm, "").trim();

  // 2. Escape HTML entities
  cleaned = escapeHtml(cleaned);

  // 3. Neutralize CSV / Spreadsheet formula execution (must happen after HTML escape so leading ' remains literal)
  cleaned = neutralizeFormula(cleaned);

  return cleaned;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// 1. Sliding-window IP Rate Limiter (Max 3 messages per 10 minutes per IP)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const ipRequestHistory = new Map();

function isRateLimited(clientIp) {
  if (!clientIp || clientIp === "unknown") return false;
  const now = Date.now();
  const timestamps = ipRequestHistory.get(clientIp) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(clientIp, recent);
    return true;
  }

  recent.push(now);
  ipRequestHistory.set(clientIp, recent);

  // Keep memory footprint bounded
  if (ipRequestHistory.size > 1000) {
    for (const [ip, list] of ipRequestHistory.entries()) {
      const active = list.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) ipRequestHistory.delete(ip);
      else ipRequestHistory.set(ip, active);
    }
  }

  return false;
}

// 2. Global Hourly Circuit Breaker (Protects Google Apps Script quota from botnet exhaustion)
const GLOBAL_HOURLY_WINDOW_MS = 60 * 60 * 1000;
const MAX_GLOBAL_HOURLY_REQUESTS = 25;
const globalRequestTimestamps = [];

function isGlobalQuotaProtected() {
  const now = Date.now();
  while (globalRequestTimestamps.length > 0 && now - globalRequestTimestamps[0] >= GLOBAL_HOURLY_WINDOW_MS) {
    globalRequestTimestamps.shift();
  }
  if (globalRequestTimestamps.length >= MAX_GLOBAL_HOURLY_REQUESTS) {
    return true; // Quota protected!
  }
  globalRequestTimestamps.push(now);
  return false;
}

// 3. Duplicate Message Flood Guard (Prevents identical repeated submissions across rotating IPs)
const recentMessageHashes = new Map();
function isDuplicateSpam(name, email, message) {
  const key = `${name.toLowerCase()}|${email.toLowerCase()}|${message.slice(0, 60).toLowerCase()}`;
  const now = Date.now();
  const lastSeen = recentMessageHashes.get(key);
  if (lastSeen && now - lastSeen < 5 * 60 * 1000) {
    return true;
  }
  recentMessageHashes.set(key, now);
  if (recentMessageHashes.size > 500) {
    for (const [k, time] of recentMessageHashes.entries()) {
      if (now - time >= 5 * 60 * 1000) recentMessageHashes.delete(k);
    }
  }
  return false;
}

const ALLOWED_ORIGIN_HOSTS = new Set([
  "portfolio.anmolkumar.workers.dev",
  "anmolkumar.workers.dev",
  "localhost",
  "127.0.0.1"
]);

function isAllowedOrigin(origin, referer) {
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (ALLOWED_ORIGIN_HOSTS.has(parsed.hostname)) return true;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const parsed = new URL(referer);
      if (ALLOWED_ORIGIN_HOSTS.has(parsed.hostname)) return true;
    } catch {
      return false;
    }
  }

  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (isPathForbidden(url.pathname)) {
      return new Response("Not Found", { status: 404, headers: SECURITY_HEADERS });
    }

    // Direct background contact transmission (Secure server-side proxy to Gmail)
    if (url.pathname === "/api/contact") {
      const origin = request.headers.get("origin") || "";
      const referer = request.headers.get("referer") || "";

      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        if (!isAllowedOrigin(origin, referer)) {
          return new Response(null, { status: 403 });
        }
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": origin || "https://portfolio.anmolkumar.workers.dev",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400"
          }
        });
      }

      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: SECURITY_HEADERS });
      }

      try {
        // 1. Strict Origin / Referer Validation (Prevent cross-site CSRF & origin spoofing)
        if (!isAllowedOrigin(origin, referer)) {
          return new Response(JSON.stringify({ status: "error", error: "Unauthorized origin" }), {
            status: 403,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        // 2. Request Size Guard (DoS & Memory Exhaustion Shield - Max 10 KB)
        const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
        if (contentLength > 10 * 1024) {
          return new Response(JSON.stringify({ status: "error", error: "Payload too large (max 10KB)" }), {
            status: 413,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        // 3. Global Hourly Quota Circuit Breaker (Protects Google Apps Script quota from botnet exhaustion)
        if (isGlobalQuotaProtected()) {
          return new Response(JSON.stringify({ 
            status: "error", 
            error: "Service traffic threshold reached. Please email directly at anmolkumar2762@gmail.com" 
          }), {
            status: 429,
            headers: { 
              ...SECURITY_HEADERS, 
              "Content-Type": "application/json",
              "Retry-After": "3600"
            }
          });
        }

        // 4. Client IP Rate Limiting (Prevent DoS / Rapid bursting per IP)
        const clientIp = request.headers.get("CF-Connecting-IP") || 
                         request.headers.get("x-real-ip") || 
                         "unknown";
        if (isRateLimited(clientIp)) {
          return new Response(JSON.stringify({ 
            status: "error", 
            error: "Too many messages sent. Please wait 10 minutes before trying again." 
          }), {
            status: 429,
            headers: { 
              ...SECURITY_HEADERS, 
              "Content-Type": "application/json",
              "Retry-After": "600"
            }
          });
        }

        // 5. Parse payload safely
        const body = await request.json().catch(() => null);
        if (!body) {
          return new Response(JSON.stringify({ status: "error", error: "Invalid JSON payload" }), {
            status: 400,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        const { name, email, message, _hp_trap } = body;

        // Honeypot check: If the hidden trap was filled, quietly discard bot submission
        if (_hp_trap && _hp_trap.trim().length > 0) {
          return new Response(JSON.stringify({ status: "success" }), {
            status: 200,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        // 6. Sanitize and validate inputs
        const cleanName = sanitizeInput(name, true);
        const cleanEmail = stripControlChars(email || "").replace(/[\r\n\s]/g, "").trim().toLowerCase();
        const cleanMessage = sanitizeInput(message, false);

        // 7. Duplicate Flood Check (Detect identical bot messages across rotating proxies)
        if (isDuplicateSpam(cleanName, cleanEmail, cleanMessage)) {
          return new Response(JSON.stringify({ 
            status: "error", 
            error: "Duplicate message detected. Please wait a few minutes before resending." 
          }), {
            status: 429,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        if (!cleanName || cleanName.length > 100) {
          return new Response(JSON.stringify({ status: "error", error: "Valid name required (max 100 chars)" }), {
            status: 400,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        if (!cleanEmail || cleanEmail.length > 100 || !EMAIL_REGEX.test(cleanEmail)) {
          return new Response(JSON.stringify({ status: "error", error: "Valid email address required" }), {
            status: 400,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        if (!cleanMessage || cleanMessage.length > 3000) {
          return new Response(JSON.stringify({ status: "error", error: "Message required (max 3000 chars)" }), {
            status: 400,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        // 5. Dispatch securely to Google Apps Script Webhook
        const scriptUrl = "https://script.google.com/macros/s/AKfycby7XIBMR_PZ3ACTdNnvEGzlItu2tfcI7cob9z15M5Rlp81tnkZAc8hrDf-MKW9BAz6o/exec";
        const gRes = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cleanName, email: cleanEmail, message: cleanMessage }),
          redirect: "follow"
        });

        const gData = await gRes.json().catch(() => ({ status: "success" }));
        return new Response(JSON.stringify(gData), {
          status: 200,
          headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ status: "error", error: "Transmission failed" }), {
          status: 500,
          headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
        });
      }
    }

    // Preserve existing static asset / origin routing logic untouched
    const originResponse = env && env.ASSETS
      ? await env.ASSETS.fetch(request)
      : await fetch(request);

    // Clone headers so immutable asset responses can be safely decorated
    const newHeaders = new Headers(originResponse.headers);
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      newHeaders.set(header, value);
    }

    return new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers: newHeaders
    });
  }
};
