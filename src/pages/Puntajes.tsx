import { useContenido } from '../features/contenido/useContenido';
import { Trophy, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HOUSES, type House } from '../features/arbitraje/hooks/useArbitraje';
import MascotaHouse from '../components/MascotaHouse';
import { Medalla } from '../components/HouseDistintivo';
import { inclinacion } from '../components/inclinacion';
import { COLORES_HOUSE, HOUSES as HOUSES_BASE } from '../../shared/olimpiadas';

// Colores de cada House para la barra, el anillo de la mascota y el brillo del líder. Nombres completos para que Tailwind los conserve.
const COLOR_HOUSE: Record<string, { barra: string; anillo: string; brillo: string; fondo: string }> = {
  blue: { barra: 'from-sky-400 to-blue-600', anillo: 'ring-blue-500', brillo: 'bg-sky-300', fondo: 'bg-blue-50' },
  white: { barra: 'from-slate-300 to-slate-400', anillo: 'ring-slate-300', brillo: 'bg-white', fondo: 'bg-slate-100' },
  green: { barra: 'from-lime-400 to-green-600', anillo: 'ring-green-500', brillo: 'bg-lime-300', fondo: 'bg-green-50' },
  orange: { barra: 'from-amber-400 to-orange-500', anillo: 'ring-orange-500', brillo: 'bg-amber-300', fondo: 'bg-orange-50' },
};
const etiqueta = (color?: string) => HOUSES_BASE.find(h => h.color === color)?.etiqueta ?? '';
// Los nombres llegan en mayúsculas («DOLPHINS»); en este estilo se muestran como «Dolphins».
const nombre = (n?: string) => n ? n.charAt(0) + n.slice(1).toLowerCase() : '';

// Orden inicial antes de ordenar por puntos; decide cómo se muestran los empates.
const ORDEN_EMPATE = ['horses', 'dolphins', 'eagles', 'seagulls'];

interface PuntajeHouse { houseId: string; points: number }
interface Ranking {
  id: string; house: House | undefined; points: number; rank: number;
  statusText: string; isTied: boolean;
}

// La página consulta cada 15 s y el servidor renueva su copia cada 10 s; más de 90 s indica que no se está actualizando.
const ANTIGUEDAD_MAXIMA_MS = 90000;

function hace(ms: number, fecha: number) {
  const segundos = Math.max(0, Math.round(ms / 1000));
  if (segundos < 60) return `hace ${segundos} s`;
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;
  return 'del ' + new Date(fecha).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Muestra cuándo se leyeron los puntajes de Google. Tiene su propio reloj para no redibujar la tabla cada segundo.
// `renovando`: el servidor entregó su última copia mientras pide la lectura nueva (p. ej. tras horas sin visitas).
function EstadoActualizacion({ actualizado, renovando }: { actualizado: number | null; renovando: boolean }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(reloj);
  }, []);
  if (actualizado === null) {
    return <p role="status" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-sm font-bold text-amber-800">
      No se pudieron cargar los puntajes. Reintentando…
    </p>;
  }
  const antiguedad = ahora - actualizado;
  if (antiguedad > ANTIGUEDAD_MAXIMA_MS && renovando) {
    return <p role="status" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-sm font-bold text-indigo-700">
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      Actualizando puntajes… (última lectura {hace(antiguedad, actualizado)})
    </p>;
  }
  if (antiguedad > ANTIGUEDAD_MAXIMA_MS) {
    return <p role="status" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-sm font-bold text-amber-800">
      Puntajes {hace(antiguedad, actualizado)} · No se pudo actualizar; reintentando…
    </p>;
  }
  return <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 text-sm font-bold text-green-700">
    <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true"></span>
    Actualizado {hace(antiguedad, actualizado)}
  </p>;
}

export default function Puntajes() {
  const { mascotas, cargado } = useContenido();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [cargando, setCargando] = useState(true);
  // Momento en que el servidor leyó los puntajes de Google (null si nunca se cargaron).
  const [actualizado, setActualizado] = useState<number | null>(null);
  const [renovando, setRenovando] = useState(false);

  useEffect(() => {
    let datosUltimos: PuntajeHouse[] = [];
    let consultando = false;
    let reintento: ReturnType<typeof setTimeout> | undefined;

    const obtenerPuntajes = async () => {
      if (consultando || document.hidden) return;
      consultando = true;
      try {
        // El servidor comparte una sola lectura de Google entre todos los visitantes.
        const respuesta = await fetch('/api/puntajes', { cache: 'no-store' });
        if (!respuesta.ok) throw new Error('Puntajes no disponibles');
        const datosBackend: Record<string, unknown> = await respuesta.json();
        if (!COLORES_HOUSE.every(h => Number.isSafeInteger(datosBackend[h]))) throw new Error('Respuesta inválida');

        const dataTransformada = ORDEN_EMPATE.map(animal => {
          const house = HOUSES.find(h => h.id === animal)!;
          return { houseId: house.id, points: datosBackend[house.color] as number };
        });

        dataTransformada.sort((a, b) => b.points - a.points);
        datosUltimos = dataTransformada;

        actualizarVista(datosUltimos);
        const leido = typeof datosBackend.actualizado === 'string' ? Date.parse(datosBackend.actualizado) : NaN;
        setActualizado(Number.isNaN(leido) ? Date.now() : leido);
        // A copy served while the server renews it: ask again shortly instead of waiting a full cycle.
        const desactualizado = datosBackend.desactualizado === true;
        setRenovando(desactualizado);
        clearTimeout(reintento);
        if (desactualizado) reintento = setTimeout(obtenerPuntajes, 4000);
      } catch (error) {
        console.error("Error al cargar los puntajes:", error);
        setRenovando(false);
        // Solo muestra ceros si nunca hubo datos; un fallo puntual conserva los últimos puntajes.
        if (datosUltimos.length === 0) {
          datosUltimos = HOUSES.map(h => ({ houseId: h.id, points: 0 }));
          actualizarVista(datosUltimos);
        }
      } finally {
        consultando = false;
        setCargando(false);
      }
    };

    const actualizarVista = (data: PuntajeHouse[]) => {
      const conteoPuntajes: Record<number, number> = {};
      data.forEach(item => {
        conteoPuntajes[item.points] = (conteoPuntajes[item.points] || 0) + 1;
      });

      const rankingsMapeados = data.map((item, index): Ranking => {
        const estaEmpatado = conteoPuntajes[item.points] > 1;
        
        return {
          id: item.houseId,
          house: HOUSES.find(h => h.id === item.houseId),
          points: item.points,
          rank: index + 1,
          statusText: estaEmpatado ? '⚡ ¡EMPATA EN PUNTOS!' : (index === 0 ? 'Líderes Indiscutibles' : 'En competencia'),
          isTied: estaEmpatado
        };
      });

      setRankings(rankingsMapeados);
    };

    obtenerPuntajes();
    
    // 1. Sincronización cada 15 segundos, solo con la pestaña visible
    const intervaloDatos = setInterval(obtenerPuntajes, 15000);
    document.addEventListener('visibilitychange', obtenerPuntajes);

    // 2. ROTACIÓN AUTOMÁTICA: Si todos tienen los mismos puntos, rotamos la lista cada 4 segundos
    const intervaloRotacion = setInterval(() => {
      if (datosUltimos.length > 0) {
        const todosTienenMismoPuntaje = datosUltimos.every(item => item.points === datosUltimos[0].points);
        if (todosTienenMismoPuntaje) {
          const rotado = [...datosUltimos.slice(1), datosUltimos[0]];
          datosUltimos = rotado;
          actualizarVista(rotado);
        }
      }
    }, 4000);

    return () => {
      clearInterval(intervaloDatos);
      clearInterval(intervaloRotacion);
      clearTimeout(reintento);
      document.removeEventListener('visibilitychange', obtenerPuntajes);
    };
  }, []);

  if (cargando) {
    return (
      <div translate="no" className="notranslate flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Cargando puntajes…</p>
      </div>
    );
  }

  const lider = rankings[0], segundo = rankings[1];
  const maxPoints = lider?.points || 1;
  // Empate en el primer lugar: el marcador grande no muestra a un solo líder.
  const empateArriba = !!lider && !!segundo && lider.points === segundo.points;
  const colorLider = COLOR_HOUSE[lider?.house?.color ?? ''];

  return (
    <div translate="no" className="notranslate mx-auto w-full max-w-5xl space-y-6">

      {/* Cabecera */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            <Trophy className="h-7 w-7 text-amber-500 sm:h-8 sm:w-8" aria-hidden="true" />Puntaje oficial
          </h1>
          <p className="mt-1 text-sm text-slate-500">Suma de todas las actividades y deportes. Se actualiza sola cada 15 segundos.</p>
        </div>
        <EstadoActualizacion actualizado={actualizado} renovando={renovando} />
      </div>

      {/* Marcador del líder */}
      {lider && <section {...inclinacion} className="vidrio relative overflow-hidden rounded-[2rem] p-5 text-slate-900 transition-transform duration-200 sm:p-8">
        {colorLider && <span aria-hidden="true" className={`pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-50 blur-3xl ${colorLider.brillo}`} />}
        {empateArriba ? <div className="relative py-4 text-center">
          <p className="text-sm font-bold text-amber-600">Empate en el primer lugar</p>
          <p className="mt-3 text-6xl font-extrabold tabular-nums sm:text-8xl"><span className="texto-3d">{lider.points}</span><span className="ml-2 text-xl text-slate-400 sm:text-2xl">pts</span></p>
          <p className="mt-2 text-lg font-bold text-slate-700">{rankings.filter(r => r.points === lider.points).map(r => nombre(r.house?.name)).join(' · ')}</p>
        </div>
        : <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:gap-8 sm:text-left">
          <div className={`esfera relative h-32 w-32 shrink-0 rounded-full bg-white p-1 ring-4 sm:h-44 sm:w-44 ${colorLider?.anillo ?? 'ring-white'}`}>
            <MascotaHouse house={lider.house} mascotas={mascotas} cargado={cargado} className="h-full w-full rounded-full object-contain" />
            <Trophy aria-hidden="true" className="esfera absolute -right-1 -top-1 h-10 w-10 rounded-full bg-gradient-to-b from-amber-200 to-amber-500 p-2 text-amber-950" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 sm:justify-start"><Medalla puesto={1} className="h-5 w-5 text-[10px]" />Primer lugar</p>
            <h2 className="mt-1 text-5xl font-extrabold leading-none tracking-tight text-slate-900 sm:text-7xl">{nombre(lider.house?.name)}</h2>
            <p className="mt-2 inline-block rounded-full bg-white/80 px-3 py-0.5 text-sm font-semibold text-slate-600 ring-1 ring-white">{etiqueta(lider.house?.color)}</p>
          </div>
          <div className="sm:text-right">
            <p className="texto-3d text-6xl font-extrabold tabular-nums leading-none sm:text-8xl">{lider.points}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">puntos</p>
            {segundo && <p className="mt-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-600">+{lider.points - segundo.points} sobre {nombre(segundo.house?.name)}</p>}
          </div>
        </div>}
      </section>}

      {/* Tabla de posiciones */}
      <section className="space-y-3">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Tabla de posiciones</h2>
        <ol className="space-y-3">
          <AnimatePresence>
            {rankings.map(team => {
              const color = COLOR_HOUSE[team.house?.color ?? ''];
              const diferencia = (lider?.points ?? 0) - team.points;
              return <motion.li key={team.id} layout transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                className={`grid grid-cols-[2rem_3.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border bg-white/75 p-3 shadow-[0_14px_30px_-20px_rgb(51_65_85/0.5)] backdrop-blur-xl sm:grid-cols-[3rem_4.5rem_minmax(0,1fr)_auto] sm:gap-5 sm:p-4 ${
                  team.isTied ? 'border-amber-300 ring-4 ring-amber-400/20' : team.rank === 1 ? 'border-indigo-200' : 'border-white'}`}>
                <span className="flex justify-center"><Medalla puesto={team.rank} className="h-8 w-8 text-sm sm:h-10 sm:w-10 sm:text-base" /></span>
                <div className={`esfera h-14 w-14 rounded-full bg-white p-0.5 ring-4 sm:h-[4.5rem] sm:w-[4.5rem] ${color?.anillo ?? 'ring-slate-200'}`}>
                  <MascotaHouse house={team.house} mascotas={mascotas} cargado={cargado} className="h-full w-full rounded-full object-contain" />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h3 className="text-lg font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl">{nombre(team.house?.name)}</h3>
                    <span className="text-xs font-semibold text-slate-500">{etiqueta(team.house?.color)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200/60 shadow-inner">
                    <div className={`h-full rounded-full bg-gradient-to-r shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] transition-all duration-1000 ease-out ${color?.barra ?? 'from-indigo-500 to-blue-500'}`}
                      style={{ width: `${Math.max(2, (team.points / maxPoints) * 100)}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold tabular-nums leading-none text-slate-900 sm:text-4xl">{team.points}<span className="ml-1 text-xs font-bold text-slate-400 sm:text-sm">pts</span></p>
                  <p className={`mt-1 text-xs font-extrabold ${team.isTied ? 'text-amber-600' : diferencia === 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {team.isTied ? 'Empate' : diferencia === 0 ? 'Líder' : `−${diferencia}`}
                  </p>
                </div>
              </motion.li>;
            })}
          </AnimatePresence>
        </ol>
      </section>
    </div>
  );
}
