// Añadir al proyecto de PUNTAJES, junto a ArbitrajeSeguro.gs y ResultadoUnificado.gs.
// Clasificación por puestos de una actividad en la que participan las cuatro Houses.
// Se guarda en la hoja privada «Marcadores» con el mismo formato de 19 columnas que los
// resultados: comparte el bloqueo, el estado PENDIENTE y recuperarResultadoPendiente_.
// Columnas propias: B = clasificacion:<fila>:<categoria>, J = 'clasificacion',
// M = {puestos, puntos} en JSON; P = fila y Q = categoría de la Sábana.
var CLASIFICACION_HOUSES = ['white','blue','orange','green'];

function clasificacionClave_(fila, categoria) { return 'clasificacion:' + fila + ':' + categoria; }
function clasificacionRespuesta_(r) {
  var datos = JSON.parse(r[12]);
  return {version:Number(r[2]), fila:Number(r[15]), categoria:r[16], puestos:datos.puestos, puntos:datos.puntos,
    actualizado:new Date(r[3]).toISOString(), integrado:r[17] === 'CONFIRMADO'};
}
function clasificacionValores_(value, min, max) {
  if (!value || typeof value !== 'object' || Object.keys(value).length !== CLASIFICACION_HOUSES.length) return null;
  var out = {};
  for (var i = 0; i < CLASIFICACION_HOUSES.length; i++) {
    var v = value[CLASIFICACION_HOUSES[i]];
    if (!Number.isSafeInteger(v) || v < min || v > max) return null;
    out[CLASIFICACION_HOUSES[i]] = v;
  }
  return out;
}

function guardarClasificacion_(d, raw, lock) {
  var prepared = false;
  try {
    var puestos = d && clasificacionValores_(d.puestos, 1, 4), puntos = d && clasificacionValores_(d.puntos, 0, 10000);
    if (!d || d.action !== 'clasificacion' || typeof d.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(d.id) ||
        typeof d.email !== 'string' || !d.email.includes('@') || !Number.isSafeInteger(d.version) || d.version < 0 ||
        !puestos || !puntos || typeof d.motivo !== 'string' || d.motivo.trim().length < 3 || d.motivo.length > 300) throw new Error('INVALID');
    // Each position from 1st to 4th belongs to exactly one House: no ties.
    if (CLASIFICACION_HOUSES.map(function(h) { return puestos[h]; }).sort().join() !== '1,2,3,4') throw new Error('INVALID');
    resultadoCelda_('white', d.categoria, d.fila);
    lock.waitLock(20000);
    var sheet = resultadoSheet_(), rows = resultadoRows_(sheet), fingerprint = resultadoHash_(raw);
    var index = rows.findIndex(function(r) { return r[0] === d.id; });
    if (index >= 0) {
      if (rows[index][11] !== fingerprint) throw new Error('ID_REUSED');
      if (rows[index][17] === 'CONFIRMADO') return arbitrajeJson_({success:true, id:d.id, clasificacion:clasificacionRespuesta_(rows[index])});
      if (rows[index][17] !== 'PENDIENTE') throw new Error('ID_REUSED');
      prepared = true;
      resultadoCompletar_(sheet, index, rows[index]);
      return arbitrajeJson_({success:true, id:d.id, clasificacion:clasificacionRespuesta_(rows[index])});
    }
    if (rows.some(function(r) { return r[17] === 'PENDIENTE'; })) throw new Error('OTHER_PENDING');
    var manual = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HistorialArbitraje');
    if (manual && manual.getLastRow() > 1 && manual.getRange(2,12,manual.getLastRow()-1,1).getValues().some(function(r) { return r[0] === 'PENDIENTE'; })) throw new Error('OTHER_PENDING');
    var clave = clasificacionClave_(d.fila, d.categoria);
    var records = rows.filter(function(r) { return r[1] === clave; }), current = records.length ? records[records.length-1] : null;
    if (d.version !== (current ? Number(current[2]) : 0)) throw new Error('CONFLICT');
    // A correction replaces the previous award: only the difference reaches the Sábana.
    var anterior = current && current[17] === 'CONFIRMADO' ? JSON.parse(current[12]).puntos : null;
    var scores = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sábana');
    if (!scores) throw new Error('NOT_CONFIGURED');
    var plan = CLASIFICACION_HOUSES.map(function(h) {
      var key = resultadoCelda_(h, d.categoria, d.fila), cell = scores.getRange(key), before = cell.getValue();
      if (before === '') before = 0;
      if (cell.getFormula() || cell.getBackground().toLowerCase() === '#000000' || !Number.isSafeInteger(before) || before < 0) throw new Error('CELL_INVALID');
      var after = before + puntos[h] - (anterior ? Number(anterior[h]) || 0 : 0);
      if (!Number.isSafeInteger(after) || after < 0) throw new Error('INSUFFICIENT_POINTS');
      return {cell:key, before:before, after:after};
    });
    var record = [d.id, clave, d.version+1, new Date(), arbitrajeTexto_(d.email), '', '', '', '', 'clasificacion',
      arbitrajeTexto_(d.motivo.trim()), fingerprint, JSON.stringify({puestos:puestos, puntos:puntos}), '', '', d.fila, d.categoria, 'PENDIENTE', JSON.stringify(plan)];
    sheet.getRange(sheet.getLastRow()+1,1,1,19).setValues([record]);
    prepared = true; SpreadsheetApp.flush();
    resultadoCompletar_(sheet, rows.length, record);
    return arbitrajeJson_({success:true, id:d.id, clasificacion:clasificacionRespuesta_(record)});
  } catch (err) {
    var known = ['INVALID','ID_REUSED','OTHER_PENDING','NOT_CONFIGURED','CONFLICT','CELL_INVALID','INSUFFICIENT_POINTS','REVIEW_REQUIRED'];
    return arbitrajeJson_({success:false, code:known.includes(err.message) ? err.message : 'UNCONFIRMED', pending:prepared});
  }
}
