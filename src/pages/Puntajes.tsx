import { useContenido } from '../features/contenido/useContenido';
import { Trophy, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HOUSES, type House } from '../features/arbitraje/hooks/useArbitraje';
import MascotaHouse from '../components/MascotaHouse';
import { COLORES_HOUSE } from '../../shared/olimpiadas';

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

  const maxPoints = rankings[0]?.points || 1;

  return (
    <div translate="no" className="notranslate relative overflow-hidden p-4 md:p-8 flex flex-col items-center min-h-full w-full max-w-4xl mx-auto">
      
      {/* Cabecera */}
      <div className="text-center mb-12 mt-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
          Tabla de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Puntajes</span>
        </h1>
        <EstadoActualizacion actualizado={actualizado} renovando={renovando} />
      </div>

      <div className="w-full space-y-5">
        <AnimatePresence>
          {rankings.map((team) => (
            <motion.div 
              key={team.id}
              layout
              transition={{ type: "spring", stiffness: 250, damping: 25 }}
              className={`relative group flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-5 sm:p-6 rounded-[2rem] bg-white border
                ${team.isTied 
                  ? 'border-amber-400 ring-4 ring-amber-400/20 animate-pulse bg-gradient-to-r from-amber-50/40 via-white to-white' 
                  : team.rank === 1 
                    ? 'border-yellow-300 shadow-[0_8px_30px_rgba(250,204,21,0.15)] scale-[1.02] z-10' 
                    : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
                }
              `}
            >
              {/* Número de Ranking */}
              <div className="flex-shrink-0 w-16 sm:w-20 flex justify-center items-center">
                <span className={`text-5xl sm:text-6xl font-black tracking-tighter
                  ${team.isTied ? 'text-amber-500' : team.rank === 1 ? 'text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 drop-shadow-sm' 
                  : team.rank === 2 ? 'text-transparent bg-clip-text bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500'
                  : team.rank === 3 ? 'text-transparent bg-clip-text bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800'
                  : 'text-slate-200'}
                `}>
                  {team.rank}
                </span>
              </div>

              {/* Escudo con tamaño bien grande (w-40 h-40 en móvil / w-44 h-44 en PC) */}
              <div className="flex-shrink-0 w-40 h-40 sm:w-44 sm:h-44 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1">
                 <MascotaHouse house={team.house} mascotas={mascotas} cargado={cargado} className="w-full h-full object-contain drop-shadow-xl" />
              </div>

              {/* Detalles */}
              <div className="flex-1 w-full mt-2 sm:mt-0">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-3">
                  <div>
                    <h3 className={`text-2xl font-black tracking-tight uppercase ${team.isTied ? 'text-amber-700' : team.rank === 1 ? 'text-yellow-600' : 'text-slate-800'}`}>
                      {team.house?.name}
                    </h3>
                    
                    {team.isTied ? (
                      <p className="flex items-center gap-1 text-xs font-extrabold text-amber-600 uppercase tracking-widest mt-1">
                        <span>⚡</span> ¡Empate en puntos!
                      </p>
                    ) : team.rank === 1 ? (
                      <p className="flex items-center gap-1 text-xs font-bold text-yellow-500 uppercase tracking-widest mt-1">
                        <Trophy className="w-3.5 h-3.5" /> Líderes Indiscutibles
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        En competencia
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between mt-3 sm:mt-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-800 tracking-tighter">{team.points}</span>
                      <span className="text-sm font-bold text-slate-400">pts</span>
                    </div>
                  </div>
                </div>

                {/* Barra Visual */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out relative
                      ${team.isTied ? 'bg-gradient-to-r from-amber-400 to-orange-500' : team.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}
                    `}
                    style={{ width: `${(team.points / maxPoints) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                  </div>
                </div>
              </div>

            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}