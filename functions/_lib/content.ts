export interface ContentEnv { CONTENT_BUCKET?: R2Bucket; APP_ORIGIN: string }
export interface Item {
  id: string; kind: 'foto' | 'mascota'; album: string; subseccion: string; house: string; title: string;
  published: boolean; created: string; author: string; updatedBy?: string;
}
interface Album { id: string; titulo: string; descripcion: string }
interface Catalog { albumes?: Album[]; revision: string; items: Item[]; mascotas: Record<string, string> }

const key = 'catalogo.json';
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const houses = ['dolphins', 'seagulls', 'eagles', 'horses'];
const albums = ['convivencia', 'eco-house', 'deportes', 'encuentros'];
const ecoHouseFolders = ['asamblea', 'mariquitas', 'carteles'];
const defaultAlbumTitles = ['Sana convivencia', 'En la cancha', 'Espíritu Eco House', 'Juntos celebramos'];
const imageKey = (id: string) => 'imagenes/' + id + '.webp';

export async function catalog(bucket: R2Bucket) {
  const object = await bucket.get(key);
  const data: Catalog = object ? await object.json() : { revision: 'empty', items: [], mascotas: {} };
  return { data, etag: object?.etag };
}

// Writes only if nobody changed the catalog since it was read (or, for the first write, if none exists yet).
// Returns null when another write won, so callers can reject instead of overwriting it.
async function save(bucket: R2Bucket, data: Catalog, etag?: string) {
  data.revision = crypto.randomUUID();
  return bucket.put(key, JSON.stringify(data), {
    onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' },
    httpMetadata: { contentType: 'application/json' },
  });
}

// Public images may be cached briefly: a hidden photo stops being served once this expires.
const PUBLIC_IMAGE_CACHE = 'public, max-age=300';

export async function imageResponse(bucket: R2Bucket, id: string, privateView = false, ifNoneMatch?: string | null) {
  const { data } = await catalog(bucket);
  const item = data.items.find(i => i.id === id);
  const isPublic = item && (item.kind === 'foto' ? item.published : Object.values(data.mascotas).includes(id));
  if (!item || (!privateView && !isPublic)) return json({ error: 'Imagen no disponible.' }, 404);
  // Image ids are never reused for other content, so the id is a valid strong ETag.
  const etag = '"' + id + '"';
  if (!privateView && ifNoneMatch?.split(',').some(tag => tag.trim() === etag)) {
    return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': PUBLIC_IMAGE_CACHE } });
  }
  const image = await bucket.get(imageKey(id));
  if (!image) return json({ error: 'Imagen no disponible.' }, 404);
  return new Response(image.body, { headers: {
    'Content-Type': 'image/webp',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': privateView ? 'no-store' : PUBLIC_IMAGE_CACHE,
    ...(privateView ? {} : { ETag: etag }),
    'Content-Security-Policy': "default-src 'none'; sandbox",
  } });
}

// Only published photos, albums that contain one, and active mascots; never authors or drafts.
export async function publicContent(bucket?: R2Bucket) {
  if (!bucket) return json({ fotos: [], mascotas: {} });
  const { data } = await catalog(bucket);
  const isPublishedPhoto = (i: Item) => i.kind === 'foto' && i.published;
  return json({
    fotos: data.items.filter(isPublishedPhoto).map(i => ({
      id: i.id, titulo: i.title, descripcion: i.title, album: i.album,
      subseccion: i.subseccion || undefined, url: '/api/media/' + i.id,
    })),
    albumes: (data.albumes || []).filter(a => data.items.some(i => isPublishedPhoto(i) && i.album === a.id)),
    mascotas: Object.fromEntries(Object.entries(data.mascotas).map(([h, id]) => [h, '/api/media/' + id])),
  });
}

// Reads the body up to `max` bytes and stops as soon as it is exceeded, without buffering the rest.
async function limitedBody(request: Request, max: number) {
  const reader = request.body?.getReader();
  if (!reader) throw Error('EMPTY');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw Error('SIZE');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  return bytes;
}

export async function manageContent(request: Request, env: ContentEnv, email: string) {
  const bucket = env.CONTENT_BUCKET;
  if (!bucket) return json({ error: 'Falta conectar el almacenamiento de imágenes (CONTENT_BUCKET).' }, 503);
  const url = new URL(request.url);
  try {
    if (request.method === 'GET') {
      const preview = url.searchParams.get('preview');
      if (preview) {
        if (!/^[0-9a-f-]{36}$/.test(preview)) return json({ error: 'Imagen inválida.' }, 400);
        return imageResponse(bucket, preview, true);
      }
      return json((await catalog(bucket)).data);
    }
    if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
    if (request.headers.get('Origin') !== env.APP_ORIGIN) return json({ error: 'Origen no autorizado.' }, 403);
    const { data, etag } = await catalog(bucket);
    // The client sends the revision it last saw; any change since then must be reloaded first.
    if (request.headers.get('If-Match') !== data.revision) {
      return json({ error: 'Otra persona actualizó el contenido. Recarga antes de continuar.' }, 409);
    }

    if (url.searchParams.get('action') === 'upload') {
      if (data.items.length >= 1000) return json({ error: 'Se alcanzó el límite de imágenes. Contacta al administrador.' }, 409);
      if (request.headers.get('Content-Type') !== 'image/webp') return json({ error: 'Solo se aceptan imágenes WebP procesadas.' }, 415);
      const kind = url.searchParams.get('kind');
      const album = url.searchParams.get('album') || '';
      const subseccion = url.searchParams.get('subseccion') || '';
      const house = url.searchParams.get('house') || '';
      const title = (url.searchParams.get('title') || '').trim();
      const albumValido = [...albums, ...(data.albumes || []).map(a => a.id)].includes(album);
      // Only Eco House photos go into a folder; every other album has no subsection.
      const subseccionValida = album === 'eco-house' ? ecoHouseFolders.includes(subseccion) : subseccion === '';
      const destinoValido = kind === 'mascota' ? houses.includes(house) : kind === 'foto' ? albumValido && subseccionValida : false;
      if (title.length < 3 || title.length > 120 || !destinoValido) {
        return json({ error: 'Revisa el álbum, la House y el nombre de la imagen.' }, 400);
      }
      const bytes = await limitedBody(request, 4 * 1024 * 1024);
      const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
      const esWebp = bytes.length >= 20 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(ascii(12, 16));
      if (!esWebp) return json({ error: 'La imagen no es un WebP válido.' }, 400);
      const id = crypto.randomUUID();
      const item: Item = { id, kind: kind as Item['kind'], album, subseccion, house, title, published: false, author: email, created: new Date().toISOString() };
      await bucket.put(imageKey(id), bytes, { httpMetadata: { contentType: 'image/webp' } });
      data.items.push(item);
      // If another write won, remove the uploaded bytes so no orphan image remains.
      if (!await save(bucket, data, etag)) {
        await bucket.delete(imageKey(id));
        return json({ error: 'El contenido cambió. Recarga y vuelve a subir la imagen.' }, 409);
      }
      return json(data);
    }

    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'Formato no permitido.' }, 415);
    const body = JSON.parse(new TextDecoder().decode(await limitedBody(request, 2048))) as {
      action: string; id: string; house: string; titulo?: unknown; descripcion?: unknown;
    };
    let deletedId: string | undefined;
    if (body.action === 'create-album') {
      const titulo = typeof body.titulo === 'string' ? body.titulo.trim().replace(/\s+/g, ' ') : '';
      const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
      // eslint-disable-next-line no-control-regex -- control characters are rejected on purpose.
      if (titulo.length < 3 || titulo.length > 80 || descripcion.length > 240 || /[<>\x00-\x1f]/.test(titulo + descripcion)) {
        return json({ error: 'Usa un nombre de 3 a 80 caracteres y una descripción de hasta 240 caracteres, sin etiquetas.' }, 400);
      }
      const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      const existing = [...defaultAlbumTitles, ...(data.albumes || []).map(a => a.titulo)];
      if (existing.some(name => normalize(name) === normalize(titulo))) return json({ error: 'Ya existe un álbum con ese nombre.' }, 409);
      if ((data.albumes || []).length >= 100) return json({ error: 'Se alcanzó el límite de 100 álbumes nuevos.' }, 409);
      data.albumes = [...(data.albumes || []), { id: 'album-' + crypto.randomUUID(), titulo, descripcion }];
    } else if (body.action === 'restore-default') {
      if (!houses.includes(body.house)) return json({ error: 'House inválida.' }, 400);
      delete data.mascotas[body.house];
    } else {
      const item = data.items.find(i => i.id === body.id);
      if (!item) return json({ error: 'Imagen no encontrada.' }, 404);
      if (body.action === 'publish') {
        // Publishing a mascot makes it the active one for its House, replacing the previous one.
        if (item.kind === 'foto') item.published = true;
        else data.mascotas[item.house] = item.id;
      } else if (body.action === 'hide' && item.kind === 'foto') {
        item.published = false;
      } else if (body.action === 'delete') {
        if (item.kind === 'mascota' && data.mascotas[item.house] === item.id) {
          return json({ error: 'Reemplaza la mascota activa o restaura la original antes de eliminarla.' }, 409);
        }
        if (item.kind === 'foto' && item.published) return json({ error: 'Oculta la foto antes de eliminarla.' }, 409);
        deletedId = item.id;
        data.items = data.items.filter(i => i.id !== item.id);
      } else {
        // Includes hiding a mascot: mascots are replaced or restored, never hidden.
        return json({ error: 'Acción inválida.' }, 400);
      }
      item.updatedBy = email;
    }
    if (!await save(bucket, data, etag)) return json({ error: 'Otra persona actualizó el contenido. Recarga antes de continuar.' }, 409);
    // The image file is deleted only after the catalog no longer lists it, so a failed save never loses bytes.
    if (deletedId) {
      try {
        await bucket.delete(imageKey(deletedId));
      } catch {
        return json({ ...data, warning: 'La imagen se retiró del panel, pero no se pudo borrar el archivo del almacenamiento. Contacta al administrador.', pendingDeletion: deletedId });
      }
    }
    return json(data);
  } catch (e) {
    const tooLarge = e instanceof Error && e.message === 'SIZE';
    return json({ error: tooLarge ? 'La imagen supera el tamaño permitido.' : 'No se pudo completar la operación. Recarga para comprobar su estado.' }, tooLarge ? 413 : 500);
  }
}
