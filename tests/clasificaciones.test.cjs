const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function setup(){
 const cells={},journal=[Array(19).fill('header')],manual=[Array(13).fill('header')],props={ARBITRAJE_SECRET:'test-secret-'.repeat(5),MARCADORES_SPREADSHEET_ID:'private'};
 let locked=false,failCell='';
 const values=(rows,r,c,n=1,w=1)=>Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>rows[r-1+i]?.[c-1+j]??''));
 function table(rows){return {getLastRow:()=>rows.length,appendRow:row=>rows.push(Array.from(row)),getRange:(r,c,n=1,w=1)=>({getValues:()=>values(rows,r,c,n,w),setValues:v=>{assert.equal(locked,true);v.forEach((row,i)=>{rows[r-1+i]??=[];row.forEach((x,j)=>rows[r-1+i][c-1+j]=x);});},setValue:v=>{rows[r-1][c-1]=v;},createTextFinder:id=>({matchEntireCell:()=>({findNext:()=>{const i=rows.findIndex(row=>row[c-1]===id);return i<0?null:{getRow:()=>i+1};}})})})};}
 const scoreSheet={getRange:key=>{const cell=cells[key]??={value:0,formula:'',background:'#ffffff'};return {getValue:()=>cell.value,getFormula:()=>cell.formula,getBackground:()=>cell.background,setValue:v=>{assert.equal(locked,true);if(failCell===key)throw Error('network lost');cell.value=v;}};}};
 const store=table(journal),history=table(manual),book={getSheetByName:name=>name==='Sábana'?scoreSheet:name==='HistorialArbitraje'?history:null};
 const lock={waitLock:()=>{assert.equal(locked,false);locked=true;},hasLock:()=>locked,releaseLock:()=>{locked=false;}};
 const c=vm.createContext({console,LockService:{getScriptLock:()=>lock},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},
 SpreadsheetApp:{getActiveSpreadsheet:()=>book,openById:id=>{assert.equal(id,'private');return {getSheetByName:()=>store};},flush:()=>{}},
 Utilities:{Charset:{UTF_8:"UTF-8"},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()],computeHmacSha256Signature:(s,k)=>[...crypto.createHmac('sha256',k).update(s).digest()]},
 ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})},
 UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify(c.enriquecerMarcadores_(c.leerFixture_()))})}});
 for(const name of ['FixtureOficial','Marcadores','ResultadoUnificado','ArbitrajeSeguro','Clasificaciones'])vm.runInContext(fs.readFileSync('apps-script/'+name+'.gs','utf8'),c);
 const match={id:'1:4',fecha:'2026-09-14',hora:'09:35',deporte:'Futsal',categoria:'Infantil',enfrentamiento:'BLANCO VS VERDE',fase:'Preliminar',lugar:'1',avisos:[]};
 c.leerFixture_=()=>({version:1,fuente:'14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg',partidos:[match],avisos:[]});
 const base={action:'clasificacion',id:crypto.randomUUID(),email:'ref@example.com',fila:19,categoria:'junior',version:0,
  puestos:{white:2,blue:1,orange:4,green:3},puntos:{white:95,blue:100,orange:85,green:90},motivo:'Final de Carrera de Michi',
  actividad:'a'.repeat(64),detalle:'30/09 · 12:00 a 12:30 · CARRERA DE MICHI · Juvenil A, Juvenil B'};
 function send(patch={}){const payload=JSON.stringify({...base,...patch}),timestamp=Date.now();return c.doPost({postData:{contents:JSON.stringify({payload,timestamp,signature:crypto.createHmac('sha256',props.ARBITRAJE_SECRET).update(timestamp+'.'+payload).digest('hex')})}});}
 return {c,base,send,cells,journal,manual,public:()=>JSON.parse(JSON.stringify(c.enriquecerMarcadores_(c.leerFixture_()))),fail:key=>{failCell=key;}};
}
const score=(s,key)=>s.cells[key]?.value??0;

test('one signed ranking awards all four Houses, is idempotent and is published without identity',()=>{
 const s=setup();const r=s.send();assert.equal(r.success,true);assert.equal(r.clasificacion.integrado,true);
 assert.deepEqual(['F19','L19','R19','X19'].map(k=>score(s,k)),[95,100,85,90]);
 assert.equal(s.send().success,true);assert.equal(s.journal.length,2);assert.equal(score(s,'L19'),100);
 const pub=s.public();assert.equal(pub.clasificaciones.length,1);
 assert.deepEqual(pub.clasificaciones[0].puestos,{white:2,blue:1,orange:4,green:3});
 assert.equal(pub.clasificaciones[0].fila,19);assert.equal(pub.clasificaciones[0].categoria,'junior');assert.equal(pub.clasificaciones[0].version,1);
 assert.equal(pub.clasificaciones[0].actividad,'a'.repeat(64));assert.equal(pub.clasificaciones[0].detalle,s.base.detalle);
 assert.equal(JSON.stringify(pub).includes('ref@example.com'),false);
 assert.equal(pub.partidos[0].marcador,null,'a ranking never becomes a match marker');
});
test('corrections apply only the difference, keep other points and reject stale versions',()=>{
 const s=setup();s.cells.L19={value:40,formula:'',background:'#fff'};s.send();assert.equal(score(s,'L19'),140);
 assert.equal(s.send({id:crypto.randomUUID()}).code,'CONFLICT');
 const r=s.send({id:crypto.randomUUID(),version:1,puestos:{white:1,blue:2,orange:3,green:4},puntos:{white:100,blue:95,orange:90,green:0}});
 assert.equal(r.success,true);assert.deepEqual(['F19','L19','R19','X19'].map(k=>score(s,k)),[100,135,90,0]);
 assert.deepEqual(s.public().clasificaciones[0].puestos,{white:1,blue:2,orange:3,green:4});assert.equal(s.public().clasificaciones[0].version,2);
});
test('each programmed activity keeps its own ranking and their points add up in the same row',()=>{
 const s=setup();s.send();assert.equal(s.send({id:crypto.randomUUID(),actividad:'b'.repeat(64),puestos:{white:1,blue:2,orange:3,green:4},puntos:{white:100,blue:95,orange:90,green:85}}).success,true);
 assert.deepEqual(['F19','L19','R19','X19'].map(k=>score(s,k)),[195,195,175,175]);
 assert.equal(s.send({id:crypto.randomUUID(),actividad:'sabana:34',fila:34,categoria:'juvenilb'}).success,true);
 assert.equal(score(s,'H34'),95);assert.equal(s.public().clasificaciones.length,3);
 // Correcting one activity leaves the other one's points untouched.
 assert.equal(s.send({id:crypto.randomUUID(),version:1,puntos:{white:0,blue:0,orange:0,green:0}}).success,true);
 assert.deepEqual(['F19','L19','R19','X19'].map(k=>score(s,k)),[100,95,90,85]);
});
test('ties, missing Houses and invalid values are rejected without writes',()=>{
 const s=setup();
 for(const patch of [{puestos:{white:1,blue:1,orange:3,green:4}},{puestos:{white:1,blue:2,orange:3}},{puestos:{white:1,blue:2,orange:3,green:5}},
  {puestos:{white:1,blue:2,orange:3,green:4,red:4}},{puntos:{white:-1,blue:100,orange:85,green:90}},{puntos:{white:1.5,blue:100,orange:85,green:90}},
  {puntos:{white:10001,blue:100,orange:85,green:90}},{fila:99},{fila:'19'},{categoria:'otra'},{motivo:'x'},{version:-1},{actividad:'x'},{actividad:'sabana:abc'},{actividad:null},{detalle:'x'},{detalle:null}]){
  const r=s.send({id:crypto.randomUUID(),...patch});assert.equal(r.code,'INVALID');assert.equal(r.pending,false);
 }
 assert.equal(s.journal.length,1);assert.equal(Object.keys(s.cells).length,0);
 s.send();assert.equal(s.send({puntos:{...s.base.puntos,white:1}}).code,'ID_REUSED');assert.equal(score(s,'F19'),95);
});
test('a protected cell refuses the whole ranking',()=>{
 for(const blocked of [{formula:'=SUM(A1)'},{background:'#000000'}]){
  const s=setup();s.cells.X19={value:0,formula:'',background:'#fff',...blocked};
  assert.equal(s.send().code,'CELL_INVALID');assert.equal(score(s,'F19'),0);assert.equal(s.journal.length,1);
 }
});
test('a failure midway stays pending, blocks other writes and completes on retry or recovery',()=>{
 const s=setup();s.fail('R19');const r=s.send();assert.equal(r.success,false);assert.equal(r.pending,true);
 assert.equal(score(s,'F19'),95);assert.equal(score(s,'R19'),0);assert.equal(s.public().clasificaciones.length,0);
 assert.equal(s.send({id:crypto.randomUUID(),actividad:'b'.repeat(64)}).code,'OTHER_PENDING');
 assert.equal(s.send({action:'manual',id:crypto.randomUUID(),house:'white',operacion:'sumar',puntos:10}).pending,true);
 s.fail('');assert.equal(s.send().success,true);assert.deepEqual(['F19','L19','R19','X19'].map(k=>score(s,k)),[95,100,85,90]);assert.equal(s.journal.length,2);
 const t=setup();t.fail('R19');t.send();t.fail('');t.c.recuperarResultadoPendiente_();
 assert.equal(score(t,'R19'),85);assert.equal(t.journal[1][17],'CONFIRMADO');assert.equal(t.public().clasificaciones.length,1);
});
test('scripts without the ranking file answer UPDATE_REQUIRED',()=>{
 const s=setup();delete s.c.guardarClasificacion_;s.c.guardarClasificacion_=undefined;
 assert.equal(s.send().code,'UPDATE_REQUIRED');assert.equal(s.journal.length,1);
});
