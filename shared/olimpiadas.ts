// Valores comunes del frontend (src/) y de las funciones de Cloudflare (functions/).
// Apps Script no puede importar este archivo: si cambian las Houses, las categorías o las filas,
// actualiza también apps-script/ArbitrajeSeguro.gs, CodigoCompletoDiagnostico.gs,
// ResultadoUnificado.gs y Marcadores.gs.

// Hoja oficial del fixture; las respuestas de Apps Script se aceptan solo si declaran esta fuente.
export const FIXTURE_FUENTE = '14v7a-zlJpOlnCJ3DzvtUgt3dgj-hxPeiWZqpvpJ-eGg';

// `color` es la clave de la hoja y del backend; `animal` identifica la mascota en el frontend.
export const HOUSES = [
  { color: 'blue', animal: 'dolphins', nombre: 'DOLPHINS', etiqueta: 'Azul · Dolphins' },
  { color: 'white', animal: 'seagulls', nombre: 'SEAGULLS', etiqueta: 'Blanco · Seagulls' },
  { color: 'green', animal: 'eagles', nombre: 'EAGLES', etiqueta: 'Verde · Eagles' },
  { color: 'orange', animal: 'horses', nombre: 'HORSES', etiqueta: 'Anaranjado · Horses' },
] as const;
export type ColorHouse = typeof HOUSES[number]['color'];
export const COLORES_HOUSE: readonly string[] = HOUSES.map(h => h.color);

export const CATEGORIAS = [
  { id: 'promesas', nombre: 'Promesas', grados: '1.º y 2.º' },
  { id: 'infantil', nombre: 'Infantil', grados: '3.º y 4.º' },
  { id: 'junior', nombre: 'Junior', grados: '5.º y 6.º' },
  { id: 'juvenila', nombre: 'Juvenil A', grados: '7.º y 8.º' },
  { id: 'juvenilb', nombre: 'Juvenil B', grados: '9.º, 10.º y 11.º' },
] as const;
export const IDS_CATEGORIA: readonly string[] = CATEGORIAS.map(c => c.id);

// `fila` es la fila de la hoja «Sábana». `nombre` debe coincidir con el deporte del fixture
// (se compara sin tildes, espacios ni mayúsculas); `etiqueta` es el texto del formulario.
export const ACTIVIDADES = [
  { fila: 8, nombre: 'Futsal', etiqueta: 'Futsal', grupo: 'Deportes Principales' },
  { fila: 9, nombre: 'Vóley', etiqueta: 'Vóley', grupo: 'Deportes Principales' },
  { fila: 10, nombre: 'Pasabola', etiqueta: 'Pasabola', grupo: 'Deportes Principales' },
  { fila: 11, nombre: 'Balonmano', etiqueta: 'Balonmano', grupo: 'Deportes Principales' },
  { fila: 12, nombre: 'Básquet', etiqueta: 'Básquet', grupo: 'Deportes Principales' },
  { fila: 13, nombre: 'Coneball', etiqueta: 'Coneball', grupo: 'Deportes Principales' },
  { fila: 17, nombre: 'Bádminton', etiqueta: 'Bádminton', grupo: 'Deportes Principales' },
  { fila: 14, nombre: 'Carrera 25 metros', etiqueta: 'Carrera 25 metros', grupo: 'Gynkana y Carreras' },
  { fila: 15, nombre: 'Carrera de relevos', etiqueta: 'Carrera de relevos', grupo: 'Gynkana y Carreras' },
  { fila: 16, nombre: 'Carrera de resistencia', etiqueta: 'Carrera de Resistencia', grupo: 'Gynkana y Carreras' },
  { fila: 18, nombre: 'Salta soga', etiqueta: 'Salta Soga', grupo: 'Gynkana y Carreras' },
  { fila: 19, nombre: 'Carrera de Michi', etiqueta: 'Carrera de Michi', grupo: 'Gynkana y Carreras' },
  { fila: 20, nombre: 'Aros musicales', etiqueta: 'Aros Musicales', grupo: 'Gynkana y Carreras' },
  { fila: 21, nombre: 'Carrera de canaletas', etiqueta: 'Carrera de Canaletas', grupo: 'Gynkana y Carreras' },
  { fila: 22, nombre: 'Comelones', etiqueta: 'Comelones', grupo: 'Gynkana y Carreras' },
  { fila: 23, nombre: 'Revienta globos', etiqueta: 'Carrera revienta globos', grupo: 'Gynkana y Carreras' },
  { fila: 24, nombre: 'La cuchara y el limón', etiqueta: 'La cuchara y el limón', grupo: 'Gynkana y Carreras' },
  { fila: 25, nombre: 'Carrera de ganchos', etiqueta: 'Carrera de Ganchos', grupo: 'Gynkana y Carreras' },
  { fila: 26, nombre: 'Carrera de tres piernas', etiqueta: 'Carrera de Tres Piernas', grupo: 'Gynkana y Carreras' },
  { fila: 27, nombre: 'Matemática', etiqueta: 'Matemática (Tangram, Retos)', grupo: 'Retos Académicos' },
  { fila: 28, nombre: 'Comunicación', etiqueta: 'Comunicación (Cuentos, Debate)', grupo: 'Retos Académicos' },
  { fila: 29, nombre: 'DPSC', etiqueta: 'DPSC (Juegos Andinos, Taptana)', grupo: 'Retos Académicos' },
  { fila: 30, nombre: 'Inglés', etiqueta: 'Inglés (English Race, Lyrics War)', grupo: 'Retos Académicos' },
  { fila: 31, nombre: 'Arte', etiqueta: 'Arte (Máscaras, Mural, Canto)', grupo: 'Retos Académicos' },
  { fila: 34, nombre: 'Barras', etiqueta: 'Concurso de Barras', grupo: 'Eventos Especiales y Reconocimientos' },
  { fila: 35, nombre: 'Drill', etiqueta: 'Concurso de Drill Coreográfico', grupo: 'Eventos Especiales y Reconocimientos' },
  { fila: 36, nombre: 'Sana convivencia', etiqueta: 'Reconocimiento: Sana Convivencia', grupo: 'Eventos Especiales y Reconocimientos' },
  { fila: 37, nombre: 'Eco House', etiqueta: 'Reconocimiento: Eco House', grupo: 'Eventos Especiales y Reconocimientos' },
] as const;
export const FILAS_ACTIVIDAD: readonly number[] = ACTIVIDADES.map(a => a.fila);
