const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('src/features/fixture/fechas.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const fechas=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const dias=['2026-09-29','2026-09-14','','2026-10-01','2026-09-29','2026-09-25'];
test('dates are listed in order without repeats and undated activities go last',async()=>{
 const {ordenarFechas}=await fechas;
 assert.deepEqual(ordenarFechas(dias),['2026-09-14','2026-09-25','2026-09-29','2026-10-01','']);
});
test('the page opens on today, else the next date with activities, else the last one',async()=>{
 const {fechaInicial}=await fechas;
 assert.equal(fechaInicial(dias,'2026-09-29'),'2026-09-29');
 assert.equal(fechaInicial(dias,'2026-09-26'),'2026-09-29','a day without activities shows the next one');
 assert.equal(fechaInicial(dias,'2026-09-01'),'2026-09-14','before the event, its first day');
 assert.equal(fechaInicial(dias,'2026-10-15'),'2026-10-01','after the event, its last day');
 assert.equal(fechaInicial(['',''],'2026-09-29'),'todos');
 assert.equal(fechaInicial([],'2026-09-29'),'todos');
});
test('today uses the same YYYY-MM-DD format as the programme',async()=>{
 const {hoyLocal}=await fechas;
 assert.match(hoyLocal(),/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);
});
