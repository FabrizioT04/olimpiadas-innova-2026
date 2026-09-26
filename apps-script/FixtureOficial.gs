// Proyecto de Apps Script del FIXTURE. No instalar en ArbitrajeSeguro.
// Conserva las hojas oficiales. Los marcadores se guardan en un archivo privado aparte.
var FIXTURE_ID = '14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg';
var FIXTURE_YEAR = 2026;

function leerFixture_() {
    var book = SpreadsheetApp.openById(FIXTURE_ID);
    var sheets = book.getSheets().filter(function (s) {
      return /^(SEMANA\s+[123]|MARTES|MIERCOLES|JUEVES|VIERNES|FINALISTAS)/.test(norm(s.getName()));
    });
    var source = sheets.map(function (s) {
      var range = s.getDataRange();
      var values = range.getDisplayValues();
      var raw = range.getValues();
      raw.forEach(function (row, r) { row.forEach(function (v, c) {
        if (v instanceof Date && !isNaN(v.getTime()) && v.getFullYear() > 2000) {
          values[r][c] = Utilities.formatDate(v, book.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
        }
      }); });
      return { name: s.getName(), id: s.getSheetId(), values: values,
        merges: range.getMergedRanges().map(function (m) {
          return [m.getRow()-1, m.getColumn()-1, m.getNumRows(), m.getNumColumns()];
        }) };
    });
    var fixture = parseFixture(source);
    if (typeof aplicarFinalistas2026_ === 'function') fixture = aplicarFinalistas2026_(fixture);
    return fixture;
}

function doGet() {
  try {
    var fixture = leerFixture_();
    if (typeof enriquecerMarcadores_ === 'function') fixture = enriquecerMarcadores_(fixture);
    return fixtureJson(fixture);
  } catch (err) {
    console.error(err);
    return fixtureJson({ error: 'No se pudo leer el fixture oficial. Revisa el acceso del script al archivo.' });
  }
}

function doPost(e) {
  if (typeof guardarMarcador_ === 'function') return guardarMarcador_(e);
  return fixtureJson({ status: 'error', message: 'El fixture oficial es de solo lectura. Edita las pestañas de Google Sheets.' });
}

function fixtureJson(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function norm(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}
function clean(value) { return String(value == null ? '' : value).replace(/\s+/g, ' ').trim(); }
function dateValue(value) {
  var text = clean(value), m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    var d = text.match(/(?:^|\s)(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?(?:$|\s)/);
    if (!d) return '';
    m = ['', d[3] || String(FIXTURE_YEAR), d[2].padStart(2, '0'), d[1].padStart(2, '0')];
  }
  var date = new Date(Date.UTC(+m[1], +m[2]-1, +m[3]));
  return date.getUTCFullYear() === +m[1] && date.getUTCMonth() === +m[2]-1 && date.getUTCDate() === +m[3]
    ? m[1] + '-' + m[2] + '-' + m[3] : '';
}
function expandedSheet(sheet) {
  var rows = sheet.values.map(function (row) { return row.map(clean); });
  var roots = rows.map(function (row, r) { return row.map(function (_, c) { return r + ':' + c; }); });
  sheet.merges.forEach(function (m) {
    for (var r = m[0]; r < m[0]+m[2]; r++) {
      if (!rows[r]) continue;
      for (var c = m[1]; c < m[1]+m[3]; c++) {
        rows[r][c] = clean(sheet.values[m[0]][m[1]]);
        roots[r][c] = m[0] + ':' + m[1];
      }
    }
  });
  return { rows: rows, roots: roots };
}
function parseFixture(sheets) {
  var partidos = [], finalistas = [], avisos = [];
  sheets.forEach(function (sheet) {
    var expanded = expandedSheet(sheet), rows = expanded.rows, roots = expanded.roots;
    var name = norm(sheet.name), weekly = /^SEMANA/.test(name);
    var headers = null, sectionDate = '', title = '', category = '', phase = '';
    function at(row, key) { return headers && headers[key] != null ? row[headers[key]] || '' : ''; }
    function span(row, start, end, r) {
      var seen = {}, parts = [];
      for (var c = start; c < end; c++) {
        var root = roots[r][c];
        if (!seen[root] && row[c]) parts.push(row[c]);
        seen[root] = true;
      }
      return parts.join(' ').trim();
    }
    rows.forEach(function (row, r) {
      var original = sheet.values[r].map(clean), n = original.map(norm);
      if (name === 'FINALISTAS') {
        if (/FINALISTAS/.test(n[0])) title = original[0];
        if (!original[1] || /CATEGORIA/.test(n[1])) return;
        var sport = row[0] || (/GINKANA|GYMKANA/.test(norm(title)) ? 'Gymkana' : 'Por definir');
        finalistas.push({ id: sheet.id + ':' + (r+1), deporte: sport, categoria: original[1],
          terceroCuarto: clean(original[3]) + ' VS ' + clean(original[5]),
          primeroSegundo: clean(original[9]) + ' VS ' + clean(original[11]),
          puestos: [13,14,15,16].map(function (c) { return original[c] || ''; }),
          origen: sheet.name, fila: r+1 });
        return;
      }
      if (n.indexOf('HORA') >= 0 && n.indexOf('DISCIPLINA') >= 0) {
        headers = {};
        n.forEach(function (v, c) {
          var key = v === 'HORA' ? 'hora' : v === 'DIA' ? 'dia' : v === 'DISCIPLINA' ? 'deporte'
            : v === 'EQUIPOS' ? 'equipos' : /^CATEGORIA/.test(v) ? 'categoria'
            : v === 'PARTIDO' ? 'fase' : /^(CAMPO|LUGAR)$/.test(v) ? 'lugar'
            : /^RESPONSABLES/.test(v) ? 'arbitro' : v === 'BLOQUE' ? 'bloque' : '';
          if (key) headers[key] = c;
        });
        return;
      }
      // A date in a title row applies to the following block, including blocks below the fold.
      var foundDate = original.map(dateValue).find(function (v) { return !!v; });
      var hour = at(row, 'hora');
      var isTime = /^\d{1,3}:\d{2}/.test(hour);
      if (!isTime) {
        if (foundDate) sectionDate = foundDate;
        var label = original.filter(Boolean).join(' ');
        if (/^(PROMESAS|INFANTIL|JUNIOR|JUVENIL)/.test(norm(label))) category = label;
        else if (/PRELIMINAR|RECREOS/.test(norm(label))) phase = label;
        else if (label && !foundDate) { title = label; phase = ''; }
        return;
      }
      var fecha = dateValue(at(row, 'dia')) || sectionDate;
      var sport = at(row, 'deporte');
      var teams = headers.equipos == null ? '' : span(row, headers.equipos, headers.categoria, r);
      // An activity can occupy the teams columns through a merge: it is not an opponent.
      if (headers.deporte != null && headers.equipos != null && roots[r][headers.deporte] === roots[r][headers.equipos]) teams = '';
      if (/^VS$/i.test(teams)) teams = '';
      var matchPhase = at(row, 'fase');
      if (/^\d+$/.test(matchPhase)) matchPhase = /PUESTO/.test(norm(title)) ? title : phase;
      var issues = [];
      if (!fecha) issues.push('Fecha por definir');
      else if (+fecha.slice(0,4) !== FIXTURE_YEAR) issues.push('Revisar año en la hoja: ' + fecha);
      if (/\b\d{3}:/.test(hour)) issues.push('Revisar hora en la hoja');
      partidos.push({ id: sheet.id + ':' + (r+1), semana: weekly ? +name.match(/\d+/)[0] : 3,
        fecha: fecha, dia: fecha || 'Fecha por definir', hora: hour, deporte: sport || 'Por definir',
        enfrentamiento: teams || 'Equipos por definir', categoria: at(row,'categoria') || category || 'Por definir',
        arbitro: at(row,'arbitro') || '', apoyo: '', lugar: at(row,'lugar') || 'Por definir',
        fase: matchPhase || '', bloque: at(row,'bloque'), seccion: title,
        estado: 'programado', origen: sheet.name, fila: r+1, avisos: issues });
    });
  });
  // Only exact repeats between weekly summaries and dated tabs are collapsed.
  // Distinct recess and daytime sessions on the same date remain visible.
  var unique = {};
  partidos.forEach(function (p) {
    var key = [p.fecha,p.hora,p.deporte,p.enfrentamiento,p.categoria,p.fase,p.lugar].map(norm).join('|');
    var previous = unique[key];
    if (!previous || previous.origen === p.origen) unique[key + (previous ? '|' + p.id : '')] = p;
    else if (/^SEMANA/.test(norm(previous.origen)) && !/^SEMANA/.test(norm(p.origen))) unique[key] = p;
  });
  partidos = Object.keys(unique).map(function (k) { return unique[k]; });
  partidos.sort(function (a,b) { return a.fecha.localeCompare(b.fecha); });
  if (!sheets.length) throw new Error('No hay pestañas oficiales reconocidas');
  if (partidos.some(function (p) { return p.avisos.length; })) avisos.push('Hay fechas u horas pendientes de revisión; consulta el aviso de cada actividad.');
  return { version: 1, fuente: FIXTURE_ID, actualizado: new Date().toISOString(), partidos: partidos,
    finalistas: finalistas, avisos: avisos, pestanas: sheets.map(function (s) { return s.name; }) };
}
