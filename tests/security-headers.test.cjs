const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('functions/_middleware.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('static routes enforce a same-origin CSP that also forbids framing', () => {
  const headers = fs.readFileSync('public/_headers', 'utf8');
  assert.match(headers, /^\/\*\r?\n/m);
  assert.match(headers, /X-Frame-Options: DENY/);
  // A single enforced policy (verified first in report-only mode, with no violations).
  const lines = headers.split(/\r?\n/).filter(line => /^\s*Content-Security-Policy(?:-Report-Only)?:/.test(line));
  assert.equal(lines.length, 1);
  const line = lines[0];
  assert.match(line, /^\s*Content-Security-Policy:/);
  const policy = Object.fromEntries(line.split(':').slice(1).join(':').split(';')
    .map(d => d.trim().split(/\s+/)).map(([name, ...values]) => [name, values]));
  assert.deepEqual(policy['frame-ancestors'], ["'none'"]);
  for (const directive of ['default-src', 'script-src', 'style-src', 'connect-src', 'media-src']) {
    assert.deepEqual(policy[directive], ["'self'"], directive);
  }
  // blob: is needed for the upload preview in the referee panel.
  assert.deepEqual(policy['img-src'], ["'self'", 'data:', 'blob:']);
  assert.deepEqual(policy['object-src'], ["'none'"]);
  assert.ok(!line.includes('unsafe-inline') && !line.includes('unsafe-eval'));
});

test('Functions preserve status, body, cache, and existing image CSP while forbidding framing', async () => {
  const { onRequest } = await loaded;
  for (const status of [200, 401, 404, 409, 503]) {
    const original = new Response('unchanged', { status, headers: {
      'Content-Type': 'image/webp', 'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    } });
    const result = await onRequest({ next: async () => original });
    assert.equal(result.status, status);
    assert.equal(await result.text(), 'unchanged');
    assert.equal(result.headers.get('Content-Type'), 'image/webp');
    assert.equal(result.headers.get('Cache-Control'), 'no-store');
    assert.equal(result.headers.get('X-Frame-Options'), 'DENY');
    assert.equal(result.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.match(result.headers.get('Content-Security-Policy'), /default-src 'none'; sandbox/);
    assert.match(result.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  }
});
