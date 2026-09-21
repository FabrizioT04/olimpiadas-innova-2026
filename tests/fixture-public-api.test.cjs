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
