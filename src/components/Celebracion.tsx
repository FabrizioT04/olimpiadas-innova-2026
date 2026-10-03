import { useState } from 'react';
import { PartyPopper } from 'lucide-react';

// Confetti in the champion House's colours plus gold; the White House gets silver, pearl and gold so it shows on white.
const COLORES: Record<string, string[]> = {
  white: ['#cbd5e1', '#94a3b8', '#e2e8f0', '#fbbf24', '#f59e0b'],
  blue: ['#2563eb', '#60a5fa', '#1d4ed8', '#fbbf24', '#f59e0b'],
  green: ['#16a34a', '#4ade80', '#15803d', '#fbbf24', '#f59e0b'],
  orange: ['#f97316', '#fdba74', '#ea580c', '#fbbf24', '#f59e0b'],
};
const PIEZAS = 46;
// Deterministic «random» values, so every piece keeps its place between renders.
const azar = (i: number, semilla: number) => { const x = Math.sin(i * 12.9898 + semilla * 78.233) * 43758.5453; return x - Math.floor(x); };

// One shower of confetti over the champion card when it appears, and again from the «Celebrar» button.
// It falls once and stops; with reduced motion there is no confetti and no button.
export default function Celebracion({ color }: { color: string }) {
  const [ronda, setRonda] = useState(0);
  const colores = COLORES[color] ?? COLORES.white;
  return <>
    <div key={ronda} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden [container-type:size] motion-reduce:hidden">
      {Array.from({ length: PIEZAS }, (_, i) => {
        const izquierda = azar(i, ronda + 1) * 100, retraso = azar(i, ronda + 2) * 0.9, duracion = 2.2 + azar(i, ronda + 3) * 1.4;
        const ancho = 6 + Math.round(azar(i, ronda + 4) * 5), giro = Math.round(azar(i, ronda + 5) * 720 - 360);
        return <span key={i} className="absolute -top-4 block opacity-0 motion-safe:animate-[confeti_var(--duracion)_ease-in_var(--retraso)_forwards]"
          style={{ left: `${izquierda}%`, width: ancho, height: ancho * (i % 3 === 0 ? 1 : 0.45), backgroundColor: colores[i % colores.length],
            borderRadius: i % 4 === 0 ? '9999px' : '2px', ['--duracion' as string]: `${duracion}s`, ['--retraso' as string]: `${retraso}s`, ['--giro' as string]: `${giro}deg` }} />;
      })}
    </div>
    <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2 motion-reduce:hidden sm:justify-start">
      <button type="button" onClick={() => setRonda(r => r + 1)}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgb(79_70_229/0.7)] transition-all hover:-translate-y-0.5 hover:bg-indigo-500 active:scale-95">
        <PartyPopper size={16} aria-hidden="true" />Celebrar
      </button>
    </div>
  </>;
}
