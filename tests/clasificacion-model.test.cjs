const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
const source=require('./shared-module.cjs')(ts.transpileModule(fs.readFileSync('src/features/clasificacion/model.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const model=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('categories are read from the programme text; none named means every category',async()=>{
 const {categoriasDe}=await model;
 assert.deepEqual(categoriasDe('Promesas - 1ª y 2ª, Infantil 3ª y4ª, Junior 5° y 6°'),['promesas','infantil','junior']);
 assert.deepEqual(categoriasDe('Promesas - 1ª y 2ª - Infantil 3ª y 4ª Junior 5° y 6°'),['promesas','infantil','junior']);
 assert.deepEqual(categoriasDe('Juvenil A 7° y 8°, Juvenil B 9°,10° y 11°'),['juvenila','juvenilb']);
 assert.deepEqual(categoriasDe('Juvenil B 9°,10° y 11°'),['juvenilb']);
 assert.deepEqual(categoriasDe('Promesas - 1ª y 2'),['promesas']);
 for(const todas of ['TODAS LAS CATEGORIAS','TODAS LAS HOUSE','Todas Las House'])assert.deepEqual(categoriasDe(todas),['promesas','infantil','junior','juvenila','juvenilb']);
});
test('programme names propose their score sheet row and unknown names propose none',async()=>{
 const {filaSugerida}=await model;
 const esperado={'CARRERA DE RESISTENCIA':16,'Carreras de relevos':15,'CARRERA DE POSTAS':15,'Carreras de Velocidad':14,'CARRERA DE VELOCIDAD 20 Mtrs':14,
  'CARRERA DE MICHI':19,'AROS MUSICALES':20,'CARRERAS DE CANALETAS':21,'Comelones':22,'CARRERA REVIENTA GLOBOS':23,'CARRERA CUCHARA LIMON':24,
  'CARRERA DE CUCHARA Y LIMON':24,'CARRERA DE GANCHOS':25,'CARRERA DE TRES PIERNAS':26,'DRILL GIMNASITICO':35,'Concurso de Barras':34};
 for(const [nombre,fila] of Object.entries(esperado))assert.equal(filaSugerida(nombre),fila,nombre);
 for(const nombre of ['BIENVENIDA A LOS ESTUDIANTES','DESFILE DE LAS HOUSE','ENCUENTRO DE PADRES','Premiación','Bailetón'])assert.equal(filaSugerida(nombre),null,nombre);
});
test('every academic area has one challenge per competing category (Promesas does not compete in DPSC)',async()=>{
 const fs=require('node:fs'),ts=require('typescript');
 const code=ts.transpileModule(fs.readFileSync('shared/olimpiadas.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const {RETOS_ACADEMICOS,IDS_CATEGORIA,ACTIVIDADES}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const areas=ACTIVIDADES.filter(a=>a.grupo==='Retos Académicos').map(a=>a.fila);
 assert.deepEqual(areas,[27,28,29,30,31]);
 for(const fila of areas){
  const cats=RETOS_ACADEMICOS.filter(r=>r.fila===fila).flatMap(r=>r.categorias);
  const esperadas=IDS_CATEGORIA.filter(c=>!(fila===29&&c==='promesas'));
  assert.deepEqual([...cats].sort(),[...esperadas].sort(),'fila '+fila);
 }
});
test('sport podiums join the final and the 3rd-place match by sport and category',async()=>{
 const {podiosDeportivos,tipoPuesto}=await model;
 for(const fase of ['1ero Y 2do','1er y 2do','1 Y 2 LUGAR','1er y 2do puesto'])assert.equal(tipoPuesto(fase),'final',fase);
 for(const fase of ['3er y 4to','3 Y 4 PUESTO','3ER Y 4TO PUESTO BALONMANO','3Er y 4to puesto'])assert.equal(tipoPuesto(fase),'tercero',fase);
 for(const fase of ['Preliminares','Semifinales y Finales','Finales','PRELIMINARES - Recreos',''])assert.equal(tipoPuesto(fase),null,fase);
 const base={hora:'09:00',enfrentamiento:'X VS Y'};
 const podios=podiosDeportivos([
  {...base,id:'1',fecha:'2026-09-28',deporte:'Balonmano',categoria:'Infantil',fase:'3ER Y 4TO PUESTO BALONMANO',marcador:{houseA:'white',houseB:'orange',a:2,b:5,estado:'finalizado',puntosA:85,puntosB:90,integrado:true}},
  {...base,id:'2',fecha:'2026-09-29',deporte:'BALONMANO',categoria:'Infantiles - 3 y 4',fase:'1ero Y 2do',marcador:{houseA:'green',houseB:'blue',a:3,b:1,estado:'finalizado',puntosA:100,puntosB:95,integrado:true}},
  {...base,id:'3',fecha:'2026-10-02',deporte:'Futsal',categoria:'Juvenil B 9°,10° y 11°',fase:'1 Y 2 LUGAR',marcador:{houseA:'green',houseB:'orange',a:1,b:1,estado:'finalizado'}},
  {...base,id:'4',fecha:'2026-10-01',deporte:'FUTSAL',categoria:'Juvenil B 9°,10° y 11°',fase:'3 Y 4 PUESTO',marcador:null},
  {...base,id:'5',fecha:'2026-09-29',deporte:'Carreras de relevos',categoria:'Promesas - Infantil - Junior',fase:'Finales',marcador:null}]);
 assert.deepEqual(podios.map(p=>[p.deporte,p.categoria]),[['Futsal','juvenilb'],['Balonmano','infantil']]);
 assert.deepEqual(JSON.parse(JSON.stringify(podios[1].lugares)),[{puesto:1,house:'green',puntos:100},{puesto:2,house:'blue',puntos:95},{puesto:3,house:'orange',puntos:90},{puesto:4,house:'white',puntos:85}]);
 // A level final and a pending 3rd-place match leave every place undecided.
 assert.ok(podios[0].lugares.every(l=>l.house===null));
});
