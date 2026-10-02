import { useEffect, useRef, useState } from 'react';

// True once the element has been on screen, so its entrance animation plays when it is seen.
export function useVisto<T extends Element>(umbral = 0.35) {
  const ref = useRef<T>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visto) return;
    if (!('IntersectionObserver' in window)) { setVisto(true); return; }
    const observador = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisto(true); observador.disconnect(); } }, { threshold: umbral });
    observador.observe(el);
    return () => observador.disconnect();
  }, [visto, umbral]);
  return [ref, visto] as const;
}
