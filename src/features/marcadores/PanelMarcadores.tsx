import { useEffect, useRef, useState } from 'react';
import { CATEGORIAS, ACTIVIDADES, destinoSugerido, HOUSE_NAMES, STATUS_NAMES, isActividad, isEncuentro, isMarcador, paraTodasLasHouses } from './model';
import type { Actividad, Marcador } from './model';
import { FIXTURE_FUENTE } from '../../../shared/olimpiadas';

interface Intent { id:string; encuentroId:string; version:number; a:number; b:number; estado:Marcador['estado']; motivo:string; puntosA:number; puntosB:number; fila:number|null; categoria:string }
const STORAGE = 'resultado-intento-v2';
// Embedded mode shows only the result form of one given match (e.g. inside «Clasificación por puestos»);
// the host lists the matches, remounts this form per match (key) and reloads after a save.
interface Embebido { partido:Actividad; onGuardado:() => void }
export default function PanelMarcadores({onLockedChange, embebido}:{onLockedChange:(locked:boolean)=>void; embebido?:Embebido}) {
  const inicial = embebido?.partido;
  const [matches,setMatches] = useState<Actividad[]>([]);
  const [selected,setSelected] = useState(inicial?.id || '');
  const [a,setA] = useState(String(inicial?.marcador?.a ?? 0)), [b,setB] = useState(String(inicial?.marcador?.b ?? 0));
  const [status,setStatus] = useState<Marcador['estado']>(inicial?.marcador?.estado || 'pendiente');
  const [reason,setReason] = useState('');
  const [puntosA,setPuntosA] = useState(inicial?.marcador?.integrado ? String(inicial.marcador.puntosA) : '');
  const [puntosB,setPuntosB] = useState(inicial?.marcador?.integrado ? String(inicial.marcador.puntosB) : '');
  const [busy,setBusy] = useState(false), [loading,setLoading] = useState(!embebido);
  const [error,setError] = useState(''), [message,setMessage] = useState('');
  // Set when Google did not answer in time and the server returned the last saved programme.
  const [copiaGuardada,setCopiaGuardada] = useState('');
  const [pending,setPending] = useState<Intent|null>(() => {
    try { const raw = sessionStorage.getItem(STORAGE); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const sending = useRef(false);
  useEffect(() => { onLockedChange(busy || !!pending); }, [busy,pending,onLockedChange]);
  // The embedded match comes from the host on every render, so its version is always current.
  const current = embebido ? embebido.partido : matches.find(p => p.id === selected);
  const {fila,categoria} = destinoSugerido(current);
  const destinoValido = !!fila && !!categoria;
  function choose(p?: Actividad) {
    setSelected(p?.id || ''); setA(String(p?.marcador?.a ?? 0)); setB(String(p?.marcador?.b ?? 0));
    setStatus(p?.marcador?.estado || 'pendiente'); setReason('');
    setPuntosA(p?.marcador?.integrado ? String(p.marcador.puntosA) : '');
    setPuntosB(p?.marcador?.integrado ? String(p.marcador.puntosB) : '');
  }
  async function load(signal?: AbortSignal) {
    const controller = new AbortController();
    let expired = false;
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) controller.abort();
    const timeout = window.setTimeout(() => {
      expired = true;
      controller.abort();
      if (!signal?.aborted) {
        setError('La lectura tardó demasiado. Pulsa «Recargar partidos» para reintentar.');
        setLoading(false);
      }
    }, 60000);
    try {
      const response = await fetch('/arbitraje/api/fixture',{cache:'no-store',signal:controller.signal});
      if (response.redirected || response.status === 401 || response.status === 403) throw new Error('Tu sesión venció. Vuelve a ingresar al panel.');
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('No se recibió la programación. Vuelve a ingresar al panel y reintenta.');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo leer el fixture.');
      if (data.fuente !== FIXTURE_FUENTE || data.marcadoresHabilitados !== true || data.resultadosVersion !== 2 || !Array.isArray(data.partidos))
        throw new Error('Los marcadores aún no están habilitados. Completa la configuración del script.');
      if (signal?.aborted || expired) return;
      setError('');
      setCopiaGuardada(typeof data.copiaGuardada === 'string' && !Number.isNaN(Date.parse(data.copiaGuardada)) ? data.copiaGuardada : '');
      const next:Actividad[] = data.partidos.filter((p:unknown) => isActividad(p) && !paraTodasLasHouses(p));
      setMatches(next);
      // A fresh selection is required after loading, avoiding unnoticed version changes while editing.
      choose();
    } catch (err) { if (!signal?.aborted && !expired) { setError(err instanceof Error ? err.message : 'No se pudo cargar la programación. Intenta de nuevo.'); } }
    finally {
      window.clearTimeout(timeout);
      signal?.removeEventListener('abort', cancel);
      if (!signal?.aborted && !expired) setLoading(false);
    }
  }
  useEffect(() => {
    if (embebido) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
    // The embedded form never reads the programme itself; the flag cannot change for a mounted form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function save() {
    if (sending.current) return;
    if (!pending && status === 'finalizado' && !destinoValido) {
      setError('La categoría o actividad del encuentro debe configurarse en la hoja de puntajes antes de guardar.');
      return;
    }
    const intent:Intent|null = pending || (current && isEncuentro(current) ? {id:crypto.randomUUID(),encuentroId:current.encuentroId,version:current.marcador?.version || 0,
      a:Number(a),b:Number(b),estado:status,motivo:reason.trim(),
      puntosA:status==='finalizado'?Number(puntosA):0,puntosB:status==='finalizado'?Number(puntosB):0,
      fila:status==='finalizado'?Number(fila):null,categoria:status==='finalizado'?categoria:''} : null);
    if (!intent) return;
    sending.current = true; setBusy(true); setError(''); setMessage('');
    try {
      // Persist before sending so a reload can retry the exact operation.
      sessionStorage.setItem(STORAGE,JSON.stringify(intent)); setPending(intent);
      const response = await fetch('/arbitraje/api/marcadores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(intent),signal:AbortSignal.timeout(70000)});
      const result = await response.json();
      if (!response.ok || result.success !== true || result.id !== intent.id || !isMarcador(result.marcador) || result.marcador.integrado !== true) {
        if ([400,401,403,503].includes(response.status) || (result.pending === false && ['CONFLICT','FIXTURE_CHANGED','ID_REUSED','NOT_CONFIGURED','UPDATE_REQUIRED','INVALID','CELL_INVALID','INSUFFICIENT_POINTS','OTHER_PENDING'].includes(result.code))) {
          sessionStorage.removeItem(STORAGE); setPending(null);
          if (embebido) embebido.onGuardado(); else { setMatches([]); choose(); }
        }
        throw new Error(result.error || 'No se pudo confirmar el marcador. Reintenta la misma operación.');
      }
      sessionStorage.removeItem(STORAGE); setPending(null);
      setMessage('Resultado y puntos confirmados. El fixture y el puntaje oficial los mostrarán en su siguiente consulta.');
      if (embebido) { embebido.onGuardado(); return; }
      setLoading(true);
      await load();
    } catch (err) { setError(err instanceof Error && !['AbortError','TimeoutError','SyntaxError'].includes(err.name) ? err.message : 'No se pudo confirmar el guardado. Reintenta la misma operación.'); }
    finally { sending.current = false; setBusy(false); }
  }
  const campos = current && isEncuentro(current) && <><div className="grid grid-cols-2 gap-4">
          <label className="text-sm font-medium">{HOUSE_NAMES[current.houses[0]]}<input aria-label="Marcador House A" type="number" min="0" max="999" step="1" required value={a} onChange={e=>setA(e.target.value)} className="block w-full border rounded-xl p-3 mt-1"/></label>
          <label className="text-sm font-medium">{HOUSE_NAMES[current.houses[1]]}<input aria-label="Marcador House B" type="number" min="0" max="999" step="1" required value={b} onChange={e=>setB(e.target.value)} className="block w-full border rounded-xl p-3 mt-1"/></label>
        </div><label className="block text-sm font-medium">Estado<select value={status} onChange={e=>setStatus(e.target.value as Marcador['estado'])} className="block w-full border rounded-xl p-3 mt-1">{Object.entries(STATUS_NAMES).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        {status === 'pendiente' && <p className="text-sm text-slate-500">Un encuentro pendiente debe tener ambos marcadores en cero.</p>}
        {status === 'finalizado' && <div className="bg-blue-50 rounded-xl p-4 space-y-4">
          <h3 className="font-semibold">Puntos oficiales decididos por el profesor</h3>
          <p className="text-sm">Escribe los puntos totales que corresponde otorgar por este encuentro. En una corrección se aplica solamente la diferencia.</p>
          <div className="grid grid-cols-2 gap-4">
            <label>Puntos para {HOUSE_NAMES[current.houses[0]]}<input aria-label="Puntos House A" type="number" min="0" max="10000" step="1" required value={puntosA} onChange={e=>setPuntosA(e.target.value)} className="block w-full border rounded-xl p-3 mt-1"/></label>
            <label>Puntos para {HOUSE_NAMES[current.houses[1]]}<input aria-label="Puntos House B" type="number" min="0" max="10000" step="1" required value={puntosB} onChange={e=>setPuntosB(e.target.value)} className="block w-full border rounded-xl p-3 mt-1"/></label>
          </div>
          <div>Categoría del puntaje<p className="block w-full border rounded-xl p-3 mt-1 bg-slate-100 font-medium">{CATEGORIAS[categoria as keyof typeof CATEGORIAS] || current.categoria || 'Por definir'}</p></div>
          <div>Actividad del puntaje<p className="block w-full border rounded-xl p-3 mt-1 bg-slate-100 font-medium">{ACTIVIDADES[fila] || current.deporte || 'Por definir'}</p></div>
          <p className="text-xs">La categoría y la actividad se toman del encuentro seleccionado y no se pueden cambiar aquí.</p>
          {!destinoValido && <p role="alert" className="text-amber-900">Este encuentro aún no tiene una categoría o actividad configurada en la hoja de puntajes. Debe completarse antes de guardar el resultado final.</p>}
          {current.marcador && !current.marcador.integrado && <p className="text-amber-900">Este marcador es anterior al registro unificado. Los puntos que escribas se añadirán al total; revisa antes si ya fueron otorgados manualmente.</p>}
        </div>}
        {current.marcador?.integrado && status !== 'finalizado' && <p className="text-amber-900">Al reabrir este encuentro se retirarán los puntos que le habías otorgado mediante este formulario.</p>}
        <label className="block text-sm font-medium">Motivo del registro o corrección<input required minLength={3} maxLength={300} value={reason} onChange={e=>setReason(e.target.value)} className="block w-full border rounded-xl p-3 mt-1"/></label>
        <button type="submit" disabled={(status === 'pendiente' && (Number(a)!==0 || Number(b)!==0)) || (status === 'finalizado' && !destinoValido)} className="rounded-xl bg-blue-600 text-white px-5 py-3 disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar resultado y puntos'}</button></>;
  const avisos = <>
    {message && <p role="status" className="text-green-800 bg-green-50 p-3 rounded-lg">{message}</p>}
    {error && <p role="alert" className="text-red-800 bg-red-50 p-3 rounded-lg">{error}</p>}
    {pending && <div className="bg-amber-50 text-amber-900 rounded-lg p-3 space-y-2"><p>Hay un resultado y sus puntos sin confirmar: {pending.a} – {pending.b} · {STATUS_NAMES[pending.estado]}. Reintenta para recuperar su confirmación.</p>
      <button type="button" disabled={busy || loading} onClick={() => void save()} className="underline font-semibold">{busy ? 'Confirmando…' : 'Reintentar el mismo guardado'}</button></div>}
  </>;
  if (embebido) return <div className="space-y-4">
    {avisos}
    <form onSubmit={e => {e.preventDefault(); void save();}} className="space-y-4">
      <fieldset disabled={busy || !!pending} className="space-y-4 disabled:opacity-60">{campos}</fieldset>
    </form>
  </div>;
  return <section className="bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-white/80 p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
    <h2 className="text-xl font-bold">Resultado del partido</h2>
    <p className="text-sm text-slate-500">Registra el marcador y, al finalizar, los puntos que decida el profesor para cada House.</p>
    {avisos}
    {copiaGuardada && !error && <p role="status" className="text-amber-900 bg-amber-50 p-3 rounded-lg">Google no respondió a tiempo. Se muestra la programación leída el {new Date(copiaGuardada).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}; puede no incluir los últimos cambios. Si un encuentro cambió, el guardado lo detectará y te pedirá recargar. Pulsa «Recargar partidos» para intentar leer la versión actual.</p>}
    <button type="button" disabled={loading || busy} onClick={() => { setLoading(true); setError(''); void load(); }} className="text-blue-700 underline disabled:opacity-50">{loading ? 'Leyendo partidos…' : 'Recargar partidos'}</button>
    <form onSubmit={e => {e.preventDefault(); void save();}} className="space-y-4">
      <fieldset disabled={busy || loading || !!pending} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm font-medium">Encuentro
          <select required value={selected} onChange={e => choose(matches.find(p => p.id === e.target.value))} className="block w-full border rounded-xl p-3 mt-1">
            <option value="">Selecciona un partido</option>{matches.map(p => <option key={p.id} value={p.id}>{p.fecha || 'Fecha por definir'} · {p.hora} · {p.deporte} · {p.categoria} · {p.enfrentamiento}</option>)}
          </select>
        </label>
        {!loading && !matches.length && !error && <p className="text-sm text-slate-500">No hay actividades en el fixture oficial.</p>}
        {current && !isEncuentro(current) && <div role="status" className="bg-amber-50 text-amber-900 p-3 rounded-lg space-y-2">
          <p>Este encuentro está en la programación. No necesita un árbitro asignado para aparecer aquí.</p>
          {!current.houses && <p>Equipos por definir o actividad sin enfrentamiento entre dos Houses. Completa los equipos en Sheets para registrar un marcador; si participan las cuatro Houses, usa «Clasificación por puestos».</p>}
          {current.avisos.map((aviso,i) => <p key={i}>{aviso}</p>)}
          <p>Para habilitar el marcador, revisa que tenga fecha, disciplina y dos Houses distintas, sin avisos ni encuentros duplicados.</p>
        </div>}
        {campos}
      </fieldset>
    </form>
    <p className="text-xs text-slate-500">Se muestran los partidos de la programación oficial, con o sin árbitro asignado. Las actividades con todas las Houses se registran en «Clasificación por puestos». Si faltan equipos o datos, complétalos en Sheets y pulsa «Recargar partidos».</p>
  </section>;
}
