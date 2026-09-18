import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Trophy, Filter, Loader2 } from 'lucide-react';

interface Partido {
  id: number;
  deporte: string;
  fase: string;
  equipoA: string;
  equipoB: string;
  hora: string;
  lugar: string;
  estado: 'proximo' | 'en-vivo' | 'finalizado';
  marcadorA?: number;
  marcadorB?: number;
}

export default function Fixture() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'proximo' | 'en-vivo' | 'finalizado'>('todos');

  // Pega aquí la URL de tu Web App de Google Apps Script
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw6v_-hQor-DMh7Mg2qtodwpuIiXIuCOqqtV3mY3Gs5ueqZBrDH8LORqa7RTMWhIH1uqw/exec';

  useEffect(() => {
    const obtenerFixture = async () => {
      try {
        const respuesta = await fetch(WEB_APP_URL);
        const json = await respuesta.json();
        
        // Mapeamos los datos que vienen del Apps Script con las propiedades cortas (s, f, t, h, d, e, c, a, r)
        const listaMapeada = (json.partidos || []).map((item: any, index: number) => {
          const equipos = (item.e || '').split(' VS ');
          return {
            id: index + 1,
            deporte: item.d || 'Deporte',
            fase: item.c || 'Fase de Grupos', // Categoría
            equipoA: equipos[0] || 'Local',
            equipoB: equipos[1] || 'Visita',
            hora: item.h || 'Por definir',
            lugar: 'Sede Principal - SMP',
            estado: 'proximo', // Puedes cambiar o ajustar según necesites
            marcadorA: 0,
            marcadorB: 0
          };
        });

        setPartidos(listaMapeada);
      } catch (error) {
        console.error('Error al cargar el fixture desde Sheets:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerFixture();
  }, []);

  const partidosFiltrados = partidos.filter(p => {
    if (filtroEstado === 'todos') return true;
    return p.estado === filtroEstado;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Fixture y Calendario Oficial
          </h1>
          <p className="text-slate-500 text-sm">Sincronizado en tiempo real desde Google Sheets.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <Filter size={16} className="text-slate-400 ml-2" />
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroEstado === 'todos' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
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
          <p className="text-slate-500 font-medium text-sm">Cargando encuentros deportivos...</p>
        </div>
      ) : partidosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-400 font-medium">No hay partidos registrados en este estado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partidosFiltrados.map((partido) => (
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
                  {partido.fase}
                </span>
              </div>

              <div className="flex items-center justify-between my-4 pl-2">
                <div className="flex-1 text-right font-bold text-slate-800 text-lg">
                  {partido.equipoA}
                </div>
                <div className="px-4 text-center">
                  {partido.estado === 'en-vivo' || partido.estado === 'finalizado' ? (
                    <span className="bg-slate-900 text-white font-mono px-3 py-1 rounded-lg text-sm tracking-widest font-bold">
                      {partido.marcadorA ?? 0} - {partido.marcadorB ?? 0}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 uppercase">vs</span>
                  )}
                </div>
                <div className="flex-1 text-left font-bold text-slate-800 text-lg">
                  {partido.equipoB}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 pl-2">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-slate-400" />
                  <span>{partido.hora}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{partido.lugar}</span>
                </div>
                <div>
                  {partido.estado === 'en-vivo' && <span className="text-red-600 font-bold animate-pulse">● EN VIVO</span>}
                  {partido.estado === 'proximo' && <span className="text-amber-600 font-semibold">Próximamente</span>}
                  {partido.estado === 'finalizado' && <span className="text-slate-600 font-medium">Finalizado</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}