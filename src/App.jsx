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
  Megaphone,
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
  FileText
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
const apiKey = "AIzaSyCDnfzYRCQSpNYOgb88dqzaboi3nC7IBH4"; // Tu llave API integrada

const TRIAL_DAYS = 3;
const MAX_TRIAL_PATIENTS = 3; 

// --- UTILIDADES ---
const fetchGeminiWithRetry = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  let retries = 5;
  let delay = 1000;
  
  while (retries > 0) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!response.ok) throw new Error('Error HTTP');
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar el resumen.';
    } catch (error) {
      retries -= 1;
      if (retries === 0) return "Error de conexión con la IA. Asegúrate de haber colocado tu 'apiKey' en el código de la aplicación.";
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
};

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
  
  const generateAI = async () => {
    if (!patient.histories || patient.histories.length === 0) {
      setSum("Para usar la IA, necesitas registrar al menos una sesión o ajuste en el historial del paciente.");
      return;
    }
    setLoadingIA(true);
    const text = patient.histories.map(h => `${h.date}: Dolor ${h.painLevel}/10. ${h.notes}`).join(' | ');
    const res = await fetchGeminiWithRetry(`Actúa como un quiropráctico profesional y analítico. Escribe un resumen de evolución clínica fluido y conciso (máximo 3 líneas) basado estrictamente en las siguientes notas y niveles de dolor de los ajustes realizados al paciente: ${text}`);
    setSum(res);
    setLoadingIA(false);
  };
  
  const bmi = (patient.weight && patient.height) ? (parseFloat(patient.weight) / ((parseFloat(patient.height)/100)**2)).toFixed(1) : '--';
  const clinicName = doctorInfo?.clinic || "nuestra clínica";

  const handleWhatsApp = () => {
    const msg = `Hola ${patient.name}, te escribimos de ${clinicName}. Nos comunicamos para dar seguimiento a tu tratamiento quiropráctico.`;
    openWhatsApp(patient.phone, msg);
  };

  return (
    <div className="animate-fade-in text-left pb-10">
      <div className="flex items-center gap-4 mb-4 sticky top-0 bg-slate-950/80 backdrop-blur-md py-4 z-20">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl active:scale-90 transition"><ChevronRight className="rotate-180" /></button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black uppercase italic truncate text-white">{String(patient.name)}</h2>
          <p className="text-[9px] font-black uppercase text-cyan-400 tracking-widest">{String(patient.phone || 'Sin Teléfono')}</p>
        </div>
        <button onClick={onDelete} className="p-3 text-rose-500 bg-rose-500/10 rounded-2xl active:scale-90 transition"><Trash2 className="w-5 h-5" /></button>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={handleWhatsApp} className="flex-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 transition shadow-lg"><MessageSquare className="w-4 h-4" /> Contactar</button>
        <button onClick={onSchedule} className="flex-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 transition shadow-lg"><CalendarPlus className="w-4 h-4" /> Agendar Cita</button>
      </div>

      {/* NAVEGACIÓN DE SECCIONES DEL EXPEDIENTE */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-2 scrollbar-hide">
        {['identidad', 'historial', 'evaluacion', 'anatomia', 'tratamiento', 'sesiones'].map(sec => (
          <button 
            key={sec} 
            onClick={() => setActiveSection(sec)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeSection === sec ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* SECCIÓN 1: IDENTIDAD */}
      {activeSection === 'identidad' && (
        <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-4"><User className="w-4 h-4 text-cyan-400" /><h4 className="text-[10px] font-black text-white uppercase tracking-widest">Información Personal</h4></div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-[8px] text-indigo-400 uppercase font-black">Sexo</p><p className="text-sm font-bold text-white">{patient.gender || '--'}</p></div>
            <div><p className="text-[8px] text-indigo-400 uppercase font-black">Edad / Fecha Nac.</p><p className="text-sm font-bold text-white">{patient.age ? `${patient.age} años` : '--'} <br/><span className="text-xs text-slate-400">{patient.birthDate}</span></p></div>
            <div><p className="text-[8px] text-indigo-400 uppercase font-black">Ocupación</p><p className="text-sm font-bold text-white">{patient.occupation || '--'}</p></div>
            <div><p className="text-[8px] text-indigo-400 uppercase font-black">Estado Civil</p><p className="text-sm font-bold text-white">{patient.maritalStatus || '--'}</p></div>
            <div className="col-span-2"><p className="text-[8px] text-indigo-400 uppercase font-black">Lugar de Nacimiento</p><p className="text-sm font-bold text-white">{patient.birthPlace || '--'}</p></div>
            <div className="col-span-2"><p className="text-[8px] text-indigo-400 uppercase font-black">Dirección y Localidad</p><p className="text-sm font-bold text-white">{patient.address || '--'}</p><p className="text-xs text-slate-400">{patient.location}</p></div>
          </div>
        </div>
      )}

      {/* SECCIÓN 2: HISTORIAL CLÍNICO */}
      {activeSection === 'historial' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
            <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-cyan-400" /><h4 className="text-[10px] font-black text-white uppercase tracking-widest">Motivo de Consulta</h4></div>
            <p className="text-sm italic text-indigo-100 bg-slate-950 p-4 rounded-2xl border border-white/5">{patient.consultationReason || "No registrado"}</p>
            
            <div className="flex items-center gap-2 mb-2 mt-6"><Activity className="w-4 h-4 text-rose-400" /><h4 className="text-[10px] font-black text-white uppercase tracking-widest">Enfermedad Actual</h4></div>
            <p className="text-sm italic text-indigo-100 bg-slate-950 p-4 rounded-2xl border border-white/5">{patient.currentIllness || "No registrado"}</p>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
             <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Antecedentes Médicos Relevantes</h5><p className="text-sm text-indigo-100">{patient.relevantMedicalHistory || "--"}</p></div>
             <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Antecedentes Patológicos (Cirugías, Alergias)</h5><p className="text-sm text-indigo-100">{patient.pathological || "--"}</p></div>
             <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Antecedentes No Patológicos / Hábitos</h5><p className="text-sm text-indigo-100">{patient.nonPathological || "--"}</p></div>
             <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Medicamentos Actuales</h5><p className="text-sm text-indigo-100">{patient.medications || "--"}</p></div>
             <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Exámenes Complementarios (RX, RM)</h5><p className="text-sm text-indigo-100">{patient.complementaryExams || "--"}</p></div>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: EVALUACIÓN Y DIAGNÓSTICO */}
      {activeSection === 'evaluacion' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="bg-slate-900 p-3 rounded-2xl border border-white/5 text-center"><p className="text-[8px] font-black text-indigo-400 uppercase">Sangre</p><p className="text-xs font-bold text-white">{patient.bloodType || '-'}</p></div>
            <div className="bg-slate-900 p-3 rounded-2xl border border-white/5 text-center"><p className="text-[8px] font-black text-indigo-400 uppercase">Presión</p><p className="text-xs font-bold text-white">{patient.pressure || '-'}</p></div>
            <div className="bg-slate-900 p-3 rounded-2xl border border-white/5 text-center"><p className="text-[8px] font-black text-indigo-400 uppercase">Peso</p><p className="text-xs font-bold text-white">{patient.weight || '-'}kg</p></div>
            <div className="bg-indigo-900/40 p-3 rounded-2xl border border-cyan-400/20 text-center"><p className="text-[8px] font-black text-cyan-400 uppercase">IMC</p><p className="text-xs font-bold text-cyan-400">{bmi}</p></div>
          </div>

          <div className="bg-rose-950/20 p-6 rounded-[40px] border border-rose-500/20 space-y-4">
            <div className="flex items-center gap-2 mb-2"><AlertOctagon className="w-4 h-4 text-rose-500" /><h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Alertas y Precauciones</h4></div>
            {patient.redFlags && patient.redFlags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.redFlags.map(flag => <span key={flag} className="px-3 py-1 bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase rounded-lg border border-rose-500/30">{flag}</span>)}
              </div>
            ) : <p className="text-xs text-rose-200/50 italic">Sin alertas rojas registradas.</p>}
          </div>

          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
            <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Diagnóstico Quiropráctico</h5><p className="text-sm font-bold text-cyan-300">{patient.chiropracticDiagnosis || "--"}</p></div>
            <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Diagnóstico General</h5><p className="text-sm text-indigo-100">{patient.generalDiagnosis || "--"}</p></div>
            <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Subluxaciones Detectadas</h5><p className="text-sm text-indigo-100">{patient.subluxations || "--"}</p></div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5">
            <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Variables de Estilo de Vida</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-[8px] text-indigo-400 uppercase font-black">Sueño</p><p className="text-sm font-bold text-white">{patient.sleepQuality || '--'}</p></div>
              <div><p className="text-[8px] text-indigo-400 uppercase font-black">Cuidados Personales</p><p className="text-sm font-bold text-white">{patient.personalCare || '--'}</p></div>
              <div><p className="text-[8px] text-indigo-400 uppercase font-black">Desplazamientos</p><p className="text-sm font-bold text-white">{patient.mobility || '--'}</p></div>
              <div><p className="text-[8px] text-indigo-400 uppercase font-black">Recreación</p><p className="text-sm font-bold text-white">{patient.recreation || '--'}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 6: PLANO ANATÓMICO Y POSTURA */}
      {activeSection === 'anatomia' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
            <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-cyan-400" /><h4 className="text-[10px] font-black text-white uppercase tracking-widest">Alteraciones Posturales</h4></div>
            {patient.posturalDeviations && patient.posturalDeviations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.posturalDeviations.map(dev => <span key={dev} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 text-[10px] font-black uppercase rounded-lg border border-indigo-500/30">{dev}</span>)}
              </div>
            ) : <p className="text-xs text-slate-500 italic">No se marcaron alteraciones posturales.</p>}
          </div>

          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
            <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Análisis por Planos Anatómicos</h4>
            <div className="space-y-4">
               <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Vista Anterior (Frente)</h5><p className="text-sm text-indigo-100 bg-slate-950 p-4 rounded-2xl border border-white/5">{patient.postureAnterior || "--"}</p></div>
               <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Vista Posterior (Espalda)</h5><p className="text-sm text-indigo-100 bg-slate-950 p-4 rounded-2xl border border-white/5">{patient.posturePosterior || "--"}</p></div>
               <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Vista Lateral (Perfil)</h5><p className="text-sm text-indigo-100 bg-slate-950 p-4 rounded-2xl border border-white/5">{patient.postureLateral || "--"}</p></div>
            </div>
          </div>

          {(patient.anatomicalPlaneNotes) && (
            <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
              <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Notas Adicionales de Anatomía</h5><p className="text-sm text-indigo-100">{patient.anatomicalPlaneNotes}</p></div>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 7: TRATAMIENTO Y PLAN */}
      {activeSection === 'tratamiento' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
            <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Objetivos del Tratamiento</h5><p className="text-sm font-bold text-white bg-slate-950 p-4 rounded-2xl">{patient.treatmentGoals || "--"}</p></div>
            <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Plan de Tratamiento</h5><p className="text-sm text-indigo-100">{patient.treatmentPlan || "--"}</p></div>
            <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Observaciones Especiales</h5><p className="text-sm text-indigo-100">{patient.observations || "--"}</p></div>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
            <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">Técnicas a Utilizar</h4>
            {patient.chiropracticTechniques && patient.chiropracticTechniques.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.chiropracticTechniques.map(tech => <span key={tech} className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase rounded-lg border border-cyan-500/20">{tech}</span>)}
              </div>
            ) : <p className="text-xs text-slate-500 italic">No se especificaron técnicas.</p>}

            <div className="mt-4"><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Recomendaciones Adicionales (Casa)</h5><p className="text-sm text-indigo-100">{patient.additionalRecommendations || "--"}</p></div>
          </div>
        </div>
      )}

      {/* SECCIÓN 8: SESIONES E IA */}
      {activeSection === 'sesiones' && (
        <div className="animate-fade-in">
          <div className="bg-indigo-900/20 p-6 rounded-[40px] border border-cyan-400/20 mb-6 shadow-inner">
            <div className="flex justify-between items-center mb-4 text-left">
              <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> Bio-Log Inteligencia Artificial</h3>
              {!sum && <button onClick={generateAI} disabled={loadingIA} className="text-[8px] font-black uppercase bg-cyan-400 text-black px-4 py-1.5 rounded-full shadow-lg active:scale-95 transition">{loadingIA ? "..." : "Generar Evolución"}</button>}
            </div>
            <p className="text-xs italic text-indigo-200 leading-relaxed">{String(sum || "Analiza los ajustes clínicos para resumir el progreso del paciente de forma inteligente.")}</p>
          </div>

          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-500" /> Ajustes Realizados</h3>
            <button onClick={onAddHistory} className="bg-white text-black p-3 rounded-2xl active:scale-90 transition shadow-2xl"><Plus className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4">
            {(!patient.histories || patient.histories.length === 0) ? (
              <div className="py-12 text-center opacity-20 border-2 border-dashed border-white/10 rounded-[40px]"><p className="text-xs font-black uppercase">Sin ajustes registrados</p></div>
            ) : patient.histories.map((h, i) => (
              <div key={i} className="bg-slate-900/50 p-5 rounded-3xl border-l-4 border-cyan-500 shadow-md">
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-400 uppercase">{safeFormatDate(h.date)}</span>
                  <span className="text-[10px] font-black text-rose-500 uppercase px-2 py-0.5 bg-rose-500/10 rounded-full">Dolor {String(h.painLevel)}/10</span>
                </div>
                <p className="text-sm italic mb-2 text-indigo-50">"{String(h.notes)}"</p>
                <div className="flex flex-wrap gap-1">
                  {h.areas?.map(a => <span key={a} className="text-[8px] bg-slate-950 px-2 py-1 rounded-lg border border-white/5 text-cyan-400 font-black uppercase tracking-widest">{String(a)}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Perfil (Ajustes)
const ProfileTab = ({ user, doctorInfo, patients, onUpdateInfo, onLogout, onLinkGoogle, onLinkEmail, onUpgrade, onOpenAdminLogin }) => {
  const [name, setName] = useState(doctorInfo.name || '');
  const [clinic, setClinic] = useState(doctorInfo.clinic || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailLink, setEmailLink] = useState('');
  const [passLink, setPassLink] = useState('');

  const isLocked = !doctorInfo.isPremium;

  const handleSave = async () => {
    if (isLocked) return;
    setIsSaving(true);
    await onUpdateInfo({ name, clinic });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500); 
  };

  const handleAdminTap = () => {
    if (tapCount >= 6) {
      onOpenAdminLogin();
      setTapCount(0);
    } else {
      setTapCount(prev => prev + 1);
    }
  };

  const getProRemainingDays = () => {
    if (!doctorInfo.premiumExpiresAt) return null;
    const diffMs = doctorInfo.premiumExpiresAt - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const handleImageUpload = (e, fieldName, isBanner = false) => {
    if (isLocked) return;
    const file = e.target.files[0];
    if (!file) return;

    setIsSaving(true); 

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = isBanner ? 800 : 256;
        const MAX_HEIGHT = isBanner ? 400 : 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        await onUpdateInfo({ [fieldName]: canvas.toDataURL('image/jpeg', 0.7) });
        
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Función para Descargar Base de Datos en Excel (.CSV)
  const handleExportCSV = () => {
    if (isLocked) return;
    if (!patients || patients.length === 0) return alert("No tienes pacientes registrados para respaldar aún.");

    const headers = [
      'Nombre', 'Teléfono', 'Sexo', 'Edad', 'Fecha de Nac.', 'Lugar Nac.', 'Ocupación', 'Estado Civil', 'Dirección', 'Localidad', 
      'Peso(kg)', 'Altura(cm)', 'Tipo de Sangre', 'Presión', 'Motivo Consulta', 'Enfermedad Actual', 'Exámenes', 'Ant. Médicos', 'Ant. Patológicos', 'Ant. No Patológicos', 
      'Medicamentos Actuales', 'Precauciones (Alertas)', 'Dx Quiropráctico', 'Dx General', 'Subluxaciones', 
      'Postura Anterior', 'Postura Posterior', 'Postura Lateral', 'Desviaciones Posturales', 'Notas Anatómicas',
      'Sueño', 'Cuidado Personal', 'Desplazamientos', 'Recreación', 'Objetivos', 'Plan Tratamiento', 'Observaciones', 'Técnicas', 'Recomendaciones Casa',
      'Ajustes', 'Fecha Registro'
    ];
    
    const csvRows = patients.map(p => {
      const row = [
        p.name || '', p.phone || '', p.gender || '', p.age || '', p.birthDate || '', p.birthPlace || '', p.occupation || '', p.maritalStatus || '', p.address || '', p.location || '',
        p.weight || '', p.height || '', p.bloodType || '', p.pressure || '', p.consultationReason || '', p.currentIllness || '', p.complementaryExams || '', p.relevantMedicalHistory || '', p.pathological || '', p.nonPathological || '',
        p.medications || '', (p.redFlags || []).join('; '), p.chiropracticDiagnosis || '', p.generalDiagnosis || '', p.subluxations || '',
        p.postureAnterior || '', p.posturePosterior || '', p.postureLateral || '', (p.posturalDeviations || []).join('; '), p.anatomicalPlaneNotes || '',
        p.sleepQuality || '', p.personalCare || '', p.mobility || '', p.recreation || '', p.treatmentGoals || '', p.treatmentPlan || '', p.observations || '', (p.chiropracticTechniques || []).join('; '), p.additionalRecommendations || '',
        p.histories ? p.histories.length : 0, p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''
      ];
      return row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csvString = headers.join(',') + '\n' + csvRows.join('\n');
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Respaldo_Pacientes_Clinico_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const proDaysLeft = getProRemainingDays();
  const inputClass = `w-full bg-slate-950 p-5 rounded-[25px] border border-white/10 text-white font-bold outline-none transition-all ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'focus:border-cyan-400'}`;

  return (
    <div className="animate-fade-in space-y-6 text-left">
      <h2 className="text-3xl font-black uppercase italic mb-6 underline decoration-cyan-500 decoration-4 underline-offset-8">Ajustes</h2>
      
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-6 rounded-[30px] border border-white/10 text-center mb-6 shadow-xl">
        {!isLocked ? (
          <>
            <Cloud className="w-10 h-10 mx-auto mb-3 text-cyan-400" />
            <h4 className="text-cyan-400 font-black uppercase text-sm mb-2">Sincronización PRO</h4>
            <p className="text-[10px] text-indigo-200/70 mb-4 leading-relaxed">Protege tu cuenta y ábrela en tu PC en tiempo real vinculándola.</p>
            {user.isAnonymous ? (
              !showEmailForm ? (
                <div className="flex flex-col gap-3">
                  <button onClick={onLinkGoogle} className="bg-white text-black font-black uppercase text-[10px] py-4 px-6 rounded-2xl flex items-center justify-center gap-3 w-full active:scale-95 transition shadow-xl border-b-4 border-gray-400">
                    <Globe className="w-4 h-4" /> Vincular Google
                  </button>
                  <button onClick={() => setShowEmailForm(true)} className="bg-indigo-500 text-white font-black uppercase text-[10px] py-4 px-6 rounded-2xl flex items-center justify-center gap-3 w-full active:scale-95 transition shadow-xl border-b-4 border-indigo-700">
                    <Mail className="w-4 h-4" /> Crear Usuario y Contraseña
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-3 mt-4 text-left animate-slide-up">
                  <div>
                    <label className="text-[9px] font-black uppercase text-indigo-400 ml-2 mb-1 block">Correo de acceso</label>
                    <input type="email" placeholder="ejemplo@correo.com" value={emailLink} onChange={e => setEmailLink(e.target.value)} className="w-full bg-slate-900 p-4 rounded-xl border border-white/5 outline-none text-white text-xs focus:border-cyan-400" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-indigo-400 ml-2 mb-1 block">Contraseña segura</label>
                    <input type="password" placeholder="••••••••" value={passLink} onChange={e => setPassLink(e.target.value)} className="w-full bg-slate-900 p-4 rounded-xl border border-white/5 outline-none text-white text-xs focus:border-cyan-400" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowEmailForm(false)} className="flex-1 bg-white/5 text-white py-3 rounded-xl text-[10px] font-black uppercase">Cancelar</button>
                    <button onClick={() => onLinkEmail(emailLink, passLink)} className="flex-[2] bg-cyan-400 text-black py-3 rounded-xl text-[10px] font-black uppercase border-b-2 border-cyan-700">Guardar Datos</button>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase">
                <CheckCircle2 className="w-4 h-4" /> Cuenta Vinculada Exitosamente
              </div>
            )}
          </>
        ) : (
          <>
            <Lock className="w-10 h-10 mx-auto mb-3 text-amber-400" />
            <h4 className="text-amber-400 font-black uppercase text-sm mb-2">Respaldo Bloqueado</h4>
            <p className="text-[10px] text-amber-200/70 mb-4 leading-relaxed">En la versión de prueba no puedes crear usuarios ni respaldar en la nube. Adquiere PRO para habilitar la sincronización en Windows o Mac.</p>
            <button onClick={onUpgrade} className="bg-amber-500 text-black font-black uppercase text-[10px] py-4 px-6 rounded-2xl flex items-center justify-center gap-2 mx-auto active:scale-95 transition shadow-xl border-b-4 border-amber-700">
              <Sparkles className="w-4 h-4" /> Desbloquear PRO
            </button>
          </>
        )}
      </div>

      <div className="bg-indigo-900/20 p-8 rounded-[40px] border border-cyan-400/20 space-y-6 shadow-xl relative overflow-hidden">
        {isLocked ? (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between shadow-lg mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Personalización Bloqueada</span>
            </div>
            <button onClick={onUpgrade} className="bg-amber-500 text-black px-3 py-1.5 rounded-xl text-[9px] font-black uppercase active:scale-95 transition">Desbloquear</button>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between shadow-lg mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest leading-none mb-1">Suscripción PRO Activa</span>
                {doctorInfo.premiumExpiresAt && (
                  <span className="text-[8px] text-emerald-200/70 font-bold uppercase tracking-widest">
                    Te quedan {proDaysLeft} días (Vence: {safeFormatDate(new Date(doctorInfo.premiumExpiresAt).toISOString())})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="border-b border-white/10 pb-6 mb-6">
          <label className={`text-[10px] font-black uppercase tracking-widest ml-4 mb-3 flex items-center gap-2 ${isLocked ? 'text-slate-500' : 'text-cyan-400'}`}>
            <ImagePlus className="w-3 h-3" /> Logo de Clínica
          </label>
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 shrink-0 rounded-[20px] flex items-center justify-center border-2 border-dashed ${isLocked ? 'border-slate-700 bg-slate-900/50' : 'border-cyan-500/50 bg-slate-950 overflow-hidden'}`}>
              {doctorInfo.logo ? (
                <img src={doctorInfo.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className={`w-8 h-8 ${isLocked ? 'text-slate-700' : 'text-cyan-500/50'}`} />
              )}
            </div>
            <div className="flex-1">
              <input 
                type="file" 
                id="logo-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleImageUpload(e, 'logo', false)} 
                disabled={isLocked}
              />
              <label 
                htmlFor="logo-upload" 
                className={`py-3 px-5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${isLocked ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 cursor-pointer active:scale-95 hover:bg-cyan-500/20'}`}
              >
                <Upload className="w-4 h-4" /> 
                {isLocked ? 'Exclusivo PRO' : 'Subir Logo'}
              </label>
              <p className="text-[8px] text-indigo-400/60 mt-2 ml-1 italic leading-tight">Tu logo aparecerá en el menú superior. Formato 1:1.</p>
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 pb-6 mb-6">
          <label className={`text-[10px] font-black uppercase tracking-widest ml-4 mb-3 flex items-center gap-2 ${isLocked ? 'text-slate-500' : 'text-cyan-400'}`}>
            <ImageIcon className="w-3 h-3" /> Imagen de Fondo (Inicio)
          </label>
          <div className="flex flex-col gap-4">
            <div className={`w-full h-32 rounded-[20px] flex items-center justify-center border-2 border-dashed relative overflow-hidden ${isLocked ? 'border-slate-700 bg-slate-900/50' : 'border-cyan-500/50 bg-slate-950'}`}>
              {doctorInfo.bannerImage ? (
                <img src={doctorInfo.bannerImage} alt="Fondo" className="w-full h-full object-cover opacity-60" />
              ) : (
                <ImageIcon className={`w-8 h-8 ${isLocked ? 'text-slate-700' : 'text-cyan-500/50'}`} />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <input 
                  type="file" 
                  id="banner-upload" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(e, 'bannerImage', true)} 
                  disabled={isLocked} 
                />
                <label 
                  htmlFor="banner-upload" 
                  className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-xl backdrop-blur-md ${isLocked ? 'bg-slate-800 text-slate-500 cursor-not-allowed hidden' : 'bg-black/50 text-cyan-400 border border-cyan-500/50 cursor-pointer active:scale-95 hover:bg-black/70'}`}
                >
                  <Upload className="w-4 h-4" /> {doctorInfo.bannerImage ? 'Cambiar Fondo' : 'Subir Fondo'}
                </label>
              </div>
            </div>
            <p className="text-[8px] text-indigo-400/60 ml-2 italic leading-tight">Sube una foto de tu clínica o consultorio. Formato horizontal recomendado.</p>
          </div>
        </div>

        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest ml-4 mb-2 flex items-center gap-2 ${isLocked ? 'text-slate-500' : 'text-cyan-400'}`}><User className="w-3 h-3" /> Especialista</label>
          <input type="text" placeholder="Tu Nombre" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} disabled={isLocked} />
        </div>
        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest ml-4 mb-2 flex items-center gap-2 ${isLocked ? 'text-slate-500' : 'text-cyan-400'}`}><Building className="w-3 h-3" /> Clínica</label>
          <input type="text" placeholder="Nombre Clínica" className={inputClass} value={clinic} onChange={(e) => setClinic(e.target.value)} disabled={isLocked} />
        </div>
        
        <div className="border-t border-white/10 pt-6 mt-4">
          <label className={`text-[10px] font-black uppercase tracking-widest ml-4 mb-3 flex items-center gap-2 ${isLocked ? 'text-slate-500' : 'text-emerald-400'}`}>
            <Download className="w-3 h-3" /> Respaldo Local (Excel)
          </label>
          <button 
            onClick={handleExportCSV} 
            disabled={isLocked}
            className={`w-full py-4 rounded-3xl font-black uppercase italic transition-all flex justify-center items-center gap-2 shadow-lg ${isLocked ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95'}`}
          >
            {isLocked ? <><Lock className="w-4 h-4"/> Exclusivo PRO</> : <><Download className="w-5 h-5"/> Descargar Base de Datos</>}
          </button>
          <p className="text-[8px] text-indigo-400/60 mt-2 text-center italic leading-tight px-4">
            Descarga un archivo .csv con la información clínica de todos tus pacientes para abrirlo en Excel.
          </p>
        </div>

        <button onClick={handleSave} disabled={isSaving || saved || isLocked} className={`w-full bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase italic border-b-8 border-cyan-700 shadow-xl active:scale-95 transition flex justify-center items-center gap-2 mt-4 disabled:opacity-70 ${isLocked ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}>
          {isLocked ? <><Lock className="w-4 h-4"/> Exclusivo PRO</> : isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : saved ? <><CheckCircle2 className="w-5 h-5" /> ¡Guardado!</> : 'Guardar Cambios de Perfil'}
        </button>
      </div>

      <div className="bg-slate-900 p-8 rounded-[40px] border border-white/5 text-center">
        <UserCircle onClick={handleAdminTap} className="w-12 h-12 mx-auto mb-4 text-indigo-500 cursor-pointer" />
        <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Estado de Cuenta</p>
        <p className="text-xs font-bold text-white mb-6 break-all">{user.isAnonymous ? "Perfil Temporal" : String(user.email || user.phoneNumber)}</p>
        <button onClick={onLogout} className="w-full bg-rose-500/10 border-2 border-rose-500/20 py-5 rounded-[25px] flex items-center justify-center gap-3 text-rose-500 font-black uppercase italic active:scale-95 transition">
          <LogOut className="w-5 h-5" /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

// --- MODALES DE FORMULARIO ---

const AdminLoginModal = ({ onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'zod117' && password === 'famcab117') {
      onSuccess();
    } else {
      setError('Credenciales incorrectas. Acceso denegado.');
    }
  };

  return (
    <Modal title="Acceso Clasificado" onClose={onClose}>
      <div className="space-y-4 text-left pb-4">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/30">
            <ShieldAlert className="w-10 h-10 text-rose-500" />
          </div>
        </div>
        {error && <div className="bg-rose-500/20 text-rose-400 p-3 rounded-2xl text-[10px] font-black uppercase text-center animate-pulse">{String(error)}</div>}
        
        <div>
          <label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-1 block">Usuario</label>
          <input type="text" placeholder="Ingresar usuario" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none focus:border-rose-500 transition-all" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        
        <div>
          <label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-1 block">Contraseña</label>
          <input type="password" placeholder="••••••••" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none focus:border-rose-500 transition-all" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        
        <button onClick={handleLogin} className="w-full bg-rose-500 text-white py-5 rounded-3xl font-black uppercase text-xs border-b-8 border-rose-800 shadow-xl active:scale-95 transition flex justify-center items-center gap-2 mt-6">
          <Lock className="w-4 h-4" /> Autorizar Acceso
        </button>
      </div>
    </Modal>
  );
};

const UpsellModal = ({ onClose, onUpgrade }) => (
  <Modal title="Límite Alcanzado" onClose={onClose}>
    <div className="text-center space-y-6 pb-4">
      <div className="bg-amber-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
        <Lock className="w-12 h-12 text-amber-400" />
      </div>
      <h3 className="text-2xl font-black uppercase italic text-white">Prueba Limitada</h3>
      <p className="text-indigo-200 text-sm leading-relaxed px-4">
        En la versión de prueba solo puedes registrar hasta <strong>{MAX_TRIAL_PATIENTS} pacientes</strong>. Adquiere QuiroApp Pro para gestionar pacientes ilimitados y respaldarlos en la nube.
      </p>
      <button 
        onClick={() => { onClose(); onUpgrade(); }} 
        className="w-full bg-amber-400 text-black py-5 rounded-3xl font-black uppercase italic border-b-8 border-amber-600 shadow-xl active:scale-95 transition flex justify-center items-center gap-2"
      >
        <Sparkles className="w-5 h-5" /> Obtener Versión PRO
      </button>
    </div>
  </Modal>
);

const CalendarModal = ({ appointments, patients, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const dayAppointments = appointments
    .filter(a => String(a.date) === selectedDate)
    .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));

  return (
    <Modal title="Calendario" onClose={onClose}>
      <div className="space-y-6 text-left">
        <div>
          <label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-2 block tracking-widest">Seleccionar Fecha</label>
          <input 
            type="date" 
            className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 font-bold" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)} 
          />
        </div>
        
        <div className="bg-slate-900/50 p-6 rounded-[30px] border border-white/5 min-h-[300px]">
          {dayAppointments.length === 0 ? (
            <div className="py-12 text-center opacity-40">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-indigo-400" />
              <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.2em]">Libre</p>
            </div>
          ) : (
            dayAppointments.map(app => (
              <div key={app.id} className="bg-slate-950 p-4 rounded-3xl border border-white/5 mb-3 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-white font-black uppercase italic text-sm">{String(patients.find(p => p.id === app.patientId)?.name || 'Paciente no encontrado')}</p>
                  <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> {String(app.time)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

const RED_FLAGS = [
  'Tumor', 'Infecciones', 'Fractura', 'Problema neurológico', 'Problemas nerviosos',
  'Herida abierta local', 'Quemadura', 'Sangrado prolongado', 'Implantes artificiales', 
  'Marcapasos', 'Infección articular'
];

const CHIRO_TECHNIQUES = [
  'Diversified', 'Gonstead', 'Thompson', 'Activador', 'Toggle Recoil', 
  'SOT (Sacro Occipital)', 'Cox Flexion-Distraction', 'Miofascial / Graston', 'Ajuste Cervical Específico'
];

const POSTURAL_DEVIATIONS = [
  'Cabeza Adelantada', 'Hombro Elevado', 'Escápula Alada', 'Hipercifosis Dorsal', 
  'Hiperlordosis Lumbar', 'Rectificación Cervical', 'Pelvis Basculada', 'Escoliosis', 
  'Genu Valgo (X)', 'Genu Varo (O)', 'Pie Plano/Cavo'
];

const NewPatientModal = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ 
    name: '', phone: '', age: '', gender: '', address: '', occupation: '', maritalStatus: '', location: '', birthPlace: '', birthDate: '',
    relevantMedicalHistory: '', consultationReason: '', complementaryExams: '', currentIllness: '', pathological: '', nonPathological: '', medications: '',
    redFlags: [], chiropracticDiagnosis: '', subluxations: '',
    observations: '', treatmentPlan: '', treatmentGoals: '',
    sleepQuality: '', personalCare: '', mobility: '', recreation: '', generalDiagnosis: '', weight: '', height: '', bloodType: '', pressure: '',
    chiropracticTechniques: [], additionalRecommendations: '',
    posturalDeviations: [], postureAnterior: '', posturePosterior: '', postureLateral: '', anatomicalPlaneNotes: '',
    histories: []
  });
  
  const handleNext = () => { if(form.name) setStep(step + 1); };
  
  const handleSaveClick = () => {
    if (isSaving) return;
    setIsSaving(true);
    onSave(form);
  };

  const toggleArrayItem = (field, item) => {
    setForm(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] };
    });
  };

  return (
    <Modal title={`Crear Expediente (${step}/7)`} onClose={onClose}>
      <div className="space-y-4">
        {step === 1 && (<div className="space-y-4 animate-fade-in text-left">
          <label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-1 block">1. Identidad del Paciente</label>
          <input type="text" placeholder="Nombre completo *" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input type="tel" placeholder="Teléfono" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <select className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none text-sm appearance-none" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
              <option value="">Sexo...</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option>
            </select>
            <input type="date" placeholder="Fecha Nac." className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} />
            <input type="number" placeholder="Edad" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm" value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
            <input type="text" placeholder="Lugar de Nacimiento" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm" value={form.birthPlace} onChange={e => setForm({...form, birthPlace: e.target.value})} />
            <select className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none text-sm appearance-none" value={form.maritalStatus} onChange={e => setForm({...form, maritalStatus: e.target.value})}>
              <option value="">Estado Civil...</option><option value="Soltero/a">Soltero/a</option><option value="Casado/a">Casado/a</option><option value="Divorciado/a">Divorciado/a</option><option value="Viudo/a">Viudo/a</option>
            </select>
            <input type="text" placeholder="Ocupación" className="col-span-2 w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} />
            <input type="text" placeholder="Localidad / Ciudad" className="col-span-2 w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            <input type="text" placeholder="Dirección completa" className="col-span-2 w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          </div>
        </div>)}
        
        {step === 2 && (<div className="space-y-4 animate-fade-in text-left">
          <label className="text-[10px] font-black uppercase text-cyan-400 ml-4 mb-1 block">2. Historial Clínico</label>
          <textarea placeholder="Motivo de Consulta *" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[60px] outline-none focus:border-cyan-500 text-sm" value={form.consultationReason} onChange={e => setForm({...form, consultationReason: e.target.value})} />
          <textarea placeholder="Enfermedad Actual (Descripción)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[60px] outline-none focus:border-cyan-500 text-sm" value={form.currentIllness} onChange={e => setForm({...form, currentIllness: e.target.value})} />
          <textarea placeholder="Antecedentes Médicos Relevantes" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[60px] outline-none focus:border-cyan-500 text-sm" value={form.relevantMedicalHistory} onChange={e => setForm({...form, relevantMedicalHistory: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <textarea placeholder="Ant. Patológicos (Cirugías, Alergias)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[80px] outline-none focus:border-cyan-500 text-sm" value={form.pathological} onChange={e => setForm({...form, pathological: e.target.value})} />
            <textarea placeholder="Ant. No Patológicos (Hábitos, Ejercicio)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[80px] outline-none focus:border-cyan-500 text-sm" value={form.nonPathological} onChange={e => setForm({...form, nonPathological: e.target.value})} />
          </div>
          {/* CAMPO RECTIFICADO Y AÑADIDO: Medicamentos */}
          <textarea placeholder="Medicamentos que toma actualmente..." className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[60px] outline-none focus:border-cyan-500 text-sm" value={form.medications} onChange={e => setForm({...form, medications: e.target.value})} />
          <textarea placeholder="Exámenes Complementarios (Rayos X, RM, etc. según diagnóstico visual)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[60px] outline-none focus:border-cyan-500 text-sm" value={form.complementaryExams} onChange={e => setForm({...form, complementaryExams: e.target.value})} />
        </div>)}

        {step === 3 && (<div className="space-y-4 animate-fade-in text-left">
          <label className="text-[10px] font-black uppercase text-rose-400 ml-4 mb-1 block">3. Alertas Rojas y Diagnóstico</label>
          <div className="bg-slate-900 p-4 rounded-[25px] border border-white/5">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-3">Precauciones / Contraindicaciones</p>
            <div className="flex flex-wrap gap-2">
              {RED_FLAGS.map(flag => (
                <button key={flag} onClick={() => toggleArrayItem('redFlags', flag)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black border transition-all ${form.redFlags.includes(flag) ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-slate-950 text-slate-400 border-white/5 hover:border-white/20'}`}>
                  {flag}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <input type="text" placeholder="Diagnóstico Quiropráctico Principal" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm mb-3" value={form.chiropracticDiagnosis} onChange={e => setForm({...form, chiropracticDiagnosis: e.target.value})} />
            <textarea placeholder="Análisis de Subluxaciones detectadas..." className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[80px] outline-none focus:border-cyan-500 text-sm" value={form.subluxations} onChange={e => setForm({...form, subluxations: e.target.value})} />
          </div>
        </div>)}

        {step === 4 && (<div className="space-y-4 animate-fade-in text-left">
          <label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-1 block">4. Plan de Tratamiento</label>
          <textarea placeholder="Objetivos del Tratamiento Quiropráctico" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[80px] outline-none focus:border-cyan-500 text-sm" value={form.treatmentGoals} onChange={e => setForm({...form, treatmentGoals: e.target.value})} />
          <textarea placeholder="Plan de Tratamiento propuesto (Frecuencia, Fases)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[80px] outline-none focus:border-cyan-500 text-sm" value={form.treatmentPlan} onChange={e => setForm({...form, treatmentPlan: e.target.value})} />
          <textarea placeholder="Observaciones generales" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[80px] outline-none focus:border-cyan-500 text-sm" value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} />
        </div>)}

        {step === 5 && (<div className="space-y-4 animate-fade-in text-left">
          <label className="text-[10px] font-black uppercase text-cyan-400 ml-4 mb-1 block">5. Examen Físico y Hábitos</label>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <input type="text" placeholder="Presión Arterial (Ej: 120/80)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm" value={form.pressure} onChange={e => setForm({...form, pressure: e.target.value})} />
            <select className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none text-sm appearance-none" value={form.bloodType} onChange={e => setForm({...form, bloodType: e.target.value})}>
              <option value="">Tipo de Sangre...</option>{['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="Peso (kg)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
            <input type="number" placeholder="Altura (cm)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 text-sm" value={form.height} onChange={e => setForm({...form, height: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none text-sm appearance-none" value={form.sleepQuality} onChange={e => setForm({...form, sleepQuality: e.target.value})}>
              <option value="">Calidad de Sueño...</option><option value="Bueno (7-8h)">Bueno (7-8h)</option><option value="Irregular">Irregular</option><option value="Insomnio/Pobre">Insomnio/Pobre</option>
            </select>
            <select className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none text-sm appearance-none" value={form.personalCare} onChange={e => setForm({...form, personalCare: e.target.value})}>
              <option value="">Cuidado Personal...</option><option value="Independiente">Independiente</option><option value="Con dificultad">Con dificultad</option><option value="Requiere asistencia">Requiere asistencia</option>
            </select>
            <select className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none text-sm appearance-none" value={form.mobility} onChange={e => setForm({...form, mobility: e.target.value})}>
              <option value="">Desplazamientos...</option><option value="Normal">Normal</option><option value="Dolor al caminar">Dolor al caminar</option><option value="Usa apoyo (Bastón/etc)">Usa apoyo</option>
            </select>
            <select className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white outline-none text-sm appearance-none" value={form.recreation} onChange={e => setForm({...form, recreation: e.target.value})}>
              <option value="">Recreación / Deporte...</option><option value="Activo/Frecuente">Activo/Frecuente</option><option value="Sedentario">Sedentario</option><option value="Limitado por dolor">Limitado por dolor</option>
            </select>
          </div>
          <textarea placeholder="Diagnóstico General (Médico/Funcional)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[60px] outline-none focus:border-cyan-500 text-sm" value={form.generalDiagnosis} onChange={e => setForm({...form, generalDiagnosis: e.target.value})} />
        </div>)}

        {step === 6 && (<div className="space-y-4 animate-fade-in text-left">
          <label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-1 block">6. Plano Anatómico y Postura</label>
          <div className="bg-slate-900 p-4 rounded-[25px] border border-white/5 mb-3">
            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-3">Alteraciones Posturales (Selección Rápida)</p>
            <div className="flex flex-wrap gap-2">
              {POSTURAL_DEVIATIONS.map(dev => (
                <button key={dev} onClick={() => toggleArrayItem('posturalDeviations', dev)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black border transition-all ${form.posturalDeviations.includes(dev) ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-950 text-slate-400 border-white/5 hover:border-white/20'}`}>
                  {dev}
                </button>
              ))}
            </div>
          </div>
          <textarea placeholder="Vista Anterior - Frente (Ej. Hombro derecho elevado, cabeza inclinada...)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[60px] outline-none focus:border-cyan-500 text-sm" value={form.postureAnterior} onChange={e => setForm({...form, postureAnterior: e.target.value})} />
          <textarea placeholder="Vista Posterior - Espalda (Ej. Escápula alada, desnivel pélvico...)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[60px] outline-none focus:border-cyan-500 text-sm" value={form.posturePosterior} onChange={e => setForm({...form, posturePosterior: e.target.value})} />
          <textarea placeholder="Vista Lateral - Perfil (Ej. Hipercifosis dorsal, hiperlordosis lumbar...)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[60px] outline-none focus:border-cyan-500 text-sm" value={form.postureLateral} onChange={e => setForm({...form, postureLateral: e.target.value})} />
          <textarea placeholder="Notas adicionales de anatomía..." className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[60px] outline-none focus:border-cyan-500 text-sm" value={form.anatomicalPlaneNotes} onChange={e => setForm({...form, anatomicalPlaneNotes: e.target.value})} />
        </div>)}

        {step === 7 && (<div className="space-y-4 animate-fade-in text-left">
          <label className="text-[10px] font-black uppercase text-cyan-400 ml-4 mb-1 block">7. Técnicas y Recomendaciones</label>
          <div className="bg-slate-900 p-4 rounded-[25px] border border-white/5 mb-3">
            <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-3">Técnicas Quiroprácticas a utilizar</p>
            <div className="flex flex-wrap gap-2">
              {CHIRO_TECHNIQUES.map(tech => (
                <button key={tech} onClick={() => toggleArrayItem('chiropracticTechniques', tech)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black border transition-all ${form.chiropracticTechniques.includes(tech) ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'bg-slate-950 text-slate-400 border-white/5 hover:border-white/20'}`}>
                  {tech}
                </button>
              ))}
            </div>
          </div>
          <textarea placeholder="Recomendaciones Adicionales (Ej. Ejercicios, frío/calor, postura en casa)" className="w-full bg-slate-900 p-4 rounded-3xl border border-white/10 text-white min-h-[100px] outline-none focus:border-cyan-500 text-sm" value={form.additionalRecommendations} onChange={e => setForm({...form, additionalRecommendations: e.target.value})} />
        </div>)}

        <div className="flex gap-4 pt-6">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 bg-white/5 py-4 rounded-3xl font-black uppercase text-xs active:scale-95 transition">Atrás</button>}
          {step < 7 ? (<button onClick={handleNext} disabled={!form.name} className="flex-[2] bg-cyan-400 text-black py-4 rounded-3xl font-black uppercase text-xs active:scale-95 transition shadow-lg border-b-4 border-cyan-700 disabled:opacity-50">Siguiente</button>) 
          : (
            <button onClick={handleSaveClick} disabled={isSaving} className="flex-[2] bg-cyan-400 text-black py-4 rounded-3xl font-black uppercase text-xs border-b-4 border-cyan-700 flex justify-center items-center gap-2 active:scale-95 transition disabled:opacity-70 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : 'Guardar Expediente'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

const NewHistoryModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], painLevel: 5, areas: [], notes: '' });
  const [isSaving, setIsSaving] = useState(false);
  const areas = ['Cervical', 'Dorsal', 'Lumbar', 'Sacro', 'Hombros', 'Caderas', 'Rodillas'];

  const handleSaveClick = () => {
    if (isSaving) return;
    setIsSaving(true);
    onSave(form);
  };

  return (
    <Modal title="Nuevo Ajuste" onClose={onClose}>
      <div className="space-y-6">
        <input type="date" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        
        <div className="bg-slate-900 p-5 rounded-3xl text-left border border-white/5">
          <div className="flex justify-between mb-4"><span className="text-[10px] font-black uppercase text-indigo-400">Escala de Dolor</span><span className="text-rose-500 font-black">{form.painLevel}/10</span></div>
          <input type="range" min="0" max="10" className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-full appearance-none outline-none" value={form.painLevel} onChange={e => setForm({...form, painLevel: parseInt(e.target.value)})} />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {areas.map(a => (<button key={a} onClick={() => setForm({...form, areas: form.areas.includes(a) ? form.areas.filter(x => x !== a) : [...form.areas, a]})} className={`px-4 py-2 rounded-2xl text-[10px] font-black border transition-all ${form.areas.includes(a) ? 'bg-cyan-400 border-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-slate-900 border-white/10 text-indigo-400 hover:bg-slate-800'}`}>{String(a)}</button>))}
        </div>
        
        <textarea placeholder="Notas clínicas del ajuste y técnica aplicada..." className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 min-h-[120px] text-white outline-none focus:border-cyan-500" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        
        <button onClick={handleSaveClick} disabled={isSaving} className="w-full bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase italic border-b-8 border-cyan-700 shadow-xl active:scale-95 transition flex justify-center items-center gap-2 disabled:opacity-70">
          {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : 'Guardar Ajuste'}
        </button>
      </div>
    </Modal>
  );
};

const NewAppointmentModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], time: '10:00' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = () => {
    if (isSaving || !form.date || !form.time) return;
    setIsSaving(true);
    onSave(form);
  };

  return (
    <Modal title="Agendar Cita" onClose={onClose}>
      <div className="space-y-6 text-left">
        <div>
          <label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-1 block">Fecha de la cita</label>
          <input type="date" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-1 block">Hora</label>
          <input type="time" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
        </div>
        
        <button onClick={handleSaveClick} disabled={isSaving} className="w-full bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase italic border-b-8 border-cyan-700 shadow-xl active:scale-95 transition flex justify-center items-center gap-2 disabled:opacity-70">
          {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : 'Confirmar Cita'}
        </button>
      </div>
    </Modal>
  );
};

const SubscriptionBlockedScreen = ({ onLogout }) => (
  <div className="fixed inset-0 bg-[#020617] z-[200] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
    <div className="bg-rose-500/10 p-8 rounded-[50px] border border-rose-500/30 mb-8 relative shadow-2xl max-w-sm w-full">
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-500 p-3 rounded-2xl shadow-lg"><Lock className="w-8 h-8 text-white" /></div>
      <h2 className="text-4xl font-black uppercase italic text-white mt-4 mb-4 tracking-tighter">Acceso <span className="text-rose-500">Bloqueado</span></h2>
      <p className="text-indigo-200 text-sm leading-relaxed mb-6">Tu prueba gratuita de 3 días ha finalizado. Para seguir utilizando <strong>QuiroApp Pro</strong> y recuperar tus datos, adquiere una licencia.</p>
      <button onClick={() => openWhatsApp("529996180031", "Hola, mi prueba venció. Me interesa QuiroApp Pro para reactivar mi cuenta.")} className="w-full bg-cyan-400 text-black font-black uppercase italic py-5 rounded-[25px] flex items-center justify-center gap-3 border-b-8 border-cyan-700 active:scale-95 transition mb-4 shadow-xl"><CreditCard className="w-6 h-6" /> Comprar Licencia</button>
      <button onClick={onLogout} className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition">Salir de la cuenta</button>
    </div>
  </div>
);

const AuthScreen = ({ onGoogleLogin, onEmailAuth, onStartTrial, inProcess, error, step, setStep }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);

  const handleSubmit = () => {
    onEmailAuth(email, password, isLoginView);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#020617] p-6 text-center relative overflow-hidden text-white italic">
      <SpineWatermark />
      <div className="mb-8 z-10 animate-fade-in">
        <div className="bg-gradient-to-tr from-cyan-400 to-indigo-700 p-8 rounded-[40px] inline-block mb-6 shadow-2xl border border-white/20"><SpineLogo className="w-14 h-14 text-white" /></div>
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 leading-none text-white">Quiro<span className="text-cyan-400 font-bold">App</span></h2>
        <p className="text-indigo-400 font-black tracking-[0.4em] uppercase text-[9px] opacity-60 text-center">Gestión Clínica Profesional</p>
      </div>
      <div className="w-full max-w-sm space-y-4 z-10 relative">
        {error && <div className="bg-rose-500/10 border border-rose-500/50 p-4 rounded-2xl text-rose-400 text-[10px] mb-4 text-left animate-pulse"><ShieldAlert className="w-4 h-4 inline mr-2" /> {String(error)}</div>}
        {inProcess ? (
          <div className="p-10 bg-white/5 rounded-[45px] border border-white/10 backdrop-blur-md flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
            <p className="text-cyan-200 font-black tracking-widest text-[10px] uppercase">Preparando Entorno...</p>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            {step === 'initial' && (
              <><button onClick={onStartTrial} className="w-full bg-cyan-400 text-black py-5 rounded-[25px] font-black flex items-center justify-center gap-3 transition border-b-[6px] border-cyan-700 uppercase shadow-xl active:scale-95 text-sm sm:text-base"><PlayCircle className="w-6 h-6" /> Comenzar Prueba (3 Días)</button>
                <div className="flex items-center gap-4 py-2 opacity-30"><div className="flex-1 h-[1px] bg-white"></div><span className="text-[10px] font-black uppercase tracking-widest italic">O tienes cuenta PRO</span><div className="flex-1 h-[1px] bg-white"></div></div>
                <div className="grid grid-cols-1 gap-3">
                   <button onClick={() => setStep('email')} className="bg-white/10 p-4 rounded-[25px] border border-white/10 flex items-center justify-center gap-2 hover:bg-white/20 transition active:scale-95"><Mail className="w-4 h-4 text-cyan-400" /><span className="text-[10px] font-black uppercase">Ingresar con Correo</span></button>
                   <button onClick={onGoogleLogin} className="bg-white/5 p-4 rounded-[25px] border border-white/5 flex items-center justify-center gap-2 hover:bg-white/10 transition active:scale-95 opacity-70"><Globe className="w-4 h-4 text-white" /><span className="text-[10px] font-black uppercase">Google</span></button>
                </div></>
            )}
            {step === 'email' && (
              <div className="bg-indigo-950/40 p-6 rounded-[35px] border border-white/10 backdrop-blur-sm text-left">
                <h3 className="text-sm font-black uppercase text-cyan-400 mb-4 tracking-widest text-center">{isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta'}</h3>
                
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="text-[9px] font-black uppercase text-indigo-400 ml-2 mb-1 block">Correo Electrónico</label>
                    <input type="email" placeholder="ejemplo@correo.com" className="w-full bg-slate-900 p-4 rounded-2xl border border-white/5 outline-none text-white text-sm focus:border-cyan-500" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-indigo-400 ml-2 mb-1 block">Contraseña</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-slate-900 p-4 rounded-2xl border border-white/5 outline-none text-white text-sm focus:border-cyan-500" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setStep('initial')} className="flex-1 bg-white/5 py-4 rounded-2xl text-[10px] font-black uppercase text-indigo-400 active:scale-95">Atrás</button>
                  <button onClick={handleSubmit} className="flex-[2] bg-cyan-500 text-black py-4 rounded-2xl text-[10px] font-black uppercase border-b-4 border-cyan-700 active:scale-95 transition">{isLoginView ? 'Ingresar' : 'Registrarse'}</button>
                </div>

                <p className="text-center mt-6 text-[9px] text-indigo-300">
                  {isLoginView ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'} 
                  <button onClick={() => setIsLoginView(!isLoginView)} className="ml-1 text-cyan-400 font-black uppercase underline">
                    {isLoginView ? 'Regístrate' : 'Inicia Sesión'}
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState('home');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState({ name: '', clinic: '', trialStartedAt: null, isPremium: false, isAdmin: false });
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [trialTimeLeft, setTrialTimeLeft] = useState({ days: 0, hours: 0, expired: false });
  const [adminCodes, setAdminCodes] = useState([]); 
  
  const [modals, setModals] = useState({ patient: false, history: false, appointment: false, calendar: false, upsell: false, adminLogin: false });

  const [authInProcess, setAuthInProcess] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authStep, setAuthStep] = useState('initial');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) { setLoading(false); setAuthInProcess(false); }
    });
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const checkTrialAndSync = async () => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
        const snap = await getDocFromServer(docRef); 
        let profileData = snap.exists() ? snap.data() : { name: '', clinic: '', trialStartedAt: Date.now(), isPremium: false, isAdmin: false };
        if (!snap.exists()) await setDoc(docRef, profileData);
        else if (!profileData.trialStartedAt) { profileData.trialStartedAt = Date.now(); await updateDoc(docRef, { trialStartedAt: profileData.trialStartedAt }); }
        
        if (profileData.isPremium && profileData.premiumExpiresAt && Date.now() > profileData.premiumExpiresAt) {
          profileData.isPremium = false;
          await updateDoc(docRef, { isPremium: false });
        }

        setDoctorInfo(profileData);
        const calculate = () => {
          if (profileData.isPremium) return setTrialTimeLeft({ expired: false, isPremium: true });
          const start = profileData.trialStartedAt; const now = Date.now();
          const diffMs = (TRIAL_DAYS * 24 * 60 * 60 * 1000) - (now - start);
          if (diffMs <= 0) setTrialTimeLeft({ days: 0, hours: 0, expired: true });
          else setTrialTimeLeft({ days: Math.floor(diffMs / 86400000), hours: Math.floor((diffMs % 86400000) / 3600000), expired: false });
        };
        calculate(); 
      } catch (e) { console.warn("Modo offline o error leyendo perfil:", e); } finally { setLoading(false); }
    };
    checkTrialAndSync();
    
    const unsubPat = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'patients'), (snap) => setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (error) => console.error("Error cargando pacientes:", error));
    const unsubApp = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), (snap) => setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (error) => console.error("Error cargando citas:", error));
    
    return () => { unsubPat(); unsubApp(); };
  }, [user]);

  useEffect(() => {
    if (user && doctorInfo?.isAdmin) {
      const unsubCodes = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'codes'), (snap) => {
        setAdminCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (error) => console.error("Error cargando códigos:", error));
      return () => unsubCodes();
    }
  }, [user, doctorInfo?.isAdmin]);

  const handleGoogleLogin = async () => {
    setAuthInProcess(true);
    setAuthError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError("No se pudo iniciar sesión con Google.");
      }
      setAuthInProcess(false);
    }
  };

  const handleTrialLogin = async () => {
    setAuthInProcess(true);
    setAuthError("");
    try {
      await signInAnonymously(auth);
    } catch (e) {
      setAuthError("Error al iniciar prueba gratuita. Revisa tu conexión.");
      setAuthInProcess(false);
    }
  };

  const handleEmailAuth = async (email, password, isLogin) => {
    if (!email || !password) return setAuthError("Rellena todos los campos.");
    setAuthInProcess(true);
    setAuthError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') setAuthError("Este correo ya está registrado.");
      else if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') setAuthError("Credenciales incorrectas.");
      else if (e.code === 'auth/weak-password') setAuthError("La contraseña debe tener al menos 6 caracteres.");
      else if (e.code === 'auth/invalid-email') setAuthError("El formato del correo no es válido.");
      else setAuthError("Error de autenticación. Intenta nuevamente.");
      setAuthInProcess(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      alert("¡Cuenta de Google vinculada! Ahora puedes abrir esta app en tu computadora con este correo y ver tus datos en tiempo real.");
    } catch (err) {
      alert("Ocurrió un error al vincular la cuenta o el correo ya está en uso.");
    }
  };

  const handleLinkEmail = async (email, password) => {
    if(!email || !password) return alert("Completa correo y contraseña");
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(auth.currentUser, credential);
      alert("¡Cuenta vinculada exitosamente! Ya puedes iniciar sesión con este correo en cualquier dispositivo.");
    } catch (err) {
      alert("Error: El correo podría estar en uso o la contraseña es muy débil.");
    }
  };

  const handleActivateCode = async (codeStr) => {
    if (!codeStr) return alert("Por favor, ingresa un código.");
    const cleanCode = codeStr.trim().toUpperCase();
    
    try {
      const codeRef = doc(db, 'artifacts', appId, 'public', 'data', 'codes', cleanCode);
      const codeSnap = await getDoc(codeRef); 
      if (codeSnap.exists() && !codeSnap.data().used) {
         const codeData = codeSnap.data();
         const activationTime = Date.now();
         const durationMs = (codeData.durationDays || 30) * 24 * 60 * 60 * 1000;
         
         let currentExpires = doctorInfo.premiumExpiresAt || activationTime;
         if (currentExpires < activationTime) currentExpires = activationTime; 
         const newExpiresAt = currentExpires + durationMs;

         await updateDoc(codeRef, { used: true, usedBy: user.uid, usedAt: new Date(activationTime).toISOString() });
         
         await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), { 
            isPremium: true,
            premiumActivatedAt: activationTime,
            premiumExpiresAt: newExpiresAt      
         });
         
         setDoctorInfo(prev => ({...prev, isPremium: true, premiumActivatedAt: activationTime, premiumExpiresAt: newExpiresAt}));
         alert(`¡Felicidades! Tu cuenta PRO se ha activado por ${codeData.durationDays} días.`);
         setActiveTab('settings');
      } else {
         alert("Este código es inválido o ya ha sido utilizado.");
      }
    } catch (e) {
      console.error("Error activando código:", e);
      if (e.message.includes("offline")) {
        alert("⚠️ Error de Red: Tu navegador o red bloqueó la conexión a la base de datos.");
      } else if (e.message.includes("permission-denied") || e.message.includes("Missing or insufficient permissions")) {
        alert("⚠️ Error de Permisos: Las reglas de Firebase aún están bloqueando el acceso. Verifica tu consola.");
      } else {
        alert(`Error técnico: ${e.message}`);
      }
    }
  };

  const handleGenerateAdminCode = async (type, durationDays) => {
    try {
      const prefix = type === 'Mensual' ? 'MES-' : 'ANU-';
      const newCode = prefix + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const codeData = {
          used: false,
          type: type,
          durationDays: durationDays,
          createdAt: new Date().toISOString(),
          createdBy: user?.uid || 'admin'
      };

      setAdminCodes(prev => [{ id: newCode, ...codeData }, ...prev]);
      alert(`✅ Código ${newCode} generado.\n\nYa está visible en tu historial.`);

      setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'codes', newCode), codeData)
        .catch(e => console.warn("Sincronización de código en segundo plano pausada:", e));
      
    } catch (error) {
      console.error("Error al guardar código:", error);
      alert(`❌ Error al generar código: ${error.message}`);
    }
  };

  const handleUpgradeRequest = () => {
    openWhatsApp("529996180031", "Hola, me interesa adquirir la versión PRO de QuiroApp para desbloquear todas las funciones.");
    setActiveTab('premium');
  };

  const handleUpdateProfile = async (newData) => { 
    setDoctorInfo(prev => ({ ...prev, ...newData }));
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), { ...doctorInfo, ...newData }, { merge: true }).catch(e => console.error(e)); 
  };
  
  const handleAddPatient = (data) => { 
    setModals(prev => ({ ...prev, patient: false }));
    addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'patients'), { ...data, createdAt: new Date().toISOString() }).catch(e => console.error(e)); 
  };
  
  const handleAddHistory = (history) => { 
    if (!selectedPatientId) return;
    const pat = patients.find(p => p.id === selectedPatientId); 
    setModals(prev => ({ ...prev, history: false }));
    if(pat) {
       updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', selectedPatientId), { histories: [history, ...(pat.histories || [])] }).catch(e => console.error(e)); 
    }
  };

  const handleAddAppointment = (appData) => {
    if (!selectedPatientId) return;
    setModals(prev => ({ ...prev, appointment: false }));
    addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), { 
      ...appData, 
      patientId: selectedPatientId, 
      createdAt: new Date().toISOString() 
    }).catch(e => console.error(e));
  };
  
  const handleDeletePatient = (id) => { 
    if (window.confirm("¿Eliminar expediente?")) { 
      setSelectedPatientId(null);
      deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', id)).catch(e => console.error(e)); 
    } 
  };

  const handleOpenNewPatient = () => {
    if (!doctorInfo.isPremium && patients.length >= MAX_TRIAL_PATIENTS) {
      setModals(m => ({ ...m, upsell: true }));
    } else {
      setModals(m => ({ ...m, patient: true }));
    }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-cyan-400 font-black animate-pulse uppercase tracking-[1em] italic text-center"><Loader2 className="w-12 h-12 mb-4 animate-spin mx-auto"/>Iniciando Bio-Nube...</div>;
  
  if (!user) {
    return (
      <AuthScreen 
        onGoogleLogin={handleGoogleLogin} 
        onEmailAuth={handleEmailAuth} 
        onStartTrial={handleTrialLogin} 
        inProcess={authInProcess} 
        error={authError} 
        step={authStep} 
        setStep={setAuthStep} 
      />
    );
  }
  
  if (trialTimeLeft.expired && !doctorInfo.isPremium && !doctorInfo.isAdmin) return <SubscriptionBlockedScreen onLogout={() => signOut(auth)} />;

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col italic overflow-hidden">
      <SpineWatermark />
      <header className="p-6 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-400/30 overflow-hidden flex items-center justify-center">
            {doctorInfo.logo ? (
              <img src={doctorInfo.logo} alt="Logo" className="w-7 h-7 object-cover" />
            ) : (
              <SpineLogo className="w-7 h-7 text-cyan-400" />
            )}
          </div>
          <h1 className="text-xl font-black uppercase tracking-tighter">Quiro<span className="text-cyan-400">App</span></h1>
        </div>
        <div className={`px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[7px] font-black uppercase flex items-center gap-1 shadow-sm ${isOnline ? 'text-cyan-400' : 'text-rose-500'}`}>
          {isOnline ? <Cloud className="w-2 h-2" /> : <WifiOff className="w-2 h-2" />} {isOnline ? 'Sync Activo' : 'Offline'}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 z-10 pb-32">
        {selectedPatientId ? (
          <PatientProfile 
            patient={patients.find(p => p.id === selectedPatientId)} 
            doctorInfo={doctorInfo}
            onBack={() => setSelectedPatientId(null)} 
            onAddHistory={() => setModals(m => ({...m, history: true}))} 
            onSchedule={() => setModals(m => ({...m, appointment: true}))}
            onDelete={() => handleDeletePatient(selectedPatientId)} 
          />
        ) : (
          <>{activeTab === 'home' && <HomeTab appointments={appointments} patients={patients} doctorInfo={doctorInfo} onAddAppointment={() => setActiveTab('patients')} onOpenCalendar={() => setModals(m => ({...m, calendar: true}))} onUpgrade={handleUpgradeRequest} />}
            {activeTab === 'patients' && (
              <div className="animate-fade-in space-y-4"><h2 className="text-3xl font-black uppercase italic mb-6 underline decoration-cyan-500 decoration-4 underline-offset-8">Pacientes</h2>
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-4 text-indigo-500 w-5 h-5" />
                  <input type="text" placeholder="Buscar expediente..." className="w-full bg-slate-900 p-4 pl-12 rounded-3xl border border-white/10 text-white font-bold outline-none focus:border-cyan-500 transition-all" />
                </div>
                {patients.length === 0 ? <div className="py-20 text-center opacity-30"><ClipboardList className="w-12 h-12 mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-widest">Sin registros clínicos</p></div> : patients.map(p => (
                  <div key={p.id} onClick={() => setSelectedPatientId(p.id)} className="bg-slate-900/50 p-5 rounded-[30px] border border-white/5 flex items-center justify-between active:scale-95 transition cursor-pointer hover:bg-slate-900">
                    <div><p className="font-black text-white uppercase italic text-lg">{String(p.name)}</p><p className="text-[10px] text-indigo-400 font-bold uppercase">{String(p.phone)}</p></div><ChevronRight className="w-6 h-6 text-cyan-400" />
                  </div>
                ))}
                <button onClick={handleOpenNewPatient} className="fixed bottom-32 right-6 w-16 h-16 bg-cyan-400 text-black rounded-[25px] shadow-2xl flex items-center justify-center active:scale-90 transition z-20 border-b-4 border-cyan-700 shadow-cyan-900/50"><Plus className="w-8 h-8" /></button>
              </div>
            )}
            {activeTab === 'marketing' && (
              <div className="animate-fade-in space-y-6 text-center py-20">
                <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-6 animate-pulse" />
                <h2 className="text-2xl font-black uppercase italic text-white">Marketing IA</h2>
                <p className="text-indigo-400 mt-4 italic text-sm px-10">Muy pronto: Generador de campañas y mensajes persuasivos para tu clínica.</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <ProfileTab user={user} doctorInfo={doctorInfo} patients={patients} onUpdateInfo={handleUpdateProfile} onLogout={() => signOut(auth)} onLinkGoogle={handleLinkGoogle} onLinkEmail={handleLinkEmail} onUpgrade={handleUpgradeRequest} onOpenAdminLogin={() => setModals(m => ({...m, adminLogin: true}))} />
            )}
            {activeTab === 'premium' && (
              <PremiumTab onActivateCode={handleActivateCode} />
            )}
            {activeTab === 'admin' && doctorInfo.isAdmin && (
              <AdminTab codes={adminCodes} onGenerateCode={handleGenerateAdminCode} />
            )}
          </>
        )}
      </main>

      {!doctorInfo.isPremium && <div className="fixed bottom-24 w-full px-6 z-40 pointer-events-none"><div className="bg-indigo-600/90 backdrop-blur-md p-3 rounded-full flex items-center justify-center gap-3 border border-white/20 shadow-xl"><Clock className="w-4 h-4 text-cyan-300 animate-pulse" /><span className="text-[9px] font-black uppercase tracking-widest text-white">Prueba: <span className="text-cyan-300">{trialTimeLeft.days}d {trialTimeLeft.hours}h restantes</span></span></div></div>}

      <nav className="fixed bottom-0 w-full p-5 pb-8 bg-slate-900/90 backdrop-blur-3xl border-t border-indigo-400/20 flex justify-around items-center z-50 shadow-2xl">
        <button onClick={() => {setActiveTab('home'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' && !selectedPatientId ? 'text-cyan-400 scale-110' : 'text-slate-500 opacity-50'}`}><Home className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Inicio</span></button>
        <button onClick={() => {setActiveTab('patients'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'patients' || selectedPatientId ? 'text-cyan-400 scale-110' : 'text-slate-500 opacity-50'}`}><Users className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Pacientes</span></button>
        {doctorInfo.isAdmin ? (
           <button onClick={() => {setActiveTab('admin'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'admin' ? 'text-rose-500 scale-110' : 'text-slate-500 opacity-50'}`}><TerminalSquare className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Admin</span></button>
        ) : (
           <button onClick={() => {setActiveTab('marketing'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'marketing' ? 'text-cyan-400 scale-110' : 'text-slate-500 opacity-50'}`}><Megaphone className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Marketing</span></button>
        )}
        <button onClick={() => {setActiveTab('settings'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${(activeTab === 'settings' || activeTab === 'premium') ? 'text-cyan-400 scale-110' : 'text-slate-500 opacity-50'}`}><Settings className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Ajustes</span></button>
      </nav>

      {modals.patient && <NewPatientModal onClose={() => setModals(m => ({...m, patient: false}))} onSave={handleAddPatient} />}
      {modals.history && <NewHistoryModal onClose={() => setModals(m => ({...m, history: false}))} onSave={handleAddHistory} />}
      {modals.appointment && <NewAppointmentModal onClose={() => setModals(m => ({...m, appointment: false}))} onSave={handleAddAppointment} />}
      {modals.calendar && <CalendarModal appointments={appointments} patients={patients} onClose={() => setModals(m => ({...m, calendar: false}))} />}
      {modals.upsell && <UpsellModal onClose={() => setModals(m => ({...m, upsell: false}))} onUpgrade={() => { setModals(m => ({...m, upsell: false})); handleUpgradeRequest(); }} />}
      {modals.adminLogin && <AdminLoginModal onClose={() => setModals(m => ({...m, adminLogin: false}))} onSuccess={() => { handleUpdateProfile({ isAdmin: true, isPremium: true }); setModals(m => ({...m, adminLogin: false})); alert("¡MODO ADMINISTRADOR ACTIVADO!"); setActiveTab('admin'); }} />}
      
      <style dangerouslySetInnerHTML={{__html: `@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-slide-up { animation: slideUp 0.4s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}
