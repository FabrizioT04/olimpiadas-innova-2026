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
test('every academic area has one challenge per competing category',async()=>{
 const fs=require('node:fs'),ts=require('typescript');
 const code=ts.transpileModule(fs.readFileSync('shared/olimpiadas.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const {RETOS_ACADEMICOS,IDS_CATEGORIA,ACTIVIDADES}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const areas=ACTIVIDADES.filter(a=>a.grupo==='Retos Académicos').map(a=>a.fila);
 assert.deepEqual(areas,[27,28,29,30,31]);
 for(const fila of areas){
  const cats=RETOS_ACADEMICOS.filter(r=>r.fila===fila).flatMap(r=>r.categorias);
  assert.deepEqual([...cats].sort(),[...IDS_CATEGORIA].sort(),'fila '+fila);
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
test('rankings whose programme activity was edited away are orphans; panel rankings outside the programme never are',async()=>{
 const {clasificacionesHuerfanas}=await model;
 const base={version:1,categoria:'juvenilb',actualizado:'2026-09-30T18:16:27.858Z',puestos:{white:1,blue:3,green:2,orange:4}};
 const drill={...base,fila:35,actividad:'a'.repeat(64),detalle:'25/09 · 10:55 - 11:15 · DRILL GIMNASITICO · TODAS LAS HOUSE'};
 const barras={...base,fila:34,actividad:'b'.repeat(64),detalle:'25/09 · 9:55 - 10:15 · CONCURSO DE BARRAS · TODAS LAS HOUSE'};
 const reto={...base,fila:27,actividad:'sabana:27:juvenilb',detalle:'Matemática · ¡Corre, Resuelve y Gana! · Juvenil B'};
 const sinClave={...base,fila:36,detalle:'Sana convivencia'};
 assert.deepEqual(clasificacionesHuerfanas([drill,barras,reto,sinClave],new Set(['b'.repeat(64)])),[drill]);
 assert.deepEqual(clasificacionesHuerfanas([drill,barras],new Set(['a'.repeat(64),'b'.repeat(64)])),[]);
});
test('a programme activity on the same day, row and column as an orphan is a possible duplicate',async()=>{
 const {posibleDuplicado}=await model;
 const huerfana={version:1,fila:35,categoria:'juvenilb',actualizado:'2026-09-30T18:16:27.858Z',puestos:{white:1,blue:3,green:2,orange:4},
  actividad:'a'.repeat(64),detalle:'25/09 · 10:55 - 11:15 · DRILL GIMNASITICO · TODAS LAS HOUSE'};
 const renombrada={actividad:'c'.repeat(64),fila:35,categoria:'juvenilb',detalle:'25/09 · 10:55 - 11:15 · DRILL COREOGRÁFICO · TODAS LAS HOUSE'};
 assert.equal(posibleDuplicado(renombrada,[huerfana]),huerfana);
 // Another day, row or column is a different activity; the orphan itself is a correction, not a duplicate.
 for(const patch of [{detalle:'26/09 · 10:55 · DRILL COREOGRÁFICO'},{fila:34},{categoria:'juvenila'},{actividad:'a'.repeat(64)}])
  assert.equal(posibleDuplicado({...renombrada,...patch},[huerfana]),undefined);
 // Rankings outside the programme carry no date and are never flagged.
 assert.equal(posibleDuplicado({actividad:'sabana:35',fila:35,categoria:'juvenilb',detalle:'25/09 Drill'},[huerfana]),undefined);
});
test('an orphan ranking takes the current name of the only renamed activity on its day, row and column',async()=>{
 const {detalleVigente}=await model;
 const huerfana={version:2,fila:35,categoria:'juvenilb',actualizado:'2026-09-30T20:00:42.000Z',puestos:{white:1,blue:3,green:2,orange:4},
  actividad:'a'.repeat(64),detalle:'25/09 · 10:55 - 11:15 · DRILL GIMNASITICO · TODAS LAS HOUSE'};
 const renombrada={actividad:'c'.repeat(64),fila:35,categoria:'juvenilb',detalle:'25/09 · 10:55 - 11:15 · DRILL COREOGRÁFICO · TODAS LAS HOUSE'};
 const barras={actividad:'b'.repeat(64),fila:34,categoria:'juvenilb',detalle:'25/09 · 9:55 - 10:15 · CONCURSO DE BARRAS · TODAS LAS HOUSE'};
 assert.equal(detalleVigente(huerfana,[barras,renombrada]),renombrada.detalle);
 // No match keeps the saved name; two matches are ambiguous and keep it too.
 assert.equal(detalleVigente(huerfana,[barras]),huerfana.detalle);
 assert.equal(detalleVigente(huerfana,[renombrada,{...renombrada,actividad:'d'.repeat(64),detalle:'25/09 · 12:00 · DRILL · TODAS LAS HOUSE'}]),huerfana.detalle);
});
test('only explicitly named categories are listed; speed races alone split boys and girls in Promesas to Junior',async()=>{
 const {categoriasNombradas,categoriasDe,gruposDe}=await model;
 assert.deepEqual(categoriasNombradas('Promesas - 1ª y 2ª - Infantil 3ª y 4ª Junior 5° y 6°'),['promesas','infantil','junior']);
 assert.deepEqual(categoriasNombradas('TODAS LAS HOUSE'),[]);
 assert.equal(categoriasDe('TODAS LAS HOUSE').length,5,'none named still means all for the last-column rule');
 assert.deepEqual(gruposDe(14,'infantil').map(g=>g.id),['ninos','ninas']);
 for(const [fila,cat] of [[14,'juvenila'],[14,'juvenilb'],[15,'promesas'],[16,'junior'],[34,'juvenilb']]) assert.deepEqual(gruposDe(fila,cat),[]);
});
test('each category and group of an activity gets its own stable key, never the activity key itself',async()=>{
 const {claveParcial}=await model;
 const id='e'.repeat(64),claves=new Set();
 for(const c of ['promesas','infantil','junior','juvenila','juvenilb'])for(const g of ['','ninos','ninas']){
  const k=claveParcial(id,c,g);assert.match(k,/^[0-9a-f]{64}$/);assert.equal(claveParcial(id,c,g),k);assert.notEqual(k,id);claves.add(k);
 }
 assert.equal(claves.size,15);
 assert.notEqual(claveParcial('f'.repeat(64),'promesas',''),claveParcial(id,'promesas',''),'another activity, another key');
});
test('each programme card gets its rankings, split by category and group, and a renamed activity keeps its result',async()=>{
 const {clasificacionesPorActividad,claveParcial}=await model;
 const id=c=>c.repeat(64);
 const act=(c,deporte,categoria)=>({encuentroId:id(c),fecha:'2026-09-29',deporte,categoria});
 const PIJ='Promesas - 1ª y 2ª - Infantil 3ª y 4ª Junior 5° y 6°';
 const barras={...act('b','CONCURSO DE BARRAS','TODAS LAS HOUSE'),fecha:'2026-09-25'},drill={...act('c','DRILL COREOGRÁFICO','TODAS LAS HOUSE'),fecha:'2026-09-25'};
 const relevos=act('1','Carreras de relevos',PIJ),velocidad=act('2','Carreras de Velocidad',PIJ),sinClave={fecha:'2026-09-29',deporte:'Futsal',categoria:'Junior'};
 const base={version:1,actualizado:'2026-09-30T18:00:00.000Z',puestos:{white:1,blue:2,green:3,orange:4}};
 const r=(actividad,fila,categoria,detalle)=>({...base,actividad,fila,categoria,detalle});
 const cBarras=r(id('b'),34,'juvenilb','25/09 · CONCURSO DE BARRAS'),cDrill=r(id('a'),35,'juvenilb','25/09 · 10:55 · DRILL GIMNASITICO');
 const cProm=r(claveParcial(id('1'),'promesas',''),15,'promesas','29/09 · relevos · Promesas'),cInf=r(claveParcial(id('1'),'infantil',''),15,'infantil','29/09 · relevos · Infantil');
 const cNinas=r(claveParcial(id('2'),'junior','ninas'),14,'junior','29/09 · velocidad · Junior · Niñas');
 const mapa=clasificacionesPorActividad([barras,drill,relevos,velocidad,sinClave],[cBarras,cDrill,cInf,cProm,cNinas]);
 const ver=e=>(mapa.get(id(e))||[]).map(x=>[x.categoria,x.grupo,x.clasificacion.detalle]);
 assert.deepEqual(ver('b'),[['','',cBarras.detalle]]);
 assert.deepEqual(ver('c'),[['','',cDrill.detalle]],'the renamed Drill shows its orphan ranking');
 assert.deepEqual(ver('1'),[['promesas','',cProm.detalle],['infantil','',cInf.detalle]],'one podium per category, in category order');
 assert.deepEqual(ver('2'),[['junior','ninas',cNinas.detalle]]);
 assert.equal(mapa.size,4);
 // Two possible activities for the orphan: it is not guessed.
 const otroDrill={...drill,encuentroId:id('d')};
 const ambiguo=clasificacionesPorActividad([drill,otroDrill],[cDrill]);
 assert.equal(ambiguo.size,0);
});
