// Contract tests after authentication. Actual missing/invalid JWT rejection is
// exercised in api.test.cjs using jose; here only identity verification is stubbed.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),crypto=require('node:crypto');
const source=require('./shared-module.cjs')(ts.transpileModule(fs.readFileSync('functions/arbitraje/api/[[path]].ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText)
  .replace("from '../../_lib/content'", `from '${require('./content-module.cjs')}'`)
  .replace(/import .* from 'jose';/,"const createRemoteJWKSet=()=>({}); const jwtVerify=async()=>({payload:{email:'verified@example.com'}});");
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const env={ACCESS_TEAM_DOMAIN:'test.cloudflareaccess.com',ACCESS_AUD:'test',APP_ORIGIN:'https://example.com',FIXTURE_SCRIPT_URL:'https://fixture.example.com/exec',APPS_SCRIPT_URL:'https://points.example.com/exec',ARBITRAJE_SECRET:'test-secret-'.repeat(5)};
const body={id:'12345678-1234-1234-1234-123456789012',encuentroId:'a'.repeat(64),version:0,a:3,b:2,estado:'finalizado',motivo:'Partido terminado',email:'spoof@example.com',houseA:'blue',puntosA:100,puntosB:25,fila:8,categoria:'infantil'};
const request=(data,origin=env.APP_ORIGIN)=>new Request(env.APP_ORIGIN+'/arbitraje/api/marcadores',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Cf-Access-Jwt-Assertion':'stubbed-only-in-contract-test'},body:JSON.stringify(data)});

test('referee fixture falls back to the last saved copy when Google does not answer',async()=>{
  // Fresh module instance: the copy throttle is per instance.
  const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')+'#copia'),original=global.fetch;
  const read=()=>new Request(env.APP_ORIGIN+'/arbitraje/api/fixture',{headers:{'Cf-Access-Jwt-Assertion':'stubbed-only-in-contract-test'}});
  const fixture={fuente:'14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg',partidos:[{id:'1'}],marcadoresHabilitados:true,resultadosVersion:2};
  const store=new Map();let puts=0;
  const FIXTURE_CACHE={get:async(key,type)=>{assert.equal(type,'json');const v=store.get(key);return v?JSON.parse(v):null;},put:async(key,value)=>{puts++;store.set(key,value);}};
  const withCache={...env,FIXTURE_CACHE};
  try {
    global.fetch=async()=>Response.json(fixture);
    const live=await onRequest({request:read(),env:withCache});
    assert.equal(live.status,200);assert.deepEqual(await live.json(),fixture);
    assert.equal(puts,1);assert.equal(JSON.parse(store.get('fixture-arbitraje-v1')).fixture.partidos.length,1);
    assert.equal((await onRequest({request:read(),env:withCache})).status,200);
    assert.equal(puts,1,'the copy is saved at most once a minute per instance');
    for (const fail of [async()=>{throw new Error('timeout');},async()=>Response.json({error:'unavailable'}),async()=>new Response('x',{status:500})]) {
      global.fetch=fail;
      const fallback=await onRequest({request:read(),env:withCache});
      assert.equal(fallback.status,200);
      const data=await fallback.json();
      assert.deepEqual(data.partidos,fixture.partidos);assert.equal(data.marcadoresHabilitados,true);
      assert.ok(!Number.isNaN(Date.parse(data.copiaGuardada)));
      assert.equal(fallback.headers.get('Cache-Control'),'no-store');
    }
    store.set('fixture-arbitraje-v1',JSON.stringify({savedAt:Date.now(),fixture:{...fixture,fuente:'otra-hoja'}}));
    assert.equal((await onRequest({request:read(),env:withCache})).status,502,'a copy from another sheet is never served');
    store.clear();
    assert.equal((await onRequest({request:read(),env:withCache})).status,502);
    const brokenCache={get:async()=>{throw new Error('KV down');},put:async()=>{throw new Error('KV down');}};
    assert.equal((await onRequest({request:read(),env:{...env,FIXTURE_CACHE:brokenCache}})).status,502);
  }finally{global.fetch=original;}
});

test('referee fixture answers live even when its copy cannot be saved',async()=>{
  const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')+'#sin-kv'),original=global.fetch;
  const fixture={fuente:'14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg',partidos:[]};
  try {
    global.fetch=async()=>Response.json(fixture);
    const response=await onRequest({request:new Request(env.APP_ORIGIN+'/arbitraje/api/fixture',{headers:{'Cf-Access-Jwt-Assertion':'stub'}}),env:{...env,FIXTURE_CACHE:{put:async()=>{throw new Error('KV down');}}}});
    assert.equal(response.status,200);assert.deepEqual(await response.json(),fixture);
  }finally{global.fetch=original;}
});

test('retired diagnostic routes are not found and never reach Apps Script',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;
  global.fetch=async()=>{throw new Error('Must not call Apps Script');};
  try {
    for (const path of ['/arbitraje/api/diagnostico-auth','/arbitraje/api/comprobar-auth']) {
      const response=await onRequest({request:new Request(env.APP_ORIGIN+path,{headers:{'Cf-Access-Jwt-Assertion':'stub'}}),env});
      assert.equal(response.status,404);
      assert.ok(!(await response.text()).includes(env.ARBITRAJE_SECRET));
    }
  }finally{global.fetch=original;}
});

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
test('marker API signs verified identity, strips supplied Houses and uses score endpoint',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;
  global.fetch=async(url,options)=>{
    assert.equal(url,env.APPS_SCRIPT_URL);
    const envelope=JSON.parse(options.body),payload=JSON.parse(envelope.payload);
    assert.equal(payload.email,'verified@example.com');assert.equal(payload.houseA,undefined);assert.equal(payload.action,'resultado');
    assert.equal(envelope.signature,crypto.createHmac('sha256',env.ARBITRAJE_SECRET).update(envelope.timestamp+'.'+envelope.payload).digest('hex'));
    return Response.json({success:true,id:body.id,marcador:{version:1,a:3,b:2,integrado:true}});
  };
  try {assert.equal((await onRequest({request:request(body),env})).status,200);}finally{global.fetch=original;}
});
test('invalid marker values and foreign origin never reach Apps Script',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;global.fetch=async()=>{throw Error('Unexpected upstream call');};
  try {
    for(const patch of [{a:-1},{a:1.5},{b:1000},{estado:'unknown'},{estado:'pendiente'},{version:-1},{motivo:'x'},{puntosA:-1},{puntosB:10001},{puntosA:1.5},{puntosA:null},{fila:99},{categoria:'otra'}])assert.equal((await onRequest({request:request({...body,...patch}),env})).status,400);
    assert.equal((await onRequest({request:request(body,'https://foreign.example'),env})).status,403);
  }finally{global.fetch=original;}
});
test('version conflict is actionable and cannot be reported as success',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;global.fetch=async()=>Response.json({success:false,code:'CONFLICT'});
  try {const response=await onRequest({request:request(body),env});assert.equal(response.status,409);assert.equal((await response.json()).code,'CONFLICT');}finally{global.fetch=original;}
});

const ranking={id:'12345678-1234-1234-1234-123456789013',fila:19,categoria:'junior',version:0,puestos:{white:2,blue:1,orange:4,green:3},puntos:{white:95,blue:100,orange:85,green:90},motivo:'Final de Carrera de Michi',email:'spoof@example.com',actividad:'a'.repeat(64),detalle:'30/09 · 12:00 a 12:30 · CARRERA DE MICHI'};
const rankingRequest=(data,origin=env.APP_ORIGIN)=>new Request(env.APP_ORIGIN+'/arbitraje/api/clasificacion',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Cf-Access-Jwt-Assertion':'stub'},body:JSON.stringify(data)});
test('ranking API signs verified identity and forwards exactly four Houses to the score script',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;
  global.fetch=async(url,options)=>{
    assert.equal(url,env.APPS_SCRIPT_URL);
    const envelope=JSON.parse(options.body),payload=JSON.parse(envelope.payload);
    assert.equal(payload.action,'clasificacion');assert.equal(payload.email,'verified@example.com');
    assert.deepEqual(payload.puestos,ranking.puestos);assert.deepEqual(payload.puntos,ranking.puntos);assert.equal(payload.fila,19);
    assert.equal(payload.actividad,ranking.actividad);assert.equal(payload.detalle,ranking.detalle);
    assert.equal(envelope.signature,crypto.createHmac('sha256',env.ARBITRAJE_SECRET).update(envelope.timestamp+'.'+envelope.payload).digest('hex'));
    return Response.json({success:true,id:ranking.id,clasificacion:{version:1,integrado:true}});
  };
  try {
    const response=await onRequest({request:rankingRequest(ranking),env});
    assert.equal(response.status,200);assert.equal((await response.json()).clasificacion.version,1);
  }finally{global.fetch=original;}
});
test('invalid rankings and foreign origin never reach Apps Script',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;global.fetch=async()=>{throw Error('Unexpected upstream call');};
  try {
    for(const patch of [{puestos:{white:1,blue:1,orange:3,green:4}},{puestos:{white:1,blue:2,orange:3}},{puestos:{white:1,blue:2,orange:3,green:5}},
      {puestos:{...ranking.puestos,red:1}},{puntos:{...ranking.puntos,white:-1}},{puntos:{...ranking.puntos,white:1.5}},{puntos:{...ranking.puntos,white:10001}},
      {puntos:null},{fila:99},{fila:8},{fila:12},{fila:17},{categoria:'otra'},{version:-1},{motivo:'x'},{id:'x'},{actividad:'x'},{actividad:'sabana:abc'},{actividad:undefined},{detalle:'x'},{detalle:'x'.repeat(201)}])
      assert.equal((await onRequest({request:rankingRequest({...ranking,...patch}),env})).status,400);
    assert.equal((await onRequest({request:rankingRequest(ranking,'https://foreign.example'),env})).status,403);
  }finally{global.fetch=original;}
});
test('ranking rejections are actionable and an unconfirmed ranking is never success',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;
  try {
    for(const [reply,code] of [[{success:false,code:'CONFLICT',pending:false},'CONFLICT'],[{success:false,code:'CELL_INVALID',pending:false},'CELL_INVALID'],
      [{success:true,id:ranking.id,clasificacion:{version:1,integrado:false}},'UNCONFIRMED'],[{success:true,id:'other',clasificacion:{integrado:true}},'UNCONFIRMED']]){
      global.fetch=async()=>Response.json(reply);
      const response=await onRequest({request:rankingRequest(ranking),env}),data=await response.json();
      assert.equal(response.status,409);assert.equal(data.code,code);
    }
    global.fetch=async()=>{throw new Error('timeout');};
    assert.equal((await onRequest({request:rankingRequest(ranking),env})).status,502);
  }finally{global.fetch=original;}
});
test('rejections without a started record are released; possibly started ones stay pending',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;
  try {
    for(const [send,ok] of [[()=>onRequest({request:rankingRequest(ranking),env}),{success:true,id:ranking.id,clasificacion:{version:1,integrado:false}}],
      [()=>onRequest({request:request(body),env}),{success:true,id:body.id,marcador:{version:1,integrado:false}}]]){
      // An old doPost without the action rejects it as manual points; a script without the file answers UPDATE_REQUIRED.
      for(const reply of [{success:false,error:'Solicitud rechazada o no confirmada',diagnostico:'Datos inválidos'},{success:false,code:'UPDATE_REQUIRED'},{success:false,code:'CONFLICT',pending:false}]){
        global.fetch=async()=>Response.json(reply);
        const response=await send(),data=await response.json();
        assert.equal(response.status,409);assert.equal(data.pending,false);
        if(!reply.code) assert.match(data.error,/sin guardar nada/);
      }
      for(const reply of [{success:false,code:'UNCONFIRMED',pending:true},ok]){
        global.fetch=async()=>Response.json(reply);
        const data=await (await send()).json();
        assert.equal(data.pending,true);assert.match(data.error,/Reintenta el mismo guardado/);
      }
    }
  }finally{global.fetch=original;}
});
test('rankings outside the programme only add to their own row',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;return Response.json({success:true,id:ranking.id,clasificacion:{integrado:true}});};
  try {
    const fuera={...ranking,fila:34,actividad:'sabana:34',detalle:'Concurso de Barras'};
    assert.equal((await onRequest({request:rankingRequest(fuera),env})).status,200);
    for(const patch of [{fila:35},{actividad:'sabana:35'},{fila:27,actividad:'sabana:28:juvenilb',categoria:'juvenilb'}])
      assert.equal((await onRequest({request:rankingRequest({...fuera,...patch}),env})).status,400);
    assert.equal(calls,1);
  }finally{global.fetch=original;}
});
test('academic rankings carry their category in the activity key and it must match',async()=>{
  const {onRequest}=await modulePromise,original=global.fetch;let calls=0;
  global.fetch=async(url,options)=>{calls++;const p=JSON.parse(JSON.parse(options.body).payload);assert.equal(p.actividad,'sabana:27:junior');assert.equal(p.categoria,'junior');return Response.json({success:true,id:ranking.id,clasificacion:{integrado:true}});};
  try {
    const reto={...ranking,fila:27,actividad:'sabana:27:junior',categoria:'junior',detalle:'Matemática · Junior'};
    assert.equal((await onRequest({request:rankingRequest(reto),env})).status,200);
    for(const patch of [{categoria:'infantil'},{actividad:'sabana:27:JUNIOR'},{actividad:'sabana:27:'}])
      assert.equal((await onRequest({request:rankingRequest({...reto,...patch}),env})).status,400);
    assert.equal(calls,1);
  }finally{global.fetch=original;}
});
