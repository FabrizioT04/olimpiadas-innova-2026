import { ACTIVIDADES, COLORES_HOUSE, FILAS_ACTIVIDAD, IDS_CATEGORIA } from '../../../shared/olimpiadas';

// sessionStorage key of a ranking sent but not yet confirmed, so a reload retries the same operation.
export const CLASIFICACION_PENDIENTE = 'clasificacion-intento-v1';
export const LUGARES = ['1.º', '2.º', '3.º', '4.º'];

export interface Clasificacion {
  version: number; fila: number; categoria: string; actualizado: string;
  puestos: Record<string, number>; puntos?: Record<string, number>;
  // Programme activity (encuentroId or «sabana:<fila>») and its description, e.g. «30/09 · 10:40 · Resistencia».
  actividad?: string; detalle?: string;
}

// Each House holds a distinct place from 1st to 4th: no ties and no missing Houses.
export function puestosCompletos(puestos: unknown): puestos is Record<string, number> {
  if (!puestos || typeof puestos !== 'object') return false;
  const p = puestos as Record<string, unknown>;
  return COLORES_HOUSE.every(h => Number.isSafeInteger(p[h])) && COLORES_HOUSE.map(h => p[h]).sort().join() === '1,2,3,4';
}

export function isClasificacion(value: unknown): value is Clasificacion {
  if (!value || typeof value !== 'object') return false;
  const c = value as Clasificacion;
  return FILAS_ACTIVIDAD.includes(c.fila) && IDS_CATEGORIA.includes(c.categoria) && puestosCompletos(c.puestos)
    && typeof c.actualizado === 'string' && !Number.isNaN(Date.parse(c.actualizado));
}

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ');

// Categories named in a programme cell ("Promesas - 1ª y 2ª, Infantil 3ª y4ª…"); none named means all.
export function categoriasDe(texto: string): string[] {
  const t = normalizar(texto);
  const patrones: [string, RegExp][] = [['promesas', /PROMESAS/], ['infantil', /INFANTIL/], ['junior', /JUNIOR/],
    ['juvenila', /JUVENIL ?A\b/], ['juvenilb', /JUVENIL ?B\b/]];
  const encontradas = patrones.filter(([, re]) => re.test(t)).map(([id]) => id);
  return encontradas.length ? encontradas : [...IDS_CATEGORIA];
}

// In academic challenges each category plays a different game: one ranking per category, in its own column.
export const porCategoria = (fila: number) => ACTIVIDADES.find(a => a.fila === fila)?.grupo === 'Retos Académicos';

// Rankings have no category: points go to the column of the last category taking part.
export function columnaDe(texto: string) {
  const categorias = categoriasDe(texto);
  return categorias[categorias.length - 1];
}

// Score sheet row for a programme name; activities without one (ceremonies) cannot be ranked.
const ALIAS_FILA: [RegExp, number][] = [[/RESISTENCIA/, 16], [/RELEVO|POSTA/, 15], [/VELOCIDAD|25 METROS/, 14],
  [/SALTA SOGA/, 18], [/MICHI/, 19], [/AROS/, 20], [/CANALETA/, 21], [/COMELON/, 22], [/GLOBO/, 23], [/CUCHARA/, 24],
  [/GANCHO/, 25], [/TRES PIERNAS/, 26], [/MATEMATICA/, 27], [/COMUNICACION/, 28], [/DPSC/, 29], [/INGLES/, 30],
  [/\bARTE\b/, 31], [/BARRA/, 34], [/DRILL/, 35], [/SANA CONVIVENCIA|EMBAJADOR/, 36], [/ECO HOUSE/, 37]];
export function filaSugerida(deporte: string) {
  const t = normalizar(deporte);
  return ALIAS_FILA.find(([re]) => re.test(t))?.[1] ?? null;
}

// --- Places decided by matches between two Houses (final and 3rd-place match) ---
export interface PartidoPuesto {
  id: string; fecha: string; hora: string; deporte: string; categoria: string; fase: string; enfrentamiento: string;
  marcador?: { houseA: string; houseB: string; a: number; b: number; estado: string; puntosA?: number; puntosB?: number; integrado?: boolean } | null;
}
export interface Lugar { puesto: number; house: string | null; puntos?: number }
export interface PodioDeportivo { clave: string; deporte: string; categoria: string; final?: PartidoPuesto; tercero?: PartidoPuesto; lugares: Lugar[] }

const FINAL = /\b(1|1ER|1ERO|PRIMER|PRIMERO) ?(Y|-|\/) ?(2|2DO|SEGUNDO)\b/;
const TERCERO = /\b(3|3ER|3ERO|TERCER|TERCERO) ?(Y|-|\/) ?(4|4TO|CUARTO)\b/;
// «1ero Y 2do», «1 Y 2 LUGAR», «3ER Y 4TO PUESTO BALONMANO», «3 Y 4 PUESTO»…
export function tipoPuesto(fase: string): 'final' | 'tercero' | null {
  const t = normalizar(fase);
  return FINAL.test(t) ? 'final' : TERCERO.test(t) ? 'tercero' : null;
}

// The winner takes the better place; a match that is not finished or ends level leaves both undecided.
function lugaresDe(p: PartidoPuesto | undefined, primero: number): Lugar[] {
  const m = p?.marcador;
  if (!m || m.estado !== 'finalizado' || m.a === m.b) return [{ puesto: primero, house: null }, { puesto: primero + 1, house: null }];
  const ganador = m.a > m.b ? [m.houseA, m.puntosA] as const : [m.houseB, m.puntosB] as const;
  const perdedor = m.a > m.b ? [m.houseB, m.puntosB] as const : [m.houseA, m.puntosA] as const;
  const puntos = (valor?: number) => m.integrado && Number.isSafeInteger(valor) ? { puntos: valor } : {};
  return [{ puesto: primero, house: ganador[0], ...puntos(ganador[1]) }, { puesto: primero + 1, house: perdedor[0], ...puntos(perdedor[1]) }];
}

// One podium per sport and category, joining its final and its 3rd-place match (possibly on other days).
export function podiosDeportivos(partidos: PartidoPuesto[]): PodioDeportivo[] {
  const grupos = new Map<string, { final?: PartidoPuesto; tercero?: PartidoPuesto }>();
  // A finished match wins over a pending one; otherwise the latest listed is kept.
  const elegir = (actual: PartidoPuesto | undefined, p: PartidoPuesto) =>
    actual?.marcador?.estado === 'finalizado' && p.marcador?.estado !== 'finalizado' ? actual : p;
  for (const p of partidos) {
    const tipo = tipoPuesto(p.fase), categorias = categoriasDe(p.categoria);
    if (!tipo || categorias.length !== 1) continue;
    const clave = `${normalizar(p.deporte).trim()}|${categorias[0]}`;
    const g = grupos.get(clave) || {};
    g[tipo] = elegir(g[tipo], p);
    grupos.set(clave, g);
  }
  const nombre = (deporte: string) => ACTIVIDADES.find(a => normalizar(a.nombre) === normalizar(deporte).trim())?.nombre
    || deporte.trim().charAt(0).toUpperCase() + deporte.trim().slice(1).toLowerCase();
  const orden = (p: PodioDeportivo) => {
    const i = ACTIVIDADES.findIndex(a => a.nombre === p.deporte);
    return (i < 0 ? 99 : i) * 10 + IDS_CATEGORIA.indexOf(p.categoria);
  };
  return [...grupos].map(([clave, g]) => ({ clave, deporte: nombre((g.final || g.tercero)!.deporte), categoria: clave.split('|')[1],
    final: g.final, tercero: g.tercero, lugares: [...lugaresDe(g.final, 1), ...lugaresDe(g.tercero, 3)] }))
    .sort((a, b) => orden(a) - orden(b));
}

export function hayClasificacionPendiente() {
  try { return !!sessionStorage.getItem(CLASIFICACION_PENDIENTE); } catch { return false; }
}
