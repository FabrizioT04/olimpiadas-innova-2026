const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
const source=require('./shared-module.cjs')(ts.transpileModule(fs.readFileSync('functions/api/fixture.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
let instance=0;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')+'#'+(++instance));
const fixture={version:1,fuente:'14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg',actualizado:new Date().toISOString(),avisos:[],finalistas:[],partidos:[{id:'one',marcador:{version:1,a:3,b:2,email:'private@example.com',motivo:'private'}}],history:['private']};
const env={FIXTURE_SCRIPT_URL:'https://script.google.com/macros/s/example/exec'};
test('public fixture needs no session, reads the original URL, and strips private metadata',async()=>{
  const {onRequest}=await load(),original=global.fetch;let calls=0;
  global.fetch=async(url)=>{assert.equal(new URL(url).pathname,'/macros/s/example/exec');calls++;return Response.json(fixture);};
  try {
    const result=await onRequest({request:new Request('https://example.com/api/fixture'),env});
    assert.equal(result.status,200);assert.equal(calls,1);
    const data=await result.json();assert.equal(data.partidos[0].marcador.a,3);
    assert.equal(data.history,undefined);assert.equal(data.partidos[0].marcador.email,undefined);assert.equal(data.partidos[0].marcador.motivo,undefined);
  }finally{global.fetch=original;}
});
test('public fixture bounds retries, rejects writes and missing configuration',async()=>{
  const {onRequest}=await load(),original=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;return Response.json({error:'failed'});};
  const request=new Request('https://example.com/api/fixture');
  try {
    assert.equal((await onRequest({request,env})).status,502);assert.equal(calls,1);
    assert.equal((await onRequest({request,env:{}})).status,503);
    assert.equal((await onRequest({request:new Request(request,{method:'POST'}),env})).status,405);
    assert.equal(calls,1);
  }finally{global.fetch=original;}
});

test('shared snapshot serves a new visitor without Google and stale snapshot survives upstream failure',async()=>{
  const {onRequest}=await load(),original=global.fetch;
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
    await Promise.all(background);assert.equal(calls,1);
  }finally{global.fetch=original;}
});

test('cold cache saves public-only data and KV failure still returns live programme',async()=>{
  const {onRequest}=await load(),original=global.fetch;
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

test('manual refresh bypasses snapshot older than minimum interval and waits for new data',async()=>{
 const {onRequest}=await load(),original=global.fetch;let resolve,stored;
 global.fetch=()=>new Promise(r=>{resolve=r;});
 const cache={get:async()=>({savedAt:Date.now()-11000,fixture}),put:async(k,v)=>{stored=JSON.parse(v);}};
 try {
  let finished=false;
  const response=onRequest({request:new Request('https://example.com/api/fixture?actualizar=1'),env:{...env,FIXTURE_CACHE:cache}}).then(r=>{finished=true;return r;});
  await new Promise(r=>setImmediate(r));assert.equal(finished,false);
  resolve(Response.json({...fixture,partidos:[{id:'one',marcador:{version:2,a:0,b:0}}]}));
  const data=await(await response).json();assert.equal(data.partidos[0].marcador.a,0);assert.equal(data.desactualizado,false);assert.equal(data.copiaCompartida,false);assert.equal(stored.fixture.partidos[0].marcador.version,2);
 }finally{global.fetch=original;}
});
test('manual refresh retains snapshot only when live fetch fails',async()=>{
 const {onRequest}=await load(),original=global.fetch;let calls=0;
 global.fetch=async()=>{calls++;throw Error('offline');};
 try {
  const response=await onRequest({request:new Request('https://example.com/api/fixture?actualizar=1'),env:{...env,FIXTURE_CACHE:{get:async()=>({savedAt:Date.now()-11000,fixture})}}});
  const data=await response.json();assert.equal(calls,1);assert.equal(data.desactualizado,true);assert.equal(data.partidos[0].marcador.a,3);
 }finally{global.fetch=original;}
});

test('repeated refreshes including changed query strings reuse local snapshot until ten seconds',async()=>{
 const {onRequest}=await load(),original=global.fetch,originalNow=Date.now;let now=originalNow(),calls=0;Date.now=()=>now;
 global.fetch=async()=>{calls++;return Response.json(fixture);};
 try {
  for(let i=0;i<8;i++)assert.equal((await onRequest({env,request:new Request('https://example.com/api/fixture?actualizar=1&random='+i)})).status,200);
  assert.equal(calls,1);now+=10001;
  await onRequest({env,request:new Request('https://example.com/api/fixture?actualizar=1')});assert.equal(calls,2);
 }finally{global.fetch=original;Date.now=originalNow;}
});

test('new instance respects shared snapshot minimum refresh interval',async()=>{
 const {onRequest}=await load(),original=global.fetch;let calls=0;
 global.fetch=async()=>{calls++;throw Error('Should use KV');};
 try{
  const response=await onRequest({request:new Request('https://example.com/api/fixture?actualizar=1'),env:{...env,FIXTURE_CACHE:{get:async()=>({savedAt:Date.now()-1000,fixture})}}});
  assert.equal(response.status,200);assert.equal(calls,0);assert.equal((await response.json()).desactualizado,false);
 }finally{global.fetch=original;}
});

test('failure backs off for thirty seconds then retries; no unbounded Google requests',async()=>{
 const {onRequest}=await load(),original=global.fetch,originalNow=Date.now;let now=originalNow(),calls=0;Date.now=()=>now;
 global.fetch=async()=>{calls++;throw Error('offline');};
 const request=new Request('https://example.com/api/fixture?actualizar=1');
 try{
  assert.equal((await onRequest({env,request})).status,502);
  for(let i=0;i<5;i++){const response=await onRequest({env,request});assert.equal(response.status,503);assert.equal(response.headers.get('Retry-After'),'30');}
  assert.equal(calls,1);now+=30001;assert.equal((await onRequest({env,request})).status,502);assert.equal(calls,2);
 }finally{global.fetch=original;Date.now=originalNow;}
});

test('concurrent manual refreshes share one upstream request',async()=>{
 const {onRequest}=await load(),original=global.fetch;let calls=0,resolve;
 global.fetch=()=>{calls++;return new Promise(r=>{resolve=r;});};
 try{
  const responses=Array.from({length:6},()=>onRequest({env,request:new Request('https://example.com/api/fixture?actualizar=1')}));
  await new Promise(r=>setImmediate(r));assert.equal(calls,1);resolve(Response.json(fixture));
  assert.ok((await Promise.all(responses)).every(r=>r.status===200));
 }finally{global.fetch=original;}
});
