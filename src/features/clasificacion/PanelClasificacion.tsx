import { useEffect, useRef, useState } from 'react';
import { ACTIVIDADES, ACTIVIDADES_CLASIFICACION, CATEGORIAS, COLORES_HOUSE, FIXTURE_FUENTE, HOUSES } from '../../../shared/olimpiadas';
import { CLASIFICACION_PENDIENTE, LUGARES, isClasificacion } from './model';
import type { Clasificacion } from './model';

interface Intent { id:string; fila:number; categoria:string; version:number; puestos:Record<string,number>; puntos:Record<string,number>; motivo:string }
const GRUPOS = [...new Set(ACTIVIDADES_CLASIFICACION.map(a => a.grupo))];
const nombreActividad = (fila:number) => ACTIVIDADES.find(a => a.fila === fila)?.etiqueta || `Fila ${fila}`;
const nombreCategoria = (id:string) => CATEGORIAS.find(c => c.id === id)?.nombre || id;
const aTexto = (valores?:Record<string,number>) => Object.fromEntries(COLORES_HOUSE.map(h => [h, valores ? String(valores[h] ?? '') : '']));

export default function PanelClasificacion({onLockedChange}:{onLockedChange:(locked:boolean)=>void}) {
  const [clasificaciones,setClasificaciones] = useState<Clasificacion[]>([]);
  const [fila,setFila] = useState(''), [categoria,setCategoria] = useState('');
  const [puestos,setPuestos] = useState<Record<string,string>>(aTexto());
  const [puntos,setPuntos] = useState<Record<string,string>>(aTexto());
  const [motivo,setMotivo] = useState('');
  const [busy,setBusy] = useState(false), [loading,setLoading] = useState(true);
  const [error,setError] = useState(''), [message,setMessage] = useState('');
  const [pending,setPending] = useState<Intent|null>(() => {
    try { const raw = sessionStorage.getItem(CLASIFICACION_PENDIENTE); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const sending = useRef(false);
  useEffect(() => { onLockedChange(busy || !!pending); }, [busy,pending,onLockedChange]);
  const actual = clasificaciones.find(c => c.fila === Number(fila) && c.categoria === categoria);
  const usados = COLORES_HOUSE.map(h => puestos[h]).filter(Boolean);
  const puestosValidos = COLORES_HOUSE.every(h => ['1','2','3','4'].includes(puestos[h])) && new Set(usados).size === 4;
  const puntosValidos = COLORES_HOUSE.every(h => /^\d{1,5}$/.test(puntos[h]) && Number(puntos[h]) <= 10000);

  // Selecting an activity and category loads its registered ranking, so a save is a correction.
  function elegir(nextFila:string, nextCategoria:string, lista:Clasificacion[]) {
    setFila(nextFila); setCategoria(nextCategoria); setMotivo('');
    const existente = lista.find(c => c.fila === Number(nextFila) && c.categoria === nextCategoria);
    setPuestos(aTexto(existente?.puestos)); setPuntos(aTexto(existente?.puntos));
  }
  async function load(signal?: AbortSignal, seleccion = {fila:'', categoria:''}) {
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
      setError(''); setClasificaciones(lista); elegir(seleccion.fila, seleccion.categoria, lista);
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
    const intent:Intent|null = pending || (fila && categoria && puestosValidos && puntosValidos ? {
      id:crypto.randomUUID(), fila:Number(fila), categoria, version:actual?.version || 0,
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
        if ([400,401,403,503].includes(response.status) || (result.pending === false && ['CONFLICT','ID_REUSED','NOT_CONFIGURED','UPDATE_REQUIRED','INVALID','CELL_INVALID','INSUFFICIENT_POINTS','OTHER_PENDING'].includes(result.code))) {
          sessionStorage.removeItem(CLASIFICACION_PENDIENTE); setPending(null);
        }
        throw new Error(result.error || 'No se pudo confirmar la clasificación. Reintenta la misma operación.');
      }
      sessionStorage.removeItem(CLASIFICACION_PENDIENTE); setPending(null);
      setMessage(`Clasificación de ${nombreActividad(intent.fila)} · ${nombreCategoria(intent.categoria)} confirmada. El puntaje oficial la mostrará en su siguiente consulta.`);
      setLoading(true);
      await load(undefined, {fila:String(intent.fila), categoria:intent.categoria});
    } catch (err) { setError(err instanceof Error && !['AbortError','TimeoutError','SyntaxError'].includes(err.name) ? err.message : 'No se pudo confirmar el guardado. Reintenta la misma operación.'); }
    finally { sending.current = false; setBusy(false); }
  }
  const resumen = (c:{puestos:Record<string,number>}) => COLORES_HOUSE.slice().sort((a,b) => c.puestos[a]-c.puestos[b])
    .map(h => `${LUGARES[c.puestos[h]-1]} ${HOUSES.find(x => x.color === h)?.etiqueta}`).join(' · ');

  return <section className="bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-white/80 p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
    <h2 className="text-xl font-bold">Clasificación por puestos</h2>
    <p className="text-sm text-slate-500">Para actividades en las que participan las cuatro Houses: asigna el 1.º, 2.º, 3.º y 4.º puesto y los puntos que decidan los árbitros. Los cuatro puntajes se guardan juntos en la Sábana. Los puestos que ve el público se publican desde el archivo FINALISTA 2026.</p>
    {message && <p role="status" className="text-green-800 bg-green-50 p-3 rounded-lg">{message}</p>}
    {error && <p role="alert" className="text-red-800 bg-red-50 p-3 rounded-lg">{error}</p>}
    {pending && <div className="bg-amber-50 text-amber-900 rounded-lg p-3 space-y-2"><p>Hay una clasificación sin confirmar: {nombreActividad(pending.fila)} · {nombreCategoria(pending.categoria)} ({resumen(pending)}). Reintenta para recuperar su confirmación.</p>
      <button type="button" disabled={busy || loading} onClick={() => void save()} className="underline font-semibold">{busy ? 'Confirmando…' : 'Reintentar el mismo guardado'}</button></div>}
    <button type="button" disabled={loading || busy} onClick={() => { setLoading(true); setError(''); void load(undefined, {fila, categoria}); }} className="text-blue-700 underline disabled:opacity-50">{loading ? 'Leyendo clasificaciones…' : 'Recargar clasificaciones'}</button>
    <form onSubmit={e => { e.preventDefault(); void save(); }} className="space-y-4">
      <fieldset disabled={busy || loading || !!pending} className="space-y-4 disabled:opacity-60">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm font-medium">Actividad
            <select required value={fila} onChange={e => elegir(e.target.value, categoria, clasificaciones)} className="block w-full border rounded-xl p-3 mt-1">
              <option value="">Selecciona una actividad</option>
              {GRUPOS.map(g => <optgroup key={g} label={g}>{ACTIVIDADES_CLASIFICACION.filter(a => a.grupo === g).map(a => <option key={a.fila} value={a.fila}>{a.etiqueta}</option>)}</optgroup>)}
            </select>
          </label>
          <label className="block text-sm font-medium">Categoría
            <select required value={categoria} onChange={e => elegir(fila, e.target.value, clasificaciones)} className="block w-full border rounded-xl p-3 mt-1">
              <option value="">Selecciona una categoría</option>
              {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grados})</option>)}
            </select>
          </label>
        </div>
        {fila && categoria && <>
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
            <p className="text-xs text-slate-600">Cada puesto se asigna a una sola House. Los puntos se suman en la Sábana: {nombreActividad(Number(fila))} · {nombreCategoria(categoria)}.</p>
          </div>
          <label className="block text-sm font-medium">Motivo del registro o corrección<input required minLength={3} maxLength={300} value={motivo} onChange={e => setMotivo(e.target.value)} className="block w-full border rounded-xl p-3 mt-1"/></label>
          <button type="submit" disabled={!puestosValidos || !puntosValidos || motivo.trim().length < 3} className="rounded-xl bg-blue-600 text-white px-5 py-3 disabled:opacity-50">{busy ? 'Guardando…' : actual ? 'Corregir clasificación y puntos' : 'Guardar clasificación y puntos'}</button>
        </>}
      </fieldset>
    </form>
  </section>;
}
