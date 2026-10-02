import { COLORES_HOUSE, type ColorHouse } from '../../shared/olimpiadas';

interface Env { APPS_SCRIPT_URL?: string; FIXTURE_CACHE?: KVNamespace }
type Puntajes = Record<ColorHouse, number>;
type Snapshot = { savedAt:number; puntajes:Puntajes };
const CACHE_KEY = 'puntajes-publico-v1';
const FRESH_MS = 10000;
const FAILURE_COOLDOWN_MS = 15000;
// KV's free tier allows only 1,000 writes a day: save the totals when they change, and unchanged ones
// at most every ten minutes so new instances still find a reasonably recent copy.
const SNAPSHOT_REFRESH_MS = 600000;
// Per-instance protection complements the shared KV snapshot, as in /api/fixture.
let recent: Snapshot | null = null;
let retryAfter = 0;
let pending: Promise<Snapshot> | null = null;
let stored: {content:string; savedAt:number} | null = null;

// Expose only the four totals, never the recent history rows Apps Script also returns.
export function publicPuntajes(value: unknown): Puntajes {
  if (!value || typeof value !== 'object') throw new Error('Invalid scores');
  const data = value as Record<string, unknown>;
  if (!COLORES_HOUSE.every(h => Number.isSafeInteger(data[h]) && (data[h] as number) >= 0)) throw new Error('Invalid scores');
  return Object.fromEntries(COLORES_HOUSE.map(h => [h, data[h]])) as Puntajes;
}

async function refreshPuntajes(env: Env) {
  try {
    const url = new URL(env.APPS_SCRIPT_URL!);
    url.searchParams.set('page', 'api_puntos');
    const response = await fetch(url.toString(), {signal:AbortSignal.timeout(20000), redirect:'follow', cache:'no-store'});
    if (!response.ok) throw new Error('Upstream unavailable');
    // Apps Script answers with a fixed JSONP callback; parse it as text, never evaluate it.
    const text = (await response.text()).trim();
    if (!text.startsWith('procesarPodio(')) throw new Error('Invalid scores');
    const snapshot = {savedAt:Date.now(), puntajes:publicPuntajes(JSON.parse(text.replace(/^procesarPodio\(/, '').replace(/\);?$/, '')))};
    recent = snapshot;
    retryAfter = 0;
    const content = JSON.stringify(snapshot.puntajes);
    if (env.FIXTURE_CACHE && (stored?.content !== content || snapshot.savedAt - stored.savedAt >= SNAPSHOT_REFRESH_MS)) {
      try {
        await env.FIXTURE_CACHE.put(CACHE_KEY, JSON.stringify(snapshot));
        stored = {content, savedAt:snapshot.savedAt};
      } catch { console.warn('Scores snapshot could not be saved'); }
    }
    return snapshot;
  } catch {
    retryAfter = Date.now() + FAILURE_COOLDOWN_MS;
    throw new Error('Scores unavailable');
  }
}

export const onRequest: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const headers = { 'Cache-Control': 'no-store' };
  const reply = (snapshot: Snapshot, desactualizado: boolean) =>
    Response.json({...snapshot.puntajes, actualizado:new Date(snapshot.savedAt).toISOString(), desactualizado}, {headers});
  if (request.method !== 'GET') return Response.json({error:'Método no permitido.'}, {status:405, headers:{...headers, Allow:'GET'}});
  if (!env.APPS_SCRIPT_URL) return Response.json({error:'Los puntajes no están configurados.'}, {status:503, headers});
  let cached: Snapshot | null = null;
  // A recent local read already answers this request, so it costs no KV read.
  if (recent && Date.now() - recent.savedAt < FRESH_MS) return reply(recent, false);
  try {
    const snapshot = await env.FIXTURE_CACHE?.get<{savedAt:number; puntajes:unknown}>(CACHE_KEY, {type:'json', cacheTtl:30});
    if (snapshot && Number.isFinite(snapshot.savedAt) && snapshot.savedAt <= Date.now()) {
      cached = {savedAt:snapshot.savedAt, puntajes:publicPuntajes(snapshot.puntajes)};
      stored ??= {content:JSON.stringify(cached.puntajes), savedAt:cached.savedAt};
    }
  } catch { /* A missing or damaged snapshot must not prevent a live read. */ }
  if (recent && (!cached || recent.savedAt > cached.savedAt)) cached = recent;
  if (cached && Date.now() - cached.savedAt < FRESH_MS) return reply(cached, false);
  if (Date.now() < retryAfter) {
    if (cached) return reply(cached, true);
    return Response.json({error:'Los puntajes no están disponibles. Intenta en unos segundos.'},
      {status:503, headers:{...headers, 'Retry-After':String(Math.ceil((retryAfter - Date.now()) / 1000))}});
  }
  if (!pending) pending = refreshPuntajes(env).finally(() => { pending = null; });
  if (cached) {
    waitUntil(pending.catch(() => {}));
    return reply(cached, true);
  }
  try { return reply(await pending, false); }
  catch { return Response.json({error:'No se pudieron leer los puntajes. Intenta en unos segundos.'}, {status:502, headers}); }
};
