# Olimpiadas 360° · Innova Schools SMP

Sitio de las Olimpiadas 360° 2026 de Innova Schools San Martín de Porres.
Producción: https://olimpiadas-innova-2026.pages.dev

## Secciones

| Ruta | Acceso | Contenido |
|---|---|---|
| `/` | Público | Fixture oficial leído de Google Sheets, con marcadores y puestos |
| `/medallero` | Público | Puntaje oficial de las Houses |
| `/momentos` | Público | Galería de fotos y videos |
| `/arbitraje` | Cloudflare Access | Panel para registrar resultados, clasificaciones por puestos, penalidades y bonos, y publicar fotos y mascotas |

## Arquitectura

- **Frontend** (`src/`): React + Vite + Tailwind. El Fixture va en la carga inicial; las demás pestañas se descargan al abrirlas.
- **Funciones** (`functions/`): Cloudflare Pages Functions.
  - `/api/fixture` y `/api/puntajes` leen Apps Script y comparten una copia en KV, para no consultar Google por cada visitante.
  - `/api/contenido` y `/api/media/*` sirven las fotos y mascotas publicadas desde R2.
  - `/arbitraje/api/*` valida la sesión de Cloudflare Access y firma con HMAC cada escritura hacia Apps Script.
- **Apps Script** (`apps-script/`): escribe en las hojas de Google. Se publica desde el editor de Apps Script, no desde este repositorio.
- **Valores comunes** (`shared/olimpiadas.ts`): Houses, categorías, filas de actividades e ID de la hoja del fixture, usados por el frontend y por las funciones. Si cambian, hay que actualizar también los `.gs` indicados en ese archivo.

## Desarrollo local

```bash
npm install
npm run dev          # solo el frontend; las APIs no responden
```

Para probar también las funciones:

```bash
npm run build
npx wrangler pages dev dist
```

Sin variables, las funciones responden que no están configuradas. Para conectarlas, crea un archivo `.dev.vars` (está en `.gitignore`) con las variables de la tabla de abajo. No uses los valores de producción: apunta a hojas y scripts de prueba.

## Comprobaciones

```bash
npm test               # pruebas de las funciones y de Apps Script
npm run lint
npm run typecheck:api  # tipos de las funciones
npm run build          # tipos del frontend y build
```

## Despliegue

Cloudflare Pages está conectado a este repositorio: cada push a `main` se publica en producción. La configuración de build es `npm run build`, con salida `dist`; las funciones se toman de `functions/`.

Variables y enlaces de Cloudflare Pages (producción):

| Nombre | Tipo | Uso |
|---|---|---|
| `ACCESS_TEAM_DOMAIN` | Texto | Dominio del equipo de Cloudflare Access (`<equipo>.cloudflareaccess.com`) |
| `ACCESS_AUD` | Texto | AUD de la aplicación de Access que protege `/arbitraje*` |
| `APP_ORIGIN` | Texto | `https://olimpiadas-innova-2026.pages.dev`; las escrituras desde otro origen se rechazan |
| `APPS_SCRIPT_URL` | Texto | URL `/exec` del script de puntajes |
| `FIXTURE_SCRIPT_URL` | Texto | URL `/exec` del script del fixture |
| `ARBITRAJE_SECRET` | Secreto | Clave HMAC compartida con Apps Script (32 caracteres o más) |
| `CONTENT_BUCKET` | R2 | Fotos, mascotas y catálogo de contenido |
| `FIXTURE_CACHE` | KV | Copia compartida del fixture y de los puntajes |

## Documentación

- [Arbitraje y Cloudflare Access](docs/ARBITRAJE.md)
- [Fixture oficial](docs/FIXTURE-OFICIAL.md)
- [Marcadores](docs/MARCADORES.md)
- [Registro unificado de resultados](docs/RESULTADO-UNIFICADO.md)
- [Clasificación por puestos](docs/CLASIFICACIONES.md)
- [PDF de actividades](docs/ACTIVIDADES-PDF.md) (sección retirada del sitio)
