export const FIXTURE_URL = import.meta.env.VITE_FIXTURE_URL || 'https://script.google.com/macros/s/AKfycbw6v_-hQor-DMh7Mg2qtodwpuIiXIuCOqqtV3mY3Gs5ueqZBrDH8LORqa7RTMWhIH1uqw/exec';
export const HOUSE_NAMES: Record<string,string> = { white:'Blanco · Seagulls',blue:'Azul · Dolphins',orange:'Anaranjado · Horses',green:'Verde · Eagles' };
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
export const CATEGORIAS = {promesas:'Promesas',infantil:'Infantil',junior:'Junior',juvenila:'Juvenil A',juvenilb:'Juvenil B'};
export const ACTIVIDADES:Record<string,string> = {'8':'Futsal','9':'Vóley','10':'Pasabola','11':'Balonmano','12':'Básquet','13':'Coneball','14':'Carrera 25 metros','15':'Carrera de relevos','16':'Carrera de resistencia','17':'Bádminton','18':'Salta soga','19':'Carrera de Michi','20':'Aros musicales','21':'Carrera de canaletas','22':'Comelones','23':'Revienta globos','24':'La cuchara y el limón','25':'Carrera de ganchos','26':'Carrera de tres piernas','27':'Matemática','28':'Comunicación','29':'DPSC','30':'Inglés','31':'Arte','34':'Barras','35':'Drill','36':'Sana convivencia','37':'Eco House'};
export function destinoSugerido(p?:Actividad) {
  const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,'');
  const category=norm(p?.categoria || '');
  return {categoria:Object.keys(CATEGORIAS).find(k=>category.startsWith(k)) || '',
    fila:Object.entries(ACTIVIDADES).find(([,v])=>norm(v) === norm(p?.deporte || ''))?.[0] || ''};
}
