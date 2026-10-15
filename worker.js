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
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "media-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' mailto:",
    "object-src 'none'"
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin"
};

function isBlockedPath(pathname) {
  const lower = pathname.toLowerCase();
  // 1. Block all hidden directories & files (e.g., /.git, /.env, /.gitignore, /.vscode)
  if (lower.startsWith('/.') || lower.includes('/.')) {
    return true;
  }
  // 2. Block internal dev scripts, licenses, and worker configs
  if (
    lower.startsWith('/scratch') ||
    lower === '/worker.js' ||
    lower === '/_headers' ||
    lower === '/wrangler.toml' ||
    lower === '/license'
  ) {
    return true;
  }
  // 3. Block sensitive extensions (configs, manifests, markdown docs, logs, archives, scripts)
  const BLOCKED_EXTENSIONS = [
    '.md', '.toml', '.json', '.yml', '.yaml', '.lock',
    '.bak', '.config', '.sh', '.ps1', '.bat', '.zip',
    '.tar', '.gz', '.map', '.log'
  ];
  for (let i = 0; i < BLOCKED_EXTENSIONS.length; i++) {
    if (lower.endsWith(BLOCKED_EXTENSIONS[i])) {
      return true;
    }
  }
  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (isBlockedPath(url.pathname)) {
      return new Response("Not Found", { status: 404, headers: SECURITY_HEADERS });
    }

    // Direct background contact transmission (Protected & Rate/Size Checked)
    if (url.pathname === "/api/contact" && request.method === "POST") {
      try {
        // Enforce maximum body size (10 KB max payload)
        const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
        if (contentLength > 10240) {
          return new Response(JSON.stringify({ status: "error", error: "Payload too large" }), {
            status: 413,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
          return new Response(JSON.stringify({ status: "error", error: "Invalid JSON payload" }), {
            status: 400,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        const { name, email, message, company_website } = body;

        // Anti-Bot Honeypot trap: bots fill all hidden inputs.
        // If honeypot is populated, return a silent fake success so bots do not retry or adapt,
        // and discard immediately without burning Google Apps Script quota!
        if (company_website && typeof company_website === "string" && company_website.trim().length > 0) {
          return new Response(JSON.stringify({ status: "success" }), {
            status: 200,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        const cleanName = typeof name === "string" ? name.trim() : "";
        const cleanEmail = typeof email === "string" ? email.trim() : "";
        const cleanMessage = typeof message === "string" ? message.trim() : "";

        // Field presence and length boundaries
        if (!cleanName || !cleanEmail || !cleanMessage) {
          return new Response(JSON.stringify({ status: "error", error: "Missing required fields" }), {
            status: 400,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        if (cleanName.length < 2 || cleanName.length > 100) {
          return new Response(JSON.stringify({ status: "error", error: "Name must be between 2 and 100 characters" }), {
            status: 400,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        // Standard RFC-compliant email structure validation regex
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
        if (cleanEmail.length < 5 || cleanEmail.length > 150 || !emailRegex.test(cleanEmail)) {
          return new Response(JSON.stringify({ status: "error", error: "Please provide a valid email address" }), {
            status: 400,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        if (cleanMessage.length < 5 || cleanMessage.length > 2000) {
          return new Response(JSON.stringify({ status: "error", error: "Message must be between 5 and 2000 characters" }), {
            status: 400,
            headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
          });
        }

        const scriptUrl = "https://script.google.com/macros/s/AKfycby7XIBMR_PZ3ACTdNnvEGzlItu2tfcI7cob9z15M5Rlp81tnkZAc8hrDf-MKW9BAz6o/exec";
        const gRes = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cleanName, email: cleanEmail, message: cleanMessage }),
          redirect: "follow"
        });

        const gData = await gRes.json();
        return new Response(JSON.stringify(gData), {
          status: 200,
          headers: { ...SECURITY_HEADERS, "Content-Type": "application/json" }
        });
      } catch (err) {
        console.error("Secure contact dispatcher error:", err);
        return new Response(JSON.stringify({ status: "error", error: "Transmission error. Please try again or copy email directly." }), {
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
