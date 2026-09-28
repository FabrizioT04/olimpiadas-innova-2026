import { Users, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ActividadRegla {
  id: string;
  category: string;
  title: string;
  grades: string;
  description: string;
  tags: { icon: LucideIcon; text: string }[];
  rules: string;
  source?: { url: string; page: number };
  note?: string;
}

// Transcripción resumida de los PDF publicados en /bases.
// Las ausencias y contradicciones de las bases se señalan, no se completan por inferencia.
const extraidas = [
  {
    "id": "com-cuentos",
    "category": "Comunicación",
    "title": "¡Cuenta Cuentos!",
    "grades": "Promesas • 1° y 2° grado",
    "description": "Narran un cuento elaborado o seleccionado siguiendo las indicaciones del docente, con creatividad y una voz clara y segura.",
    "participants": "Cantidad no indicada en las bases",
    "duration": "Máximo 5 min",
    "rules": "Desarrollo: inscribirse, preparar el cuento y presentarlo el día del evento. Se realiza en una única fecha, sin eliminatorias.\nCómo se gana: se suman los puntos de la rúbrica del jurado.\nReglas clave: se admiten cuentos originales o seleccionados; respetar el máximo de 5 minutos y las indicaciones del docente.",
    "source": {
      "url": "/bases/comunicacion.pdf",
      "page": 2
    }
  },
  {
    "id": "com-lucha-infantil",
    "category": "Comunicación",
    "title": "Lucha Libro",
    "grades": "Infantil • 3° y 4° grado",
    "description": "Dos participantes escriben una historia creativa incorporando tres palabras extraídas al azar. El público observa la escritura proyectada.",
    "participants": "2 participantes por enfrentamiento",
    "duration": "3 a 5 min, según el jurado",
    "rules": "Desarrollo: presentarse con seudónimo y, si se desea, antifaz. Antes de iniciar se sortean 3 palabras; todas deben aparecer en la historia. Se realiza en una sola fecha.\nMateriales: dos laptops con sus proyectores y un recipiente con palabras.\nEvaluación: creatividad, coherencia y cohesión, uso adecuado de las 3 palabras, originalidad, presentación y ortografía. Gana la mejor redacción según la rúbrica.",
    "source": {
      "url": "/bases/comunicacion.pdf",
      "page": 4
    }
  },
  {
    "id": "com-lucha-junior",
    "category": "Comunicación",
    "title": "Lucha Libro",
    "grades": "Junior • 5° y 6° grado",
    "description": "Escriben una historia propia que incluya cinco palabras sorteadas antes de empezar; cada texto se proyecta mientras se redacta.",
    "participants": "2 participantes por enfrentamiento",
    "duration": "3 a 5 min, según el jurado",
    "rules": "Inscripción: libre con el docente de Comunicación, completando una ficha. Presentarse con seudónimo y un atuendo relacionado; el antifaz es opcional.\nReglas clave: historia de creación propia, incluir las 5 palabras y respetar las normas y buenas costumbres de la institución. Una única fecha, sin etapas preliminares.\nMateriales: dos laptops con proyectores y un recipiente con palabras.\nCómo se gana: el jurado evalúa las redacciones con la rúbrica; gana la mejor redacción.",
    "source": {
      "url": "/bases/comunicacion.pdf",
      "page": 3
    }
  },
  {
    "id": "com-debate-a",
    "category": "Comunicación",
    "title": "Juego de Debate",
    "grades": "Juvenil A • 7° y 8° grado",
    "description": "Defienden una postura con argumentos claros, sólidos y respaldados por evidencias, conectando las ideas y respetando otras opiniones.",
    "participants": "Equipos de 4 a 6 integrantes",
    "duration": "1 a 3 min por participante",
    "rules": "Desarrollo: inscripción por equipos, selección del tema y orden de presentación mediante ruleta. En la primera ronda clasifican 3 equipos por aula; siguen semifinales y finales.\nCómo se gana: suma de los puntos de la rúbrica del jurado.\nCriterios legibles de las bases: calidad de argumentos, refutación, evidencias, conexión entre ideas y uso del tiempo.",
    "source": {
      "url": "/bases/comunicacion.pdf",
      "page": 5
    },
    "note": "Tiempo por confirmar: la misma página también indica 2 minutos por orador. El docente debe precisar la duración; parte del texto de la rúbrica no es legible."
  },
  {
    "id": "com-debate-b",
    "category": "Comunicación",
    "title": "Juego de Debate",
    "grades": "Juvenil B • 9°, 10° y 11° grado",
    "description": "Analizan un tema y defienden posturas claras con argumentos profundos, fuentes confiables, conexión lógica y persuasión.",
    "participants": "Equipos de 4 a 6 integrantes",
    "duration": "1 a 3 min por participante",
    "rules": "Desarrollo: inscripción, selección del tema y orden por ruleta. Clasifican 3 equipos por aula a las siguientes etapas; se realizan semifinales y finales.\nCómo se gana: suma de la rúbrica del jurado.\nReglas clave: respetar el tiempo asignado y sustentar las ideas con fuentes confiables, especialmente en semifinales y finales.",
    "source": {
      "url": "/bases/comunicacion.pdf",
      "page": 5
    },
    "note": "Parte del texto de la rúbrica del PDF no es legible. Los criterios específicos deben confirmarse con el docente."
  },
  {
    "id": "dpsc-rayuela",
    "category": "DPSC",
    "title": "Rayuela en quechua",
    "grades": "Infantil • 3° y 4° grado",
    "description": "Recorren una rayuela de diez casillas, anunciando en quechua el número al lanzar la piedra y saltando sin pisar la casilla marcada.",
    "participants": "4 estudiantes por equipo",
    "duration": "10 min",
    "rules": "Materiales: tiza, piedra o marcador y tablero con 10 casillas numeradas en quechua.\nReglas clave: jugar por turnos; saltar con uno o ambos pies según la casilla. Pisar una línea o la piedra hace perder el turno y obliga a comenzar de nuevo en la siguiente ronda.\nCómo se gana: completar todas las casillas correctamente. Puntajes publicados por puesto: 1.º = 10; 2.º = 7; 3.º = 5; 4.º = 3.",
    "source": {
      "url": "/bases/dpsc.pdf",
      "page": 2
    }
  },
  {
    "id": "dpsc-convivencia",
    "category": "DPSC",
    "title": "Mensajes para convivir mejor",
    "grades": "Junior • 5° y 6° grado",
    "description": "Analizan una situación de convivencia y presentan un anuncio o consejo que explique qué ocurre, qué se debe hacer y por qué.",
    "participants": "2 estudiantes por equipo",
    "duration": "2 min de preparación + 1 min de presentación",
    "rules": "Materiales: tarjetas de situaciones y cronómetro.\nDesarrollo: recibir una tarjeta, preparar el mensaje y presentarlo ante el público; ambos integrantes deben intervenir.\nEvaluación: claridad, pertinencia de la solución, expresión oral y trabajo en equipo; cada indicador se valora de 1 a 10. Gana el mayor puntaje acumulado.\nCasos del anexo: excluir integrantes, discutir por perder, incumplir reglas, no cumplir un rol o reclamar al jurado sin respeto.",
    "source": {
      "url": "/bases/dpsc.pdf",
      "page": 3
    }
  },
  {
    "id": "dpsc-ajedrez-a",
    "category": "DPSC",
    "title": "El ajedrez andino",
    "grades": "Juvenil A • 7° y 8° grado",
    "description": "Un zorro intenta capturar a las doce ovejas; las ovejas buscan llegar a la gruta o dejar al zorro sin movimientos.",
    "participants": "4 estudiantes por equipo",
    "duration": "10 min por partida",
    "rules": "Materiales: tablero, lápiz, 1 ficha oscura (zorro) y 12 claras (ovejas). Colocar las ovejas en las intersecciones indicadas y el zorro en el centro.\nTurnos: comienzan las ovejas; avanzan una casilla horizontal, vertical o diagonal, sin retroceder. El zorro mueve una casilla en cualquier dirección y puede retroceder.\nCaptura: el zorro salta sobre una oveja hacia una casilla libre; se retira la ficha capturada.\nCómo se gana: el zorro gana al capturar todas las ovejas; las ovejas, al encerrar al zorro o llegar una a la gruta. Cada captura o llegada a la gruta suma 1 punto; gana el equipo con mayor acumulado al terminar las partidas.",
    "source": {
      "url": "/bases/dpsc.pdf",
      "page": 4
    }
  },
  {
    "id": "dpsc-ajedrez-b",
    "category": "DPSC",
    "title": "El ajedrez andino",
    "grades": "Juvenil B • 9°, 10° y 11° grado",
    "description": "Un zorro intenta capturar a las doce ovejas; las ovejas buscan llegar a la gruta o dejar al zorro sin movimientos.",
    "participants": "4 estudiantes por equipo",
    "duration": "10 min por partida",
    "rules": "Materiales: tablero, lápiz, 1 ficha oscura (zorro) y 12 claras (ovejas). Colocar las ovejas en las intersecciones indicadas y el zorro en el centro.\nTurnos: comienzan las ovejas; avanzan una casilla horizontal, vertical o diagonal, sin retroceder. El zorro mueve una casilla en cualquier dirección y puede retroceder.\nCaptura: el zorro salta sobre una oveja hacia una casilla libre; se retira la ficha capturada.\nCómo se gana: el zorro gana al capturar todas las ovejas; las ovejas, al encerrar al zorro o llegar una a la gruta. Cada captura o llegada a la gruta suma 1 punto; gana el equipo con mayor acumulado al terminar las partidas.",
    "source": {
      "url": "/bases/dpsc.pdf",
      "page": 6
    }
  },
  {
    "id": "arte-promesas",
    "category": "Arte",
    "title": "Bailando con las máscaras mágicas",
    "grades": "Promesas • 1° y 2° grado",
    "description": "Observan máscaras de la cultura peruana, eligen un personaje y crean una máscara para contar una historia mediante un baile en equipo.",
    "participants": "Cantidad no indicada en las bases",
    "duration": "Duración no indicada en las bases",
    "rules": "Desarrollo: observar referentes como Diablada y Huaconada; diseñar y decorar la máscara con colores y papel; dramatizar y bailar en equipo; presentar el baile.\nEvaluación: creatividad y diseño de la máscara, expresión y coordinación en el baile, y trabajo en equipo. Cada criterio vale de 1 a 3 puntos; total máximo: 9.",
    "source": {
      "url": "/bases/arte-promesas.pdf",
      "page": 1
    }
  },
  {
    "id": "arte-infantil",
    "category": "Arte",
    "title": "El mural que habla",
    "grades": "Infantil • 3° y 4° grado",
    "description": "Crean un mural colectivo y explican en grupo el mensaje que quieren transmitir.",
    "participants": "Equipos de 6 a 8 estudiantes",
    "duration": "Duración no indicada en las bases",
    "rules": "Desarrollo: elegir el tema, planificar el diseño, elaborar el mural y presentar su mensaje.\nTemas sugeridos: mi comunidad ideal, diversidad cultural, el mundo de mis sueños, superhéroes o mis emociones.\nMateriales: papel kraft grande, témperas y collage con recortes y telas.\nEvaluación: el PDF no detalla rúbrica ni puntajes.",
    "source": {
      "url": "/bases/arte-infantil.pdf",
      "page": 1
    }
  },
  {
    "id": "arte-junior",
    "category": "Arte",
    "title": "¡Cantemos juntos!",
    "grades": "Junior • 5° y 6° grado",
    "description": "Reflexionan sobre el trabajo en equipo, aprecian la canción «Contigo Perú» y componen una canción motivadora para cantarla juntos.",
    "participants": "Equipos de 6 a 8 estudiantes",
    "duration": "Duración no indicada en las bases",
    "rules": "Desarrollo: reflexionar sobre la unión del equipo; analizar el significado y las emociones de «Contigo Perú»; escribir una letra motivadora y crear un ritmo; cantar la canción en grupo.\nEvaluación: el PDF no especifica rúbrica ni puntajes.",
    "source": {
      "url": "/bases/arte-junior.pdf",
      "page": 1
    }
  },
  {
    "id": "arte-juvenil-a",
    "category": "Arte",
    "title": "Perú en Escena / FusionArte",
    "grades": "Juvenil A • 7° y 8° grado",
    "description": "Seleccionan una manifestación peruana y crean una presentación que integra danza, teatro, música y artes visuales.",
    "participants": "Equipos de 6 a 8 estudiantes",
    "duration": "Duración no indicada en esta ficha",
    "rules": "Desarrollo: escoger una manifestación como marinera, retablos o mitos; distribuir los roles de músicos, bailarines, actores y artistas visuales; crear la puesta en escena y presentarla ante el jurado.\nEvaluación: esta ficha no publica rúbrica ni puntajes.",
    "source": {
      "url": "/bases/arte-juvenil-a.pdf",
      "page": 1
    }
  },
  {
    "id": "arte-juvenil-b",
    "category": "Arte",
    "title": "¡Perú en escena!",
    "grades": "Juvenil B • 9°, 10° y 11° grado",
    "description": "Reinterpretan una manifestación peruana mediante danza, música, teatro y artes visuales, incluyendo un mensaje de relevancia actual.",
    "participants": "Equipos de 6 a 8 (ficha FusionArte)",
    "duration": "5 min de reto + 20 min de preparación + 5 min por equipo",
    "rules": "Desarrollo: recibir la manifestación (danza, mito o arte visual), descubrir el reto, asignar roles y preparar la representación.\nMateriales recomendados: papel, cartulina, marcadores, telas, material reciclado, reproductor o instrumentos simples y elementos escenográficos.\nCómo se gana: evaluación del jurado. En caso de empate, se considera el mayor entusiasmo colectivo.\nParticipantes: la ficha FusionArte compartida para Juvenil A y B indica equipos de 6 a 8.",
    "source": {
      "url": "/bases/arte-juvenil-b.pdf",
      "page": 1
    }
  },
  {
    "id": "ef-futsal",
    "category": "Educación Física",
    "title": "Fútsal",
    "grades": "Todas • 1° a 11° grado",
    "description": "Compiten por Houses; se suman los goles del tiempo femenino y del masculino para decidir el resultado.",
    "participants": "6 titulares + 4 suplentes por equipo femenino y masculino",
    "duration": "2 tiempos de 12 min; Promesas e Infantil: 10 min por tiempo",
    "rules": "Formato: eliminación simple, clasificatorio y final por sorteo; los no clasificados disputan 3.º y 4.º puesto. El partido por 3.º y 4.º puesto dura 2 tiempos de 10 minutos.\nOrden: mujeres en el primer tiempo y hombres en el segundo; inscripción distribuida equitativamente entre los grados.\nCambios: al menos 3 por partido, anunciados al árbitro; sin reingreso. Se permiten cambios adicionales manteniendo el mínimo de jugadores.\nDesempate: 3 penales ejecutados por el equipo del segundo tiempo.\nMateriales: pelota, cancha y arcos; puede dividirse la cancha para Promesas e Infantil.\nLas bases remiten al reglamento FIFA para lo no contemplado.",
    "source": {
      "url": "/bases/educacion-fisica.pdf",
      "page": 2
    },
    "note": "Por confirmar con Educación Física: el apartado «Pases y Gol» del PDF indica pases y lanzamientos con la mano, pese a titularse Fútsal. No se ha reinterpretado esa regla."
  },
  {
    "id": "ef-balonmano",
    "category": "Educación Física",
    "title": "Balonmano",
    "grades": "Todas • 1° a 11° grado",
    "description": "Realizan pases con las manos y lanzamientos a gol; el resultado suma los goles de ambos tiempos.",
    "participants": "6 titulares + 4 suplentes por equipo femenino y masculino",
    "duration": "2 tiempos de 12 min",
    "rules": "Formato: eliminación simple, clasificatorio y final por sorteo; los no clasificados disputan 3.º y 4.º puesto. Para 3.º y 4.º puesto: 2 tiempos de 10 minutos.\nOrden: mujeres primero y hombres después, con distribución equitativa por grados.\nCambios: al menos 3 por partido, anunciados al árbitro; sin reingreso. Se permiten cambios adicionales manteniendo el mínimo de jugadores.\nReglas clave: pases con las manos; gol con una mano desde fuera de la media luna o entrando con salto. Solo el arquero puede usar brazos y piernas para impedir el gol. No se permiten golpes ni arrebatos agresivos: la falta cede posesión y, si es grave, se concede tiro libre.\nDesempate: 3 penales del equipo que jugó el segundo tiempo.\nMateriales: pelota, cancha y arcos. Lo no previsto se rige por el reglamento internacional de balonmano.",
    "source": {
      "url": "/bases/educacion-fisica.pdf",
      "page": 3
    }
  },
  {
    "id": "ef-pasabola",
    "category": "Educación Física",
    "title": "Pasabola",
    "grades": "Promesas e Infantil • 1° a 4° grado",
    "description": "Atrapan y lanzan el balón por encima de la red, sumando los puntos de los dos tiempos.",
    "participants": "6 titulares + 4 suplentes por equipo femenino y masculino",
    "duration": "2 tiempos de 10 min",
    "rules": "Formato: eliminación simple, clasificatorio y final por sorteo; los no clasificados disputan 3.º y 4.º puesto. Para 3.º y 4.º puesto: 2 tiempos de 8 minutos.\nOrden: mujeres primero y hombres después. Cambios: al menos 3 por partido, anunciados al árbitro; sin reingreso. Se permiten cambios adicionales manteniendo el mínimo de jugadores.\nReglas clave: lanzar con una o dos manos; si el balón cae o bota en el suelo, punto rival. Máximo 3 toques; atraparlo entre dos jugadores cuenta como 2. No se permiten dos toques consecutivos del mismo jugador, aunque puede volver a recibir tras un pase.\nSaque: lanzamiento directo al campo contrario; el pie puede salvar el balón, pero no lanzarlo. Para devolverlo al equipo que saca, pasarlo bajo la red.\nDesempate: jugar hasta una diferencia de 2 puntos. Las reglas adicionales las fija el árbitro al inicio.\nMateriales: balón suave de vóley, cancha y red o cinta elástica.",
    "source": {
      "url": "/bases/educacion-fisica.pdf",
      "page": 4
    }
  },
  {
    "id": "ef-voley",
    "category": "Educación Física",
    "title": "Vóley",
    "grades": "Junior, Juvenil A y B • 5° a 11° grado",
    "description": "Pasan el balón por encima de la red y suman los puntos de los tiempos masculino y femenino.",
    "participants": "6 titulares + 4 suplentes por equipo femenino y masculino",
    "duration": "2 tiempos de 12 min",
    "rules": "Formato: eliminación simple, clasificatorio y final por sorteo; los no clasificados disputan 3.º y 4.º puesto. Para 3.º y 4.º puesto: 2 tiempos de 8 minutos.\nOrden: hombres primero y mujeres después. Cambios: al menos 3 por partido, anunciados al árbitro; sin reingreso. Se permiten cambios adicionales manteniendo el mínimo de jugadores.\nReglas clave: máximo 3 pases antes de enviar al otro campo; el bloqueo no cuenta como primer toque. Balón al suelo: punto rival. No tocar la red ni pisar la línea debajo de ella. Rodilleras opcionales, recomendadas por las bases.\nDesempate: diferencia de 2 puntos. Las bases remiten al reglamento FPV adaptado al contexto escolar.\nMateriales: pelota, parantes, red y losa o césped sintético.",
    "source": {
      "url": "/bases/educacion-fisica.pdf",
      "page": 5
    }
  },
  {
    "id": "ef-basquet",
    "category": "Educación Física",
    "title": "Básquet",
    "grades": "Junior, Juvenil A y B • 5° a 11° grado",
    "description": "Disputan dos tiempos y suman sus puntos para determinar la House ganadora.",
    "participants": "5 titulares + 5 suplentes por equipo femenino y masculino",
    "duration": "2 tiempos de 12 min",
    "rules": "Formato: eliminación simple, clasificatorio y final por sorteo; los no clasificados disputan 3.º y 4.º puesto. Para 3.º y 4.º puesto: 2 tiempos de 8 minutos.\nOrden: mujeres primero y hombres después. Cambios: al menos 3 por partido, anunciados al árbitro; sin reingreso. Se permiten cambios adicionales manteniendo el mínimo de jugadores.\nFaltas: dribbling ilegal y doble dribbling. Con 5 faltas personales, el jugador sale y es reemplazado.\nDesempate: 5 minutos extra; si persiste, tiros libres con un intento por jugador, sin cambios.\nMateriales: pelota y losa deportiva. Las bases remiten al reglamento de la Federación Peruana de Básquet.",
    "source": {
      "url": "/bases/educacion-fisica.pdf",
      "page": 6
    }
  },
  {
    "id": "ef-coneball",
    "category": "Educación Física",
    "title": "Cone ball Innova",
    "grades": "Promesas e Infantil • 1° a 4° grado",
    "description": "Encadenan pases con bote para derribar los conos del rival; cada cono derribado vale un punto.",
    "participants": "5 titulares + 5 suplentes por equipo femenino y masculino",
    "duration": "2 tiempos de 12 min",
    "rules": "Formato: eliminación simple, clasificatorio y final por sorteo; los no clasificados disputan 3.º y 4.º puesto. Para 3.º y 4.º puesto: 2 tiempos de 8 minutos.\nOrden: mujeres primero y hombres después; se suman los puntos de ambos tiempos.\nMateriales: balón liviano o blando, 6 conos y campo delimitado. Cada equipo coloca 3 conos en el fondo, separados un paso.\nInicio y pases: balón al centro y señal del árbitro; pase con bote obligatorio. Máximo 3 pasos sin bote y 5 segundos de retención; solo manos y sin correr con el balón en las manos.\nPuntuación: completar al menos 3 pases consecutivos antes de lanzar al cono; reponer cada cono derribado inmediatamente.\nSeguridad: solo interceptar pases, sin arrebatar el balón, contacto, empujones ni bloqueos. Faltas reiteradas: cambio de posesión.\nPromesas: bote libre sin límite de pasos y distancia de lanzamiento más corta.",
    "source": {
      "url": "/bases/educacion-fisica.pdf",
      "page": 7
    }
  },
  {
    "id": "ef-relevos",
    "category": "Educación Física",
    "title": "Carrera de relevos: postas mixtas",
    "grades": "Todas • distancias según categoría",
    "description": "Corren por turnos y entregan el testimonio para completar el recorrido en el menor tiempo.",
    "participants": "4 titulares (2 mujeres y 2 hombres) + 2 suplentes",
    "duration": "4 × 25 m, 4 × 50 m o 4 × 100 m",
    "rules": "Formato: eliminación simple, carrera clasificatoria y final por sorteo; los no clasificados disputan 3.º y 4.º puesto.\nDistancias: 4 × 25 m para todas; 4 × 50 m para Junior y Juvenil A/B; 4 × 100 m para Juvenil A/B.\nMateriales: testimonios y campo deportivo. Dos atletas de cada equipo se ubican en metas opuestas.\nReglas clave: un corredor no hace dos turnos consecutivos. Salida anticipada o invasión de carril que obstaculice al rival: descalificación. Salida alta con «En sus marcas», «Listos» y silbato.\nCómo se gana: menor tiempo; puntaje según orden de llegada. Suplentes: 1 mujer y 1 hombre.",
    "source": {
      "url": "/bases/educacion-fisica.pdf",
      "page": 8
    }
  },
  {
    "id": "ef-saltos",
    "category": "Educación Física",
    "title": "Saltos de longitud por equipos: saltar el aro",
    "grades": "Todas • distancia según categoría",
    "description": "Avanzan saltando un aro con los pies juntos, alternando con el compañero que lo sostiene y recoloca.",
    "participants": "Cantidad pendiente de confirmación",
    "duration": "Recorrido cronometrado",
    "rules": "Formato: eliminación simple, clasificatorio y final por sorteo; los no clasificados disputan 3.º y 4.º puesto.\nDistancias: 5 a 10 m para Promesas e Infantil; 15 a 20 m para Junior y Juvenil A/B.\nDesarrollo: columnas de 8 jugadores. Un compañero sostiene el aro bajo las rodillas; el otro salta con pies juntos. Se eleva el aro sobre la cabeza y se recoloca para continuar. Al llegar al fondo, se regresa con el aro para el siguiente compañero.\nCómo se gana: completar el recorrido de todos los jugadores en el menor tiempo.\nMateriales utilizados en la dinámica: aro y campo deportivo.",
    "source": {
      "url": "/bases/educacion-fisica.pdf",
      "page": 9
    },
    "note": "Las bases indican «8 titulares (3 mujeres y 3 hombres) y 2 suplentes, total 8», cifras incompatibles. Además, enumeran sogas como material, pero describen un juego con aro. Confirmar cantidad y materiales con el docente."
  },
  {
    "id": "ef-soga",
    "category": "Educación Física",
    "title": "Salta soga individual por equipos",
    "grades": "Todas • tiempos según categoría",
    "description": "Buscan mantener al mayor número de integrantes saltando la cuerda hasta finalizar ambos tiempos.",
    "participants": "Cantidad pendiente de confirmación",
    "duration": "2 × 3 min o 2 × 5 min",
    "rules": "Formato: eliminación simple, clasificatorio y final por sorteo; los no clasificados disputan 3.º y 4.º puesto.\nDuración: Promesas e Infantil, 2 tiempos de 3 minutos; Junior y Juvenil A/B, 2 de 5 minutos. Hidratación: 1 minuto entre tiempos.\nMateriales: sogas individuales y campo deportivo.\nReglas clave: saltar con pies juntos o alternados; se permite desplazarse por el campo. Quien deja de saltar puede ser reemplazado siguiendo el orden previsto, solo antes de iniciar el segundo tiempo.\nLas faltas de ejecución o de tiempo sacan al participante del turno; el reemplazo también está limitado al primer tiempo. Los árbitros determinan las reglas adicionales.\nCómo se gana: mantener más participantes saltando al terminar los dos tiempos.",
    "source": {
      "url": "/bases/educacion-fisica.pdf",
      "page": 10
    },
    "note": "La cantidad de participantes en el PDF es contradictoria: «8 titulares (3 mujeres y 3 hombres) y 2 suplentes, total 8». Debe confirmarla el docente."
  },
  {
    "id": "ef-ajedrez",
    "category": "Educación Física",
    "title": "Ajedrez por equipos: Circuito 360°",
    "grades": "Junior, Juvenil A y B",
    "description": "Cada House se enfrenta a las otras tres en un circuito de partidas por equipos.",
    "participants": "5 titulares + 1 suplente opcional por House",
    "duration": "30 a 35 min · 3 rondas",
    "rules": "Formato: todos contra todos, 3 rondas por House; 5 minutos por jugador y máximo 10 minutos por ronda.\nMateriales publicados: 5 tableros por ronda, cronómetro, fichas de puntaje, mesas y sillas.\nCómo se gana: sumar más puntos tras las 3 rondas. Por partida: victoria 1, empate 0,5 y derrota 0; máximo 5 por ronda y 15 en total.\nDesempate del primer puesto: resultado directo; si persiste, partida relámpago en un tablero, 3 minutos por jugador designado.\nReglas clave: no recibir ayuda externa; primer movimiento ilegal, advertencia; segundo, derrota. Agotar el tiempo supone perder. Mantener el orden de jugadores toda la competencia.",
    "source": {
      "url": "/bases/educacion-fisica.pdf",
      "page": 11
    },
    "note": "La base menciona 20 estudiantes simultáneos y 5 tableros por ronda. La organización debe confirmar la distribución de tableros."
  },
  {
    "id": "drill",
    "category": "Drill Gimnástico",
    "title": "Drill coreográfico",
    "grades": "Primaria y Secundaria • participación por House",
    "description": "Crean una coreografía colectiva que comunica la identidad de su House y una temática formativa mediante movimientos sincronizados.",
    "participants": "Mínimo 30 estudiantes por House",
    "duration": "3 a 5 min + 2 min para limpiar",
    "rules": "Temas sugeridos: Blue, unidad y trabajo en equipo; White, respeto y juego limpio; Orange, esfuerzo y superación; Green, liderazgo y disciplina. También se admite identidad, convivencia, espíritu deportivo o mentalidad de crecimiento.\nReglas clave: polo de la House obligatorio; vestimenta complementaria permitida. No usar pirotécnicos, bombardas ni pica pica. Mantener orden, seguridad y respeto durante todas las presentaciones; el irrespeto afecta el puntaje.\nRúbrica (100 puntos): mensaje formativo 15; coordinación y sincronización 20; creatividad 20; expresión corporal 15; organización y disciplina 10; participación 10; uniformidad 5; tiempo 5.\nInicial: participación adaptable a propuestas breves, guiadas y lúdicas. La sede puede ajustar la organización conservando el enfoque formativo.",
    "source": {
      "url": "/bases/drill-gimnastico.pdf",
      "page": 1
    }
  }
];

export const actividadesData: ActividadRegla[] = [
  // Resumen de las bases de Matemática: páginas 2–7 del documento recibido.
  {
    id: 'm1', category: 'Matemática', title: 'Replicando figuras con pattern blocks',
    grades: 'Promesas • 1° y 2° grado',
    description: 'Replican una figura proyectada con piezas geométricas, respetando su orientación y distribución.',
    tags: [{ icon: Users, text: '4 titulares + 2 suplentes por House' }, { icon: Clock, text: '4–6 rondas de 3–5 min' }],
    rules: 'Cómo se gana: 1 punto por ronda al equipo que replique con mayor precisión y en menor tiempo. En empate se considera la alineación y orientación. Se suman los puntos de las rondas.\nMateriales: piezas geométricas, figura proyectada y superficie de trabajo.\nReglas clave: usar solo el propio set, no intercambiar piezas, respetar el tiempo y trabajar en equipo.'
  },
  ...[
    { id: 'm-infantil', grades: 'Infantil • 3° y 4° grado' },
    { id: 'm-junior', grades: 'Junior • 5° y 6° grado' },
    { id: 'm-juvenila', grades: 'Juvenil A • 7° y 8° grado' },
  ].map(categoria => ({
    ...categoria, category: 'Matemática', title: 'Resolviendo retos computacionales',
    description: 'Resuelven individualmente 10 retos de lógica y pensamiento computacional. Cada respuesta se deposita en un ánfora.',
    tags: [{ icon: Users, text: '8 titulares + 2 suplentes por House' }, { icon: Clock, text: '30 min · hasta 3 min por reto' }],
    rules: 'Participación: equipo mixto, con 4 titulares y 1 suplente por grado.\nCómo se gana: cada acierto suma un punto; gana la House con la mayor suma de puntos individuales.\nMateriales: preguntas proyectadas, 10 hojas A7 por participante, plumón rojo y ánfora.\nReglas clave: no cambiar una respuesta depositada ni comunicarse con compañeros del mismo equipo. Las marcas dobles o poco claras invalidan la respuesta.'
  })),
  {
    id: 'm2', category: 'Matemática', title: '¡Corre, Resuelve y Gana!',
    grades: 'Juvenil B • 9°, 10° y 11° grado',
    description: 'Recorren estaciones de matemática básica, geometría y razonamiento. Deben resolver correctamente cada problema antes de avanzar.',
    tags: [{ icon: Users, text: 'Equipos de 3–4 estudiantes' }, { icon: Clock, text: '30–45 min' }],
    rules: 'Cómo se gana: completar el recorrido con los problemas correctamente resueltos en el menor tiempo. Cada respuesta correcta vale 10 puntos; una incorrecta, 0.\nMateriales: conos, tarjetas de problemas, cronómetro y tablero de respuestas.\nRegla clave: solo se avanza a la siguiente estación tras resolver correctamente el problema.'
  },

  // --- INGLÉS ---
  {
    id: 'i1',
    note: 'Resumen previo de la web. El PDF de Inglés aún no está disponible para contrastar estas reglas.',
    category: 'Inglés',
    title: 'Building a Story',
    grades: 'Promesas • 1° y 2° grado',
    description: 'Cada house crea y comparte oralmente 4 oraciones usando 4 flashcards y un prompt elegido de una lista.',
    tags: [{ icon: Users, text: '4 por house' }, { icon: Clock, text: '10 min por house' }],
    rules: '1. Uso obligatorio de las 4 flashcards.\n2. Se evalúa pronunciación y coherencia.'
  },

  ...extraidas.map(({ participants, duration, ...actividad }) => ({
    ...actividad,
    tags: [{ icon: Users, text: participants }, { icon: Clock, text: duration }],
  })),
];
