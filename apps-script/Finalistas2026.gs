// Añadir al proyecto Fixture. Lee ambas pestañas; nunca escribe en Sheets.
var FINALISTAS_2026_ID = '1veYH7makMh_8DKzhNaoTi9QQRYT00oRpxNoPdtnWh7c';

function aplicarFinalistas2026_(fixture) {
  var book = SpreadsheetApp.openById(FINALISTAS_2026_ID);
  var sheets = ['Hoja 1', 'Hoja 2'].map(function(name) {
    var sheet = book.getSheetByName(name);
    if (!sheet) throw new Error('Falta la pestaña de finalistas: ' + name);
    var range = sheet.getDataRange();
    return { name: name, id: sheet.getSheetId(), values: range.getDisplayValues(),
      merges: range.getMergedRanges().map(function(m) {
        return [m.getRow()-1, m.getColumn()-1, m.getNumRows(), m.getNumColumns()];
      }) };
  });
  fixture.finalistas = parseFinalistas2026_(sheets);
  return fixture;
}

function parseFinalistas2026_(sheets) {
  var results = [], index = {};
  function pending(value) { return !value || /^(VS|POR DEFINIR)$/i.test(value.trim()); }
  sheets.forEach(function(sheet) {
    var rows = sheet.values.map(function(row) { return row.slice(); });
    sheet.merges.forEach(function(m) {
      // Solo heredar la disciplina; los cruces y puestos se leen de su propia fila.
      if (m[1] !== 0 || m[3] !== 1) return;
      for (var r = m[0]; r < m[0]+m[2]; r++) rows[r][0] = sheet.values[m[0]][0];
    });
    rows.forEach(function(row, r) {
      var category = clean(row[1]);
      if (!category || norm(category) === 'CATEGORIA') return;
      var sport = clean(row[0]);
      if (!sport || /FINALISTAS|DISCIPLINA/.test(norm(sport))) return;
      var item = { id: 'finalistas2026:' + sheet.id + ':' + (r+1), deporte: sport, categoria: category,
        terceroCuarto: pending(clean(row[3])) ? '' : clean(row[3]),
        primeroSegundo: pending(clean(row[7])) ? '' : clean(row[7]),
        puestos: [10,11,12,13].map(function(c) {
          var value = clean(row[c]);
          return /^(1ERO|2DO|3ERO|4TO)$/i.test(value) ? '' : value;
        }), origen: sheet.name, fila: r+1 };
      var key = norm(sport) + '|' + norm(category), previous = index[key];
      if (previous) {
        var fields = ['terceroCuarto','primeroSegundo'];
        var conflict = fields.some(function(k) { return previous[k] && item[k] && norm(previous[k]) !== norm(item[k]); }) ||
          item.puestos.some(function(v, i) { return v && previous.puestos[i] && norm(v) !== norm(previous.puestos[i]); });
        if (!conflict) {
          fields.forEach(function(k) { if (!previous[k]) previous[k] = item[k]; });
          item.puestos.forEach(function(v, i) { if (!previous.puestos[i]) previous.puestos[i] = v; });
          return;
        }
      }
      results.push(item);
      if (!previous) index[key] = item;
    });
  });
  return results;
}
