import { useEffect, useState } from 'react';
import type { FotoGaleria, AlbumGaleria } from '../../data/galeria';

export function useContenido() {
  const [data, setData] = useState<{ albumes?: AlbumGaleria[]; fotos: FotoGaleria[]; mascotas: Record<string, string> }>({ fotos: [], mascotas: {} });
  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch('/api/contenido', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) return;
        const next = await response.json();
        if (Array.isArray(next.fotos) && next.mascotas && !controller.signal.aborted) setData(next);
      } catch { /* Conserva el último contenido cuando no hay conexión. */ }
    };
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('contenido-publicado', refresh);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('contenido-publicado', refresh); };
  }, []);
  return data;
}
