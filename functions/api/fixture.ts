interface Env { FIXTURE_SCRIPT_URL?: string }
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

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const headers = { 'Cache-Control': 'no-store' };
  if (request.method !== 'GET') return Response.json({error:'Método no permitido.'}, {status:405, headers:{...headers, Allow:'GET'}});
  if (!env.FIXTURE_SCRIPT_URL) return Response.json({error:'La programación no está configurada.'}, {status:503, headers});
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = new URL(env.FIXTURE_SCRIPT_URL);
      // Each attempt starts from /exec, never from a previously redirected Google URL.
      url.searchParams.set('_consulta', `${Date.now()}-${attempt}`);
      const response = await fetch(url.toString(), {signal:AbortSignal.timeout(12000), redirect:'follow', cache:'no-store'});
      if (!response.ok) throw new Error('Upstream unavailable');
      return Response.json(publicFixture(await response.json()), {headers});
    } catch { /* Retry the read once; this endpoint never writes to Sheets. */ }
  }
  return Response.json({error:'Google no respondió correctamente. Intenta actualizar de nuevo.'}, {status:502, headers});
};
