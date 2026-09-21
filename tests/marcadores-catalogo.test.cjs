const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('src/features/marcadores/model.ts','utf8').replace('import.meta.env.VITE_FIXTURE_URL',"''"),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const model=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('official programme remains selectable through finals without assigned referees or teams',async()=>{
 const {isActividad,isEncuentro}=await model;
 const base={id:'1:4',encuentroId:'a'.repeat(64),fecha:'2026-10-02',hora:'08:00',deporte:'Futsal',categoria:'Infantil',enfrentamiento:'VS',arbitro:'',houses:null,avisos:[],admiteMarcador:false,marcador:null};
 assert.equal(isActividad(base),true);assert.equal(isEncuentro(base),false);
 const ready={...base,houses:['white','green'],enfrentamiento:'BLANCO VS VERDE',admiteMarcador:true};
 assert.equal(isActividad(ready),true);assert.equal(isEncuentro(ready),true);
 assert.equal(isActividad({...base,avisos:['Revisar fecha']}),true);
});
