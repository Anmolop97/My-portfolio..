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

const BLOCKED_PATHS = new Set([
  "/wrangler.toml",
  "/worker.js",
  "/_headers",
  "/.gitignore",
  "/README.md"
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (BLOCKED_PATHS.has(url.pathname)) {
      return new Response("Not Found", { status: 404, headers: SECURITY_HEADERS });
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
