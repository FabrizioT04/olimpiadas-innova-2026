export interface FotoGaleria {
  id: string;
  titulo: string;
  descripcion: string;
  album: 'deportes' | 'eco-house' | 'encuentros' | 'convivencia';
  url: string;
  fecha?: string;
}

// Añadir aquí únicamente fotografías listas para publicarse.
export const fotosGaleria: FotoGaleria[] = [13, 12, 11, 8, 7, 2].map(numero => ({
  id: `sana-convivencia-${numero}`,
  titulo: 'Asamblea de sana convivencia',
  descripcion: 'Un momento de nuestra asamblea de sana convivencia.',
  album: 'convivencia',
  url: `/galeria/sana-convivencia/sana-convivencia-${numero}.webp`,
}));
export const albumesGaleria = [
  { id: 'convivencia', titulo: 'Sana convivencia', descripcion: 'Asamblea, diálogo y respeto en nuestra comunidad.', color: 'from-violet-600 to-indigo-700' },
  { id: 'deportes', titulo: 'En la cancha', descripcion: 'Partidos, retos y trabajo en equipo.', color: 'from-blue-600 to-indigo-700' },
  { id: 'eco-house', titulo: 'Espíritu Eco House', descripcion: 'Creatividad y proyectos de nuestras Houses.', color: 'from-emerald-600 to-teal-800' },
  { id: 'encuentros', titulo: 'Juntos celebramos', descripcion: 'Encuentros, barras y momentos de celebración.', color: 'from-orange-500 to-rose-700' },
] as const;
