import { COLORES_HOUSE, FILAS_ACTIVIDAD, IDS_CATEGORIA } from '../../../shared/olimpiadas';

// sessionStorage key of a ranking sent but not yet confirmed, so a reload retries the same operation.
export const CLASIFICACION_PENDIENTE = 'clasificacion-intento-v1';
export const LUGARES = ['1.º', '2.º', '3.º', '4.º'];

export interface Clasificacion {
  version: number; fila: number; categoria: string; actualizado: string;
  puestos: Record<string, number>; puntos?: Record<string, number>;
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

// Score sheet row suggested for a programme name; the referee can still choose another one.
const ALIAS_FILA: [RegExp, number][] = [[/RESISTENCIA/, 16], [/RELEVO|POSTA/, 15], [/VELOCIDAD|25 METROS/, 14],
  [/SALTA SOGA/, 18], [/MICHI/, 19], [/AROS/, 20], [/CANALETA/, 21], [/COMELON/, 22], [/GLOBO/, 23], [/CUCHARA/, 24],
  [/GANCHO/, 25], [/TRES PIERNAS/, 26], [/MATEMATICA/, 27], [/COMUNICACION/, 28], [/DPSC/, 29], [/INGLES/, 30],
  [/\bARTE\b/, 31], [/BARRA/, 34], [/DRILL/, 35], [/SANA CONVIVENCIA|EMBAJADOR/, 36], [/ECO HOUSE/, 37]];
export function filaSugerida(deporte: string) {
  const t = normalizar(deporte);
  return ALIAS_FILA.find(([re]) => re.test(t))?.[1] ?? null;
}

export function hayClasificacionPendiente() {
  try { return !!sessionStorage.getItem(CLASIFICACION_PENDIENTE); } catch { return false; }
}
