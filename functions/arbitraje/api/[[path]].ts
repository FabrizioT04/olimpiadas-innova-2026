import { createRemoteJWKSet, jwtVerify } from 'jose';

interface Env {
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  APP_ORIGIN: string;
  APPS_SCRIPT_URL: string;
  ARBITRAJE_SECRET: string;
  FIXTURE_SCRIPT_URL?: string;
}
const json = (value: unknown, status = 200) => Response.json(value, {
  status, headers: { 'Cache-Control': 'no-store' },
});
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

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
  if (url.pathname === '/arbitraje/api/session' && request.method === 'GET') return json({ email });
  const isMarker = url.pathname === '/arbitraje/api/marcadores';
  if (!isMarker && url.pathname !== '/arbitraje/api/puntajes') return json({ error: 'Ruta no encontrada.' }, 404);
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  if (request.headers.get('Origin') !== env.APP_ORIGIN ||
      !request.headers.get('Content-Type')?.startsWith('application/json')) {
    return json({ error: 'Solicitud no permitida.' }, 403);
  }
  const scriptUrl = isMarker ? env.FIXTURE_SCRIPT_URL : env.APPS_SCRIPT_URL;
  if (!scriptUrl || !env.ARBITRAJE_SECRET || env.ARBITRAJE_SECRET.length < 32) {
    return json({ error: 'El registro aún no está configurado.' }, 503);
  }
  const raw = await request.text();
  if (raw.length > 4096) return json({ error: 'Solicitud demasiado grande.' }, 413);
  let data;
  try { data = JSON.parse(raw); } catch { return json({ error: 'Datos inválidos.' }, 400); }
  const rows = [...Array.from({ length: 24 }, (_, i) => i + 8), 34, 35, 36, 37];
  if (isMarker && (!data || typeof data.encuentroId !== 'string' || !/^[0-9a-f]{64}$/.test(data.encuentroId) ||
      !Number.isSafeInteger(data.version) || data.version < 0 ||
      !Number.isSafeInteger(data.a) || data.a < 0 || data.a > 999 || !Number.isSafeInteger(data.b) || data.b < 0 || data.b > 999 ||
      !['pendiente','en-juego','finalizado'].includes(data.estado) || (data.estado === 'pendiente' && (data.a !== 0 || data.b !== 0)) ||
      typeof data.motivo !== 'string' || data.motivo.trim().length < 3 || data.motivo.length > 300 ||
      typeof data.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.id))) {
    return json({ error: 'Revisa el encuentro, los marcadores (0–999) y el motivo.' }, 400);
  }
  if (!isMarker && (!data || !['white', 'blue', 'orange', 'green'].includes(data.house) ||
      !['promesas', 'infantil', 'junior', 'juvenila', 'juvenilb'].includes(data.categoria) ||
      !['sumar', 'restar'].includes(data.operacion) || !rows.includes(data.fila) ||
      !Number.isSafeInteger(data.puntos) || data.puntos < 1 || data.puntos > 10000 ||
      typeof data.motivo !== 'string' || data.motivo.trim().length < 3 || data.motivo.length > 300 ||
      typeof data.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.id))) {
    return json({ error: 'Revisa la actividad, los puntos y el motivo (3–300 caracteres).' }, 400);
  }
  const payload = JSON.stringify(isMarker
    ? { action: 'marcador', id: data.id, email, encuentroId: data.encuentroId, version: data.version,
        a: data.a, b: data.b, estado: data.estado, motivo: data.motivo.trim() }
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
      signal: AbortSignal.timeout(isMarker ? 60000 : 25000) });
    if (!upstream.ok) throw new Error('upstream');
    const result = await upstream.json() as { success?: boolean; error?: string; pending?: boolean; id?: string; nuevo?: number; code?: string; marcador?: unknown };
    if (isMarker) {
      if (result.success === true && result.id === data.id && result.marcador) return json({success:true,id:result.id,marcador:result.marcador});
      const errors: Record<string,string> = { CONFLICT:'Otro árbitro actualizó este encuentro. Recarga antes de guardar.',
        FIXTURE_CHANGED:'El encuentro cambió o aún no tiene dos Houses definidas. Recarga el fixture.',
        NOT_CONFIGURED:'El registro de marcadores aún no está configurado.', ID_REUSED:'Identificador ya usado. Recarga el encuentro.' };
      return json({error:errors[result.code || ''] || 'No se confirmó el registro del marcador.',code:result.code || 'REJECTED'},409);
    }
    if (result.success !== true) return json({ error: result.pending
      ? 'Operación pendiente de revisión. No repitas el registro con otro identificador.'
      : 'No se pudo registrar. Revisa la celda y la configuración.', pending: result.pending === true }, 409);
    return json({ success: true, id: result.id, nuevo: result.nuevo });
  } catch {
    return json({ error: 'No se pudo confirmar el guardado. Reintenta sin cambiar los datos para evitar duplicados.' }, 502);
  }
};
