import { useState } from 'react';

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
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyVCfzMa_iJEEHn8Hs1KBUBtkk6DfhT58UK77a2QdscxIiH8EbnU8_4NcaYG5Dz4ttjsA/exec';
  const [activity, setActivity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetForm = () => {
    setSelectedHouse(null);
    setPoints('');
    setActivity('');
  };

  const enviarPuntaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouse || !points || !operation || !category || !activity) {
      alert("Por favor completa todos los campos principales (incluyendo categoría y actividad).");
      return;
    }

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
      puntos: Number(points)
    };

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      

      alert(`¡Éxito! Operación enviada a la base de datos para ${selectedHouse.name}.`);
      resetForm();
    } catch (error) {
      console.error("Error al enviar a Sheets:", error);
      alert("Hubo un error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedHouse, setSelectedHouse,
    operation, setOperation,
    category, setCategory,
    points, setPoints,
    activity, setActivity,
    isSubmitting,
    enviarPuntaje
  };

};