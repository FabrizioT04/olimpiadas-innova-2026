import { useState, useRef } from 'react';

// 1. Importamos las imágenes desde la carpeta assets
// (Vite se encargará de optimizarlas cuando subas la web a Cloudflare)
import imgDolphins from '../../../assets/dolphins.png';
import imgSeagulls from '../../../assets/seagulls.png';
import imgEagles from '../../../assets/eagles.png';
import imgHorses from '../../../assets/horses.png';

export interface House {
  id: string;
  name: string;
  color: 'blue' | 'gray' | 'green' | 'orange';
  img: string; 
}

// 2. Reemplazamos los emojis por las variables de las imágenes
export const HOUSES: House[] = [
  { id: 'dolphins', name: 'DOLPHINS', color: 'blue', img: imgDolphins },
  { id: 'seagulls', name: 'SEAGULLS', color: 'gray', img: imgSeagulls },
  { id: 'eagles', name: 'EAGLES', color: 'green', img: imgEagles },
  { id: 'horses', name: 'HORSES', color: 'orange', img: imgHorses }
];

export const useArbitraje = () => {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [operation, setOperation] = useState('');
  const [category, setCategory] = useState('');
  const [points, setPoints] = useState('');
  const [motivo, setMotivo] = useState('');
  const pending = useRef<{ body: string; id: string } | null>(null);
  const sending = useRef(false);
  const [activity, setActivity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetForm = () => {
    setSelectedHouse(null);
    setPoints('');
    setActivity('');
    setMotivo('');
  };

  const enviarPuntaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending.current) return;
    if (!selectedHouse || !points || !operation || !category || !activity) {
      alert("Por favor completa todos los campos principales (incluyendo categoría y actividad).");
      return;
    }

    if (!Number.isSafeInteger(Number(points)) || Number(points) < 1 || Number(points) > 10000 || motivo.trim().length < 3) {
      alert('Ingresa puntos enteros entre 1 y 10000 y un motivo de al menos 3 caracteres.');
      return;
    }
    sending.current = true;
    setIsSubmitting(true);
    // 1. Diccionario traductor de eSports a Colores de tu Excel
    const traductorEquipos: Record<string, string> = {
      'HORSES': 'orange',
      'DOLPHINS': 'blue',
      'EAGLES': 'green',
      'SEAGULLS': 'white'
    };

    // 2. Construimos el Payload EXACTO que espera tu Apps Script
    const payload = {
      house: traductorEquipos[selectedHouse.name], // Traduce 'HORSES' a 'orange'
      operacion: operation.toLowerCase(),          // 'sumar' o 'restar'
      categoria: category.toLowerCase(),           // 'promesas', 'infantil', etc.
      fila: parseInt(activity, 10),                // El número de fila del Excel (ej: 8)
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
      alert('Puntaje guardado y registrado en el historial.');
      pending.current = null;
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo confirmar el guardado. Reintenta sin cambiar los datos.');
    } finally {
      sending.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    selectedHouse, setSelectedHouse,
    operation, setOperation,
    category, setCategory,
    points, setPoints,
    activity, setActivity,
    motivo, setMotivo,
    isSubmitting,
    enviarPuntaje
  };

};