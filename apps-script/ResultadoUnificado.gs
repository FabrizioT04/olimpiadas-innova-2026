// Añadir al proyecto de PUNTAJES, junto a ArbitrajeSeguro.gs.
// Propiedad MARCADORES_SPREADSHEET_ID: archivo privado de marcadores existente.
// El mismo bloqueo serializa resultados y ajustes manuales de la Sábana.
function resultadoSheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('MARCADORES_SPREADSHEET_ID');
  if (!id) throw new Error('NOT_CONFIGURED');
  var sheet = SpreadsheetApp.openById(id).getSheetByName('Marcadores');
  if (!sheet || !sheet.getLastRow()) throw new Error('NOT_CONFIGURED');
  return sheet;
}
function resultadoRows_(sheet) {
  return sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,19).getValues() : [];
}
function verificarResultadoUnificado() {
  resultadoSheet_();
  if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sábana')) throw new Error('No se encontró Sábana');
  // Autoriza la lectura externa antes de publicar la aplicación web.
  var response=UrlFetchApp.fetch('https://script.google.com/macros/s/AKfycbw6v_-hQor-DMh7Mg2qtodwpuIiXIuCOqqtV3mY3Gs5ueqZBrDH8LORqa7RTMWhIH1uqw/exec',{muteHttpExceptions:true});
  if(response.getResponseCode()!==200) throw new Error('No se pudo consultar el fixture');
  console.log('Acceso al fixture, marcadores privados y Sábana verificado.');
}
// Recuperación administrativa si se cerró el navegador y se perdió el reintento.
// No cambia el plan original ni resuelve automáticamente ediciones externas.
function recuperarResultadoPendiente() {
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    var sheet=resultadoSheet_(),rows=resultadoRows_(sheet);
    rows.forEach(function(r,i){if(r[17]==='PENDIENTE') resultadoCompletar_(sheet,i,r);});
    console.log('Recuperación completada. Revisa el fixture y los puntos.');
  } finally {lock.releaseLock();}
}
function resultadoPendiente_() {
  if (!PropertiesService.getScriptProperties().getProperty('MARCADORES_SPREADSHEET_ID')) return false;
  return resultadoRows_(resultadoSheet_()).some(function(r) { return r[17] === 'PENDIENTE'; });
}
function resultadoHash_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text).map(function(b) { return ('0'+((b+256)%256).toString(16)).slice(-2); }).join('');
}
function resultadoPublico_(r) {
  return {version:Number(r[2]),houseA:r[5],houseB:r[6],a:Number(r[7]),b:Number(r[8]),estado:r[9],actualizado:new Date(r[3]).toISOString(),
    puntosA:Number(r[13]) || 0,puntosB:Number(r[14]) || 0,fila:Number(r[15]) || null,categoria:r[16] || '',integrado:r[17] === 'CONFIRMADO'};
}
function resultadoCelda_(house,category,row) {
  var cols = {white:['D','E','F','G','H'],blue:['J','K','L','M','N'],orange:['P','Q','R','S','T'],green:['V','W','X','Y','Z']};
  var index = ['promesas','infantil','junior','juvenila','juvenilb'].indexOf(category);
  if (!Object.prototype.hasOwnProperty.call(cols,house) || index < 0 || !Array.from({length:24},function(_,i){return i+8;}).concat([34,35,36,37]).includes(row)) throw new Error('INVALID');
  return cols[house][index]+row;
}
function resultadoCompletar_(sheet,index,record) {
  var plan = JSON.parse(record[18]);
  var scores = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sábana');
  if (!scores) throw new Error('NOT_CONFIGURED');
  // Validate the whole plan before resuming any writes. Other API edits are
  // blocked while pending. An external/direct Sheets change requires review.
  plan.forEach(function(p) {
    var cell = scores.getRange(p.cell), value = cell.getValue();
    if (value === '') value = 0;
    if (cell.getFormula() || cell.getBackground().toLowerCase() === '#000000' || (value !== p.before && value !== p.after)) throw new Error('REVIEW_REQUIRED');
  });
  plan.forEach(function(p) { scores.getRange(p.cell).setValue(p.after); });
  SpreadsheetApp.flush();
  sheet.getRange(index+2,18).setValue('CONFIRMADO');
  SpreadsheetApp.flush();
  record[17] = 'CONFIRMADO';
  return arbitrajeJson_({success:true,id:record[0],marcador:resultadoPublico_(record)});
}
function guardarResultado_(d,raw,lock) {
  var prepared = false;
  try {
    if (!d || d.action !== 'resultado' || typeof d.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(d.id) ||
        typeof d.encuentroId !== 'string' || !/^[0-9a-f]{64}$/.test(d.encuentroId) || typeof d.email !== 'string' || !d.email.includes('@') ||
        !Number.isSafeInteger(d.version) || d.version < 0 || !Number.isSafeInteger(d.a) || d.a < 0 || d.a > 999 ||
        !Number.isSafeInteger(d.b) || d.b < 0 || d.b > 999 || !['pendiente','en-juego','finalizado'].includes(d.estado) ||
        (d.estado === 'pendiente' && (d.a !== 0 || d.b !== 0)) ||
        !Number.isSafeInteger(d.puntosA) || d.puntosA < 0 || d.puntosA > 10000 || !Number.isSafeInteger(d.puntosB) || d.puntosB < 0 || d.puntosB > 10000 ||
        (d.estado !== 'finalizado' && (d.puntosA !== 0 || d.puntosB !== 0)) ||
        typeof d.motivo !== 'string' || d.motivo.trim().length < 3 || d.motivo.length > 300) throw new Error('INVALID');
    if (d.estado === 'finalizado') resultadoCelda_('white',d.categoria,d.fila);
    // Recovery is independent of later fixture changes or upstream outages.
    lock.waitLock(20000);
    var sheet = resultadoSheet_(), rows = resultadoRows_(sheet), fingerprint = resultadoHash_(raw);
    var index = rows.findIndex(function(r){return r[0] === d.id;});
    if (index >= 0) {
      if (rows[index][11] !== fingerprint) throw new Error('ID_REUSED');
      if (rows[index][17] === 'CONFIRMADO') return arbitrajeJson_({success:true,id:d.id,marcador:resultadoPublico_(rows[index])});
      if (rows[index][17] !== 'PENDIENTE') throw new Error('ID_REUSED');
      prepared = true;
      return resultadoCompletar_(sheet,index,rows[index]);
    }
    if (rows.some(function(r){return r[17] === 'PENDIENTE';})) throw new Error('OTHER_PENDING');
    var manual = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HistorialArbitraje');
    if (manual && manual.getLastRow()>1 && manual.getRange(2,12,manual.getLastRow()-1,1).getValues().some(function(r){return r[0]==='PENDIENTE';})) throw new Error('OTHER_PENDING');
    lock.releaseLock();
    if (typeof d.fixtureUrl !== 'string' || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(d.fixtureUrl)) throw new Error('NOT_CONFIGURED');
    var response = UrlFetchApp.fetch(d.fixtureUrl,{muteHttpExceptions:true});
    if (response.getResponseCode() !== 200) throw new Error('FIXTURE_UNAVAILABLE');
    var fixture = JSON.parse(response.getContentText());
    if (fixture.fuente !== '14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg' || fixture.resultadosVersion !== 2 || !Array.isArray(fixture.partidos)) throw new Error('UPDATE_REQUIRED');
    var matches = fixture.partidos.filter(function(p){return p.encuentroId === d.encuentroId;});
    if (matches.length !== 1 || matches[0].admiteMarcador !== true) throw new Error('FIXTURE_CHANGED');
    var match = matches[0], houses = match.houses;
    if (!Array.isArray(houses) || houses.length !== 2 || houses[0] === houses[1]) throw new Error('FIXTURE_CHANGED');
    lock.waitLock(20000);
    rows = resultadoRows_(sheet);
    // Another invocation may have prepared the same operation while fetching.
    index = rows.findIndex(function(r){return r[0] === d.id;});
    if (index >= 0) {
      if (rows[index][11] !== fingerprint) throw new Error('ID_REUSED');
      if (rows[index][17] === 'CONFIRMADO') return arbitrajeJson_({success:true,id:d.id,marcador:resultadoPublico_(rows[index])});
      prepared = true; return resultadoCompletar_(sheet,index,rows[index]);
    }
    if (rows.some(function(r){return r[17] === 'PENDIENTE';})) throw new Error('OTHER_PENDING');
    if (manual && manual.getLastRow()>1 && manual.getRange(2,12,manual.getLastRow()-1,1).getValues().some(function(r){return r[0]==='PENDIENTE';})) throw new Error('OTHER_PENDING');
    var records = rows.filter(function(r){return r[1] === d.encuentroId;}), current = records.length ? records[records.length-1] : null;
    if (d.version !== (current ? Number(current[2]) : 0)) throw new Error('CONFLICT');
    var deltas = {};
    function add(h,c,f,n) { if (!n) return; var cell = resultadoCelda_(h,c,f); deltas[cell] = (deltas[cell] || 0)+n; }
    if (current && current[17] === 'CONFIRMADO') {
      add(current[5],current[16],Number(current[15]),-Number(current[13]));
      add(current[6],current[16],Number(current[15]),-Number(current[14]));
    }
    if (d.estado === 'finalizado') { add(houses[0],d.categoria,d.fila,d.puntosA); add(houses[1],d.categoria,d.fila,d.puntosB); }
    var scores = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sábana');
    if (!scores) throw new Error('NOT_CONFIGURED');
    // Validate even zero-point destinations (no hidden formula/protected target).
    if (d.estado === 'finalizado') houses.forEach(function(h){var key=resultadoCelda_(h,d.categoria,d.fila); if (!(key in deltas)) deltas[key]=0;});
    var plan = Object.keys(deltas).map(function(key) {
      var cell=scores.getRange(key), before=cell.getValue(); if(before==='') before=0;
      if(cell.getFormula() || cell.getBackground().toLowerCase()==='#000000' || !Number.isSafeInteger(before) || before<0) throw new Error('CELL_INVALID');
      var after=before+deltas[key]; if(!Number.isSafeInteger(after) || after<0) throw new Error('INSUFFICIENT_POINTS');
      return {cell:key,before:before,after:after};
    });
    var record=[d.id,d.encuentroId,d.version+1,new Date(),arbitrajeTexto_(d.email),houses[0],houses[1],d.a,d.b,d.estado,
      arbitrajeTexto_(d.motivo.trim()),fingerprint,arbitrajeTexto_(JSON.stringify(match)),d.puntosA,d.puntosB,d.estado==='finalizado'?d.fila:'',d.estado==='finalizado'?d.categoria:'','PENDIENTE',JSON.stringify(plan)];
    sheet.getRange(1,14,1,6).setValues([['PuntosA','PuntosB','FilaPuntaje','CategoriaPuntaje','EstadoRegistro','PlanRecuperacion']]);
    sheet.getRange(sheet.getLastRow()+1,1,1,19).setValues([record]);
    prepared=true; SpreadsheetApp.flush();
    return resultadoCompletar_(sheet,rows.length,record);
  } catch(err) {
    var known=['INVALID','ID_REUSED','OTHER_PENDING','NOT_CONFIGURED','UPDATE_REQUIRED','FIXTURE_CHANGED','CONFLICT','CELL_INVALID','INSUFFICIENT_POINTS','REVIEW_REQUIRED','FIXTURE_UNAVAILABLE'];
    return arbitrajeJson_({success:false,code:known.includes(err.message)?err.message:'UNCONFIRMED',pending:prepared});
  }
}
