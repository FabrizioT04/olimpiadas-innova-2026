# Registro unificado de resultados y puntos

Los profesores deciden los puntos de cada House. No hay una tabla automática de premios. Al finalizar un partido se guardan marcador, estado, puntos de ambas Houses, categoría, actividad y motivo con una sola operación identificada. Retos y penalidades independientes siguen disponibles en otra opción del mismo panel.

## Activación (antes de fusionar la propuesta web)

Coordinar la actualización sin registros en curso. No cambiar las URLs de las implementaciones ni el secreto.

1. En el proyecto Apps Script de **PUNTAJES**, el vinculado al archivo que contiene la pestaña `Sábana`:
   - Si usas el código completo de diagnósticos, sustituir el contenido de `Código.gs` por `CodigoCompletoDiagnostico.gs` de esta propuesta: conserva el lector de puntajes y los diagnósticos actuales.
   - Si tienes el `doPost` separado, usar `ArbitrajeSeguro.gs` en su lugar y conservar el `doGet` existente. **Son alternativas: debe quedar un solo `doPost` en todo el proyecto.**
   - Añadir `ResultadoUnificado.gs` como archivo de script en ese mismo proyecto de puntajes. Si se creó antes en el proyecto del fixture, no ejecutarlo allí; conservar una copia y retirarlo de ese proyecto una vez instalado en puntajes.
   - Añadir la propiedad `MARCADORES_SPREADSHEET_ID` con el valor `1uPgQq1NnPCEZ_QweQriNktIeAkFdV9zlN7L7Znwzi6s`.
   - Ejecutar `verificarResultadoUnificado` desde el editor y autorizar el acceso a las hojas y la consulta externa cuando Google lo solicite. La cuenta que ejecuta la implementación debe tener acceso de edición al archivo privado de marcadores.
   - Publicar una **nueva versión de la implementación existente**; conservar la URL configurada como `APPS_SCRIPT_URL`.
2. En el proyecto Apps Script del **FIXTURE**:
   - Sustituir `Marcadores.gs` por la versión de esta propuesta. Conservar `FixtureOficial.gs` y `Finalistas2026.gs`, con sus actualizaciones recientes.
   - Publicar una nueva versión de su implementación existente; conservar `FIXTURE_SCRIPT_URL`.
   - Su respuesta debe incluir `resultadosVersion: 2`. El POST antiguo de marcadores se desactiva para que todas las escrituras usen el mismo bloqueo.
3. Fusionar la propuesta web y comprobar Cloudflare Pages. Se conserva el respaldo público KV y la consulta protegida reciente; no hay nuevas variables de Cloudflare.
4. Comprobar un resultado acordado, ambas celdas de `Sábana`, la fila de `Marcadores`, la publicación del fixture y una corrección. No usar resultados inventados en producción.

## Correcciones y recuperación

Cada nueva versión contiene los puntos **totales del encuentro**, no una cantidad adicional. La operación resta la contribución anterior y suma la nueva; los otros puntos de las celdas se conservan. Si cambia la actividad o categoría, también se revierten las celdas anteriores. Al reabrir un encuentro finalizado se retiran sus puntos integrados. No se permiten totales negativos ni escrituras en fórmulas o celdas negras.

La hoja privada `Marcadores` conserva sus primeras 13 columnas y añade `PuntosA`, `PuntosB`, `FilaPuntaje`, `CategoriaPuntaje`, `EstadoRegistro` y `PlanRecuperacion`. El plan registra valores anteriores y finales antes de escribir en la Sábana. Un fallo deja la operación pendiente y bloquea otras escrituras mediante esta API hasta completarla. El reintento usa el mismo ID y plan, incluso si el fixture cambió después. El fixture solo muestra versiones confirmadas.

Google Sheets no ofrece una transacción única entre ambos archivos: una lectura de puntajes podría observar temporalmente una escritura parcial antes de su recuperación. El sistema no declara éxito hasta confirmar ambos destinos y el registro. No editar directamente las celdas afectadas durante una operación pendiente. Si se detecta una edición externa, la recuperación se detiene para revisión.

Si se perdió la pestaña y su reintento, un administrador puede ejecutar `recuperarResultadoPendiente` en el proyecto de puntajes. Respeta el plan original y rechaza discrepancias; no borrar filas pendientes ni crear otro ID para el mismo intento. Los pendientes antiguos de `HistorialArbitraje` deben revisarse antes de registrar nuevos resultados integrados.

## Datos anteriores y disciplinas

Los marcadores antiguos siguen visibles, sin puntos integrados. No se puede deducir si sus puntos ya se dieron manualmente: la interfaz lo advierte antes de sumar. Verificar estos casos antes de migrarlos.

La categoría y actividad se sugieren solo por coincidencias conocidas y el profesor las confirma. No se inventan filas para disciplinas ausentes de la Sábana; por ejemplo, tenis de mesa necesita un destino oficial definido antes de asignar sus puntos. Los encuentros sin equipos o datos completos siguen seleccionables con avisos.

## Verificación

Pruebas de firma, origen, identidad, versiones, diferencia de puntos, cambio de destino, reapertura, cero puntos, fallos entre Houses, confirmación interrumpida, recuperación administrativa y bloqueo de ediciones externas. Se conservan las pruebas del fixture público, respaldo KV y API protegida. La vista previa local usa datos simulados y no escribe en Google Sheets.
