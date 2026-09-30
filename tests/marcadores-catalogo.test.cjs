const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
const source=require('./shared-module.cjs')(ts.transpileModule(fs.readFileSync('src/features/marcadores/model.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const model=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('official programme remains selectable through finals without assigned referees or teams',async()=>{
 const {isActividad,isEncuentro}=await model;
 const base={id:'1:4',encuentroId:'a'.repeat(64),fecha:'2026-10-02',hora:'08:00',deporte:'Futsal',categoria:'Infantil',enfrentamiento:'VS',arbitro:'',houses:null,avisos:[],admiteMarcador:false,marcador:null};
 assert.equal(isActividad(base),true);assert.equal(isEncuentro(base),false);
 const ready={...base,houses:['white','green'],enfrentamiento:'BLANCO VS VERDE',admiteMarcador:true};
 assert.equal(isActividad(ready),true);assert.equal(isEncuentro(ready),true);
 assert.equal(isActividad({...base,avisos:['Revisar fecha']}),true);
});
test('activities for all four Houses are left out of the match list',async()=>{
 const {paraTodasLasHouses}=await model;
 for(const enfrentamiento of ['TODAS LAS HOUSE','Todas las House','todas las houses','  Todas  las  HOUSE '])assert.equal(paraTodasLasHouses({enfrentamiento}),true);
 for(const enfrentamiento of ['BLANCO VS VERDE','Equipos por definir','VS','Bailetón','Houses todas'])assert.equal(paraTodasLasHouses({enfrentamiento}),false);
 assert.equal(paraTodasLasHouses({enfrentamiento:'Equipos por definir',categoria:'TODAS LAS HOUSE'}),true);
 assert.equal(paraTodasLasHouses({enfrentamiento:'AZUL VS VERDE',categoria:'Juvenil A'}),false);
});
