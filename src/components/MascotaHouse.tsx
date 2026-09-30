import type { House } from '../features/arbitraje/hooks/useArbitraje';

interface Props {
  house: House | undefined;
  mascotas: Record<string, string>;
  cargado: boolean;
  className: string;
}

// Shows the published mascot; the bundled image is only a fallback when none is published or it fails.
// Until the content answer arrives, an empty box keeps the layout without flashing the fallback.
export default function MascotaHouse({ house, mascotas, cargado, className }: Props) {
  if (!house || !cargado) return <div aria-hidden="true" className={className} />;
  return <img
    src={mascotas[house.id] || house.img}
    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = house.img; }}
    alt={house.name}
    className={className}
  />;
}
