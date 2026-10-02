import { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, UserCheck, LogOut, Trophy, Medal, Images, ListOrdered, CheckCircle2, Plus, Minus } from 'lucide-react';
import { HOUSES, useArbitraje } from '../features/arbitraje/hooks/useArbitraje';
import PanelMarcadores from '../features/marcadores/PanelMarcadores';
import PanelClasificacion from '../features/clasificacion/PanelClasificacion';
import { hayClasificacionPendiente } from '../features/clasificacion/model';

import AdminContenido from '../features/contenido/AdminContenido';
import { useContenido } from '../features/contenido/useContenido';
import MascotaHouse from '../components/MascotaHouse';
// Anillo del color de cada House en la tarjeta elegida. Nombres completos para que Tailwind los conserve.
const ANILLO: Record<string, string> = { blue: 'ring-blue-500', white: 'ring-slate-300', green: 'ring-green-500', orange: 'ring-orange-500' };

export default function PanelArbitro() {
  const { mascotas, cargado } = useContenido();
  // An unconfirmed ranking reopens its own view, since pending saves lock switching views.
  const [registro, setRegistro] = useState<'marcadores' | 'clasificacion' | 'puntajes' | 'contenido'>(() => hayClasificacionPendiente() ? 'clasificacion' : 'marcadores');
  const [correoAutorizado, setCorreoAutorizado] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [resultLocked,setResultLocked] = useState(false);
  const [rankingLocked,setRankingLocked] = useState(false);
  // Mounted on first visit (or with a pending ranking) and then kept, like the other forms.
  const [clasificacionAbierta,setClasificacionAbierta] = useState(hayClasificacionPendiente);
  useEffect(() => {
    localStorage.removeItem('arbitro_autorizado');
    const controller = new AbortController();
    fetch('/arbitraje/api/session', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('No se pudo verificar tu sesión. Vuelve a ingresar o contacta al administrador.');
        const data = await response.json();
        if (typeof data.email !== 'string') throw new Error('Respuesta de sesión inválida.');
        setCorreoAutorizado(data.email);
      }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, []);
  const handleLogout = () => { window.location.href = '/cdn-cgi/access/logout'; };

  const {
    selectedHouse, setSelectedHouse,
    operation, setOperation,
    points, setPoints,
    motivo, setMotivo,
    isSubmitting,
    aviso,
    enviarPuntaje
  } = useArbitraje();

  if (!correoAutorizado) {
    return <div className="vidrio mx-auto max-w-lg space-y-3 rounded-3xl p-8 text-center">
      <ShieldCheck className="mx-auto h-10 w-10 text-indigo-500" aria-hidden="true" />
      <h1 className="text-xl font-extrabold tracking-tight">Panel de arbitraje</h1>
      <p role="status" className="flex items-center justify-center gap-2 text-slate-600">
        {!error && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{error || 'Verificando tu sesión…'}
      </p>
      {error && <a className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-[0_8px_18px_-8px_rgb(79_70_229/0.7)]" href="/arbitraje">Volver a ingresar</a>}
    </div>;
  }

  const listo = !!selectedHouse && !!operation;
  // The confirm button says what will be saved, e.g. «Restar 50 puntos a Horses».
  const resumen = !selectedHouse ? 'Elige una House' : !operation ? 'Elige sumar o restar'
    : `${operation === 'sumar' ? 'Sumar' : 'Restar'} ${points || '…'} puntos a ${selectedHouse.name.charAt(0)}${selectedHouse.name.slice(1).toLowerCase()}`;

  return (
    <div className="panel-arbitro mx-auto w-full max-w-5xl space-y-6 text-slate-800">

      {/* Cabecera y sesión autorizada */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            <ShieldCheck className="h-7 w-7 text-indigo-500 sm:h-8 sm:w-8" aria-hidden="true" />Panel de arbitraje
          </h1>
          <p className="mt-1 text-sm text-slate-500">Resultados de partidos y puntos de las Houses en un solo lugar.</p>
        </div>
        <div className="vidrio flex min-w-0 items-center gap-3 rounded-2xl py-2 pl-2 pr-2">
          <span aria-hidden="true" className="esfera flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-indigo-400 to-indigo-600 text-sm font-bold uppercase text-white">{correoAutorizado.charAt(0)}</span>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><UserCheck size={12} aria-hidden="true" />Sesión activa</p>
            <p className="max-w-[13rem] truncate text-sm font-semibold text-slate-800">{correoAutorizado}</p>
          </div>
          <button onClick={handleLogout}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50">
            <LogOut size={14} aria-hidden="true" />Cerrar sesión
          </button>
        </div>
      </header>

      {/* Tipo de registro */}
      <div className="vidrio grid grid-cols-1 gap-2 rounded-3xl p-2 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Tipo de registro">
        {([
          { id: 'marcadores', title: 'Resultado del partido', description: 'Marcador y puntos en una operación', Icon: Trophy },
          { id: 'clasificacion', title: 'Clasificación por puestos', description: 'Del 1.º al 4.º con todas las Houses', Icon: ListOrdered },
          { id: 'puntajes', title: 'Penalidades y bonos', description: 'Restar o sumar puntos a toda una House', Icon: Medal },
          { id: 'contenido', title: 'Fotos y mascotas', description: 'Subir, revisar y publicar imágenes', Icon: Images },
        ] as const).map(({ id, title, description, Icon }) => (
          <button key={id} type="button" aria-pressed={registro === id} aria-controls={`panel-${id}`}
            disabled={resultLocked || rankingLocked || isSubmitting} onClick={() => { setRegistro(id); if (id === 'clasificacion') setClasificacionAbierta(true); }}
            className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 ${
              registro === id ? 'bg-indigo-600 text-white shadow-[0_10px_22px_-10px_rgb(79_70_229/0.8)]' : 'text-slate-600 hover:bg-white/80 active:scale-[0.98]'}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${registro === id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0"><span className="block text-sm font-bold">{title}</span><span className={`mt-0.5 block text-xs ${registro === id ? 'text-indigo-100' : 'text-slate-500'}`}>{description}</span></span>
          </button>
        ))}
      </div>

      {/* Keep both forms mounted so switching views preserves unfinished entries and retries. */}
      {registro === 'contenido' && <div id="panel-contenido"><AdminContenido /></div>}
      <div id="panel-marcadores" hidden={registro !== 'marcadores'}>
        <PanelMarcadores onLockedChange={setResultLocked} />
      </div>
      {clasificacionAbierta && <div id="panel-clasificacion" hidden={registro !== 'clasificacion'}>
        <PanelClasificacion onLockedChange={setRankingLocked} />
      </div>}
      <section id="panel-puntajes" hidden={registro !== 'puntajes'} aria-labelledby="titulo-puntajes" className="space-y-5">
        <div className="px-1">
          <h2 id="titulo-puntajes" className="text-xl font-extrabold tracking-tight">Penalidades y bonos</h2>
          <p className="mt-1 text-sm text-slate-500">Resta o suma puntos al total de una House, sin categoría ni actividad, fuera de partidos y clasificaciones. Los puntos de un partido se guardan en «Resultado del partido» y los de actividades con las cuatro Houses en «Clasificación por puestos».</p>
        </div>

        <form onSubmit={enviarPuntaje} className="space-y-5">
          {/* Paso 1: House */}
          <fieldset className="space-y-3">
            <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700"><Paso n={1} />Elige la House</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {HOUSES.map(house => {
                const elegida = selectedHouse?.id === house.id;
                return <button key={house.id} type="button" aria-pressed={elegida} onClick={() => setSelectedHouse(house)}
                  className={`group relative flex flex-col items-center gap-2 rounded-3xl p-4 transition-all duration-300 ${
                    elegida ? `bg-white shadow-[0_16px_30px_-16px_rgb(51_65_85/0.6)] ring-4 ${ANILLO[house.color]}` : 'vidrio hover:-translate-y-1 active:scale-[0.98]'}`}>
                  {elegida && <CheckCircle2 aria-hidden="true" className="absolute right-3 top-3 h-6 w-6 text-indigo-600" />}
                  <MascotaHouse house={house} mascotas={mascotas} cargado={cargado}
                    className={`esfera h-20 w-20 object-contain transition-transform duration-500 sm:h-24 sm:w-24 ${elegida ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className={`text-sm font-extrabold ${elegida ? 'text-indigo-600' : 'text-slate-600'}`}>{house.name.charAt(0)}{house.name.slice(1).toLowerCase()}</span>
                </button>;
              })}
            </div>
          </fieldset>

          <div className="vidrio space-y-5 rounded-[2rem] p-5 sm:p-8">
            {/* Paso 2: operación */}
            <fieldset>
              <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700"><Paso n={2} />Operación</legend>
              <div className="grid grid-cols-2 gap-3">
                {([['sumar', 'Sumar puntos', 'Bono', Plus, 'bg-emerald-500 text-white shadow-[0_10px_22px_-10px_rgb(16_185_129/0.8)]'],
                   ['restar', 'Restar puntos', 'Penalidad', Minus, 'bg-red-500 text-white shadow-[0_10px_22px_-10px_rgb(239_68_68/0.8)]']] as const).map(([valor, titulo, detalle, Icono, activo]) =>
                  <button key={valor} type="button" aria-pressed={operation === valor} onClick={() => setOperation(valor)}
                    className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-all active:scale-[0.98] ${operation === valor ? activo : 'bg-white/80 text-slate-600 ring-1 ring-slate-200 hover:bg-white'}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${operation === valor ? 'bg-white/25' : valor === 'sumar' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}><Icono size={18} aria-hidden="true" /></span>
                    <span><span className="block text-sm font-bold">{titulo}</span><span className={`block text-xs ${operation === valor ? 'text-white/80' : 'text-slate-500'}`}>{detalle}</span></span>
                  </button>)}
              </div>
            </fieldset>

            {/* Paso 3: detalle */}
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-700"><Paso n={3} />Detalle del registro</p>
              <label className="block text-sm font-semibold text-slate-600" htmlFor="puntos">Puntos
                <input type="number" placeholder="Ej.: 100" className="mt-1.5 block w-full px-4 py-3 text-lg font-bold tabular-nums"
                  id="puntos" name="puntos" value={points} onChange={(e) => setPoints(e.target.value)} />
              </label>
              <label htmlFor="motivo" className="block text-sm font-semibold text-slate-600">Motivo del registro o corrección
                <textarea id="motivo" required minLength={3} maxLength={300} value={motivo}
                  onChange={e => setMotivo(e.target.value)} className="mt-1.5 block w-full p-3"
                  placeholder="Ej.: conducta antideportiva o bono por orden y limpieza" />
              </label>
            </div>

            {aviso && (aviso.tipo === 'exito'
              ? <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-emerald-800 ring-1 ring-emerald-100"><CheckCircle2 size={18} aria-hidden="true" />{aviso.texto}</p>
              : <p role="alert" className="rounded-2xl bg-red-50 p-3 text-red-800 ring-1 ring-red-100">{aviso.texto}</p>)}

            {/* Confirmar operación */}
            <button type="submit" disabled={isSubmitting || !selectedHouse}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-bold transition-all duration-300 ${
                isSubmitting || !selectedHouse ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                : operation === 'restar' ? 'bg-red-500 text-white shadow-[0_12px_24px_-12px_rgb(239_68_68/0.8)] hover:-translate-y-0.5 hover:bg-red-600 active:scale-[0.99]'
                : operation === 'sumar' ? 'bg-emerald-500 text-white shadow-[0_12px_24px_-12px_rgb(16_185_129/0.8)] hover:-translate-y-0.5 hover:bg-emerald-600 active:scale-[0.99]'
                : 'bg-indigo-600 text-white shadow-[0_12px_24px_-12px_rgb(79_70_229/0.8)] hover:-translate-y-0.5 hover:bg-indigo-500 active:scale-[0.99]'}`}>
              {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Guardando…' : listo ? resumen : `Confirmar · ${resumen}`}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// Number of a step in the penalties form.
function Paso({ n }: { n: number }) {
  return <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{n}</span>;
}
