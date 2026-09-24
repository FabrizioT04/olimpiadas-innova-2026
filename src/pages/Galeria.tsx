import { useEffect, useRef, useState } from 'react';
import { Camera, Search, X, Images, ArrowUpRight, Trophy, Leaf, PartyPopper } from 'lucide-react';
import { albumesGaleria, fotosGaleria } from '../data/galeria';
import type { FotoGaleria } from '../data/galeria';

const normalizar = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const icons = [Images, Trophy, Leaf, PartyPopper];
function Imagen({ foto, ampliada = false }: { foto: FotoGaleria; ampliada?: boolean }) {
  const [error, setError] = useState(false);
  return error ? <div className="flex h-full min-h-48 items-center justify-center gap-2 bg-slate-100 p-8 text-slate-500"><Camera aria-hidden="true" size={24} /> Foto no disponible</div> :
    <img src={foto.portada || foto.url} alt={foto.descripcion || foto.titulo} loading={ampliada ? 'eager' : 'lazy'} onError={() => setError(true)} className={ampliada ? 'max-h-[65vh] w-full object-contain' : 'h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'} />;
}

export default function Galeria() {
  const [album, setAlbum] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState<FotoGaleria | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!seleccionada) return;
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [seleccionada]);
  const fotos = fotosGaleria.filter(f => (album === 'todos' || f.album === album) && normalizar(`${f.titulo} ${f.descripcion}`).includes(normalizar(busqueda.trim())));
  const cerrar = () => { dialog.current?.close(); setSeleccionada(null); };
  return <div className="mx-auto max-w-7xl space-y-8 pb-12">
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-blue-600 px-6 py-10 text-white sm:p-12">
      <div aria-hidden="true" className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[40px] border-white/5" />
      <div className="relative max-w-2xl">
        <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-200"><Camera size={17} aria-hidden="true" /> Olimpiadas 360° · 2026</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Momentos que compartimos</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-indigo-100">Cada equipo, cada esfuerzo y cada celebración forman parte de nuestras olimpiadas. Este es el espacio para recordarlos juntos.</p>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm"><Images size={16} aria-hidden="true" /> {fotosGaleria.length ? `${fotosGaleria.filter(f => f.tipo !== 'video').length} fotos y ${fotosGaleria.filter(f => f.tipo === 'video').length} videos publicados` : 'Estamos preparando los primeros álbumes'}</p>
      </div>
    </header>

    <section aria-labelledby="albumes-titulo">
      <div className="mb-4 flex items-baseline justify-between gap-4"><h2 id="albumes-titulo" className="text-xl font-bold text-slate-800">Explora los álbumes</h2><span className="text-sm text-slate-500">Nuestra comunidad en imágenes</span></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{albumesGaleria.map((a, i) => {
        const Icon = icons[i]; const cantidad = fotosGaleria.filter(f => f.album === a.id).length;
        return <button key={a.id} onClick={() => { setAlbum(a.id); setBusqueda(''); }} aria-pressed={album === a.id} className={`rounded-2xl border bg-white p-5 text-left transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-indigo-600 ${album === a.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
          <span className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${a.color} p-3 text-white`}><Icon aria-hidden="true" size={23} /></span>
          <h3 className="text-lg font-bold text-slate-800">{a.titulo}</h3><p className="mt-1 text-sm text-slate-500">{a.descripcion}</p>
          <p className="mt-4 text-xs font-semibold text-indigo-600">{cantidad ? `${cantidad} momentos` : 'Próximamente'}</p>
        </button>;
      })}</div>
    </section>

    <section aria-labelledby="fotos-titulo" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h2 id="fotos-titulo" className="text-xl font-bold text-slate-800">{album === 'todos' ? 'Fotos y videos' : albumesGaleria.find(a => a.id === album)?.titulo}</h2>
          {album !== 'todos' && <button onClick={() => setAlbum('todos')} className="mt-1 text-sm font-medium text-indigo-600 underline underline-offset-4">Ver todos los álbumes</button>}</div>
        {fotosGaleria.length > 0 && <div className="relative"><label htmlFor="buscar-foto" className="sr-only">Buscar fotos por título o descripción</label><Search aria-hidden="true" size={18} className="absolute left-3 top-3 text-slate-400"/><input id="buscar-foto" type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar un momento…" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm sm:w-64" /></div>}
      </div>
      {!fotos.length ? <div role="status" className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <Camera aria-hidden="true" size={34} className="mx-auto mb-4 text-indigo-400"/><h3 className="text-lg font-bold text-slate-800">{busqueda ? 'No encontramos fotos con esa búsqueda' : 'Los recuerdos están por llegar'}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{busqueda ? 'Prueba con otro título o actividad.' : 'Aquí compartiremos las fotografías de las olimpiadas a medida que se publiquen.'}</p>
        {busqueda && <button onClick={() => setBusqueda('')} className="mt-4 font-semibold text-indigo-600">Limpiar búsqueda</button>}
      </div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{fotos.map(f => <button key={f.id} onClick={() => setSeleccionada(f)} aria-label={`${f.tipo === 'video' ? 'Reproducir video' : 'Ampliar foto'}: ${f.titulo}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:shadow-lg focus-visible:outline-2 focus-visible:outline-indigo-600">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100"><Imagen foto={f}/>{f.tipo === 'video' && <span className="absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-slate-950/80 px-5 py-3 font-semibold text-white">▶ Reproducir video</span></span>}</div>
      </button>)}</div>}
    </section>
    <dialog ref={dialog} onCancel={cerrar} onClose={() => setSeleccionada(null)} aria-labelledby="foto-titulo" className="fixed inset-0 m-auto max-h-[92vh] w-[min(94vw,1000px)] overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/80">
      {seleccionada && <><div className="flex items-center justify-between gap-4 p-4"><h2 id="foto-titulo" className="font-bold text-slate-800">{seleccionada.titulo}</h2><button autoFocus onClick={cerrar} aria-label="Cerrar foto" className="rounded-full p-2 hover:bg-slate-100"><X /></button></div>{seleccionada.tipo === 'video' ? <video key={seleccionada.id} controls playsInline preload="none" poster={seleccionada.portada} className="max-h-[65vh] w-full bg-black" aria-label={seleccionada.titulo}><source src={seleccionada.url} type="video/mp4" />Tu navegador no puede reproducir este video.</video> : <Imagen key={seleccionada.id} foto={seleccionada} ampliada/>}<div className="space-y-3 p-5"><a href={seleccionada.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">{seleccionada.tipo === 'video' ? 'Abrir video' : 'Abrir imagen'} <ArrowUpRight size={16} aria-hidden="true"/></a></div></>}
    </dialog>
  </div>;
}
