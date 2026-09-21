export const FIXTURE_URL = import.meta.env.VITE_FIXTURE_URL || 'https://script.google.com/macros/s/AKfycbw6v_-hQor-DMh7Mg2qtodwpuIiXIuCOqqtV3mY3Gs5ueqZBrDH8LORqa7RTMWhIH1uqw/exec';
export const HOUSE_NAMES: Record<string,string> = { white:'Blanco · Seagulls',blue:'Azul · Dolphins',orange:'Anaranjado · Horses',green:'Verde · Eagles' };
export const STATUS_NAMES = { pendiente:'Pendiente', 'en-juego':'En juego', finalizado:'Finalizado' };
export interface Marcador { version:number; houseA:string; houseB:string; a:number; b:number; estado:keyof typeof STATUS_NAMES; actualizado:string }
export function isMarcador(value: unknown): value is Marcador {
  if (!value || typeof value !== 'object') return false;
  const m = value as Marcador;
  return Number.isSafeInteger(m.version) && m.version > 0 && Object.hasOwn(HOUSE_NAMES,m.houseA) && Object.hasOwn(HOUSE_NAMES,m.houseB)
    && m.houseA !== m.houseB && Number.isSafeInteger(m.a) && m.a >= 0 && m.a <= 999 && Number.isSafeInteger(m.b) && m.b >= 0 && m.b <= 999
    && Object.hasOwn(STATUS_NAMES,m.estado) && typeof m.actualizado === 'string' && !Number.isNaN(Date.parse(m.actualizado));
}
export interface Encuentro {
  encuentroId:string; fecha:string; hora:string; deporte:string; categoria:string; enfrentamiento:string;
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
