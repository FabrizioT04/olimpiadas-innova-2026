import { useState } from 'react';
import { Heart, Sparkles, Download, PlayCircle } from 'lucide-react';

// Estructura preparada para tus archivos de Eco House y demás áreas
const mediaData = [
  // --- CARPETA: Fotos de Asamblea ---
  { 
    id: 1, 
    tipo: 'imagen', 
    title: 'Asamblea Eco House - Sesión 1', 
    category: 'Eco House', 
    // Recuerda: la foto sí la guardas en tu carpeta public/galeria/
    url: '/galeria/asamblea-1.jpg', 
    likes: 42 
  },
  
  // --- CARPETA: Maraquitas 1ero y 2do Grado ---
  { 
    id: 2, 
    tipo: 'video', 
    title: 'Presentación Maraquitas', 
    category: 'Eco House', 
    // Pegarás el link de Drive y le pondrás /preview al final
    url: 'https://drive.google.com/file/d/TU_ID_DEL_VIDEO_AQUI/preview', 
    likes: 85 
  },

  // --- CARPETA: Elaboración de carteles sostenibles ---
  { 
    id: 3, 
    tipo: 'video', 
    title: 'Elaboración de Carteles (3ero y 4to)', 
    category: 'Eco House', 
    // Pegarás el link de Drive y le pondrás /preview al final
    url: 'https://drive.google.com/file/d/OTRO_ID_DE_VIDEO_AQUI/preview', 
    likes: 67 
  },

  // --- BASES DE ÁREAS (Puedes poner PDFs de Drive también) ---
  { 
    id: 4, 
    tipo: 'video', // Usamos 'video' para que el PDF se vea directo en la página
    title: 'Lineamientos Oficiales de Ciencias', 
    category: 'Bases de Áreas', 
    url: 'https://drive.google.com/file/d/ID_DEL_PDF_AQUI/preview', 
    likes: 15 
  },

  // --- ACTIVIDADES DEPORTIVAS ---
  { 
    id: 5, 
    tipo: 'imagen', 
    title: 'Competencia de Relevos', 
    category: 'Actividades', 
    url: '/galeria/relevos.jpg', 
    likes: 56 
  }
];

export default function Galeria() {
  const [filtro, setFiltro] = useState('Todos');

  // Categorías de filtro
  const categorias = ['Todos', 'Eco House', 'Bases de Áreas', 'Actividades', 'General'];

  const mediaFiltrada = filtro === 'Todos' 
    ? mediaData 
    : mediaData.filter(m => m.category === filtro);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Archivo Oficial
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800">Recursos y Galería</h1>
          <p className="text-sm text-slate-500">Explora proyectos Eco House, fotos y videos de las olimpiadas.</p>
        </div>

        {/* Botones de Filtro */}
        <div className="flex flex-wrap gap-2">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filtro === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Contenido (Fotos y Videos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mediaFiltrada.map(item => (
          <div 
            key={item.id} 
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
          >
            {/* Contenedor Multimedia */}
            <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900 flex-shrink-0 flex items-center justify-center">
              
              {item.tipo === 'imagen' ? (
                <img 
                  src={item.url} 
                  alt={item.title} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 text-transparent"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg width%3D%22200%22 height%3D%22200%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 200 200%22 preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%3E.bg%7Bfill%3A%23f1f5f9%3B%7D.text%7Bfill%3A%2394a3b8%3Bfont-family%3Aui-sans-serif%2Csystem-ui%2C-apple-system%2CBlinkMacSystemFont%2C%22Segoe%20UI%22%2CRoboto%2C%22Helvetica%20Neue%22%2CArial%2Csans-serif%3Bfont-size%3A14px%3Bfont-weight%3A600%3B%7D%3C%2Fstyle%3E%3C%2Fdefs%3E%3Crect class%3D%22bg%22 width%3D%22200%22 height%3D%22200%22%2F%3E%3Ctext class%3D%22text%22 x%3D%2250%25%22 y%3D%2250%25%22 dominant-baseline%3D%22middle%22 text-anchor%3D%22middle%22%3EImagen%20pendiente%3C%2Ftext%3E%3C%2Fsvg%3E';
                  }}
                />
              ) : (
                <iframe 
                  src={item.url} 
                  title={item.title}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              )}

              <span className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10 flex items-center gap-1.5">
                {item.tipo === 'video' && <PlayCircle className="w-3 h-3 text-red-400" />}
                {item.category}
              </span>
            </div>

            {/* Información inferior */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <h3 className="font-bold text-slate-800 text-base mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {item.title}
              </h3>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium mt-auto">
                <button className="flex items-center gap-1.5 hover:text-rose-500 transition-colors">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" /> {item.likes}
                </button>
                {item.tipo === 'imagen' && (
                  <a 
                    href={item.url} 
                    download 
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg"
                  >
                    <Download className="w-4 h-4" /> Ver foto
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}