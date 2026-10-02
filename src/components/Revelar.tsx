import type { ReactNode } from 'react';
import { useVisto } from './useVisto';

// Entrance animations, as full class names so Tailwind keeps them. `backwards`: once finished they leave
// no transform behind.
const ANIMACION = {
  entrar: 'motion-safe:animate-[entrar_0.5s_ease-out_backwards]',
  zoom: 'motion-safe:animate-[zoom_0.55s_ease-out_backwards]',
};

// Shows its content with an entrance animation the first time it scrolls into view; still with reduced motion.
export default function Revelar({ children, className = '', animacion = 'entrar', retraso = 0 }:
  { children: ReactNode; className?: string; animacion?: keyof typeof ANIMACION; retraso?: number }) {
  const [ref, visto] = useVisto<HTMLDivElement>(0.15);
  return <div ref={ref} style={{ animationDelay: `${retraso}ms` }} className={`${className} ${visto ? ANIMACION[animacion] : 'motion-safe:opacity-0'}`}>
    {children}
  </div>;
}
