// Variante solo doPost: no instalar junto a CodigoCompletoDiagnostico.gs. Conservar un solo doPost por proyecto.
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var envelope = JSON.parse(e.postData.contents);
    var secret = PropertiesService.getScriptProperties().getProperty('ARBITRAJE_SECRET');
    if (!secret || secret.length < 32) throw new Error('AUTH_CONFIG');
    if (!envelope || typeof envelope.payload !== 'string' || envelope.payload.length > 4096) throw new Error('AUTH_PAYLOAD');
    if (!Number.isSafeInteger(envelope.timestamp)) throw new Error('AUTH_TIMESTAMP');
    if (Math.abs(Date.now() - envelope.timestamp) > 120000) throw new Error('AUTH_EXPIRED');
    var expected = Utilities.computeHmacSha256Signature(envelope.timestamp + '.' + envelope.payload, secret, Utilities.Charset.UTF_8)
      .map(function(b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
    if (typeof envelope.signature !== 'string' || !/^[0-9a-f]{64}$/.test(envelope.signature)) throw new Error('AUTH_SIGNATURE_FORMAT');
    var difference = 0;
    for (var i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ envelope.signature.charCodeAt(i);
    if (difference !== 0) throw new Error('AUTH_SIGNATURE_MISMATCH');
    var data = JSON.parse(envelope.payload);
    // Sonda autenticada: termina antes de abrir Sheets o adquirir el bloqueo.
    if (data && data.action === 'diagnostico-autorizacion') {
      return arbitrajeJson_({success:true, diagnostico:'AUTH_OK', revision:'auth-v2'});
    }
    if (data.action === 'resultado') {
      if (typeof guardarResultado_ !== 'function') return arbitrajeJson_({success:false,code:'UPDATE_REQUIRED'});
      return guardarResultado_(data,envelope.payload,lock);
    }
    var columns = {
      white: { promesas: 'D', infantil: 'E', junior: 'F', juvenila: 'G', juvenilb: 'H' },
      blue: { promesas: 'J', infantil: 'K', junior: 'L', juvenila: 'M', juvenilb: 'N' },
      orange: { promesas: 'P', infantil: 'Q', junior: 'R', juvenila: 'S', juvenilb: 'T' },
      green: { promesas: 'V', infantil: 'W', junior: 'X', juvenila: 'Y', juvenilb: 'Z' }
    };
    var rows = Array.from({length: 24}, function(_, i) { return i + 8; }).concat([34,35,36,37]);
    if (!['white','blue','orange','green'].includes(data.house) ||
        !['promesas','infantil','junior','juvenila','juvenilb'].includes(data.categoria) ||
        !rows.includes(data.fila) || !['sumar','restar'].includes(data.operacion) ||
        !Number.isSafeInteger(data.puntos) || data.puntos < 1 || data.puntos > 10000 ||
        typeof data.email !== 'string' || !data.email.includes('@') ||
        typeof data.motivo !== 'string' || data.motivo.trim().length < 3 || data.motivo.length > 300 ||
        typeof data.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.id)) throw new Error('Datos inválidos');
    lock.waitLock(20000);
    if (typeof resultadoPendiente_ === 'function' && resultadoPendiente_()) return arbitrajeJson_({success:false,pending:true,error:'Completa el resultado pendiente antes de registrar otros puntos.'});
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Sábana');
    if (!sheet) throw new Error('Hoja no encontrada');
    var history = ss.getSheetByName('HistorialArbitraje');
    if (!history) {
      history = ss.insertSheet('HistorialArbitraje');
      history.appendRow(['ID','Fecha','Árbitro','House','Categoría','Fila','Operación','Puntos','Anterior','Nuevo','Motivo','Estado','Huella']);
    }
    var fingerprint = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, envelope.payload)
      .map(function(b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
    var existing = history.getLastRow() > 1
      ? history.getRange(2,1,history.getLastRow()-1,1).createTextFinder(data.id).matchEntireCell(true).findNext() : null;
    if (existing) {
      var record = history.getRange(existing.getRow(),1,1,13).getValues()[0];
      if (record[12] !== fingerprint) throw new Error('Identificador reutilizado con otros datos');
      return arbitrajeJson_({ success: record[11] === 'CONFIRMADO', pending: record[11] !== 'CONFIRMADO', id: data.id, nuevo: record[9] });
    }
    var cell = sheet.getRange(columns[data.house][data.categoria] + data.fila);
    if (cell.getFormula() || cell.getBackground().toLowerCase() === '#000000') throw new Error('Celda no habilitada');
    var value = cell.getValue();
    if (value !== '' && (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)) throw new Error('Puntaje actual inválido');
    var previous = value === '' ? 0 : value;
    var next = data.operacion === 'sumar' ? previous + data.puntos : Math.max(0, previous - data.puntos);
    if (!Number.isSafeInteger(next)) throw new Error('Puntaje fuera de rango');
    // Se registra PENDIENTE antes de escribir: ante un fallo parcial no se reaplica automáticamente.
    history.appendRow([data.id,new Date(),arbitrajeTexto_(data.email),data.house,data.categoria,data.fila,
      data.operacion,data.puntos,previous,next,arbitrajeTexto_(data.motivo),'PENDIENTE',fingerprint]);
    var historyRow = history.getLastRow();
    SpreadsheetApp.flush();
    cell.setValue(next);
    SpreadsheetApp.flush();
    history.getRange(historyRow,12).setValue('CONFIRMADO');
    SpreadsheetApp.flush();
    return arbitrajeJson_({success:true,id:data.id,nuevo:next});
  } catch (error) {
  var mensaje = error && error.message
    ? error.message
    : String(error);

  console.error(error && error.stack ? error.stack : mensaje);

  var erroresConocidos = [
    'No autorizado',
    'AUTH_CONFIG', 'AUTH_PAYLOAD', 'AUTH_TIMESTAMP', 'AUTH_EXPIRED',
    'AUTH_SIGNATURE_FORMAT', 'AUTH_SIGNATURE_MISMATCH',
    'Datos inválidos',
    'Hoja no encontrada',
    'Identificador reutilizado con otros datos',
    'Celda no habilitada',
    'Puntaje actual inválido',
    'Puntaje fuera de rango'
  ];

  return arbitrajeJson_({
    success: false,
    error: 'Solicitud rechazada o no confirmada',
    diagnostico: erroresConocidos.includes(mensaje)
      ? mensaje
      : 'Error interno: consultar registros de ejecución'
  });
} finally {
  if (lock.hasLock()) lock.releaseLock();
  }
}
function arbitrajeJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function arbitrajeTexto_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}




