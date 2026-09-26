// Añadir al MISMO proyecto que FixtureOficial.gs. No contiene otro doGet/doPost.
// Ejecutar prepararMarcadores una sola vez desde el editor (crea un archivo privado).
function prepararMarcadores() {
  var props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var id = props.getProperty('MARCADORES_SPREADSHEET_ID');
    var book = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('Marcadores Olimpiadas 2026');
    if (!id) props.setProperty('MARCADORES_SPREADSHEET_ID', book.getId());
    var sheet = book.getSheetByName('Marcadores') || book.insertSheet('Marcadores');
    if (!sheet.getLastRow()) sheet.appendRow(['OperacionID','EncuentroID','Version','Fecha','Arbitro','HouseA','HouseB','MarcadorA','MarcadorB','Estado','Motivo','Huella','Encuentro']);
    console.log('Registro privado: ' + book.getUrl());
  } finally { lock.releaseLock(); }
}
function marcadorHex_(bytes) {
  return bytes.map(function (b) { return ('0'+((b+256)%256).toString(16)).slice(-2); }).join('');
}
function marcadorHash_(text) { return marcadorHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text)); }
function marcadorId_(p) {
  // No depende del número de fila. Cambiar la identidad del encuentro crea otro ID;
  // el registro anterior se conserva y nunca se transfiere a otro partido por posición.
  return marcadorHash_(JSON.stringify([p.fecha,p.hora,p.deporte,p.categoria,p.enfrentamiento,p.fase,p.lugar].map(norm)));
}
function marcadorHouses_(text) {
  var names = { BLANCO:'white', BLANCA:'white', AZUL:'blue', ANARANJADO:'orange', ANARANJADA:'orange', NARANJA:'orange', VERDE:'green' };
  var parts = norm(text).split(/\s+VS\.?\s+/);
  return parts.length === 2 && names[parts[0]] && names[parts[1]] && names[parts[0]] !== names[parts[1]]
    ? [names[parts[0]],names[parts[1]]] : null;
}
function marcadorSheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('MARCADORES_SPREADSHEET_ID');
  if (!id) throw new Error('NOT_CONFIGURED');
  var sheet = SpreadsheetApp.openById(id).getSheetByName('Marcadores');
  if (!sheet || sheet.getLastRow() < 1) throw new Error('NOT_CONFIGURED');
  return sheet;
}
function marcadorRows_(sheet) { return sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,19).getValues().filter(function(r){return !r[17] || r[17] === 'CONFIRMADO';}) : []; }
function marcadorPublico_(r) {
  return { version:Number(r[2]), houseA:r[5], houseB:r[6], a:Number(r[7]), b:Number(r[8]), estado:r[9], actualizado:new Date(r[3]).toISOString(),
    puntosA:Number(r[13]) || 0,puntosB:Number(r[14]) || 0,fila:Number(r[15]) || null,categoria:r[16] || '',integrado:r[17] === 'CONFIRMADO' };
}
function enriquecerMarcadores_(fixture) {
  var counts = {}, latest = {}, enabled = false;
  fixture.partidos.forEach(function (p) { p.encuentroId = marcadorId_(p); counts[p.encuentroId] = (counts[p.encuentroId] || 0)+1; });
  try {
    marcadorRows_(marcadorSheet_()).forEach(function (r) { latest[r[1]] = r; });
    var secret = PropertiesService.getScriptProperties().getProperty('ARBITRAJE_SECRET');
    enabled = !!secret && secret.length >= 32;
  } catch (_) { fixture.avisos.push('Los marcadores todavía no están disponibles. La programación sigue visible.'); }
  fixture.marcadoresHabilitados = enabled;
  fixture.resultadosVersion = 2;
  fixture.partidos.forEach(function (p) {
    p.houses = marcadorHouses_(p.enfrentamiento);
    p.admiteMarcador = !!p.houses && counts[p.encuentroId] === 1 && !!p.fecha && p.avisos.length === 0 && p.deporte !== 'Por definir';
    p.marcador = p.admiteMarcador && latest[p.encuentroId] ? marcadorPublico_(latest[p.encuentroId]) : null;
  });
  return fixture;
}
// Todas las escrituras pasan por el proyecto de puntajes y su bloqueo compartido.
function guardarMarcador_() {
  return fixtureJson({success:false,code:'UPDATE_REQUIRED'});
}
function marcadorTexto_(s) { return /^[=+\-@]/.test(s) ? "'"+s : s; }
