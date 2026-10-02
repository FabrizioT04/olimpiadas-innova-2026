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

// Categories explicitly named in a programme cell ("Promesas - 1ª y 2ª, Infantil 3ª y4ª…"), possibly none.
export function categoriasNombradas(texto: string): string[] {
  const t = normalizar(texto);
  const patrones: [string, RegExp][] = [['promesas', /PROMESAS/], ['infantil', /INFANTIL/], ['junior', /JUNIOR/],
    ['juvenila', /JUVENIL ?A\b/], ['juvenilb', /JUVENIL ?B\b/]];
  return patrones.filter(([, re]) => re.test(t)).map(([id]) => id);
}

// Categories taking part in a programme cell; none named means all.
export function categoriasDe(texto: string): string[] {
  const encontradas = categoriasNombradas(texto);
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

// Festive programme items (welcome, Bailetón, award ceremony…): no match between two Houses, no score
// sheet row and no sport, so nothing can be scored for them.
export function sinPuntaje(p: { deporte: string; enfrentamiento: string }) {
  const deporte = normalizar(p.deporte).trim();
  return !/\bVS\b/.test(normalizar(p.enfrentamiento)) && filaSugerida(p.deporte) === null
    && !ACTIVIDADES.some(a => normalizar(a.nombre) === deporte);
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

// --- Rankings whose programme activity no longer exists ---
// A programme activity is identified by its date, time, name, category, teams, phase and place in Sheets.
// Editing any of them (e.g. fixing a typo in the name) leaves its ranking without an activity: its points
// stay in the score sheet, so the panel lists it to be corrected instead of registered again.
const ACTIVIDAD_FIXTURE = /^[0-9a-f]{64}$/;
export function clasificacionesHuerfanas(clasificaciones: Clasificacion[], idsFixture: ReadonlySet<string>) {
  return clasificaciones.filter(c => typeof c.actividad === 'string' && ACTIVIDAD_FIXTURE.test(c.actividad) && !idsFixture.has(c.actividad));
}

// A programme activity probably repeats an orphan ranking when it adds to the same row and column on the
// same day. The detail of a programme ranking starts with its «dd/mm» date.
export function posibleDuplicado(destino: { actividad: string; fila: number; categoria: string; detalle: string }, huerfanas: Clasificacion[]) {
  const dia = destino.detalle.slice(0, 5);
  if (!ACTIVIDAD_FIXTURE.test(destino.actividad) || !/^\d{2}\/\d{2}$/.test(dia)) return undefined;
  return huerfanas.find(c => c.actividad !== destino.actividad && c.fila === destino.fila
    && c.categoria === destino.categoria && (c.detalle || '').slice(0, 5) === dia);
}

// The current programme name for an orphan ranking: the detail of the only programme activity on the same
// day, row and column (e.g. the activity renamed in Sheets). With none or several, the saved detail is kept.
export function detalleVigente(huerfana: Clasificacion, destinos: { actividad: string; fila: number; categoria: string; detalle: string }[]) {
  const coincidencias = destinos.filter(d => posibleDuplicado(d, [huerfana]) === huerfana);
  return coincidencias.length === 1 ? coincidencias[0].detalle : huerfana.detalle;
}

// --- Rankings per category and group ---
// A programme activity that names several categories (e.g. a relay for Promesas, Infantil and Junior) has one
// ranking per category, in its own column. Only in speed races do boys and girls of these categories run
// apart: each group has its own ranking, chosen points, and both add to the same cell.
export const GRUPOS_VELOCIDAD = { fila: 14, categorias: ['promesas', 'infantil', 'junior'],
  grupos: [{ id: 'ninos', nombre: 'Niños' }, { id: 'ninas', nombre: 'Niñas' }] } as const;
export function gruposDe(fila: number, categoria: string): readonly { id: string; nombre: string }[] {
  return fila === GRUPOS_VELOCIDAD.fila && (GRUPOS_VELOCIDAD.categorias as readonly string[]).includes(categoria) ? GRUPOS_VELOCIDAD.grupos : [];
}

// Key of the ranking of one category (and group) of a programme activity: 64 hex characters like an activity
// key, so the server and Apps Script accept it unchanged. It is derived from the activity, category and group
// (eight FNV-1a passes with different seeds), so the same choice always finds its ranking again.
export function claveParcial(encuentroId: string, categoria: string, grupo: string) {
  const texto = `${encuentroId}|${categoria}|${grupo}`;
  let clave = '';
  for (let semilla = 1; semilla <= 8; semilla++) {
    let h = (0x811c9dc5 ^ Math.imul(semilla, 0x9e3779b1)) >>> 0;
    for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 0x01000193) >>> 0;
    clave += h.toString(16).padStart(8, '0');
  }
  return clave;
}

// Every ranking a programme activity can have: the whole activity (its own key) and, when it is split, one per
// category and group. Shared by the panel and the public programme so both find the same rankings.
export function clasificacionesPosibles(p: { encuentroId: string; deporte: string; categoria: string }) {
  const posibles: { clave: string; categoria: string; grupo: string }[] = [{ clave: p.encuentroId, categoria: '', grupo: '' }];
  const fila = filaSugerida(p.deporte);
  if (fila === null) return posibles;
  const nombradas = categoriasNombradas(p.categoria);
  for (const c of nombradas.length > 1 ? nombradas : [columnaDe(p.categoria)])
    for (const g of ['', ...gruposDe(fila, c).map(x => x.id)]) posibles.push({ clave: claveParcial(p.encuentroId, c, g), categoria: c, grupo: g });
  return posibles;
}

// Rankings to show in each programme card, by encuentroId, with the category and group they belong to when
// the activity is split. A ranking left without its activity (its name, time… edited in Sheets) is shown in the
// only unranked activity of the same day, row and column, like the panel's correction does.
export function clasificacionesPorActividad(partidos: { encuentroId?: string; fecha: string; deporte: string; categoria: string }[], clasificaciones: Clasificacion[]) {
  const resultado = new Map<string, { categoria: string; grupo: string; clasificacion: Clasificacion }[]>();
  const conClave = partidos.filter((p): p is typeof p & { encuentroId: string } => typeof p.encuentroId === 'string' && ACTIVIDAD_FIXTURE.test(p.encuentroId));
  const claves = new Set<string>();
  for (const p of conClave) for (const x of clasificacionesPosibles(p)) {
    claves.add(x.clave);
    const clasificacion = clasificaciones.find(c => c.actividad === x.clave);
    if (clasificacion) resultado.set(p.encuentroId, [...(resultado.get(p.encuentroId) || []), { categoria: x.categoria, grupo: x.grupo, clasificacion }]);
  }
  for (const huerfana of clasificacionesHuerfanas(clasificaciones, claves)) {
    const candidatas = conClave.filter(p => {
      const fila = filaSugerida(p.deporte);
      return fila !== null && categoriasNombradas(p.categoria).length <= 1 && !resultado.has(p.encuentroId) && posibleDuplicado(
        { actividad: p.encuentroId, fila, categoria: columnaDe(p.categoria), detalle: `${p.fecha.slice(8, 10)}/${p.fecha.slice(5, 7)}` }, [huerfana]) === huerfana;
    });
    if (new Set(candidatas.map(p => p.encuentroId)).size === 1) resultado.set(candidatas[0].encuentroId, [{ categoria: '', grupo: '', clasificacion: huerfana }]);
  }
  return resultado;
}

export function hayClasificacionPendiente() {
  try { return !!sessionStorage.getItem(CLASIFICACION_PENDIENTE); } catch { return false; }
}
