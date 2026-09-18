import { useState, useEffect } from 'react';

// Lista de degradados con los tonos oficiales del logo
const brandGradients = [
  "bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-800", // Azul institucional
  "bg-gradient-to-r from-emerald-900 via-teal-900 to-green-900",  // Verde vibrante
  "bg-gradient-to-r from-blue-950 via-cyan-900 to-blue-900",    // Celeste y azul profundo
  "bg-gradient-to-r from-amber-900 via-orange-900 to-amber-950" // Naranja cálido
];

export default function BannerInnova() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cambia de color cada 4 segundos de forma automática
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % brandGradients.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full rounded-3xl p-6 md:p-8 mb-8 text-white shadow-xl shadow-indigo-950/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/15">
      
      {/* Capas de fondo con fundido cruzado (Cross-fade) para una transición ultra suave */}
      {brandGradients.map((gradient, index) => (
        <div
          key={index}
          className={`absolute inset-0 ${gradient} transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Efectos decorativos de fondo (por encima de los gradientes) */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none z-0"></div>
      <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none z-0"></div>

      {/* Lado izquierdo: Logo sin fondo e información */}
      <div className="relative z-10 flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
        
        <div className="flex-shrink-0">
          <img 
            src="/logo-innova.png" 
            alt="Logo Innova Schools" 
            className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-lg" 
          />
        </div>

        <div>
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/25 inline-block mb-2">
            Innova Schools SMP Perú
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">
            Olimpiadas 360° 2026
          </h2>
          <p className="text-xs md:text-sm text-white/90 font-medium mt-1">
            Plataforma oficial de gestión, cronograma y validación de resultados.
          </p>
        </div>
      </div>

      {/* Lado derecho: Insignia */}
      <div className="relative z-10 hidden lg:flex items-center gap-3 bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-xs font-bold text-white shadow-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
        <span>Sistema en Vivo</span>
      </div>

    </div>
  );
}