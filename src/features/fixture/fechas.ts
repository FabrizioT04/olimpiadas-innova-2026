// Today's date (YYYY-MM-DD) in the visitor's time zone, the same format as the programme dates.
export const hoyLocal = () => new Date().toLocaleDateString('en-CA');

// Programme dates in order; activities without a date go last.
export const ordenarFechas = (fechas: string[]) =>
  [...new Set(fechas)].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)));

// The date shown on opening: today if it has activities, otherwise the next one with activities, and once
// the event is over the last one. Without dated activities, every date.
export function fechaInicial(fechas: string[], hoy: string) {
  const conFecha = ordenarFechas(fechas).filter(Boolean);
  if (!conFecha.length) return 'todos';
  if (conFecha.includes(hoy)) return hoy;
  return conFecha.find(f => f > hoy) ?? conFecha[conFecha.length - 1];
}

// Start and end of «08:20 a 09:00» (also «9:40 a 10:00» or «08:00») in minutes since midnight;
// null when the cell has no time. Without an end the activity is a single moment.
export function rangoHora(hora: string) {
  const horas = [...hora.matchAll(/(\d{1,2})[:.h](\d{2})/g)].map(m => Number(m[1]) * 60 + Number(m[2])).filter(m => m < 1440);
  if (!horas.length) return null;
  return { inicio: horas[0], fin: Math.max(horas[0], horas[1] ?? horas[0]) };
}

// Minutes since midnight in the visitor's time zone, the same clock as the programme times.
export const minutosAhora = (fecha = new Date()) => fecha.getHours() * 60 + fecha.getMinutes();

export type EstadoHorario = 'pasada' | 'en-curso' | 'sigue' | 'pendiente';
// State of each of today's activities: those already over, those in progress and the next ones to start
// (all that share the earliest pending start). Other days, and activities without a time, get none.
export function estadosDelDia(horas: string[], ahora: number): (EstadoHorario | null)[] {
  const rangos = horas.map(rangoHora);
  const siguiente = Math.min(...rangos.filter(r => r && r.inicio > ahora).map(r => r!.inicio));
  return rangos.map(r => !r ? null : ahora >= r.fin && ahora > r.inicio ? 'pasada'
    : r.inicio <= ahora ? 'en-curso' : r.inicio === siguiente ? 'sigue' : 'pendiente');
}
