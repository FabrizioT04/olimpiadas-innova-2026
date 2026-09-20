# Arbitraje privado y consulta pública

Las rutas `/`, `/medallero`, `/puntajes`, `/actividades` y `/momentos` permanecen públicas.
Solo `/arbitraje*`, incluida `/arbitraje/api/*`, requiere Cloudflare Access. Nunca configurar Access sobre todo el dominio.
La lista de personas autorizadas vive en la política Access: no basta con tener una cuenta Google.

## Arquitectura

Google → Cloudflare Access → cookie de sesión → Pages Function valida JWT (firma RS256, issuer, audience, expiración, identidad) → petición HMAC a Apps Script → Sheets.
El navegador no recibe el secreto HMAC ni envía correos como prueba de identidad.
Las lecturas públicas y `doGet` continúan como antes. El logout usa `/cdn-cgi/access/logout`.

## Preparación (sin publicar todavía)

1. Crear copia de seguridad de la hoja y anotar la versión actual del script.
2. Cloudflare Zero Trust → Integrations → Identity providers → Google. Seguir la guía oficial para crear el cliente OAuth y configurar el callback indicado por Cloudflare. El client secret se introduce solo en Cloudflare; no en GitHub ni en variables VITE.
3. En la aplicación Access existente elegir Google y conservar la política Allow con los correos exactos de árbitros. No usar Everyone ni todo el dominio educativo. Verificar la lista con el responsable. La aplicación debe cubrir `/arbitraje*`, incluidas las llamadas API, en el dominio de producción. Copiar su AUD y el dominio del equipo.
4. En Pages configurar estas variables de producción (no VITE):
   - `ACCESS_TEAM_DOMAIN`: `<equipo>.cloudflareaccess.com`, sin https ni barra final.
   - `ACCESS_AUD`: AUD de la aplicación Access existente.
   - `APP_ORIGIN`: `https://olimpiadas-innova-2026.pages.dev`.
   - `APPS_SCRIPT_URL`: URL `/exec` actual de escritura.
   - `ARBITRAJE_SECRET`: secreto aleatorio de al menos 32 bytes, guardado como secret.
5. Guardar el mismo `ARBITRAJE_SECRET` en Apps Script → Configuración del proyecto → Propiedades del script. No copiarlo en el código ni compartirlo por chat.
6. Reemplazar exclusivamente el antiguo `doPost` por `apps-script/ArbitrajeSeguro.gs`; conservar `doGet` y helpers. No pueden coexistir dos `doPost`. Verificar que no hay otras funciones públicas de escritura accesibles desde las vistas HTML antiguas.

## Activación coordinada

Durante una ventana sin registro de resultados: publicar primero una nueva versión de Apps Script en la implementación existente; después publicar esta rama en Pages (build `npm run build`, salida `dist`, Functions desde la raíz del repositorio). Entre ambos pasos el panel antiguo no podrá guardar: es intencional para cerrar las escrituras sin firma.
Revisar y archivar implementaciones antiguas que sigan permitiendo escritura sin firma. No reabrir el antiguo `doPost` como rollback; suspender registro y corregir la configuración.
Las Functions rechazan hosts diferentes de APP_ORIGIN: los dominios de preview no pueden escribir en producción. No poner secretos de producción en previews. Para pruebas integradas usar otra hoja, otro script y otra aplicación Access.

## Verificación antes del evento

- Incógnito: fixture, medallero, actividades y galería abren sin login.
- Panel: correo permitido entra con Google; correo no permitido se rechaza.
- `/arbitraje/api/session`: devuelve la identidad verificada; sin JWT no devuelve identidad.
- POST sin sesión, desde otro origen o sin firma en Apps Script no modifica celdas.
- En hoja de pruebas: registrar puntos y comprobar celda, respuesta y fila CONFIRMADO en HistorialArbitraje.
- Repetir mismo ID y mismos datos devuelve el resultado anterior sin sumar otra vez. ID reutilizado con datos distintos se rechaza.
- Probar dos operaciones simultáneas, fórmulas, celdas negras, filas 6/38/45, puntos negativos y operación desconocida.
- Cerrar sesión y volver al panel exige una sesión Access válida (Google puede conservar su propia sesión).

## Operación e historial

Todos los árbitros autorizados tienen el mismo permiso de sumar/restar. Corregir mediante una operación inversa con motivo, no borrando el historial. Roles separados de administrador y reversión vinculada a una operación quedan para una siguiente etapa, tras acordar responsables.
El historial privado registra ID, fecha, identidad, destino, operación, cantidad, antes/después, motivo y estado. No se publica en `doGet`.
Sheets no ofrece una transacción entre celdas. Si queda PENDIENTE tras un fallo parcial, el administrador debe comparar el valor y el historial antes de resolverlo; no reenviar con otro ID. El bloqueo serializa las operaciones de este script, no las ediciones manuales ni otros scripts. Restringir editores de la hoja.
El navegador conserva el ID de reintento mientras el formulario siga abierto y los datos no cambien. Si se recarga tras una respuesta incierta, comprobar el historial antes de registrar de nuevo.
Límite inicial: 1–10000 puntos enteros por operación. Revisarlo con las reglas del evento. Actividades válidas: filas 8–31 y 34–37; fórmulas y celdas negras se rechazan.

## Referencias

- https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/google/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/pages/functions/
