import { useState } from 'react';
import { BookOpen, Calculator, Users, Palette, ChevronDown, Flag, PenTool, Sparkles } from 'lucide-react';
import { basesOficiales } from '../data/bases';
import { actividadesData } from '../data/actividades';

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
  const areas = ['Comunicación', 'Matemática', 'DPSC', 'Inglés', 'Arte', 'Educación Física', 'Drill Gimnástico'];
  return <div translate="no" className="notranslate mx-auto max-w-7xl space-y-8 pb-12">
    <header>
      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600"><Sparkles aria-hidden="true" size={16}/><span>Juegos y disciplinas</span></p>
      <h1 className="text-3xl font-black text-slate-800">Actividades y Reglas</h1>
      <p className="mt-2 text-sm text-slate-500">Consulta cómo participar, los materiales y las reglas de cada actividad, sin salir de la página.</p>
    </header>
    <nav aria-label="Filtrar por área" className="flex flex-wrap gap-2">
      {['Todos', ...areas].map(area => <button key={area} onClick={() => setFiltro(area)} aria-pressed={filtro === area} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${filtro === area ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-indigo-50'}`}><span>{area}</span></button>)}
    </nav>
    <div className="space-y-8">{areas.filter(area => filtro === 'Todos' || filtro === area).map(area => {
      const documentos = basesOficiales.filter(b => b.area === area);
      const actividades = actividadesData.filter(a => a.category === area);
      return <section key={area} aria-label={area} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
        <h2 className="mb-5 flex items-center gap-3 text-2xl font-bold text-slate-800"><span className="text-indigo-600">{getCategoryIcon(area)}</span><span>{area}</span></h2>
        {actividades.length > 0 && <div>
          <h3 className="mb-4 text-sm font-bold text-slate-700">Actividades</h3>
          <div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">{actividades.map(act => <article key={act.id} className="flex flex-col rounded-2xl border border-slate-200 p-5">
            <h4 className="text-xl font-bold text-slate-800">{act.title}</h4>
            <p className="mt-2 text-xs font-bold text-indigo-600">{act.grades}</p>
            <p className="my-4 flex-1 text-sm leading-relaxed text-slate-500">{act.description}</p>
            <div className="mb-5 flex flex-wrap gap-2">{act.tags.map((tag, i) => { const Icon = tag.icon; return <span key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600"><Icon aria-hidden="true" size={14}/><span>{tag.text}</span></span>; })}</div>
            {act.note && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">{act.note}</p>}
            <details className="group/reglas border-t border-slate-100 pt-4">
              <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-bold text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-600 [&::-webkit-details-marker]:hidden">
                <ChevronDown aria-hidden="true" size={16} className="transition-transform group-open/reglas:rotate-180"/><span>Ver reglas clave<span className="sr-only">: {act.title} · {act.grades}</span></span>
              </summary>
              <div className="mt-3 space-y-3 rounded-xl bg-indigo-50/50 p-4 text-sm text-slate-700">
                {act.rules.split('\n').map((rule, index) => <p key={index} className="leading-relaxed">{rule}</p>)}
                {act.source && <a href={act.source.url + '#page=' + act.source.page} target="_blank" rel="noreferrer" className="block text-xs font-semibold text-indigo-700 underline underline-offset-4">Consultar base original · página {act.source.page}</a>}
              </div>
            </details>
          </article>)}</div>
        </div>}
        {area === 'Educación Física' && <details className="mt-6 rounded-xl bg-slate-50 p-4">
          <summary className="cursor-pointer font-semibold text-slate-700">Indicaciones generales de Educación Física</summary>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
            <p>Las bases piden cabello sujeto, uñas cortas o cubiertas y ropa deportiva adecuada. Los equipos saludan al rival y al árbitro antes y después del partido; no se admiten ofensas ni conductas antideportivas.</p>
            <p>La organización debe respetar horarios y espacios, adaptar los juegos a las edades y necesidades, publicar las normas y capacitar a los árbitros en seguridad e inclusión. En atletismo se realiza calentamiento específico antes de competir. Se parte de habilidades trabajadas en clase, sin exigir ensayos adicionales.</p>
            <a className="text-indigo-700 underline underline-offset-4" href="/bases/educacion-fisica.pdf#page=12" target="_blank" rel="noreferrer">Consultar indicaciones originales · página 12</a>
          </div>
        </details>}
        {documentos.length > 0 && <details className="mt-6 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-500">Documentos originales (PDF)</summary>
          <ul className="mt-3 space-y-3">{documentos.map(base => <li key={base.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-slate-600">{base.titulo}</span>
            <a href={base.url} target="_blank" rel="noreferrer" aria-label={`Ver PDF: ${base.titulo}`} className="font-semibold text-indigo-600 underline underline-offset-4">Ver PDF</a>
            <a href={base.url} download aria-label={`Descargar: ${base.titulo}`} className="font-semibold text-indigo-600 underline underline-offset-4">Descargar</a>
          </li>)}</ul>
        </details>}
      </section>;
    })}</div>
  </div>;
}
