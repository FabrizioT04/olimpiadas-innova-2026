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
    <div className="w-full rounded-3xl py-4 px-6 md:px-8 mb-6 text-white shadow-xl shadow-indigo-950/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/15">
      
      {/* Capas de fondo con fundido cruzado ultra suave */}
      {brandGradients.map((gradient, index) => (
        <div
          key={index}
          className={`absolute inset-0 ${gradient} transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Efectos decorativos de fondo */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none z-0"></div>
      <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none z-0"></div>

      {/* Lado izquierdo: Logo más grande y textos más compactos */}
      <div className="relative z-10 flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
        
        {/* Logo ampliado */}
        <div className="flex-shrink-0">
          <img 
            src="/logo-innova.png" 
            alt="Logo Innova Schools" 
            className="w-36 h-36 md:w-44 md:h-44 object-contain drop-shadow-2xl" 
          />
        </div>

        <div>
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/25 inline-block mb-1.5">
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