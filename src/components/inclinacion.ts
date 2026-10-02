import type { MouseEvent } from 'react';

// Cards that tilt in 3D following the mouse. Touch screens and reduced motion keep them still.
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches;

export const inclinacion = {
  onMouseMove(e: MouseEvent<HTMLElement>) {
    if (quieto()) return;
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
  },
  onMouseLeave(e: MouseEvent<HTMLElement>) { e.currentTarget.style.transform = ''; },
};
