import React, { useState, useEffect } from 'react';
import './index.css';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, RecaptchaVerifier, signInWithPhoneNumber, createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, linkWithCredential, linkWithPopup } from 'firebase/auth';
import { getFirestore, initializeFirestore, collection, doc, setDoc, getDoc, getDocFromServer, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Home, Calendar as CalendarIcon, Users, Plus, X, ChevronRight, Search, Sparkles, Loader2, Settings, MessageSquare, LogOut, Globe, ClipboardList, BookOpen, Target, Cloud, Trash2, Lock, Activity, ShieldAlert, ShieldCheck, Mail, CheckCircle2, Ruler, Weight, UserCircle, Building, User, CreditCard, Clock, PlayCircle, WifiOff, HeartPulse, CalendarPlus, AlertTriangle, KeyRound, Copy, TerminalSquare, Upload, ImagePlus, Image as ImageIcon, Download, AlertOctagon, FileText, Stethoscope, Palette } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyB-psPSH45hCnwRMbj6rSzxOf8_ITRXqhU",
  authDomain: "quiroapp-e9b0a.firebaseapp.com",
  projectId: "quiroapp-e9b0a",
  storageBucket: "quiroapp-e9b0a.firebasestorage.app",
  messagingSenderId: "478863836341",
  appId: "1:478863836341:web:fa72196635120ba1beaafc",
  measurementId: "G-YVG4XXKENW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });
const appId = firebaseConfig.projectId;
const TRIAL_DAYS = 3;
const MAX_TRIAL_PATIENTS = 3;

const openWhatsApp = (phone, message = "") => {
  if (!phone) return;
  const cleanPhone = String(phone).replace(/\D/g, '');
  window.open(`https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`, '_blank');
};

const safeFormatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch (e) { return String(dateStr); }
};

const CLINIC_THEMES = {
  azul: { bg: 'bg-gradient-to-br from-cyan-600 to-blue-900', text: 'text-white', name: 'Azul Clínico' },
  esmeralda: { bg: 'bg-gradient-to-br from-emerald-500 to-teal-900', text: 'text-white', name: 'Esmeralda' },
  indigo: { bg: 'bg-gradient-to-br from-indigo-500 to-purple-900', text: 'text-white', name: 'Índigo Premium' },
  carbon: { bg: 'bg-gradient-to-br from-slate-700 to-black', text: 'text-white', name: 'Carbón Élite' },
  blanco: { bg: 'bg-gradient-to-br from-slate-50 to-slate-200', text: 'text-slate-800', name: 'Blanco Elegante' }
};

const techniquesData=[{title:"Ajuste Cervical (Diversified)",image:"",description:"Técnica manual de alta velocidad y baja amplitud (HVLA) para corregir rotaciones y restricciones en la columna cervical (C1-C7).",execution:"1. Posiciona al paciente en decúbito supino.\n2. Contacta el pilar articular o la lámina con la falange lateral del dedo índice.\n3. Lleva la articulación a la tensión máxima (lock-out) con leve flexión lateral y rotación.\n4. Aplica el impulso (thrust) HVLA en un vector rápido y superficial (P-A, I-S).",help:"Aplicar frío por 15 min si hay inflamación post-ajuste. Indicar ejercicios de retracción cervical y corregir la postura de 'Text Neck'."},{title:"Ajuste Torácico Anterior (Abrazado)",image:"",description:"Ideal para la zona dorsal (T1-T12). Se realiza con el paciente boca arriba, utilizando el peso del cuerpo como palanca.",execution:"1. Paciente en decúbito supino con los brazos cruzados sobre el pecho.\n2. El quiropráctico hace un contacto con la mano en forma de 'puño suave' o 'garra' debajo de la vértebra dorsal a ajustar.\n3. Usando el esternón sobre los brazos del paciente, se inhala y se baja el peso corporal.\n4. El impulso (thrust) es de Anterior a Posterior (A-P) directamente a través de los brazos cruzados.",help:"Sugerir ejercicios de expansión torácica y estiramiento de pectorales en el marco de una puerta para abrir el pecho."},{title:"Ajuste Lumbar (Side Posture)",image:"",description:"Técnica en postura lateral (pull/push) fundamental para corregir restricciones rotacionales y subluxaciones en la zona lumbar (L1-L5).",execution:"1. Posiciona al paciente en decúbito lateral con la pierna superior flexionada.\n2. Estabiliza el hombro superior del paciente con el antebrazo cefálico.\n3. Contacta el proceso mamilar o espinoso lumbar con el pisiforme de la mano caudal.\n4. Genera tensión (body drop) rotando la pelvis hacia ti y aplica el impulso rotacional.",help:"Recomendar al paciente evitar levantar objetos pesados doblando la espalda. Enseñar técnica de sentadilla profunda."},{title:"Técnica Gonstead",image:"",description:"Enfoque biomecánico ultra específico. Utiliza análisis de radiografías, nervoscopio e instrumentación para ajustes precisos sobre la vértebra aislada.",execution:"1. Uso riguroso de radiografía completa y palpación estática/dinámica.\n2. Para la zona pélvica, posicionar en mesa Knee-Chest o banco cervical para el cuello.\n3. Estabilizar rigurosamente la vértebra inferior al segmento a ajustar.\n4. El empuje se realiza en un vector extremadamente específico sin rotación excesiva.",help:"Explicar al paciente la importancia de caminar 10 minutos inmediatamente después del ajuste para asimilar el cambio neuro-estructural."},{title:"Ajuste Pélvico (Drop Thompson)",image:"",description:"Sistema basado en la ley de inercia de Newton. Usa piezas segmentadas de la camilla que caen (Drop) para realizar un ajuste seguro de baja fuerza.",execution:"1. Paciente en decúbito prono. Evalúa dismetría pélvica (Test de Derifield o largo de piernas).\n2. Ajusta la tensión de la pieza de caída (Drop) pélvica al peso exacto del paciente.\n3. Coloca el contacto doble con eminencias tenares sobre la EIPS (Espina Ilíaca Postero-Superior).\n4. Aplica el impulso P-A, I-S rápido. La pieza caerá absorbiendo la fuerza pesada.",help:"Sugerir al paciente no cruzar las piernas al sentarse para mantener la simetría pélvica. Recomendar usar cojín lumbar al manejar."},{title:"S.O.T. (Sacro Occipital Technique)",image:"",description:"Técnica suave que utiliza cuñas (bloques) posicionados debajo de la pelvis del paciente, usando su propio peso y la respiración para alinear.",execution:"1. Clasificar al paciente en Categoría I, II o III de SOT mediante indicadores y palpación fascial.\n2. Colocar las cuñas bajo trocánteres e ilíacos según la categoría detectada.\n3. Dejar al paciente reposar sobre los bloques durante 10-15 minutos.\n4. Sincronizar manipulaciones craneales suaves con las fases respiratorias (Inhalación/Exhalación).",help:"Ideal para dolores agudos y mujeres embarazadas. Sugerir reposo post-terapia y evitar ejercicio de alto impacto por 24 horas."},{title:"Tracción - Flexión (Mesa Cox)",image:"",description:"Técnica de descompresión espinal guiada. Abre el espacio del canal neural, reduce la presión discal y ayuda al tratamiento de la ciática.",execution:"1. Paciente en posición prona, asegurar las cintas o sujeciones en los tobillos.\n2. Desbloquear el eje de flexión de la sección inferior de la mesa.\n3. Contactar con la eminencia tenar el proceso espinoso de la vértebra inmediatamente superior a la hernia o lesión.\n4. Aplicar presión sostenida mientras se flexiona la mesa en ciclos de 20 segundos.",help:"Vital indicar al paciente evitar las flexiones de tronco. Enseñar a recoger objetos utilizando flexión de rodillas y mantener core activo."},{title:"Técnica de Activador",image:"",description:"Ajuste asistido por un instrumento de impacto mecánico (Activator Adjusting Instrument) con alta velocidad y muy baja fuerza. No genera cavitación (ruido).",execution:"1. Realizar el protocolo de aislamiento básico (aislamiento por zonas pidiendo al paciente mover brazos/piernas y midiendo el largo de las piernas).\n2. Seleccionar la línea de corrección adecuada según el manual.\n3. Posicionar el instrumento directamente sobre el proceso transverso o carilla articular.\n4. Aplicar el impacto mecánico seco.",help:"Ideal para pacientes con osteoporosis, miedo a la cavitación o pediátricos. Explicar al paciente que la rapidez del impacto engaña el reflejo muscular."},{title:"Toggle Recoil (Upper Cervical)",image:"",description:"Técnica de la escuela 'Hole in One' para ajustar la zona cervical superior (Atlas y Axis). Caracterizada por un impulso y retirada hiperrápida.",execution:"1. Paciente en decúbito lateral sobre cabezal de Drop cervical o mesa específica.\n2. Contactar el proceso transverso del Atlas con la eminencia pisiforme.\n3. Mantener los codos ligeramente flexionados y el pecho arriba.\n4. Efectuar un thrust de triceps altísima velocidad e inmediatamente retirar las manos (Recoil) dejando caer el Drop.",help:"Después del ajuste cervical superior, es importante que el paciente descanse 10-15 min en sala de recuperación para equilibrar el sistema nervioso autónomo."},{title:"Técnica Webster (Embarazadas)",image:"",description:"Análisis y ajuste sacropélvico específico para embarazadas, diseñado para reducir interferencias neurológicas y equilibrar el útero.",execution:"1. Evaluar restricción de la flexión de la rodilla en posición prona (con almohadas de soporte para embarazo).\n2. Ajustar el sacro en el lado de mayor restricción usando Drop o el pulgar.\n3. Paciente en supino: Identificar tensión en el ligamento redondo del útero.\n4. Aplicar presión ultra suave y sostenida (sin masajear) sobre el ligamento tenso hasta sentir la liberación.",help:"Indicar que esta técnica ayuda a optimizar el espacio para el bebé (evitar presentación de nalgas). Usar cojín para dormir de lado con apoyo entre rodillas."},{title:"Técnica Logan Basic",image:"",description:"Un enfoque muy ligero y suave que utiliza contactos de presión continua en el ligamento sacrotuberoso para nivelar la columna completa.",execution:"1. Localizar tensión y sensibilidad asimétrica cerca de la tuberosidad isquiática.\n2. Aplicar un contacto con el pulgar bajo la tuberosidad isquiática (ligamento sacrotuberoso).\n3. Mantener una presión en dirección Anterior, Superior y Lateral por 10 a 15 minutos continuos.\n4. Masajear simultáneamente la musculatura paravertebral a lo largo de toda la columna.",help:"Técnica sumamente relajante que activa el sistema parasimpático. Recomendar al paciente tomar mucha agua y descansar."},{title:"Ajuste de Extremidades",image:"",description:"Manipulación de las articulaciones fuera de la columna vertebral, como muñecas (túnel carpiano), hombros, codos, rodillas y tobillos.",execution:"1. Evaluar la restricción del rango de movimiento y juego articular (joint play).\n2. Hombro (A-P): Paciente supino, tracción suave del húmero y thrust sobre la cabeza humeral hacia posterior.\n3. Rodilla/Tobillo: Típicamente ajustes en tracción del eje largo de la pierna o ajuste en mortaja tibioastragalina.\n4. Verificar la recuperación del movimiento.",help:"Usar ejercicios con bandas de resistencia elástica para rehabilitar las articulaciones después de devolverles su biomecánica normal."},{title:"Liberación Miofascial / IASTM",image:"",description:"Movilización de tejidos blandos asistida por herramientas de acero inoxidable (Graston) o terapia manual intensa para romper adherencias fasciales.",execution:"1. Aplicar crema o emoliente sobre la zona afectada (ej. fascia plantar, isquiotibiales, trapecios).\n2. Utilizar el instrumento IASTM o los pulgares con ángulo de 30-45 grados.\n3. Deslizar con presión profunda creando fricción hasta generar petequias ligeras (enrojecimiento terapéutico).\n4. Acompañar de movilización pasiva del paciente.",help:"Indicar al paciente que el enrojecimiento es normal. Realizar estiramientos activos del músculo trabajado para reconstruir las fibras colágenas."},{title:"Vendaje Neuromuscular (Kinesiotaping)",image:"",description:"Aplicación de cintas elásticas transpirables sobre la piel post-ajuste. Alivia el dolor, drena la inflamación y proporciona soporte propioceptivo.",execution:"1. Limpiar y secar bien la piel del área tratada. Recortar los bordes de la cinta en forma redondeada.\n2. Anclar la base de la cinta (sin tensión) en posición neutral.\n3. Llevar el músculo o articulación a tensión (estirado) y aplicar el resto de la cinta con la tensión deseada (0-50% según sea para relajar o tonificar).\n4. Friccionar la cinta para activar el adhesivo con el calor.",help:"Informar que la cinta puede durar de 3 a 5 días y se puede mojar en la ducha. Retirar tirando la piel hacia atrás, no jalando la cinta."}];
const RED_FLAGS = ['Tumor','Infecciones','Fractura','Problema neurológico','Problemas nerviosos','Herida abierta local','Quemadura','Sangrado prolongado','Implantes artificiales','Marcapasos','Infección articular'];
const CHIRO_TECHNIQUES = ['Diversified','Gonstead','Thompson','Activador','Toggle Recoil','SOT (Sacro Occipital)','Cox Flexion-Distraction','Miofascial / Graston','Ajuste Cervical Específico'];
const POSTURAL_DEVIATIONS = ['Cabeza Adelantada','Hombro Elevado','Escápula Alada','Hipercifosis Dorsal','Hiperlordosis Lumbar','Rectificación Cervical','Pelvis Basculada','Escoliosis','Genu Valgo (X)','Genu Varo (O)','Pie Plano/Cavo'];

const SpineLogo = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="2" width="6" height="2" rx="1" />
    <rect x="8" y="5.5" width="8" height="2.5" rx="1" />
    <rect x="7" y="9.5" width="10" height="3" rx="1" />
    <rect x="7.5" y="14" width="9" height="2.5" rx="1" />
    <rect x="8.5" y="18" width="7" height="2" rx="1" />
    <path d="M12 4v16" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
  </svg>
);

const SpineWatermark = () => (
  <div className="fixed inset-0 pointer-events-none flex justify-center items-center opacity-[0.03] z-0 overflow-hidden">
    <svg viewBox="0 0 200 800" className="h-[120%] w-auto text-cyan-400">
      <path d="M100,50 Q120,50 120,70 T100,90 T80,110 T100,130 T120,150 T100,170 T80,190 T100,210 T120,230 T100,250 T80,270 T100,290 T120,310 T100,330 T80,350 T100,370 T120,390 T100,410 T80,430 T100,450 T120,470 T100,490 T80,510 T100,530 T120,550 T100,570 T80,590 T100,610 T120,630 T100,650 T80,670 T100,690 T120,710 T100,730 T80,750" stroke="currentColor" strokeWidth="12" fill="none" />
    </svg>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 transition-all">
    <div className="bg-slate-950 w-full sm:max-w-3xl sm:w-[95%] rounded-t-[40px] sm:rounded-[50px] max-h-[95vh] overflow-y-auto shadow-2xl p-6 sm:p-10 border-t-4 border-cyan-500 text-white animate-slide-up relative scrollbar-hide">
      <div className="flex justify-between items-center mb-8 relative z-10">
        <h3 className="text-2xl font-black italic uppercase text-cyan-400 tracking-tight">{String(title)}</h3>
        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white active:scale-90 transition"><X className="w-5 h-5" /></button>
      </div>
      {children}
    </div>
  </div>
);

// 🌟 NUEVO MAPA ANATÓMICO CLÍNICO PROFESIONAL (3 VISTAS: Anterior, Lateral, Posterior)
const AnatomyMap = ({ selectedAreas, toggleArea }) => {
  const isSelected = (area) => selectedAreas.includes(area);
  const getFill = (area) => isSelected(area) ? "rgba(34, 211, 238, 0.4)" : "rgba(15, 23, 42, 0.6)"; 
  const getStroke = (area) => isSelected(area) ? "#22d3ee" : "#475569";
  const getTextColor = (area) => isSelected(area) ? "#22d3ee" : "#64748b";

  return (
    <div className="flex flex-col items-center bg-slate-900/40 p-4 sm:p-8 rounded-[40px] border border-white/5 relative mb-6 shadow-inner w-full overflow-hidden">
       <h4 className="text-[12px] font-black uppercase text-indigo-400 mb-6 tracking-widest w-full text-center sm:text-left flex justify-center sm:justify-start items-center gap-2"><Target className="w-4 h-4"/> Mapa Clínico (Anterior - Lateral - Posterior)</h4>
       
       <div className="w-full overflow-x-auto pb-6 scrollbar-hide">
         <div className="min-w-[650px] mx-auto">
           <svg viewBox="0 0 900 600" className="w-full h-[400px] drop-shadow-2xl">
             
             {/* ===================== VISTA 1: ANTERIOR (FRONTAL) x=150 ===================== */}
             <text x="150" y="580" textAnchor="middle" fill="#94a3b8" fontSize="16" fontWeight="900" letterSpacing="2">ANTERIOR</text>
             
             {/* Cabeza Frontal (No interactiva) */}
             <circle cx="150" cy="80" r="35" fill="none" stroke="#334155" strokeWidth="4" />
             
             {/* Cuello Frontal */}
             <path d="M 135 115 L 165 115 L 165 140 L 135 140 Z" fill="none" stroke="#334155" strokeWidth="4" />

             {/* Hombro Der. (Anatomico: Lado Izq. de pantalla) */}
             <g onClick={() => toggleArea('Hombro Der.')} className="cursor-pointer hover:opacity-80 transition-all">
               <circle cx="85" cy="150" r="25" fill={getFill('Hombro Der.')} stroke={getStroke('Hombro Der.')} strokeWidth="4" />
               <text x="85" y="155" textAnchor="middle" fontSize="11" fill={getTextColor('Hombro Der.')} fontWeight="bold">H. DER</text>
             </g>

             {/* Hombro Izq. (Anatomico: Lado Der. de pantalla) */}
             <g onClick={() => toggleArea('Hombro Izq.')} className="cursor-pointer hover:opacity-80 transition-all">
               <circle cx="215" cy="150" r="25" fill={getFill('Hombro Izq.')} stroke={getStroke('Hombro Izq.')} strokeWidth="4" />
               <text x="215" y="155" textAnchor="middle" fontSize="11" fill={getTextColor('Hombro Izq.')} fontWeight="bold">H. IZQ</text>
             </g>

             {/* Brazo Der. */}
             <g onClick={() => toggleArea('Brazo Der.')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="65" y="180" width="40" height="120" rx="20" fill={getFill('Brazo Der.')} stroke={getStroke('Brazo Der.')} strokeWidth="4" />
               <text x="85" y="245" textAnchor="middle" fontSize="11" fill={getTextColor('Brazo Der.')} fontWeight="bold" transform="rotate(-90 85 245)">BRAZO D.</text>
             </g>

             {/* Brazo Izq. */}
             <g onClick={() => toggleArea('Brazo Izq.')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="195" y="180" width="40" height="120" rx="20" fill={getFill('Brazo Izq.')} stroke={getStroke('Brazo Izq.')} strokeWidth="4" />
               <text x="215" y="245" textAnchor="middle" fontSize="11" fill={getTextColor('Brazo Izq.')} fontWeight="bold" transform="rotate(90 215 245)">BRAZO I.</text>
             </g>

             {/* Mano Der. */}
             <g onClick={() => toggleArea('Mano Der.')} className="cursor-pointer hover:opacity-80 transition-all">
               <circle cx="85" cy="325" r="20" fill={getFill('Mano Der.')} stroke={getStroke('Mano Der.')} strokeWidth="4" />
               <text x="85" y="330" textAnchor="middle" fontSize="10" fill={getTextColor('Mano Der.')} fontWeight="bold">MANO</text>
             </g>

             {/* Mano Izq. */}
             <g onClick={() => toggleArea('Mano Izq.')} className="cursor-pointer hover:opacity-80 transition-all">
               <circle cx="215" cy="325" r="20" fill={getFill('Mano Izq.')} stroke={getStroke('Mano Izq.')} strokeWidth="4" />
               <text x="215" y="330" textAnchor="middle" fontSize="10" fill={getTextColor('Mano Izq.')} fontWeight="bold">MANO</text>
             </g>

             {/* Torso Frontal */}
             <path d="M 105 140 L 195 140 L 180 300 L 120 300 Z" fill="none" stroke="#334155" strokeWidth="4" />

             {/* Pelvis Frontal */}
             <g onClick={() => toggleArea('Pelvis')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 115 300 L 185 300 L 195 340 L 150 370 L 105 340 Z" fill={getFill('Pelvis')} stroke={getStroke('Pelvis')} strokeWidth="4" strokeLinejoin="round" />
               <text x="150" y="330" textAnchor="middle" fontSize="12" fill={getTextColor('Pelvis')} fontWeight="bold">PELVIS</text>
             </g>

             {/* Pierna Der. */}
             <g onClick={() => toggleArea('Pierna Der.')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="105" y="350" width="35" height="150" rx="17" fill={getFill('Pierna Der.')} stroke={getStroke('Pierna Der.')} strokeWidth="4" />
               <text x="122" y="430" textAnchor="middle" fontSize="11" fill={getTextColor('Pierna Der.')} fontWeight="bold" transform="rotate(-90 122 430)">PIERNA D.</text>
             </g>

             {/* Pierna Izq. */}
             <g onClick={() => toggleArea('Pierna Izq.')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="160" y="350" width="35" height="150" rx="17" fill={getFill('Pierna Izq.')} stroke={getStroke('Pierna Izq.')} strokeWidth="4" />
               <text x="177" y="430" textAnchor="middle" fontSize="11" fill={getTextColor('Pierna Izq.')} fontWeight="bold" transform="rotate(90 177 430)">PIERNA I.</text>
             </g>

             {/* Pie Der. */}
             <g onClick={() => toggleArea('Pie Der.')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 100 500 L 140 500 L 145 525 L 95 525 Z" fill={getFill('Pie Der.')} stroke={getStroke('Pie Der.')} strokeWidth="4" strokeLinejoin="round" />
               <text x="120" y="518" textAnchor="middle" fontSize="10" fill={getTextColor('Pie Der.')} fontWeight="bold">PIE</text>
             </g>

             {/* Pie Izq. */}
             <g onClick={() => toggleArea('Pie Izq.')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 160 500 L 200 500 L 205 525 L 155 525 Z" fill={getFill('Pie Izq.')} stroke={getStroke('Pie Izq.')} strokeWidth="4" strokeLinejoin="round" />
               <text x="180" y="518" textAnchor="middle" fontSize="10" fill={getTextColor('Pie Izq.')} fontWeight="bold">PIE</text>
             </g>


             {/* ===================== VISTA 2: LATERAL x=450 ===================== */}
             <text x="450" y="580" textAnchor="middle" fill="#94a3b8" fontSize="16" fontWeight="900" letterSpacing="2">LATERAL</text>
             
             {/* Cabeza Lateral */}
             <ellipse cx="460" cy="80" rx="30" ry="35" fill="none" stroke="#334155" strokeWidth="4" />
             
             {/* Cuello Lateral (Cervical) */}
             <g onClick={() => toggleArea('Cervical')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 445 110 L 470 110 L 475 140 L 440 140 Z" fill={getFill('Cervical')} stroke={getStroke('Cervical')} strokeWidth="4" strokeLinejoin="round" />
               <text x="485" y="130" textAnchor="start" fontSize="12" fill={getTextColor('Cervical')} fontWeight="bold">CERV.</text>
             </g>

             {/* Torso Lateral */}
             <path d="M 430 140 L 485 140 L 495 240 L 420 240 Z" fill="none" stroke="#334155" strokeWidth="4" strokeLinejoin="round" />

             {/* Lumbar Lateral */}
             <g onClick={() => toggleArea('Lumbar')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 420 240 L 495 240 L 490 300 L 425 300 Z" fill={getFill('Lumbar')} stroke={getStroke('Lumbar')} strokeWidth="4" strokeLinejoin="round" />
               <text x="505" y="275" textAnchor="start" fontSize="12" fill={getTextColor('Lumbar')} fontWeight="bold">LUMB.</text>
             </g>

             {/* Pelvis Lateral */}
             <g onClick={() => toggleArea('Pelvis')} className="cursor-pointer hover:opacity-80 transition-all">
               <ellipse cx="455" cy="320" rx="40" ry="30" fill={getFill('Pelvis')} stroke={getStroke('Pelvis')} strokeWidth="4" />
               <text x="455" y="325" textAnchor="middle" fontSize="12" fill={getTextColor('Pelvis')} fontWeight="bold">PELVIS</text>
             </g>

             {/* Pierna Lateral */}
             <rect x="435" y="350" width="40" height="150" rx="20" fill="none" stroke="#334155" strokeWidth="4" />
             
             {/* Pie Lateral */}
             <path d="M 435 500 L 475 500 L 495 525 L 430 525 Z" fill="none" stroke="#334155" strokeWidth="4" strokeLinejoin="round" />

             {/* Brazo Lateral */}
             <rect x="440" y="150" width="30" height="110" rx="15" fill="none" stroke="#334155" strokeWidth="4" />
             <circle cx="455" cy="275" r="15" fill="none" stroke="#334155" strokeWidth="4" />


             {/* ===================== VISTA 3: POSTERIOR (ESPALDA) x=750 ===================== */}
             <text x="750" y="580" textAnchor="middle" fill="#94a3b8" fontSize="16" fontWeight="900" letterSpacing="2">POSTERIOR</text>
             
             {/* Cabeza Posterior */}
             <circle cx="750" cy="80" r="35" fill="none" stroke="#334155" strokeWidth="4" />

             {/* Cervical (Posterior) */}
             <g onClick={() => toggleArea('Cervical')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="730" y="115" width="40" height="30" rx="8" fill={getFill('Cervical')} stroke={getStroke('Cervical')} strokeWidth="4" />
               <text x="750" y="135" textAnchor="middle" fontSize="11" fill={getTextColor('Cervical')} fontWeight="bold">CERV</text>
             </g>

             {/* Hombros Posteriores */}
             <circle cx="685" cy="150" r="25" fill={getFill('Hombro Izq.')} stroke={getStroke('Hombro Izq.')} strokeWidth="4" />
             <circle cx="815" cy="150" r="25" fill={getFill('Hombro Der.')} stroke={getStroke('Hombro Der.')} strokeWidth="4" />

             {/* Brazos y Manos Posteriores (Reflejos Visuales, estéticos) */}
             <rect x="665" y="180" width="40" height="120" rx="20" fill="none" stroke="#334155" strokeWidth="4" />
             <rect x="795" y="180" width="40" height="120" rx="20" fill="none" stroke="#334155" strokeWidth="4" />
             <circle cx="685" cy="325" r="20" fill="none" stroke="#334155" strokeWidth="4" />
             <circle cx="815" cy="325" r="20" fill="none" stroke="#334155" strokeWidth="4" />

             {/* Espalda Dorsal */}
             <g onClick={() => toggleArea('Dorsal')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="710" y="150" width="80" height="90" rx="15" fill={getFill('Dorsal')} stroke={getStroke('Dorsal')} strokeWidth="4" />
               <text x="750" y="200" textAnchor="middle" fontSize="14" fill={getTextColor('Dorsal')} fontWeight="bold">DORSAL</text>
             </g>

             {/* Espalda Lumbar */}
             <g onClick={() => toggleArea('Lumbar')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="720" y="245" width="60" height="60" rx="12" fill={getFill('Lumbar')} stroke={getStroke('Lumbar')} strokeWidth="4" />
               <text x="750" y="280" textAnchor="middle" fontSize="12" fill={getTextColor('Lumbar')} fontWeight="bold">LUMBAR</text>
             </g>

             {/* Sacro / Pelvis Posterior */}
             <g onClick={() => toggleArea('Pelvis')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 710 310 L 790 310 L 750 360 Z" fill={getFill('Pelvis')} stroke={getStroke('Pelvis')} strokeWidth="4" strokeLinejoin="round" />
               <text x="750" y="330" textAnchor="middle" fontSize="10" fill={getTextColor('Pelvis')} fontWeight="bold">SACRO</text>
             </g>

             {/* Piernas Posteriores */}
             <rect x="705" y="350" width="35" height="150" rx="17" fill="none" stroke="#334155" strokeWidth="4" />
             <rect x="760" y="350" width="35" height="150" rx="17" fill="none" stroke="#334155" strokeWidth="4" />
             <path d="M 700 500 L 740 500 L 745 525 L 695 525 Z" fill="none" stroke="#334155" strokeWidth="4" strokeLinejoin="round" />
             <path d="M 760 500 L 800 500 L 805 525 L 755 525 Z" fill="none" stroke="#334155" strokeWidth="4" strokeLinejoin="round" />

           </svg>
         </div>
       </div>
    </div>
  );
};

const PremiumTab = ({ onActivateCode }) => {
  const [code, setCode] = useState('');
  const [activating, setActivating] = useState(false);
  const handleActivate = async () => { if (!code) return; setActivating(true); await onActivateCode(code); setActivating(false); };
  return (
    <div className="animate-fade-in space-y-6 text-center py-6 px-2">
      <div className="bg-gradient-to-tr from-amber-400 to-orange-600 p-6 rounded-[35px] inline-block mb-2 shadow-[0_0_40px_rgba(251,191,36,0.3)]"><CreditCard className="w-12 h-12 text-black" /></div>
      <h2 className="text-3xl font-black uppercase italic text-white mb-2">Desbloquea <span className="text-amber-400">PRO</span></h2>
      <p className="text-indigo-200 text-sm leading-relaxed mb-8">Adquiere licencia para sincronizar tu cuenta en PC.</p>
      <button onClick={() => openWhatsApp("529996180031", "Hola, me interesa adquirir QuiroApp PRO.")} className="w-full bg-amber-400 text-black font-black uppercase italic py-5 rounded-[25px] flex items-center justify-center gap-3 border-b-8 border-amber-600 active:scale-95 transition shadow-2xl mb-8"><MessageSquare className="w-6 h-6" /> WhatsApp</button>
      <div className="bg-slate-900/80 p-8 rounded-[40px] border border-cyan-400/20 text-left space-y-5 shadow-xl">
        <h4 className="text-cyan-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><KeyRound className="w-4 h-4"/> Tengo un código</h4>
        <input type="text" placeholder="Ej: PRO-X7Y8Z9" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="w-full bg-slate-950 p-5 rounded-3xl border border-white/10 text-white font-bold outline-none focus:border-cyan-400 tracking-[0.2em] uppercase text-center" />
        <button onClick={handleActivate} disabled={activating || !code} className="w-full bg-cyan-400 text-black py-4 rounded-3xl font-black uppercase italic border-b-4 border-cyan-700 active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50">{activating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activar Código'}</button>
      </div>
    </div>
  );
};

const AdminTab = ({ codes, onGenerateCode }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const handleGen = async (type, days) => { setIsGenerating(true); await onGenerateCode(type, days); setIsGenerating(false); };
  return (
    <div className="animate-fade-in space-y-6 text-left py-6 px-2">
      <div className="flex items-center gap-3 mb-6"><div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/30"><TerminalSquare className="w-8 h-8 text-rose-500" /></div><div><h2 className="text-2xl font-black uppercase italic text-white leading-none">Panel <span className="text-rose-500">Admin</span></h2></div></div>
      <div className="flex gap-3 mb-8"><button onClick={() => handleGen('Mensual', 30)} disabled={isGenerating} className="flex-1 bg-indigo-500 text-white py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 border-b-4 border-indigo-700">Mensual</button><button onClick={() => handleGen('Anual', 365)} disabled={isGenerating} className="flex-1 bg-rose-500 text-white py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 border-b-4 border-rose-800">Anual</button></div>
      <h3 className="text-sm font-black uppercase text-indigo-400 mb-4 tracking-widest">Historial Códigos ({codes.length})</h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
        {codes.map(c => (
          <div key={c.id} className="bg-slate-900 p-5 rounded-3xl flex justify-between shadow-lg">
            <div><p className="font-mono text-xl font-black text-white">{String(c.id)}</p><p className={`text-[9px] font-black uppercase tracking-widest ${c.used ? 'text-rose-400' : 'text-emerald-400'}`}>{c.used ? 'Usado' : 'Disponible'}</p></div>
            {!c.used && <button onClick={() => { navigator.clipboard.writeText(c.id); alert("Copiado"); }} className="p-3 bg-white/5 rounded-xl text-white"><Copy className="w-5 h-5"/></button>}
          </div>
        ))}
      </div>
    </div>
  );
};

const HomeTab = ({ appointments, patients, doctorInfo, onAddAppointment, onOpenCalendar, onUpgrade }) => {
  const today = new Date().toISOString().split('T')[0];
  const todays = appointments.filter(a => String(a.date) === today).sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
  const currentTheme = CLINIC_THEMES[doctorInfo.theme] || CLINIC_THEMES['azul'];
  
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className={`p-8 rounded-[45px] border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden transition-all duration-500 ${currentTheme.bg}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="relative z-10">
          <p className={`${currentTheme.text === 'text-white' ? 'text-cyan-400' : 'text-slate-500'} text-[10px] font-black uppercase tracking-widest mb-2 italic drop-shadow-md`}>{String(doctorInfo.clinic || (doctorInfo.isPremium ? "QuiroClínica Pro" : "QuiroClínica (Prueba)"))}</p>
          <h2 className={`text-4xl font-black italic ${currentTheme.text} leading-none tracking-tighter drop-shadow-lg`}>{String(doctorInfo.name || "Especialista")}</h2>
          <p className={`${currentTheme.text === 'text-white' ? 'text-cyan-300' : 'text-slate-600'} text-sm font-black uppercase tracking-[0.2em] mt-3 drop-shadow-md opacity-90`}>{String(doctorInfo.title || "Tu Profesión")}</p>
        </div>
      </div>
      
      {!doctorInfo.isPremium && (<div className="bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/30 p-5 rounded-[30px] flex items-center justify-between shadow-lg"><div><h4 className="text-amber-400 font-black uppercase text-sm flex items-center gap-1"><Sparkles className="w-4 h-4"/> Prueba Activa</h4><p className="text-[9px] text-amber-200/70 mt-1 uppercase tracking-widest">Activa PRO</p></div><button onClick={onUpgrade} className="bg-amber-500 text-black px-4 py-3 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition shadow-lg border-b-4 border-amber-700">Obtener PRO</button></div>)}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-6 rounded-[30px] border border-white/5 shadow-inner relative overflow-hidden"><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Pacientes</p><p className="text-3xl font-black text-white flex items-end gap-1">{String(patients.length)} {!doctorInfo.isPremium && <span className="text-[10px] text-amber-500 mb-1 opacity-60">/ {MAX_TRIAL_PATIENTS}</span>}</p></div>
        <div className="bg-slate-900 p-6 rounded-[30px] border border-white/5 shadow-inner"><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Citas Hoy</p><p className="text-3xl font-black text-white">{String(todays.length)}</p></div>
      </div>
      <div className="bg-indigo-950/20 p-6 rounded-[40px] border border-indigo-500/20 shadow-xl">
        <div className="flex justify-between items-center mb-6 px-2"><h3 className="text-xl font-black uppercase italic text-white">Agenda del Día</h3><div className="flex gap-3"><button onClick={onOpenCalendar} className="p-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl active:scale-90 shadow-lg"><CalendarIcon className="w-5 h-5" /></button><button onClick={onAddAppointment} className="p-3 bg-cyan-400 text-black rounded-2xl active:scale-90 shadow-lg"><Plus className="w-5 h-5" /></button></div></div>
        {todays.length === 0 ? (<div className="py-12 text-center opacity-40"><ClipboardList className="w-12 h-12 mx-auto mb-3 text-indigo-400" /><p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.2em]">Libre</p></div>) : (todays.map(app => (<div key={app.id} className="bg-slate-900/50 p-4 rounded-3xl border border-white/5 mb-3 flex items-center justify-between"><div><p className="text-white font-black uppercase italic">{String(patients.find(p => p.id === app.patientId)?.name || 'Desconocido')}</p><p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {String(app.time)}</p></div><ChevronRight className="w-5 h-5 text-indigo-800" /></div>)))}
      </div>
    </div>
  );
};

const PatientProfile = ({ patient, doctorInfo, onBack, onAddHistory, onDelete, onSchedule }) => {
  const [activeSection, setActiveSection] = useState('historial'); 
  const bmi = (patient.weight && patient.height) ? (parseFloat(patient.weight) / ((parseFloat(patient.height)/100)**2)).toFixed(1) : '--';

  return (
    <div className="animate-fade-in text-left pb-10">
      <div className="flex items-center gap-4 mb-4 sticky top-0 bg-slate-950/80 backdrop-blur-md py-4 z-20"><button onClick={onBack} className="p-3 bg-white/5 rounded-2xl active:scale-90"><ChevronRight className="rotate-180"/></button><div className="flex-1 min-w-0"><h2 className="text-2xl font-black uppercase italic truncate text-white">{String(patient.name)}</h2><p className="text-[9px] font-black uppercase text-cyan-400 tracking-widest">{String(patient.phone || 'Sin Teléfono')}</p></div><button onClick={onDelete} className="p-3 text-rose-500 bg-rose-500/10 rounded-2xl active:scale-90"><Trash2 className="w-5 h-5"/></button></div>
      <div className="flex gap-3 mb-6"><button onClick={() => openWhatsApp(patient.phone, "Hola desde la clínica.")} className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 shadow-lg"><MessageSquare className="w-4 h-4"/> WhatsApp</button><button onClick={onSchedule} className="flex-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 shadow-lg"><CalendarPlus className="w-4 h-4"/> Agendar</button></div>
      <div className="flex overflow-x-auto gap-2 pb-4 mb-2 scrollbar-hide">{['identidad', 'historial', 'evaluacion', 'anatomia', 'tratamiento', 'sesiones'].map(sec => (<button key={sec} onClick={() => setActiveSection(sec)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeSection === sec ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{sec}</button>))}</div>
      
      {activeSection === 'identidad' && (<div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4 animate-fade-in"><div className="grid grid-cols-2 gap-4"><div><p className="text-[8px] text-indigo-400 uppercase font-black">Sexo</p><p className="text-sm font-bold text-white">{patient.gender || '--'}</p></div><div><p className="text-[8px] text-indigo-400 uppercase font-black">Edad</p><p className="text-sm font-bold text-white">{patient.age ? `${patient.age} años` : '--'}</p></div><div className="col-span-2"><p className="text-[8px] text-indigo-400 uppercase font-black">Dirección</p><p className="text-sm font-bold text-white">{patient.address || '--'}</p></div></div></div>)}
      {activeSection === 'historial' && (<div className="space-y-4 animate-fade-in"><div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4"><div><h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Motivo Consulta</h4><p className="text-sm italic text-indigo-100 bg-slate-950 p-4 rounded-2xl">{patient.consultationReason || "--"}</p></div></div></div>)}
      {activeSection === 'evaluacion' && (<div className="space-y-4 animate-fade-in"><div className="grid grid-cols-4 gap-2 mb-2"><div className="bg-slate-900 p-3 rounded-2xl border border-white/5 text-center"><p className="text-[8px] font-black text-indigo-400 uppercase">Peso</p><p className="text-xs font-bold text-white">{patient.weight || '-'}kg</p></div><div className="bg-indigo-900/40 p-3 rounded-2xl border border-cyan-400/20 text-center"><p className="text-[8px] font-black text-cyan-400 uppercase">IMC</p><p className="text-xs font-bold text-cyan-400">{bmi}</p></div></div><div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4"><div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Dx Quiropráctico</h5><p className="text-sm font-bold text-cyan-300">{patient.chiropracticDiagnosis || "--"}</p></div></div></div>)}
      {activeSection === 'anatomia' && (<div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 animate-fade-in"><h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Postura</h4><p className="text-sm text-indigo-100">{patient.postureAnterior || "--"}</p></div>)}
      {activeSection === 'tratamiento' && (<div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 animate-fade-in"><div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Plan</h5><p className="text-sm text-indigo-100">{patient.treatmentPlan || "--"}</p></div></div>)}
      
      {activeSection === 'sesiones' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6 px-2 mt-4">
            <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-500"/> Ajustes Clínicos</h3>
            <button onClick={onAddHistory} className="bg-cyan-400 text-black px-4 py-3 rounded-2xl active:scale-90 transition shadow-2xl font-black uppercase text-[10px] flex items-center gap-2"><Plus className="w-4 h-4"/> Nuevo Ajuste</button>
          </div>
          
          <div className="space-y-4">
            {(!patient.histories || patient.histories.length === 0) ? (
              <div className="py-16 text-center opacity-30 border-2 border-dashed border-white/10 rounded-[40px]">
                 <Stethoscope className="w-12 h-12 mx-auto mb-4 text-indigo-400"/>
                 <p className="text-xs font-black uppercase tracking-widest">Sin registros clínicos</p>
              </div>
            ) : patient.histories.map((h, i) => {
              const getPainColor = (lvl) => {
                if(lvl <= 3) return 'text-emerald-400 border-emerald-500/30';
                if(lvl <= 6) return 'text-amber-400 border-amber-500/30';
                return 'text-rose-500 border-rose-500/30';
              };
              const hasRedFlags = h.redFlags && h.redFlags.length > 0;
              return (
                <div key={i} className={`bg-slate-900/50 p-6 rounded-3xl border-l-4 ${hasRedFlags ? 'border-rose-500' : 'border-cyan-500'} shadow-md transition-all`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{safeFormatDate(h.date)}</span>
                    <span className={`text-[11px] font-black uppercase bg-slate-950 px-3 py-1.5 rounded-xl border ${getPainColor(h.painLevel)}`}>Dolor {String(h.painLevel)}/10</span>
                  </div>
                  
                  {hasRedFlags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {h.redFlags.map(f => <span key={f} className="text-[9px] bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-lg font-black uppercase flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> {f}</span>)}
                    </div>
                  )}

                  {h.notes && <p className="text-sm italic mb-4 text-indigo-50 bg-slate-950/50 p-4 rounded-2xl border border-white/5">"{String(h.notes)}"</p>}
                  
                  <div className="flex flex-wrap gap-2">
                    {h.areas?.map(a => <span key={a} className="text-[9px] bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 text-cyan-400 font-black uppercase tracking-widest flex items-center gap-1"><Target className="w-3 h-3"/> {String(a)}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// 🌟 FIX 1 & 2: Responsive Grid para Fecha/Edad y Listas de Peso/Altura a 190kg
const NewPatientModal = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', age: '', gender: '', address: '', occupation: '', maritalStatus: '', location: '', birthPlace: '', birthDate: '', relevantMedicalHistory: '', consultationReason: '', complementaryExams: '', currentIllness: '', pathological: '', nonPathological: '', medications: '', redFlags: [], chiropracticDiagnosis: '', subluxations: '', observations: '', treatmentPlan: '', treatmentGoals: '', sleepQuality: '', personalCare: '', mobility: '', recreation: '', generalDiagnosis: '', weight: '', height: '', bloodType: '', pressure: '', chiropracticTechniques: [], additionalRecommendations: '', posturalDeviations: [], postureAnterior: '', posturePosterior: '', postureLateral: '', anatomicalPlaneNotes: '', histories: [], painLevel: 0, areas: [], notes: '' });
  
  const handleNext = () => { if(form.name) setStep(step + 1); };
  
  const handleSaveClick = () => { 
    if (isSaving) return; 
    setIsSaving(true); 
    const finalPatient = { ...form };
    if (form.painLevel > 0 || form.areas.length > 0 || form.notes || form.redFlags.length > 0) {
      finalPatient.histories = [{
        date: new Date().toISOString().split('T')[0],
        painLevel: form.painLevel,
        areas: form.areas,
        redFlags: form.redFlags,
        notes: form.notes
      }];
    }
    onSave(finalPatient); 
  };
  
  const toggleArrayItem = (field, item) => { setForm(prev => { const arr = prev[field] || []; return { ...prev, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] }; }); };
  const toggleArea = (area) => setForm(prev => ({ ...prev, areas: prev.areas.includes(area) ? prev.areas.filter(a => a !== area) : [...prev.areas, area] }));
  const quickFlags = ['Fractura', 'Marcapasos', 'Tumor', 'Osteoporosis', 'Embarazo', 'Cirugía Reciente'];

  const getPainColor = (level) => {
    if (level <= 3) return 'accent-emerald-400 text-emerald-400';
    if (level <= 6) return 'accent-amber-400 text-amber-400';
    return 'accent-rose-500 text-rose-500';
  };
  const getPainLabel = (level) => {
    if (level === 0) return 'Sin Dolor';
    if (level <= 3) return 'Leve';
    if (level <= 6) return 'Moderado';
    if (level <= 9) return 'Severo';
    return 'Insoportable';
  };

  const inputClass = "w-full bg-slate-900 p-5 rounded-[20px] border border-white/10 text-white outline-none focus:border-cyan-500 text-sm shadow-inner transition-all";
  const labelClass = "text-[10px] font-black uppercase text-indigo-400 ml-4 mb-2 flex items-center gap-1 tracking-widest";

  return (
    <Modal title={`Crear Expediente (${step}/8)`} onClose={onClose}>
      <div className="space-y-6">
        {step === 1 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">1. Identidad del Paciente</h4>
          <div>
            <label className={labelClass}>Nombre completo *</label>
            <input type="text" placeholder="Ej. Juan Pérez" className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2"><label className={labelClass}>Teléfono</label><input type="tel" placeholder="Ej. 555 123 4567" className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div className="w-full sm:w-1/2"><label className={labelClass}>Sexo</label><select className={`${inputClass} appearance-none cursor-pointer`} value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}><option value="">Selecciona...</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option></select></div>
          </div>
          
          {/* Solución a la Fecha y Edad amontonadas */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2"><label className={labelClass}>Fecha de Nacimiento</label><input type="date" className={inputClass} value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} /></div>
            <div className="w-full sm:w-1/2">
              <label className={labelClass}>Edad</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.age} onChange={e => setForm({...form, age: e.target.value})}>
                <option value="">Selecciona la Edad...</option>
                {Array.from({length: 100}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} años</option>)}
              </select>
            </div>
          </div>

          <div><label className={labelClass}>Dirección Completa</label><input type="text" placeholder="Ej. Av. Reforma 123" className={inputClass} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
        </div>)}

        {step === 2 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">2. Motivo y Antecedentes</h4>
          <div><label className={labelClass}>Motivo de Consulta *</label><textarea placeholder="Ej. Dolor lumbar irradiado a pierna derecha..." className={`${inputClass} min-h-[100px]`} value={form.consultationReason} onChange={e => setForm({...form, consultationReason: e.target.value})} /></div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2"><label className={labelClass}>Ant. Patológicos</label><textarea placeholder="Enfermedades previas" className={`${inputClass} min-h-[120px]`} value={form.pathological} onChange={e => setForm({...form, pathological: e.target.value})} /></div>
            <div className="w-full sm:w-1/2"><label className={labelClass}>Ant. No Patológicos</label><textarea placeholder="Hábitos, ejercicio, tabaco" className={`${inputClass} min-h-[120px]`} value={form.nonPathological} onChange={e => setForm({...form, nonPathological: e.target.value})} /></div>
          </div>
        </div>)}

        {step === 3 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">3. Precauciones y Diagnóstico</h4>
          <div><label className="text-[10px] font-black uppercase text-rose-400 ml-4 mb-2 flex items-center gap-1 tracking-widest"><ShieldAlert className="w-3 h-3"/> Banderas Rojas</label>
            <div className="bg-slate-900 p-6 rounded-[25px] border border-white/5 flex flex-wrap gap-2">
              {RED_FLAGS.map(flag => (<button key={flag} onClick={() => toggleArrayItem('redFlags', flag)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all ${form.redFlags.includes(flag) ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-105' : 'bg-slate-950 text-slate-400 border-white/5'}`}>{flag}</button>))}
            </div>
          </div>
          <div><label className={labelClass}>Diagnóstico Quiropráctico</label><input type="text" placeholder="Ej. Subluxación L4-L5" className={inputClass} value={form.chiropracticDiagnosis} onChange={e => setForm({...form, chiropracticDiagnosis: e.target.value})} /></div>
        </div>)}

        {step === 4 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">4. Plan de Tratamiento</h4>
          <div><label className={labelClass}>Frecuencia y Objetivos</label><textarea placeholder="Ej. 2 sesiones por semana durante 1 mes para reducir dolor..." className={`${inputClass} min-h-[140px]`} value={form.treatmentPlan} onChange={e => setForm({...form, treatmentPlan: e.target.value})} /></div>
        </div>)}

        {step === 5 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">5. Examen Físico</h4>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
              <label className={labelClass}>Peso Físico</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.weight} onChange={e => setForm({...form, weight: e.target.value})}>
                <option value="">Selecciona...</option>
                {Array.from({length: 161}, (_, i) => i + 30).map(n => <option key={n} value={n}>{n} kg</option>)}
              </select>
            </div>
            <div className="w-full sm:w-1/2">
              <label className={labelClass}>Altura Total</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.height} onChange={e => setForm({...form, height: e.target.value})}>
                <option value="">Selecciona...</option>
                {Array.from({length: 121}, (_, i) => i + 100).map(n => <option key={n} value={n}>{n} cm</option>)}
              </select>
            </div>
          </div>
        </div>)}

        {step === 6 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">6. Análisis Postural</h4>
          <div><label className={labelClass}>Desviaciones Detectadas</label>
            <div className="bg-slate-900 p-6 rounded-[25px] border border-white/5 flex flex-wrap gap-2">
              {POSTURAL_DEVIATIONS.map(dev => (<button key={dev} onClick={() => toggleArrayItem('posturalDeviations', dev)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all ${form.posturalDeviations.includes(dev) ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105' : 'bg-slate-950 text-slate-400 border-white/5'}`}>{dev}</button>))}
            </div>
          </div>
        </div>)}

        {step === 7 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">7. Técnicas Sugeridas</h4>
          <div><label className={labelClass}>Métodos de Ajuste Preferidos</label>
            <div className="bg-slate-900 p-6 rounded-[25px] border border-white/5 flex flex-wrap gap-2">
              {CHIRO_TECHNIQUES.map(tech => (<button key={tech} onClick={() => toggleArrayItem('chiropracticTechniques', tech)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all ${form.chiropracticTechniques.includes(tech) ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105' : 'bg-slate-950 text-slate-400 border-white/5'}`}>{tech}</button>))}
            </div>
          </div>
        </div>)}

        {step === 8 && (<div className="space-y-8 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-cyan-400 mb-4 border-b border-white/10 pb-4 flex items-center gap-2"><Target className="w-4 h-4"/> 8. Evaluación Inicial (Primer Ajuste)</h4>
          
          <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 shadow-inner">
            <div className="flex justify-between items-end mb-6">
              <label className={labelClass} style={{marginLeft: 0}}>Escala de Dolor (EVA)</label>
              <div className="text-right">
                <span className={`text-3xl font-black ${getPainColor(form.painLevel)}`}>{form.painLevel} <span className="text-sm text-slate-500">/ 10</span></span>
                <p className={`text-[10px] font-black uppercase tracking-widest ${getPainColor(form.painLevel)}`}>{getPainLabel(form.painLevel)}</p>
              </div>
            </div>
            <input type="range" min="0" max="10" className={`w-full h-3 bg-slate-950 rounded-full appearance-none outline-none transition-all duration-300 ${getPainColor(form.painLevel)}`} value={form.painLevel} onChange={e => setForm({...form, painLevel: parseInt(e.target.value)})} />
            <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 mt-3"><span>0 (Sin Dolor)</span><span>10 (Insoportable)</span></div>
          </div>

          <AnatomyMap selectedAreas={form.areas} toggleArea={toggleArea} />

          <div>
            <label className={labelClass}>Notas de la Sesión Inicial</label>
            <textarea placeholder="Ej. El paciente se ajustó exitosamente. Cita agendada para revisión..." className={`${inputClass} min-h-[120px]`} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
        </div>)}

        <div className="flex gap-4 pt-8">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 bg-slate-900 py-5 rounded-3xl font-black uppercase text-[11px] active:scale-95 transition tracking-widest hover:bg-slate-800 border border-white/10">Atrás</button>}
          {step < 8 ? (<button onClick={handleNext} disabled={!form.name} className="flex-[2] bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase text-[11px] active:scale-95 transition shadow-[0_10px_20px_rgba(34,211,238,0.2)] border-b-8 border-cyan-700 disabled:opacity-50 tracking-widest">Siguiente Paso</button>) : (<button onClick={handleSaveClick} disabled={isSaving} className="flex-[2] bg-emerald-400 text-black py-5 rounded-3xl font-black uppercase text-[11px] border-b-8 border-emerald-700 flex justify-center items-center gap-2 active:scale-95 transition disabled:opacity-70 shadow-[0_10px_20px_rgba(52,211,153,0.3)] tracking-widest">{isSaving ? 'Guardando...' : 'Crear Expediente'}</button>)}
        </div>
      </div>
    </Modal>
  );
};

const NewHistoryModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], painLevel: 0, areas: [], redFlags: [], notes: '' });
  const [isSaving, setIsSaving] = useState(false);
  const quickFlags = ['Fractura', 'Marcapasos', 'Tumor', 'Osteoporosis', 'Embarazo', 'Cirugía Reciente'];

  const handleSaveClick = () => { if (isSaving) return; setIsSaving(true); onSave(form); };
  const toggleArea = (area) => setForm(prev => ({ ...prev, areas: prev.areas.includes(area) ? prev.areas.filter(a => a !== area) : [...prev.areas, area] }));

  const getPainColor = (level) => {
    if (level <= 3) return 'accent-emerald-400 text-emerald-400 shadow-emerald-500/50';
    if (level <= 6) return 'accent-amber-400 text-amber-400 shadow-amber-500/50';
    return 'accent-rose-500 text-rose-500 shadow-rose-500/50';
  };

  const getPainLabel = (level) => {
    if (level === 0) return 'Sin Dolor';
    if (level <= 3) return 'Leve';
    if (level <= 6) return 'Moderado';
    if (level <= 9) return 'Severo';
    return 'Insoportable';
  };

  const inputClass = "w-full bg-slate-900 p-5 rounded-[20px] border border-white/10 text-white outline-none focus:border-cyan-500 text-sm shadow-inner transition-all";
  const labelClass = "text-[10px] font-black uppercase text-indigo-400 ml-4 mb-2 flex items-center gap-1 tracking-widest";

  return (
    <Modal title="Nuevo Registro Clínico" onClose={onClose}>
      <div className="space-y-8 text-left pb-4">
        
        <div>
          <label className={labelClass}>Fecha del Ajuste</label>
          <input type="date" className={inputClass} value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        </div>

        <div className="bg-rose-950/20 p-8 rounded-[35px] border border-rose-500/20 shadow-inner">
          <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Banderas Rojas (Precauciones)</label>
          <div className="flex flex-wrap gap-2">
            {quickFlags.map(flag => (
              <button 
                key={flag} 
                onClick={() => setForm(prev => ({...prev, redFlags: prev.redFlags.includes(flag) ? prev.redFlags.filter(f => f !== flag) : [...prev.redFlags, flag]}))} 
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${form.redFlags.includes(flag) ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-105 border-rose-400' : 'bg-slate-950 text-slate-400 border border-white/5 hover:bg-slate-900'}`}
              >
                {flag}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 shadow-inner">
          <div className="flex justify-between items-end mb-6">
            <label className={labelClass} style={{marginLeft: 0}}>Escala de Dolor (EVA)</label>
            <div className="text-right">
              <span className={`text-3xl font-black ${getPainColor(form.painLevel).split(' ')[1]}`}>{form.painLevel} <span className="text-sm text-slate-500">/ 10</span></span>
              <p className={`text-[10px] font-black uppercase tracking-widest ${getPainColor(form.painLevel).split(' ')[1]}`}>{getPainLabel(form.painLevel)}</p>
            </div>
          </div>
          <input type="range" min="0" max="10" className={`w-full h-3 bg-slate-950 rounded-full appearance-none outline-none transition-all duration-300 ${getPainColor(form.painLevel).split(' ')[0]}`} value={form.painLevel} onChange={e => setForm({...form, painLevel: parseInt(e.target.value)})} />
          <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 mt-3">
            <span>0 (Sin Dolor)</span>
            <span>10 (Insoportable)</span>
          </div>
        </div>

        <AnatomyMap selectedAreas={form.areas} toggleArea={toggleArea} />

        <div>
          <label className={labelClass}><FileText className="w-3 h-3"/> Notas de Evolución</label>
          <textarea placeholder="Ej. Hubo cavitación en C2. El paciente reporta mejoría..." className={`${inputClass} min-h-[120px]`} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        </div>

        <button onClick={handleSaveClick} disabled={isSaving} className="w-full bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase italic border-b-8 border-cyan-700 shadow-[0_10px_20px_rgba(34,211,238,0.2)] active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 mt-6 tracking-widest">
          {isSaving ? <><Loader2 className="w-5 h-5 animate-spin"/> Guardando...</> : <><CheckCircle2 className="w-5 h-5"/> Guardar Ajuste Clínico</>}
        </button>
      </div>
    </Modal>
  );
};

const ProfileTab = ({ user, doctorInfo, patients, onUpdateInfo, onLogout, onLinkGoogle, onLinkEmail, onUpgrade, onOpenAdminLogin, visualMode, setVisualMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(doctorInfo.title || '');
  const [customTitle, setCustomTitle] = useState('');
  const [name, setName] = useState(doctorInfo.name || '');
  const [clinic, setClinic] = useState(doctorInfo.clinic || '');
  const [theme, setTheme] = useState(doctorInfo.theme || 'azul'); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  
  const [showProDetails, setShowProDetails] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailLink, setEmailLink] = useState('');
  const [passLink, setPassLink] = useState('');

  const isLocked = !doctorInfo.isPremium;
  const PRO_TITLES = ["Dr.", "Dra.", "Quiropráctico", "Quiropráctica", "Fisioterapeuta", "Terapeuta Físico", "Masoterapeuta", "Terapeuta de Spa", "Osteópata", "Especialista en Rehabilitación", "Lic.", "Otro"];

  const handleSave = async () => {
    if (isLocked) return;
    setIsSaving(true);
    const finalTitle = title === 'Otro' ? customTitle : title;
    await onUpdateInfo({ title: finalTitle, name, clinic, theme }); 
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setIsEditing(false); }, 1500); 
  };

  const handleAdminTap = () => {
    if (tapCount >= 6) { onOpenAdminLogin(); setTapCount(0); } 
    else setTapCount(prev => prev + 1);
  };

  const getProRemainingDays = () => {
    if (!doctorInfo.premiumExpiresAt) return null;
    const diffMs = doctorInfo.premiumExpiresAt - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / 86400000);
  };

  const handleImageUpload = (e, fieldName) => {
    if (isLocked) return;
    const file = e.target.files[0];
    if (!file) return;
    setIsSaving(true); 
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256; const MAX_HEIGHT = 256;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
        await onUpdateInfo({ [fieldName]: canvas.toDataURL('image/jpeg', 0.7) });
        setIsSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const inputClass = `w-full bg-slate-950 p-5 rounded-[25px] border border-white/10 text-white font-bold outline-none transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : 'focus:border-cyan-400'}`;
  const currentTheme = CLINIC_THEMES[doctorInfo.theme] || CLINIC_THEMES['azul'];

  return (
    <div className="animate-fade-in space-y-6 text-left">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-3xl font-black uppercase italic underline decoration-cyan-500 decoration-4 underline-offset-8">Ajustes</h2>
        
        <div className="relative z-50">
          <button 
            onClick={() => isLocked ? onUpgrade() : setShowProDetails(!showProDetails)}
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all ${isLocked ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20' : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 hover:bg-cyan-500/20'}`}
          >
            {isLocked ? <Lock className="w-3 h-3"/> : <ShieldCheck className="w-3 h-3"/>}
            {isLocked ? 'Activar PRO' : 'Sincronización PRO'}
          </button>

          {showProDetails && !isLocked && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-slate-900 border border-cyan-500/30 p-5 rounded-3xl shadow-2xl z-50 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-5 h-5 text-cyan-400"/>
                <p className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">Licencia en Nube</p>
              </div>
              <p className="text-xs text-slate-400 mb-4 uppercase font-bold">Tiempo restante: <br/><span className="text-xl text-emerald-400 font-black">{getProRemainingDays()} días</span></p>
              
              <div className="border-t border-white/10 pt-4">
                <p className="text-[9px] text-slate-400 uppercase mb-3 font-bold tracking-widest">Sincronización de Cuenta</p>
                {user.isAnonymous ? (
                  <div className="space-y-2">
                    <button onClick={onLinkGoogle} className="w-full bg-white text-black text-[9px] font-black uppercase py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"><Globe className="w-4 h-4"/> Google</button>
                    <button onClick={() => setShowEmailForm(!showEmailForm)} className="w-full bg-indigo-500 text-white text-[9px] font-black uppercase py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"><Mail className="w-4 h-4"/> Correo</button>
                    {showEmailForm && (
                      <div className="mt-2 space-y-2">
                        <input type="email" placeholder="Correo" value={emailLink} onChange={e => setEmailLink(e.target.value)} className="w-full bg-slate-950 p-3 rounded-lg text-white text-[9px] outline-none border border-white/10" />
                        <input type="password" placeholder="Contraseña" value={passLink} onChange={e => setPassLink(e.target.value)} className="w-full bg-slate-950 p-3 rounded-lg text-white text-[9px] outline-none border border-white/10" />
                        <button onClick={() => onLinkEmail(emailLink, passLink)} className="w-full bg-cyan-400 text-black py-2 rounded-lg text-[9px] font-black uppercase shadow-lg">Guardar</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 py-3 rounded-xl flex justify-center items-center gap-2 font-black text-[10px] uppercase"><CheckCircle2 className="w-4 h-4"/> Cuenta Vinculada</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setVisualMode('claro')} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all shadow-lg ${visualMode === 'claro' ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)] border-b-4 border-cyan-600 scale-105' : 'bg-slate-900/50 text-slate-400 border border-white/5 hover:bg-slate-800'}`}>
          ☀️ Modo Claro
        </button>
        <button onClick={() => setVisualMode('oscuro')} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all shadow-lg ${visualMode === 'oscuro' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border-b-4 border-indigo-800 scale-105' : 'bg-slate-900/50 text-slate-400 border border-white/5 hover:bg-slate-800'}`}>
          🌙 Modo Oscuro
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-[40px] border border-cyan-400/20 shadow-xl overflow-hidden relative transition-all duration-500">
        {!isEditing ? (
          <div className="relative animate-fade-in">
            <div className={`h-36 w-full relative border-b border-white/10 ${currentTheme.bg}`}>
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <div className="px-8 pb-8 relative mt-[-45px] text-center flex flex-col items-center">
               <div className="w-24 h-24 bg-slate-950 rounded-[25px] border-4 border-cyan-500/50 flex items-center justify-center overflow-hidden mb-4 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                 {doctorInfo.logo ? <img src={doctorInfo.logo} className="w-full h-full object-cover" alt="Logo"/> : <User className="w-10 h-10 text-cyan-500/50"/>}
               </div>
               <h3 className="text-3xl font-black uppercase text-white tracking-tight leading-none mb-2">{doctorInfo.name || 'Tu Nombre'}</h3>
               <p className="text-[11px] font-black uppercase text-cyan-400 tracking-[0.2em]">{doctorInfo.title || 'Especialista'}</p>
               <p className="text-xs text-indigo-200 mt-4 flex items-center gap-2 bg-black/40 px-5 py-2.5 rounded-xl border border-white/5 uppercase font-bold tracking-widest"><Building className="w-4 h-4 text-indigo-400"/> {doctorInfo.clinic || 'Nombre de Clínica'}</p>
               
               <button onClick={() => setIsEditing(true)} className="w-full mt-8 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 py-4 rounded-3xl font-black uppercase text-xs active:scale-95 transition-all flex justify-center items-center gap-2 hover:bg-cyan-500/20">
                 <Settings className="w-4 h-4" /> Configurar Perfil
               </button>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-6 animate-fade-in bg-indigo-950/20">
             <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
               <h3 className="text-sm font-black uppercase text-cyan-400 flex items-center gap-2"><Settings className="w-4 h-4"/> Editar Perfil</h3>
               <button onClick={() => setIsEditing(false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-white px-3 py-2 bg-white/5 rounded-full flex items-center gap-1 transition-all"><X className="w-3 h-3"/> Cancelar</button>
             </div>
             
             <div className="border-b border-white/10 pb-6 mb-6">
               <label className={`text-[10px] font-black uppercase ml-4 mb-3 flex items-center gap-2 tracking-widest ${isLocked ? 'text-slate-500' : 'text-cyan-400'}`}>
                 <Palette className="w-3 h-3" /> Color de Fondo de Ventana
               </label>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {Object.entries(CLINIC_THEMES).map(([key, t]) => (
                   <button 
                     key={key} 
                     onClick={() => setTheme(key)} 
                     disabled={isLocked}
                     className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${theme === key ? 'border-cyan-400 scale-105 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'} ${t.bg}`}
                   >
                     <span className={`text-[9px] font-black uppercase tracking-widest text-center ${t.text}`}>{t.name}</span>
                   </button>
                 ))}
               </div>
             </div>

             <div className="border-b border-white/10 pb-6 mb-6">
               <label className={`text-[10px] font-black uppercase ml-4 mb-3 flex items-center gap-2 tracking-widest ${isLocked ? 'text-slate-500' : 'text-cyan-400'}`}><ImagePlus className="w-3 h-3" /> Logo de Clínica</label>
               <div className="flex items-center gap-4">
                 <div className={`w-20 h-20 shrink-0 rounded-[20px] flex items-center justify-center border-2 border-dashed ${isLocked ? 'border-slate-700 bg-slate-900/50' : 'border-cyan-500/50 bg-slate-950 overflow-hidden'}`}>
                   {doctorInfo.logo ? <img src={doctorInfo.logo} alt="Logo" className="w-full h-full object-cover" /> : <ImagePlus className={`w-8 h-8 ${isLocked ? 'text-slate-700' : 'text-cyan-500/50'}`} />}
                 </div>
                 <div className="flex-1">
                   <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} disabled={isLocked} />
                   <label htmlFor="logo-upload" className={`py-3 px-5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${isLocked ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 cursor-pointer active:scale-95 hover:bg-cyan-500/20'}`}><Upload className="w-4 h-4" /> Subir Logo</label>
                 </div>
               </div>
             </div>

             <div>
               <label className="text-[10px] font-black uppercase ml-4 mb-2 flex items-center gap-2 text-cyan-400 tracking-widest"><User className="w-3 h-3"/> Título Profesional</label>
               <select className={`${inputClass} appearance-none cursor-pointer`} value={PRO_TITLES.includes(title) ? title : (title ? 'Otro' : '')} onChange={(e) => {setTitle(e.target.value); if(e.target.value !== 'Otro') setCustomTitle('');}} disabled={isLocked}>
                 <option value="">Selecciona tu profesión...</option>
                 {PRO_TITLES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
               </select>
               {(!PRO_TITLES.includes(title) && title !== '') || title === 'Otro' ? (
                 <input type="text" placeholder="Escribe tu título..." className={`${inputClass} mt-3`} value={title === 'Otro' ? customTitle : title} onChange={(e) => {setTitle('Otro'); setCustomTitle(e.target.value);}} disabled={isLocked} />
               ) : null}
             </div>
             
             <div><label className="text-[10px] font-black uppercase ml-4 mb-2 flex items-center gap-2 text-cyan-400 tracking-widest"><User className="w-3 h-3"/> Tu Nombre</label><input type="text" placeholder="Ej. Juan Pérez" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} disabled={isLocked} /></div>
             <div><label className="text-[10px] font-black uppercase ml-4 mb-2 flex items-center gap-2 text-cyan-400 tracking-widest"><Building className="w-3 h-3"/> Clínica</label><input type="text" placeholder="Nombre de tu Clínica" className={inputClass} value={clinic} onChange={(e) => setClinic(e.target.value)} disabled={isLocked} /></div>

             <button onClick={handleSave} disabled={isSaving || saved || isLocked} className={`w-full bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase italic shadow-xl mt-4 border-b-8 border-cyan-700 active:scale-95 transition-all flex justify-center items-center gap-2 ${isLocked ? 'opacity-30' : ''}`}>
               {isSaving ? <><Loader2 className="w-5 h-5 animate-spin"/> Guardando...</> : <><CheckCircle2 className="w-5 h-5"/> Guardar Cambios</>}
             </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-8 rounded-[40px] border border-white/5 text-center shadow-xl">
        <UserCircle onClick={handleAdminTap} className="w-12 h-12 mx-auto mb-4 text-indigo-500 cursor-pointer"/>
        <p className="text-[9px] font-black uppercase text-indigo-400 mb-1 tracking-widest">Cuenta Activa</p>
        <p className="text-xs font-bold text-white mb-6 break-all">{user.isAnonymous ? "Perfil Temporal (No Guardado)" : String(user.email || user.phoneNumber)}</p>
        <button onClick={onLogout} className="w-full bg-rose-500/10 py-5 rounded-[25px] flex items-center justify-center gap-3 text-rose-500 font-black uppercase italic shadow-lg active:scale-95 transition-all border border-rose-500/20">
          <LogOut className="w-5 h-5"/> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState('home');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState({ title: '', name: '', clinic: '', theme: 'azul', trialStartedAt: null, isPremium: false, isAdmin: false });
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [trialTimeLeft, setTrialTimeLeft] = useState({ days: 0, hours: 0, expired: false });
  const [adminCodes, setAdminCodes] = useState([]);
  const [modals, setModals] = useState({});
  const [authInProcess, setAuthInProcess] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authStep, setAuthStep] = useState('initial');

  const [visualMode, setVisualMode] = useState(localStorage.getItem('quiroTheme') || 'oscuro');

  useEffect(() => {
    localStorage.setItem('quiroTheme', visualMode);
  }, [visualMode]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); if (!currentUser) { setLoading(false); setAuthInProcess(false); } });
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    const checkTrialAndSync = async () => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
        const snap = await getDocFromServer(docRef); 
        let profileData = snap.exists() ? snap.data() : { title: '', name: '', clinic: '', theme: 'azul', trialStartedAt: Date.now(), isPremium: false, isAdmin: false };
        if (!snap.exists()) await setDoc(docRef, profileData);
        else if (!profileData.trialStartedAt) { profileData.trialStartedAt = Date.now(); await updateDoc(docRef, { trialStartedAt: profileData.trialStartedAt }); }
        
        if (profileData.isPremium && profileData.premiumExpiresAt && Date.now() > profileData.premiumExpiresAt) {
          profileData.isPremium = false; await updateDoc(docRef, { isPremium: false });
        }
        setDoctorInfo(profileData);
        if (profileData.isPremium) setTrialTimeLeft({ expired: false, isPremium: true });
        else {
          const diffMs = (TRIAL_DAYS * 24 * 60 * 60 * 1000) - (Date.now() - profileData.trialStartedAt);
          if (diffMs <= 0) setTrialTimeLeft({ days: 0, hours: 0, expired: true });
          else setTrialTimeLeft({ days: Math.floor(diffMs / 86400000), hours: Math.floor((diffMs % 86400000) / 3600000), expired: false });
        }
      } catch (e) {} finally { setLoading(false); }
    };
    checkTrialAndSync();
    const unsubPat = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'patients'), (snap) => setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubApp = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), (snap) => setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubPat(); unsubApp(); };
  }, [user]);

  useEffect(() => {
    if (user && doctorInfo?.isAdmin) {
      const unsubCodes = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'codes'), (snap) => setAdminCodes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      return () => unsubCodes();
    }
  }, [user, doctorInfo?.isAdmin]);

  const handleGoogleLogin = async () => { setAuthInProcess(true); setAuthError(""); try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { if (err.code !== 'auth/popup-closed-by-user') setAuthError("Error de Google."); setAuthInProcess(false); } };
  const handleTrialLogin = async () => { setAuthInProcess(true); setAuthError(""); try { await signInAnonymously(auth); } catch (e) { setAuthError("Error de conexión."); setAuthInProcess(false); } };
  const handleEmailAuth = async (e, p, login) => { if (!e || !p) return setAuthError("Rellena todos los campos."); setAuthInProcess(true); setAuthError(""); try { if (login) await signInWithEmailAndPassword(auth, e, p); else await createUserWithEmailAndPassword(auth, e, p); } catch (err) { setAuthError("Error de credenciales."); setAuthInProcess(false); } };
  const handleLinkGoogle = async () => { try { await linkWithPopup(auth.currentUser, new GoogleAuthProvider()); alert("¡Cuenta vinculada!"); } catch (err) { alert("Error al vincular."); } };
  const handleLinkEmail = async (e, p) => { if(!e || !p) return alert("Completa los datos."); try { await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(e, p)); alert("¡Cuenta vinculada!"); } catch (err) { alert("Error al vincular."); } };

  const handleActivateCode = async (codeStr) => {
    if (!codeStr) return alert("Ingresa un código.");
    try {
      const codeRef = doc(db, 'artifacts', appId, 'public', 'data', 'codes', codeStr.trim().toUpperCase());
      const codeSnap = await getDoc(codeRef); 
      if (codeSnap.exists() && !codeSnap.data().used) {
         const codeData = codeSnap.data();
         const newExpiresAt = (doctorInfo.premiumExpiresAt || Date.now()) + ((codeData.durationDays || 30) * 86400000);
         await updateDoc(codeRef, { used: true, usedBy: user.uid, usedAt: new Date().toISOString() });
         await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), { isPremium: true, premiumActivatedAt: Date.now(), premiumExpiresAt: newExpiresAt });
         setDoctorInfo(p => ({...p, isPremium: true, premiumExpiresAt: newExpiresAt}));
         alert(`¡PRO activado por ${codeData.durationDays} días!`);
         setActiveTab('settings');
      } else alert("Código inválido o usado.");
    } catch (e) { alert("Error de servidor."); }
  };

  const handleGenerateAdminCode = async (type, durationDays) => {
    try {
      const newCode = (type === 'Mensual' ? 'MES-' : 'ANU-') + Math.random().toString(36).substring(2, 8).toUpperCase();
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'codes', newCode), { used: false, type, durationDays, createdAt: new Date().toISOString(), createdBy: user?.uid });
      alert(`Código generado: ${newCode}`);
    } catch (e) { alert("Error."); }
  };

  const handleUpgradeRequest = () => { openWhatsApp("529996180031", "Hola, me interesa adquirir la versión PRO."); setActiveTab('premium'); };
  const handleUpdateProfile = async (newData) => { setDoctorInfo(prev => ({ ...prev, ...newData })); await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), { ...doctorInfo, ...newData }, { merge: true }); };
  const handleAddPatient = (data) => { setModals(prev => ({ ...prev, patient: false })); addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'patients'), { ...data, createdAt: new Date().toISOString() }); };
  const handleAddHistory = (history) => { if (!selectedPatientId) return; const pat = patients.find(p => p.id === selectedPatientId); setModals(prev => ({ ...prev, history: false })); if(pat) updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', selectedPatientId), { histories: [history, ...(pat.histories || [])] }); };
  const handleAddAppointment = (appData) => { if (!selectedPatientId) return; setModals(prev => ({ ...prev, appointment: false })); addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), { ...appData, patientId: selectedPatientId, createdAt: new Date().toISOString() }); };
  const handleDeletePatient = (id) => { if (window.confirm("¿Eliminar expediente?")) { setSelectedPatientId(null); deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', id)); } };

  const handleOpenNewPatient = () => { if (!doctorInfo.isPremium && patients.length >= MAX_TRIAL_PATIENTS) setModals(m => ({ ...m, upsell: true })); else setModals(m => ({ ...m, patient: true })); };

  if (loading) return <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-cyan-400 font-black animate-pulse uppercase tracking-[1em] italic text-center"><Loader2 className="w-12 h-12 mb-4 animate-spin mx-auto"/>Iniciando Nube...</div>;
  if (!user) return <AuthScreen onGoogleLogin={handleGoogleLogin} onEmailAuth={handleEmailAuth} onStartTrial={handleTrialLogin} inProcess={authInProcess} error={authError} step={authStep} setStep={setAuthStep} />;
  if (trialTimeLeft.expired && !doctorInfo.isPremium && !doctorInfo.isAdmin) return <SubscriptionBlockedScreen onLogout={() => signOut(auth)} />;

  return (
    <div className={`h-screen flex flex-col italic overflow-hidden transition-colors duration-500 ${visualMode === 'claro' ? 'theme-light bg-slate-50 text-slate-900' : 'bg-[#020617] text-white'}`}>
      <SpineWatermark />
      <header className="p-6 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-400/30 overflow-hidden flex items-center justify-center">
            {doctorInfo.logo ? <img src={doctorInfo.logo} alt="Logo" className="w-7 h-7 object-cover" /> : <SpineLogo className="w-7 h-7 text-cyan-400" />}
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter">Quiro<span className="text-cyan-400">App</span></h1>
        </div>
        <div className={`px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[7px] font-black uppercase flex items-center gap-1 shadow-sm ${isOnline ? 'text-cyan-400' : 'text-rose-500'}`}>{isOnline ? 'Sync Activo' : 'Offline'}</div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 z-10 pb-36">
        {selectedPatientId ? (
          <PatientProfile patient={patients.find(p => p.id === selectedPatientId)} doctorInfo={doctorInfo} onBack={() => setSelectedPatientId(null)} onAddHistory={() => setModals(m => ({...m, history: true}))} onSchedule={() => setModals(m => ({...m, appointment: true}))} onDelete={() => handleDeletePatient(selectedPatientId)} />
        ) : (
          <>
            {activeTab === 'home' && <HomeTab appointments={appointments} patients={patients} doctorInfo={doctorInfo} onAddAppointment={() => setActiveTab('patients')} onOpenCalendar={() => setModals(m => ({...m, calendar: true}))} onUpgrade={handleUpgradeRequest} />}
            {activeTab === 'patients' && (
              <div className="animate-fade-in space-y-4"><h2 className="text-3xl font-black uppercase italic mb-6 underline decoration-cyan-500 decoration-4 underline-offset-8">Pacientes</h2>
                <div className="relative mb-6"><Search className="absolute left-4 top-4 text-indigo-500 w-5 h-5" /><input type="text" placeholder="Buscar expediente..." className="w-full bg-slate-900 p-4 pl-12 rounded-3xl border border-white/10 text-white font-bold outline-none focus:border-cyan-500 transition-all" /></div>
                {patients.length === 0 ? <div className="py-20 text-center opacity-30"><ClipboardList className="w-12 h-12 mx-auto mb-4" /><p className="text-xs font-black uppercase">Sin registros</p></div> : patients.map(p => (
                  <div key={p.id} onClick={() => setSelectedPatientId(p.id)} className="bg-slate-900/50 p-5 rounded-[30px] border border-white/5 flex items-center justify-between active:scale-95 transition cursor-pointer hover:bg-slate-900">
                    <div><p className="font-black text-white uppercase italic text-lg">{String(p.name)}</p><p className="text-[10px] text-indigo-400 font-bold uppercase">{String(p.phone)}</p></div><ChevronRight className="w-6 h-6 text-cyan-400" />
                  </div>
                ))}
                <button onClick={handleOpenNewPatient} className="fixed bottom-36 right-6 w-16 h-16 bg-cyan-400 text-black rounded-[25px] shadow-2xl flex items-center justify-center active:scale-90 transition z-20 border-b-4 border-cyan-700 shadow-cyan-900/50"><Plus className="w-8 h-8" /></button>
              </div>
            )}
            {activeTab === 'techniques' && (
              <div className="animate-fade-in space-y-6 text-left pb-10">
                <h2 className="text-3xl font-black uppercase italic mb-2 underline decoration-cyan-500 decoration-4 underline-offset-8">Guía de Ajustes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {techniquesData.map((tech, idx) => (
                    <div key={idx} className="bg-slate-900/80 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl transition hover:border-cyan-500/30 flex flex-col">
                      <div className="p-6 space-y-5 flex-1">
                        <h3 className="text-xl font-black uppercase text-cyan-400">{tech.title}</h3>
                        <div><p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1 flex items-center gap-1"><BookOpen className="w-3 h-3"/> Fundamento</p><p className="text-xs text-indigo-100/90 leading-relaxed">{tech.description}</p></div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 shadow-inner"><p className="text-[10px] font-black uppercase text-cyan-400 tracking-widest mb-2 flex items-center gap-1"><Target className="w-3 h-3"/> Ejecución</p><p className="text-xs text-white leading-relaxed whitespace-pre-line">{tech.execution}</p></div>
                        <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20 mt-auto"><p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Casa</p><p className="text-xs text-emerald-100/80 leading-relaxed">{tech.help}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'settings' && <ProfileTab user={user} doctorInfo={doctorInfo} patients={patients} onUpdateInfo={handleUpdateProfile} onLogout={() => signOut(auth)} onLinkGoogle={handleLinkGoogle} onLinkEmail={handleLinkEmail} onUpgrade={handleUpgradeRequest} onOpenAdminLogin={() => setModals(m => ({...m, adminLogin: true}))} visualMode={visualMode} setVisualMode={setVisualMode} />}
            {activeTab === 'premium' && <PremiumTab onActivateCode={handleActivateCode} />}
            {activeTab === 'admin' && doctorInfo.isAdmin && <AdminTab codes={adminCodes} onGenerateCode={handleGenerateAdminCode} />}
          </>
        )}
      </main>

      {!doctorInfo.isPremium && <div className="fixed bottom-28 w-full px-6 z-40 pointer-events-none"><div className="bg-indigo-600/90 backdrop-blur-md p-3 rounded-full flex items-center justify-center gap-3 border border-white/20 shadow-xl mx-auto max-w-[200px]"><Clock className="w-4 h-4 text-cyan-300 animate-pulse" /><span className="text-[9px] font-black uppercase tracking-widest text-white">Prueba: <span className="text-cyan-300">{trialTimeLeft.days}d restantes</span></span></div></div>}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[500px] bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[35px] py-3 px-2 flex justify-around items-center z-50 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
        <button onClick={() => {setActiveTab('home'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' && !selectedPatientId ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-400 opacity-60 hover:text-white'}`}><Home className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Inicio</span></button>
        <button onClick={() => {setActiveTab('patients'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'patients' || selectedPatientId ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-400 opacity-60 hover:text-white'}`}><Users className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Pacientes</span></button>
        <button onClick={() => {setActiveTab('techniques'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'techniques' ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-400 opacity-60 hover:text-white'}`}><BookOpen className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Técnicas</span></button>
        {doctorInfo.isAdmin && (<button onClick={() => {setActiveTab('admin'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'admin' ? 'text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-slate-400 opacity-60 hover:text-white'}`}><TerminalSquare className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Admin</span></button>)}
        <button onClick={() => {setActiveTab('settings'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${(activeTab === 'settings' || activeTab === 'premium') ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-400 opacity-60 hover:text-white'}`}><Settings className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Ajustes</span></button>
      </nav>

      {modals.patient && <NewPatientModal onClose={() => setModals(m => ({...m, patient: false}))} onSave={handleAddPatient} />}
      {modals.history && <NewHistoryModal onClose={() => setModals(m => ({...m, history: false}))} onSave={handleAddHistory} />}
      {modals.appointment && <NewAppointmentModal onClose={() => setModals(m => ({...m, appointment: false}))} onSave={handleAddAppointment} />}
      {modals.calendar && <CalendarModal appointments={appointments} patients={patients} onClose={() => setModals(m => ({...m, calendar: false}))} />}
      {modals.upsell && <UpsellModal onClose={() => setModals(m => ({...m, upsell: false}))} onUpgrade={() => { setModals(m => ({...m, upsell: false})); handleUpgradeRequest(); }} />}
      {modals.adminLogin && <AdminLoginModal onClose={() => setModals(m => ({...m, adminLogin: false}))} onSuccess={() => { handleUpdateProfile({ isAdmin: true, isPremium: true }); setModals(m => ({...m, adminLogin: false})); alert("¡ADMIN ACTIVADO!"); setActiveTab('admin'); }} />}
      
      <style dangerouslySetInnerHTML={{__html: `@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-slide-up { animation: slideUp 0.4s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}
