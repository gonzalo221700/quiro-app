import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  linkWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  Home, 
  Calendar as CalendarIcon, 
  Users, 
  Plus, 
  X, 
  ChevronRight,
  Search,
  Sparkles, 
  Loader2,
  Settings,
  MessageSquare,
  LogOut,
  Globe,
  ClipboardList,
  BookOpen, 
  Target,
  Cloud,
  Trash2,
  Lock,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Mail,
  CheckCircle2,
  Ruler,
  Weight,
  UserCircle,
  Building,
  User,
  CreditCard,
  Clock,
  PlayCircle,
  WifiOff,
  HeartPulse,
  CalendarPlus,
  AlertTriangle,
  KeyRound,
  Copy,
  TerminalSquare,
  Upload,
  ImagePlus,
  Image as ImageIcon,
  Download,
  AlertOctagon,
  FileText,
  Stethoscope
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
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

// --- UTILIDADES ---
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

// --- DICCIONARIO CLÍNICO GIGANTE: 14 TÉCNICAS QUIROPRÁCTICAS MUNDIALES ---
const techniquesData = [
  {
    title: "Ajuste Cervical (Diversified)",
    image: "",
    description: "Técnica manual de alta velocidad y baja amplitud (HVLA) para corregir rotaciones y restricciones en la columna cervical (C1-C7).",
    execution: "1. Posiciona al paciente en decúbito supino.\n2. Contacta el pilar articular o la lámina con la falange lateral del dedo índice.\n3. Lleva la articulación a la tensión máxima (lock-out) con leve flexión lateral y rotación.\n4. Aplica el impulso (thrust) HVLA en un vector rápido y superficial (P-A, I-S).",
    help: "Aplicar frío por 15 min si hay inflamación post-ajuste. Indicar ejercicios de retracción cervical y corregir la postura de 'Text Neck'."
  },
  {
    title: "Ajuste Torácico Anterior (Abrazado)",
    image: "",
    description: "Ideal para la zona dorsal (T1-T12). Se realiza con el paciente boca arriba, utilizando el peso del cuerpo como palanca.",
    execution: "1. Paciente en decúbito supino con los brazos cruzados sobre el pecho.\n2. El quiropráctico hace un contacto con la mano en forma de 'puño suave' o 'garra' debajo de la vértebra dorsal a ajustar.\n3. Usando el esternón sobre los brazos del paciente, se inhala y se baja el peso corporal.\n4. El impulso (thrust) es de Anterior a Posterior (A-P) directamente a través de los brazos cruzados.",
    help: "Sugerir ejercicios de expansión torácica y estiramiento de pectorales en el marco de una puerta para abrir el pecho."
  },
  {
    title: "Ajuste Lumbar (Side Posture)",
    image: "",
    description: "Técnica en postura lateral (pull/push) fundamental para corregir restricciones rotacionales y subluxaciones en la zona lumbar (L1-L5).",
    execution: "1. Posiciona al paciente en decúbito lateral con la pierna superior flexionada.\n2. Estabiliza el hombro superior del paciente con el antebrazo cefálico.\n3. Contacta el proceso mamilar o espinoso lumbar con el pisiforme de la mano caudal.\n4. Genera tensión (body drop) rotando la pelvis hacia ti y aplica el impulso rotacional.",
    help: "Recomendar al paciente evitar levantar objetos pesados doblando la espalda. Enseñar técnica de sentadilla profunda."
  },
  {
    title: "Técnica Gonstead",
    image: "",
    description: "Enfoque biomecánico ultra específico. Utiliza análisis de radiografías, nervoscopio e instrumentación para ajustes precisos sobre la vértebra aislada.",
    execution: "1. Uso riguroso de radiografía completa y palpación estática/dinámica.\n2. Para la zona pélvica, posicionar en mesa Knee-Chest o banco cervical para el cuello.\n3. Estabilizar rigurosamente la vértebra inferior al segmento a ajustar.\n4. El empuje se realiza en un vector extremadamente específico sin rotación excesiva.",
    help: "Explicar al paciente la importancia de caminar 10 minutos inmediatamente después del ajuste para asimilar el cambio neuro-estructural."
  },
  {
    title: "Ajuste Pélvico (Drop Thompson)",
    image: "",
    description: "Sistema basado en la ley de inercia de Newton. Usa piezas segmentadas de la camilla que caen (Drop) para realizar un ajuste seguro de baja fuerza.",
    execution: "1. Paciente en decúbito prono. Evalúa dismetría pélvica (Test de Derifield o largo de piernas).\n2. Ajusta la tensión de la pieza de caída (Drop) pélvica al peso exacto del paciente.\n3. Coloca el contacto doble con eminencias tenares sobre la EIPS (Espina Ilíaca Postero-Superior).\n4. Aplica el impulso P-A, I-S rápido. La pieza caerá absorbiendo la fuerza pesada.",
    help: "Sugerir al paciente no cruzar las piernas al sentarse para mantener la simetría pélvica. Recomendar usar cojín lumbar al manejar."
  },
  {
    title: "S.O.T. (Sacro Occipital Technique)",
    image: "",
    description: "Técnica suave que utiliza cuñas (bloques) posicionados debajo de la pelvis del paciente, usando su propio peso y la respiración para alinear.",
    execution: "1. Clasificar al paciente en Categoría I, II o III de SOT mediante indicadores y palpación fascial.\n2. Colocar las cuñas bajo trocánteres e ilíacos según la categoría detectada.\n3. Dejar al paciente reposar sobre los bloques durante 10-15 minutos.\n4. Sincronizar manipulaciones craneales suaves con las fases respiratorias (Inhalación/Exhalación).",
    help: "Ideal para dolores agudos y mujeres embarazadas. Sugerir reposo post-terapia y evitar ejercicio de alto impacto por 24 horas."
  },
  {
    title: "Tracción - Flexión (Mesa Cox)",
    image: "",
    description: "Técnica de descompresión espinal guiada. Abre el espacio del canal neural, reduce la presión discal y ayuda al tratamiento de la ciática.",
    execution: "1. Paciente en posición prona, asegurar las cintas o sujeciones en los tobillos.\n2. Desbloquear el eje de flexión de la sección inferior de la mesa.\n3. Contactar con la eminencia tenar el proceso espinoso de la vértebra inmediatamente superior a la hernia o lesión.\n4. Aplicar presión sostenida mientras se flexiona la mesa en ciclos de 20 segundos.",
    help: "Vital indicar al paciente evitar las flexiones de tronco. Enseñar a recoger objetos utilizando flexión de rodillas y mantener core activo."
  },
  {
    title: "Técnica de Activador",
    image: "",
    description: "Ajuste asistido por un instrumento de impacto mecánico (Activator Adjusting Instrument) con alta velocidad y muy baja fuerza. No genera cavitación (ruido).",
    execution: "1. Realizar el protocolo de aislamiento básico (aislamiento por zonas pidiendo al paciente mover brazos/piernas y midiendo el largo de las piernas).\n2. Seleccionar la línea de corrección adecuada según el manual.\n3. Posicionar el instrumento directamente sobre el proceso transverso o carilla articular.\n4. Aplicar el impacto mecánico seco.",
    help: "Ideal para pacientes con osteoporosis, miedo a la cavitación o pediátricos. Explicar al paciente que la rapidez del impacto engaña el reflejo muscular."
  },
  {
    title: "Toggle Recoil (Upper Cervical)",
    image: "",
    description: "Técnica de la escuela 'Hole in One' para ajustar la zona cervical superior (Atlas y Axis). Caracterizada por un impulso y retirada hiperrápida.",
    execution: "1. Paciente en decúbito lateral sobre cabezal de Drop cervical o mesa específica.\n2. Contactar el proceso transverso del Atlas con la eminencia pisiforme.\n3. Mantener los codos ligeramente flexionados y el pecho arriba.\n4. Efectuar un thrust de triceps altísima velocidad e inmediatamente retirar las manos (Recoil) dejando caer el Drop.",
    help: "Después del ajuste cervical superior, es importante que el paciente descanse 10-15 min en sala de recuperación para equilibrar el sistema nervioso autónomo."
  },
  {
    title: "Técnica Webster (Embarazadas)",
    image: "",
    description: "Análisis y ajuste sacropélvico específico para embarazadas, diseñado para reducir interferencias neurológicas y equilibrar el útero.",
    execution: "1. Evaluar restricción de la flexión de la rodilla en posición prona (con almohadas de soporte para embarazo).\n2. Ajustar el sacro en el lado de mayor restricción usando Drop o el pulgar.\n3. Paciente en supino: Identificar tensión en el ligamento redondo del útero.\n4. Aplicar presión ultra suave y sostenida (sin masajear) sobre el ligamento tenso hasta sentir la liberación.",
    help: "Indicar que esta técnica ayuda a optimizar el espacio para el bebé (evitar presentación de nalgas). Usar cojín para dormir de lado con apoyo entre rodillas."
  },
  {
    title: "Técnica Logan Basic",
    image: "",
    description: "Un enfoque muy ligero y suave que utiliza contactos de presión continua en el ligamento sacrotuberoso para nivelar la columna completa.",
    execution: "1. Localizar tensión y sensibilidad asimétrica cerca de la tuberosidad isquiática.\n2. Aplicar un contacto con el pulgar bajo la tuberosidad isquiática (ligamento sacrotuberoso).\n3. Mantener una presión en dirección Anterior, Superior y Lateral por 10 a 15 minutos continuos.\n4. Masajear simultáneamente la musculatura paravertebral a lo largo de toda la columna.",
    help: "Técnica sumamente relajante que activa el sistema parasimpático. Recomendar al paciente tomar mucha agua y descansar."
  },
  {
    title: "Ajuste de Extremidades",
    image: "",
    description: "Manipulación de las articulaciones fuera de la columna vertebral, como muñecas (túnel carpiano), hombros, codos, rodillas y tobillos.",
    execution: "1. Evaluar la restricción del rango de movimiento y juego articular (joint play).\n2. Hombro (A-P): Paciente supino, tracción suave del húmero y thrust sobre la cabeza humeral hacia posterior.\n3. Rodilla/Tobillo: Típicamente ajustes en tracción del eje largo de la pierna o ajuste en mortaja tibioastragalina.\n4. Verificar la recuperación del movimiento.",
    help: "Usar ejercicios con bandas de resistencia elástica para rehabilitar las articulaciones después de devolverles su biomecánica normal."
  },
  {
    title: "Liberación Miofascial / IASTM",
    image: "",
    description: "Movilización de tejidos blandos asistida por herramientas de acero inoxidable (Graston) o terapia manual intensa para romper adherencias fasciales.",
    execution: "1. Aplicar crema o emoliente sobre la zona afectada (ej. fascia plantar, isquiotibiales, trapecios).\n2. Utilizar el instrumento IASTM o los pulgares con ángulo de 30-45 grados.\n3. Deslizar con presión profunda creando fricción hasta generar petequias ligeras (enrojecimiento terapéutico).\n4. Acompañar de movilización pasiva del paciente.",
    help: "Indicar al paciente que el enrojecimiento es normal. Realizar estiramientos activos del músculo trabajado para reconstruir las fibras colágenas."
  },
  {
    title: "Vendaje Neuromuscular (Kinesiotaping)",
    image: "",
    description: "Aplicación de cintas elásticas transpirables sobre la piel post-ajuste. Alivia el dolor, drena la inflamación y proporciona soporte propioceptivo.",
    execution: "1. Limpiar y secar bien la piel del área tratada. Recortar los bordes de la cinta en forma redondeada.\n2. Anclar la base de la cinta (sin tensión) en posición neutral.\n3. Llevar el músculo o articulación a tensión (estirado) y aplicar el resto de la cinta con la tensión deseada (0-50% según sea para relajar o tonificar).\n4. Friccionar la cinta para activar el adhesivo con el calor.",
    help: "Informar que la cinta puede durar de 3 a 5 días y se puede mojar en la ducha. Retirar tirando la piel hacia atrás, no jalando la cinta."
  }
];

// --- COMPONENTES VISUALES ---
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
    <div className="bg-slate-950 w-full sm:w-[600px] rounded-t-[40px] sm:rounded-[50px] max-h-[95vh] overflow-y-auto shadow-2xl p-6 border-t-4 border-cyan-500 text-white animate-slide-up">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-950/90 py-2 z-10">
        <h3 className="text-xl font-black italic uppercase text-cyan-400">{String(title)}</h3>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white active:scale-90 transition"><X className="w-5 h-5" /></button>
      </div>
      {children}
    </div>
  </div>
);

// --- PANTALLA PREMIUM DE PAGO Y CANJE ---
const PremiumTab = ({ onActivateCode }) => {
  const [code, setCode] = useState('');
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    if (!code) return;
    setActivating(true);
    await onActivateCode(code);
    setActivating(false);
  };

  return (
    <div className="animate-fade-in space-y-6 text-center py-6 px-2">
      <div className="bg-gradient-to-tr from-amber-400 to-orange-600 p-6 rounded-[35px] inline-block mb-2 shadow-[0_0_40px_rgba(251,191,36,0.3)]">
        <CreditCard className="w-12 h-12 text-black" />
      </div>
      <h2 className="text-3xl font-black uppercase italic text-white mb-2">Desbloquea <span className="text-amber-400">PRO</span></h2>
      <p className="text-indigo-200 text-sm leading-relaxed mb-8">
        Adquiere la licencia para vincular tu cuenta con Google o correo, obtener pacientes ilimitados y utilizar la sincronización en PC.
      </p>

      <button 
        onClick={() => openWhatsApp("529996180031", "Hola, me interesa adquirir la versión PRO de QuiroApp para desbloquear la sincronización multidispositivo.")}
        className="w-full bg-amber-400 text-black font-black uppercase italic py-5 rounded-[25px] flex items-center justify-center gap-3 border-b-8 border-amber-600 active:scale-95 transition shadow-2xl mb-8"
      >
        <MessageSquare className="w-6 h-6" /> Contactar por WhatsApp
      </button>

      <div className="bg-slate-900/80 p-8 rounded-[40px] border border-cyan-400/20 text-left space-y-5 shadow-xl relative overflow-hidden">
        <h4 className="text-cyan-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><KeyRound className="w-4 h-4"/> Ya tengo un código</h4>
        <input 
          type="text" 
          placeholder="Ej: PRO-X7Y8Z9" 
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full bg-slate-950 p-5 rounded-3xl border border-white/10 text-white font-bold outline-none focus:border-cyan-400 tracking-[0.2em] uppercase text-center"
        />
        <button 
          onClick={handleActivate}
          disabled={activating || !code}
          className="w-full bg-cyan-400 text-black py-4 rounded-3xl font-black uppercase italic border-b-4 border-cyan-700 active:scale-95 transition flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {activating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activar Código'}
        </button>
      </div>
    </div>
  );
};

// --- PANTALLA SECRETA DE ADMINISTRADOR ---
const AdminTab = ({ codes, onGenerateCode }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGen = async (type, days) => {
    setIsGenerating(true);
    await onGenerateCode(type, days);
    setIsGenerating(false);
  };

  return (
    <div className="animate-fade-in space-y-6 text-left py-6 px-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/30"><TerminalSquare className="w-8 h-8 text-rose-500" /></div>
        <div>
          <h2 className="text-2xl font-black uppercase italic text-white leading-none">Panel <span className="text-rose-500">Admin</span></h2>
          <p className="text-[10px] text-rose-200/50 uppercase tracking-widest">Suscripciones e Historial</p>
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <button onClick={() => handleGen('Mensual', 30)} disabled={isGenerating} className="flex-1 bg-indigo-500 text-white py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition border-b-4 border-indigo-700 flex flex-col items-center gap-1 disabled:opacity-50">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Mensual
        </button>
        <button onClick={() => handleGen('Anual', 365)} disabled={isGenerating} className="flex-1 bg-rose-500 text-white py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.3)] active:scale-95 transition border-b-4 border-rose-800 flex flex-col items-center gap-1 disabled:opacity-50">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Anual
        </button>
      </div>

      <h3 className="text-sm font-black uppercase text-indigo-400 mb-4 tracking-widest">Historial de Códigos ({codes.length})</h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
        {codes.length === 0 ? (
          <p className="text-center opacity-40 py-10 text-xs uppercase tracking-widest">Sin códigos generados</p>
        ) : (
          codes.sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).map(c => (
            <div key={c.id} className={`bg-slate-900 p-5 rounded-3xl border flex items-center justify-between shadow-lg ${c.used ? 'border-rose-500/30 opacity-50' : 'border-emerald-500/50'}`}>
              <div>
                <p className="font-mono text-xl font-black tracking-widest text-white">{String(c.id)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-[9px] font-black uppercase tracking-widest ${c.used ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {c.used ? 'Utilizado' : `Disponible - ${c.type || 'PRO'}`}
                  </p>
                  <span className="text-[8px] text-slate-500 uppercase px-2 py-0.5 bg-white/5 rounded-md">{safeFormatDate(c.createdAt)}</span>
                </div>
              </div>
              {!c.used && (
                <button 
                  onClick={() => { navigator.clipboard.writeText(c.id); alert("Código copiado al portapapeles"); }}
                  className="p-3 bg-white/5 rounded-xl text-white hover:bg-white/10 transition"
                >
                  <Copy className="w-5 h-5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- COMPONENTES DE PANTALLA PRINCIPAL ---

const HomeTab = ({ appointments, patients, doctorInfo, onAddAppointment, onOpenCalendar, onUpgrade }) => {
  const today = new Date().toISOString().split('T')[0];
  const todays = appointments.filter(a => String(a.date) === today).sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));

  const bannerStyle = doctorInfo.bannerImage
    ? { backgroundImage: `url(${doctorInfo.bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div 
        className={`p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-500 ${!doctorInfo.bannerImage ? 'bg-gradient-to-br from-indigo-700 to-black' : ''}`}
        style={bannerStyle}
      >
        {doctorInfo.bannerImage && <div className="absolute inset-0 bg-black/60" />}
        <div className="relative z-10">
          <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-2 italic drop-shadow-md">
            {String(doctorInfo.clinic || (doctorInfo.isPremium ? "QuiroClínica Pro" : "QuiroClínica (Prueba)"))}
          </p>
          <h2 className="text-4xl font-black italic text-white leading-none tracking-tighter drop-shadow-lg">
            Dr. {String(doctorInfo.name || "Especialista")}
          </h2>
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-10 z-0">
          {doctorInfo.logo ? (
            <img src={doctorInfo.logo} alt="Logo" className="w-48 h-48 object-contain grayscale" />
          ) : (
            <SpineLogo className="w-48 h-48" />
          )}
        </div>
      </div>

      {!doctorInfo.isPremium && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/30 p-5 rounded-[30px] flex items-center justify-between shadow-lg">
          <div>
            <h4 className="text-amber-400 font-black uppercase text-sm flex items-center gap-1"><Sparkles className="w-4 h-4"/> Prueba Activa</h4>
            <p className="text-[9px] text-amber-200/70 mt-1 uppercase tracking-widest">Activa PRO para Sincronizar</p>
          </div>
          <button onClick={onUpgrade} className="bg-amber-500 text-black px-4 py-3 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition shadow-lg border-b-4 border-amber-700">
            Obtener PRO
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-6 rounded-[30px] border border-white/5 shadow-inner relative overflow-hidden">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Pacientes</p>
          <p className="text-3xl font-black text-white flex items-end gap-1">
            {String(patients.length)} 
            {!doctorInfo.isPremium && <span className="text-[10px] text-amber-500 mb-1 opacity-60">/ {MAX_TRIAL_PATIENTS} Max</span>}
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[30px] border border-white/5 shadow-inner">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Citas Hoy</p>
          <p className="text-3xl font-black text-white">{String(todays.length)}</p>
        </div>
      </div>

      <div className="bg-indigo-950/20 p-6 rounded-[40px] border border-indigo-500/20 shadow-xl">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-xl font-black uppercase italic text-white">Agenda del Día</h3>
          <div className="flex gap-3">
             <button onClick={onOpenCalendar} className="p-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl active:scale-90 transition shadow-lg">
               <CalendarIcon className="w-5 h-5" />
             </button>
             <button onClick={onAddAppointment} className="p-3 bg-cyan-400 text-black rounded-2xl active:scale-90 transition shadow-lg">
               <Plus className="w-5 h-5" />
             </button>
          </div>
        </div>
        {todays.length === 0 ? (
          <div className="py-12 text-center opacity-40">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-indigo-400" />
            <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.2em]">Sin citas programadas</p>
          </div>
        ) : (
          todays.map(app => (
            <div key={app.id} className="bg-slate-900/50 p-4 rounded-3xl border border-white/5 mb-3 flex items-center justify-between">
              <div>
                <p className="text-white font-black uppercase italic">{String(patients.find(p => p.id === app.patientId)?.name || 'Paciente no encontrado')}</p>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {String(app.time)}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo-800" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- PERFIL DEL PACIENTE Y EXPEDIENTE COMPLETO ---

const PatientProfile = ({ patient, doctorInfo, onBack, onAddHistory, onDelete, onSchedule }) => {
  const [sum, setSum] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const [activeSection, setActiveSection] = useState('historial'); 
  
  const generateLocalAssistant = () => {
    if (!patient.histories || patient.histories.length === 0) {
      setSum("Para recibir sugerencias, necesitas registrar al menos una sesión de ajuste con las áreas tratadas.");
      return;
    }

    setLoadingIA(true);

    setTimeout(() => {
      const allAreas = patient.histories.flatMap(h => h.areas || []);
      const uniqueAreas = [...new Set(allAreas)];
      
      const totalPain = patient.histories.reduce((acc, h) => acc + (Number(h.painLevel) || 0), 0);
      const avgPain = (totalPain / patient.histories.length).toFixed(1);

      let recommendation = `📊 Análisis de ${patient.histories.length} sesiones (Nivel de dolor histórico promedio: ${avgPain}/10).\n\n💡 Guía y Sugerencias Quiróprácticas según las áreas tratadas recientemente:\n\n`;

      if (uniqueAreas.length === 0) {
        recommendation += "- No has marcado áreas específicas en los ajustes de este paciente. Edita el historial para obtener recomendaciones puntuales.";
      }

      if (uniqueAreas.includes('Cervical')) {
        recommendation += "• CERVICAL: Se sugiere evaluación de Atlas/Axis. Considerar ajuste Diversified (C1-C7) o técnica de Activador. Fundamental recomendar higiene postural y evitar posturas de 'Text Neck' al paciente.\n\n";
      }
      if (uniqueAreas.includes('Dorsal')) {
        recommendation += "• DORSAL: Revisar movilidad costo-vertebral. Suele ser muy útil la técnica Thompson o un ajuste anterior de torácicas. Recomendar estiramientos de apertura de pecho en casa.\n\n";
      }
      if (uniqueAreas.includes('Lumbar')) {
        recommendation += "• LUMBAR: Descartar compresión radicular (ciática). Sugerido ajuste Gonstead o técnica de Flexión-Distracción (Cox). Indicar ejercicios de estabilización y fortalecimiento de core.\n\n";
      }
      if (uniqueAreas.includes('Sacro')) {
        recommendation += "• SACRO/PELVIS: Evaluar bloqueo sacroilíaco (ej. Test de Gillet). Excelente respuesta clínica esperada con uso de Bloques SOT o técnica de Thompson Drop.\n\n";
      }
      if (uniqueAreas.some(a => ['Hombros', 'Caderas', 'Rodillas'].includes(a))) {
        recommendation += "• EXTREMIDADES (Hombros/Rodillas/Cadera): Checar la cadena cinética completa. Se recomienda complementar el ajuste con técnica de liberación miofascial, Graston o Kinesiotaping.\n\n";
      }

      setSum(recommendation);
      setLoading
