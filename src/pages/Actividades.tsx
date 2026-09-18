import { useState } from 'react';
import { 
  BookOpen, Calculator, Users, MessageSquare, Palette, 
  ChevronDown, ChevronUp, Clock, Flag, PenTool, User
} from 'lucide-react';

// Datos extraídos de tus capturas
const actividadesData = [
  // --- COMUNICACIÓN ---
  {
    id: 'c1',
    category: 'Comunicación',
    title: 'Cuenta Cuentos',
    grades: 'Promesas • 1° y 2° grado',
    description: 'Crea un cuento o historia sobre fiestas patrias o el Perú, con apoyo familiar y recursos del docente.',
    tags: [{ icon: Users, text: '4 por house' }, { icon: Flag, text: 'Tema: Fiestas Patrias / Perú' }],
    rules: '1. El cuento debe ser original. 2. Tiempo máximo de presentación: 3 minutos. 3. Se evaluará creatividad y expresión corporal.'
  },
  {
    id: 'c2',
    category: 'Comunicación',
    title: 'Lucha Libro',
    grades: 'Infantil • 3° - 4°',
    description: 'Redacta una historia original en 5 minutos incluyendo 3 palabras sorpresa, presentándote con un atuendo temático.',
    tags: [{ icon: Clock, text: '5 min redacción' }, { icon: User, text: 'Atuendo temático' }, { icon: PenTool, text: '3 palabras sorpresa' }],
    rules: '1. El participante sube al escenario con máscara/atuendo. 2. Se revelan las 3 palabras. 3. Tiene 5 minutos exactos para escribir en la laptop proyectada.'
  },
  // --- MATEMÁTICA ---
  {
    id: 'm1',
    category: 'Matemática',
    title: 'Replicando Figuras con Pattern Blocks',
    grades: 'Promesas • 1° y 2° grado',
    description: 'En equipo replican con piezas geométricas de colores la figura proyectada. Gana quien lo haga con mayor precisión y menor tiempo.',
    tags: [{ icon: Users, text: '4 por house' }, { icon: Clock, text: '4 rondas (3 a 5 min)' }],
    rules: '1. Solo se pueden usar las piezas entregadas. 2. El cronómetro se detiene cuando el equipo grita "¡Listo!".'
  },
  {
    id: 'm2',
    category: 'Matemática',
    title: '¡Corre, Resuelve y Gana!',
    grades: 'Juvenil B • 9°, 10° y 11°',
    description: 'Carrera de postas matemática: cada relevo corre a la Estación Matemática, resuelve su ejercicio y espera validación del juez antes de dar el cambio.',
    tags: [{ icon: Users, text: '3 por house (1 por grado)' }, { icon: Flag, text: 'Carrera de postas' }],
    rules: '1. Si la respuesta es incorrecta, hay penalidad de 10 segundos. 2. No se puede avanzar sin la firma del juez.'
  },
  // --- DPSC ---
  {
    id: 'd1',
    category: 'DPSC',
    title: 'Rayuela en Quechua',
    grades: 'Infantil • 3° y 4° grado',
    description: '¡Salta y cuenta en quechua! A medida que avanzan en la rayuela, deben mencionar los números en quechua en orden correcto.',
    tags: [{ icon: Users, text: '4 por house' }, { icon: MessageSquare, text: 'Números en quechua' }],
    rules: '1. Pisar la línea invalida el turno. 2. La pronunciación debe ser clara.'
  },
  // --- INGLÉS ---
  {
    id: 'i1',
    category: 'Inglés',
    title: '"Building a Story"',
    grades: 'Promesas • 1° y 2° grado',
    description: 'Cada house crea y comparte oralmente 4 oraciones usando 4 flashcards y un prompt elegido de una lista.',
    tags: [{ icon: Users, text: '4 por house' }, { icon: Clock, text: '10 min por house' }],
    rules: '1. Uso obligatorio de las 4 flashcards. 2. Se evalúa pronunciación y coherencia.'
  },
  // --- ARTE ---
  {
    id: 'a1',
    category: 'Arte',
    title: '"Bailando con las máscaras mágicas"',
    grades: 'Promesas • 1° y 2° grado',
    description: 'Diseñan una máscara sencilla inspirada en una tradición peruana y participan en un juego de baile y dramatización en equipo.',
    tags: [{ icon: Users, text: '10 por house (5+5)' }, { icon: Clock, text: '20 min' }],
    rules: '1. Materiales reciclados preferentemente. 2. Todos los miembros deben participar en la coreografía.'
  }
];

// Helper para asignar iconos por categoría
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Comunicación': return <BookOpen className="w-8 h-8" />;
    case 'Matemática': return <Calculator className="w-8 h-8" />;
    case 'DPSC': return <Users className="w-8 h-8" />;
    case 'Inglés': return <PenTool className="w-8 h-8" />;
    case 'Arte': return <Palette className="w-8 h-8" />;
    default: return <Flag className="w-8 h-8" />;
  }
};

export default function Actividades() {
  const [filtro, setFiltro] = useState('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categorias = ['Todos', 'Comunicación', 'Matemática', 'DPSC', 'Inglés', 'Arte', 'Deportes'];

  const actividadesFiltradas = filtro === 'Todos' 
    ? actividadesData 
    : actividadesData.filter(a => a.category === filtro);

  const toggleRules = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      
      {/* Filtros de Categorías */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              filtro === cat
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            {/* Pequeño icono en el filtro si se desea, por ahora texto limpio */}
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Actividades */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {actividadesFiltradas.map((act) => (
          <div key={act.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col h-full">
            
            {/* Cabecera Azul Oscuro */}
            <div className="bg-[#1e2e4a] pt-8 pb-12 px-6 flex flex-col items-center text-white relative">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3 backdrop-blur-sm border border-white/10">
                {getCategoryIcon(act.category)}
              </div>
              <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {act.category}
              </span>
            </div>

            {/* Cuerpo Blanco (con borde redondeado superpuesto hacia arriba) */}
            <div className="bg-white rounded-t-[2rem] -mt-6 relative z-10 flex-1 flex flex-col p-6">
              
              <h3 className="text-xl font-bold text-slate-800 mb-3 leading-tight">
                {act.title}
              </h3>
              
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full w-fit mb-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                {act.grades}
              </div>

              <p className="text-sm text-slate-500 mb-6 flex-1">
                {act.description}
              </p>

              {/* Tags/Etiquetas */}
              <div className="flex flex-wrap gap-2 mb-6">
                {act.tags.map((tag, idx) => {
                  const TagIcon = tag.icon;
                  return (
                    <span key={idx} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                      <TagIcon className="w-3.5 h-3.5 text-slate-400" /> {tag.text}
                    </span>
                  );
                })}
              </div>

              {/* Botón y Sección de Reglas Desplegable */}
              <div className="mt-auto border-t border-slate-100 pt-4">
                <button 
                  onClick={() => toggleRules(act.id)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors py-2 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl"
                >
                  {expandedId === act.id ? (
                    <><ChevronUp className="w-4 h-4" /> Ocultar reglas</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Ver reglas</>
                  )}
                </button>

                {/* Acordeón de reglas */}
                {expandedId === act.id && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 animate-in fade-in slide-in-from-top-2 duration-200">
                    <strong className="block text-slate-800 mb-2">Reglamento Específico:</strong>
                    <p className="whitespace-pre-line">{act.rules}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}