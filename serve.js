const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const baseDir = __dirname;

// In-memory local database for testing contact messages and admin vault
const localMessages = [
  {
    id: 1,
    name: "Sundar Pichai",
    email: "sundar@google.com",
    message: "Incredible 3D workstation and systems portfolio! Let's talk about DeepMind internship.",
    country: "US",
    status: "unread",
    created_at: "2026-11-07 10:15:22"
  }
];
const LOCAL_ADMIN_KEY = "anmol-dev-secret-key-123";

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Add CORS headers for dev testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let cleanUrl = req.url.split('?')[0];

  // Mock contact API endpoint for local testing
  if (cleanUrl === '/api/contact' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const newMsg = {
          id: localMessages.length + 1,
          name: data.name || "Anonymous",
          email: data.email || "no-email@test.com",
          message: data.message || "",
          country: "IN",
          status: "unread",
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        localMessages.unshift(newMsg);
        console.log('[LOCAL SERVER] Received Contact Submission:', newMsg);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', local: true, delivered: true, id: newMsg.id }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Mock Admin Messages Vault endpoint
  if (cleanUrl === '/api/admin/messages') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:8080'}`);
    const queryKey = urlObj.searchParams.get('key');
    const authHeader = req.headers['authorization'] || '';
    const isAuthorized = (authHeader === `Bearer ${LOCAL_ADMIN_KEY}` || queryKey === LOCAL_ADMIN_KEY);

    if (!isAuthorized) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'error',
        error: 'Unauthorized. In your browser, open: http://localhost:8080/api/admin/messages?key=' + LOCAL_ADMIN_KEY
      }));
      return;
    }

    // If viewed directly in browser tab, render a sleek visual inbox table!
    const acceptHeader = req.headers['accept'] || '';
    if (acceptHeader.includes('text/html') && !urlObj.searchParams.has('json')) {
      const rowsHtml = localMessages.map(m => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 12px; font-family: monospace; color: #38bdf8;">#${m.id}</td>
          <td style="padding: 12px; font-weight: 600; color: #ffffff;">${m.name}</td>
          <td style="padding: 12px; color: #94a3b8;"><a href="mailto:${m.email}" style="color: #38bdf8; text-decoration: none;">${m.email}</a></td>
          <td style="padding: 12px; color: #e2e8f0;">${m.message}</td>
          <td style="padding: 12px; font-family: monospace; font-size: 11px; color: #64748b;">${m.country}</td>
          <td style="padding: 12px; font-family: monospace; font-size: 11px; color: #64748b;">${m.created_at}</td>
        </tr>
      `).join('');

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Admin Messages Vault — Anmol Portfolio</title>
  <style>
    body { background: #04060a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; margin: 0; }
    .card { max-width: 960px; margin: 0 auto; background: #0b101b; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 1.5rem; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
    h1 { font-size: 1.5rem; margin-top: 0; color: #ffffff; display: flex; align-items: center; justify-content: space-between; }
    .badge { font-size: 0.75rem; font-family: monospace; background: rgba(56,189,248,0.15); border: 1px solid rgba(56,189,248,0.4); color: #38bdf8; padding: 4px 10px; border-radius: 999px; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.25rem; font-size: 0.88rem; }
    th { text-align: left; padding: 10px 12px; border-bottom: 2px solid rgba(255,255,255,0.15); color: #94a3b8; font-family: monospace; font-size: 0.75rem; text-transform: uppercase; }
    .btn { display: inline-block; padding: 6px 14px; background: #38bdf8; color: #04060a; font-weight: 600; text-decoration: none; border-radius: 6px; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>
      <span>Admin Messages Vault</span>
      <span class="badge">${localMessages.length} Messages in Database</span>
    </h1>
    <p style="color: #94a3b8; font-size: 0.88rem; margin-bottom: 1rem;">
      Live local database inspection. Every submission from <a href="/#contact" style="color: #38bdf8;">/#contact</a> automatically saves here.
    </p>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Message</th>
          <th>Country</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <div style="margin-top: 1.5rem; text-align: right;">
      <a href="?key=${LOCAL_ADMIN_KEY}&json=1" class="btn" style="background: rgba(255,255,255,0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15); margin-right: 8px;">View Raw JSON</a>
      <a href="/#contact" class="btn">Test Contact Form ↗</a>
    </div>
  </div>
</body>
</html>`;

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      count: localMessages.length,
      messages: localMessages
    }, null, 2));
    return;
  }

  let filePath = path.join(baseDir, cleanUrl === '/' ? 'index.html' : cleanUrl);

  // Security: prevent path traversal
  if (!filePath.startsWith(baseDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio Local Test Server running!`);
  console.log(`- Local PC:   http://localhost:${PORT}`);
  console.log(`- Network IP: http://192.168.31.107:${PORT}`);
});
