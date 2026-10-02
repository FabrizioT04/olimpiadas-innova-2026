import { useContenido } from '../features/contenido/useContenido';
import { useEffect, useRef, useState } from 'react';
import { Camera, Search, X, Images, ArrowUpRight, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { combinarAlbumes, fotosGaleria as fotosOriginales } from '../data/galeria';
import type { FotoGaleria } from '../data/galeria';
import Revelar from '../components/Revelar';

const normalizar = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const carpetasEco = [{ id: 'asamblea', titulo: 'Asamblea' }, { id: 'mariquitas', titulo: 'Maraquitas' }, { id: 'carteles', titulo: 'Elaboración de carteles' }] as const;
// Mosaic: the first photo is the featured one (2×2); the rest alternate tall and wide tiles so the grid
// does not look uniform. grid-flow-dense fills the gaps they leave.
const TAMANO = ['', 'row-span-2', '', 'md:col-span-2', '', '', 'row-span-2', ''];
const tamanoDe = (i: number) => i === 0 ? 'col-span-2 row-span-2' : TAMANO[(i - 1) % TAMANO.length];
const chip = (activo: boolean) => `shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 active:scale-95 ${activo ? 'bg-white text-indigo-600 shadow-[0_6px_18px_-6px_rgb(99_102_241/0.45)] ring-1 ring-indigo-100' : 'bg-white/60 text-slate-600 ring-1 ring-white hover:bg-white'}`;
const sinTraducir = (album: string) => album === 'convivencia' ? { translate: 'no' as const, className: 'notranslate' } : { className: '' };

function Imagen({ foto, ampliada = false }: { foto: FotoGaleria; ampliada?: boolean }) {
  const [error, setError] = useState(false);
  return error ? <div className="flex h-full min-h-48 items-center justify-center gap-2 bg-slate-100 p-8 text-slate-500"><Camera aria-hidden="true" size={24} /> Foto no disponible</div> :
    <img src={foto.portada || foto.url} alt={foto.descripcion || foto.titulo} loading={ampliada ? 'eager' : 'lazy'} onError={() => setError(true)} className={ampliada ? 'max-h-[75vh] w-full object-contain' : 'h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'} />;
}

export default function Galeria() {
  const { fotos: fotosNuevas, albumes } = useContenido();
  const albumesGaleria = combinarAlbumes(albumes);
  // Photos uploaded from the panel are added at the end: newest first, so the featured one is the latest.
  const fotosGaleria = [...[...fotosNuevas].reverse(), ...fotosOriginales];
  const albumesDisponibles = albumesGaleria.filter(a => fotosGaleria.some(f => f.album === a.id));
  const [album, setAlbum] = useState('todos');
  const [subseccion, setSubseccion] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState<FotoGaleria | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!seleccionada) return;
    if (!dialog.current?.open) dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [seleccionada]);
  const abrirAlbum = (id: string) => { setAlbum(id); setSubseccion(null); setBusqueda(''); };
  const fotos = fotosGaleria.filter(f => (album === 'todos' || f.album === album)
    && (!subseccion || f.subseccion === subseccion)
    && normalizar(`${f.titulo} ${f.descripcion}`).includes(normalizar(busqueda.trim())));
  const cerrar = () => { dialog.current?.close(); setSeleccionada(null); };
  // The enlarged photo moves through the photos shown, with the buttons or the arrow keys.
  const posicion = seleccionada ? fotos.findIndex(f => f.id === seleccionada.id) : -1;
  const mover = (paso: number) => { if (posicion >= 0 && fotos.length > 1) setSeleccionada(fotos[(posicion + paso + fotos.length) % fotos.length]); };
  const titulo = subseccion ? carpetasEco.find(c => c.id === subseccion)?.titulo : album === 'todos' ? 'Todos los momentos' : albumesGaleria.find(a => a.id === album)?.titulo;
  const totalFotos = fotosGaleria.filter(f => f.tipo !== 'video').length, totalVideos = fotosGaleria.length - totalFotos;

  return <div className="mx-auto max-w-7xl space-y-6 pb-12">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"><Camera className="h-7 w-7 text-indigo-500 sm:h-8 sm:w-8" aria-hidden="true" />Momentos y fotos</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">Cada equipo, cada esfuerzo y cada celebración de nuestras olimpiadas, para recordarlos juntos.</p>
      </div>
      <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-white"><Images size={16} aria-hidden="true" />
        {fotosGaleria.length ? `${totalFotos} fotos${totalVideos ? ` y ${totalVideos} ${totalVideos === 1 ? 'video' : 'videos'}` : ''}` : 'Estamos preparando los primeros álbumes'}</p>
    </header>

    {!!fotosGaleria.length && <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Álbum" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          <button onClick={() => abrirAlbum('todos')} aria-pressed={album === 'todos'} className={chip(album === 'todos')}>Todos</button>
          {albumesDisponibles.map(a => <button key={a.id} onClick={() => abrirAlbum(a.id)} aria-pressed={album === a.id} className={chip(album === a.id)}>
            <span {...sinTraducir(a.id)}>{a.titulo}</span> <span className="text-slate-400">{fotosGaleria.filter(f => f.album === a.id).length}</span>
          </button>)}
        </div>
        <div className="relative shrink-0"><label htmlFor="buscar-foto" className="sr-only">Buscar fotos por título o descripción</label><Search aria-hidden="true" size={18} className="absolute left-3 top-3 text-slate-400"/>
          <input id="buscar-foto" type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar un momento…" className="w-full rounded-xl border border-white bg-white/80 py-2.5 pl-10 shadow-sm backdrop-blur-xl pr-3 text-sm lg:w-64" /></div>
      </div>
      {album === 'eco-house' && <div role="group" aria-label="Carpeta de Eco House" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button onClick={() => setSubseccion(null)} aria-pressed={!subseccion} className={`${chip(!subseccion)} !rounded-full !py-1.5`}>Todas las carpetas</button>
        {carpetasEco.filter(c => fotosGaleria.some(f => f.subseccion === c.id)).map(c => <button key={c.id} onClick={() => setSubseccion(c.id)} aria-pressed={subseccion === c.id} className={`${chip(subseccion === c.id)} !rounded-full !py-1.5`}>{c.titulo}</button>)}
      </div>}
    </div>}

    <section aria-labelledby="fotos-titulo" className="space-y-4">
      <h2 id="fotos-titulo" className="flex flex-wrap items-baseline gap-x-3 text-xl font-extrabold text-slate-900">
        <span {...sinTraducir(subseccion ? '' : album)}>{titulo}</span>
        {!!fotos.length && <span className="text-sm font-semibold text-slate-400">{fotos.length} {fotos.length === 1 ? 'momento' : 'momentos'}</span>}
      </h2>
      {!fotos.length ? <div role="status" className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <Camera aria-hidden="true" size={34} className="mx-auto mb-4 text-indigo-400"/><h3 className="text-lg font-bold text-slate-800">{busqueda ? 'No encontramos fotos con esa búsqueda' : 'Los recuerdos están por llegar'}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{busqueda ? 'Prueba con otro título o actividad.' : 'Aquí compartiremos las fotografías de las olimpiadas a medida que se publiquen.'}</p>
        {busqueda && <button onClick={() => setBusqueda('')} className="mt-4 font-semibold text-indigo-600">Limpiar búsqueda</button>}
      </div> : <div className="grid grid-flow-dense auto-rows-[8.5rem] grid-cols-2 gap-2 sm:auto-rows-[10rem] sm:gap-3 md:grid-cols-4 lg:auto-rows-[12rem]">
        {/* The tiles appear in a cascade with a slight zoom as they scroll into view. */}
        {fotos.map((f, i) => <Revelar key={f.id} animacion="zoom" retraso={(i % 8) * 60} className={tamanoDe(i)}><button onClick={() => setSeleccionada(f)} aria-label={`${f.tipo === 'video' ? 'Reproducir video' : 'Ampliar foto'}: ${f.titulo}`}
          className="group relative h-full w-full overflow-hidden rounded-2xl bg-slate-200 text-left shadow-[0_18px_34px_-18px_rgb(15_23_42/0.55)] ring-1 ring-white transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          <Imagen foto={f}/>
          {f.tipo === 'video' && <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950/70 text-white ring-4 ring-white/30 transition-transform group-hover:scale-110"><Play className="ml-1 h-6 w-6" fill="currentColor" /></span></span>}
          {/* The featured photo always shows its title; the others on hover (or always on touch screens, which have no hover). */}
          <span className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-3 text-white transition-opacity ${i === 0 ? 'sm:p-5' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100'}`}>
            {i === 0 && <span className="mb-1.5 inline-block rounded-full bg-white/85 px-2.5 py-0.5 text-xs font-bold text-indigo-600 backdrop-blur">Destacada</span>}
            <span {...sinTraducir(f.album)} className={`block font-extrabold leading-tight ${i === 0 ? 'text-lg sm:text-2xl' : 'text-xs sm:text-sm'} ${sinTraducir(f.album).className}`}>{f.titulo}</span>
            {i === 0 && f.descripcion && <span className="mt-1 hidden text-sm text-slate-200 sm:block">{f.descripcion}</span>}
          </span>
        </button></Revelar>)}
      </div>}
    </section>

    <dialog ref={dialog} onCancel={cerrar} onClose={() => setSeleccionada(null)} aria-labelledby="foto-titulo"
      onKeyDown={e => { if (e.key === 'ArrowRight') mover(1); if (e.key === 'ArrowLeft') mover(-1); }}
      className="visor fixed inset-0 m-auto max-h-[94vh] w-[min(96vw,1100px)] overflow-y-auto rounded-2xl bg-slate-950 p-0 text-white shadow-2xl backdrop:bg-slate-950/90">
      {seleccionada && <>
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <h2 id="foto-titulo" {...sinTraducir(seleccionada.album)} className={`truncate font-extrabold ${sinTraducir(seleccionada.album).className}`}>{seleccionada.titulo}</h2>
            {posicion >= 0 && <p className="text-xs text-slate-400">{posicion + 1} de {fotos.length}</p>}
          </div>
          <button autoFocus onClick={cerrar} aria-label="Cerrar foto" className="rounded-full p-2 hover:bg-white/10"><X /></button>
        </div>
        <div className="relative bg-black">
          {/* Moving to another photo fades it in. */}
          <div key={seleccionada.id} className="motion-safe:animate-[fundido_0.35s_ease-out]">
          {seleccionada.tipo === 'video' ? <video key={seleccionada.id} controls playsInline preload="none" poster={seleccionada.portada} className="max-h-[75vh] w-full bg-black" aria-label={seleccionada.titulo}><source src={seleccionada.url} type="video/mp4" />Tu navegador no puede reproducir este video.</video> : <Imagen key={seleccionada.id} foto={seleccionada} ampliada/>}
          </div>
          {fotos.length > 1 && posicion >= 0 && <>
            <button onClick={() => mover(-1)} aria-label="Foto anterior" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/60 p-2 text-white hover:bg-slate-950/80 sm:left-4 sm:p-3"><ChevronLeft /></button>
            <button onClick={() => mover(1)} aria-label="Foto siguiente" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/60 p-2 text-white hover:bg-slate-950/80 sm:right-4 sm:p-3"><ChevronRight /></button>
          </>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          {seleccionada.descripcion && <p className="text-sm text-slate-300">{seleccionada.descripcion}</p>}
          <a href={seleccionada.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300">{seleccionada.tipo === 'video' ? 'Abrir video' : 'Abrir imagen'} <ArrowUpRight size={16} aria-hidden="true"/></a>
        </div>
      </>}
    </dialog>
  </div>;
}
