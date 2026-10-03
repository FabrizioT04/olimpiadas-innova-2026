import { HOUSES } from '../features/arbitraje/hooks/useArbitraje';
import { useContenido } from '../features/contenido/useContenido';
import MascotaHouse from './MascotaHouse';
import { OLIMPIADAS_FINALIZADAS } from '../../shared/olimpiadas';

// Anillo del color de cada House alrededor de su mascota. Nombres completos para que Tailwind los conserve.
const ANILLO: Record<string, string> = { blue: 'ring-blue-500', white: 'ring-slate-300', green: 'ring-green-500', orange: 'ring-orange-500' };

// Cabecera del evento: tarjeta blanca y sobria con el logo, el nombre y las mascotas de las cuatro Houses.
export default function BannerInnova() {
  const { mascotas, cargado } = useContenido();
  return (
    <div className="vidrio mb-6 flex w-full items-center justify-between gap-4 rounded-3xl px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-slate-200 sm:h-16 sm:w-16">
          <img src="/logo-innova.png" alt="Logo Innova Schools" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 sm:text-xs">Innova Schools SMP · Perú</p>
          <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl">Olimpiadas 360°</span>
            <span className="rounded-lg bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white sm:text-sm">2026</span>
            {OLIMPIADAS_FINALIZADAS && <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 sm:text-sm">Finalizadas</span>}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Plataforma oficial de gestión, cronograma y validación de resultados.</p>
        </div>
      </div>

      {/* Las cuatro Houses, quietas */}
      <ul aria-label="Las cuatro Houses" className="hidden shrink-0 items-center -space-x-2 pr-1 sm:flex">
        {HOUSES.map(house => <li key={house.id} title={house.name.charAt(0) + house.name.slice(1).toLowerCase()}>
          <MascotaHouse house={house} mascotas={mascotas} cargado={cargado}
            className={`relative h-11 w-11 rounded-full bg-white object-contain p-0.5 ring-[3px] lg:h-12 lg:w-12 ${ANILLO[house.color]}`} />
        </li>)}
      </ul>
    </div>
  );
}
