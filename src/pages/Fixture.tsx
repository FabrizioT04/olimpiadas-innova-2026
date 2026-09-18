import { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, Filter, Loader2, RefreshCw, Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface Partido {
  id: number;
  semana: number | string;
  fecha: string;
  dia: string;
  hora: string;
  deporte: string;
  enfrentamiento: string;
  categoria: string;
  arbitro: string;
  apoyo: string;
  lugar: string;
  estado: 'proximo' | 'en-vivo' | 'finalizado';
}

const PARTIDOS_OFICIALES: Partido[] = [
  // --- SEMANA 1 (14/09 al 18/09) ---
  { id: 1, semana: 1, fecha: '2026-09-14', dia: 'Lunes 14/09/2026', hora: '09:35 - 09:55 am', deporte: 'CONEBALL / BÁSQUET', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Melissa Gurrionero, Gloria Huaman, Nicol Aguilar, Dayanara Quirica', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 2, semana: 1, fecha: '2026-09-14', dia: 'Lunes 14/09/2026', hora: '09:55 - 10:15 am', deporte: 'BÁSQUET', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Junior (5º y 6º)', arbitro: 'DAVID', apoyo: 'Dayanara Quirica, Jorge Romero, Karla Armas', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 3, semana: 1, fecha: '2026-09-14', dia: 'Lunes 14/09/2026', hora: '10:55 - 11:15 am', deporte: 'BÁSQUET', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Juvenil A (7º y 8º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'Jimena Esteban, David Sajami, Karol Caballero, Diana Liviapoma', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 4, semana: 1, fecha: '2026-09-14', dia: 'Lunes 14/09/2026', hora: '11:15 - 11:35 am', deporte: 'CONEBALL', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Promesas (1º y 2º)', arbitro: 'MARIO NUÑEZ / DAVID', apoyo: 'Tutores y Cotutores, Volates', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 5, semana: 1, fecha: '2026-09-14', dia: 'Lunes 14/09/2026', hora: '12:55 - 13:15 pm', deporte: 'BÁSQUET', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Juvenil B (9º, 10º y 11º)', arbitro: 'ENRIQUE ALCAZAR 9C', apoyo: 'Saira Ramirez, Mario Nuñez, Karol Caballero, Diana Liviapoma', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 6, semana: 1, fecha: '2026-09-15', dia: 'Martes 15/09/2026', hora: '09:35 - 09:55 am', deporte: 'CONEBALL', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Melissa Gurrionero, Liz Natividad, Valeria Valverde, David Sajami', lugar: 'Campo 1', estado: 'proximo' },
  { id: 7, semana: 1, fecha: '2026-09-15', dia: 'Martes 15/09/2026', hora: '09:55 - 10:15 am', deporte: 'BÁSQUET', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Junior (5º y 6º)', arbitro: 'DAVID', apoyo: 'Gloria Huaman, Pamela Coronado, Karl Sopla, Mariaelena Castillo', lugar: 'Campo 1', estado: 'proximo' },
  { id: 8, semana: 1, fecha: '2026-09-15', dia: 'Martes 15/09/2026', hora: '10:55 - 11:15 am', deporte: 'BÁSQUET', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Juvenil A (7º y 8º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'Mario Nuñez, Karol Caballero, David Sajami', lugar: 'Campo 1', estado: 'proximo' },
  { id: 9, semana: 1, fecha: '2026-09-16', dia: 'Miércoles 16/09/2026', hora: '09:35 - 09:55 am', deporte: 'BALONMANO', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Infantil (3º y 4º)', arbitro: 'MARIO NUÑEZ', apoyo: 'Mayra Alarcon, Karla Armas, Jorge Romero, Valeria Valverde', lugar: 'Campo 1', estado: 'proximo' },
  { id: 10, semana: 1, fecha: '2026-09-16', dia: 'Miércoles 16/09/2026', hora: '09:55 - 10:15 am', deporte: 'BALONMANO', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Junior (5º y 6º)', arbitro: 'MARIO NUÑEZ', apoyo: 'David Sajami, Leakey Gambini, Dayanara Quirica', lugar: 'Campo 1', estado: 'proximo' },
  { id: 11, semana: 1, fecha: '2026-09-17', dia: 'Jueves 17/09/2026', hora: '09:35 - 09:55 am', deporte: 'BALONMANO', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Liz Natividad, David Sajami, Karla Armas, Valeria Valverde', lugar: 'Campo 1', estado: 'proximo' },
  { id: 12, semana: 1, fecha: '2026-09-18', dia: 'Viernes 18/09/2026', hora: '09:35 - 09:55 am', deporte: 'VÓLEY', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Infantil (3º y 4º)', arbitro: 'MARIO NUÑEZ', apoyo: 'Leakey Gambini, Karl Sopla, Marisol Reynaga, Valeria Valverde', lugar: 'Campo 1', estado: 'proximo' },

  // --- SEMANA 2 (21/09 al 28/09) ---
  { id: 13, semana: 2, fecha: '2026-09-21', dia: 'Lunes 21/09/2026', hora: '09:35 - 09:55 am', deporte: 'VÓLEY Y PASABOLA', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Melissa Gurrionero, Gloria Huaman, Nicol Aguilar, Leakey Gambini', lugar: 'Campo 1', estado: 'proximo' },
  { id: 14, semana: 2, fecha: '2026-09-22', dia: 'Martes 22/09/2026', hora: '09:35 - 09:55 am', deporte: 'FUTSAL', enfrentamiento: 'VERDE VS AZUL', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Melissa Gurrionero, Liz Natividad, Valeria Valverde', lugar: 'Campo 1', estado: 'proximo' },
  { id: 15, semana: 2, fecha: '2026-09-23', dia: 'Miércoles 23/09/2026', hora: '09:35 - 09:55 am', deporte: 'FUTSAL', enfrentamiento: 'BLANCO VS ANARANJADO', categoria: 'Infantil (3º y 4º)', arbitro: 'MARIO NUÑEZ', apoyo: 'Mayra Alarcon, Karla Armas, Jorge Romero', lugar: 'Campo 1', estado: 'proximo' },
  { id: 16, semana: 2, fecha: '2026-09-24', dia: 'Jueves 24/09/2026', hora: '09:35 - 09:55 am', deporte: 'CONEBALL - BÁSQUET', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Liz Natividad, Karla Armas, Valeria Valverde', lugar: 'Campo 1', estado: 'en-vivo' },
  { id: 17, semana: 2, fecha: '2026-09-28', dia: 'Lunes 28/09/2026', hora: '09:35 - 09:55 am', deporte: '3ER Y 4TO PUESTO BALONMANO', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Melissa Gurrionero, Gloria Huaman, Nicol Aguilar', lugar: 'Campo 1', estado: 'proximo' }
];

export default function Fixture() {
  const [partidos, setPartidos] = useState<Partido[]>(PARTIDOS_OFICIALES);
  const [cargando, setCargando] = useState<boolean>(false);
  const [filtroSemana, setFiltroSemana] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'proximo' | 'en-vivo' | 'finalizado'>('todos');
  
  // Estado para controlar qué días están desplegados (cerrados por defecto)
  const [diasExpandidos, setDiasExpandidos] = useState<Record<string, boolean>>({});

  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw6v_-hQor-DMh7Mg2qtodwpuIiXIuCOqqtV3mY3Gs5ueqZBrDH8LORqa7RTMWhIH1uqw/exec';

  const sincronizarDatos = async () => {
    setCargando(true);
    try {
      const respuesta = await fetch(WEB_APP_URL);
      const json = await respuesta.json();
      if (json.partidos && json.partidos.length > 0) {
        const mapeados = json.partidos.map((item: any, index: number) => ({
          id: item.id || index + 1,
          semana: item.semana || 1,
          fecha: item.fecha || '',
          dia: item.dia || item.fecha || 'Día Programado',
          hora: item.hora || 'Por definir',
          deporte: item.deporte || 'Deporte',
          enfrentamiento: item.enfrentamiento || 'Equipo A VS Equipo B',
          categoria: item.categoria || 'General',
          arbitro: item.arbitro || 'Por asignar',
          apoyo: item.apoyo || '',
          lugar: 'Campo Principal',
          estado: (index === 0 ? 'en-vivo' : index % 2 === 0 ? 'proximo' : 'finalizado') as 'proximo' | 'en-vivo' | 'finalizado'
        }));
        setPartidos(mapeados);
      }
    } catch (error) {
      console.log('Usando datos oficiales de respaldo.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    sincronizarDatos();
  }, []);

  const semanasDisponibles = Array.from(new Set(partidos.map(p => String(p.semana)))).sort((a, b) => Number(a) - Number(b));

  const partidosFiltrados = partidos.filter(p => {
    const cumpleSemana = filtroSemana === 'todos' || String(p.semana) === filtroSemana;
    const cumpleEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    return cumpleSemana && cumpleEstado;
  });

  const partidosAgrupados = partidosFiltrados.reduce((acc: { [semana: string]: { [dia: string]: Partido[] } }, partido) => {
    const semKey = `Semana ${partido.semana}`;
    const diaKey = String(partido.dia || 'Día Programado');

    if (!acc[semKey]) acc[semKey] = {};
    if (!acc[semKey][diaKey]) acc[semKey][diaKey] = [];
    acc[semKey][diaKey].push(partido);

    return acc;
  }, {});

  // Función para abrir y cerrar el acordeón de cada día
  const toggleDia = (diaTitulo: string) => {
    setDiasExpandidos(prev => ({
      ...prev,
      [diaTitulo]: !prev[diaTitulo]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Calendario Oficial por Semanas y Días
          </h1>
          <p className="text-slate-500 text-sm">Cronograma completo sincronizado con asignación exacta de árbitros.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={sincronizarDatos}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 flex-1">
          <Layers size={16} className="text-slate-400 ml-2 shrink-0" />
          <span className="text-xs font-bold text-slate-600 shrink-0">Semanas:</span>
          <button
            onClick={() => setFiltroSemana('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filtroSemana === 'todos' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas
          </button>
          {semanasDisponibles.map(sem => (
            <button
              key={sem}
              onClick={() => setFiltroSemana(sem)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filtroSemana === sem ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semana {sem}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-3 overflow-x-auto">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroEstado === 'todos' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroEstado('en-vivo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroEstado === 'en-vivo' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            En Vivo
          </button>
          <button
            onClick={() => setFiltroEstado('proximo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroEstado === 'proximo' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Próximos
          </button>
          <button
            onClick={() => setFiltroEstado('finalizado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroEstado === 'finalizado' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Finalizados
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
          <p className="text-slate-500 font-medium text-sm">Cargando cronograma por semanas y días...</p>
        </div>
      ) : Object.keys(partidosAgrupados).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-400 font-medium">No se encontraron encuentros con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(partidosAgrupados).map(([semanaTitulo, diasMap]) => (
            <div key={semanaTitulo} className="space-y-6">
              {/* Encabezado de la Semana */}
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-600 text-white font-extrabold px-4 py-1.5 rounded-xl text-base shadow-sm">
                  {semanaTitulo}
                </div>
                <div className="h-px flex-1 bg-blue-100"></div>
              </div>

              {/* Días dentro de la Semana (Acordeón) */}
              <div className="space-y-4 pl-1 md:pl-2">
                {Object.entries(diasMap).map(([diaTitulo, listaPartidos]) => {
                  const estaExpandido = diasExpandidos[diaTitulo] ?? false; // Cerrado por defecto
                  
                  return (
                    <div key={diaTitulo} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      
                      {/* Botón para desplegar el día */}
                      <button 
                        onClick={() => toggleDia(diaTitulo)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-50/50 transition-colors cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors shadow-inner ${estaExpandido ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                            <Calendar size={20} strokeWidth={2.5} />
                          </div>
                          <div className="text-left">
                            <h3 className="text-[16px] font-black text-slate-800 tracking-tight">{diaTitulo}</h3>
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              {listaPartidos.length} {listaPartidos.length === 1 ? 'partido' : 'partidos'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-slate-400 bg-slate-50 p-2 rounded-lg transition-transform duration-200">
                          {estaExpandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </button>

                      {/* Contenedor de Partidos (Se muestra solo si está expandido) */}
                      {estaExpandido && (
                        <div className="p-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {listaPartidos.map((partido) => {
                              const equipos = partido.enfrentamiento.includes('VS')
                                ? partido.enfrentamiento.split('VS')
                                : [partido.enfrentamiento, ''];

                              return (
                                <div key={partido.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                                  <div className={`absolute top-0 left-0 bottom-0 w-2 ${
                                    partido.estado === 'en-vivo' ? 'bg-red-500 animate-pulse' :
                                    partido.estado === 'proximo' ? 'bg-amber-400' : 'bg-slate-400'
                                  }`} />

                                  <div className="flex justify-between items-center mb-3 pl-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                                      {partido.deporte}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                      <Trophy size={14} className="text-yellow-500" />
                                      {partido.categoria}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between my-4 pl-2">
                                    <div className="flex-1 text-right font-bold text-slate-800 text-base">
                                      {equipos[0]?.trim() || 'Local'}
                                    </div>
                                    <div className="px-3 text-center">
                                      <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-md">
                                        vs
                                      </span>
                                    </div>
                                    <div className="flex-1 text-left font-bold text-slate-800 text-base">
                                      {equipos[1]?.trim() || 'Visita'}
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 pt-3 border-t border-slate-100 pl-2 text-xs text-slate-500">
                                    <div className="flex items-center justify-between">
                                      <span className="flex items-center gap-1">
                                        <Clock size={14} className="text-slate-400" />
                                        {partido.hora}
                                      </span>
                                      <span className="font-medium text-indigo-600 font-bold">Árbitro: {partido.arbitro}</span>
                                    </div>
                                    {partido.apoyo && (
                                      <div className="text-slate-400 text-[11px] truncate flex justify-between items-center">
                                        <span>{partido.apoyo}</span>
                                        <span className="font-semibold text-slate-400">{partido.lugar}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}