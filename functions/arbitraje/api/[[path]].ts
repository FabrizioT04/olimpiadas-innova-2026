import { manageContent } from '../../_lib/content';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { COLORES_HOUSE, FILAS_ACTIVIDAD, FIXTURE_FUENTE, IDS_CATEGORIA } from '../../../shared/olimpiadas';

interface Env {
  CONTENT_BUCKET?: R2Bucket;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  APP_ORIGIN: string;
  APPS_SCRIPT_URL: string;
  ARBITRAJE_SECRET: string;
  FIXTURE_SCRIPT_URL?: string;
  FIXTURE_CACHE?: KVNamespace;
}
const json = (value: unknown, status = 200) => Response.json(value, {
  status, headers: { 'Cache-Control': 'no-store' },
});
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
// Last programme read for referees, kept apart from the filtered public snapshot and only served
// through this authenticated route. Saving stays safe with an old copy: Apps Script re-reads the
// fixture and rejects results whose match version changed (CONFLICT / FIXTURE_CHANGED).
const FIXTURE_ARBITRAJE_KEY = 'fixture-arbitraje-v1';
const COPY_INTERVAL_MS = 60000;
let lastCopySaved = 0;
type FixtureArbitraje = { fuente?: string; partidos?: unknown[]; error?: string };
// Exactly the four Houses, each with a whole number in range; any other key is rejected.
function porHouse(value: unknown, min: number, max: number) {
  if (!value || typeof value !== 'object' || Object.keys(value).length !== COLORES_HOUSE.length) return null;
  const v = value as Record<string, unknown>;
  return COLORES_HOUSE.every(h => Number.isSafeInteger(v[h]) && (v[h] as number) >= min && (v[h] as number) <= max)
    ? Object.fromEntries(COLORES_HOUSE.map(h => [h, v[h]])) as Record<string, number> : null;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.APP_ORIGIN) {
    return json({ error: 'El acceso al panel aún no está configurado.' }, 503);
  }
  const url = new URL(request.url);
  if (url.origin !== env.APP_ORIGIN) return json({ error: 'Dominio no autorizado.' }, 403);
  const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
  let email: string;
  try {
    const token = request.headers.get('Cf-Access-Jwt-Assertion');
    if (!token) return json({ error: 'Inicia sesión para continuar.' }, 401);
    let keys = keySets.get(issuer);
    if (!keys) {
      keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
      keySets.set(issuer, keys);
    }
    const { payload } = await jwtVerify(token, keys, {
      issuer, audience: env.ACCESS_AUD, algorithms: ['RS256'], requiredClaims: ['exp', 'email', 'sub'],
    });
    if (typeof payload.email !== 'string' || !payload.email.includes('@')) throw new Error('identity');
    email = payload.email.toLowerCase();
  } catch {
    return json({ error: 'Sesión inválida o vencida. Vuelve a ingresar al panel.' }, 401);
  }
  if (url.pathname === '/arbitraje/api/contenido') return manageContent(request,env,email);
  if (url.pathname === '/arbitraje/api/session' && request.method === 'GET') return json({ email });
  if (url.pathname === '/arbitraje/api/fixture') {
    if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
    if (!env.FIXTURE_SCRIPT_URL) return json({ error: 'La consulta de partidos aún no está configurada.' }, 503);
    try {
      const upstream = await fetch(env.FIXTURE_SCRIPT_URL, { signal: AbortSignal.timeout(25000) });
      if (!upstream.ok) throw new Error('upstream');
      const result = await upstream.json() as FixtureArbitraje;
      if (result.error || result.fuente !== FIXTURE_FUENTE || !Array.isArray(result.partidos)) throw new Error('fixture');
      // At most one KV write per minute per instance; a copy that cannot be saved must not block the live answer.
      if (env.FIXTURE_CACHE && Date.now() - lastCopySaved >= COPY_INTERVAL_MS) {
        try {
          await env.FIXTURE_CACHE.put(FIXTURE_ARBITRAJE_KEY, JSON.stringify({ savedAt: Date.now(), fixture: result }));
          lastCopySaved = Date.now();
        } catch { console.warn('Referee fixture copy could not be saved'); }
      }
      return json(result);
    } catch {
      // Google sometimes takes longer than the timeout: show the last copy instead of an empty panel.
      try {
        const copy = await env.FIXTURE_CACHE?.get<{ savedAt: number; fixture: FixtureArbitraje }>(FIXTURE_ARBITRAJE_KEY, 'json');
        if (copy && Number.isFinite(copy.savedAt) && copy.fixture?.fuente === FIXTURE_FUENTE && Array.isArray(copy.fixture.partidos)) {
          return json({ ...copy.fixture, copiaGuardada: new Date(copy.savedAt).toISOString() });
        }
      } catch { /* Without a usable copy, report the original failure. */ }
      return json({ error: 'No se pudo cargar la programación. Pulsa «Recargar partidos» para reintentar.' }, 502);
    }
  }
  const isMarker = url.pathname === '/arbitraje/api/marcadores';
  const isRanking = url.pathname === '/arbitraje/api/clasificacion';
  if (!isMarker && !isRanking && url.pathname !== '/arbitraje/api/puntajes') return json({ error: 'Ruta no encontrada.' }, 404);
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  if (request.headers.get('Origin') !== env.APP_ORIGIN ||
      !request.headers.get('Content-Type')?.startsWith('application/json')) {
    return json({ error: 'Solicitud no permitida.' }, 403);
  }
  const scriptUrl = env.APPS_SCRIPT_URL;
  if (!scriptUrl || (isMarker && !env.FIXTURE_SCRIPT_URL) || !env.ARBITRAJE_SECRET || env.ARBITRAJE_SECRET.length < 32) {
    return json({ error: 'El registro aún no está configurado.' }, 503);
  }
  const raw = await request.text();
  if (raw.length > 4096) return json({ error: 'Solicitud demasiado grande.' }, 413);
  let data;
  try { data = JSON.parse(raw); } catch { return json({ error: 'Datos inválidos.' }, 400); }
  if (isMarker && (!data || typeof data.encuentroId !== 'string' || !/^[0-9a-f]{64}$/.test(data.encuentroId) ||
      !Number.isSafeInteger(data.version) || data.version < 0 ||
      !Number.isSafeInteger(data.a) || data.a < 0 || data.a > 999 || !Number.isSafeInteger(data.b) || data.b < 0 || data.b > 999 ||
      !['pendiente','en-juego','finalizado'].includes(data.estado) || (data.estado === 'pendiente' && (data.a !== 0 || data.b !== 0)) ||
      !Number.isSafeInteger(data.puntosA) || data.puntosA < 0 || data.puntosA > 10000 ||
      !Number.isSafeInteger(data.puntosB) || data.puntosB < 0 || data.puntosB > 10000 ||
      (data.estado !== 'finalizado' && (data.puntosA !== 0 || data.puntosB !== 0)) ||
      (data.estado === 'finalizado' && (!FILAS_ACTIVIDAD.includes(data.fila) || !IDS_CATEGORIA.includes(data.categoria))) ||
      typeof data.motivo !== 'string' || data.motivo.trim().length < 3 || data.motivo.length > 300 ||
      typeof data.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.id))) {
    return json({ error: 'Revisa el encuentro, los marcadores (0–999), los puntos (0–10000), la categoría, la actividad y el motivo.' }, 400);
  }
  const puestos = isRanking && data ? porHouse(data.puestos, 1, 4) : null;
  const puntos = isRanking && data ? porHouse(data.puntos, 0, 10000) : null;
  if (isRanking && (!data || !puestos || !puntos || Object.values(puestos).sort().join() !== '1,2,3,4' ||
      !FILAS_ACTIVIDAD.includes(data.fila) || !IDS_CATEGORIA.includes(data.categoria) ||
      !Number.isSafeInteger(data.version) || data.version < 0 ||
      typeof data.motivo !== 'string' || data.motivo.trim().length < 3 || data.motivo.length > 300 ||
      typeof data.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.id))) {
    return json({ error: 'Revisa la actividad, la categoría, los puestos (1.º a 4.º, sin repetir), los puntos (0–10000) y el motivo.' }, 400);
  }
  if (!isMarker && !isRanking && (!data || !COLORES_HOUSE.includes(data.house) ||
      !IDS_CATEGORIA.includes(data.categoria) ||
      !['sumar', 'restar'].includes(data.operacion) || !FILAS_ACTIVIDAD.includes(data.fila) ||
      !Number.isSafeInteger(data.puntos) || data.puntos < 1 || data.puntos > 10000 ||
      typeof data.motivo !== 'string' || data.motivo.trim().length < 3 || data.motivo.length > 300 ||
      typeof data.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.id))) {
    return json({ error: 'Revisa la actividad, los puntos y el motivo (3–300 caracteres).' }, 400);
  }
  const payload = JSON.stringify(isMarker
    ? { action: 'resultado', id: data.id, email, encuentroId: data.encuentroId, version: data.version,
        a: data.a, b: data.b, estado: data.estado, motivo: data.motivo.trim(),
        puntosA:data.puntosA,puntosB:data.puntosB,fila:data.estado === 'finalizado' ? data.fila : null,
        categoria:data.estado === 'finalizado' ? data.categoria : '',fixtureUrl:env.FIXTURE_SCRIPT_URL }
    : isRanking
    ? { action: 'clasificacion', id: data.id, email, fila: data.fila, categoria: data.categoria,
        version: data.version, puestos, puntos, motivo: data.motivo.trim() }
    : { id: data.id, email, house: data.house, categoria: data.categoria,
        operacion: data.operacion, fila: data.fila, puntos: data.puntos, motivo: data.motivo.trim() });
  const timestamp = Date.now();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.ARBITRAJE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key,
    new TextEncoder().encode(`${timestamp}.${payload}`))), b => b.toString(16).padStart(2, '0')).join('');
  try {
    const upstream = await fetch(scriptUrl, { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timestamp, payload, signature }),
      signal: AbortSignal.timeout(isMarker || isRanking ? 60000 : 25000) });
    if (!upstream.ok) throw new Error('upstream');
    const result = await upstream.json() as { success?: boolean; error?: string; diagnostico?: string; pending?: boolean; id?: string; nuevo?: number; code?: string; marcador?: unknown; clasificacion?: unknown };
    if (isRanking) {
      if (result.success === true && result.id === data.id && result.clasificacion && (result.clasificacion as {integrado?:boolean}).integrado === true) return json({success:true,id:result.id,clasificacion:result.clasificacion});
      const errors: Record<string,string> = { CONFLICT:'Otro árbitro actualizó esta clasificación. Recarga antes de guardar.',
        NOT_CONFIGURED:'Falta configurar el registro de clasificaciones en el script de puntajes.', ID_REUSED:'Identificador ya usado. Recarga la clasificación.',
        UPDATE_REQUIRED:'Actualiza el script de puntajes para registrar clasificaciones.',
        OTHER_PENDING:'Hay otro resultado pendiente de confirmación. Completa su reintento antes de guardar.',
        REVIEW_REQUIRED:'Los puntos cambiaron directamente en Sheets durante un guardado pendiente. Solicita una revisión; no crees otro registro.',
        CELL_INVALID:'La actividad y categoría elegidas no tienen una celda habilitada para las cuatro Houses.',
        INSUFFICIENT_POINTS:'La corrección dejaría puntos negativos. Revisa los ajustes anteriores en Sheets.',
        INVALID:'Revisa la actividad, la categoría, los puestos y los puntos.' };
      return json({error:errors[result.code || ''] || 'No se confirmó la clasificación completa. Reintenta el mismo guardado.',code:result.code || 'UNCONFIRMED',pending:result.pending},409);
    }
    if (isMarker) {
      if (result.success === true && result.id === data.id && result.marcador && (result.marcador as {integrado?:boolean}).integrado === true) return json({success:true,id:result.id,marcador:result.marcador});
      const errors: Record<string,string> = { CONFLICT:'Otro árbitro actualizó este encuentro. Recarga antes de guardar.',
        FIXTURE_CHANGED:'El encuentro cambió o aún no tiene dos Houses definidas. Recarga el fixture.',
        NOT_CONFIGURED:'Falta configurar el registro unificado en el script de puntajes.', ID_REUSED:'Identificador ya usado. Recarga el encuentro.',
        UPDATE_REQUIRED:'Actualiza los scripts de puntajes y fixture antes de usar el registro unificado.',
        OTHER_PENDING:'Hay otro resultado pendiente de confirmación. Completa su reintento antes de guardar.',
        REVIEW_REQUIRED:'Los puntos cambiaron directamente en Sheets durante un guardado pendiente. Solicita una revisión; no crees otro registro.',
        CELL_INVALID:'La actividad y categoría elegidas no tienen una celda habilitada para ambas Houses.',
        INSUFFICIENT_POINTS:'La corrección dejaría puntos negativos. Revisa los ajustes anteriores en Sheets.',
        INVALID:'Revisa los datos del resultado y los puntos.', FIXTURE_UNAVAILABLE:'No se pudo consultar el fixture. Reintenta el mismo guardado.' };
      return json({error:errors[result.code || ''] || 'No se confirmó el resultado completo. Reintenta el mismo guardado.',code:result.code || 'UNCONFIRMED',pending:result.pending},409);
    }
    const pointErrors = new Map<string, string>([
      ['No autorizado', 'Apps Script rechazó la autorización. Revisa que la clave del servidor y la del script coincidan y que la URL corresponda a la implementación correcta.'],
      ['Datos inválidos', 'Apps Script rechazó los datos enviados. Revisa la configuración de categorías y actividades.'],
      ['Hoja no encontrada', 'No se encontró la hoja «Sábana» en el archivo conectado a Apps Script.'],
      ['Identificador reutilizado con otros datos', 'El identificador ya pertenece a otro registro. Revisa el historial antes de volver a enviar.'],
      ['Celda no habilitada', 'La celda de destino contiene una fórmula o está marcada en negro. No se puede modificar desde el panel.'],
      ['Puntaje actual inválido', 'La celda de destino debe contener un número entero no negativo o estar vacía. Revisa si el puntaje está guardado como texto.'],
      ['Puntaje fuera de rango', 'El puntaje resultante está fuera del rango admitido.'],
      ['Error interno: consultar registros de ejecución', 'Apps Script encontró un error interno. Revisa el registro de la última ejecución de doPost.'],
    ]);
    const diagnostic = typeof result.diagnostico === 'string' && pointErrors.has(result.diagnostico)
      ? result.diagnostico : undefined;
    if (result.success !== true) return json({ error: result.pending
      ? 'Operación pendiente de revisión. No repitas el registro con otro identificador.'
      : (pointErrors.get(diagnostic || '') || 'No se pudo registrar. Revisa la celda y la configuración.'),
      diagnostico: diagnostic, pending: result.pending === true }, 409);
    return json({ success: true, id: result.id, nuevo: result.nuevo });
  } catch {
    return json({ error: 'No se pudo confirmar el guardado. Reintenta sin cambiar los datos para evitar duplicados.' }, 502);
  }
};

