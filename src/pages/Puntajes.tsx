import { Trophy, Flame, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HOUSES } from '../features/arbitraje/hooks/useArbitraje';

export default function Puntajes() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const SCRIPT_URL_LECTURA = 'https://script.google.com/macros/s/AKfycbyVCfzMa_iJEEHn8Hs1KBUBtkk6DfhT58UK77a2QdscxIiH8EbnU8_4NcaYG5Dz4ttjsA/exec';

  useEffect(() => {
    let datosUltimos: any[] = [];

    const obtenerPuntajes = async () => {
      try {
        const url = `${SCRIPT_URL_LECTURA}?page=api_puntos`;
        const respuesta = await fetch(url);
        const textoJSONP = await respuesta.text(); 
        
        const jsonLimpio = textoJSONP.replace(/^procesarPodio\(/, '').replace(/\);?$/, '');
        const datosBackend = JSON.parse(jsonLimpio);

        const dataTransformada = [
          { houseId: 'horses', points: datosBackend.orange || 0 },
          { houseId: 'dolphins', points: datosBackend.blue || 0 },
          { houseId: 'eagles', points: datosBackend.green || 0 },
          { houseId: 'seagulls', points: datosBackend.white || 0 }
        ];

        dataTransformada.sort((a, b) => b.points - a.points);
        datosUltimos = dataTransformada;

        actualizarVista(datosUltimos);
      } catch (error) {
        console.error("Error al cargar los puntajes:", error);
        if (rankings.length === 0) {
          datosUltimos = HOUSES.map(h => ({ houseId: h.id, points: 0 }));
          actualizarVista(datosUltimos);
        }
      } finally {
        setCargando(false);
      }
    };

    const actualizarVista = (data: any[]) => {
      const conteoPuntajes: Record<number, number> = {};
      data.forEach(item => {
        conteoPuntajes[item.points] = (conteoPuntajes[item.points] || 0) + 1;
      });

      const rankingsMapeados = data.map((item, index) => {
        const estaEmpatado = conteoPuntajes[item.points] > 1;
        
        return {
          id: item.houseId,
          house: HOUSES.find(h => h.id === item.houseId),
          points: item.points,
          rank: index + 1,
          trend: 'En vivo',
          statusText: estaEmpatado ? '⚡ ¡EMPATA EN PUNTOS!' : (index === 0 ? 'Líderes Indiscutibles' : 'En competencia'),
          isTied: estaEmpatado
        };
      });

      setRankings(rankingsMapeados);
    };

    obtenerPuntajes();
    
    // 1. Sincronización con la base de datos cada 4 segundos
    const intervaloDatos = setInterval(obtenerPuntajes, 4000);

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
    };
  }, []);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Sincronizando con la base de datos...</p>
      </div>
    );
  }

  const maxPoints = rankings[0]?.points || 1;

  return (
    <div className="relative overflow-hidden p-4 md:p-8 flex flex-col items-center min-h-full w-full max-w-4xl mx-auto">
      
      {/* Cabecera */}
      <div className="text-center mb-12 mt-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
          Tabla de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Puntajes</span>
        </h1>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-bold text-green-700">Actualizado en tiempo real</span>
        </div>
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
                 <img src={team.house?.img} alt={team.house?.name} className="w-full h-full object-contain drop-shadow-xl" />
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
                    <div className="flex items-center gap-1 text-green-500 mt-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{team.trend} hoy</span>
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