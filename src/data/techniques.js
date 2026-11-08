// Catálogo de técnicas por área (quiropráctica, fisioterapia y masaje). Se carga bajo demanda con la pestaña Técnicas.
// Fotos: banco libre Pexels (licencia comercial), guardadas en public/tecnicas/. Sin foto = mosaico de marca.
export const techniquesData = [
 {
  "title": "Ajuste Cervical (Diversified)",
  "category": "quiro",
  "image": "/tecnicas/cervical.jpg",
  "description": "Técnica manual de alta velocidad y baja amplitud (HVLA) para corregir rotaciones y restricciones en la columna cervical (C1-C7).",
  "execution": "1. Posiciona al paciente en decúbito supino.\n2. Contacta el pilar articular o la lámina con la falange lateral del dedo índice.\n3. Lleva la articulación a la tensión máxima (lock-out) con leve flexión lateral y rotación.\n4. Aplica el impulso (thrust) HVLA en un vector rápido y superficial (P-A, I-S).",
  "help": "Aplicar frío por 15 min si hay inflamación post-ajuste. Indicar ejercicios de retracción cervical y corregir la postura de 'Text Neck'."
 },
 {
  "title": "Ajuste Torácico Anterior (Abrazado)",
  "category": "quiro",
  "image": "",
  "description": "Ideal para la zona dorsal (T1-T12). Se realiza con el paciente boca arriba, utilizando el peso del cuerpo como palanca.",
  "execution": "1. Paciente en decúbito supino con los brazos cruzados sobre el pecho.\n2. El quiropráctico hace un contacto con la mano en forma de 'puño suave' o 'garra' debajo de la vértebra dorsal a ajustar.\n3. Usando el esternón sobre los brazos del paciente, se inhala y se baja el peso corporal.\n4. El impulso (thrust) es de Anterior a Posterior (A-P) directamente a través de los brazos cruzados.",
  "help": "Sugerir ejercicios de expansión torácica y estiramiento de pectorales en el marco de una puerta para abrir el pecho."
 },
 {
  "title": "Ajuste Lumbar (Side Posture)",
  "category": "quiro",
  "image": "/tecnicas/lumbar.jpg",
  "description": "Técnica en postura lateral (pull/push) fundamental para corregir restricciones rotacionales y subluxaciones en la zona lumbar (L1-L5).",
  "execution": "1. Posiciona al paciente en decúbito lateral con la pierna superior flexionada.\n2. Estabiliza el hombro superior del paciente con el antebrazo cefálico.\n3. Contacta el proceso mamilar o espinoso lumbar con el pisiforme de la mano caudal.\n4. Genera tensión (body drop) rotando la pelvis hacia ti y aplica el impulso rotacional.",
  "help": "Recomendar al paciente evitar levantar objetos pesados doblando la espalda. Enseñar técnica de sentadilla profunda."
 },
 {
  "title": "Técnica Gonstead",
  "category": "quiro",
  "image": "/tecnicas/gonstead.jpg",
  "description": "Enfoque biomecánico ultra específico. Utiliza análisis de radiografías, nervoscopio e instrumentación para ajustes precisos sobre la vértebra aislada.",
  "execution": "1. Uso riguroso de radiografía completa y palpación estática/dinámica.\n2. Para la zona pélvica, posicionar en mesa Knee-Chest o banco cervical para el cuello.\n3. Estabilizar rigurosamente la vértebra inferior al segmento a ajustar.\n4. El empuje se realiza en un vector extremadamente específico sin rotación excesiva.",
  "help": "Explicar al paciente la importancia de caminar 10 minutos inmediatamente después del ajuste para asimilar el cambio neuro-estructural."
 },
 {
  "title": "Ajuste Pélvico (Drop Thompson)",
  "category": "quiro",
  "image": "/tecnicas/pelvico.jpg",
  "description": "Sistema basado en la ley de inercia de Newton. Usa piezas segmentadas de la camilla que caen (Drop) para realizar un ajuste seguro de baja fuerza.",
  "execution": "1. Paciente en decúbito prono. Evalúa dismetría pélvica (Test de Derifield o largo de piernas).\n2. Ajusta la tensión de la pieza de caída (Drop) pélvica al peso exacto del paciente.\n3. Coloca el contacto doble con eminencias tenares sobre la EIPS (Espina Ilíaca Postero-Superior).\n4. Aplica el impulso P-A, I-S rápido. La pieza caerá absorbiendo la fuerza pesada.",
  "help": "Sugerir al paciente no cruzar las piernas al sentarse para mantener la simetría pélvica. Recomendar usar cojín lumbar al manejar."
 },
 {
  "title": "S.O.T. (Sacro Occipital Technique)",
  "category": "quiro",
  "image": "",
  "description": "Técnica suave que utiliza cuñas (bloques) posicionados debajo de la pelvis del paciente, usando su propio peso y la respiración para alinear.",
  "execution": "1. Clasificar al paciente en Categoría I, II o III de SOT mediante indicadores y palpación fascial.\n2. Colocar las cuñas bajo trocánteres e ilíacos según la categoría detectada.\n3. Dejar al paciente reposar sobre los bloques durante 10-15 minutos.\n4. Sincronizar manipulaciones craneales suaves con las fases respiratorias (Inhalación/Exhalación).",
  "help": "Ideal para dolores agudos y mujeres embarazadas. Sugerir reposo post-terapia y evitar ejercicio de alto impacto por 24 horas."
 },
 {
  "title": "Tracción - Flexión (Mesa Cox)",
  "category": "quiro",
  "image": "/tecnicas/cox.jpg",
  "description": "Técnica de descompresión espinal guiada. Abre el espacio del canal neural, reduce la presión discal y ayuda al tratamiento de la ciática.",
  "execution": "1. Paciente en posición prona, asegurar las cintas o sujeciones en los tobillos.\n2. Desbloquear el eje de flexión de la sección inferior de la mesa.\n3. Contactar con la eminencia tenar el proceso espinoso de la vértebra inmediatamente superior a la hernia o lesión.\n4. Aplicar presión sostenida mientras se flexiona la mesa en ciclos de 20 segundos.",
  "help": "Vital indicar al paciente evitar las flexiones de tronco. Enseñar a recoger objetos utilizando flexión de rodillas y mantener core activo."
 },
 {
  "title": "Técnica de Activador",
  "category": "quiro",
  "image": "",
  "description": "Ajuste asistido por un instrumento de impacto mecánico (Activator Adjusting Instrument) con alta velocidad y muy baja fuerza. No genera cavitación (ruido).",
  "execution": "1. Realizar el protocolo de aislamiento básico (aislamiento por zonas pidiendo al paciente mover brazos/piernas y midiendo el largo de las piernas).\n2. Seleccionar la línea de corrección adecuada según el manual.\n3. Posicionar el instrumento directamente sobre el proceso transverso o carilla articular.\n4. Aplicar el impacto mecánico seco.",
  "help": "Ideal para pacientes con osteoporosis, miedo a la cavitación o pediátricos. Explicar al paciente que la rapidez del impacto engaña el reflejo muscular."
 },
 {
  "title": "Toggle Recoil (Upper Cervical)",
  "category": "quiro",
  "image": "/tecnicas/toggle.jpg",
  "description": "Técnica de la escuela 'Hole in One' para ajustar la zona cervical superior (Atlas y Axis). Caracterizada por un impulso y retirada hiperrápida.",
  "execution": "1. Paciente en decúbito lateral sobre cabezal de Drop cervical o mesa específica.\n2. Contactar el proceso transverso del Atlas con la eminencia pisiforme.\n3. Mantener los codos ligeramente flexionados y el pecho arriba.\n4. Efectuar un thrust de triceps altísima velocidad e inmediatamente retirar las manos (Recoil) dejando caer el Drop.",
  "help": "Después del ajuste cervical superior, es importante que el paciente descanse 10-15 min en sala de recuperación para equilibrar el sistema nervioso autónomo."
 },
 {
  "title": "Técnica Webster (Embarazadas)",
  "category": "quiro",
  "image": "/tecnicas/webster.jpg",
  "description": "Análisis y ajuste sacropélvico específico para embarazadas, diseñado para reducir interferencias neurológicas y equilibrar el útero.",
  "execution": "1. Evaluar restricción de la flexión de la rodilla en posición prona (con almohadas de soporte para embarazo).\n2. Ajustar el sacro en el lado de mayor restricción usando Drop o el pulgar.\n3. Paciente en supino: Identificar tensión en el ligamento redondo del útero.\n4. Aplicar presión ultra suave y sostenida (sin masajear) sobre el ligamento tenso hasta sentir la liberación.",
  "help": "Indicar que esta técnica ayuda a optimizar el espacio para el bebé (evitar presentación de nalgas). Usar cojín para dormir de lado con apoyo entre rodillas."
 },
 {
  "title": "Técnica Logan Basic",
  "category": "quiro",
  "image": "",
  "description": "Un enfoque muy ligero y suave que utiliza contactos de presión continua en el ligamento sacrotuberoso para nivelar la columna completa.",
  "execution": "1. Localizar tensión y sensibilidad asimétrica cerca de la tuberosidad isquiática.\n2. Aplicar un contacto con el pulgar bajo la tuberosidad isquiática (ligamento sacrotuberoso).\n3. Mantener una presión en direction Anterior, Superior y Lateral por 10 a 15 minutos continuos.\n4. Masajear simultáneamente la musculatura paravertebral a lo largo de toda la columna.",
  "help": "Técnica sumamente relajante que activa el sistema parasimpático. Recomendar al paciente tomar mucha agua y descansar."
 },
 {
  "title": "Ajuste de Extremidades",
  "category": "quiro",
  "image": "/tecnicas/extremidades.jpg",
  "description": "Manipulación de las articulaciones fuera de la columna vertebral, como muñecas (túnel carpiano), hombros, codos, rodillas y tobillos.",
  "execution": "1. Evaluar la restricción del rango de movimiento y juego articular (joint play).\n2. Hombro (A-P): Paciente supino, tracción suave del húmero y thrust sobre la cabeza humeral hacia posterior.\n3. Rodilla/Tobillo: Típicamente ajustes en tracción del eje largo de la pierna o ajuste en mortaja tibioastragalina.\n4. Verificar la recuperación del movimiento.",
  "help": "Usar ejercicios con bandas de resistencia elástica para rehabilitar las articulaciones después de devolverles su biomecánica normal."
 },
 {
  "title": "Liberación Miofascial / IASTM",
  "category": "quiro",
  "image": "/tecnicas/miofascial.jpg",
  "description": "Movilización de tejidos blandos asistida por herramientas de acero inoxidable (Graston) o terapia manual intensa para romper adherencias fasciales.",
  "execution": "1. Aplicar crema o emoliente sobre la zona afectada (ej. fascia plantar, isquiotibiales, trapecios).\n2. Utilizar el instrumento IASTM o los pulgares con ángulo de 30-45 grados.\n3. Deslizar con presión profunda creando fricción hasta generar petequias ligeras (enrojecimiento terapéutico).\n4. Acompañar de movilización pasiva del paciente.",
  "help": "Indicar al paciente que el enrojecimiento es normal. Realizar estiramientos activos del músculo trabajado para reconstruir las fibras colágenas."
 },
 {
  "title": "Vendaje Neuromuscular (Kinesiotaping)",
  "category": "quiro",
  "image": "/tecnicas/kinesio.jpg",
  "description": "Aplicación de cintas elásticas transpirables sobre la piel post-ajuste. Alivia el dolor, drena la inflamación y proporciona soporte propioceptivo.",
  "execution": "1. Limpiar y secar bien la piel del área tratada. Recortar los bordes de la cinta en forma redondeada.\n2. Anclar la base de la cinta (sin tensión) en posición neutral.\n3. Llevar el músculo o articulación a tensión (estirado) y aplicar el resto de la cinta con la tensión deseada (0-50% según sea para relajar o tonificar).\n4. Friccionar la cinta para activar el adhesivo con el calor.",
  "help": "Informar que la cinta puede durar de 3 a 5 días y se puede mojar en la ducha. Retirar tirando la piel hacia atrás, no jalando la cinta."
 },
 {
  "title": "Ajuste Pediátrico",
  "category": "quiro",
  "image": "/tecnicas/pediatrico.jpg",
  "description": "Evaluación y ajuste suave adaptado a bebés y niños. Se emplean contactos con la yema de los dedos y una fuerza mínima, equivalente a la presión que soporta un globo ocular.",
  "execution": "1. Evalúa la columna y el cráneo con palpación suave, observando asimetrías y preferencias de giro de la cabeza.\n2. Coloca al bebé boca arriba sobre el regazo o la camilla, con la cabeza apoyada y contenida.\n3. Aplica contactos sostenidos con las yemas de los dedos sobre el segmento a tratar, sin impulso brusco.\n4. Verifica cambios en tono, movilidad y simetría; la sesión es breve (5-10 min).",
  "help": "Explicar a los padres que es normal que el bebé se mueva o llore un poco. Sugerir vigilar patrones de sueño y alimentación tras la sesión."
 },
 {
  "title": "Ultrasonido Terapéutico",
  "category": "fisio",
  "image": "/tecnicas/ultrasonido.jpg",
  "description": "Aplicación de ondas sonoras de alta frecuencia (1 o 3 MHz) que generan calor profundo y micromasaje en los tejidos, acelerando la reparación de lesiones musculares, tendinosas y ligamentosas.",
  "execution": "1. Coloca al paciente con la zona descubierta y aplica gel conductor.\n2. Selecciona la frecuencia: 1 MHz para tejidos profundos, 3 MHz para superficiales.\n3. Mueve el cabezal en círculos lentos y constantes, sin detenerlo sobre un punto.\n4. Aplica de 5 a 10 minutos por zona, según el tamaño del área.",
  "help": "El paciente no debe sentir calor intenso ni dolor; si lo refiere, se baja la intensidad. Complementar con ejercicio terapéutico."
 },
 {
  "title": "Láser Terapéutico",
  "category": "fisio",
  "image": "/tecnicas/laser.jpg",
  "description": "Fotobiomodulación con luz láser de baja potencia que estimula la regeneración celular, disminuye la inflamación y modula el dolor en tejidos blandos y articulaciones.",
  "execution": "1. Coloca gafas de protección al paciente y al terapeuta.\n2. Limpia la piel y localiza los puntos a tratar (lesión, puntos gatillo o recorrido nervioso).\n3. Aplica el cabezal en contacto suave, punto por punto, con la dosis según el equipo y el objetivo.\n4. Completa la aplicación en 5-15 minutos según el número de puntos.",
  "help": "Evitar su uso sobre tatuajes recientes, tiroides y en pacientes con fotosensibilidad o marcapasos según el equipo. No mirar directamente el haz."
 },
 {
  "title": "Electroterapia (TENS / EMS)",
  "category": "fisio",
  "image": "",
  "description": "Corrientes eléctricas terapéuticas aplicadas con electrodos: TENS para modular el dolor y EMS para activar y fortalecer la musculatura debilitada.",
  "execution": "1. Limpia la piel y coloca los electrodos rodeando la zona de dolor (TENS) o sobre el vientre muscular (EMS).\n2. Selecciona el programa: TENS convencional (frecuencia alta, sensación de hormigueo) o EMS (contracciones visibles).\n3. Sube la intensidad poco a poco hasta una sensación fuerte pero cómoda, nunca dolorosa.\n4. Mantén la aplicación de 15 a 30 minutos y retira revisando la piel.",
  "help": "No colocar electrodos sobre el cuello anterior, el pecho en pacientes con marcapasos ni sobre piel lesionada. La piel puede enrojecerse levemente."
 },
 {
  "title": "Termoterapia y Crioterapia",
  "category": "fisio",
  "image": "",
  "description": "Uso terapéutico del calor (compresas calientes, parafina) para relajar y preparar el tejido, y del frío (compresas frías, criomasaje) para controlar inflamación y dolor agudo.",
  "execution": "1. Elige el agente: frío en procesos agudos e inflamatorios (primeras 48-72 h); calor en rigidez y contractura crónica.\n2. Coloca una barrera (toalla) entre la compresa y la piel.\n3. Aplica de 10 a 20 minutos revisando la piel cada 5 minutos.\n4. Retira y revalora el dolor y la movilidad antes de continuar el tratamiento.",
  "help": "Nunca aplicar sobre heridas abiertas ni en zonas con sensibilidad alterada sin supervisión. El frío no debe quemar: si arde, se retira."
 },
 {
  "title": "Ejercicio Terapéutico",
  "category": "fisio",
  "image": "/tecnicas/ejercicio.jpg",
  "description": "Prescripción de movimiento activo dosificado: movilidad, fortalecimiento, estabilidad y control motor, adaptado a la lesión y a la evolución del paciente.",
  "execution": "1. Define el objetivo de la sesión (movilidad, fuerza, estabilidad o función) según la valoración.\n2. Comienza con movilidad activa asistida y calentamiento de la zona.\n3. Progresa a ejercicios de fortalecimiento y control motor con la técnica vigilada en todo momento.\n4. Cierra con estiramientos suaves y registra cargas, series y respuesta del paciente.",
  "help": "El dolor durante el ejercicio no debe superar 3/10 ni durar más de 24 horas. La constancia en casa vale más que la intensidad."
 },
 {
  "title": "Movilización Articular (Maitland)",
  "category": "fisio",
  "image": "/tecnicas/movilizacion.jpg",
  "description": "Movilizaciones pasivas oscilatorias graduadas (I a IV) para modular el dolor y recuperar el juego articular en columna y extremidades.",
  "execution": "1. Valora el movimiento activo y pasivo para elegir la articulación y el grado.\n2. Posiciona al paciente relajado, con la articulación en posición de reposo.\n3. Aplica oscilaciones rítmicas: grados I-II para dolor, III-IV para estirar y ganar rango.\n4. Revalora el movimiento tras cada serie y ajusta el grado según la respuesta.",
  "help": "Trabajar siempre dentro de la tolerancia del paciente. Evitar en inestabilidad, fractura reciente o proceso inflamatorio agudo articular."
 },
 {
  "title": "Estiramientos y FNP",
  "category": "fisio",
  "image": "/tecnicas/estiramientos.jpg",
  "description": "Estiramientos analíticos y facilitación neuromuscular propioceptiva (contraer-relajar) para ganar flexibilidad y rango de movimiento de forma segura.",
  "execution": "1. Calienta la zona con movimiento activo suave o calor superficial.\n2. Lleva el músculo a su punto de tensión tolerable, sin rebotes.\n3. En FNP: pide una contracción isométrica de 6-10 segundos, relaja y avanza a un nuevo rango.\n4. Repite 3-5 veces por grupo muscular y compara ambos lados.",
  "help": "La sensación debe ser de tensión, nunca de dolor punzante. Respirar y soltar el aire al avanzar el estiramiento mejora el resultado."
 },
 {
  "title": "Rehabilitación Funcional",
  "category": "fisio",
  "image": "/tecnicas/rehabilitacion.jpg",
  "description": "Recuperación de la función completa: marcha, equilibrio, propiocepción y gestos de la vida diaria o del deporte, con progresión por fases.",
  "execution": "1. Define la meta funcional del paciente (caminar sin ayuda, volver a su deporte, etc.).\n2. Trabaja por fases: control de dolor e inflamación → movilidad → fuerza → propiocepción y función.\n3. Entrena el gesto completo (marcha, escaleras, giros) con ayudas técnicas solo el tiempo necesario.\n4. Mide el avance con pruebas funcionales y ajusta el programa cada semana.",
  "help": "La rehabilitación es un proceso: celebrar los avances pequeños mantiene la adherencia. Registrar la evolución en cada sesión."
 },
 {
  "title": "Masaje Sueco (Relajante)",
  "category": "masaje",
  "image": "/tecnicas/sueco.jpg",
  "description": "El masaje clásico occidental: maniobras largas y rítmicas (effleurage, petrissage, fricción y percusión) para inducir relajación general y aliviar la tensión acumulada.",
  "execution": "1. Crea el ambiente: luz tenue, temperatura agradable y aceite o crema.\n2. Inicia con effleurage (deslizamientos largos) para calentar y distribuir el aceite.\n3. Continúa con petrissage (amasamiento) y fricciones en las zonas de mayor tensión.\n4. Cierra con pases largos y suaves, disminuyendo la intensidad poco a poco.",
  "help": "Ideal para estrés y tensión general. Recomendar hidratación y unos minutos de reposo antes de incorporarse de la camilla."
 },
 {
  "title": "Masaje de Tejido Profundo",
  "category": "masaje",
  "image": "/tecnicas/profundo.jpg",
  "description": "Trabajo lento y con presión profunda sobre las capas internas del músculo y la fascia, enfocado en liberar adherencias y dolor crónico.",
  "execution": "1. Calienta primero la zona con masaje superficial para preparar el tejido.\n2. Aplica presión profunda y lenta con nudillos, antebrazo o codo, siguiendo la dirección de las fibras.\n3. Avanza solo al ritmo que el tejido se libera; la respiración del paciente guía la profundidad.\n4. Termina con pases suaves de drenaje sobre la zona trabajada.",
  "help": "Puede haber molestia leve 24-48 h después (como agujetas). Aplicar calor suave e hidratarse ayuda a recuperarse."
 },
 {
  "title": "Masaje Deportivo",
  "category": "masaje",
  "image": "/tecnicas/deportivo.jpg",
  "description": "Masaje orientado al rendimiento y la recuperación del deportista: prepara el músculo antes de competir y acelera la recuperación después del esfuerzo.",
  "execution": "1. Define el momento: pre-competencia (rápido y estimulante) o post-competencia (lento y drenante).\n2. Trabaja los grupos musculares protagonistas del deporte con amasamiento y fricción profunda.\n3. Aplica estiramientos asistidos y movilizaciones articulares suaves.\n4. En post-esfuerzo, prioriza pases de retorno venoso hacia el corazón.",
  "help": "Post-competencia es normal sentir las piernas pesadas unas horas. Combinar con hidratación, frío local si hay inflamación y descanso."
 },
 {
  "title": "Drenaje Linfático Manual",
  "category": "masaje",
  "image": "/tecnicas/drenaje.jpg",
  "description": "Maniobras muy suaves, lentas y rítmicas que estimulan el sistema linfático para reducir edemas y mejorar la eliminación de líquidos y toxinas.",
  "execution": "1. Comienza siempre liberando los ganglios proximales (cuello, axilas o ingles según la zona).\n2. Aplica bombeos suaves con la palma y los dedos, con presión mínima (la piel se desplaza, no se frota).\n3. Avanza de proximal a distal, siguiendo el recorrido linfático.\n4. La sesión dura 30-60 minutos y el ritmo debe ser casi hipnótico.",
  "help": "Es normal orinar más tras la sesión: el cuerpo está eliminando líquidos. Recomendar beber agua y evitar cargar la zona tratada."
 },
 {
  "title": "Masaje con Piedras Calientes",
  "category": "masaje",
  "image": "/tecnicas/piedras.jpg",
  "description": "Aplicación de piedras de basalto calientes sobre puntos clave del cuerpo, combinada con masaje manual; el calor profundo relaja la musculatura y calma el sistema nervioso.",
  "execution": "1. Calienta las piedras en agua a 40-50 °C y verifica siempre la temperatura en tu antebrazo.\n2. Coloca piedras estáticas sobre columna, palmas y entre los dedos de los pies.\n3. Masajea con piedras en las manos usando deslizamientos largos, reponiendo las que se enfrían.\n4. Retira las piedras y cierra con masaje manual suave.",
  "help": "Avisar que nunca debe quemar: el paciente debe decirlo de inmediato si alguna piedra se siente demasiado caliente. No usar en piel sensible o con varices importantes en la zona."
 },
 {
  "title": "Masaje Tailandés",
  "category": "masaje",
  "image": "/tecnicas/tailandes.jpg",
  "description": "Trabajo sobre líneas de energía (Sen) con presiones con palmas, pulgares, codos y pies, combinado con estiramientos asistidos tipo yoga pasivo. Se realiza con ropa cómoda y sin aceite.",
  "execution": "1. Paciente con ropa holgada sobre colchoneta o camilla firme.\n2. Inicia con presiones rítmicas con las palmas a lo largo de piernas y espalda.\n3. Trabaja las líneas Sen con pulgares y continúa con estiramientos asistidos progresivos.\n4. Cierra con trabajo en cuello, hombros y cabeza, y unos minutos de reposo.",
  "help": "Comunicar cualquier molestia: los estiramientos nunca deben forzar. Ideal para personas rígidas que buscan movilidad y energía."
 },
 {
  "title": "Reflexología Podal",
  "category": "masaje",
  "image": "/tecnicas/reflexologia.jpg",
  "description": "Estimulación de zonas reflejas del pie que corresponden a órganos y sistemas del cuerpo, buscando equilibrio general y relajación profunda.",
  "execution": "1. Limpia y calienta los pies con pases suaves de contacto completo.\n2. Recorre todo el pie con presión de pulgar (técnica de oruga), zona por zona: columna, cabeza, órganos digestivos.\n3. Insiste con círculos pequeños en las zonas que el paciente refiera sensibles.\n4. Cierra con pases largos y suaves en ambos pies y unos minutos de reposo.",
  "help": "Las zonas sensibles no siempre indican un problema: son un mapa de trabajo. Recomendar caminar descalzo en casa sobre superficies seguras."
 },
 {
  "title": "Liberación de Puntos Gatillo",
  "category": "masaje",
  "image": "/tecnicas/puntos.jpg",
  "description": "Localización y desactivación de puntos gatillo miofasciales (nudos sensibles que irradian dolor) mediante presión isquémica sostenida.",
  "execution": "1. Palpa el músculo buscando la banda tensa y el punto de máximo dolor que reproduce el síntoma del paciente.\n2. Aplica presión progresiva con pulgar, nudillo o codo hasta un dolor tolerable (7/10 máximo).\n3. Mantén la presión de 30 a 90 segundos hasta sentir la liberación del tejido.\n4. Continúa con estiramiento suave del músculo tratado y calor local.",
  "help": "El dolor irradiado durante la presión confirma el punto. Puede quedar sensibilidad local 24 h; el calor suave ayuda."
 },
 {
  "title": "Ventosas (Cupping)",
  "category": "masaje",
  "image": "/tecnicas/ventosas.jpg",
  "description": "Aplicación de copas con vacío sobre la piel que levantan el tejido, mejoran la circulación local y ayudan a liberar la fascia y la musculatura profunda.",
  "execution": "1. Aplica aceite sobre la zona para permitir el sellado y el deslizamiento.\n2. Coloca las copas con vacío moderado (bomba manual o fuego, según el sistema) sobre los puntos de tensión.\n3. Déjalas fijas de 5 a 15 minutos o deslízalas lentamente (masaje con ventosa).\n4. Retira liberando el vacío con suavidad y masajea la zona.",
  "help": "Las marcas circulares temporales (de días a una semana) son esperadas y no son moretones dolorosos. Avisar al paciente con anticipación."
 },
 {
  "title": "Masaje Prenatal",
  "category": "masaje",
  "image": "",
  "description": "Masaje adaptado al embarazo, en posición lateral con cojines de apoyo, enfocado en aliviar dolor lumbar, piernas cansadas y tensión, evitando zonas y presiones contraindicadas.",
  "execution": "1. Posiciona a la paciente en decúbito lateral con cojines entre las rodillas y bajo el abdomen (a partir del 2.º trimestre, evitar boca arriba prolongado).\n2. Trabaja espalda y zona lumbar con presión moderada y pases amplios.\n3. Continúa con drenaje suave en piernas, de distal a proximal.\n4. Cierra con cuello, hombros y brazos; ayuda a la paciente a incorporarse despacio.",
  "help": "Evitar presión profunda en abdomen y ciertos puntos de pies y tobillos. Ante cualquier mareo, se suspende y se incorpora a la paciente."
 }
];
