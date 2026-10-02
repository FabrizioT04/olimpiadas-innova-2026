import { useState, useRef } from 'react';

// 1. Importamos las imágenes desde la carpeta assets
// (Vite se encargará de optimizarlas cuando subas la web a Cloudflare)
import imgDolphins from '../../../assets/dolphins.webp';
import imgSeagulls from '../../../assets/seagulls.webp';
import imgEagles from '../../../assets/eagles.webp';
import imgHorses from '../../../assets/horses.webp';
import { HOUSES as HOUSES_BASE, type ColorHouse } from '../../../../shared/olimpiadas';

export interface House {
  id: string;       // animal: identifica la mascota
  name: string;
  color: ColorHouse; // clave de la House en la hoja y en el backend
  img: string; 
}

// 2. Mascotas de respaldo; los datos de cada House vienen de shared/olimpiadas.ts
const IMAGENES: Record<string, string> = { dolphins: imgDolphins, seagulls: imgSeagulls, eagles: imgEagles, horses: imgHorses };
export const HOUSES: House[] = HOUSES_BASE.map(h => ({ id: h.animal, name: h.nombre, color: h.color, img: IMAGENES[h.animal] }));

export const useArbitraje = () => {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [operation, setOperation] = useState('');
  const [points, setPoints] = useState('');
  const [motivo, setMotivo] = useState('');
  const pending = useRef<{ body: string; id: string } | null>(null);
  const sending = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Mensaje mostrado dentro del formulario en lugar de ventanas alert() del navegador.
  const [aviso, setAviso] = useState<{ tipo: 'error' | 'exito'; texto: string } | null>(null);
  const resetForm = () => {
    setSelectedHouse(null);
    setPoints('');
    setMotivo('');
  };

  const enviarPuntaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending.current) return;
    setAviso(null);
    if (!selectedHouse || !points || !operation) {
      setAviso({ tipo: 'error', texto: 'Completa la House, la operación y los puntos.' });
      return;
    }

    if (!Number.isSafeInteger(Number(points)) || Number(points) < 1 || Number(points) > 10000 || motivo.trim().length < 3) {
      setAviso({ tipo: 'error', texto: 'Ingresa puntos enteros entre 1 y 10000 y un motivo de al menos 3 caracteres.' });
      return;
    }
    sending.current = true;
    setIsSubmitting(true);
    // Bonos y penalidades afectan a toda la House: el servidor elige su fila en la «Sábana».
    const payload = {
      house: selectedHouse.color,                  // Color de la House en la hoja (ej: 'orange')
      operacion: operation.toLowerCase(),          // 'sumar' o 'restar'
      motivo: motivo.trim(),
      puntos: Number(points)
    };

    const body = JSON.stringify(payload);
    if (!pending.current || pending.current.body !== body) {
      pending.current = { body, id: crypto.randomUUID() };
    }
    try {
      const response = await fetch('/arbitraje/api/puntajes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: pending.current.id })
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.error || 'No se confirmó el guardado.');
      setAviso({ tipo: 'exito', texto: 'Puntaje guardado y registrado en el historial.' });
      pending.current = null;
      resetForm();
    } catch (error) {
      // Errores de red o respuestas que no son JSON traen mensajes técnicos del navegador; se reemplazan por uno claro.
      const tecnico = !(error instanceof Error) || ['TypeError', 'SyntaxError'].includes(error.name);
      setAviso({ tipo: 'error', texto: tecnico ? 'No se pudo confirmar el guardado. Reintenta sin cambiar los datos.' : error.message });
    } finally {
      sending.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    selectedHouse, setSelectedHouse,
    operation, setOperation,
    points, setPoints,
    motivo, setMotivo,
    isSubmitting,
    aviso,
    enviarPuntaje
  };

};