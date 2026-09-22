const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function setup(){
 const cells={},journal=[Array(19).fill('header')],manual=[Array(13).fill('header')],props={ARBITRAJE_SECRET:'test-secret-'.repeat(5),MARCADORES_SPREADSHEET_ID:'private'};
 let locked=false,failCell='',failConfirm=false,failFlush=false,available=true;
 const values=(rows,r,c,n=1,w=1)=>Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>rows[r-1+i]?.[c-1+j]??''));
 function table(rows){return {getLastRow:()=>rows.length,appendRow:row=>rows.push(Array.from(row)),getRange:(r,c,n=1,w=1)=>({getValues:()=>values(rows,r,c,n,w),setValues:v=>{assert.equal(locked,true);v.forEach((row,i)=>{rows[r-1+i]??=[];row.forEach((x,j)=>rows[r-1+i][c-1+j]=x);});},setValue:v=>{if(rows===journal && c===18 && failConfirm)throw Error('lost confirmation');rows[r-1][c-1]=v;},createTextFinder:id=>({matchEntireCell:()=>({findNext:()=>{const i=rows.findIndex(row=>row[c-1]===id);return i<0?null:{getRow:()=>i+1};}})})})};}
 const scoreSheet={getRange:key=>{const cell=cells[key]??={value:0,formula:'',background:'#ffffff'};return {getValue:()=>cell.value,getFormula:()=>cell.formula,getBackground:()=>cell.background,setValue:v=>{assert.equal(locked,true);if(failCell===key)throw Error('network lost');cell.value=v;}};}};
 const store=table(journal),history=table(manual),book={getSheetByName:name=>name==='Sábana'?scoreSheet:name==='HistorialArbitraje'?history:null};
 const lock={waitLock:()=>{assert.equal(locked,false);locked=true;},hasLock:()=>locked,releaseLock:()=>{locked=false;}};
 const c=vm.createContext({console,LockService:{getScriptLock:()=>lock},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},
 SpreadsheetApp:{getActiveSpreadsheet:()=>book,openById:id=>{assert.equal(id,'private');return {getSheetByName:()=>store};},flush:()=>{if(failFlush)throw Error('flush failed');}},
 Utilities:{DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()],computeHmacSha256Signature:(s,k)=>[...crypto.createHmac('sha256',k).update(s).digest()]},
 ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})},
 UrlFetchApp:{fetch:()=>{if(!available)throw Error('fixture unavailable');return {getResponseCode:()=>200,getContentText:()=>JSON.stringify(c.enriquecerMarcadores_(c.leerFixture_()))};}}});
 for(const name of ['FixtureOficial','Marcadores','ResultadoUnificado','ArbitrajeSeguro'])vm.runInContext(fs.readFileSync('apps-script/'+name+'.gs','utf8'),c);
 const match={id:'1:4',fecha:'2026-09-14',hora:'09:35',deporte:'Futsal',categoria:'Infantil',enfrentamiento:'BLANCO VS VERDE',fase:'Preliminar',lugar:'1',avisos:[]};
 c.leerFixture_=()=>({version:1,fuente:'14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg',partidos:[match],avisos:[]});
 const base={action:'resultado',id:crypto.randomUUID(),email:'ref@example.com',encuentroId:c.marcadorId_(match),version:0,a:3,b:2,estado:'finalizado',puntosA:100,puntosB:25,fila:8,categoria:'infantil',motivo:'Resultado oficial',fixtureUrl:'https://script.google.com/macros/s/example/exec'};
 function send(patch={},envelopePatch={}){const payload=JSON.stringify({...base,...patch}),timestamp=Date.now();return c.doPost({postData:{contents:JSON.stringify({payload,timestamp,signature:crypto.createHmac('sha256',props.ARBITRAJE_SECRET).update(timestamp+'.'+payload).digest('hex'),...envelopePatch})}});}
 return {c,base,send,match,cells,journal,manual,props,lock,store,public:()=>c.enriquecerMarcadores_(c.leerFixture_()),fail:(key)=>{failCell=key;},confirmFail:v=>{failConfirm=v;},flushFail:v=>{failFlush=v;},available:v=>{available=v;}};
}
test('one signed result records both teacher awards, history and public marker exactly once',()=>{
 const s=setup();const r=s.send();assert.equal(r.success,true);assert.equal(r.marcador.integrado,true);assert.equal(s.cells.E8.value,100);assert.equal(s.cells.W8.value,25);
 assert.equal(s.send().success,true);assert.equal(s.journal.length,2);assert.equal(s.cells.E8.value,100);
 const pub=s.public();assert.equal(pub.partidos[0].marcador.puntosA,100);assert.equal(JSON.stringify(pub).includes('ref@example.com'),false);assert.equal(JSON.stringify(pub).includes('PlanRecuperacion'),false);
});
test('corrections apply differences, preserve independent points and reject stale versions',()=>{
 const s=setup();s.cells.E8={value:20,formula:'',background:'#fff'};s.send();
 assert.equal(s.send({id:crypto.randomUUID(),puntosA:80}).code,'CONFLICT');
 const r=s.send({id:crypto.randomUUID(),version:1,puntosA:80,puntosB:50});assert.equal(r.success,true);assert.equal(s.cells.E8.value,100);assert.equal(s.cells.W8.value,50);assert.equal(s.journal.length,3);
 const reopen=s.send({id:crypto.randomUUID(),version:2,estado:'en-juego',puntosA:0,puntosB:0,fila:null,categoria:''});assert.equal(reopen.success,true);assert.equal(s.cells.E8.value,20);assert.equal(s.cells.W8.value,0);
});
test('changing the destination reverses old cells and credits the new cells',()=>{
 const s=setup();s.send();assert.equal(s.send({id:crypto.randomUUID(),version:1,categoria:'junior',fila:9}).success,true);
 assert.equal(s.cells.E8.value,0);assert.equal(s.cells.W8.value,0);assert.equal(s.cells.F9.value,100);assert.equal(s.cells.X9.value,25);
});
test('failure after first House is recoverable and blocks other results and manual writes',()=>{
 const s=setup();s.fail('W8');const r=s.send();assert.equal(r.success,false);assert.equal(r.pending,true);assert.equal(s.cells.E8.value,100);assert.equal(s.cells.W8.value,0);
 assert.equal(s.public().partidos[0].marcador,null);
 assert.equal(s.send({id:crypto.randomUUID()}).code,'OTHER_PENDING');
 assert.equal(s.send({action:'manual',id:crypto.randomUUID(),house:'white',operacion:'sumar',puntos:10}).pending,true);
 s.fail('');s.available(false);assert.equal(s.send().success,true);assert.equal(s.cells.E8.value,100);assert.equal(s.cells.W8.value,25);assert.equal(s.journal.length,2);
});
test('lost confirmation and flush are retried without another award',()=>{
 for(const kind of ['confirmation','flush']){
  const s=setup();if(kind==='confirmation')s.confirmFail(true);else s.flushFail(true);
  assert.equal(s.send().success,false);s.confirmFail(false);s.flushFail(false);
  assert.equal(s.send().success,true);assert.equal(s.send().success,true);assert.equal(s.cells.E8.value,100);assert.equal(s.cells.W8.value,25);assert.equal(s.journal.length,2);
 }
});
test('external edits during pending require review and are never overwritten',()=>{
 const s=setup();s.fail('W8');s.send();s.fail('');s.cells.E8.value=123;
 const r=s.send();assert.equal(r.code,'REVIEW_REQUIRED');assert.equal(r.pending,true);assert.equal(s.cells.E8.value,123);assert.equal(s.cells.W8.value,0);
});
test('forged, expired, reused IDs and invalid awards are rejected without writes',()=>{
 const s=setup();for(const patch of [{puntosA:-1},{puntosB:1.5},{puntosA:10001},{puntosA:null},{estado:'en-juego'},{fila:99},{categoria:'other'},{a:-1},{estado:'pendiente',puntosA:0,puntosB:0}])assert.equal(s.send(patch).success,false);
 assert.equal(s.send({},{signature:'0'.repeat(64)}).success,false);assert.equal(s.send({},{timestamp:1}).success,false);assert.equal(s.journal.length,1);
 s.send();assert.equal(s.send({puntosA:10}).code,'ID_REUSED');assert.equal(s.cells.E8.value,100);
});
test('unknown teams, missing dates and duplicate matches never write',()=>{
 for(const change of [s=>s.match.enfrentamiento='Equipos por definir',s=>s.match.fecha='',s=>s.match.avisos=['invalid'],s=>s.c.leerFixture_=()=>({fuente:'14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg',partidos:[s.match,{...s.match,id:'2'}],avisos:[]})]){
  const s=setup();change(s);assert.equal(s.send().code,'FIXTURE_CHANGED');assert.equal(s.journal.length,1);
 }
});
test('formula, protected destination or negative correction refuses the complete plan',()=>{
 for(const blocked of [{formula:'=SUM(A1)'},{background:'#000000'}]){const s=setup();s.cells.W8={value:0,formula:'',background:'#fff',...blocked};assert.equal(s.send().code,'CELL_INVALID');assert.equal(s.cells.E8.value,0);assert.equal(s.journal.length,1);}
 const s=setup();s.send();s.cells.E8.value=0;assert.equal(s.send({id:crypto.randomUUID(),version:1,puntosA:0}).code,'INSUFFICIENT_POINTS');assert.equal(s.cells.W8.value,25);
});
test('legacy fixture writes are disabled, old records remain readable and row movements preserve identity',()=>{
 const s=setup();assert.equal(s.c.guardarMarcador_().code,'UPDATE_REQUIRED');const id=s.c.marcadorId_(s.match);s.match.id='1:99';assert.equal(s.c.marcadorId_(s.match),id);
 s.journal.push([crypto.randomUUID(),id,1,new Date(),'private@example.com','white','green',2,1,'finalizado','old motive','hash','snapshot']);
 assert.equal(s.public().partidos[0].marcador.a,2);assert.equal(s.public().partidos[0].marcador.integrado,false);
 assert.equal(s.send({id:crypto.randomUUID(),version:1}).success,true);assert.equal(s.cells.E8.value,100);
 s.match.fecha='2026-10-02';assert.equal(s.public().partidos[0].marcador,null);
});

test('administrative recovery completes the original plan after browser retry is lost',()=>{
 const s=setup();s.fail('W8');s.send();s.fail('');s.c.recuperarResultadoPendiente();
 assert.equal(s.cells.E8.value,100);assert.equal(s.cells.W8.value,25);assert.equal(s.journal[1][17],'CONFIRMADO');assert.equal(s.send().success,true);
});
test('zero awards are explicit and prior pending manual operations block new results',()=>{
 const s=setup();assert.equal(s.send({puntosA:0,puntosB:0}).success,true);assert.equal(s.cells.E8.value,0);assert.equal(s.cells.W8.value,0);
 const t=setup();const prior=Array(13).fill('');prior[11]='PENDIENTE';t.manual.push(prior);assert.equal(t.send().code,'OTHER_PENDING');assert.equal(t.journal.length,1);
});
