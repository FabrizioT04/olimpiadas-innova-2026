import { useEffect, useRef, useState } from 'react';
import { FIXTURE_URL, HOUSE_NAMES, STATUS_NAMES, isEncuentro, isMarcador } from './model';
import type { Encuentro, Marcador } from './model';

interface Intent { id:string; encuentroId:string; version:number; a:number; b:number; estado:Marcador['estado']; motivo:string }
const STORAGE = 'marcador-intento';
export default function PanelMarcadores() {
  const [matches,setMatches] = useState<Encuentro[]>([]);
  const [selected,setSelected] = useState('');
  const [a,setA] = useState('0'), [b,setB] = useState('0');
  const [status,setStatus] = useState<Marcador['estado']>('pendiente');
  const [reason,setReason] = useState('');
  const [busy,setBusy] = useState(false), [loading,setLoading] = useState(true);
  const [error,setError] = useState(''), [message,setMessage] = useState('');
  const [pending,setPending] = useState<Intent|null>(() => {
    try { const raw = sessionStorage.getItem(STORAGE); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const sending = useRef(false);
  const current = matches.find(p => p.encuentroId === selected);
  function choose(p?: Encuentro) {
    setSelected(p?.encuentroId || ''); setA(String(p?.marcador?.a ?? 0)); setB(String(p?.marcador?.b ?? 0));
    setStatus(p?.marcador?.estado || 'pendiente'); setReason('');
  }
  async function load(signal?: AbortSignal) {
    try {
      const response = await fetch(FIXTURE_URL,{cache:'no-store',signal:signal ? AbortSignal.any([signal,AbortSignal.timeout(65000)]) : AbortSignal.timeout(65000)});
      if (!response.ok) throw new Error('No se pudo leer el fixture.');
      const data = await response.json();
      if (data.fuente !== '14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg' || data.marcadoresHabilitados !== true || !Array.isArray(data.partidos))
        throw new Error('Los marcadores aún no están habilitados. Completa la configuración del script.');
      if (signal?.aborted) return;
      setError('');
      const next:Encuentro[] = data.partidos.filter(isEncuentro);
      setMatches(next);
      // A fresh selection is required after loading, avoiding unnoticed version changes while editing.
      choose();
    } catch (err) { if (!signal?.aborted) { setMatches([]); choose(); setError(err instanceof Error && err.name !== 'TimeoutError' ? err.message : 'La lectura tardó demasiado. Intenta cargar de nuevo.'); } }
    finally { if (!signal?.aborted) setLoading(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, []);
  async function save() {
    if (sending.current) return;
    const intent:Intent|null = pending || (current ? {id:crypto.randomUUID(),encuentroId:current.encuentroId,version:current.marcador?.version || 0,
      a:Number(a),b:Number(b),estado:status,motivo:reason.trim()} : null);
    if (!intent) return;
    sending.current = true; setBusy(true); setError(''); setMessage('');
    try {
      // Persist before sending so a reload can retry the exact operation.
      sessionStorage.setItem(STORAGE,JSON.stringify(intent)); setPending(intent);
      const response = await fetch('/arbitraje/api/marcadores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(intent),signal:AbortSignal.timeout(70000)});
      const result = await response.json();
      if (!response.ok || result.success !== true || result.id !== intent.id || !isMarcador(result.marcador)) {
        if ([400,401,403,503].includes(response.status) || ['CONFLICT','FIXTURE_CHANGED','ID_REUSED','NOT_CONFIGURED'].includes(result.code)) {
          sessionStorage.removeItem(STORAGE); setPending(null); setMatches([]); choose();
        }
        throw new Error(result.error || 'No se pudo confirmar el marcador. Reintenta la misma operación.');
      }
      sessionStorage.removeItem(STORAGE); setPending(null);
      setMessage('Marcador guardado. El fixture público lo mostrará en su siguiente consulta.');
      setLoading(true);
      await load();
    } catch (err) { setError(err instanceof Error && !['AbortError','TimeoutError','SyntaxError'].includes(err.name) ? err.message : 'No se pudo confirmar el guardado. Reintenta la misma operación.'); }
    finally { sending.current = false; setBusy(false); }
  }
  return <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 space-y-4">
    <h2 className="text-xl font-bold">Marcadores por partido</h2>
    <p className="text-sm text-slate-500">Registra el resultado de ambas Houses. Los puntos del medallero se registran en el formulario de puntajes.</p>
    {message && <p role="status" className="text-green-800 bg-green-50 p-3 rounded-lg">{message}</p>}
    {error && <p role="alert" className="text-red-800 bg-red-50 p-3 rounded-lg">{error}</p>}
    {pending && <div className="bg-amber-50 text-amber-900 rounded-lg p-3 space-y-2"><p>Hay un guardado sin confirmar: {pending.a} – {pending.b} · {STATUS_NAMES[pending.estado]}. Reintenta para recuperar su confirmación.</p>
      <button type="button" disabled={busy || loading} onClick={() => void save()} className="underline font-semibold">{busy ? 'Confirmando…' : 'Reintentar el mismo guardado'}</button></div>}
    <button type="button" disabled={loading || busy} onClick={() => { setLoading(true); setError(''); void load(); }} className="text-blue-700 underline disabled:opacity-50">{loading ? 'Leyendo partidos…' : 'Recargar partidos'}</button>
    <form onSubmit={e => {e.preventDefault(); void save();}} className="space-y-4">
      <fieldset disabled={busy || loading || !!pending} className="space-y-4 disabled:opacity-60">
        <label className="block text-sm font-medium">Encuentro
          <select required value={selected} onChange={e => choose(matches.find(p => p.encuentroId === e.target.value))} className="block w-full border rounded-xl p-3 mt-1">
            <option value="">Selecciona un partido</option>{matches.map(p => <option key={p.encuentroId} value={p.encuentroId}>{p.fecha} · {p.hora} · {p.deporte} · {p.categoria} · {p.enfrentamiento}</option>)}
          </select>
        </label>
        {!loading && !matches.length && !error && <p className="text-sm text-slate-500">No hay encuentros con dos Houses definidas y datos completos.</p>}
        {current && <><div className="grid grid-cols-2 gap-4">
          <label className="text-sm font-medium">{HOUSE_NAMES[current.houses[0]]}<input aria-label="Marcador House A" type="number" min="0" max="999" step="1" required value={a} onChange={e=>setA(e.target.value)} className="block w-full border rounded-xl p-3 mt-1"/></label>
          <label className="text-sm font-medium">{HOUSE_NAMES[current.houses[1]]}<input aria-label="Marcador House B" type="number" min="0" max="999" step="1" required value={b} onChange={e=>setB(e.target.value)} className="block w-full border rounded-xl p-3 mt-1"/></label>
        </div><label className="block text-sm font-medium">Estado<select value={status} onChange={e=>setStatus(e.target.value as Marcador['estado'])} className="block w-full border rounded-xl p-3 mt-1">{Object.entries(STATUS_NAMES).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        {status === 'pendiente' && <p className="text-sm text-slate-500">Un encuentro pendiente debe tener ambos marcadores en cero.</p>}
        <label className="block text-sm font-medium">Motivo del registro o corrección<input required minLength={3} maxLength={300} value={reason} onChange={e=>setReason(e.target.value)} className="block w-full border rounded-xl p-3 mt-1"/></label>
        <button type="submit" disabled={status === 'pendiente' && (Number(a)!==0 || Number(b)!==0)} className="rounded-xl bg-blue-600 text-white px-5 py-3 disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar marcador'}</button></>}
      </fieldset>
    </form>
    <p className="text-xs text-slate-500">Si faltan equipos, complétalos en el fixture oficial. Después pulsa «Recargar partidos».</p>
  </section>;
}
