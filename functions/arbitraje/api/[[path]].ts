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
  if (url.pathname === '/arbitraje/api/diagnostico-auth') {
    if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
    const secret = env.ARBITRAJE_SECRET || '';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
    return json({
      claveConfigurada: secret.length >= 32,
      espaciosEnExtremos: secret !== secret.trim(),
      huella: secret ? Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('').slice(0, 16) : null,
      urlCorrecta: env.APPS_SCRIPT_URL === 'https://script.google.com/macros/s/AKfycbyVCfzMa_iJEEHn8Hs1KBUBtkk6DfhT58UK77a2QdscxIiH8EbnU8_4NcaYG5Dz4ttjsA/exec',
    });
  }
  if (url.pathname === '/arbitraje/api/fixture') {
    if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
    if (!env.FIXTURE_SCRIPT_URL) return json({ error: 'La consulta de partidos aún no está configurada.' }, 503);
    try {
      const upstream = await fetch(env.FIXTURE_SCRIPT_URL, { signal: AbortSignal.timeout(25000) });
      if (!upstream.ok) throw new Error('upstream');
      const result = await upstream.json() as { fuente?: string; partidos?: unknown[]; error?: string };
      if (result.error || result.fuente !== '14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg' || !Array.isArray(result.partidos)) throw new Error('fixture');
      return json(result);
    } catch {
      return json({ error: 'No se pudo cargar la programación. Pulsa «Recargar partidos» para reintentar.' }, 502);
    }
  }
  const isMarker = url.pathname === '/arbitraje/api/marcadores';
  const isProbe = url.pathname === '/arbitraje/api/comprobar-auth';
  if (!isMarker && !isProbe && url.pathname !== '/arbitraje/api/puntajes') return json({ error: 'Ruta no encontrada.' }, 404);
  if (request.method !== (isProbe ? 'GET' : 'POST')) return json({ error: 'Método no permitido.' }, 405);
  if (!isProbe && (request.headers.get('Origin') !== env.APP_ORIGIN ||
      !request.headers.get('Content-Type')?.startsWith('application/json'))) {
    return json({ error: 'Solicitud no permitida.' }, 403);
  }
  const scriptUrl = isMarker ? env.FIXTURE_SCRIPT_URL : env.APPS_SCRIPT_URL;
  if (!scriptUrl || !env.ARBITRAJE_SECRET || env.ARBITRAJE_SECRET.length < 32) {
    return json({ error: 'El registro aún no está configurado.' }, 503);
  }
  const raw = isProbe ? '{}' : await request.text();
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
  if (!isMarker && !isProbe && (!data || !['white', 'blue', 'orange', 'green'].includes(data.house) ||
      !['promesas', 'infantil', 'junior', 'juvenila', 'juvenilb'].includes(data.categoria) ||
      !['sumar', 'restar'].includes(data.operacion) || !rows.includes(data.fila) ||
      !Number.isSafeInteger(data.puntos) || data.puntos < 1 || data.puntos > 10000 ||
      typeof data.motivo !== 'string' || data.motivo.trim().length < 3 || data.motivo.length > 300 ||
      typeof data.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.id))) {
    return json({ error: 'Revisa la actividad, los puntos y el motivo (3–300 caracteres).' }, 400);
  }
  const payload = JSON.stringify(isProbe ? { action: 'diagnostico-autorizacion' } : isMarker
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
    const result = await upstream.json() as { success?: boolean; error?: string; diagnostico?: string; pending?: boolean; id?: string; nuevo?: number; code?: string; marcador?: unknown };
    if (isProbe) {
      const messages: Record<string, string> = {
        AUTH_OK: 'La autorización funciona. Esta comprobación no registra puntos.',
        AUTH_CONFIG: 'La clave de Apps Script está ausente o es demasiado corta.',
        AUTH_PAYLOAD: 'El contenido firmado no tiene el formato esperado.',
        AUTH_TIMESTAMP: 'La fecha enviada no tiene el formato esperado.',
        AUTH_EXPIRED: 'La fecha de la solicitud supera el margen de dos minutos.',
        AUTH_SIGNATURE_FORMAT: 'La firma no tiene el formato esperado.',
        AUTH_SIGNATURE_MISMATCH: 'La firma calculada por Apps Script no coincide con la enviada.',
      };
      const code = typeof result.diagnostico === 'string' && Object.hasOwn(messages, result.diagnostico) ? result.diagnostico : 'DIAGNOSTICO_NO_DISPONIBLE';
      return json({ codigo: code, mensaje: messages[code] || 'La implementación todavía no devuelve los nuevos diagnósticos. Comprueba la versión publicada.' });
    }
    if (isMarker) {
      if (result.success === true && result.id === data.id && result.marcador) return json({success:true,id:result.id,marcador:result.marcador});
      const errors: Record<string,string> = { CONFLICT:'Otro árbitro actualizó este encuentro. Recarga antes de guardar.',
        FIXTURE_CHANGED:'El encuentro cambió o aún no tiene dos Houses definidas. Recarga el fixture.',
        NOT_CONFIGURED:'El registro de marcadores aún no está configurado.', ID_REUSED:'Identificador ya usado. Recarga el encuentro.' };
      return json({error:errors[result.code || ''] || 'No se confirmó el registro del marcador.',code:result.code || 'REJECTED'},409);
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
