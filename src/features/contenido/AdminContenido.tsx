import { Plus, RefreshCw, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { HOUSES } from '../arbitraje/hooks/useArbitraje';
import { combinarAlbumes, type AlbumGaleria } from '../../data/galeria';

interface Item { id: string; kind: 'foto' | 'mascota'; title: string; album: string; subseccion: string; house: string; published: boolean }
interface Catalog { albumes?: AlbumGaleria[]; revision: string; items: Item[]; mascotas: Record<string, string> }
const endpoint = '/arbitraje/api/contenido';
const folders = [{ id: 'asamblea', title: 'Asamblea' }, { id: 'mariquitas', title: 'Maraquitas' }, { id: 'carteles', title: 'Elaboración de carteles' }];
const control = 'mt-2 min-w-0 w-full rounded-xl border border-slate-300 bg-white p-3';

// Mascots are shown at most ~176 px wide; photos can be opened full size in the gallery.
const MAX_SIDE = { foto: 2000, mascota: 512 } as const;

async function prepare(file: File, kind: 'foto' | 'mascota') {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('Escoge una imagen JPG, PNG o WebP.');
  if (file.size > 20 * 1024 * 1024) throw Error('La imagen original debe pesar menos de 20 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 50000000) throw Error('La imagen es demasiado grande. Reduce su resolución antes de subirla.');
    const scale = Math.min(1, MAX_SIDE[kind] / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d'); if (!ctx) throw Error('No se pudo preparar la imagen.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(Error('No se pudo procesar la imagen.')), 'image/webp', 0.85));
    if (blob.type !== 'image/webp' || blob.size > 4 * 1024 * 1024) throw Error('No se pudo optimizar la imagen a menos de 4 MB.');
    return blob;
  } finally { bitmap.close(); }
}

export default function AdminContenido() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const albumesGaleria = combinarAlbumes(catalog?.albumes);
  const [kind, setKind] = useState<'foto' | 'mascota'>('foto');
  const [album, setAlbum] = useState('convivencia');
  const [folder, setFolder] = useState('asamblea');
  const [house, setHouse] = useState('dolphins');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmation, setConfirmation] = useState<Item | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const processing = useRef(0);
  const load = async () => {
    setBusy(true); setError('');
    try { const response = await fetch(endpoint, { cache: 'no-store' }); const data = await response.json(); if (!response.ok) throw Error(data.error || 'No se pudo cargar el contenido.'); setCatalog(data); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar el contenido.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (!blob) { setPreview(''); return; } const url = URL.createObjectURL(blob); setPreview(url); return () => URL.revokeObjectURL(url); }, [blob]);
  useEffect(() => { if (confirmation) dialog.current?.showModal(); else dialog.current?.close(); }, [confirmation]);
  const send = async (body: BodyInit, query = '', contentType = 'application/json') => {
    if (!catalog) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(endpoint + query, { method: 'POST', headers: { 'Content-Type': contentType, 'If-Match': catalog.revision }, body });
      const data = await response.json(); if (!response.ok) throw Error(data.error || 'No se pudo guardar. Recarga para comprobar el estado.');
      setCatalog(data); setNotice(data.warning || (query ? 'Borrador guardado. Revisa la imagen y pulsa Publicar cuando esté lista.' : 'Cambio guardado.'));
      if (query) { setBlob(null); if (input.current) input.current.value = ''; }
      setConfirmation(null); window.dispatchEvent(new Event('contenido-publicado'));
      return data as Catalog;
    } catch (e) { setError(e instanceof Error ? e.message : 'Error de conexión. Recarga para comprobar el estado antes de repetir.'); }
    finally { setBusy(false); }
  };
  const process = async (file: File, target: typeof kind) => {
    // Only the latest selection wins if the type changes while an image is being processed.
    const run = ++processing.current;
    setBlob(null); setError(''); setNotice(''); setBusy(true);
    try { const result = await prepare(file, target); if (run === processing.current) setBlob(result); }
    catch (err) { if (run === processing.current) setError(err instanceof Error ? err.message : 'No se pudo abrir esta imagen.'); }
    finally { if (run === processing.current) setBusy(false); }
  };
  const upload = () => {
    if (!blob) return;
    const title = kind === 'mascota' ? `Mascota de ${HOUSES.find(h => h.id === house)?.name}` : album === 'eco-house' ? folders.find(f => f.id === folder)!.title : albumesGaleria.find(a => a.id === album)!.titulo;
    const query = new URLSearchParams({ action: 'upload', kind, album: kind === 'foto' ? album : '', subseccion: kind === 'foto' && album === 'eco-house' ? folder : '', house: kind === 'mascota' ? house : '', title });
    void send(blob, '?' + query, 'image/webp');
  };
  return <section translate="no" className="notranslate vidrio rounded-[2rem] p-5 sm:p-8 space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-2xl"><h2 className="text-2xl font-extrabold tracking-tight">Fotos y mascotas</h2><p className="mt-2 text-slate-500">Sube una imagen, revisa el borrador y publícala cuando esté lista.</p></div>
      <button type="button" disabled={busy} onClick={load} className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} aria-hidden="true" className={busy ? 'animate-spin' : ''} />{busy ? 'Procesando…' : 'Recargar'}</button>
    </div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p>}
    {catalog && <>
    <fieldset disabled={busy} className="space-y-5 rounded-2xl bg-white/60 p-4 ring-1 ring-white sm:p-6 disabled:opacity-60">
      <div><h3 className="flex items-center gap-2 font-bold"><Upload size={18} aria-hidden="true" /> Subir imagen</h3><p className="mt-1 text-sm text-slate-500">Elige dónde quieres mostrarla.</p></div>
      <div className="grid items-start gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Tipo de imagen<select className={control} value={kind} onChange={e => { const next = e.target.value as typeof kind; setKind(next); const file = input.current?.files?.[0]; if (file) void process(file, next); }}><option value="foto">Foto para un álbum</option><option value="mascota">Mascota de una House</option></select></label>
      {kind === 'foto' ? <div><label className="text-sm font-medium" htmlFor="content-album">Álbum</label><select id="content-album" className={control} value={album} onChange={e => setAlbum(e.target.value)}>{albumesGaleria.map(a => <option key={a.id} value={a.id}>{a.titulo}</option>)}</select><button type="button" onClick={() => setCreatingAlbum(!creatingAlbum)} aria-expanded={creatingAlbum} aria-controls="new-album-form" className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"><Plus size={16} aria-hidden="true" />{creatingAlbum ? 'Cerrar nuevo álbum' : 'Crear álbum'}</button></div> : <label className="text-sm font-medium">House<select className={control} value={house} onChange={e => setHouse(e.target.value)}>{HOUSES.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>}
      {kind === 'foto' && album === 'eco-house' && <label>Sección<select className={control} value={folder} onChange={e => setFolder(e.target.value)}>{folders.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}</select></label>}</div>
    {creatingAlbum && kind === 'foto' && <form id="new-album-form" className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4" onSubmit={async e => {
      e.preventDefault();
      const result = await send(JSON.stringify({ action: 'create-album', titulo: albumTitle, descripcion: albumDescription }));
      const created = result?.albumes?.at(-1);
      if (created) { setAlbum(created.id); setKind('foto'); setCreatingAlbum(false); setAlbumTitle(''); setAlbumDescription(''); setNotice('Álbum creado. Ya puedes subir fotos; aparecerá en la galería al publicar la primera.'); }
    }}><h3 className="font-bold">Nuevo álbum</h3><label className="block">Nombre<input autoFocus required minLength={3} maxLength={80} disabled={busy} className={control} value={albumTitle} onChange={e => setAlbumTitle(e.target.value)} /></label><label className="block">Descripción (opcional)<textarea maxLength={240} disabled={busy} className={control} value={albumDescription} onChange={e => setAlbumDescription(e.target.value)} /></label><p className="text-sm text-slate-600">Será visible para los visitantes cuando publiques su primera foto.</p><button disabled={busy} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-[0_8px_18px_-8px_rgb(79_70_229/0.7)] transition-all hover:-translate-y-0.5 hover:bg-indigo-500 active:scale-95 disabled:opacity-50">Crear álbum</button></form>}
      <label className="block text-sm font-medium">Archivo de imagen<span className="mt-1 block text-xs font-normal text-slate-500">JPG, PNG o WebP · Hasta 20 MB</span><input ref={input} className="mt-3 block w-full min-w-0 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {
        const file = e.target.files?.[0]; if (file) void process(file, kind); else { setBlob(null); setError(''); setNotice(''); }
      }} /></label>
      {preview && <div className="rounded-xl bg-slate-50 p-4"><img src={preview} alt="Vista previa de la imagen seleccionada" className="mx-auto max-h-72 object-contain" /><p className="mt-2 text-center text-sm text-slate-500">Imagen optimizada: {Math.ceil((blob?.size || 0) / 1024)} KB</p></div>}
      <button disabled={!blob || busy} onClick={upload} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-[0_8px_18px_-8px_rgb(79_70_229/0.7)] transition-all hover:-translate-y-0.5 hover:bg-indigo-500 active:scale-95 disabled:opacity-40">Guardar borrador</button>
    </fieldset>
    <div className="space-y-4 border-t border-slate-100 pt-6"><h3 className="text-xl font-bold">Imágenes subidas desde la web</h3>{!catalog.items.length && <p className="text-slate-500">Todavía no hay imágenes nuevas. Las fotos y mascotas originales siguen disponibles.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...catalog.items].reverse().map(item => {
        const published = item.kind === 'foto' ? item.published : catalog.mascotas[item.house] === item.id;
        return <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200"><img src={`${endpoint}?preview=${item.id}`} alt={item.title} loading="lazy" className="aspect-[4/3] w-full bg-slate-50 object-contain" /><div className="space-y-3 p-4"><p className="font-bold">{item.title}</p><p className="text-sm text-slate-500">{published ? 'Publicada' : 'Sin publicar'}{item.kind === 'foto' && item.subseccion ? ` · ${folders.find(f => f.id === item.subseccion)?.title || item.subseccion}` : ''}</p>
        {published && item.kind === 'foto' ? <button disabled={busy} className="text-red-700 underline" onClick={() => { if (window.confirm('¿Ocultar esta foto de la galería pública?')) void send(JSON.stringify({ action: 'hide', id: item.id })); }}>Ocultar foto</button> : !published && <button disabled={busy} className="font-bold text-indigo-700 underline" onClick={() => setConfirmation(item)}>Revisar y publicar</button>}
        {!published && <button disabled={busy} className="block text-red-700 underline disabled:opacity-40" onClick={() => { if (window.confirm(`¿Eliminar definitivamente «${item.title}»? Esta acción no se puede deshacer.`)) void send(JSON.stringify({ action: 'delete', id: item.id })); }}>Eliminar</button>}
        {published && <p className="text-xs text-slate-500">{item.kind === 'mascota' ? 'Para eliminarla, reemplaza esta mascota o restaura la original.' : 'Oculta esta foto para poder eliminarla.'}</p>}
        </div></article>;
      })}</div>
    </div>
    {!!Object.keys(catalog.mascotas).length && <div className="space-y-3 border-t border-slate-200 pt-5"><h3 className="font-bold">Restaurar mascotas originales</h3>{HOUSES.filter(h => catalog.mascotas[h.id]).map(h => <button key={h.id} disabled={busy} className="mr-4 text-indigo-700 underline" onClick={() => { if (window.confirm(`¿Restaurar la mascota original de ${h.name}?`)) void send(JSON.stringify({ action: 'restore-default', house: h.id })); }}>{h.name}</button>)}</div>}
    </>}
    <dialog ref={dialog} onCancel={e => { if (busy) e.preventDefault(); else setConfirmation(null); }} onClose={() => setConfirmation(null)} className="fixed inset-0 m-auto max-h-[90vh] w-[min(92vw,600px)] overflow-auto rounded-2xl p-6 backdrop:bg-slate-950/70">
      {confirmation && <><h3 className="text-xl font-bold">Publicar {confirmation.title}</h3><img src={`${endpoint}?preview=${confirmation.id}`} alt={confirmation.title} className="my-4 max-h-80 w-full object-contain" /><p>La imagen será visible para todos los visitantes{confirmation.kind === 'mascota' ? ' y reemplazará la mascota actual de esta House' : ' en el álbum seleccionado'}.</p>{error && <p role="alert" className="my-3 text-red-700">{error}</p>}<div className="mt-5 flex gap-4"><button autoFocus disabled={busy} onClick={() => setConfirmation(null)} className="rounded-xl border px-5 py-3">Cancelar</button><button disabled={busy} onClick={() => void send(JSON.stringify({ action: 'publish', id: confirmation.id }))} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-[0_8px_18px_-8px_rgb(79_70_229/0.7)] transition-all hover:-translate-y-0.5 hover:bg-indigo-500 active:scale-95">{busy ? 'Publicando…' : 'Publicar imagen'}</button></div></>}
    </dialog>
  </section>;
}
