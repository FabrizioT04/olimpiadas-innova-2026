import { useState, useEffect } from 'react';

// Degradados basados en los 3 colores principales del logo (Azul, Verde y Naranja)
const brandGradients = [
  "bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500",
  "bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-500",
  "bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500"
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
    <div className="w-full rounded-[2rem] py-3 px-5 md:px-6 mb-6 text-white shadow-lg relative overflow-hidden flex items-center justify-between gap-4 border-4 border-white">
      
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
          <span className="bg-white/25 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/30 inline-block mb-1">
            Innova Schools SMP Perú
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight drop-shadow-sm">
            ¡Olimpiadas 360° 2026! 🎉
          </h2>
          <p className="text-[11px] md:text-xs text-white/90 font-medium">
            Plataforma oficial de gestión, cronograma y validación de resultados.
          </p>
        </div>
      </div>

      {/* Lado derecho: Insignia */}
      <div aria-hidden="true" className="relative z-10 hidden lg:flex items-center gap-2 text-3xl drop-shadow">
        <span>🏆</span><span>⭐</span><span>🎊</span>
      </div>

    </div>
  );
}