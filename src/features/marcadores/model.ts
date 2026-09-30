import { ACTIVIDADES as LISTA_ACTIVIDADES, CATEGORIAS as LISTA_CATEGORIAS, HOUSES } from '../../../shared/olimpiadas';

export const HOUSE_NAMES: Record<string,string> = Object.fromEntries(HOUSES.map(h => [h.color, h.etiqueta]));
export const STATUS_NAMES = { pendiente:'Pendiente', 'en-juego':'En juego', finalizado:'Finalizado' };
export interface Marcador { version:number; houseA:string; houseB:string; a:number; b:number; estado:keyof typeof STATUS_NAMES; actualizado:string;
  integrado?:boolean; puntosA?:number; puntosB?:number; fila?:number|null; categoria?:string }
export function isMarcador(value: unknown): value is Marcador {
  if (!value || typeof value !== 'object') return false;
  const m = value as Marcador;
  return Number.isSafeInteger(m.version) && m.version > 0 && Object.hasOwn(HOUSE_NAMES,m.houseA) && Object.hasOwn(HOUSE_NAMES,m.houseB)
    && m.houseA !== m.houseB && Number.isSafeInteger(m.a) && m.a >= 0 && m.a <= 999 && Number.isSafeInteger(m.b) && m.b >= 0 && m.b <= 999
    && Object.hasOwn(STATUS_NAMES,m.estado) && typeof m.actualizado === 'string' && !Number.isNaN(Date.parse(m.actualizado))
    && (m.integrado !== true || ([m.puntosA,m.puntosB].every(p => Number.isSafeInteger(p) && Number(p)>=0 && Number(p)<=10000)
      && (m.estado === 'finalizado' || (m.puntosA === 0 && m.puntosB === 0))));
}
export interface Encuentro {
  encuentroId:string; fecha:string; hora:string; deporte:string; categoria:string; enfrentamiento:string; fase?:string;
  houses:[string,string]; admiteMarcador:boolean; marcador:Marcador|null;
}
export function isEncuentro(value: unknown): value is Encuentro {
  if (!value || typeof value !== 'object') return false;
  const p = value as Encuentro;
  return p.admiteMarcador === true && typeof p.encuentroId === 'string' && /^[0-9a-f]{64}$/.test(p.encuentroId)
    && ['fecha','hora','deporte','categoria','enfrentamiento'].every(k => typeof (p as unknown as Record<string,unknown>)[k] === 'string')
    && Array.isArray(p.houses) && p.houses.length === 2 && p.houses.every(h => Object.hasOwn(HOUSE_NAMES,h))
    && p.houses[0] !== p.houses[1] && (p.marcador === null || isMarcador(p.marcador));
}

// Selection follows the full official programme; scoring eligibility is separate.
export interface Actividad extends Omit<Encuentro, 'houses'> {
  id:string; houses:[string,string]|null; avisos:string[];
}
export function isActividad(value:unknown): value is Actividad {
  if (!value || typeof value !== 'object') return false;
  const p = value as Actividad;
  return ['id','encuentroId','fecha','hora','deporte','categoria','enfrentamiento'].every(k => typeof (p as unknown as Record<string,unknown>)[k] === 'string')
    && Array.isArray(p.avisos) && p.avisos.every(a => typeof a === 'string')
    && typeof p.admiteMarcador === 'boolean';
}
// Activities for all four Houses are ranked in «Clasificación por puestos», not scored as a match.
// The programme marks them in the teams or the category column («TODAS LAS HOUSE»).
export function paraTodasLasHouses(p:{enfrentamiento:string; categoria?:string}) {
  return /\bTODAS\s+LAS\s+HOUSES?\b/.test(`${p.enfrentamiento} ${p.categoria ?? ''}`.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase());
}
export const CATEGORIAS: Record<string,string> = Object.fromEntries(LISTA_CATEGORIAS.map(c => [c.id, c.nombre]));
export const ACTIVIDADES: Record<string,string> = Object.fromEntries(LISTA_ACTIVIDADES.map(a => [String(a.fila), a.nombre]));
export function destinoSugerido(p?:Actividad) {
  const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,'');
  const category=norm(p?.categoria || '');
  return {categoria:Object.keys(CATEGORIAS).find(k=>category.startsWith(k)) || '',
    fila:Object.entries(ACTIVIDADES).find(([,v])=>norm(v) === norm(p?.deporte || ''))?.[0] || ''};
}
