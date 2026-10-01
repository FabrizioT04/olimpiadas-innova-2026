# Clasificación por puestos

Para actividades en las que participan las cuatro Houses (carreras, gymkana, retos académicos, concursos y reconocimientos). El árbitro asigna el 1.º, 2.º, 3.º y 4.º puesto y los puntos de cada House; los cuatro puntajes se guardan juntos en la `Sábana` y los puestos se publican en la pestaña «Puestos» del fixture.

Los partidos por el 1.º-2.º y el 3.º-4.º puesto entre dos Houses también se registran desde esta pestaña: su resultado decide los puestos del podio deportivo. Los partidos normales entre dos Houses siguen en «Resultado del partido», y los puntos sueltos de una House en «Penalidades y bonos».

## Activación (en este orden)

Coordinar la actualización sin registros en curso. No cambiar las URLs de las implementaciones ni el secreto.

1. Proyecto Apps Script de **PUNTAJES** («Puntaje Oficial», vinculado al archivo con la pestaña `Sábana`):
   - Añadir `Clasificaciones.gs` como archivo de script. Necesita `ResultadoUnificado.gs` en el mismo proyecto (ver `RESULTADO-UNIFICADO.md`).
   - El `doPost` debe reconocer la acción `clasificacion`. Ya está en las dos variantes del repositorio: `CodigoCompletoDiagnostico.gs` (contenido de `Código.gs`) y `ArbitrajeSeguro.gs`. **Son alternativas: debe quedar un solo `doPost` en todo el proyecto.** Si actualizas solo la rama, añade tras el bloque `if (data.action === 'resultado') { … }`:

     ```javascript
     if (data.action === 'clasificacion') {
       if (typeof guardarClasificacion_ !== 'function') return arbitrajeJson_({success:false,code:'UPDATE_REQUIRED'});
       return guardarClasificacion_(data,envelope.payload,lock);
     }
     ```

   - Publicar una **nueva versión de la implementación existente** (Implementar → Gestionar implementaciones → lápiz → Nueva versión). Se conserva la URL configurada como `APPS_SCRIPT_URL`. Guardar el editor por sí solo no actualiza la implementación.
2. Proyecto Apps Script del **FIXTURE**:
   - Actualizar `Marcadores.gs` y `FixtureOficial.gs` con las versiones del repositorio. `Marcadores.gs` publica las clasificaciones confirmadas en el fixture.
   - `Finalistas2026.gs` ya no se usa: los puestos salen de las clasificaciones. Si sigue en el proyecto, puede eliminarse.
   - Publicar una nueva versión de su implementación existente; conservar `FIXTURE_SCRIPT_URL`.
3. Comprobar:
   - La URL `/exec` del fixture incluye `clasificaciones` (una lista, vacía si aún no hay registros).
   - Registrar una clasificación real desde el panel: debe confirmarse, sumar los cuatro puntajes en la `Sábana` y aparecer en la pestaña «Puestos» del fixture.
   - Si el panel muestra «El script de puntajes rechazó la clasificación sin guardar nada», falta `Clasificaciones.gs` o la rama del `doPost`, o no se publicó la nueva versión.

No hay variables nuevas en Cloudflare.

## Dónde se suman los puntos

- **Actividades del fixture:** el nombre de la actividad decide la fila de la `Sábana` (por ejemplo, «Carrera de Michi» → fila 19). Si la actividad indica varias categorías, o «TODAS LAS HOUSE» sin categoría, los puntos van a la columna de la **última** categoría participante. Cada actividad programada tiene su propia clasificación y sus puntos se suman en la misma fila.
- **Otras actividades (fuera del fixture):** una clasificación por actividad. En los retos académicos cada categoría juega un reto distinto, definido en `RETOS_ACADEMICOS` de `shared/olimpiadas.ts` según los PDF de bases, y tiene su propia clasificación en su columna.

## Correcciones

Al elegir una actividad ya clasificada, el panel carga sus puestos y puntos. Guardar de nuevo **reemplaza** la clasificación: en la `Sábana` se aplica solo la diferencia de puntos. Si otro árbitro la cambió antes, el guardado se rechaza y hay que recargar.

## Editar en Sheets una actividad ya clasificada

Una actividad del fixture se identifica por su fecha, hora, nombre, categoría, equipos, fase y lugar en Sheets. Si se edita alguno de esos datos (por ejemplo, para corregir una errata en el nombre) después de registrar su clasificación, esta queda **sin actividad**: sus puntos siguen en la `Sábana`, pero la actividad editada aparece como nueva.

El panel lo detecta:

- Avisa de cuántas clasificaciones quedaron sin actividad.
- Las lista en «Otras actividades» → «Registradas que ya no están en el fixture», para corregirlas sin duplicar puntos.
- Si se elige una actividad del fixture con la misma fila, columna y día que una de ellas, pide confirmar que es una actividad distinta antes de guardar. Si es la misma, no registrarla de nuevo: sus puntos se sumarían dos veces.

## Guardados interrumpidos

Como en los resultados, cada clasificación se registra primero como pendiente en la hoja privada `Marcadores` y luego se aplica en la `Sábana`. Si la conexión se corta, el panel conserva el intento y ofrece «Reintentar el mismo guardado»; mientras tanto bloquea otros registros. Si Apps Script responde que no guardó nada, el panel libera el intento y muestra el motivo. Para recuperar un pendiente perdido, ver `RESULTADO-UNIFICADO.md`.

## Verificación

`npm test` incluye pruebas de la clasificación en Apps Script (con ambas variantes de `doPost`), de la API protegida, de la publicación sin datos privados y de la detección de clasificaciones sin actividad.
