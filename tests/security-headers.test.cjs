const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('functions/_middleware.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('static routes disallow framing without restricting scripts, images or outgoing frames', () => {
  const headers = fs.readFileSync('public/_headers', 'utf8');
  assert.match(headers, /^\/\*\r?\n/m);
  assert.match(headers, /Content-Security-Policy: frame-ancestors 'none'/);
  assert.match(headers, /X-Frame-Options: DENY/);
  // The enforced policy only forbids framing; the fuller policy is report-only until it is verified.
  const enforced = headers.split(/\r?\n/).filter(line => /^\s*Content-Security-Policy:/.test(line));
  assert.equal(enforced.length, 1);
  assert.doesNotMatch(enforced[0], /(?:script-src|img-src|frame-src|default-src)/);
});

test('report-only policy covers every resource the site loads from its own origin', () => {
  const headers = fs.readFileSync('public/_headers', 'utf8');
  const line = headers.split(/\r?\n/).find(l => /^\s*Content-Security-Policy-Report-Only:/.test(l));
  assert.ok(line, 'missing report-only policy');
  const policy = Object.fromEntries(line.split(':').slice(1).join(':').split(';')
    .map(d => d.trim().split(/\s+/)).map(([name, ...values]) => [name, values]));
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
