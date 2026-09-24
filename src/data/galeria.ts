export interface FotoGaleria {
  id: string;
  titulo: string;
  descripcion: string;
  album: 'deportes' | 'eco-house' | 'encuentros';
  url: string;
  fecha?: string;
}

// Añadir aquí únicamente fotografías listas para publicarse.
export const fotosGaleria: FotoGaleria[] = [];
export const albumesGaleria = [
  { id: 'deportes', titulo: 'En la cancha', descripcion: 'Partidos, retos y trabajo en equipo.', color: 'from-blue-600 to-indigo-700' },
  { id: 'eco-house', titulo: 'Espíritu Eco House', descripcion: 'Creatividad y proyectos de nuestras Houses.', color: 'from-emerald-600 to-teal-800' },
  { id: 'encuentros', titulo: 'Juntos celebramos', descripcion: 'Encuentros, barras y momentos de celebración.', color: 'from-orange-500 to-rose-700' },
] as const;
