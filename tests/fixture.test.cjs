const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ console });
vm.runInContext(fs.readFileSync('apps-script/FixtureOficial.gs', 'utf8'), context);
const parse = sheets => JSON.parse(JSON.stringify(context.parseFixture(sheets)));
const sheet = (name, values, merges = [], id = 1) => ({ name, values, merges, id });
const header = ['HORA','DIA','PARTIDO','DISCIPLINA','EQUIPOS','','','','CATEGORIAS','AULAS','CAMPO'];

test('weekly dates, opponents and fields are expanded only within merges', () => {
  const result = parse([sheet('SEMANA 1', [header,
    ['09:00','2026-09-14',1,'Futsal','','BLANCO VS VERDE','','','Junior','',1],
    ['09:20','','2','Futsal','','','','','Infantil','',''],
    ['09:40','','3','','','','','','Promesas','','']], [[1,1,2,1],[1,10,2,1],[1,5,1,2]])]);
  result.partidos.sort((a,b) => a.id.localeCompare(b.id));
  assert.equal(result.partidos.length,3);
  assert.equal(result.partidos[0].enfrentamiento,'BLANCO VS VERDE');
  assert.equal(result.partidos[1].fecha,'2026-09-14');
  assert.equal(result.partidos[1].lugar,'1');
  assert.equal(result.partidos[1].enfrentamiento,'Equipos por definir');
  assert.equal(result.partidos[2].fecha,'');
  assert.equal(result.partidos[2].deporte,'Por definir');
  assert.ok(result.partidos.every(p => p.estado === 'programado'));
});
test('daily sections read actual dates, changed column order and activities with merged hours', () => {
  const result = parse([sheet('VIERNES 02/10/2026', [
    ['','2026-10-02'],
    ['','Hora','Disciplina','Partido','Equipos','','','','Categoria','RESPONSABLES - ARBITROS','LUGAR'],
    ['','09:00','Tenis','Preliminar','','VS','','','Junior','Mesa',1],
    ['','2025-10-03'],
    ['','12:00 a 14:00','Gymkana','Aros','','Todas las house','','','Junior','Mesa',1],
    ['','','','Carrera','','','','','','','']], [[4,1,2,1],[4,2,2,1],[4,8,2,1]])]);
  result.partidos.sort((a,b) => a.id.localeCompare(b.id));
  assert.equal(result.partidos.length,3);
  assert.equal(result.partidos[0].fecha,'2026-10-02');
  assert.equal(result.partidos[0].deporte,'Tenis');
  assert.equal(result.partidos[0].enfrentamiento,'Equipos por definir');
  assert.equal(result.partidos[1].fecha,'2025-10-03');
  assert.ok(result.partidos[1].avisos.some(s => s.includes('2025')));
  assert.equal(result.partidos[2].fase,'Carrera');
});
test('finalists include blank positions without leaking merged category into opponents', () => {
  const result = parse([sheet('Finalistas', [
    ['Finalistas'],['Disciplina','Categoria'],
    ['Carreras','Junior'],['Ginkana Finalistas'],
    ['Disciplina','Categoria'],['','Infantil','Todas las House']], [[2,1,1,11]])]);
  assert.equal(result.finalistas.length,2);
  assert.equal(result.finalistas[0].primeroSegundo.trim(),'VS');
  assert.deepEqual(result.finalistas[0].puestos,['','','','']);
  assert.equal(result.finalistas[1].deporte,'Gymkana');
});
test('deduplication removes cross-tab exact repeats, keeps different sessions', () => {
  const row = ['09:00','2026-09-29','','Futsal','','A VS B','','','Junior','',1];
  const result = parse([sheet('SEMANA 3',[header,row],[],1),sheet('MARTES 29/09/2026',[header,row,['10:00',...row.slice(1)]],[],2)]);
  assert.equal(result.partidos.length,2);
  assert.equal(result.partidos[0].origen,'MARTES 29/09/2026');
});
test('date parser validates dates and never replaces an explicit old year', () => {
  assert.equal(context.dateValue('lunes 14/09'),'2026-09-14');
  assert.equal(context.dateValue('31/02/2026'),'');
  assert.equal(context.dateValue('2025-10-03'),'2025-10-03');
});
test('POST cannot append or edit official sheets', () => {
  context.ContentService = { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) };
  assert.equal(context.doPost().status,'error');
});
