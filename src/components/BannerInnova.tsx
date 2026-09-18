export default function BannerInnova() {
  return (
    <div className="w-full bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-800 rounded-3xl p-6 md:p-8 mb-8 text-white shadow-xl shadow-indigo-950/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-800/50">
      
      {/* Efectos decorativos de fondo */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Lado izquierdo: Logo grande sin fondo e información */}
      <div className="relative z-10 flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
        
        {/* Logo sin caja blanca, más grande y con sombra sutil para resaltar */}
        <div className="flex-shrink-0">
          <img 
            src="/logo-innova.png" 
            alt="Logo Innova Schools" 
            className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-lg" 
          />
        </div>

        <div>
          <span className="bg-blue-500/30 text-blue-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-blue-400/30 inline-block mb-2">
            Innova Schools SMP Perú
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">
            Olimpiadas 360° 2026
          </h2>
          <p className="text-xs md:text-sm text-indigo-200/90 font-medium mt-1">
            Plataforma oficial de gestión, cronograma y validación de resultados.
          </p>
        </div>
      </div>

      {/* Lado derecho: Insignia */}
      <div className="relative z-10 hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-xs font-bold text-indigo-100 shadow-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
        <span>Sistema en Vivo</span>
      </div>

    </div>
  );
}