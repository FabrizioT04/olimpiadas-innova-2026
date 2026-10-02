import { Trophy } from 'lucide-react';
import { HOUSES } from '../features/arbitraje/hooks/useArbitraje';
import { STATUS_NAMES } from '../features/marcadores/model';
import type { Marcador } from '../features/marcadores/model';
import type { Lugar } from '../features/clasificacion/model';
import MascotaHouse from './MascotaHouse';
import { inclinacion } from './inclinacion';

// Colours of each House (keyed by its colour in the sheet), used wherever a House is shown.
// Full class names so Tailwind keeps them.
const ESTILO_HOUSE: Record<string, { nombre: string; chip: string; anillo: string; barra: string }> = {
  white: { nombre: 'Blanco', chip: 'bg-white text-slate-900 ring-slate-300', anillo: 'ring-white', barra: 'bg-white' },
  blue: { nombre: 'Azul', chip: 'bg-blue-600 text-white ring-blue-700', anillo: 'ring-blue-500', barra: 'bg-blue-500' },
  orange: { nombre: 'Anaranjado', chip: 'bg-orange-500 text-white ring-orange-600', anillo: 'ring-orange-500', barra: 'bg-orange-500' },
  green: { nombre: 'Verde', chip: 'bg-green-600 text-white ring-green-700', anillo: 'ring-green-500', barra: 'bg-green-500' },
};
const ESTADO: Record<Marcador['estado'], string> = {
  pendiente: 'bg-slate-200 text-slate-600',
  'en-juego': 'bg-red-600 text-white animate-pulse',
  finalizado: 'bg-amber-400 text-slate-900',
};

interface Contenido { mascotas: Record<string, string>; cargado: boolean }

// Gold, silver and bronze spheres for 1st to 3rd; other places in grey. `sinNumero` for the medal counts.
const MEDALLA_ESFERA = ['from-amber-200 to-amber-500 text-amber-950', 'from-slate-100 to-slate-400 text-slate-700', 'from-orange-200 to-orange-500 text-orange-950'];
export function Medalla({ puesto, sinNumero = false, className = 'h-7 w-7 text-xs' }: { puesto: number; sinNumero?: boolean; className?: string }) {
  return <span aria-hidden={sinNumero || undefined} className={`esfera inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b font-extrabold shadow-[inset_0_-3px_6px_rgb(0_0_0/0.15),inset_0_3px_6px_rgb(255_255_255/0.6)] ${MEDALLA_ESFERA[puesto - 1] ?? 'from-white to-slate-200 text-slate-500'} ${className}`}>{sinNumero ? null : puesto}</span>;
}

// Pill with the House colour, mascot and name, e.g. in «BLANCO VS VERDE» or in a ranking.
export function HouseChip({ color, mascotas, cargado }: { color: string } & Contenido) {
  const estilo = ESTILO_HOUSE[color], house = HOUSES.find(h => h.color === color);
  if (!estilo) return null;
  return <span className={`inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-3 text-xs font-extrabold ring-1 ${estilo.chip}`}>
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
      <div className={`esfera relative h-14 w-14 rounded-full bg-white p-0.5 ring-4 ${estilo.anillo}`}>
        <MascotaHouse house={house} mascotas={mascotas} cargado={cargado} className="h-full w-full rounded-full object-contain" />
        {ganador === color && <Trophy aria-label="Ganador" className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-amber-400 p-1 text-slate-900" />}
      </div>
      <span className="text-xs font-extrabold">{estilo.nombre}</span>
      <span aria-hidden="true" className={`h-1 w-10 rounded-full ${estilo.barra}`} />
    </div>;
  };
  return <div className="rounded-3xl bg-white/80 p-4 text-slate-800 shadow-[0_14px_30px_-18px_rgb(51_65_85/0.5)] ring-1 ring-white">
    <div className="flex justify-center">
      <span className={`rounded-full px-3 py-0.5 text-[10px] font-extrabold ${ESTADO[marcador.estado]}`}>{STATUS_NAMES[marcador.estado]}</span>
    </div>
    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      {equipo(marcador.houseA)}
      <p className="texto-3d text-4xl font-extrabold tabular-nums"
        aria-label={`${ESTILO_HOUSE[marcador.houseA].nombre} ${marcador.a}, ${ESTILO_HOUSE[marcador.houseB].nombre} ${marcador.b}`}>
        {marcador.a}<span aria-hidden="true" className="mx-2 text-slate-300">–</span>{marcador.b}
      </p>
      {equipo(marcador.houseB)}
    </div>
  </div>;
}

// Places of a ranking inside a programme card, in the same glass style as the scoreboard.
export function PodioCompacto({ titulo, clasificacion, mascotas, cargado }:
  { titulo: string; clasificacion: { puestos: Record<string, number>; puntos?: Record<string, number> } } & Contenido) {
  const orden = Object.keys(clasificacion.puestos).sort((a, b) => clasificacion.puestos[a] - clasificacion.puestos[b]);
  return <div className="rounded-2xl bg-white/80 p-3 text-slate-800 shadow-[0_14px_30px_-18px_rgb(51_65_85/0.5)] ring-1 ring-white">
    <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-amber-700">
      <Trophy aria-hidden="true" className="h-3.5 w-3.5" />{titulo}
    </p>
    <ol className="grid grid-cols-1 gap-1.5">
      {orden.map(h => <li key={h} className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2"><Medalla puesto={clasificacion.puestos[h]} />
          <HouseChip color={h} mascotas={mascotas} cargado={cargado} /></span>
        {Number.isSafeInteger(clasificacion.puntos?.[h]) && <span className="whitespace-nowrap text-xs font-bold text-slate-500">{clasificacion.puntos?.[h]} pts</span>}
      </li>)}
    </ol>
  </div>;
}

// Gold, silver and bronze, as podium steps and as the medal counts.
const MEDALLA = ['from-amber-300 to-amber-500 text-amber-950', 'from-slate-200 to-slate-400 text-slate-800', 'from-orange-300 to-orange-500 text-orange-950'];
const ALTURA_PODIO = ['h-16', 'h-11', 'h-8'];

// 1st in the middle and highest, 2nd and 3rd at its sides, 4th on a line below. A place still to be
// decided (a sports match without result) shows «Por definir».
export function PodioMedallas({ lugares, mascotas, cargado }: { lugares: Lugar[] } & Contenido) {
  const de = (puesto: number) => lugares.find(l => l.puesto === puesto);
  const cuarto = de(4);
  return <div>
    <ol className="grid grid-cols-3 items-end gap-2">{[2, 1, 3].map(puesto => {
      const lugar = de(puesto), estilo = lugar?.house ? ESTILO_HOUSE[lugar.house] : undefined, house = HOUSES.find(h => h.color === lugar?.house);
      return <li key={puesto} className="flex min-w-0 flex-col items-center gap-1 text-center">
        <div className={`esfera relative rounded-full bg-white p-0.5 ring-4 ${puesto === 1 ? 'h-16 w-16' : 'h-12 w-12'} ${estilo?.anillo ?? 'ring-slate-200'}`}>
          {estilo ? <MascotaHouse house={house} mascotas={mascotas} cargado={cargado} className="h-full w-full rounded-full object-contain" />
            : <span className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 font-extrabold text-slate-300">?</span>}
          {puesto === 1 && estilo && <Trophy aria-hidden="true" className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-amber-400 p-1 text-slate-900" />}
        </div>
        <span className={`max-w-full truncate text-xs font-extrabold ${estilo ? 'text-slate-900' : 'text-slate-400'}`}>{estilo?.nombre ?? 'Por definir'}</span>
        <span className="text-[11px] font-semibold text-slate-500">{lugar?.puntos !== undefined ? `${lugar.puntos} pts` : '\u00a0'}</span>
        <span className={`flex w-full items-start justify-center rounded-t-2xl bg-gradient-to-b pt-1 text-base font-extrabold shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_12px_20px_-12px_rgb(15_23_42/0.45)] ${MEDALLA[puesto - 1]} ${ALTURA_PODIO[puesto - 1]}`}>{puesto}.º</span>
      </li>;
    })}</ol>
    {cuarto && <p className="flex items-center justify-between gap-2 rounded-b-xl bg-white/70 px-3 py-1.5 text-sm ring-1 ring-white">
      <span className="flex items-center gap-2"><Medalla puesto={4} className="h-6 w-6 text-[11px]" />
        {cuarto.house ? <HouseChip color={cuarto.house} mascotas={mascotas} cargado={cargado} /> : <span className="text-slate-400">Por definir</span>}</span>
      {cuarto.puntos !== undefined && <span className="text-xs font-semibold text-slate-500">{cuarto.puntos} pts</span>}
    </p>}
  </div>;
}

// Medals of each House (1st, 2nd and 3rd places), ordered by golds, then silvers, then bronzes.
export function Medallero({ medallas, mascotas, cargado }: { medallas: Record<string, number[]> } & Contenido) {
  const orden = Object.keys(medallas).filter(h => ESTILO_HOUSE[h]).sort((a, b) =>
    medallas[b][0] - medallas[a][0] || medallas[b][1] - medallas[a][1] || medallas[b][2] - medallas[a][2]);
  return <ol className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">{orden.map((h, i) => {
    const estilo = ESTILO_HOUSE[h], house = HOUSES.find(x => x.color === h);
    return <li key={h} {...inclinacion} className="relative overflow-hidden rounded-2xl bg-white/85 p-3 text-slate-800 shadow-[0_14px_30px_-18px_rgb(51_65_85/0.5)] ring-1 ring-white transition-transform duration-200">
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1.5 ${estilo.barra}`} />
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="hidden text-lg font-extrabold text-slate-300 sm:inline">{i + 1}</span>
        <MascotaHouse house={house} mascotas={mascotas} cargado={cargado} className={`esfera h-8 w-8 shrink-0 rounded-full bg-white object-contain ring-2 sm:h-9 sm:w-9 ${estilo.anillo}`} />
        <span className="min-w-0 whitespace-nowrap text-[11px] font-extrabold sm:text-sm ">{estilo.nombre}</span>
      </div>
      <p className="mt-2.5 flex gap-3" aria-label={`${medallas[h][0]} de oro, ${medallas[h][1]} de plata, ${medallas[h][2]} de bronce`}>
        {medallas[h].map((n, m) => <span key={m} aria-hidden="true" className="flex items-center gap-1 text-sm font-extrabold tabular-nums">
          <Medalla puesto={m + 1} sinNumero className="h-4 w-4" />{n}
        </span>)}
      </p>
    </li>;
  })}</ol>;
}
