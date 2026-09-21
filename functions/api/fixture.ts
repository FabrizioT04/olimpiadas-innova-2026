interface Env { FIXTURE_SCRIPT_URL?: string; FIXTURE_CACHE?: KVNamespace }
const CACHE_KEY = 'fixture-publico-v1';
const FRESH_MS = 30000;
const refreshes = new Map<string, Promise<ReturnType<typeof publicFixture>>>();
const sourceId = '14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg';
const pick = (value: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.map(key => [key, value[key]]));

// Expose only the public programme and scores, never the private scoring history.
export function publicFixture(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Invalid fixture');
  const data = value as Record<string, unknown>;
  if (data.version !== 1 || data.fuente !== sourceId || typeof data.actualizado !== 'string' ||
      Number.isNaN(Date.parse(data.actualizado)) || !Array.isArray(data.partidos) ||
      !Array.isArray(data.finalistas) || !Array.isArray(data.avisos)) throw new Error('Invalid fixture');
  return {
    version: 1, fuente: sourceId, actualizado: data.actualizado,
    avisos: data.avisos.filter(item => typeof item === 'string'),
    partidos: data.partidos.map(p => ({
      ...pick(p, ['id','fecha','hora','deporte','enfrentamiento','categoria','arbitro','lugar','fase','bloque','seccion','origen','fila','avisos']),
      marcador: p.marcador ? pick(p.marcador, ['version','houseA','houseB','a','b','estado','actualizado']) : null,
    })),
    finalistas: data.finalistas.map(p => pick(p, ['id','deporte','categoria','terceroCuarto','primeroSegundo','puestos','origen','fila'])),
  };
}

async function refreshFixture(env: Env) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = new URL(env.FIXTURE_SCRIPT_URL!);
      url.searchParams.set('_consulta', `${Date.now()}-${attempt}`);
      const response = await fetch(url.toString(), {signal:AbortSignal.timeout(12000), redirect:'follow', cache:'no-store'});
      if (!response.ok) throw new Error('Upstream unavailable');
      const fixture = publicFixture(await response.json());
      // KV failure must not discard a valid live response; snapshots never expire.
      try { await env.FIXTURE_CACHE?.put(CACHE_KEY, JSON.stringify({savedAt:Date.now(), fixture})); } catch { console.warn('Fixture snapshot could not be saved'); }
      return fixture;
    } catch { /* Retry the read once; this endpoint never writes to Sheets. */ }
  }
  throw new Error('Fixture unavailable');
}

export const onRequest: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const headers = { 'Cache-Control': 'no-store' };
  if (request.method !== 'GET') return Response.json({error:'Método no permitido.'}, {status:405, headers:{...headers, Allow:'GET'}});
  if (!env.FIXTURE_SCRIPT_URL) return Response.json({error:'La programación no está configurada.'}, {status:503, headers});
  let cached: {savedAt:number; fixture:ReturnType<typeof publicFixture>} | null = null;
  try {
    const snapshot = await env.FIXTURE_CACHE?.get<{savedAt:number; fixture:unknown}>(CACHE_KEY, {type:'json', cacheTtl:30});
    if (snapshot && Number.isFinite(snapshot.savedAt) && snapshot.savedAt <= Date.now()) {
      cached = {savedAt:snapshot.savedAt, fixture:publicFixture(snapshot.fixture)};
    }
  } catch { /* A missing or damaged snapshot must not prevent a live read. */ }
  if (cached && Date.now() - cached.savedAt < FRESH_MS) {
    return Response.json({...cached.fixture, copiaCompartida:true, desactualizado:false}, {headers});
  }
  const refreshKey = env.FIXTURE_SCRIPT_URL;
  let pending = refreshes.get(refreshKey);
  if (!pending) {
    pending = refreshFixture(env).finally(() => { refreshes.delete(refreshKey); });
    refreshes.set(refreshKey, pending);
  }
  if (cached) {
    waitUntil(pending.catch(() => {}));
    return Response.json({...cached.fixture, copiaCompartida:true, desactualizado:true}, {headers});
  }
  try { return Response.json({...await pending, copiaCompartida:false, desactualizado:false}, {headers}); }
  catch { return Response.json({error:'Google no respondió correctamente. Intenta actualizar de nuevo.'}, {status:502, headers}); }
};
