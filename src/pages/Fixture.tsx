import { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, Filter, Loader2, RefreshCw, Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface Partido {
  id: number;
  semana: number | string;
  fecha: string;
  dia: string;
  hora: string;
  deporte: string;
  enfrentamiento: string;
  categoria: string;
  arbitro: string;
  apoyo: string;
  lugar: string;
  estado: 'proximo' | 'en-vivo' | 'finalizado';
}

const PARTIDOS_OFICIALES: Partido[] = [
  // ================= SEMANA 1 (25 PARTIDOS) =================
  { id: 1, semana: 1, fecha: '2026-09-14', dia: 'Lunes 14/09/2026', hora: '09:35 - 09:55 am', deporte: 'CONEBALL', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Melissa Gurrionero, Gloria Huaman, Nicol Aguilar, Dayanara Quirica', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 2, semana: 1, fecha: '2026-09-14', dia: 'Lunes 14/09/2026', hora: '09:55 - 10:15 am', deporte: 'BÁSQUET', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Junior (5º y 6º)', arbitro: 'DAVID', apoyo: 'Dayanara Quirica, Jorge Romero, Karla Armas', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 3, semana: 1, fecha: '2026-09-14', dia: 'Lunes 14/09/2026', hora: '10:55 - 11:15 am', deporte: 'BÁSQUET', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Juvenil A (7º y 8º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'Jimena Esteban, David Sajami, Karol Caballero, Diana Liviapoma', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 4, semana: 1, fecha: '2026-09-14', dia: 'Lunes 14/09/2026', hora: '11:15 - 11:35 am', deporte: 'CONEBALL', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Promesas (1º y 2º)', arbitro: 'MARIO NUÑEZ 9A / DAVID', apoyo: 'Tutores y Cotutores, Volantes', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 5, semana: 1, fecha: '2026-09-14', dia: 'Lunes 14/09/2026', hora: '12:55 - 13:15 pm', deporte: 'BÁSQUET', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Juvenil B (9º a 11º)', arbitro: 'ENRIQUE ALCAZAR 9C', apoyo: 'Saira Ramirez, Mario Nuñez, Karol Caballero, Diana Liviapoma - 9C', lugar: 'Campo 1', estado: 'finalizado' },

  { id: 6, semana: 1, fecha: '2026-09-15', dia: 'Martes 15/09/2026', hora: '09:35 - 09:55 am', deporte: 'CONEBALL', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Melissa Gurrionero, Liz Natividad, Valeria Valverde, David Sajami', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 7, semana: 1, fecha: '2026-09-15', dia: 'Martes 15/09/2026', hora: '09:55 - 10:15 am', deporte: 'BÁSQUET', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Junior (5º y 6º)', arbitro: 'DAVID', apoyo: 'Gloria Huaman, Pamela Coronado, Karl Sopla, Mariaelena Castillo', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 8, semana: 1, fecha: '2026-09-15', dia: 'Martes 15/09/2026', hora: '10:55 - 11:15 am', deporte: 'BÁSQUET', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Juvenil A (7º y 8º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'Mario Nuñez, Karol Caballero, David Sajami', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 9, semana: 1, fecha: '2026-09-15', dia: 'Martes 15/09/2026', hora: '11:15 - 11:35 am', deporte: 'CONEBALL', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Promesas (1º y 2º)', arbitro: 'MARIO NUÑEZ / DAVID', apoyo: 'Tutores y Cotutores, Volantes', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 10, semana: 1, fecha: '2026-09-15', dia: 'Martes 15/09/2026', hora: '12:55 - 13:15 pm', deporte: 'BÁSQUET', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Juvenil B (9º a 11º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'Katty Ramos, Luis Figueroa, Saira Ramirez', lugar: 'Campo 1', estado: 'finalizado' },

  { id: 11, semana: 1, fecha: '2026-09-16', dia: 'Miércoles 16/09/2026', hora: '09:35 - 09:55 am', deporte: 'BALONMANO', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Infantil (3º y 4º)', arbitro: 'MARIO NUÑEZ', apoyo: 'Mayra Alarcon, Karla Armas, Jorge Romero, Valeria Valverde', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 12, semana: 1, fecha: '2026-09-16', dia: 'Miércoles 16/09/2026', hora: '09:55 - 10:15 am', deporte: 'BALONMANO', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Junior (5º y 6º)', arbitro: 'MARIO NUÑEZ', apoyo: 'David Sajami, Leakey Gambini, Dayanara Quirica', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 13, semana: 1, fecha: '2026-09-16', dia: 'Miércoles 16/09/2026', hora: '10:55 - 11:15 am', deporte: 'BALONMANO', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Juvenil A (7º y 8º)', arbitro: 'MARIO NUÑEZ', apoyo: 'Luis Figueroa, Katty Ramos, Pamela Coronado', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 14, semana: 1, fecha: '2026-09-16', dia: 'Miércoles 16/09/2026', hora: '11:15 - 11:35 am', deporte: 'BALONMANO', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Promesas (1º y 2º)', arbitro: 'MARIO NUÑEZ 8A / DAVID', apoyo: 'Tutores y Cotutores, Volantes', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 15, semana: 1, fecha: '2026-09-16', dia: 'Miércoles 16/09/2026', hora: '12:55 - 13:15 pm', deporte: 'BALONMANO', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Juvenil B (9º a 11º)', arbitro: 'MARIO NUÑEZ', apoyo: 'David Sajami, Karl Sopla, Pamela coronado', lugar: 'Campo 1', estado: 'finalizado' },

  { id: 16, semana: 1, fecha: '2026-09-17', dia: 'Jueves 17/09/2026', hora: '09:35 - 09:55 am', deporte: 'BALONMANO', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Liz Natividad, David Sajami, Karla Armas, Valeria Valverde', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 17, semana: 1, fecha: '2026-09-17', dia: 'Jueves 17/09/2026', hora: '09:55 - 10:15 am', deporte: 'BALONMANO', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Junior (5º y 6º)', arbitro: 'DAVID', apoyo: 'Leakey Gambini, Jorge Romero, Karla Armas, Pamela coronado', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 18, semana: 1, fecha: '2026-09-17', dia: 'Jueves 17/09/2026', hora: '10:55 - 11:15 am', deporte: 'BALONMANO', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Juvenil A (7º y 8º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'David Sajami, Dayanara, Diana Liviapoma', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 19, semana: 1, fecha: '2026-09-17', dia: 'Jueves 17/09/2026', hora: '11:15 - 11:35 am', deporte: 'BALONMANO', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Promesas (1º y 2º)', arbitro: 'MARIO NUÑEZ / DAVID 9C', apoyo: 'Tutores y Cotutores, Volantes', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 20, semana: 1, fecha: '2026-09-17', dia: 'Jueves 17/09/2026', hora: '12:55 - 13:15 pm', deporte: 'BALONMANO', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Juvenil B (9º a 11º)', arbitro: 'MARIO NUÑEZ', apoyo: 'David Sajami, Dayanara Quirica 9C, Leakey Gambini', lugar: 'Campo 1', estado: 'finalizado' },

  { id: 21, semana: 1, fecha: '2026-09-18', dia: 'Viernes 18/09/2026', hora: '09:35 - 09:55 am', deporte: 'VÓLEY', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Infantil (3º y 4º)', arbitro: 'MARIO NUÑEZ', apoyo: 'Leakey Gambini, Karl Sopla, Marisol Reynaga, Valeria Valverde', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 22, semana: 1, fecha: '2026-09-18', dia: 'Viernes 18/09/2026', hora: '09:55 - 10:15 am', deporte: 'VÓLEY', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Junior (5º y 6º)', arbitro: 'MARIO NUÑEZ', apoyo: 'Karol Caballero, Gloria Huaman, Nicol Aguilar, Leakey Gambini', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 23, semana: 1, fecha: '2026-09-18', dia: 'Viernes 18/09/2026', hora: '10:55 - 11:15 am', deporte: 'VÓLEY', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Juvenil A (7º y 8º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'Diana Liviapoma - 11A, Pamela Coronado, Gloria Huaman, Jimena Esteban', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 24, semana: 1, fecha: '2026-09-18', dia: 'Viernes 18/09/2026', hora: '11:15 - 11:35 am', deporte: 'PASABOLA', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Promesas (1º y 2º)', arbitro: 'MARIO NUÑEZ 9B', apoyo: 'Tutores y Cotutores, Volantes', lugar: 'Campo 1', estado: 'finalizado' },
  { id: 25, semana: 1, fecha: '2026-09-18', dia: 'Viernes 18/09/2026', hora: '12:55 - 13:15 pm', deporte: 'VÓLEY', enfrentamiento: 'ANARANJADO VS AZUL', categoria: 'Juvenil B (9º a 11º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'Luis Figueroa, Mario Nuñez, Saira Ramirez, Larry Delao', lugar: 'Campo 1', estado: 'finalizado' },

  // ================= SEMANA 2 (24 PARTIDOS) =================
  { id: 26, semana: 2, fecha: '2026-09-21', dia: 'Lunes 21/09/2026', hora: '09:35 - 09:55 am', deporte: 'VÓLEY', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Melissa, Gloria, Nicol, Leakey', lugar: 'Campo 1', estado: 'proximo' },
  { id: 27, semana: 2, fecha: '2026-09-21', dia: 'Lunes 21/09/2026', hora: '09:55 - 10:15 am', deporte: 'VÓLEY', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Junior (5º y 6º)', arbitro: 'DAVID', apoyo: 'Dayanara Quirica, Jorge Romero, Karla Armas', lugar: 'Campo 1', estado: 'proximo' },
  { id: 28, semana: 2, fecha: '2026-09-21', dia: 'Lunes 21/09/2026', hora: '10:55 - 11:15 am', deporte: 'VÓLEY', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Juvenil A (7º y 8º)', arbitro: 'KATTY RAMOS', apoyo: 'Jimena Esteban, David Sajami, Karol Caballero, Diana Liviapoma', lugar: 'Campo 1', estado: 'proximo' },
  { id: 29, semana: 2, fecha: '2026-09-21', dia: 'Lunes 21/09/2026', hora: '11:15 - 11:35 am', deporte: 'VÓLEY', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Promesas (1º y 2º)', arbitro: 'MARIO NUÑEZ 9A/DAVID', apoyo: 'Tutores y Cotutores, Volantes', lugar: 'Campo 1', estado: 'proximo' },
  { id: 30, semana: 2, fecha: '2026-09-21', dia: 'Lunes 21/09/2026', hora: '12:55 - 13:15 pm', deporte: 'VÓLEY', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Juvenil B (9º a 11º)', arbitro: 'KATTY RAMOS', apoyo: 'Saira, Mario Nuñez, Karol Caballero, Diana Liviapoma', lugar: 'Campo 1', estado: 'proximo' },

  { id: 31, semana: 2, fecha: '2026-09-22', dia: 'Martes 22/09/2026', hora: '09:35 - 09:55 am', deporte: 'FUTSAL', enfrentamiento: 'VERDE VS AZUL', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Melissa Gurrionero, Liz Natividad, Valeria Valverde', lugar: 'Campo 1', estado: 'proximo' },
  { id: 32, semana: 2, fecha: '2026-09-22', dia: 'Martes 22/09/2026', hora: '09:55 - 10:15 am', deporte: 'FUTSAL', enfrentamiento: 'VERDE VS AZUL', categoria: 'Junior (5º y 6º)', arbitro: 'Karl Sopla', apoyo: 'Pamela Coronado, Gloria Huaman, Mariaelena Castillo', lugar: 'Campo 1', estado: 'proximo' },
  { id: 33, semana: 2, fecha: '2026-09-22', dia: 'Martes 22/09/2026', hora: '10:55 - 11:15 am', deporte: 'FUTSAL', enfrentamiento: 'VERDE VS AZUL', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Larry Delao 10B', apoyo: 'Mario Nuñez, David Sajami, Karol Caballero, Enrique Alcazar', lugar: 'Campo 1', estado: 'proximo' },
  { id: 34, semana: 2, fecha: '2026-09-22', dia: 'Martes 22/09/2026', hora: '11:15 - 11:35 am', deporte: 'FUTSAL', enfrentamiento: 'VERDE VS AZUL', categoria: 'Promesas (1º y 2º)', arbitro: 'MARIO NUÑEZ/DAVID', apoyo: 'Tutores y Cotutores, Volantes', lugar: 'Campo 1', estado: 'proximo' },
  { id: 35, semana: 2, fecha: '2026-09-22', dia: 'Martes 22/09/2026', hora: '12:55 - 13:15 pm', deporte: 'FUTSAL', enfrentamiento: 'VERDE VS AZUL', categoria: 'Juvenil B (9º a 11º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'Katty Ramos, Luis Figueroa, Saira Ramirez', lugar: 'Campo 1', estado: 'proximo' },

  { id: 36, semana: 2, fecha: '2026-09-23', dia: 'Miércoles 23/09/2026', hora: '09:35 - 09:55 am', deporte: 'FUTSAL', enfrentamiento: 'BLANCO VS ANARANJADO', categoria: 'Infantil (3º y 4º)', arbitro: 'MARIO NUÑEZ', apoyo: 'Mayra Alarcon, Karla Armas, Jorge Romero, Valeria Valverde', lugar: 'Campo 1', estado: 'proximo' },
  { id: 37, semana: 2, fecha: '2026-09-23', dia: 'Miércoles 23/09/2026', hora: '09:55 - 10:15 am', deporte: 'FUTSAL', enfrentamiento: 'BLANCO VS ANARANJADO', categoria: 'Junior (5º y 6º)', arbitro: 'MARIO', apoyo: 'David Sajami, Leakey Gambini, Dayanara Quirica', lugar: 'Campo 1', estado: 'proximo' },
  { id: 38, semana: 2, fecha: '2026-09-23', dia: 'Miércoles 23/09/2026', hora: '10:55 - 11:15 am', deporte: 'FUTSAL', enfrentamiento: 'BLANCO VS ANARANJADO', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Larry Delao 10A', apoyo: 'Luis Figueroa, Mario Nuñez, Katty Ramos, Pamela Coronado', lugar: 'Campo 1', estado: 'proximo' },
  { id: 39, semana: 2, fecha: '2026-09-23', dia: 'Miércoles 23/09/2026', hora: '11:15 - 11:35 am', deporte: 'FUTSAL', enfrentamiento: 'BLANCO VS ANARANJADO', categoria: 'Promesas (1º y 2º)', arbitro: 'MARIO NUÑEZ 8A/DAVID', apoyo: 'Tutores y Cotutores, Volantes', lugar: 'Campo 1', estado: 'proximo' },
  { id: 40, semana: 2, fecha: '2026-09-23', dia: 'Miércoles 23/09/2026', hora: '12:55 - 13:15 pm', deporte: 'FUTSAL', enfrentamiento: 'BLANCO VS ANARANJADO', categoria: 'Juvenil B (9º a 11º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'David Sajami, Karl Sopla, Pamela coronado', lugar: 'Campo 1', estado: 'proximo' },

  { id: 41, semana: 2, fecha: '2026-09-24', dia: 'Jueves 24/09/2026', hora: '09:35 - 09:55 am', deporte: 'CONEBALL', enfrentamiento: 'BLANCO VS VERDE', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Liz Natividad, Karla Armas, Valeria Valverde', lugar: 'Campo 1', estado: 'proximo' },
  { id: 42, semana: 2, fecha: '2026-09-24', dia: 'Jueves 24/09/2026', hora: '09:55 - 10:15 am', deporte: 'BÁSQUET', enfrentamiento: 'POR DEFINIR', categoria: 'Junior (5º y 6º)', arbitro: 'DAVID', apoyo: 'Leakey Gambini, Jorge Romero, Karla Armas, Pamela coronado', lugar: 'Campo 1', estado: 'proximo' },
  { id: 43, semana: 2, fecha: '2026-09-24', dia: 'Jueves 24/09/2026', hora: '10:55 - 11:15 am', deporte: 'BÁSQUET', enfrentamiento: 'POR DEFINIR', categoria: 'Juvenil A (7º y 8º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'David Sajami, Enrique, Leakey Gambini, Diana Liviapoma', lugar: 'Campo 1', estado: 'proximo' },
  { id: 44, semana: 2, fecha: '2026-09-24', dia: 'Jueves 24/09/2026', hora: '11:15 - 11:35 am', deporte: 'CONEBALL', enfrentamiento: 'POR DEFINIR', categoria: 'Promesas (1º y 2º)', arbitro: 'MARIO NUÑEZ/DAVID 9C', apoyo: 'Tutores y Cotutores, Volantes', lugar: 'Campo 1', estado: 'proximo' },
  { id: 45, semana: 2, fecha: '2026-09-24', dia: 'Jueves 24/09/2026', hora: '12:55 - 13:15 pm', deporte: 'BÁSQUET', enfrentamiento: 'POR DEFINIR', categoria: 'Juvenil B (9º a 11º)', arbitro: 'ENRIQUE ALCAZAR', apoyo: 'David Sajami, Mario Nuñez, Dayanara Quirica 9C, Leakey Gambini', lugar: 'Campo 1', estado: 'proximo' },

  // VIERNES 25/09 (INAUGURACIÓN Y EVENTOS)
  { id: 46, semana: 2, fecha: '2026-09-25', dia: 'Viernes 25/09/2026', hora: '08:00 - 09:55 am', deporte: 'INAUGURACIÓN', enfrentamiento: 'BIENVENIDA A ESTUDIANTES', categoria: 'Todas las House', arbitro: 'Comisión', apoyo: 'General', lugar: 'Campo Dep. Navarro', estado: 'proximo' },
  { id: 47, semana: 2, fecha: '2026-09-25', dia: 'Viernes 25/09/2026', hora: '09:55 - 10:15 am', deporte: 'INAUGURACIÓN', enfrentamiento: 'DESFILE DE LAS HOUSE', categoria: 'Todas las House', arbitro: 'Comisión', apoyo: 'General', lugar: 'Campo Dep. Navarro', estado: 'proximo' },
  { id: 48, semana: 2, fecha: '2026-09-25', dia: 'Viernes 25/09/2026', hora: '10:55 - 11:15 am', deporte: 'INAUGURACIÓN', enfrentamiento: 'DRILL GIMNÁSTICO', categoria: 'Todas las House', arbitro: 'Comisión', apoyo: 'General', lugar: 'Campo Dep. Navarro', estado: 'proximo' },
  { id: 49, semana: 2, fecha: '2026-09-25', dia: 'Viernes 25/09/2026', hora: '11:15 - 13:15 pm', deporte: 'INAUGURACIÓN', enfrentamiento: 'ENCUENTRO DE PADRES', categoria: 'Todas las House', arbitro: 'Comisión', apoyo: 'General', lugar: 'Campo Dep. Navarro', estado: 'proximo' },

  // ================= SEMANA 3 =================
  { id: 50, semana: 3, fecha: '2026-09-28', dia: 'Lunes 28/09/2026', hora: '09:35 - 09:55 am', deporte: 'BALONMANO', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Infantil (3º y 4º)', arbitro: 'DAVID', apoyo: 'Melissa Gurrionero, Gloria Huaman, Nicol Aguilar, Leakey Gambini', lugar: 'Campo 1', estado: 'proximo' },
  { id: 51, semana: 3, fecha: '2026-09-28', dia: 'Lunes 28/09/2026', hora: '09:55 - 10:15 am', deporte: 'BALONMANO', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Junior (5º y 6º)', arbitro: 'DAVID', apoyo: 'Dayanara Quirica, Jorge Romero, Karla Armas', lugar: 'Campo 1', estado: 'proximo' },
  { id: 52, semana: 3, fecha: '2026-09-28', dia: 'Lunes 28/09/2026', hora: '10:55 - 11:15 am', deporte: 'BALONMANO', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Juvenil A (7º y 8º)', arbitro: 'KATTY RAMOS', apoyo: 'Jimena Esteban, David Sajami, Karol Caballero, Diana Liviapoma', lugar: 'Campo 1', estado: 'proximo' },
  { id: 53, semana: 3, fecha: '2026-09-28', dia: 'Lunes 28/09/2026', hora: '11:15 - 11:35 am', deporte: 'BALONMANO', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Promesas (1º y 2º)', arbitro: 'MARIO NUÑEZ 9A/DAVID', apoyo: 'Tutores y Cotutores, Volantes', lugar: 'Campo 1', estado: 'proximo' },
  { id: 54, semana: 3, fecha: '2026-09-28', dia: 'Lunes 28/09/2026', hora: '12:55 - 13:15 pm', deporte: 'BALONMANO', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Juvenil B (9º a 11º)', arbitro: 'KATTY RAMOS', apoyo: 'Saira Ramirez, Mario Nuñez, Karol Caballero, Diana Liviapoma', lugar: 'Campo 1', estado: 'proximo' },

  { id: 55, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '08:00 - 08:20 am', deporte: 'CARRERAS', enfrentamiento: 'PRELIMINAR', categoria: 'Promesas (1º y 2º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 56, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '08:20 - 08:40 am', deporte: 'CARRERAS', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Promesas (1º y 2º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 57, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '08:40 - 09:00 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Promesas (1º y 2º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 63, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '12:00 - 12:20 pm', deporte: 'CARRERAS', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 64, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '12:20 - 12:40 pm', deporte: 'CARRERAS', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 65, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '12:40 - 01:00 pm', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 66, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '01:00 - 01:20 pm', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 67, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '01:20 - 01:40 pm', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 68, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '01:40 - 02:00 pm', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 58, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '09:35 - 09:55 am', deporte: 'POR DEFINIR', enfrentamiento: 'POR DEFINIR', categoria: 'Infantil (3º y 4º)', arbitro: 'Por asignar', apoyo: 'Por asignar', lugar: 'Campo 1', estado: 'proximo' },
  { id: 59, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '09:55 - 10:15 am', deporte: 'POR DEFINIR', enfrentamiento: 'POR DEFINIR', categoria: 'Junior (5º y 6º)', arbitro: 'Por asignar', apoyo: 'Por asignar', lugar: 'Campo 1', estado: 'proximo' },
  { id: 60, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '10:55 - 11:15 am', deporte: 'POR DEFINIR', enfrentamiento: 'POR DEFINIR', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Por asignar', apoyo: 'Por asignar', lugar: 'Campo 1', estado: 'proximo' },
  { id: 61, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '11:15 - 11:35 am', deporte: 'POR DEFINIR', enfrentamiento: 'POR DEFINIR', categoria: 'Promesas (1º y 2º)', arbitro: 'Por asignar', apoyo: 'Por asignar', lugar: 'Campo 1', estado: 'proximo' },
  { id: 62, semana: 3, fecha: '2026-09-29', dia: 'Martes 29/09/2026', hora: '12:55 - 13:15 pm', deporte: 'POR DEFINIR', enfrentamiento: 'POR DEFINIR', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Por asignar', apoyo: 'Por asignar', lugar: 'Campo 1', estado: 'proximo' },

  { id: 69, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '08:00 - 08:20 am', deporte: 'CARRERAS', enfrentamiento: 'PRELIMINAR', categoria: 'Promesas (1º y 2º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 70, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '08:20 - 08:40 am', deporte: 'CARRERAS', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Promesas (1º y 2º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 71, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '08:40 - 09:00 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Promesas (1º y 2º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 72, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '09:00 - 09:20 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Promesas (1º y 2º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 73, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '09:20 - 09:40 am', deporte: 'CARRERAS', enfrentamiento: 'PRELIMINAR', categoria: 'Infantil (3º y 4º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 74, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '09:40 - 10:00 am', deporte: 'CARRERAS', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Infantil (3º y 4º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 75, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '10:00 - 10:20 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Infantil (3º y 4º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 76, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '10:20 - 10:40 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Infantil (3º y 4º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 77, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '10:40 - 11:00 am', deporte: 'CARRERAS', enfrentamiento: 'PRELIMINAR', categoria: 'Junior (5º y 6º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 78, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '11:00 - 11:20 am', deporte: 'CARRERAS', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Junior (5º y 6º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 79, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '11:20 - 11:40 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Junior (5º y 6º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 80, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '11:40 - 12:00 pm', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Junior (5º y 6º)', arbitro: 'Larry Delao', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 81, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '12:00 - 12:20 pm', deporte: 'CARRERAS', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 82, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '12:20 - 12:40 pm', deporte: 'CARRERAS', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 83, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '12:40 - 01:00 pm', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 84, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '01:00 - 01:20 pm', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 85, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '01:20 - 01:40 pm', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 86, semana: 3, fecha: '2026-09-30', dia: 'Miércoles 30/09/2026', hora: '01:40 - 02:00 pm', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },

  { id: 87, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '08:00 - 08:20 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Promesas (1º y 2º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 2', estado: 'proximo' },
  { id: 88, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '08:20 - 08:40 am', deporte: 'FÚTBOL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Promesas (1º y 2º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 2', estado: 'proximo' },
  { id: 89, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '08:40 - 09:00 am', deporte: 'GYMKANA', enfrentamiento: 'PRELIMINAR', categoria: 'Promesas (1º y 2º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 90, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '09:00 - 09:20 am', deporte: 'GYMKANA', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Promesas (1º y 2º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 91, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '08:40 - 09:00 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Infantil (3º y 4º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 2', estado: 'proximo' },
  { id: 92, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '09:00 - 09:20 am', deporte: 'FÚTBOL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Infantil (3º y 4º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 2', estado: 'proximo' },
  { id: 93, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '08:00 - 08:20 am', deporte: 'GYMKANA', enfrentamiento: 'PRELIMINAR', categoria: 'Infantil (3º y 4º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 94, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '08:20 - 08:40 am', deporte: 'GYMKANA', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Infantil (3º y 4º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 95, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '08:40 - 09:00 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Junior (5º y 6º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 2', estado: 'proximo' },
  { id: 96, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '09:00 - 09:20 am', deporte: 'FÚTBOL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Junior (5º y 6º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 2', estado: 'proximo' },
  { id: 97, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '08:40 - 09:00 am', deporte: 'GYMKANA', enfrentamiento: 'PRELIMINAR', categoria: 'Junior (5º y 6º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 98, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '09:00 - 09:20 am', deporte: 'GYMKANA', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Junior (5º y 6º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 99, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '09:20 - 09:40 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 100, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '09:40 - 10:00 am', deporte: 'FÚTBOL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 101, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '10:00 - 10:20 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 102, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '10:20 - 10:40 am', deporte: 'FÚTBOL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Katy', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 103, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '10:40 - 11:00 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 104, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '11:00 - 11:20 am', deporte: 'FÚTBOL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 105, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '11:20 - 11:40 am', deporte: 'FÚTBOL', enfrentamiento: 'PRELIMINAR', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },
  { id: 106, semana: 3, fecha: '2026-10-01', dia: 'Jueves 01/10/2026', hora: '11:40 - 12:00 pm', deporte: 'FÚTBOL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Enrique Alcazar', apoyo: 'Mesa: David y Mario', lugar: 'Campo 1', estado: 'proximo' },

  // VIERNES 02/10 (FINALES)
  { id: 107, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '08:00 - 08:20 am', deporte: 'FINAL', enfrentamiento: '1ER Y 2DO PUESTO', categoria: 'Promesas (1º y 2º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 2', estado: 'proximo' },
  { id: 108, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '08:20 - 08:40 am', deporte: 'FINAL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Promesas (1º y 2º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 109, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '08:40 - 09:00 am', deporte: 'FINAL', enfrentamiento: '1ER Y 2DO PUESTO', categoria: 'Promesas (1º y 2º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 110, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '09:00 - 09:20 am', deporte: 'FINAL', enfrentamiento: '1ER Y 2DO PUESTO', categoria: 'Infantil (3º y 4º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 2', estado: 'proximo' },
  { id: 111, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '09:20 - 09:40 am', deporte: 'FINAL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Infantil (3º y 4º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 112, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '09:40 - 10:00 am', deporte: 'FINAL', enfrentamiento: '1ER Y 2DO PUESTO', categoria: 'Infantil (3º y 4º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 113, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '10:00 - 10:20 am', deporte: 'FINAL', enfrentamiento: '1ER Y 2DO PUESTO', categoria: 'Junior (5º y 6º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 114, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '10:40 - 11:00 am', deporte: 'FINAL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Junior (5º y 6º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 115, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '11:00 - 11:20 am', deporte: 'FINAL', enfrentamiento: '1ER Y 2DO PUESTO', categoria: 'Junior (5º y 6º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 116, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '11:20 - 11:40 am', deporte: 'FINAL', enfrentamiento: '1ER Y 2DO PUESTO', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 117, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '11:40 - 12:00 pm', deporte: 'FINAL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 118, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '12:00 - 12:20 pm', deporte: 'FINAL', enfrentamiento: '1ER Y 2DO PUESTO', categoria: 'Juvenil A (7º y 8º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 119, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '12:20 - 12:40 pm', deporte: 'FINAL', enfrentamiento: 'PRELIMINAR 2DO TIEMPO DAMAS', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 120, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '12:40 - 01:00 pm', deporte: 'FINAL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 121, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '01:00 - 01:20 pm', deporte: 'FINAL', enfrentamiento: '1ER Y 2DO PUESTO', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 122, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '01:20 - 01:40 pm', deporte: 'FINAL', enfrentamiento: '3ER Y 4TO PUESTO', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' },
  { id: 123, semana: 3, fecha: '2026-10-02', dia: 'Viernes 02/10/2026', hora: '01:40 - 02:00 pm', deporte: 'FINAL', enfrentamiento: '1ER Y 2DO PUESTO', categoria: 'Juvenil B (9º a 11º)', arbitro: 'Comisión', apoyo: 'Mesa Oficial', lugar: 'Campo 1', estado: 'proximo' }
];

export default function Fixture() {
  const [partidos, setPartidos] = useState<Partido[]>(PARTIDOS_OFICIALES);
  
  const [cargando, setCargando] = useState<boolean>(true);
  const [actualizando, setActualizando] = useState<boolean>(false);
  const [filtroSemana, setFiltroSemana] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'proximo' | 'en-vivo' | 'finalizado'>('todos');
  
  const [diasExpandidos, setDiasExpandidos] = useState<Record<string, boolean>>({});

  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw6v_-hQor-DMh7Mg2qtodwpuIiXIuCOqqtV3mY3Gs5ueqZBrDH8LORqa7RTMWhIH1uqw/exec';

  const sincronizarDatos = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    if (silencioso) setActualizando(true);
    
    try {
      const respuesta = await fetch(WEB_APP_URL);
      if (!respuesta.ok) throw new Error('Error al conectar con la red');
      const json = await respuesta.json();
      
      if (json.partidos && json.partidos.length > 0) {
        const mapeados = json.partidos.map((item: any, index: number) => ({
          id: item.id || index + 1,
          semana: item.semana || 1,
          fecha: item.fecha || '',
          dia: item.dia || item.fecha || 'Día Programado',
          hora: item.hora || 'Por definir',
          deporte: item.deporte || 'Deporte',
          enfrentamiento: item.enfrentamiento || 'Equipo A VS Equipo B',
          categoria: item.categoria || 'General',
          arbitro: item.arbitro || 'Por asignar',
          apoyo: item.apoyo || '',
          lugar: item.lugar || 'Campo 1',
          estado: (item.estado || (index === 0 ? 'en-vivo' : index % 2 === 0 ? 'proximo' : 'finalizado')).toLowerCase() as 'proximo' | 'en-vivo' | 'finalizado'
        }));
        setPartidos(mapeados);
      } else {
        setPartidos(PARTIDOS_OFICIALES);
      }
    } catch (error) {
      setPartidos(PARTIDOS_OFICIALES);
      console.log('Usando datos oficiales de respaldo.');
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useEffect(() => {
    sincronizarDatos(false);
    const intervalo = setInterval(() => {
      sincronizarDatos(true);
    }, 30000);
    return () => clearInterval(intervalo);
  }, []);

  const semanasDisponibles = Array.from(new Set(partidos.map(p => String(p.semana)))).sort((a, b) => Number(a) - Number(b));

  const partidosFiltrados = partidos.filter(p => {
    const cumpleSemana = filtroSemana === 'todos' || String(p.semana) === filtroSemana;
    const cumpleEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    return cumpleSemana && cumpleEstado;
  });

  const partidosAgrupados = partidosFiltrados.reduce((acc: { [semana: string]: { [dia: string]: Partido[] } }, partido) => {
    const semKey = `Semana ${partido.semana}`;
    const diaKey = String(partido.dia || 'Día Programado');

    if (!acc[semKey]) acc[semKey] = {};
    if (!acc[semKey][diaKey]) acc[semKey][diaKey] = [];
    acc[semKey][diaKey].push(partido);

    return acc;
  }, {});

  const toggleDia = (diaTitulo: string) => {
    setDiasExpandidos(prev => ({
      ...prev,
      [diaTitulo]: !prev[diaTitulo]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Calendario Oficial por Semanas y Días
          </h1>
          <p className="text-slate-500 text-sm">Cronograma interactivo sincronizado en tiempo real con Google Sheets.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => sincronizarDatos(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <RefreshCw size={14} className={actualizando || cargando ? "animate-spin" : ""} />
            {actualizando ? "Sincronizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 flex-1">
          <Layers size={16} className="text-slate-400 ml-2 shrink-0" />
          <span className="text-xs font-bold text-slate-600 shrink-0">Semanas:</span>
          <button
            onClick={() => setFiltroSemana('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filtroSemana === 'todos' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas
          </button>
          {semanasDisponibles.map(sem => (
            <button
              key={sem}
              onClick={() => setFiltroSemana(sem)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filtroSemana === sem ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semana {sem}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-3 overflow-x-auto">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroEstado === 'todos' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroEstado('en-vivo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroEstado === 'en-vivo' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            En Vivo
          </button>
          <button
            onClick={() => setFiltroEstado('proximo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroEstado === 'proximo' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Próximos
          </button>
          <button
            onClick={() => setFiltroEstado('finalizado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroEstado === 'finalizado' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Finalizados
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
          <p className="text-slate-500 font-medium text-sm">Cargando cronograma...</p>
        </div>
      ) : Object.keys(partidosAgrupados).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-400 font-medium">No hay partidos registrados aún en la base de datos.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(partidosAgrupados).map(([semanaTitulo, diasMap]) => (
            <div key={semanaTitulo} className="space-y-6">
              
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-600 text-white font-extrabold px-4 py-1.5 rounded-xl text-base shadow-sm">
                  {semanaTitulo}
                </div>
                <div className="h-px flex-1 bg-blue-100"></div>
              </div>

              <div className="space-y-4 pl-1 md:pl-2">
                {Object.entries(diasMap).map(([diaTitulo, listaPartidos]) => {
                  const estaExpandido = diasExpandidos[diaTitulo] ?? false; 
                  
                  return (
                    <div key={diaTitulo} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      
                      <button 
                        onClick={() => toggleDia(diaTitulo)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-50/50 transition-colors cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors shadow-inner ${estaExpandido ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                            <Calendar size={20} strokeWidth={2.5} />
                          </div>
                          <div className="text-left">
                            <h3 className="text-[16px] font-black text-slate-800 tracking-tight">{diaTitulo}</h3>
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              {listaPartidos.length} {listaPartidos.length === 1 ? 'partido' : 'partidos'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-slate-400 bg-slate-50 p-2 rounded-lg transition-transform duration-200">
                          {estaExpandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </button>

                      {estaExpandido && (
                        <div className="p-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {listaPartidos.map((partido) => {
                              const tieneVs = partido.enfrentamiento.includes('VS');
                              const equipos = tieneVs ? partido.enfrentamiento.split('VS') : [partido.enfrentamiento, ''];

                              return (
                                <div key={partido.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                                  <div className={`absolute top-0 left-0 bottom-0 w-2 ${
                                    partido.estado === 'en-vivo' ? 'bg-red-500 animate-pulse' :
                                    partido.estado === 'proximo' ? 'bg-amber-400' : 'bg-slate-400'
                                  }`} />

                                  <div className="flex justify-between items-center mb-3 pl-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                                      {partido.deporte}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                      <Trophy size={14} className="text-yellow-500" />
                                      {partido.categoria}
                                    </span>
                                  </div>

                                  {tieneVs ? (
                                    <div className="flex items-center justify-between my-4 pl-2">
                                      <div className="flex-1 text-right font-bold text-slate-800 text-base">
                                        {equipos[0]?.trim() || 'Equipos'}
                                      </div>
                                      <div className="px-3 text-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-md">
                                          vs
                                        </span>
                                      </div>
                                      <div className="flex-1 text-left font-bold text-slate-800 text-base">
                                        {equipos[1]?.trim() || 'Mixtos'}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center my-4 pl-2 font-black text-slate-800 text-lg tracking-tight">
                                      {partido.enfrentamiento}
                                    </div>
                                  )}

                                  <div className="space-y-1.5 pt-3 border-t border-slate-100 pl-2 text-xs text-slate-500">
                                    <div className="flex items-center justify-between">
                                      <span className="flex items-center gap-1">
                                        <Clock size={14} className="text-slate-400" />
                                        {partido.hora}
                                      </span>
                                      <span className="font-bold text-indigo-600">Árbitro: {partido.arbitro}</span>
                                    </div>
                                    {partido.apoyo && (
                                      <div className="text-slate-400 text-[11px] truncate flex justify-between items-center">
                                        <span>{partido.apoyo}</span>
                                        <span className="font-semibold text-slate-400">Campo {partido.lugar}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}