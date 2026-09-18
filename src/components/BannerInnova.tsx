import { useState, useEffect } from 'react';

// Degradados basados en los 3 colores principales del logo (Azul, Verde y Naranja)
const brandGradients = [
  "bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950",   
  "bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900",  
  "bg-gradient-to-r from-amber-800 via-orange-800 to-amber-950"  
];

export default function BannerInnova() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % brandGradients.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full rounded-2xl py-3 px-5 md:px-6 mb-6 text-white shadow-lg relative overflow-hidden flex items-center justify-between gap-4 border border-white/15">
      
      {/* Capas de fondo con fundido cruzado ultra suave */}
      {brandGradients.map((gradient, index) => (
        <div
          key={index}
          className={`absolute inset-0 ${gradient} transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Efecto decorativo sutil de fondo */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none z-0"></div>

      {/* Lado izquierdo: Logo equilibrado e información compacta */}
      <div className="relative z-10 flex items-center gap-4 text-left">
        
        <div className="flex-shrink-0">
          <img 
            src="/logo-innova.png" 
            alt="Logo Innova Schools" 
            className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-md" 
          />
        </div>

        <div>
          <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-white/25 inline-block mb-1">
            Innova Schools SMP Perú
          </span>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-white leading-tight">
            Olimpiadas 360° 2026
          </h2>
          <p className="text-[11px] md:text-xs text-white/90 font-medium">
            Plataforma oficial de gestión, cronograma y validación de resultados.
          </p>
        </div>
      </div>

      {/* Lado derecho: Insignia */}
      <div className="relative z-10 hidden lg:flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-xs font-bold text-white shadow-sm">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
        <span>Sistema en Vivo</span>
      </div>

    </div>
  );
}