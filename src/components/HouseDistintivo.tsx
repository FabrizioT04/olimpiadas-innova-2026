import { Trophy } from 'lucide-react';
import { HOUSES } from '../features/arbitraje/hooks/useArbitraje';
import { STATUS_NAMES } from '../features/marcadores/model';
import type { Marcador } from '../features/marcadores/model';
import MascotaHouse from './MascotaHouse';

// Colours of each House (keyed by its colour in the sheet), used wherever a House is shown.
// Full class names so Tailwind keeps them.
const ESTILO_HOUSE: Record<string, { nombre: string; chip: string; anillo: string; barra: string }> = {
  white: { nombre: 'Blanco', chip: 'bg-white text-slate-900 ring-slate-300', anillo: 'ring-white', barra: 'bg-white' },
  blue: { nombre: 'Azul', chip: 'bg-blue-600 text-white ring-blue-700', anillo: 'ring-blue-500', barra: 'bg-blue-500' },
  orange: { nombre: 'Anaranjado', chip: 'bg-orange-500 text-white ring-orange-600', anillo: 'ring-orange-500', barra: 'bg-orange-500' },
  green: { nombre: 'Verde', chip: 'bg-green-600 text-white ring-green-700', anillo: 'ring-green-500', barra: 'bg-green-500' },
};
const ESTADO: Record<Marcador['estado'], string> = {
  pendiente: 'bg-slate-700 text-slate-200',
  'en-juego': 'bg-red-600 text-white animate-pulse',
  finalizado: 'bg-amber-400 text-slate-900',
};

interface Contenido { mascotas: Record<string, string>; cargado: boolean }

// Pill with the House colour, mascot and name, e.g. in «BLANCO VS VERDE» or in a ranking.
export function HouseChip({ color, mascotas, cargado }: { color: string } & Contenido) {
  const estilo = ESTILO_HOUSE[color], house = HOUSES.find(h => h.color === color);
  if (!estilo) return null;
  return <span className={`inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-3 text-xs font-black uppercase italic tracking-wide ring-1 ${estilo.chip}`}>
    <MascotaHouse house={house} mascotas={mascotas} cargado={cargado} className="h-6 w-6 shrink-0 rounded-full bg-white object-contain" />
    {estilo.nombre}
  </span>;
}

// Scoreboard of a match between two Houses; when finished, the winner keeps full colour and a trophy.
export function MarcadorDeportivo({ marcador, mascotas, cargado }: { marcador: Marcador } & Contenido) {
  const ganador = marcador.estado === 'finalizado' && marcador.a !== marcador.b
    ? (marcador.a > marcador.b ? marcador.houseA : marcador.houseB) : null;
  const equipo = (color: string) => {
    const estilo = ESTILO_HOUSE[color], house = HOUSES.find(h => h.color === color);
    return <div className={`flex flex-col items-center gap-1.5 transition-opacity ${ganador && ganador !== color ? 'opacity-50' : ''}`}>
      <div className={`relative h-14 w-14 rounded-full bg-white p-0.5 ring-4 ${estilo.anillo}`}>
        <MascotaHouse house={house} mascotas={mascotas} cargado={cargado} className="h-full w-full rounded-full object-contain" />
        {ganador === color && <Trophy aria-label="Ganador" className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-amber-400 p-1 text-slate-900" />}
      </div>
      <span className="text-xs font-black uppercase italic tracking-wider">{estilo.nombre}</span>
      <span aria-hidden="true" className={`h-1 w-10 rounded-full ${estilo.barra}`} />
    </div>;
  };
  return <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
    <div className="flex justify-center">
      <span className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest ${ESTADO[marcador.estado]}`}>{STATUS_NAMES[marcador.estado]}</span>
    </div>
    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      {equipo(marcador.houseA)}
      <p className="text-4xl font-black italic tabular-nums tracking-tight"
        aria-label={`${ESTILO_HOUSE[marcador.houseA].nombre} ${marcador.a}, ${ESTILO_HOUSE[marcador.houseB].nombre} ${marcador.b}`}>
        {marcador.a}<span aria-hidden="true" className="mx-2 text-slate-500">–</span>{marcador.b}
      </p>
      {equipo(marcador.houseB)}
    </div>
  </div>;
}
