import { useEffect, useRef, useState } from 'react';
import { Calendar, Clock, RefreshCw, Trophy } from 'lucide-react';

interface Partido {
  id: string; fecha: string; hora: string; deporte: string; enfrentamiento: string;
  categoria: string; arbitro: string; lugar: string; fase: string; bloque: string;
  seccion: string; origen: string; fila: number; avisos: string[];
}
interface Finalista {
  id: string; deporte: string; categoria: string; terceroCuarto: string;
  primeroSegundo: string; puestos: string[]; origen: string; fila: number;
}
interface FixtureData {
  version: number; fuente: string; actualizado: string; partidos: Partido[];
  finalistas: Finalista[]; avisos: string[];
}
const SHEET_ID = '14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg';
const WEB_APP_URL = import.meta.env.VITE_FIXTURE_URL || 'https://script.google.com/macros/s/AKfycbw6v_-hQor-DMh7Mg2qtodwpuIiXIuCOqqtV3mY3Gs5ueqZBrDH8LORqa7RTMWhIH1uqw/exec';
const displayDate = (date: string) => date ? new Date(`${date}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha por definir';
const matchup = (text: string) => text.trim() === 'VS' ? 'Por definir' : text;

function isFixture(value: unknown): value is FixtureData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<FixtureData>;
  const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === 'string');
  return data.version === 1 && data.fuente === SHEET_ID && typeof data.actualizado === 'string'
    && !Number.isNaN(Date.parse(data.actualizado)) && strings(data.avisos)
    && Array.isArray(data.partidos) && data.partidos.every(p => p && typeof p === 'object'
      && ['id','fecha','hora','deporte','enfrentamiento','categoria','arbitro','lugar','fase','bloque','seccion','origen'].every(k => typeof (p as unknown as Record<string,unknown>)[k] === 'string')
      && (p.fecha === '' || /^\d{4}-\d{2}-\d{2}$/.test(p.fecha)) && strings(p.avisos))
    && Array.isArray(data.finalistas) && data.finalistas.every(p => p && typeof p === 'object'
      && ['id','deporte','categoria','terceroCuarto','primeroSegundo','origen'].every(k => typeof (p as unknown as Record<string,unknown>)[k] === 'string')
      && strings(p.puestos) && p.puestos.length === 4);
}

export default function Fixture() {
  const [data, setData] = useState<FixtureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todos');
  const [view, setView] = useState<'programacion' | 'finalistas'>('programacion');
  const refresh = useRef<() => void>(() => {});

  useEffect(() => {
    let disposed = false;
    let active: AbortController | null = null;
    async function synchronize() {
      if (active) return;
      const controller = new AbortController();
      active = controller;
      setLoading(true);
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(WEB_APP_URL, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('No se pudo conectar con el fixture oficial.');
        const result: unknown = await response.json();
        if (!isFixture(result)) throw new Error('El servicio del fixture todavía no devuelve las pestañas oficiales. Revisa su publicación.');
        if (!disposed) { setData(result); setError(''); }
      } catch (err) {
        if (!disposed) setError(err instanceof SyntaxError ? 'El servicio no devolvió la programación. Revisa que el script esté publicado y permita su lectura.'
          : err instanceof TypeError ? 'No se pudo conectar con el fixture. Revisa tu conexión e intenta actualizar.'
          : err instanceof Error && err.name !== 'AbortError' ? err.message : 'La consulta tardó demasiado. Intenta actualizar de nuevo.');
      } finally {
        window.clearTimeout(timeout);
        active = null;
        if (!disposed) setLoading(false);
      }
    }
    refresh.current = () => { void synchronize(); };
    void synchronize();
    const interval = window.setInterval(() => { if (!document.hidden) void synchronize(); }, 30000);
    const onVisible = () => { if (!document.hidden) void synchronize(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { disposed = true; active?.abort(); window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  const days = Array.from(new Set((data?.partidos || []).map(p => p.fecha)));
  const selected = days.includes(filter) ? filter : 'todos';
  const matches = (data?.partidos || []).filter(p => selected === 'todos' || p.fecha === selected);
  const groups = Array.from(new Set(matches.map(p => p.fecha)));

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="text-blue-600"/>Fixture oficial</h1>
        <p className="text-sm text-slate-500">Programación de las hojas oficiales. Se consulta cada 30 segundos mientras esta página está abierta.</p></div>
      <button onClick={() => refresh.current()} disabled={loading} className="flex items-center gap-2 rounded-xl bg-indigo-50 text-indigo-700 px-4 py-2 disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>{loading ? 'Consultando…' : 'Actualizar'}</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">{error}{data && <p className="mt-1 font-semibold">Se conserva la última consulta; puede haber cambios todavía no reflejados.</p>}</div>}
    {data && <p className="text-xs text-slate-500">Última lectura: {new Date(data.actualizado).toLocaleString('es-PE')} · <a className="underline" href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} target="_blank" rel="noreferrer">Ver hojas oficiales</a></p>}
    {data?.avisos.map(message => <p key={message} className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{message}</p>)}
    <div className="flex flex-wrap gap-3 items-center rounded-2xl bg-white border border-slate-200 p-3">
      <button onClick={() => setView('programacion')} aria-pressed={view === 'programacion'} className={`rounded-lg px-4 py-2 ${view === 'programacion' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Programación</button>
      <button onClick={() => setView('finalistas')} aria-pressed={view === 'finalistas'} className={`rounded-lg px-4 py-2 ${view === 'finalistas' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Finalistas y puestos</button>
      {view === 'programacion' && <label className="flex gap-2 items-center text-sm text-slate-600">Fecha
        <select value={selected} onChange={e => setFilter(e.target.value)} className="border rounded-lg p-2 max-w-full"><option value="todos">Todas</option>{days.map(day => <option key={day} value={day}>{displayDate(day)}</option>)}</select>
      </label>}
    </div>
    {!data && <p className="py-12 text-center text-slate-500">{loading ? 'Leyendo la programación oficial…' : 'La programación no está disponible en este momento.'}</p>}
    {data && view === 'programacion' && <>
      <p className="text-xs text-slate-500">Los horarios son los publicados en Sheets. Esta programación no confirma que un partido haya comenzado o terminado.</p>
      {!matches.length && <p className="py-8 text-center text-slate-500">No hay actividades publicadas para esta selección.</p>}
      {groups.map(date => <section key={date} className="space-y-3"><h2 className="font-bold text-lg text-slate-800 capitalize">{displayDate(date)}</h2>
        <div className="grid md:grid-cols-2 gap-4">{matches.filter(p => p.fecha === date).map(p => <article key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex justify-between gap-3"><span className="flex gap-2 text-blue-700 font-semibold"><Clock size={18}/>{p.hora}</span><span className="text-sm text-slate-500">Lugar: {p.lugar}</span></div>
          <h3 className="font-bold text-slate-800">{p.deporte}</h3><p className="font-medium text-slate-700">{p.enfrentamiento}</p>
          <p className="text-sm text-slate-500">{p.categoria}{p.fase ? ` · ${p.fase}` : ''}</p>
          {p.bloque && <p className="text-xs text-slate-500">Bloque: {p.bloque}</p>}
          {p.arbitro && <p className="text-sm text-slate-600">Responsables: {p.arbitro}</p>}
          {p.avisos.map(a => <p key={a} className="text-sm text-amber-800 bg-amber-50 rounded p-2">{a}</p>)}
          <p className="text-xs text-slate-400">{p.origen} · fila {p.fila}</p>
        </article>)}</div>
      </section>)}
    </>}
    {data && view === 'finalistas' && <div className="space-y-4">
      <p className="text-sm text-slate-500">Cruces y puestos registrados en la pestaña Finalistas.</p>
      {!data.finalistas.length && <p>No hay finalistas publicados.</p>}
      <div className="grid md:grid-cols-2 gap-4">{data.finalistas.map(p => <article key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><Trophy size={18} className="text-amber-500"/>{p.deporte}</h2><p className="text-sm text-slate-600">{p.categoria}</p>
        <p className="text-sm">1.º y 2.º: {matchup(p.primeroSegundo)}</p><p className="text-sm">3.º y 4.º: {matchup(p.terceroCuarto)}</p>
        <ol className="grid grid-cols-2 gap-2 text-sm">{p.puestos.map((team,i) => <li key={i} className="rounded bg-slate-50 p-2">{i+1}.º: {team || 'Por definir'}</li>)}</ol>
      </article>)}</div>
    </div>}
  </div>;
}
