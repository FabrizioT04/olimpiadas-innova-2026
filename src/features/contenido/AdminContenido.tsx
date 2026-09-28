import { useEffect, useRef, useState } from 'react';
import { HOUSES } from '../arbitraje/hooks/useArbitraje';
import { combinarAlbumes, type AlbumGaleria } from '../../data/galeria';

interface Item { id: string; kind: 'foto' | 'mascota'; title: string; album: string; subseccion: string; house: string; published: boolean }
interface Catalog { albumes?: AlbumGaleria[]; revision: string; items: Item[]; mascotas: Record<string, string> }
const endpoint = '/arbitraje/api/contenido';
const folders = [{ id: 'asamblea', title: 'Asamblea' }, { id: 'mariquitas', title: 'Maraquitas' }, { id: 'carteles', title: 'Elaboración de carteles' }];
const control = 'w-full rounded-xl border border-slate-300 bg-white p-3';

async function prepare(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('Escoge una imagen JPG, PNG o WebP.');
  if (file.size > 20 * 1024 * 1024) throw Error('La imagen original debe pesar menos de 20 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 50000000) throw Error('La imagen es demasiado grande. Reduce su resolución antes de subirla.');
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
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
  const upload = () => {
    if (!blob) return;
    const title = kind === 'mascota' ? `Mascota de ${HOUSES.find(h => h.id === house)?.name}` : album === 'eco-house' ? folders.find(f => f.id === folder)!.title : albumesGaleria.find(a => a.id === album)!.titulo;
    const query = new URLSearchParams({ action: 'upload', kind, album: kind === 'foto' ? album : '', subseccion: kind === 'foto' && album === 'eco-house' ? folder : '', house: kind === 'mascota' ? house : '', title });
    void send(blob, '?' + query, 'image/webp');
  };
  return <section translate="no" className="notranslate rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 space-y-6">
    <div><h2 className="text-2xl font-bold">Fotos y mascotas</h2><p className="mt-2 text-slate-500">Guarda una imagen como borrador y revísala antes de publicarla. Las fotos se muestran sin textos repetidos.</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p>}
    <button type="button" disabled={busy} onClick={load} className="text-indigo-700 underline disabled:opacity-50">{busy ? 'Procesando…' : 'Recargar contenido'}</button>
    {catalog && <><button type="button" disabled={busy} onClick={() => setCreatingAlbum(!creatingAlbum)} aria-expanded={creatingAlbum} className="rounded-xl border border-indigo-600 px-4 py-2 font-semibold text-indigo-700 disabled:opacity-50">{creatingAlbum ? 'Cancelar nuevo álbum' : '+ Crear álbum'}</button>
    {creatingAlbum && <form className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4" onSubmit={async e => {
      e.preventDefault();
      const result = await send(JSON.stringify({ action: 'create-album', titulo: albumTitle, descripcion: albumDescription }));
      const created = result?.albumes?.at(-1);
      if (created) { setAlbum(created.id); setKind('foto'); setCreatingAlbum(false); setAlbumTitle(''); setAlbumDescription(''); setNotice('Álbum creado. Ya puedes subir fotos; aparecerá en la galería al publicar la primera.'); }
    }}><h3 className="font-bold">Nuevo álbum</h3><label className="block">Nombre<input autoFocus required minLength={3} maxLength={80} disabled={busy} className={control} value={albumTitle} onChange={e => setAlbumTitle(e.target.value)} /></label><label className="block">Descripción (opcional)<textarea maxLength={240} disabled={busy} className={control} value={albumDescription} onChange={e => setAlbumDescription(e.target.value)} /></label><p className="text-sm text-slate-600">Será visible para los visitantes cuando publiques su primera foto.</p><button disabled={busy} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">Crear álbum</button></form>}
    <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
      <div className="grid gap-4 sm:grid-cols-2"><label>Tipo de imagen<select className={control} value={kind} onChange={e => setKind(e.target.value as typeof kind)}><option value="foto">Foto para un álbum</option><option value="mascota">Mascota de una House</option></select></label>
      {kind === 'foto' ? <label>Álbum<select className={control} value={album} onChange={e => setAlbum(e.target.value)}>{albumesGaleria.map(a => <option key={a.id} value={a.id}>{a.titulo}</option>)}</select></label> : <label>House<select className={control} value={house} onChange={e => setHouse(e.target.value)}>{HOUSES.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>}
      {kind === 'foto' && album === 'eco-house' && <label>Sección<select className={control} value={folder} onChange={e => setFolder(e.target.value)}>{folders.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}</select></label>}</div>
      <label className="block">Imagen (JPG, PNG o WebP; hasta 20 MB)<input ref={input} className={control} type="file" accept="image/jpeg,image/png,image/webp" onChange={async e => {
        const file = e.target.files?.[0]; setBlob(null); setError(''); setNotice(''); if (!file) return; setBusy(true);
        try { setBlob(await prepare(file)); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo abrir esta imagen.'); } finally { setBusy(false); }
      }} /></label>
      {preview && <div className="rounded-xl bg-slate-50 p-4"><img src={preview} alt="Vista previa de la imagen seleccionada" className="mx-auto max-h-72 object-contain" /><p className="mt-2 text-center text-sm text-slate-500">Imagen optimizada: {Math.ceil((blob?.size || 0) / 1024)} KB</p></div>}
      <button disabled={!blob || busy} onClick={upload} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-40">Guardar borrador</button>
    </fieldset>
    <div className="space-y-4"><h3 className="text-xl font-bold">Imágenes subidas desde la web</h3>{!catalog.items.length && <p className="text-slate-500">Todavía no hay imágenes nuevas. Las fotos y mascotas originales siguen disponibles.</p>}
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
      {confirmation && <><h3 className="text-xl font-bold">Publicar {confirmation.title}</h3><img src={`${endpoint}?preview=${confirmation.id}`} alt={confirmation.title} className="my-4 max-h-80 w-full object-contain" /><p>La imagen será visible para todos los visitantes{confirmation.kind === 'mascota' ? ' y reemplazará la mascota actual de esta House' : ' en el álbum seleccionado'}.</p>{error && <p role="alert" className="my-3 text-red-700">{error}</p>}<div className="mt-5 flex gap-4"><button autoFocus disabled={busy} onClick={() => setConfirmation(null)} className="rounded-xl border px-5 py-3">Cancelar</button><button disabled={busy} onClick={() => void send(JSON.stringify({ action: 'publish', id: confirmation.id }))} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">{busy ? 'Publicando…' : 'Publicar imagen'}</button></div></>}
    </dialog>
  </section>;
}
