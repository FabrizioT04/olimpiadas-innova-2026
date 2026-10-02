import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

// Un número que cuenta desde su valor anterior (0 la primera vez) hasta el nuevo; quieto con «reducir movimiento».
export default function NumeroAnimado({ valor }: { valor: number }) {
  const quieto = useReducedMotion();
  const [mostrado, setMostrado] = useState(quieto ? valor : 0);
  const desde = useRef(quieto ? valor : 0);
  useEffect(() => {
    if (quieto) { setMostrado(valor); desde.current = valor; return; }
    const inicio = performance.now(), origen = desde.current;
    let marco = 0;
    const paso = (t: number) => {
      const k = Math.min(1, (t - inicio) / 1200), v = Math.round(origen + (valor - origen) * (1 - (1 - k) ** 3));
      setMostrado(v); desde.current = v;
      if (k < 1) marco = requestAnimationFrame(paso);
    };
    marco = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(marco);
  }, [valor, quieto]);
  return <>{mostrado}</>;
}
