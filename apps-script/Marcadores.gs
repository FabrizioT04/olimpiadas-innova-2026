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
function marcadorRows_(sheet) { return sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,13).getValues() : []; }
function marcadorPublico_(r) {
  return { version:Number(r[2]), houseA:r[5], houseB:r[6], a:Number(r[7]), b:Number(r[8]), estado:r[9], actualizado:new Date(r[3]).toISOString() };
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
  fixture.partidos.forEach(function (p) {
    p.houses = marcadorHouses_(p.enfrentamiento);
    p.admiteMarcador = !!p.houses && counts[p.encuentroId] === 1 && !!p.fecha && p.avisos.length === 0 && p.deporte !== 'Por definir';
    p.marcador = p.admiteMarcador && latest[p.encuentroId] ? marcadorPublico_(latest[p.encuentroId]) : null;
  });
  return fixture;
}
function guardarMarcador_(e) {
  var lock = LockService.getScriptLock();
  try {
    var envelope = JSON.parse(e.postData.contents);
    var secret = PropertiesService.getScriptProperties().getProperty('ARBITRAJE_SECRET');
    if (!secret || secret.length < 32 || typeof envelope.payload !== 'string' || envelope.payload.length > 4096 ||
        !Number.isSafeInteger(envelope.timestamp) || Math.abs(Date.now()-envelope.timestamp) > 120000) throw new Error('UNAUTHORIZED');
    var expected = marcadorHex_(Utilities.computeHmacSha256Signature(envelope.timestamp+'.'+envelope.payload,secret));
    if (typeof envelope.signature !== 'string' || expected.length !== envelope.signature.length) throw new Error('UNAUTHORIZED');
    var diff = 0;
    for (var i=0; i<expected.length; i++) diff |= expected.charCodeAt(i)^envelope.signature.charCodeAt(i);
    if (diff) throw new Error('UNAUTHORIZED');
    var d = JSON.parse(envelope.payload);
    if (d.action !== 'marcador' || typeof d.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(d.id) ||
        typeof d.encuentroId !== 'string' || !/^[0-9a-f]{64}$/.test(d.encuentroId) ||
        typeof d.email !== 'string' || !d.email.includes('@') ||
        !Number.isSafeInteger(d.version) || d.version < 0 ||
        !Number.isSafeInteger(d.a) || d.a < 0 || d.a > 999 || !Number.isSafeInteger(d.b) || d.b < 0 || d.b > 999 ||
        !['pendiente','en-juego','finalizado'].includes(d.estado) ||
        (d.estado === 'pendiente' && (d.a !== 0 || d.b !== 0)) ||
        typeof d.motivo !== 'string' || d.motivo.trim().length < 3 || d.motivo.length > 300) throw new Error('INVALID');
    // Read the current fixture before taking the short write lock. Identity is then
    // checked against the current official values, not caller-supplied Houses.
    var matches = leerFixture_().partidos.filter(function (p) { return marcadorId_(p) === d.encuentroId; });
    lock.waitLock(20000);
    var sheet = marcadorSheet_(), rows = marcadorRows_(sheet), fingerprint = marcadorHash_(envelope.payload);
    var prior = rows.find(function (r) { return r[0] === d.id; });
    if (prior) {
      if (prior[11] !== fingerprint) throw new Error('ID_REUSED');
      return fixtureJson({success:true,id:d.id,marcador:marcadorPublico_(prior)});
    }
    if (matches.length !== 1) throw new Error('FIXTURE_CHANGED');
    var match = matches[0], houses = marcadorHouses_(match.enfrentamiento);
    if (!houses || !match.fecha || match.avisos.length || match.deporte === 'Por definir') throw new Error('FIXTURE_CHANGED');
    var records = rows.filter(function (r) { return r[1] === d.encuentroId; });
    var current = records.length ? records[records.length-1] : null;
    if (d.version !== (current ? Number(current[2]) : 0)) throw new Error('CONFLICT');
    // One append is both the current version and the audit record: no two-sheet
    // transaction, no score addition, and retries reuse the same operation ID.
    var record = [d.id,d.encuentroId,d.version+1,new Date(),marcadorTexto_(d.email),houses[0],houses[1],d.a,d.b,d.estado,
      marcadorTexto_(d.motivo.trim()),fingerprint,marcadorTexto_(JSON.stringify(match))];
    sheet.getRange(sheet.getLastRow()+1,1,1,record.length).setValues([record]);
    SpreadsheetApp.flush();
    return fixtureJson({success:true,id:d.id,marcador:marcadorPublico_(record)});
  } catch (err) {
    return fixtureJson({success:false,code:['CONFLICT','FIXTURE_CHANGED','ID_REUSED','NOT_CONFIGURED'].includes(err.message) ? err.message : 'REJECTED'});
  } finally { if (lock.hasLock()) lock.releaseLock(); }
}
function marcadorTexto_(s) { return /^[=+\-@]/.test(s) ? "'"+s : s; }
