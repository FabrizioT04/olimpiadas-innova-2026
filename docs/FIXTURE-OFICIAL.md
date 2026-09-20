# Activar las pestañas oficiales en el fixture web

## Fuente

Archivo: https://docs.google.com/spreadsheets/d/14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg/edit

Se leen SEMANA 1, SEMANA 2, SEMANA 3, las pestañas de martes a viernes y Finalistas. No se escribe en ellas ni se modifica su formato. BaseDatosWeb deja de ser la fuente de la web.

## Publicación (en este orden)

1. Abre el proyecto de Apps Script del **fixture**, el que contiene el antiguo `doGet` de BaseDatosWeb. No es el proyecto de puntajes/ArbitrajeSeguro.
2. Guarda una copia de su código actual. Sustituye los antiguos `doGet` y `doPost` por el contenido completo de `apps-script/FixtureOficial.gs`. Debe quedar una sola función de cada nombre en el proyecto. El archivo HTML existente puede conservarse.
3. Guarda. Ejecuta `doGet` una vez y autoriza la lectura del archivo si Google lo solicita. La cuenta que ejecuta el script debe tener acceso al fixture oficial.
4. En **Implementar → Gestionar implementaciones → lápiz**, selecciona **Nueva versión** y actualiza la implementación web existente. Conserva la misma URL `/exec` y su configuración de lectura pública. Guardar el editor por sí solo no actualiza la implementación.
5. Abre la URL `/exec`. Debe mostrar `version: 1`, `fuente: 14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg`, `partidos` y `finalistas`. Si devuelve `error`, resuelve el permiso o la lectura antes de publicar el cambio web.
6. Fusiona el PR del fixture y espera que Cloudflare termine el despliegue. El frontend usa la URL existente. Si se creó una implementación con una URL diferente, configura `VITE_FIXTURE_URL` con esa URL en Cloudflare y vuelve a desplegar.
7. Abre `/fixture`, compara una actividad de cada formato y la pestaña Finalistas. Cambia un dato real en Sheets y pulsa **Actualizar**; también se consulta automáticamente cada 30 segundos con la pestaña visible.

## Comportamiento

- Los valores de fechas se formatean con la zona horaria del archivo. Los años escritos explícitamente se respetan; los distintos de 2026 llevan aviso. Las fechas textuales sin año usan `FIXTURE_YEAR`.
- Las celdas combinadas solo se expanden dentro de sus límites, en memoria. No se rellenan celdas de Google Sheets.
- Cambios de disposición se detectan mediante encabezados HORA, DISCIPLINA, EQUIPOS, CATEGORIA, etc. Conserva esos encabezados y los nombres de las pestañas.
- Se incluyen los bloques inferiores de tenis de mesa, bádminton y gymkana, y las actividades con hora compartida.
- Solo se eliminan repeticiones exactas entre pestañas. Si coinciden, se prefiere la pestaña diaria sobre el resumen semanal. Horarios o categorías diferentes permanecen visibles.
- La web no inventa estados en vivo/finalizado, ganadores ni equipos. Los campos vacíos se muestran pendientes. Los marcadores y su edición son una fase posterior.
- Ante una consulta fallida, conserva la última lectura en memoria con un aviso. En una primera carga fallida no muestra un calendario fijo como respaldo.
- `doPost` rechaza escrituras; la edición de programación se realiza en las hojas oficiales. El proyecto de arbitraje y el medallero no cambian.
- Los IDs se basan en pestaña y fila, solo para mostrar datos. No deben usarse como identificadores permanentes de marcadores si se insertan o reordenan filas.

## Verificación local

`npm test` incluye casos de fechas, celdas combinadas, columnas reordenadas, bloques inferiores, finalistas, duplicados y rechazo de escrituras. `npm run build` comprueba la web. Para una vista previa local puede configurarse `VITE_FIXTURE_URL` con un JSON de prueba; no publicar esa configuración en producción.
