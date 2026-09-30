import { useSyncExternalStore } from 'react';
import type { FotoGaleria, AlbumGaleria } from '../../data/galeria';

type Contenido = { albumes?: AlbumGaleria[]; fotos: FotoGaleria[]; mascotas: Record<string, string> };

// Shared across pages so switching tabs reuses the last answer instead of starting empty.
// `cargado` is false until the first answer (or failure), so callers can avoid flashing default mascots.
let state: { data: Contenido; cargado: boolean } = { data: { fotos: [], mascotas: {} }, cargado: false };
const listeners = new Set<() => void>();
let stopPolling: (() => void) | null = null;

const publish = (next: typeof state) => { state = next; listeners.forEach(listener => listener()); };

// One poll runs while at least one page uses the content.
function startPolling() {
  const controller = new AbortController();
  const refresh = async () => {
    if (document.hidden) return;
    try {
      const response = await fetch('/api/contenido', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) return;
      const next = await response.json();
      if (Array.isArray(next.fotos) && next.mascotas && !controller.signal.aborted) publish({ data: next, cargado: true });
    } catch { /* Conserva el último contenido cuando no hay conexión. */ }
    finally { if (!controller.signal.aborted && !state.cargado) publish({ ...state, cargado: true }); }
  };
  void refresh();
  const timer = window.setInterval(refresh, 60000);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('contenido-publicado', refresh);
  return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('contenido-publicado', refresh); };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stopPolling) stopPolling = startPolling();
  return () => {
    listeners.delete(listener);
    if (!listeners.size && stopPolling) { stopPolling(); stopPolling = null; }
  };
}

export function useContenido() {
  const { data, cargado } = useSyncExternalStore(subscribe, () => state);
  return { ...data, cargado };
}
