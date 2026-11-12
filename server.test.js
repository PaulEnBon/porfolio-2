'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const server = require('./server');

let port;
before(() => new Promise((ok) => server.listen(0, () => { port = server.address().port; ok(); })));
after(() => server.close());

// http.request brut : fetch normaliserait les ../ avant l'envoi
const get = (path, method = 'GET') => new Promise((ok, ko) => {
  const req = http.request({ port, path, method }, (res) => {
    let body = '';
    res.on('data', (c) => { body += c; });
    res.on('end', () => ok({ status: res.statusCode, headers: res.headers, body }));
  });
  req.on('error', ko);
  req.end();
});

test('sert la page avec les en-têtes de sécurité', async () => {
  const r = await get('/');
  assert.equal(r.status, 200);
  assert.match(r.headers['content-type'], /text\/html/);
  assert.match(r.headers['content-security-policy'], /script-src 'self'/);
  assert.equal(r.headers['x-content-type-options'], 'nosniff');
  assert.match(r.body, /Paul Bourdareau Launay/);
});

test('ne sort jamais de public/', async () => {
  for (const p of ['/../server.js', '/..%2fserver.js', '/%2e%2e/package.json', '/%2e%2e%2f%2e%2e%2fetc/passwd', '/a%00.html', '/%E0%A4%A']) {
    assert.equal((await get(p)).status, 404, p);
  }
});

test('chaque langue du sélecteur traduit toutes les clés', async () => {
  const fs = require('node:fs');
  const html = fs.readFileSync('public/index.html', 'utf8');
  const read = (code) => JSON.parse(fs.readFileSync(`public/lang/${code}.json`, 'utf8'));
  // clés posées dans le HTML + chaînes que script.js lit directement
  const keys = [...html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)].map((m) => m[1])
    .concat('title', 'desc', 'boot', 'roles', 'help', 'who', 'ls', 'sudo', 'nf');
  const codes = [...html.matchAll(/<option value="([^"]+)"/g)].map((m) => m[1]).filter((c) => c !== 'fr');
  assert.ok(codes.length >= 4);
  for (const code of codes) {
    const dict = code === 'en-GB' ? { ...read('en-US'), ...read(code) } : read(code);
    for (const k of keys) assert.ok(dict[k], `${code} : clé « ${k} » manquante`);
    assert.match((await get(`/lang/${code}.json`)).headers['content-type'], /application\/json/);
  }
});

test('refuse les méthodes autres que GET et HEAD', async () => {
  assert.equal((await get('/', 'POST')).status, 405);
  const head = await get('/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
});
