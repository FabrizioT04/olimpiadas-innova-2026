import { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, UserCheck, LogOut } from 'lucide-react';
import { HOUSES, useArbitraje } from '../features/arbitraje/hooks/useArbitraje';

export default function PanelArbitro() {
  const [correoAutorizado, setCorreoAutorizado] = useState<string | null>(null);
  const [error, setError] = useState('');
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
    category, setCategory,
    points, setPoints,
    activity, setActivity,
    motivo, setMotivo,
    isSubmitting,
    enviarPuntaje
  } = useArbitraje();

  if (!correoAutorizado) {
    return <div className="max-w-lg mx-auto p-8 bg-white rounded-2xl text-center">
      <h1 className="text-xl font-bold">Panel de arbitraje</h1>
      <p className="my-4" role="status">{error || 'Verificando tu sesión…'}</p>
      {error && <a className="text-blue-700 underline" href="/arbitraje">Volver a ingresar</a>}
    </div>;
  }

  // 2. Si SÍ está autorizado, muestra tu bloque de código completo perfectamente
  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden font-sans text-slate-800 p-4 md:p-8 flex flex-col items-center justify-center">
      
      {/* Decoración de fondo */}
      <div className="absolute top-0 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 right-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 pointer-events-none"></div>
      <div className="absolute -bottom-8 left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-5xl mt-4">
        
        {/* Barra superior de sesión autorizada */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white/80 backdrop-blur-xl px-6 py-3.5 rounded-2xl border border-slate-200 shadow-sm mb-8 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ShieldCheck size={18} />
            </div>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck size={15} className="text-emerald-600" />
              Sesión activa: <span className="text-indigo-600 font-extrabold">{correoAutorizado}</span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition-colors border border-red-100"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </div>

        {/* Cabecera */}
        <div className="text-center mb-12">
          <span className="inline-block py-1.5 px-4 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-widest uppercase mb-4 shadow-sm border border-indigo-100">
            Innova Schools • San Martín de Porres
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 mb-4 pb-1">
            Control de Arbitraje
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Registro oficial de puntajes y validación en tiempo real</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Formulario */}
          <div className="lg:col-span-7 bg-white/70 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80">
            <form onSubmit={enviarPuntaje} className="space-y-5">
              
              {/* House Seleccionada Visual */}
              <div className="bg-gradient-to-r from-slate-50/80 to-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 transition-all">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center flex-shrink-0">
                  {selectedHouse ? (
                    <img src={selectedHouse.img} alt={selectedHouse.name} className="w-full h-full object-contain drop-shadow-md transition-all duration-300" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 shadow-inner flex items-center justify-center border border-slate-200 border-dashed">
                      <span className="text-3xl text-slate-300">🎯</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Destinatario Oficial</p>
                  <p className={`text-xl font-black tracking-tight ${selectedHouse ? 'text-slate-800' : 'text-slate-400'}`}>
                    {selectedHouse ? selectedHouse.name : 'Selecciona una House...'}
                  </p>
                </div>
              </div>

              {/* Operación */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">Operación</label>
                <div className="relative">
                  <select 
                    className="w-full pl-4 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none shadow-sm transition-all"
                    value={operation} onChange={(e) => setOperation(e.target.value)}
                  >
                    <option value="">Selecciona la operación...</option>
                    <option value="sumar">✅ Sumar Puntos (Victoria / Reto)</option>
                    <option value="restar">❌ Restar Puntos (Penalidad)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Categoría y Actividad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">Categoría</label>
                  <div className="relative">
                    <select 
                      className="w-full pl-4 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none shadow-sm transition-all"
                      value={category} onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Elige...</option>
                      <option value="promesas">Promesas (1º y 2º)</option>
                      <option value="infantil">Infantil (3º y 4º)</option>
                      <option value="junior">Junior (5º y 6º)</option>
                      <option value="juvenila">Juvenil A (7º y 8º)</option>
                      <option value="juvenilb">Juvenil B (9º, 10º, 11º)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">Deporte / Reto</label>
                  <div className="relative">
                    <select 
                      className="w-full pl-4 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none shadow-sm transition-all"
                      value={activity} onChange={(e) => setActivity(e.target.value)}
                    >
                      <option value="">Elige el deporte o reto...</option>
                      <optgroup label="Deportes Principales">
                        <option value="8">Futsal</option>
                        <option value="9">Vóley</option>
                        <option value="10">Pasabola</option>
                        <option value="11">Balonmano</option>
                        <option value="12">Básquet</option>
                        <option value="13">Coneball</option>
                        <option value="17">Bádminton</option>
                      </optgroup>
                      <optgroup label="Gynkana y Carreras">
                        <option value="14">Carrera 25 metros</option>
                        <option value="15">Carrera de relevos</option>
                        <option value="16">Carrera de Resistencia</option>
                        <option value="18">Salta Soga</option>
                        <option value="19">Carrera de Michi</option>
                        <option value="20">Aros Musicales</option>
                        <option value="21">Carrera de Canalestas</option>
                        <option value="22">Comelones</option>
                        <option value="23">Carrera revienta globos</option>
                        <option value="24">La cuchara y el limón</option>
                        <option value="25">Carrera de Ganchos</option>
                        <option value="26">Carrera de Tres Piernas</option>
                      </optgroup>
                      <optgroup label="Retos Académicos">
                        <option value="27">Matemática (Tangram, Retos)</option>
                        <option value="28">Comunicación (Cuentos, Debate)</option>
                        <option value="29">DPSC (Juegos Andinos, Taptana)</option>
                        <option value="30">Inglés (English Race, Lyrics War)</option>
                        <option value="31">Arte (Máscaras, Mural, Canto)</option>
                      </optgroup>
                      <optgroup label="Eventos Especiales y Reconocimientos">
                        <option value="34">Concurso de Barras</option>
                        <option value="35">Concurso de Drill Coreográfico</option>
                        <option value="36">Reconocimiento: Sana Convivencia</option>
                        <option value="37">Reconocimiento: Eco House</option>
                      </optgroup>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Puntos */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">Puntos a otorgar/restar</label>
                <input 
                  type="number" 
                  placeholder="Ej: 100" 
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all placeholder:text-slate-300 placeholder:font-normal"
                  value={points} onChange={(e) => setPoints(e.target.value)} 
                />
              </div>

              <div>
                <label htmlFor="motivo" className="block text-sm font-bold mb-2">Motivo del registro o corrección</label>
                <textarea id="motivo" required minLength={3} maxLength={300} value={motivo}
                  onChange={e => setMotivo(e.target.value)} className="w-full p-3 border rounded-xl"
                  placeholder="Ej.: victoria de futsal o corrección del acta" />
              </div>
              {/* Confirmar operación */}
              <button 
                type="submit" 
                disabled={isSubmitting || !selectedHouse}
                className={`w-full mt-4 font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2
                  ${isSubmitting || !selectedHouse
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-[0_8px_20px_rgb(79,70,229,0.25)] hover:shadow-[0_10px_25px_rgb(79,70,229,0.4)] hover:-translate-y-0.5'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-2">
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  <span>
                    {isSubmitting ? 'Enviando a Base de Datos...' : 'Confirmar Transacción'}
                  </span>
                </span>
              </button>

            </form>
          </div>

          {/* Columna Derecha: Grilla de Houses */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {HOUSES.map((house) => (
              <button
                key={house.id}
                type="button"
                onClick={() => setSelectedHouse(house)}
                className={`group relative flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-sm rounded-[2rem] transition-all duration-300 min-h-[220px]
                  ${selectedHouse?.id === house.id 
                    ? 'border-0 ring-[3px] ring-indigo-500/40 scale-[1.03] shadow-[0_10px_30px_rgb(79,70,229,0.15)] z-10' 
                    : 'border border-slate-100 hover:border-slate-200 hover:scale-[1.02] hover:shadow-lg shadow-sm'
                  }
                `}
              >
                {selectedHouse?.id === house.id && (
                  <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgb(99,102,241)]"></div>
                )}
                
                <div className={`relative mb-6 transition-transform duration-500 ease-out ${selectedHouse?.id === house.id ? 'scale-110 -translate-y-2' : 'group-hover:scale-125 group-hover:-translate-y-3'}`}>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-4 bg-slate-900/10 blur-md rounded-full transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                  <img 
                    src={house.img} 
                    alt={house.name} 
                    className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-2xl" 
                  />
                </div>
                
                <span className={`font-black tracking-widest text-sm uppercase transition-colors absolute bottom-6 ${selectedHouse?.id === house.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-800'}`}>
                  {house.name}
                </span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}