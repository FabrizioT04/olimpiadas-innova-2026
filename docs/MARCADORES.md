# Marcadores de ambas Houses

Cada encuentro elegible permite guardar marcador A, marcador B y estado (pendiente, en juego o finalizado). Los valores son enteros de 0 a 999; pendiente requiere 0–0. No se registran sets ni se calculan puntos para el medallero.

## Activación

1. En el proyecto de Apps Script **del fixture**, reemplaza `FixtureOficial.gs` por su nueva versión y añade otro archivo llamado `Marcadores.gs` con el contenido del repositorio. Solo FixtureOficial tiene `doGet`/`doPost`.
2. En Configuración del proyecto → Propiedades del script, añade `ARBITRAJE_SECRET` con el mismo valor que ya utiliza Cloudflare. No lo pegues en el código ni en GitHub.
3. Ejecuta `prepararMarcadores` desde el editor y autoriza la creación del archivo. Crea un Google Sheets **privado** llamado “Marcadores Olimpiadas 2026”, con una pestaña `Marcadores`, y guarda su ID en la propiedad `MARCADORES_SPREADSHEET_ID`. Si se ejecuta otra vez reutiliza ese archivo. El enlace aparece en el registro de ejecución. No hagas público este archivo: contiene el historial y el correo del árbitro.
4. Publica una **Nueva versión** de la implementación web existente del fixture, conservando la URL `/exec`. La cuenta que ejecuta el script debe poder leer el fixture y editar el registro privado.
5. Verifica que `/exec` devuelve `marcadoresHabilitados: true`. El JSON público solo incluye las Houses, el resultado, estado, versión y fecha de actualización, sin correos ni motivos del historial.
6. En Cloudflare Pages → Configuración → Variables y secretos, añade la variable de texto `FIXTURE_SCRIPT_URL` con la URL `/exec` del fixture. Mantén el valor existente de `ARBITRAJE_SECRET`. No cambies `APPS_SCRIPT_URL`, que sigue apuntando al registro de puntajes.
7. Fusiona el PR y espera el despliegue de Cloudflare. Abre `/arbitraje`, selecciona un encuentro con dos Houses definidas, introduce ambos marcadores, estado y motivo, y guarda. Confirma la nueva fila del registro privado y la actualización en `/fixture`.

## Uso y correcciones

- Solo aparecen encuentros sin avisos, con fecha, disciplina y dos Houses reconocidas: blanco, azul, anaranjado/naranja y verde. No se asignan o inventan equipos desde el formulario. Completa los equipos pendientes en el fixture oficial y recarga.
- El registro conserva todas las versiones, el árbitro identificado por Cloudflare y el motivo. Una corrección puede cambiar tanto el marcador como el estado; los árbitros autorizados mantienen los mismos permisos.
- Si dos árbitros editan la misma versión, el segundo recibe un aviso y debe recargar el encuentro antes de volver a guardar.
- Si una respuesta se pierde, el navegador conserva la operación en esta pestaña y ofrece reintentar exactamente el mismo guardado. El servidor reconoce la operación y no crea otra fila. No limpies los datos del navegador durante un guardado sin confirmar.
- El identificador se calcula a partir de fecha, hora, disciplina, categoría, enfrentamiento, fase y lugar; reordenar filas no mueve el resultado. Cambiar cualquiera de esos datos crea otra identidad: el historial anterior permanece privado, pero no se traslada automáticamente. Antes de reprogramar un encuentro con marcador, coordina su registro correcto. Dos encuentros indistinguibles quedan bloqueados hasta diferenciarlos en Sheets.
- El formulario permite 0–0, empates y correcciones. No impone reglas deportivas ni determina ganadores.
- Las hojas oficiales se mantienen sin modificaciones. El medallero, el registro de puntos y el fixture de árbitros no forman parte de este cambio.

## Validación

`npm test`, `npm run build`, `npm run typecheck:api` y `npm run lint`.
Las pruebas cubren firma, caducidad, acceso sin JWT, límites, versiones concurrentes, duplicados, fallo tras escribir, privacidad pública y reordenación/reprogramación. La prueba final de producción requiere publicar los scripts y configurar la variable de Cloudflare.
