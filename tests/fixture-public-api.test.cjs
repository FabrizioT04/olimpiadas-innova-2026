const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('functions/api/fixture.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const fixture={version:1,fuente:'14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg',actualizado:new Date().toISOString(),avisos:[],finalistas:[],partidos:[{id:'one',marcador:{version:1,a:3,b:2,email:'private@example.com',motivo:'private'}}],history:['private']};
const env={FIXTURE_SCRIPT_URL:'https://script.google.com/macros/s/example/exec'};
test('public fixture needs no session, retries 404 from the original URL, and strips private metadata',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;let calls=0;
  global.fetch=async(url)=>{assert.equal(new URL(url).pathname,'/macros/s/example/exec');return ++calls===1 ? new Response('',{status:404}) : Response.json(fixture);};
  try {
    const result=await onRequest({request:new Request('https://example.com/api/fixture'),env});
    assert.equal(result.status,200);assert.equal(calls,2);
    const data=await result.json();assert.equal(data.partidos[0].marcador.a,3);
    assert.equal(data.history,undefined);assert.equal(data.partidos[0].marcador.email,undefined);assert.equal(data.partidos[0].marcador.motivo,undefined);
  }finally{global.fetch=original;}
});
test('public fixture bounds retries, rejects writes and missing configuration',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;return Response.json({error:'failed'});};
  const request=new Request('https://example.com/api/fixture');
  try {
    assert.equal((await onRequest({request,env})).status,502);assert.equal(calls,2);
    assert.equal((await onRequest({request,env:{}})).status,503);
    assert.equal((await onRequest({request:new Request(request,{method:'POST'}),env})).status,405);
    assert.equal(calls,2);
  }finally{global.fetch=original;}
});

test('shared snapshot serves a new visitor without Google and stale snapshot survives upstream failure',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;
  const request=new Request('https://example.com/api/fixture');
  let savedAt=Date.now(),calls=0;const background=[];
  const cache={get:async()=>({savedAt,fixture}),put:async()=>{throw Error('Must not overwrite on failure');}};
  global.fetch=async()=>{calls++;throw Error('Google down');};
  try {
    const fresh=await onRequest({request,env:{...env,FIXTURE_CACHE:cache},waitUntil:p=>background.push(p)});
    assert.equal(fresh.status,200);assert.equal((await fresh.json()).desactualizado,false);assert.equal(calls,0);
    savedAt-=60000;
    const stale=await onRequest({request,env:{...env,FIXTURE_CACHE:cache},waitUntil:p=>background.push(p)});
    const data=await stale.json();assert.equal(stale.status,200);assert.equal(data.desactualizado,true);
    assert.equal(data.actualizado,fixture.actualizado);assert.equal(data.partidos[0].marcador.a,3);
    await Promise.all(background);assert.equal(calls,2);
  }finally{global.fetch=original;}
});

test('cold cache saves public-only data and KV failure still returns live programme',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;
  const request=new Request('https://example.com/api/fixture');let stored;
  global.fetch=async()=>Response.json(fixture);
  try {
    const cache={get:async()=>null,put:async(key,value)=>{stored=JSON.parse(value);}};
    assert.equal((await onRequest({request,env:{...env,FIXTURE_CACHE:cache}})).status,200);
    assert.equal(stored.fixture.history,undefined);assert.equal(stored.fixture.partidos[0].marcador.email,undefined);
    assert.ok(stored.savedAt<=Date.now());
    cache.get=async()=>{throw Error('KV unavailable');};cache.put=async()=>{throw Error('KV unavailable');};
    assert.equal((await onRequest({request,env:{...env,FIXTURE_CACHE:cache}})).status,200);
  }finally{global.fetch=original;}
});
