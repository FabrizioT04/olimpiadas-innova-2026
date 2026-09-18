import { useState } from 'react';
import { Heart, Share2, Sparkles } from 'lucide-react';

// Recuerda cambiar estas rutas ('/galeria/foto1.jpg', etc.) 
// cuando ya tengas tus fotos reales en la carpeta public/galeria/
const fotosData = [
  { id: 1, title: 'Ceremonia de Inauguración 2026', category: 'Ceremonia', img: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80', likes: 24 },
  { id: 2, title: 'Final de Fútbol - Categoría Sub-12', category: 'Deportes', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop&q=80', likes: 45 },
  { id: 3, title: 'Competencia de Vóley Femenino', category: 'Deportes', img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&auto=format&fit=crop&q=80', likes: 38 },
  { id: 4, title: 'Premiación y Entrega de Medallas', category: 'Premiación', img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop&q=80', likes: 52 },
  { id: 5, title: 'Competencia de Atletismo 100m', category: 'Deportes', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=80', likes: 29 },
  { id: 6, title: 'Barras y Celebración Estudiantil', category: 'Comunidad', img: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=600&auto=format&fit=crop&q=80', likes: 61 },
];

export default function Galeria() {
  const [filtro, setFiltro] = useState('Todos');

  const categorias = ['Todos', 'Ceremonia', 'Deportes', 'Premiación', 'Comunidad'];

  const fotosFiltradas = filtro === 'Todos' 
    ? fotosData 
    : fotosData.filter(f => f.category === filtro);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Cabecera de la sección */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Galería Oficial
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800">Momentos y Fotos 2026</h1>
          <p className="text-sm text-slate-500">Revive los mejores instantes, competencias y celebraciones de las Olimpiadas.</p>
        </div>

        {/* Botones de Filtro por Categoría */}
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

      {/* Grid de Fotos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {fotosFiltradas.map(foto => (
          <div 
            key={foto.id} 
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
          >
            {/* SOLUCIÓN: relative con w-full, height fijo y la imagen en absolute */}
            <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-100 flex-shrink-0">
              <img 
                src={foto.img} 
                alt={foto.title} 
                // text-transparent oculta el texto feo si la imagen no carga en Safari
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 text-transparent"
              />
              <span className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10">
                {foto.category}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <h3 className="font-bold text-slate-800 text-base mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {foto.title}
              </h3>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium mt-auto">
                <button className="flex items-center gap-1.5 hover:text-rose-500 transition-colors">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" /> {foto.likes} Me gusta
                </button>
                <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                  <Share2 className="w-4 h-4" /> Compartir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}