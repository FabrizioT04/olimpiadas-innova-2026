// =========================================================================
// --- 📡 ENRUTADOR INTERACTIVO RECALIBRADO PARA HISTORIAL EN VIVO ---
// =========================================================================
function doGet(e) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  let pagina = e.parameter.page || 'retos';
  pagina = pagina.toLowerCase().trim();

  if (pagina === 'api_puntos') {
    const dataPuntajesCompleto = obtenerPuntajesCasasReales();
    
    // Capturamos el nombre de la función que manda la web (por defecto 'procesarPodio')
    const callback = e.parameter.callback || 'procesarPodio';
    
    // Envolvemos el JSON dentro de la función de texto plano ultra compatible
    const textoJSONP = callback + "(" + JSON.stringify(dataPuntajesCompleto) + ");";
    
    return ContentService.createTextOutput(textoJSONP)
                         .setMimeType(ContentService.MimeType.JAVASCRIPT); // Forzamos tipo JS
  }
  // Mantenemos tus subpáginas internas intactas para que no pierdas tus vistas
  if (pagina === 'puntajes' || pagina === 'reglamento') {
    const template = HtmlService.createTemplateFromFile('PuntajesReglamento');
    return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (pagina === 'categorias') {
    const template = HtmlService.createTemplateFromFile('CategoriasVista');
    return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (pagina === 'fechas' || pagina === 'cronograma') {
    const template = HtmlService.createTemplateFromFile('FechasCronograma');
    return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (pagina === 'fixture' || pagina === 'partidos') {
    const template = HtmlService.createTemplateFromFile('FixtureRecreos');
    return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else {
    const template = HtmlService.createTemplateFromFile('Index');
    return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

function obtenerDatosOlimpiadas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojas = ss.getSheets();
    
    let hojaSeleccionada = hojas[0];
    for (let i = 0; i < hojas.length; i++) {
      let nombreLimpio = hojas[i].getName().toLowerCase().trim();
      if (nombreLimpio.includes("white")) {
        hojaSeleccionada = hojas[i];
        break;
      }
    }
    
    const rango = hojaSeleccionada.getDataRange();
    const valores = rango.getValues();
    
    return { matriz: valores.map(f => f.map(c => c !== null && c !== undefined ? String(c).trim() : "")) };
  } catch(e) {
    return { error: "Error de lectura en retos: " + e.toString() };
  }
}

// --- 📊 LECTURA LIMPIA FIJADA A LA CELDA I36 (SIN REGRESIÓN DE NÚMEROS FALSOS) ---
function obtenerPuntajesCasasReales() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    let totalWhite = 0;
    let totalBlue = 0;
    let totalOrange = 0;
    let totalGreen = 0;

    const hojaW = ss.getSheetByName("White");
    const hojaB = ss.getSheetByName("Blue");
    const hojaO = ss.getSheetByName("Orange");
    const hojaG = ss.getSheetByName("Green");

    if (hojaW) { let val = parseInt(hojaW.getRange("I36").getValue(), 10); if (!isNaN(val)) totalWhite = val; }
    if (hojaB) { let val = parseInt(hojaB.getRange("I36").getValue(), 10); if (!isNaN(val)) totalBlue = val; }
    if (hojaO) { let val = parseInt(hojaO.getRange("I36").getValue(), 10); if (!isNaN(val)) totalOrange = val; }
    if (hojaG) { let val = parseInt(hojaG.getRange("I36").getValue(), 10); if (!isNaN(val)) totalGreen = val; }

    const hojaSabana = ss.getSheetByName("Sábana");
    const historialReal = [];
    
    if (hojaSabana) {
      const ultimaFila = hojaSabana.getLastRow();
      // Si el appendRow ya registró movimientos más abajo de la fila 40
      if (ultimaFila > 40) {
        const inicioLectura = Math.max(41, ultimaFila - 4);
        const cantidadFilas = (ultimaFila - inicioLectura) + 1;
        
        // Leemos las columnas: Fecha (A), Operacion (B), Puntos (C), Actividad (D)
        const rangoHistorial = hojaSabana.getRange(inicioLectura, 1, cantidadFilas, 4).getValues();
        
        // Recorremos de la más nueva a la más antigua
        for (let i = rangoHistorial.length - 1; i >= 0; i--) {
          historialReal.push({
            operacion: String(rangoHistorial[i][1]).toLowerCase().trim(),
            puntos: parseInt(rangoHistorial[i][2], 10) || 0,
            juego: String(rangoHistorial[i][3])
          });
        }
      }
    }
    return {
      white: totalWhite,
      blue: totalBlue,
      orange: totalOrange,
      green: totalGreen,
      movimientos: historialReal
    };
    
  } catch(e) {
    return { white: 0, blue: 0, orange: 0, green: 0, movimientos: [], error: e.toString() };
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =========================================================
// --- 📥 INYECCIÓN EN CALIENTE EN MATRIZ DE CATEGORÍAS ---
// =========================================================

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



