const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
const source=require('./shared-module.cjs')(ts.transpileModule(fs.readFileSync('functions/api/puntajes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
let instance=0;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')+'#'+(++instance));
const env={APPS_SCRIPT_URL:'https://script.google.com/macros/s/example/exec'};
const jsonp=value=>new Response(`procesarPodio(${JSON.stringify(value)});`);
const scores={white:12,blue:7,orange:0,green:9,movimientos:[{motivo:'private'}]};
const request=new Request('https://example.com/api/puntajes');

test('public scores read api_puntos once, strip history and reuse the recent read',async()=>{
  const {onRequest}=await load(),original=global.fetch;let calls=0;
  global.fetch=async url=>{assert.equal(new URL(url).searchParams.get('page'),'api_puntos');calls++;return jsonp(scores);};
  try {
    const first=await onRequest({request,env,waitUntil:()=>{}});
    assert.equal(first.status,200);
    const data=await first.json();
    assert.deepEqual({white:data.white,blue:data.blue,orange:data.orange,green:data.green},{white:12,blue:7,orange:0,green:9});
    assert.equal(data.movimientos,undefined);assert.equal(data.desactualizado,false);
    assert.equal((await onRequest({request,env,waitUntil:()=>{}})).status,200);
    assert.equal(calls,1);
  }finally{global.fetch=original;}
});

test('public scores reject writes, missing configuration and malformed upstream data',async()=>{
  const {onRequest}=await load(),original=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;return jsonp({white:'12',blue:7,orange:0,green:9});};
  try {
    assert.equal((await onRequest({request:new Request(request,{method:'POST'}),env})).status,405);
    assert.equal((await onRequest({request,env:{}})).status,503);
    assert.equal((await onRequest({request,env,waitUntil:()=>{}})).status,502);
    // Failure cooldown: a second visitor does not hit Google again.
    assert.equal((await onRequest({request,env,waitUntil:()=>{}})).status,503);
    assert.equal(calls,1);
  }finally{global.fetch=original;}
});

test('stale shared snapshot is served while Google fails',async()=>{
  const {onRequest}=await load(),original=global.fetch;const background=[];
  const cache={get:async()=>({savedAt:Date.now()-60000,puntajes:{white:5,blue:4,orange:3,green:2}}),put:async()=>{throw Error('Must not overwrite on failure');}};
  global.fetch=async()=>{throw Error('Google down');};
  try {
    const result=await onRequest({request,env:{...env,FIXTURE_CACHE:cache},waitUntil:p=>background.push(p)});
    assert.equal(result.status,200);
    const data=await result.json();assert.equal(data.white,5);assert.equal(data.desactualizado,true);
    await Promise.all(background);
  }finally{global.fetch=original;}
});
