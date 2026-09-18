import { useState } from 'react';
import { 
  BookOpen, Calculator, Users, MessageSquare, Palette, 
  ChevronDown, ChevronUp, Clock, Flag, PenTool, Sparkles
} from 'lucide-react';

const actividadesData = [
  // --- COMUNICACIÓN ---
  {
    id: 'c1',
    category: 'Comunicación',
    title: 'Cuenta Cuentos',
    grades: 'Promesas • 1° y 2° grado',
    description: 'Crea un cuento o historia sobre fiestas patrias o el Perú, con apoyo familiar y recursos del docente.',
    tags: [{ icon: Users, text: '4 por house' }, { icon: Flag, text: 'Tema: Fiestas Patrias' }],
    rules: '1. El cuento debe ser original.\n2. Tiempo máximo de presentación: 3 minutos.\n3. Se evaluará creatividad y expresión corporal.'
  },
  {
    id: 'c2',
    category: 'Comunicación',
    title: 'Lucha Libro',
    grades: 'Infantil • 3° - 4°',
    description: 'Redacta una historia original en 5 minutos incluyendo 3 palabras sorpresa, presentándote con un atuendo temático.',
    tags: [{ icon: Clock, text: '5 min redacción' }, { icon: Users, text: 'Atuendo temático' }, { icon: PenTool, text: '3 palabras sorpresa' }],
    rules: '1. El participante sube al escenario con atuendo.\n2. Se revelan las 3 palabras.\n3. Tiene 5 minutos exactos para escribir en la laptop.'
  },
  // --- MATEMÁTICA ---
  {
    id: 'm1',
    category: 'Matemática',
    title: 'Replicando Figuras',
    grades: 'Promesas • 1° y 2° grado',
    description: 'En equipo replican con piezas geométricas de colores la figura proyectada. Gana quien lo haga con mayor precisión y menor tiempo.',
    tags: [{ icon: Users, text: '4 por house' }, { icon: Clock, text: '4 rondas (3-5 min)' }],
    rules: '1. Solo se pueden usar las piezas entregadas.\n2. El cronómetro se detiene cuando el equipo grita "¡Listo!".'
  },
  {
    id: 'm2',
    category: 'Matemática',
    title: '¡Corre, Resuelve y Gana!',
    grades: 'Juvenil B • 9°, 10° y 11°',
    description: 'Carrera de postas matemática: corre a la Estación Matemática, resuelve tu ejercicio y espera validación del juez antes del cambio.',
    tags: [{ icon: Users, text: '3 por house' }, { icon: Flag, text: 'Carrera de postas' }],
    rules: '1. Si la respuesta es incorrecta, hay penalidad de 10 segundos.\n2. No se puede avanzar sin la firma del juez.'
  },
  // --- DPSC ---
  {
    id: 'd1',
    category: 'DPSC',
    title: 'Rayuela en Quechua',
    grades: 'Infantil • 3° y 4° grado',
    description: '¡Salta y cuenta en quechua! A medida que avanzan en la rayuela, deben mencionar los números en orden correcto.',
    tags: [{ icon: Users, text: '4 por house' }, { icon: MessageSquare, text: 'Números en quechua' }],
    rules: '1. Pisar la línea invalida el turno.\n2. La pronunciación debe ser clara.'
  },
  // --- INGLÉS ---
  {
    id: 'i1',
    category: 'Inglés',
    title: 'Building a Story',
    grades: 'Promesas • 1° y 2° grado',
    description: 'Cada house crea y comparte oralmente 4 oraciones usando 4 flashcards y un prompt elegido de una lista.',
    tags: [{ icon: Users, text: '4 por house' }, { icon: Clock, text: '10 min por house' }],
    rules: '1. Uso obligatorio de las 4 flashcards.\n2. Se evalúa pronunciación y coherencia.'
  },
  // --- ARTE ---
  {
    id: 'a1',
    category: 'Arte',
    title: 'Máscaras Mágicas',
    grades: 'Promesas • 1° y 2° grado',
    description: 'Diseñan una máscara sencilla inspirada en una tradición peruana y participan en un juego de baile en equipo.',
    tags: [{ icon: Users, text: '10 por house (5+5)' }, { icon: Clock, text: '20 min' }],
    rules: '1. Materiales reciclados preferentemente.\n2. Todos los miembros deben participar.'
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Comunicación': return <BookOpen className="w-6 h-6" />;
    case 'Matemática': return <Calculator className="w-6 h-6" />;
    case 'DPSC': return <Users className="w-6 h-6" />;
    case 'Inglés': return <PenTool className="w-6 h-6" />;
    case 'Arte': return <Palette className="w-6 h-6" />;
    default: return <Flag className="w-6 h-6" />;
  }
};

export default function Actividades() {
  const [filtro, setFiltro] = useState('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categorias = ['Todos', 'Comunicación', 'Matemática', 'DPSC', 'Inglés', 'Arte'];

  const actividadesFiltradas = filtro === 'Todos' 
    ? actividadesData 
    : actividadesData.filter(a => a.category === filtro);

  const toggleRules = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      
      {/* Cabecera Clave de Diseño */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Juegos y Disciplinas
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800">Actividades y Reglas</h1>
          <p className="text-sm text-slate-500">Consulta los lineamientos, integrantes y reglamentos de cada competencia.</p>
        </div>

        {/* Botones de Filtro - Mismo estilo que Galería */}
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

      {/* Grid de Tarjetas (Estilo Limpio y Luminoso) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actividadesFiltradas.map((act) => (
          <div 
            key={act.id} 
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
          >
            
            {/* Ícono y Etiqueta Superior */}
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                {getCategoryIcon(act.category)}
              </div>
              <span className="bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {act.category}
              </span>
            </div>

            {/* Título y Grados */}
            <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
              {act.title}
            </h3>
            
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              {act.grades}
            </div>

            {/* Descripción */}
            <p className="text-sm text-slate-500 mb-6 flex-1 leading-relaxed">
              {act.description}
            </p>

            {/* Etiquetas / Características */}
            <div className="flex flex-wrap gap-2 mb-6">
              {act.tags.map((tag, idx) => {
                const TagIcon = tag.icon;
                return (
                  <span key={idx} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                    <TagIcon className="w-3.5 h-3.5 text-slate-400" /> {tag.text}
                  </span>
                );
              })}
            </div>

            {/* Botón de Reglas Desplegable */}
            <div className="mt-auto border-t border-slate-100 pt-4">
              <button 
                onClick={() => toggleRules(act.id)}
                className={`w-full flex items-center justify-center gap-2 text-sm font-bold transition-colors py-2.5 rounded-xl border ${
                  expandedId === act.id 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                    : 'bg-slate-50 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 border-slate-100 hover:border-indigo-100'
                }`}
              >
                {expandedId === act.id ? (
                  <><ChevronUp className="w-4 h-4" /> Ocultar reglas</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> Leer reglamento</>
                )}
              </button>

              {/* Contenido Acordeón de reglas */}
              {expandedId === act.id && (
                <div className="mt-3 p-4 bg-indigo-50/40 rounded-xl border border-indigo-100/50 text-sm text-slate-700">
                  <p className="whitespace-pre-line leading-relaxed font-medium">
                    {act.rules}
                  </p>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}