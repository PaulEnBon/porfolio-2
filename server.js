'use strict';
// Serveur statique sans dépendance. Scalingo fournit le port dans PORT.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};
const HEADERS = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

function send(res, status, type, body, extra) {
  res.writeHead(status, { ...HEADERS, 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), ...extra });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, TYPES['.txt'], 'Méthode non autorisée', { Allow: 'GET, HEAD' });
  }
  let file = null;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    file = path.join(ROOT, pathname.endsWith('/') ? pathname + 'index.html' : pathname);
  } catch { /* URL mal formée : traitée comme introuvable */ }
  // Rien ne sort de public/, même avec des ../ encodés ou un octet nul.
  if (!file || file.includes('\0') || !file.startsWith(ROOT + path.sep)) {
    return send(res, 404, TYPES['.txt'], 'Introuvable');
  }
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, TYPES['.txt'], 'Introuvable');
    send(res, 200, TYPES[path.extname(file)] || 'application/octet-stream', req.method === 'HEAD' ? '' : data, {
      'Content-Length': data.length,
      // no-cache partout : après un déploiement, personne ne garde un vieux CSS avec le nouveau HTML
      'Cache-Control': 'no-cache',
    });
  });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, '0.0.0.0', () => console.log(`Portfolio en écoute sur le port ${port}`));
}

module.exports = server;
