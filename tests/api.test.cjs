const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { pathToFileURL } = require('node:url');
const source = require('./shared-module.cjs')(ts.transpileModule(fs.readFileSync('functions/arbitraje/api/[[path]].ts','utf8'),
  {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText)
  .replace("from '../../_lib/content'", `from '${require('./content-module.cjs')}'`)
  .replace("from 'jose'", `from '${pathToFileURL(require.resolve('jose')).href}'`);
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const env={ACCESS_TEAM_DOMAIN:'test.cloudflareaccess.com',ACCESS_AUD:'test',APP_ORIGIN:'https://example.com'};
test('configuración ausente falla cerrada',async()=>{
  const {onRequest}=await modulePromise;
  assert.equal((await onRequest({request:new Request('https://example.com/arbitraje/api/session'),env:{}})).status,503);
});
test('sin JWT y JWT malformado no dan acceso',async()=>{
  const {onRequest}=await modulePromise;
  for(const headers of [{},{'Cf-Access-Jwt-Assertion':'invalid'}]) {
    const response=await onRequest({request:new Request('https://example.com/arbitraje/api/session',{headers}),env});
    assert.equal(response.status,401);assert.equal(response.headers.get('Cache-Control'),'no-store');
  }
});
test('hosts alternativos no pueden usar la API de producción',async()=>{
  const {onRequest}=await modulePromise;
  assert.equal((await onRequest({request:new Request('https://preview.example.com/arbitraje/api/puntajes'),env})).status,403);
});

test('marcadores exige JWT igual que puntajes',async()=>{
  const {onRequest}=await modulePromise;
  const response=await onRequest({request:new Request('https://example.com/arbitraje/api/marcadores',{method:'POST',headers:{Origin:env.APP_ORIGIN,'Content-Type':'application/json'},body:'{}'}),env});
  assert.equal(response.status,401);
});

test('content management and private preview require a valid session',async()=>{
 const {onRequest}=await modulePromise;
 for(const method of ['GET','POST']) {
  const response=await onRequest({request:new Request('https://example.com/arbitraje/api/contenido?preview=12345678-1234-1234-1234-123456789012',{method}),env});
  assert.equal(response.status,401);
 }
});
