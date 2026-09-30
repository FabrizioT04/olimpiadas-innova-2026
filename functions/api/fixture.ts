import { COLORES_HOUSE, FILAS_ACTIVIDAD, FIXTURE_FUENTE as sourceId, IDS_CATEGORIA } from '../../shared/olimpiadas';

interface Env { FIXTURE_SCRIPT_URL?: string; FIXTURE_CACHE?: KVNamespace }
const CACHE_KEY = 'fixture-publico-v1';
const FRESH_MS = 30000;
const MIN_REFRESH_MS = 10000;
const FAILURE_COOLDOWN_MS = 30000;
type Snapshot = { savedAt:number; fixture:ReturnType<typeof publicFixture> };
// Per-instance protection complements the shared KV snapshot; not a global rate limiter.
const recent = new Map<string, Snapshot>();
const retryAfter = new Map<string, number>();
const refreshes = new Map<string, Promise<ReturnType<typeof publicFixture>>>();
const pick = (value: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.map(key => [key, value[key]]));
// Only complete rankings (each House a distinct 1st–4th place) are published, with the points each
// House won when all four are valid; never who registered them or why.
function publicRanking(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const c = value as Record<string, unknown>, puestos = c.puestos as Record<string, unknown> | null;
  const puntos = c.puntos && typeof c.puntos === 'object' ? c.puntos as Record<string, unknown> : null;
  const puntosValidos = !!puntos && COLORES_HOUSE.every(h => Number.isSafeInteger(puntos[h]) && (puntos[h] as number) >= 0 && (puntos[h] as number) <= 10000);
  if (!FILAS_ACTIVIDAD.includes(c.fila as number) || !IDS_CATEGORIA.includes(c.categoria as string) ||
      typeof c.actualizado !== 'string' || Number.isNaN(Date.parse(c.actualizado)) || !puestos || typeof puestos !== 'object' ||
      !COLORES_HOUSE.every(h => Number.isSafeInteger(puestos[h])) || COLORES_HOUSE.map(h => puestos[h]).sort().join() !== '1,2,3,4') return null;
  return { fila: c.fila, categoria: c.categoria, detalle: typeof c.detalle === 'string' ? c.detalle.slice(0, 200) : '',
    actualizado: c.actualizado, puestos: pick(puestos, [...COLORES_HOUSE]),
    ...(puntosValidos ? { puntos: pick(puntos, [...COLORES_HOUSE]) } : {}) };
}

// Expose only the public programme and scores, never the private scoring history.
export function publicFixture(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Invalid fixture');
  const data = value as Record<string, unknown>;
  if (data.version !== 1 || data.fuente !== sourceId || typeof data.actualizado !== 'string' ||
      Number.isNaN(Date.parse(data.actualizado)) || !Array.isArray(data.partidos) ||
      !Array.isArray(data.avisos)) throw new Error('Invalid fixture');
  return {
    version: 1, fuente: sourceId, actualizado: data.actualizado,
    avisos: data.avisos.filter(item => typeof item === 'string'),
    partidos: data.partidos.map(p => ({
      ...pick(p, ['id','fecha','hora','deporte','enfrentamiento','categoria','arbitro','lugar','fase','bloque','seccion','origen','fila','avisos']),
      // Awarded points are public (they make up the official totals); referee and reason are not.
      marcador: p.marcador ? pick(p.marcador, ['version','houseA','houseB','a','b','estado','actualizado','puntosA','puntosB','integrado']) : null,
    })),
    clasificaciones: Array.isArray(data.clasificaciones) ? data.clasificaciones.map(publicRanking).filter(c => c !== null) : [],
  };
}

async function refreshFixture(env: Env) {
  { // One longer read lets slow Apps Script executions complete without duplicate requests.
    try {
      const url = new URL(env.FIXTURE_SCRIPT_URL!);
      url.searchParams.set('_consulta', `${Date.now()}`);
      const response = await fetch(url.toString(), {signal:AbortSignal.timeout(25000), redirect:'follow', cache:'no-store'});
      if (!response.ok) throw new Error('Upstream unavailable');
      const fixture = publicFixture(await response.json());
      recent.set(env.FIXTURE_SCRIPT_URL!, {savedAt:Date.now(), fixture});
      retryAfter.delete(env.FIXTURE_SCRIPT_URL!);
      // KV failure must not discard a valid live response; snapshots never expire.
      try { await env.FIXTURE_CACHE?.put(CACHE_KEY, JSON.stringify({savedAt:Date.now(), fixture})); } catch { console.warn('Fixture snapshot could not be saved'); }
      return fixture;
    } catch { /* Keep the last snapshot on failure; the next poll retries after cooldown. */ }
  }
  retryAfter.set(env.FIXTURE_SCRIPT_URL!, Date.now() + FAILURE_COOLDOWN_MS);
  throw new Error('Fixture unavailable');
}

export const onRequest: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const headers = { 'Cache-Control': 'no-store' };
  const freshRequested = new URL(request.url).searchParams.get('actualizar') === '1';
  if (request.method !== 'GET') return Response.json({error:'Método no permitido.'}, {status:405, headers:{...headers, Allow:'GET'}});
  if (!env.FIXTURE_SCRIPT_URL) return Response.json({error:'La programación no está configurada.'}, {status:503, headers});
  let cached: Snapshot | null = null;
  try {
    const snapshot = await env.FIXTURE_CACHE?.get<{savedAt:number; fixture:unknown}>(CACHE_KEY, {type:'json', cacheTtl:30});
    if (snapshot && Number.isFinite(snapshot.savedAt) && snapshot.savedAt <= Date.now()) {
      cached = {savedAt:snapshot.savedAt, fixture:publicFixture(snapshot.fixture)};
    }
  } catch { /* A missing or damaged snapshot must not prevent a live read. */ }
  const refreshKey = env.FIXTURE_SCRIPT_URL;
  const local = recent.get(refreshKey);
  if (local && (!cached || local.savedAt > cached.savedAt)) cached = local;
  const cooldown = Math.max(0, (retryAfter.get(refreshKey) || 0) - Date.now());
  if (cooldown > 0) {
    if (cached) return Response.json({...cached.fixture, copiaCompartida:true, desactualizado:true}, {headers});
    return Response.json({error:'Google no está disponible. Espera unos segundos antes de actualizar.'},
      {status:503, headers:{...headers, 'Retry-After':String(Math.ceil(cooldown / 1000))}});
  }
  if (cached && Date.now() - cached.savedAt < (freshRequested ? MIN_REFRESH_MS : FRESH_MS)) {
    return Response.json({...cached.fixture, copiaCompartida:true, desactualizado:false}, {headers});
  }
  let pending = refreshes.get(refreshKey);
  if (!pending) {
    pending = refreshFixture(env).finally(() => { refreshes.delete(refreshKey); });
    refreshes.set(refreshKey, pending);
  }
  if (cached && !freshRequested) {
    waitUntil(pending.catch(() => {}));
    return Response.json({...cached.fixture, copiaCompartida:true, desactualizado:true}, {headers});
  }
  try { return Response.json({...await pending, copiaCompartida:false, desactualizado:false}, {headers}); }
  catch {
    if (cached) return Response.json({...cached.fixture, copiaCompartida:true, desactualizado:true}, {headers});
    return Response.json({error:'Google no respondió correctamente. Intenta actualizar de nuevo.'}, {status:502, headers});
  }
};
