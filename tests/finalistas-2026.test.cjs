const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({console});
vm.runInContext(fs.readFileSync('apps-script/FixtureOficial.gs','utf8'),ctx);
vm.runInContext(fs.readFileSync('apps-script/Finalistas2026.gs','utf8'),ctx);
const sheets=JSON.parse(fs.readFileSync('tests/finalistas-2026.fixture.json','utf8'));

test('merged discipline beyond data bounds keeps only existing rows and their own matches',()=>{
 const input=[{id:1,name:'Hoja 1',values:[
  ['FUTSAL','Infantil','','BLANCO VS AZUL'],
  ['','Junior','','VERDE VS ANARANJADO']
 ],merges:[[0,0,10,1],[20,0,3,1]]}];
 const before=JSON.stringify(input);
 const result=JSON.parse(JSON.stringify(ctx.parseFinalistas2026_(input)));
 assert.equal(result.length,2);
 assert.deepEqual(result.map(r=>r.deporte),['FUTSAL','FUTSAL']);
 assert.deepEqual(result.map(r=>r.terceroCuarto),['BLANCO VS AZUL','VERDE VS ANARANJADO']);
 assert.equal(JSON.stringify(input),before);
});

test('empty sheets and merged categories do not invent finalist entries',()=>{
 assert.equal(ctx.parseFinalistas2026_([{id:1,name:'Vacía',values:[],merges:[[0,0,10,1]]}]).length,0);
 const input=[{id:1,name:'Hoja 1',values:[['FUTSAL','Infantil'],['VÓLEY','']],merges:[[0,1,2,1]]}];
 const result=ctx.parseFinalistas2026_(input);
 assert.equal(result.length,1);
 assert.equal(result[0].deporte,'FUTSAL');
});
test('both finalist sheets retain populated matches and pending badminton without duplicate futsal',()=>{
 const rows=JSON.parse(JSON.stringify(ctx.parseFinalistas2026_(sheets)));
 assert.equal(rows.length,23);
 const futsal=rows.filter(x=>x.deporte==='FUTSAL');
 assert.equal(futsal.length,5);
 assert.ok(futsal.every(x=>x.primeroSegundo && x.terceroCuarto));
 const pending=rows.filter(x=>x.deporte==='BADMINTON');
 assert.equal(pending.length,3);
 assert.ok(pending.every(x=>!x.primeroSegundo && !x.terceroCuarto));
 assert.ok(rows.every(x=>x.puestos.every(v=>v==='')));
 assert.equal(rows[0].terceroCuarto,'BLANCO VS AZUL');
 assert.equal(rows[0].primeroSegundo,'VERDE VS ANARANJADO');
});
test('conflicting populated duplicates remain visible rather than silently overwritten',()=>{
 const copy=JSON.parse(JSON.stringify(sheets));
 copy[1].values[2][7]='AZUL VS BLANCO';
 assert.equal(ctx.parseFinalistas2026_(copy).length,24);
});
