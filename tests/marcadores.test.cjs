const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
function setup() {
  const rows=[['OperacionID','EncuentroID','Version','Fecha','Arbitro','HouseA','HouseB','MarcadorA','MarcadorB','Estado','Motivo','Huella','Encuentro']];
  const props={ARBITRAJE_SECRET:'test-secret-'.repeat(5),MARCADORES_SPREADSHEET_ID:'private'};
  let locked=false, failFlush=false;
  const sheet={getLastRow:()=>rows.length,getRange:(r,c,n,w)=>({getValues:()=>rows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+w)),setValues:v=>{assert.equal(locked,true); v.forEach((row,i)=>{rows[r-1+i]=Array.from(row);});}})};
  const c=vm.createContext({console,PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>Array.from(crypto.createHash('sha256').update(s).digest()),computeHmacSha256Signature:(s,key)=>Array.from(crypto.createHmac('sha256',key).update(s).digest())},
    SpreadsheetApp:{openById:id=>{assert.equal(id,'private'); return {getSheetByName:name=>{assert.equal(name,'Marcadores');return sheet;}};},flush:()=>{if(failFlush)throw Error('connection lost');}},
    LockService:{getScriptLock:()=>({waitLock:()=>{locked=true;},hasLock:()=>locked,releaseLock:()=>{locked=false;}})},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})}});
  vm.runInContext(fs.readFileSync('apps-script/FixtureOficial.gs','utf8')+'\n'+fs.readFileSync('apps-script/Marcadores.gs','utf8'),c);
  const match={id:'10:4',fecha:'2026-09-14',hora:'9:35 - 9:55',deporte:'CONEBALL',categoria:'Infantil',enfrentamiento:'BLANCO VS VERDE',fase:'Preliminar',lugar:'1',avisos:[]};
  c.leerFixture_=()=>({partidos:[match],avisos:[]});
  const base={action:'marcador',id:'12345678-1234-1234-1234-123456789012',encuentroId:c.marcadorId_(match),email:'ref@example.com',version:0,a:2,b:1,estado:'en-juego',motivo:'Registro inicial'};
  function send(changes={}, envelopeChanges={}) {
    const payload=JSON.stringify({...base,...changes}),timestamp=Date.now();
    const signature=crypto.createHmac('sha256',props.ARBITRAJE_SECRET).update(timestamp+'.'+payload).digest('hex');
    return c.doPost({postData:{contents:JSON.stringify({payload,timestamp,signature,...envelopeChanges})}});
  }
  return {c,rows,match,base,send,props,failFlush:()=>{failFlush=true;},resume:()=>{failFlush=false;}};
}
test('signed score persists once; retry returns same version and public data has no identity',()=>{
  const s=setup();const a=s.send(); assert.equal(a.success,true);assert.equal(a.marcador.version,1);
  assert.equal(s.send().success,true);assert.equal(s.rows.length,2);
  assert.equal(s.rows[1][4],'ref@example.com');
  const pub=s.c.enriquecerMarcadores_(s.c.leerFixture_());
  assert.equal(pub.partidos[0].marcador.a,2);assert.equal(pub.marcadoresHabilitados,true);
  assert.equal(JSON.stringify(pub).includes('ref@example.com'),false);
  assert.equal(JSON.stringify(pub).includes('Registro inicial'),false);
});
test('stale version cannot overwrite another referee; correction creates audit version',()=>{
  const s=setup();s.send();
  assert.equal(s.send({id:'22345678-1234-1234-1234-123456789012',a:3}).code,'CONFLICT');
  const corrected=s.send({id:'22345678-1234-1234-1234-123456789012',version:1,a:3,estado:'finalizado',motivo:'Corrección del árbitro'});
  assert.equal(corrected.marcador.version,2);assert.equal(s.rows.length,3);
  assert.equal(s.rows[1][7],2);assert.equal(s.rows[2][7],3);
});
test('tampered signatures, expired envelope, invalid scores and invented match fail without writes',()=>{
  const s=setup();
  for(const result of [s.send({}, {signature:'0'.repeat(64)}),s.send({}, {timestamp:1}),s.send({a:-1}),s.send({a:1.5}),s.send({b:1000}),s.send({estado:'pendiente'}),s.send({encuentroId:'0'.repeat(64)})])assert.equal(result.success,false);
  assert.equal(s.rows.length,1);
});
test('moving rows keeps identity, rescheduling cannot inherit an old result',()=>{
  const s=setup();s.send();s.match.id='10:99';
  assert.equal(s.c.marcadorId_(s.match),s.base.encuentroId);
  s.match.fecha='2026-09-15';
  assert.notEqual(s.c.marcadorId_(s.match),s.base.encuentroId);
  assert.equal(s.send({id:'22345678-1234-1234-1234-123456789012',version:1}).code,'FIXTURE_CHANGED');
  assert.equal(s.c.enriquecerMarcadores_(s.c.leerFixture_()).partidos[0].marcador,null);
});
test('partial confirmation after append is recovered by retry without another row',()=>{
  const s=setup();s.failFlush();assert.equal(s.send().success,false);assert.equal(s.rows.length,2);
  s.resume();assert.equal(s.send().success,true);assert.equal(s.rows.length,2);
  assert.equal(s.send({a:3}).code,'ID_REUSED');
});
test('unknown or identical Houses and ambiguous matches cannot be edited',()=>{
  const s=setup();
  for(const value of ['Equipos por definir','BLANCO VS BLANCO','TODAS LAS HOUSE'])assert.equal(s.c.marcadorHouses_(value),null);
  s.c.leerFixture_=()=>({partidos:[s.match,{...s.match,id:'10:5'}],avisos:[]});
  assert.equal(s.send().code,'FIXTURE_CHANGED');
  assert.ok(s.c.enriquecerMarcadores_(s.c.leerFixture_()).partidos.every(p=>p.admiteMarcador===false));
});
test('missing private store leaves schedule available and writes disabled',()=>{
  const s=setup();delete s.props.MARCADORES_SPREADSHEET_ID;
  const pub=s.c.enriquecerMarcadores_(s.c.leerFixture_());
  assert.equal(pub.partidos.length,1);assert.equal(pub.marcadoresHabilitados,false);
  assert.equal(s.send().code,'NOT_CONFIGURED');
});
