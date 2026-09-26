import { basesOficiales } from '../data/bases';
import { useState } from 'react';
import { 
  BookOpen, Calculator, Users, MessageSquare, Palette, 
  ChevronDown, Clock, Flag, PenTool, Sparkles
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
  // Resumen de las bases de Matemática: páginas 2–7 del documento recibido.
  {
    id: 'm1', category: 'Matemática', title: 'Replicando figuras con pattern blocks',
    grades: 'Promesas • 1° y 2° grado',
    description: 'Replican una figura proyectada con piezas geométricas, respetando su orientación y distribución.',
    tags: [{ icon: Users, text: '4 titulares + 2 suplentes por House' }, { icon: Clock, text: '4–6 rondas de 3–5 min' }],
    rules: 'Cómo se gana: 1 punto por ronda al equipo que replique con mayor precisión y en menor tiempo. En empate se considera la alineación y orientación. Se suman los puntos de las rondas.\nMateriales: piezas geométricas, figura proyectada y superficie de trabajo.\nReglas clave: usar solo el propio set, no intercambiar piezas, respetar el tiempo y trabajar en equipo.'
  },
  ...[
    { id: 'm-infantil', grades: 'Infantil • 3° y 4° grado' },
    { id: 'm-junior', grades: 'Junior • 5° y 6° grado' },
    { id: 'm-juvenila', grades: 'Juvenil A • 7° y 8° grado' },
  ].map(categoria => ({
    ...categoria, category: 'Matemática', title: 'Resolviendo retos computacionales',
    description: 'Resuelven individualmente 10 retos de lógica y pensamiento computacional. Cada respuesta se deposita en un ánfora.',
    tags: [{ icon: Users, text: '8 titulares + 2 suplentes por House' }, { icon: Clock, text: '30 min · hasta 3 min por reto' }],
    rules: 'Participación: equipo mixto, con 4 titulares y 1 suplente por grado.\nCómo se gana: cada acierto suma un punto; gana la House con la mayor suma de puntos individuales.\nMateriales: preguntas proyectadas, 10 hojas A7 por participante, plumón rojo y ánfora.\nReglas clave: no cambiar una respuesta depositada ni comunicarse con compañeros del mismo equipo. Las marcas dobles o poco claras invalidan la respuesta.'
  })),
  {
    id: 'm2', category: 'Matemática', title: '¡Corre, Resuelve y Gana!',
    grades: 'Juvenil B • 9°, 10° y 11° grado',
    description: 'Recorren estaciones de matemática básica, geometría y razonamiento. Deben resolver correctamente cada problema antes de avanzar.',
    tags: [{ icon: Users, text: 'Equipos de 3–4 estudiantes' }, { icon: Clock, text: '30–45 min' }],
    rules: 'Cómo se gana: completar el recorrido con los problemas correctamente resueltos en el menor tiempo. Cada respuesta correcta vale 10 puntos; una incorrecta, 0.\nMateriales: conos, tarjetas de problemas, cronómetro y tablero de respuestas.\nRegla clave: solo se avanza a la siguiente estación tras resolver correctamente el problema.'
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
  const areas = [...new Set([...actividadesData.map(a => a.category), ...basesOficiales.map(b => b.area)])];
  return <div translate="no" className="notranslate mx-auto max-w-7xl space-y-8 pb-12">
    <header>
      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600"><Sparkles aria-hidden="true" size={16}/><span>Juegos y disciplinas</span></p>
      <h1 className="text-3xl font-black text-slate-800">Actividades y Reglas</h1>
      <p className="mt-2 text-sm text-slate-500">Encuentra las actividades y sus bases oficiales reunidas por área.</p>
    </header>
    <nav aria-label="Filtrar por área" className="flex flex-wrap gap-2">
      {['Todos', ...areas].map(area => <button key={area} onClick={() => setFiltro(area)} aria-pressed={filtro === area} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${filtro === area ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-indigo-50'}`}><span>{area}</span></button>)}
    </nav>
    <div className="space-y-8">{areas.filter(area => filtro === 'Todos' || filtro === area).map(area => {
      const documentos = basesOficiales.filter(b => b.area === area);
      const actividades = actividadesData.filter(a => a.category === area);
      return <section key={area} aria-label={area} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
        <h2 className="mb-5 flex items-center gap-3 text-2xl font-bold text-slate-800"><span className="text-indigo-600">{getCategoryIcon(area)}</span><span>{area}</span></h2>
        {area !== 'Matemática' && <div className="mb-6">
          <h3 className="mb-3 text-sm font-bold text-slate-700">Bases oficiales</h3>
          {documentos.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{documentos.map(base => <article key={base.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <h4 className="font-bold text-slate-800">{base.titulo}</h4>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-indigo-600">
              <a href={base.url} target="_blank" rel="noreferrer" aria-label={`Ver PDF: ${base.titulo}`} className="underline underline-offset-4">Ver PDF</a>
              <a href={base.url} download aria-label={`Descargar: ${base.titulo}`} className="underline underline-offset-4">Descargar</a>
            </div>
          </article>)}</div> : <p className="text-sm text-slate-500">El documento oficial de esta área aún no está disponible.</p>}
        </div>}
        {actividades.length > 0 && <div>
          <h3 className="mb-4 text-sm font-bold text-slate-700">Actividades</h3>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{actividades.map(act => <article key={act.id} className="flex flex-col rounded-2xl border border-slate-200 p-5">
            <h4 className="text-xl font-bold text-slate-800">{act.title}</h4>
            <p className="mt-2 text-xs font-bold text-indigo-600">{act.grades}</p>
            <p className="my-4 flex-1 text-sm leading-relaxed text-slate-500">{act.description}</p>
            <div className="mb-5 flex flex-wrap gap-2">{act.tags.map((tag, i) => { const Icon = tag.icon; return <span key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600"><Icon aria-hidden="true" size={14}/><span>{tag.text}</span></span>; })}</div>
            <details className="group/reglas border-t border-slate-100 pt-4">
              <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-bold text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-600 [&::-webkit-details-marker]:hidden">
                <ChevronDown aria-hidden="true" size={16} className="transition-transform group-open/reglas:rotate-180"/><span>{area === 'Matemática' ? 'Ver reglas clave' : 'Leer reglamento'}</span>
              </summary>
              <div className="mt-3 rounded-xl bg-indigo-50/50 p-4 text-sm text-slate-700"><p className="whitespace-pre-line leading-relaxed">{act.rules}</p></div>
            </details>
          </article>)}</div>
        </div>}
      </section>;
    })}</div>
  </div>;
}
