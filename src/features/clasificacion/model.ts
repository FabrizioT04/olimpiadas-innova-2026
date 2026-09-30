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

export function hayClasificacionPendiente() {
  try { return !!sessionStorage.getItem(CLASIFICACION_PENDIENTE); } catch { return false; }
}
