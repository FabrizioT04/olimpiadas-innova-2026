import { useEffect, useRef, useState } from 'react';
import { Calendar, Check, MapPin, RefreshCw, Trophy, Users } from 'lucide-react';
import { STATUS_NAMES, housesDeEnfrentamiento, isMarcador, paraTodasLasHouses } from '../features/marcadores/model';
import { useContenido } from '../features/contenido/useContenido';
import { HouseChip, MarcadorDeportivo, PodioCompacto } from '../components/HouseDistintivo';
import type { Marcador } from '../features/marcadores/model';
import { ACTIVIDADES, CATEGORIAS, COLORES_HOUSE, FIXTURE_FUENTE as SHEET_ID } from '../../shared/olimpiadas';
import { GRUPOS_VELOCIDAD, LUGARES, clasificacionesPorActividad, isClasificacion, podiosDeportivos } from '../features/clasificacion/model';
import type { Clasificacion } from '../features/clasificacion/model';
import { estadosDelDia, fechaInicial, hoyLocal, minutosAhora, ordenarFechas, rangoHora } from '../features/fixture/fechas';
import type { EstadoHorario } from '../features/fixture/fechas';

interface Partido {
  id: string; encuentroId?: string; fecha: string; hora: string; deporte: string; enfrentamiento: string;
  categoria: string; arbitro: string; lugar: string; fase: string; bloque: string;
  seccion: string; origen: string; fila: number; avisos: string[];
  marcador?: Marcador | null;
}
interface FixtureData {
  desactualizado?: boolean;
  version: number; fuente: string; actualizado: string; partidos: Partido[];
  avisos: string[]; clasificaciones?: Clasificacion[];
}
const WEB_APP_URL = '/api/fixture';
const SNAPSHOT_KEY = 'fixture-publico-v1';
// Short label of a date button, e.g. «lun, 14 sept».
const etiquetaDia = (date: string) => date ? new Date(`${date}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Por definir';
const displayDate = (date: string) => date ? new Date(`${date}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha por definir';
const categoryWithGrades = (category: string) => {
  const grades: Record<string, string> = Object.fromEntries(CATEGORIAS.map(c => [c.id, c.grados + ' grado']));
  const key = category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '');
  return grades[key] ? `${category} · ${grades[key]}` : category;
};

function isFixture(value: unknown): value is FixtureData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<FixtureData>;
  const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === 'string');
  return data.version === 1 && data.fuente === SHEET_ID && typeof data.actualizado === 'string'
    && !Number.isNaN(Date.parse(data.actualizado)) && strings(data.avisos)
    && Array.isArray(data.partidos) && data.partidos.every(p => p && typeof p === 'object'
      && ['id','fecha','hora','deporte','enfrentamiento','categoria','arbitro','lugar','fase','bloque','seccion','origen'].every(k => typeof (p as unknown as Record<string,unknown>)[k] === 'string')
      && (p.fecha === '' || /^\d{4}-\d{2}-\d{2}$/.test(p.fecha)) && strings(p.avisos))
    // Older snapshots have no rankings. Invalid entries are skipped when shown, so one bad ranking
    // never hides the whole programme.
    && (data.clasificaciones === undefined || Array.isArray(data.clasificaciones));
}
// Most recent rankings first: during the event the latest podium is the one people look for.
const ordenClasificacion = (a: Clasificacion, b: Clasificacion) => b.actualizado.localeCompare(a.actualizado);

// «BLANCO VS VERDE» as the two House badges, «todas las house» as the four House colours; any other
// text («Por definir») as is.
function Enfrentamiento({ texto, mascotas, cargado }: { texto: string; mascotas: Record<string, string>; cargado: boolean }) {
  const houses = housesDeEnfrentamiento(texto);
  if (!houses && paraTodasLasHouses({ enfrentamiento: texto })) return <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
    <span aria-hidden="true" className="flex -space-x-1">{['bg-white ring-slate-300', 'bg-blue-600 ring-white', 'bg-orange-500 ring-white', 'bg-green-600 ring-white'].map(c => <span key={c} className={`h-4 w-4 rounded-full ring-2 ${c}`} />)}</span>
    Todas las Houses
  </p>;
  if (!houses) return <p className="text-sm font-medium text-slate-700">{texto}</p>;
  return <p className="flex flex-wrap items-center gap-2" aria-label={texto}>
    <HouseChip color={houses[0]} mascotas={mascotas} cargado={cargado} />
    <span aria-hidden="true" className="text-xs font-black italic text-slate-400">VS</span>
    <HouseChip color={houses[1]} mascotas={mascotas} cargado={cargado} />
  </p>;
}

// Title of a ranking in a card: the category (and group) when the activity is split, otherwise «Resultado».
const tituloPodio = (r: { categoria: string; grupo: string }) => r.categoria
  ? `${CATEGORIAS.find(c => c.id === r.categoria)?.nombre || r.categoria}${r.grupo ? ` · ${GRUPOS_VELOCIDAD.grupos.find(g => g.id === r.grupo)?.nombre || r.grupo}` : ''}`
  : 'Resultado';

// Each sport keeps the same accent colour in every card, so the day reads at a glance.
// Full class names so Tailwind keeps them.
const ACENTOS = ['bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-400', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-lime-500'];
const acentoDe = (deporte: string) => ACENTOS[[...deporte.trim().toUpperCase()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % ACENTOS.length];
const hhmm = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
const PUNTO: Record<EstadoHorario | 'ninguno', string> = {
  pasada: 'bg-slate-300 text-white ring-slate-100', 'en-curso': 'bg-red-500 ring-red-200 animate-pulse', sigue: 'bg-blue-600 ring-blue-200',
  pendiente: 'bg-white ring-slate-200 border-2 border-slate-300', ninguno: 'bg-white ring-slate-200 border-2 border-slate-300',
};

function lastFixture(): FixtureData | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null');
    return isFixture(value) ? value : null;
  } catch { return null; }
}

export default function Fixture() {
  const { mascotas, cargado } = useContenido();
  const [data, setData] = useState<FixtureData | null>(lastFixture);
  const [stale, setStale] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // null until the visitor picks a date: then the page opens on today (or the next date with activities).
  const [filter, setFilter] = useState<string | null>(null);
  const fechasRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'programacion' | 'puestos'>('programacion');
  const refresh = useRef<() => void>(() => {});
  // Today's activities in progress and next follow the clock, not only each read of the programme.
  const [ahora, setAhora] = useState(minutosAhora);
  useEffect(() => { const reloj = window.setInterval(() => setAhora(minutosAhora()), 30000); return () => window.clearInterval(reloj); }, []);

  useEffect(() => {
    let disposed = false;
    let active: AbortController | null = null;
    async function synchronize(freshRequested = false) {
      if (active) return;
      const controller = new AbortController();
      active = controller;
      setLoading(true);
      let expired = false;
      const timeout = window.setTimeout(() => {
        expired = true;
        controller.abort();
        if (!disposed) {
          active = null;
          setLoading(false);
          setStale(true);
          setError('La consulta tardó demasiado. Intenta actualizar de nuevo.');
        }
      }, 30000);
      try {
        const response = await fetch(freshRequested ? `${WEB_APP_URL}?actualizar=1` : WEB_APP_URL, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('No se pudo conectar con el fixture oficial.');
        const result: unknown = await response.json();
        if (!isFixture(result)) throw new Error('El servicio del fixture todavía no devuelve las pestañas oficiales. Revisa su publicación.');
        if (!disposed && !expired) {
          setData(result); setError(''); setStale(result.desactualizado === true);
          try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(result)); } catch { /* Storage may be unavailable. */ }
        }
      } catch (err) {
        if (!disposed && !expired) { setStale(true); setError(err instanceof SyntaxError ? 'El servicio no devolvió la programación. Intenta actualizar de nuevo.'
          : err instanceof TypeError ? 'No se pudo conectar con el fixture. Revisa tu conexión e intenta actualizar.'
          : err instanceof Error && err.name !== 'AbortError' ? err.message : 'La consulta tardó demasiado. Intenta actualizar de nuevo.'); }
      } finally {
        window.clearTimeout(timeout);
        if (active === controller) active = null;
        if (!disposed && !expired) setLoading(false);
      }
    }
    refresh.current = () => { void synchronize(true); };
    void synchronize();
    const interval = window.setInterval(() => { if (!document.hidden) void synchronize(); }, 30000);
    const onVisible = () => { if (!document.hidden) void synchronize(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { disposed = true; active?.abort(); window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  const days = ordenarFechas((data?.partidos || []).map(p => p.fecha));
  const hoy = hoyLocal();
  const selected = filter === null ? fechaInicial(days, hoy) : days.includes(filter) ? filter : 'todos';
  const hayDatos = !!data;
  // On phones the chosen date may be off screen: scroll the row of dates (not the page) to show it.
  useEffect(() => {
    const barra = fechasRef.current, boton = barra?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!barra || !boton) return;
    barra.scrollLeft += boton.getBoundingClientRect().left - barra.getBoundingClientRect().left - barra.clientWidth / 2 + boton.offsetWidth / 2;
  }, [selected, view, hayDatos]);
  const matches = (data?.partidos || []).filter(p => selected === 'todos' || p.fecha === selected);
  const groups = Array.from(new Set(matches.map(p => p.fecha)));
  // Sport podiums come from the registered results of each final and 3rd-place match.
  const clasificaciones = (data?.clasificaciones || []).filter(isClasificacion);
  // Rankings registered for each activity, shown in its card instead of «Equipos por definir».
  const porActividad = clasificacionesPorActividad(data?.partidos || [], clasificaciones);
  const podios = podiosDeportivos((data?.partidos || []).map(p => ({ ...p, marcador: isMarcador(p.marcador) ? p.marcador : null })));

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Calendar className="text-blue-600"/><span><span translate="no" className="notranslate">Fixture</span> oficial</span></h1>
        <p className="text-sm text-slate-500">Programación de las hojas oficiales. Se consulta cada 30 segundos mientras esta página está abierta.</p></div>
      <button onClick={() => refresh.current()} disabled={loading} className="flex items-center gap-2 rounded-xl bg-indigo-50 text-indigo-700 px-4 py-2 disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>{loading ? 'Consultando…' : 'Actualizar'}</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">{error}{data && <p className="mt-1 font-semibold">Se conserva la última consulta; puede haber cambios todavía no reflejados.</p>}</div>}
    {data && stale && !error && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Mostrando la última programación disponible. Se está intentando actualizar; los resultados pueden haber cambiado. Revisa la fecha de última lectura.</p>}
    {data && <p className="text-xs text-slate-500">Última lectura: {new Date(data.actualizado).toLocaleString('es-PE')} · <a className="underline" href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`} target="_blank" rel="noreferrer">Ver hojas oficiales</a></p>}
    {data?.avisos.map(message => <p key={message} className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{message}</p>)}
    <div className="flex flex-wrap gap-3 items-center rounded-2xl bg-white border border-slate-200 p-3">
      <button onClick={() => setView('programacion')} aria-pressed={view === 'programacion'} className={`rounded-lg px-4 py-2 ${view === 'programacion' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Programación</button>
      <button onClick={() => setView('puestos')} aria-pressed={view === 'puestos'} className={`rounded-lg px-4 py-2 ${view === 'puestos' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Resultados</button>
    </div>
    {data && view === 'programacion' && <div ref={fechasRef} role="group" aria-label="Fecha" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
      {['todos', ...days].map(day => <button key={day || 'sin-fecha'} onClick={() => setFilter(day)} aria-pressed={selected === day}
        className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${selected === day ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
        <span className="inline-block first-letter:uppercase">{day === 'todos' ? 'Todas' : etiquetaDia(day)}</span>
        {day === hoy && <span className="ml-1.5 rounded bg-amber-400 px-1 text-[10px] font-black uppercase text-slate-900">Hoy</span>}
      </button>)}
    </div>}
    {!data && <p className="py-12 text-center text-slate-500">{loading ? 'Leyendo la programación oficial…' : 'La programación no está disponible en este momento.'}</p>}
    {data && view === 'programacion' && <>
      <p className="text-xs text-slate-500">Los horarios son los publicados en Sheets. Los marcadores y estados aparecen cuando los registra un árbitro.</p>
      {!matches.length && <p className="py-8 text-center text-slate-500">No hay actividades publicadas para esta selección.</p>}
      {groups.map(date => {
        const delDia = matches.filter(p => p.fecha === date);
        const estados = date === hoy ? estadosDelDia(delDia.map(p => p.hora), ahora) : delDia.map(() => null);
        return <section key={date} className="space-y-4">
          <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {date === hoy && <span className="rounded-md bg-amber-400 px-2 py-0.5 text-xs font-black uppercase italic tracking-wider text-slate-900">Hoy</span>}
            <span className="text-xl font-black uppercase italic tracking-tight text-slate-900">{displayDate(date)}</span>
            <span className="text-sm font-semibold text-slate-400">{delDia.length} {delDia.length === 1 ? 'actividad' : 'actividades'}</span>
          </h2>
          <ol className="max-w-4xl">{delDia.map((p, i) => {
            const rango = rangoHora(p.hora), estado = estados[i];
            const resultado = isMarcador(p.marcador) || (!!p.encuentroId && porActividad.has(p.encuentroId));
            return <li key={p.id} className="grid grid-cols-[3rem_1.25rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[4.5rem_1.5rem_minmax(0,1fr)] sm:gap-x-3">
              <div className={`pt-3 text-right tabular-nums sm:pt-4 ${estado === 'pasada' ? 'text-slate-400' : 'text-slate-900'}`}>
                {rango ? <><p className="text-sm font-black italic sm:text-lg">{hhmm(rango.inicio)}</p>
                  {rango.fin > rango.inicio && <p className="text-[11px] font-semibold text-slate-400 sm:text-xs">{hhmm(rango.fin)}</p>}</>
                  : <p className="text-[11px] font-semibold text-slate-400">{p.hora || 'Por definir'}</p>}
              </div>
              {/* Timeline: a line through every activity of the day, with a dot that shows its state. */}
              <div aria-hidden="true" className="relative flex justify-center">
                <span className={`absolute w-0.5 bg-slate-200 ${i === 0 ? 'top-5' : 'top-0'} ${i === delDia.length - 1 ? 'h-5' : 'bottom-0'}`} />
                <span className={`relative mt-4 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 sm:mt-5 ${PUNTO[estado || 'ninguno']}`}>
                  {estado === 'pasada' && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                </span>
              </div>
              <article title={`${p.origen} · fila ${p.fila}`} className={`relative mb-3 space-y-2.5 overflow-hidden rounded-2xl border bg-white p-3 pl-4 sm:p-4 sm:pl-5 ${
                estado === 'en-curso' ? 'border-red-300 shadow-lg shadow-red-500/10 ring-2 ring-red-500/20' : estado === 'sigue' ? 'border-blue-200' : 'border-slate-200'} ${
                estado === 'pasada' && !resultado ? 'opacity-70' : ''}`}>
                <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${acentoDe(p.deporte)}`} />
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <h3 className="text-[15px] font-black uppercase italic leading-tight tracking-wide text-slate-900 sm:text-base">{p.deporte}</h3>
                  {p.lugar && <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500"><MapPin aria-hidden="true" className="h-3.5 w-3.5" />Lugar {p.lugar}</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {estado === 'en-curso' && <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />En curso</span>}
                  {estado === 'sigue' && <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">A continuación</span>}
                  {p.categoria && <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{categoryWithGrades(p.categoria)}</span>}
                  {p.fase && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">{p.fase}</span>}
                </div>
                {/* With a registered result the scoreboard already shows both Houses. */}
                {isMarcador(p.marcador) ? <MarcadorDeportivo marcador={p.marcador} mascotas={mascotas} cargado={cargado} />
                  : p.encuentroId && porActividad.has(p.encuentroId) ? <div className="space-y-2">
                    {porActividad.get(p.encuentroId)!.map(r => <PodioCompacto key={`${r.categoria}:${r.grupo}`} titulo={tituloPodio(r)} clasificacion={r.clasificacion} mascotas={mascotas} cargado={cargado} />)}
                  </div>
                  : <Enfrentamiento texto={p.enfrentamiento} mascotas={mascotas} cargado={cargado} />}
                {(p.arbitro || p.bloque) && <p className="flex items-start gap-1.5 text-xs text-slate-500"><Users aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />{[p.arbitro, p.bloque && `Bloque: ${p.bloque}`].filter(Boolean).join(' · ')}</p>}
                {p.avisos.map(a => <p key={a} className="rounded bg-amber-50 p-2 text-sm text-amber-800">{a}</p>)}
              </article>
            </li>;
          })}</ol>
        </section>;
      })}
    </>}
    {data && view === 'puestos' && <div className="space-y-8"><section className="space-y-4">
        <h2 className="font-bold text-lg text-slate-800">Actividades con todas las Houses</h2>
        <p className="text-sm text-slate-500">Carreras, gymkana, retos académicos y concursos, registrados por los árbitros.</p>
        {!clasificaciones.length && <p className="py-6 text-center text-slate-500">Todavía no hay puestos registrados.</p>}
        <div className="grid md:grid-cols-2 gap-4">{[...clasificaciones].sort(ordenClasificacion).map(c => <article key={`${c.fila}:${c.detalle}:${c.actualizado}`} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="font-bold flex items-center gap-2"><Trophy size={18} className="text-amber-500"/>{ACTIVIDADES.find(a => a.fila === c.fila)?.etiqueta}</h3>
          {c.detalle && <p className="text-sm text-slate-600">{c.detalle}</p>}
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">{[...COLORES_HOUSE].sort((a,b) => c.puestos[a] - c.puestos[b]).map(h => <li key={h} className="rounded bg-slate-50 p-2 flex items-center justify-between gap-2"><span className="flex items-center gap-2"><span className="font-black italic text-slate-500">{LUGARES[c.puestos[h]-1]}</span><HouseChip color={h} mascotas={mascotas} cargado={cargado} /></span>{Number.isSafeInteger(c.puntos?.[h]) && <span className="font-semibold text-slate-800 whitespace-nowrap">{c.puntos?.[h]} pts</span>}</li>)}</ol>
          <p className="text-xs text-slate-400">Registrada: {new Date(c.actualizado).toLocaleString('es-PE')}</p>
        </article>)}</div>
      </section>
      {!!podios.length && <section className="space-y-4">
        <h2 className="font-bold text-lg text-slate-800">Deportes</h2>
        <p className="text-sm text-slate-500">El ganador del partido por el 1.º y 2.º puesto queda 1.º y el perdedor 2.º; lo mismo con el partido por el 3.º y 4.º. Se completa con los resultados registrados.</p>
        <div className="grid md:grid-cols-2 gap-4">{podios.map(p => <article key={p.clave} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="font-bold flex items-center gap-2"><Trophy size={18} className="text-amber-500"/>{p.deporte} · {CATEGORIAS.find(c => c.id === p.categoria)?.nombre}</h3>
          {([['1.º y 2.º', p.final], ['3.º y 4.º', p.tercero]] as const).map(([titulo, m]) => m && <p key={titulo} className="text-xs text-slate-500">{titulo} ({m.fecha.slice(8,10)}/{m.fecha.slice(5,7)}): {m.enfrentamiento}{m.marcador ? ` · ${m.marcador.a} – ${m.marcador.b} · ${STATUS_NAMES[m.marcador.estado as keyof typeof STATUS_NAMES] || ''}` : ''}</p>)}
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">{p.lugares.map(l => <li key={l.puesto} className="rounded bg-slate-50 p-2 flex items-center justify-between gap-2"><span className="flex items-center gap-2"><span className="font-black italic text-slate-500">{LUGARES[l.puesto-1]}</span>{l.house ? <HouseChip color={l.house} mascotas={mascotas} cargado={cargado} /> : <span className="text-slate-500">Por definir</span>}</span>{l.puntos !== undefined && <span className="font-semibold text-slate-800 whitespace-nowrap">{l.puntos} pts</span>}</li>)}</ol>
        </article>)}</div>
      </section>}
    </div>}
  </div>;
}
