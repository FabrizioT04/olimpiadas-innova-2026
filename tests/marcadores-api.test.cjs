// Contract tests after authentication. Actual missing/invalid JWT rejection is
// exercised in api.test.cjs using jose; here only identity verification is stubbed.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),crypto=require('node:crypto');
const source=ts.transpileModule(fs.readFileSync('functions/arbitraje/api/[[path]].ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
  .replace(/import .* from 'jose';/,"const createRemoteJWKSet=()=>({}); const jwtVerify=async()=>({payload:{email:'verified@example.com'}});");
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const env={ACCESS_TEAM_DOMAIN:'test.cloudflareaccess.com',ACCESS_AUD:'test',APP_ORIGIN:'https://example.com',FIXTURE_SCRIPT_URL:'https://fixture.example.com/exec',APPS_SCRIPT_URL:'https://points.example.com/exec',ARBITRAJE_SECRET:'test-secret-'.repeat(5)};
const body={id:'12345678-1234-1234-1234-123456789012',encuentroId:'a'.repeat(64),version:0,a:3,b:2,estado:'finalizado',motivo:'Partido terminado',email:'spoof@example.com',houseA:'blue'};
const request=(data,origin=env.APP_ORIGIN)=>new Request(env.APP_ORIGIN+'/arbitraje/api/marcadores',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Cf-Access-Jwt-Assertion':'stubbed-only-in-contract-test'},body:JSON.stringify(data)});

test('points rejection exposes only known diagnostics and preserves pending warning',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;
  const read=()=>new Request(env.APP_ORIGIN+'/arbitraje/api/puntajes',{method:'POST',headers:{Origin:env.APP_ORIGIN,'Content-Type':'application/json','Cf-Access-Jwt-Assertion':'stub'},body:JSON.stringify({id:body.id,house:'green',categoria:'juvenila',fila:25,operacion:'restar',puntos:100,motivo:'Corrección de prueba'})});
  try {
    for(const [diagnostico,pending] of [['Puntaje actual inválido',false],['private secret detail',false],['Celda no habilitada',true]]){
      global.fetch=async()=>Response.json({success:false,diagnostico,pending});
      const response=await onRequest({request:read(),env}),result=await response.json();
      assert.equal(response.status,409);
      if(pending) assert.match(result.error,/pendiente de revisión/);
      else if(diagnostico==='Puntaje actual inválido') {assert.equal(result.diagnostico,diagnostico);assert.match(result.error,/guardado como texto/);}
      else {assert.equal(result.diagnostico,undefined);assert.ok(!JSON.stringify(result).includes(diagnostico));}
    }
  }finally{global.fetch=original;}
});

test('authenticated fixture reads use the configured upstream and failures are retryable',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;
  const read=()=>new Request(env.APP_ORIGIN+'/arbitraje/api/fixture',{headers:{'Cf-Access-Jwt-Assertion':'stubbed-only-in-contract-test'}});
  const fixture={fuente:'14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg',partidos:[{id:'1'}],marcadoresHabilitados:true};
  try {
    global.fetch=async(url,options)=>{assert.equal(url,env.FIXTURE_SCRIPT_URL);assert.ok(options.signal);return Response.json(fixture);};
    const response=await onRequest({request:read(),env});
    assert.equal(response.status,200);assert.deepEqual(await response.json(),fixture);
    assert.equal(response.headers.get('Cache-Control'),'no-store');
    global.fetch=async()=>{throw new Error('timeout');};
    assert.equal((await onRequest({request:read(),env})).status,502);
    global.fetch=async()=>Response.json({error:'unavailable'});
    assert.equal((await onRequest({request:read(),env})).status,502);
    assert.equal((await onRequest({request:read(),env:{...env,FIXTURE_SCRIPT_URL:''}})).status,503);
  }finally{global.fetch=original;}
});
test('marker API signs verified identity, strips supplied Houses and uses fixture endpoint',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;
  global.fetch=async(url,options)=>{
    assert.equal(url,env.FIXTURE_SCRIPT_URL);
    const envelope=JSON.parse(options.body),payload=JSON.parse(envelope.payload);
    assert.equal(payload.email,'verified@example.com');assert.equal(payload.houseA,undefined);assert.equal(payload.action,'marcador');
    assert.equal(envelope.signature,crypto.createHmac('sha256',env.ARBITRAJE_SECRET).update(envelope.timestamp+'.'+envelope.payload).digest('hex'));
    return Response.json({success:true,id:body.id,marcador:{version:1,a:3,b:2}});
  };
  try {assert.equal((await onRequest({request:request(body),env})).status,200);}finally{global.fetch=original;}
});
test('invalid marker values and foreign origin never reach Apps Script',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;global.fetch=async()=>{throw Error('Unexpected upstream call');};
  try {
    for(const patch of [{a:-1},{a:1.5},{b:1000},{estado:'unknown'},{estado:'pendiente'},{version:-1},{motivo:'x'}])assert.equal((await onRequest({request:request({...body,...patch}),env})).status,400);
    assert.equal((await onRequest({request:request(body,'https://foreign.example'),env})).status,403);
  }finally{global.fetch=original;}
});
test('version conflict is actionable and cannot be reported as success',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;global.fetch=async()=>Response.json({success:false,code:'CONFLICT'});
  try {const response=await onRequest({request:request(body),env});assert.equal(response.status,409);assert.equal((await response.json()).code,'CONFLICT');}finally{global.fetch=original;}
});
