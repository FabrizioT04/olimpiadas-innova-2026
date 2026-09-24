const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({console});
vm.runInContext(fs.readFileSync('apps-script/FixtureOficial.gs','utf8'),ctx);
vm.runInContext(fs.readFileSync('apps-script/Finalistas2026.gs','utf8'),ctx);
const sheets=JSON.parse(fs.readFileSync('tests/finalistas-2026.fixture.json','utf8'));
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
