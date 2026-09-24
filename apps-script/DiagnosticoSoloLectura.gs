// Añadir como archivo separado en Apps Script y ejecutar diagnosticarPuntajes.
// No modifica celdas, historial, propiedades ni implementaciones.
function diagnosticarPuntajes() {
  var resultado = {};
  function revisar(nombre, consulta) {
    try { resultado[nombre] = consulta(); }
    catch (error) { resultado[nombre] = { error: String(error.message || error) }; }
  }
  revisar('claveConfigurada', function() {
    var clave = PropertiesService.getScriptProperties().getProperty('ARBITRAJE_SECRET');
    return !!clave && clave.length >= 32;
  });
  revisar('huellaClave', function() {
    var clave = PropertiesService.getScriptProperties().getProperty('ARBITRAJE_SECRET');
    if (!clave) return null;
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, clave, Utilities.Charset.UTF_8)
      .map(function(b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('').slice(0, 16);
  });
  revisar('archivoCorrecto', function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return !!ss && ss.getId() === '1gui7j4oXk8D-ZJDcWKNIRI3bzqI0jzG21vEje9TEdIw';
  });
  revisar('celdaY25', function() {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sábana');
    if (!hoja) throw new Error('No existe Sábana');
    var celda = hoja.getRange('Y25');
    var valor = celda.getValue();
    return { vacia: valor === '', tipo: typeof valor,
      enteroValido: valor === '' || (typeof valor === 'number' && Number.isSafeInteger(valor) && valor >= 0),
      tieneFormula: !!celda.getFormula(), fondoNegro: celda.getBackground().toLowerCase() === '#000000',
      editablePorQuienEjecuta: celda.canEdit() };
  });
  revisar('busquedaHistorial', function() {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('HistorialArbitraje');
    if (!hoja) return { existe: false };
    var filas = hoja.getLastRow();
    if (filas > 1) {
      hoja.getRange(2, 1, filas - 1, 1).createTextFinder('diagnostico-solo-lectura').matchEntireCell(true).findNext();
    }
    return { existe: true, busquedaCorrecta: true, registros: Math.max(0, filas - 1) };
  });
  console.log(JSON.stringify(resultado, null, 2));
  return resultado;
}
