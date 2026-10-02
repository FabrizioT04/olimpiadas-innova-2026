// Cabecera del evento: una tarjeta de vidrio claro con el logo, en el mismo estilo que el resto de la web.
export default function BannerInnova() {
  return (
    <div className="vidrio relative mb-6 flex w-full items-center justify-between gap-4 overflow-hidden rounded-3xl px-5 py-3 md:px-6">

      {/* Manchas de color suaves detrás del vidrio */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-indigo-200/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-pink-200/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 motion-safe:animate-[brillo_7s_ease-in-out_2s_infinite]" />

      <div className="relative flex items-center gap-4 text-left">
        <img
          src="/logo-innova.png"
          alt="Logo Innova Schools"
          className="h-16 w-16 flex-shrink-0 object-contain drop-shadow-md transition-transform duration-500 hover:-rotate-6 hover:scale-110 md:h-20 md:w-20"
        />
        <div>
          <span className="mb-1 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600">
            Innova Schools SMP Perú
          </span>
          <h2 className="texto-3d text-xl font-extrabold leading-tight md:text-2xl">
            Olimpiadas 360° 2026
          </h2>
          <p className="text-[11px] text-slate-500 md:text-xs">
            Plataforma oficial de gestión, cronograma y validación de resultados.
          </p>
        </div>
      </div>

    </div>
  );
}
