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
