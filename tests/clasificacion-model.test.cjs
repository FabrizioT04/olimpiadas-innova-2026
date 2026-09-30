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
