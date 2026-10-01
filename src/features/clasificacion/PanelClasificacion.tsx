import { useEffect, useRef, useState } from 'react';
import { ACTIVIDADES, ACTIVIDADES_CLASIFICACION, CATEGORIAS, COLORES_HOUSE, FIXTURE_FUENTE, HOUSES, RETOS_ACADEMICOS } from '../../../shared/olimpiadas';
import { CLASIFICACION_PENDIENTE, LUGARES, clasificacionesHuerfanas, columnaDe, detalleVigente, filaSugerida, isClasificacion, porCategoria, posibleDuplicado } from './model';
import type { Clasificacion } from './model';
import { isActividad, isEncuentro, paraTodasLasHouses } from '../marcadores/model';
import type { Actividad } from '../marcadores/model';
import PanelMarcadores from '../marcadores/PanelMarcadores';
import { tipoPuesto } from './model';

interface Intent { id:string; actividad:string; detalle:string; fila:number; categoria:string; version:number; puestos:Record<string,number>; puntos:Record<string,number>; motivo:string }
// The ranking target is fixed by what was selected: activity, score sheet row and column.
interface Destino { actividad:string; detalle:string; fila:number; categoria:string }
const GRUPOS = [...new Set(ACTIVIDADES_CLASIFICACION.map(a => a.grupo))];
const nombreActividad = (fila:number) => ACTIVIDADES.find(a => a.fila === fila)?.etiqueta || `Fila ${fila}`;
const nombreCategoria = (id:string) => CATEGORIAS.find(c => c.id === id)?.nombre || id;
const aTexto = (valores?:Record<string,number>) => Object.fromEntries(COLORES_HOUSE.map(h => [h, valores ? String(valores[h] ?? '') : '']));
const OTRAS = 'otras';
// Option prefix for a ranking whose programme activity no longer exists.
const HUERFANA = 'huerfana:';
const fechaLarga = (fecha:string) => new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long' });
const fechaCorta = (fecha:string) => `${fecha.slice(8,10)}/${fecha.slice(5,7)}`;

function destinoDe(p:Actividad): Destino|null {
  const fila = filaSugerida(p.deporte);
  return fila === null ? null : { actividad:p.encuentroId, fila, categoria:columnaDe(p.categoria),
    detalle:`${fechaCorta(p.fecha)} · ${p.hora} · ${p.deporte} · ${p.categoria}`.slice(0, 200) };
}
// Outside the programme: one ranking per activity, except academic challenges, where each category
// plays its own challenge and is chosen as «<fila>:<categoria>».
function destinoOtra(valor:string, huerfanas:Clasificacion[], programadas:Actividad[]): Destino|null {
  // A ranking left without its programme activity is corrected under its own key, so nothing is added twice.
  // Its detail takes the current programme name when the renamed activity can be identified.
  if (valor.startsWith(HUERFANA)) {
    const c = huerfanas.find(h => HUERFANA + h.actividad === valor);
    const vigente = c && detalleVigente(c, programadas.map(destinoDe).filter((d):d is Destino => d !== null));
    return c?.actividad ? { actividad:c.actividad, fila:c.fila, categoria:c.categoria, detalle:(vigente || nombreActividad(c.fila)).slice(0, 200) } : null;
  }
  const [texto, categoria] = valor.split(':'), fila = Number(texto);
  if (!categoria) return porCategoria(fila) ? null : { actividad:`sabana:${fila}`, fila, categoria:columnaDe(''), detalle:nombreActividad(fila) };
  const reto = RETOS_ACADEMICOS.find(r => r.fila === fila && (r.categorias as readonly string[]).includes(categoria));
  const area = ACTIVIDADES.find(a => a.fila === fila)?.nombre || nombreActividad(fila);
  return reto ? { actividad:`sabana:${fila}:${categoria}`, fila, categoria, detalle:`${area} · ${reto.reto} · ${nombreCategoria(categoria)}` } : null;
}
const opcionesRetos = (fila:number) => RETOS_ACADEMICOS.filter(r => r.fila === fila)
  .flatMap(r => r.categorias.map(c => ({ valor:`${fila}:${c}`, texto:`${r.reto} · ${nombreCategoria(c)}` })));

export default function PanelClasificacion({onLockedChange}:{onLockedChange:(locked:boolean)=>void}) {
  const [clasificaciones,setClasificaciones] = useState<Clasificacion[]>([]);
  // Programme activities for all four Houses that add points to the score sheet, chosen by date.
  const [programadas,setProgramadas] = useState<Actividad[]>([]);
  // Matches for 1st–2nd and 3rd–4th place between two Houses: their result decides the places.
  const [partidosPuesto,setPartidosPuesto] = useState<Actividad[]>([]);
  const [partidoLocked,setPartidoLocked] = useState(false);
  // Activity keys in the current programme, to find rankings whose activity was edited away in Sheets.
  const [idsFixture,setIdsFixture] = useState<ReadonlySet<string>>(new Set());
  const [confirmaDistinta,setConfirmaDistinta] = useState(false);
  const [fecha,setFecha] = useState(''), [seleccion,setSeleccion] = useState('');
  const [puestos,setPuestos] = useState<Record<string,string>>(aTexto());
  const [puntos,setPuntos] = useState<Record<string,string>>(aTexto());
  const [motivo,setMotivo] = useState('');
  const [busy,setBusy] = useState(false), [loading,setLoading] = useState(true);
  const [error,setError] = useState(''), [message,setMessage] = useState('');
  const [pending,setPending] = useState<Intent|null>(() => {
    try { const raw = sessionStorage.getItem(CLASIFICACION_PENDIENTE); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const sending = useRef(false);
  useEffect(() => { onLockedChange(busy || !!pending || partidoLocked); }, [busy,pending,partidoLocked,onLockedChange]);
  const fechas = [...new Set([...programadas, ...partidosPuesto].map(p => p.fecha).filter(Boolean))].sort();
  const delDia = programadas.filter(p => p.fecha === fecha);
  const puestosDelDia = partidosPuesto.filter(p => p.fecha === fecha);
  const programada = fecha !== OTRAS ? programadas.find(p => p.id === seleccion) : undefined;
  const partido = fecha !== OTRAS ? puestosDelDia.find(p => p.id === seleccion) : undefined;
  const huerfanas = clasificacionesHuerfanas(clasificaciones, idsFixture);
  const destino = programada ? destinoDe(programada) : fecha === OTRAS && seleccion ? destinoOtra(seleccion, huerfanas, programadas) : null;
  const actual = destino ? clasificaciones.find(c => c.actividad === destino.actividad) : undefined;
  // Same row, column and day as a ranking left without its activity: probably the same activity renamed.
  const duplicado = programada && destino ? posibleDuplicado(destino, huerfanas) : undefined;
  const usados = COLORES_HOUSE.map(h => puestos[h]).filter(Boolean);
  const puestosValidos = COLORES_HOUSE.every(h => ['1','2','3','4'].includes(puestos[h])) && new Set(usados).size === 4;
  const puntosValidos = COLORES_HOUSE.every(h => /^\d{1,5}$/.test(puntos[h]) && Number(puntos[h]) <= 10000);

  // Choosing an activity loads its registered ranking, so a save is a correction.
  function cargar(actividad:string|null, lista:Clasificacion[]) {
    const existente = actividad ? lista.find(c => c.actividad === actividad) : undefined;
    setPuestos(aTexto(existente?.puestos)); setPuntos(aTexto(existente?.puntos)); setMotivo(''); setConfirmaDistinta(false);
  }
  function elegirFecha(nextFecha:string) { setFecha(nextFecha); setSeleccion(''); cargar(null, clasificaciones); }
  function elegirActividad(valor:string) {
    setSeleccion(valor);
    const p = programadas.find(x => x.id === valor);
    const d = fecha === OTRAS ? (valor ? destinoOtra(valor, huerfanas, programadas) : null) : p ? destinoDe(p) : null;
    cargar(d?.actividad || null, clasificaciones);
  }
  async function load(signal?: AbortSignal, actividad:string|null = null) {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    const timeout = window.setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch('/arbitraje/api/fixture',{cache:'no-store',signal:controller.signal});
      if (response.redirected || response.status === 401 || response.status === 403) throw new Error('Tu sesión venció. Vuelve a ingresar al panel.');
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('No se recibieron las clasificaciones. Vuelve a ingresar al panel y reintenta.');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron leer las clasificaciones.');
      if (data.fuente !== FIXTURE_FUENTE || !Array.isArray(data.clasificaciones))
        throw new Error('El script del fixture todavía no publica clasificaciones. Actualiza Marcadores.gs en el proyecto Fixture.');
      if (signal?.aborted) return;
      const lista:Clasificacion[] = data.clasificaciones.filter((c:unknown) => isClasificacion(c) && Number.isSafeInteger(c.version) && c.version > 0);
      setError(''); setClasificaciones(lista); cargar(actividad, lista);
      setIdsFixture(new Set(Array.isArray(data.partidos) ? data.partidos.map((p:{encuentroId?:unknown}) => p?.encuentroId).filter((id:unknown): id is string => typeof id === 'string') : []));
      setPartidosPuesto(Array.isArray(data.partidos) ? data.partidos.filter((p:unknown) => isEncuentro(p) && isActividad(p) && tipoPuesto(p.fase ?? '') !== null) : []);
      setProgramadas(Array.isArray(data.partidos) ? data.partidos.filter((p:unknown) => isActividad(p) && paraTodasLasHouses(p) && filaSugerida(p.deporte) !== null) : []);
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error && err.name !== 'AbortError' ? err.message : 'La lectura tardó demasiado. Pulsa «Recargar clasificaciones» para reintentar.');
    } finally {
      window.clearTimeout(timeout);
      signal?.removeEventListener('abort', cancel);
      if (!signal?.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, []);
  async function save() {
    if (sending.current) return;
    const intent:Intent|null = pending || (destino && puestosValidos && puntosValidos && (!duplicado || confirmaDistinta) ? {
      id:crypto.randomUUID(), ...destino, version:actual?.version || 0,
      puestos:Object.fromEntries(COLORES_HOUSE.map(h => [h, Number(puestos[h])])),
      puntos:Object.fromEntries(COLORES_HOUSE.map(h => [h, Number(puntos[h])])), motivo:motivo.trim() } : null);
    if (!intent) return;
    sending.current = true; setBusy(true); setError(''); setMessage('');
    try {
      // Persist before sending so a reload can retry the exact operation.
      sessionStorage.setItem(CLASIFICACION_PENDIENTE,JSON.stringify(intent)); setPending(intent);
      const response = await fetch('/arbitraje/api/clasificacion',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(intent),signal:AbortSignal.timeout(70000)});
      const result = await response.json();
      if (!response.ok || result.success !== true || result.id !== intent.id || result.clasificacion?.integrado !== true) {
        // A 409 means Apps Script answered; unless it may hold a started record, nothing is left to retry.
        if ([400,401,403,503].includes(response.status) || (response.status === 409 && result.pending !== true)) {
          sessionStorage.removeItem(CLASIFICACION_PENDIENTE); setPending(null);
        }
        throw new Error(result.error || 'No se pudo confirmar la clasificación. Reintenta la misma operación.');
      }
      sessionStorage.removeItem(CLASIFICACION_PENDIENTE); setPending(null);
      setMessage(`Clasificación de ${intent.detalle} confirmada. El puntaje oficial y la pestaña «Puestos» del fixture la mostrarán en su siguiente consulta.`);
      setLoading(true);
      await load(undefined, intent.actividad);
    } catch (err) { setError(err instanceof Error && !['AbortError','TimeoutError','SyntaxError'].includes(err.name) ? err.message : 'No se pudo confirmar el guardado. Reintenta la misma operación.'); }
    finally { sending.current = false; setBusy(false); }
  }
  const resumen = (c:{puestos:Record<string,number>}) => COLORES_HOUSE.slice().sort((a,b) => c.puestos[a]-c.puestos[b])
    .map(h => `${LUGARES[c.puestos[h]-1]} ${HOUSES.find(x => x.color === h)?.etiqueta}`).join(' · ');

  return <section className="bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-white/80 p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
    <h2 className="text-xl font-bold">Clasificación por puestos</h2>
    <p className="text-sm text-slate-500">Para actividades en las que participan las cuatro Houses: asigna el 1.º, 2.º, 3.º y 4.º puesto y los puntos que decidan los árbitros. Los cuatro puntajes se guardan juntos en la Sábana y los puestos se publican en la pestaña «Puestos» del fixture.</p>
    {message && <p role="status" className="text-green-800 bg-green-50 p-3 rounded-lg">{message}</p>}
    {error && <p role="alert" className="text-red-800 bg-red-50 p-3 rounded-lg">{error}</p>}
    {!loading && !!huerfanas.length && <p role="status" className="text-amber-900 bg-amber-50 p-3 rounded-lg text-sm">{huerfanas.length === 1 ? 'Hay 1 clasificación registrada' : `Hay ${huerfanas.length} clasificaciones registradas`} cuya actividad ya no aparece igual en el fixture, por ejemplo porque se corrigió su nombre, fecha u hora en Sheets. Sus puntos siguen en la Sábana: no la registres de nuevo. Para corregirla, elige «Otras actividades» → «Registradas que ya no están en el fixture».</p>}
    {pending && <div className="bg-amber-50 text-amber-900 rounded-lg p-3 space-y-2"><p>Hay una clasificación sin confirmar: {pending.detalle} ({resumen(pending)}). Reintenta para recuperar su confirmación.</p>
      <button type="button" disabled={busy || loading} onClick={() => void save()} className="underline font-semibold">{busy ? 'Confirmando…' : 'Reintentar el mismo guardado'}</button></div>}
    <button type="button" disabled={loading || busy} onClick={() => { setLoading(true); setError(''); void load(undefined, destino?.actividad || null); }} className="text-blue-700 underline disabled:opacity-50">{loading ? 'Leyendo clasificaciones…' : 'Recargar clasificaciones'}</button>
    <form onSubmit={e => { e.preventDefault(); void save(); }} className="space-y-4">
      <fieldset disabled={busy || loading || !!pending || partidoLocked} className="space-y-4 disabled:opacity-60">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm font-medium">Fecha
            <select required value={fecha} onChange={e => elegirFecha(e.target.value)} className="block w-full border rounded-xl p-3 mt-1">
              <option value="">Selecciona una fecha</option>
              {fechas.map(f => <option key={f} value={f}>{fechaLarga(f)}</option>)}
              <option value={OTRAS}>Otras actividades (fuera del fixture)</option>
            </select>
          </label>
          {fecha && <label className="block text-sm font-medium">Actividad
            <select required value={seleccion} onChange={e => elegirActividad(e.target.value)} className="block w-full border rounded-xl p-3 mt-1">
              <option value="">Selecciona una actividad</option>
              {fecha === OTRAS
                ? (huerfanas.length ? [<optgroup key={HUERFANA} label="Registradas que ya no están en el fixture">{huerfanas.map(c => <option key={c.actividad} value={HUERFANA + c.actividad}>{c.detalle || nombreActividad(c.fila)}</option>)}</optgroup>] : []).concat(GRUPOS.flatMap(g => ACTIVIDADES_CLASIFICACION.some(a => a.grupo === g && porCategoria(a.fila))
                  // Academic challenges: one option per challenge and category, grouped by area.
                  ? ACTIVIDADES_CLASIFICACION.filter(a => a.grupo === g).map(a => <optgroup key={a.fila} label={`${g} · ${a.nombre}`}>{opcionesRetos(a.fila).map(o => <option key={o.valor} value={o.valor}>{o.texto}</option>)}</optgroup>)
                  : [<optgroup key={g} label={g}>{ACTIVIDADES_CLASIFICACION.filter(a => a.grupo === g).map(a => <option key={a.fila} value={a.fila}>{a.etiqueta}</option>)}</optgroup>]))
                : <>
                  {!!puestosDelDia.length && <optgroup label="Partidos por puesto (dos Houses)">{puestosDelDia.map(p => <option key={p.id} value={p.id}>{tipoPuesto(p.fase ?? '') === 'final' ? '1.º y 2.º' : '3.º y 4.º'} · {p.hora} · {p.deporte} · {p.categoria} · {p.enfrentamiento}</option>)}</optgroup>}
                  {!!delDia.length && <optgroup label="Actividades con todas las Houses">{delDia.map(p => <option key={p.id} value={p.id}>{p.hora} · {p.deporte} · {p.categoria}</option>)}</optgroup>}
                </>}
            </select>
          </label>}
        </div>
        {destino && <>
          <div className="bg-slate-100 rounded-xl p-3 text-sm"><span className="font-medium">Se suma en la Sábana:</span> {nombreActividad(destino.fila)} · columna {nombreCategoria(destino.categoria)}</div>
          {duplicado && <div role="alert" className="text-red-900 bg-red-50 p-3 rounded-lg text-sm space-y-2">
            <p>Ya hay una clasificación del mismo día en esta fila y columna, registrada como «{duplicado.detalle}», cuya actividad ya no aparece igual en el fixture. Si es la misma actividad, no la registres aquí: corrígela en «Otras actividades» → «Registradas que ya no están en el fixture», o sus puntos se sumarán dos veces.</p>
            <label className="flex items-start gap-2"><input type="checkbox" checked={confirmaDistinta} onChange={e => setConfirmaDistinta(e.target.checked)} className="mt-1"/><span>Es una actividad distinta de la ya registrada.</span></label>
          </div>}
          {actual?.detalle && fecha === OTRAS && destino.detalle !== actual.detalle && <p role="status" className="text-blue-900 bg-blue-50 p-3 rounded-lg text-sm">Se guardará con el nombre actual del fixture: «{destino.detalle}» (antes «{actual.detalle}»). Si los puestos y los puntos no cambian, la Sábana queda igual.</p>}
          {actual && <p role="status" className="text-amber-900 bg-amber-50 p-3 rounded-lg text-sm">Ya hay una clasificación registrada el {new Date(actual.actualizado).toLocaleString('es-PE', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}: {resumen(actual)}. Si guardas, se reemplaza y en la Sábana se aplica solo la diferencia de puntos.</p>}
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <div className="hidden sm:grid grid-cols-[1fr_7rem_7rem] gap-3 text-xs font-semibold text-slate-600"><span>House</span><span>Puesto</span><span>Puntos</span></div>
            {/* On phones the House name takes its own line, with place and points below it. */}
            {HOUSES.map(h => <div key={h.color} className="grid grid-cols-2 sm:grid-cols-[1fr_7rem_7rem] gap-x-3 gap-y-1 items-center">
              <span className="col-span-2 sm:col-span-1 font-medium">{h.etiqueta}</span>
              <select aria-label={`Puesto de ${h.etiqueta}`} required value={puestos[h.color]} onChange={e => setPuestos({...puestos,[h.color]:e.target.value})} className="min-w-0 border rounded-xl p-2 bg-white">
                <option value="">Puesto</option>
                {LUGARES.map((l,i) => <option key={l} value={String(i+1)} disabled={puestos[h.color] !== String(i+1) && usados.includes(String(i+1))}>{l}</option>)}
              </select>
              <input aria-label={`Puntos de ${h.etiqueta}`} type="number" min="0" max="10000" step="1" required placeholder="Puntos" value={puntos[h.color]} onChange={e => setPuntos({...puntos,[h.color]:e.target.value})} className="min-w-0 border rounded-xl p-2 bg-white"/>
            </div>)}
            <p className="text-xs text-slate-600">Cada puesto se asigna a una sola House.</p>
          </div>
          <label className="block text-sm font-medium">Motivo del registro o corrección<input required minLength={3} maxLength={300} value={motivo} onChange={e => setMotivo(e.target.value)} className="block w-full border rounded-xl p-3 mt-1"/></label>
          <button type="submit" disabled={!puestosValidos || !puntosValidos || motivo.trim().length < 3 || (!!duplicado && !confirmaDistinta)} className="rounded-xl bg-blue-600 text-white px-5 py-3 disabled:opacity-50">{busy ? 'Guardando…' : actual ? 'Corregir clasificación y puntos' : 'Guardar clasificación y puntos'}</button>
        </>}
      </fieldset>
    </form>
    {/* A match for a place is saved exactly like «Resultado del partido»: its result decides the places. */}
    {partido && <div className="space-y-3">
      <div className="bg-slate-100 rounded-xl p-3 text-sm"><span className="font-medium">{tipoPuesto(partido.fase ?? '') === 'final' ? 'Partido por el 1.º y 2.º puesto' : 'Partido por el 3.º y 4.º puesto'}:</span> el ganador queda {tipoPuesto(partido.fase ?? '') === 'final' ? '1.º y el perdedor 2.º' : '3.º y el perdedor 4.º'}. Si terminan empatados, registra el marcador con el desempate incluido.</div>
      <PanelMarcadores key={partido.id} onLockedChange={setPartidoLocked}
        embebido={{ partido, onGuardado: () => { setLoading(true); void load(); } }} />
    </div>}
  </section>;
}
