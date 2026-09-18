import { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, Filter, Loader2, RefreshCw, Layers } from 'lucide-react';

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
  // Semana 1
  {
    id: 1,
    semana: 1,
    fecha: '2026-09-21',
    dia: 'Lunes 21/09',
    hora: '08:00 - 08:20',
    deporte: 'FUTSAL',
    enfrentamiento: 'ROJO VS AMARILLO',
    categoria: 'Promesas (1º y 2º)',
    arbitro: 'Larry Delao',
    apoyo: 'Mesa Oficial',
    lugar: 'Campo 1',
    estado: 'finalizado'
  },
  {
    id: 2,
    semana: 1,
    fecha: '2026-09-22',
    dia: 'Martes 22/09',
    hora: '08:20 - 08:40',
    deporte: 'VÓLEY',
    enfrentamiento: 'AZUL VS VERDE',
    categoria: 'Junior (5º y 6º)',
    arbitro: 'David',
    apoyo: 'Apoyo Mesa',
    lugar: 'Coliseo',
    estado: 'proximo'
  },
  // Semana 2
  {
    id: 3,
    semana: 2,
    fecha: '2026-09-24',
    dia: 'Jueves 24/09',
    hora: '09:35 - 09:55',
    deporte: 'CONEBALL',
    enfrentamiento: 'BLANCO VS VERDE',
    categoria: 'Infantil (3º y 4º)',
    arbitro: 'DAVID',
    apoyo: 'L. Natividad, K. Armas',
    lugar: 'Campo 1',
    estado: 'en-vivo'
  },
  // Semana 3
  {
    id: 4,
    semana: 3,
    fecha: '2026-09-28',
    dia: 'Lunes 28/09',
    hora: '09:35 - 09:55',
    deporte: 'BALONMANO',
    enfrentamiento: 'BLANCO VS VERDE',
    categoria: 'Infantil (3º y 4º)',
    arbitro: 'MARIO NUÑEZ',
    apoyo: '3ER Y 4TO PUESTO',
    lugar: 'Campo 1',
    estado: 'proximo'
  },
  {
    id: 5,
    semana: 3,
    fecha: '2026-09-29',
    dia: 'Martes 29/09',
    hora: '08:00 - 08:20',
    deporte: 'CARRERAS',
    enfrentamiento: 'VERDE VS AZUL',
    categoria: 'Promesas (1º y 2º)',
    arbitro: 'Larry Delao',
    apoyo: 'David y Mario',
    lugar: 'Campo 1',
    estado: 'finalizado'
  }
];

export default function Fixture() {
  const [partidos, setPartidos] = useState<Partido[]>(PARTIDOS_OFICIALES);
  const [cargando, setCargando] = useState<boolean>(false);
  const [filtroSemana, setFiltroSemana] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'proximo' | 'en-vivo' | 'finalizado'>('todos');

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
      console.log('Usando datos de respaldo locales.');
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

  // Agrupación jerárquica: Semana -> Día -> Partidos
  const partidosAgrupados = partidosFiltrados.reduce((acc: { [semana: string]: { [dia: string]: Partido[] } }, partido) => {
    const semKey = `Semana ${partido.semana}`;
    const diaKey = String(partido.dia || 'Día Programado');

    if (!acc[semKey]) acc[semKey] = {};
    if (!acc[semKey][diaKey]) acc[semKey][diaKey] = [];
    acc[semKey][diaKey].push(partido);

    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Calendario Oficial por Semanas y Días
          </h1>
          <p className="text-slate-500 text-sm">Cronograma completo sincronizado desde tu base de datos en Google Sheets.</p>
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
        <div className="space-y-10">
          {Object.entries(partidosAgrupados).map(([semanaTitulo, diasMap]) => (
            <div key={semanaTitulo} className="space-y-6">
              {/* Encabezado de la Semana */}
              <div className="flex items-center gap-3 border-b-2 border-blue-600 pb-2">
                <div className="bg-blue-600 text-white font-extrabold px-4 py-1.5 rounded-xl text-base shadow-sm flex items-center gap-2">
                  <Calendar size={18} />
                  {semanaTitulo}
                </div>
              </div>

              {/* Días dentro de la Semana */}
              <div className="space-y-6 pl-1 md:pl-4">
                {Object.entries(diasMap).map(([diaTitulo, listaPartidos]) => (
                  <div key={diaTitulo} className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm bg-slate-100 px-3.5 py-1.5 rounded-xl w-fit border border-slate-200">
                      <Clock size={16} className="text-blue-600" />
                      <span>{diaTitulo}</span>
                      <span className="text-xs font-normal text-slate-500">({listaPartidos.length} partidos)</span>
                    </div>

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
                                <span className="font-medium text-slate-600">Árbitro: {partido.arbitro}</span>
                              </div>
                              {partido.apoyo && (
                                <div className="text-slate-400 text-[11px] truncate">
                                  Apoyo / Mesa: {partido.apoyo}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}