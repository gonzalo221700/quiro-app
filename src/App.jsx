import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query,
  serverTimestamp
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
  Bell,
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
  Phone,
  CheckCircle2,
  Droplet,
  Ruler,
  Weight,
  Bone,
  UserCircle,
  Building,
  User,
  Save,
  CreditCard,
  Clock,
  PlayCircle,
  WifiOff,
  Stethoscope,
  HeartPulse,
  Info
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
const db = getFirestore(app);
const appId = firebaseConfig.projectId;
const apiKey = ""; // API Key de Gemini

const TRIAL_DAYS = 3;

// --- UTILIDADES ---
const fetchGeminiWithRetry = async (prompt) => {
  if (!apiKey) return "Configura tu API Key en los ajustes para usar la IA.";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) { return "Error de conexión con la IA."; }
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

// --- COMPONENTES DE PANTALLA ---

const HomeTab = ({ appointments, patients, doctorInfo, onAddAppointment }) => {
  const today = new Date().toISOString().split('T')[0];
  const todays = appointments.filter(a => String(a.date) === today);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="bg-gradient-to-br from-indigo-700 to-black p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden">
        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
          {String(doctorInfo.clinic || "QuiroClínica Pro")}
        </p>
        <h2 className="text-4xl font-black italic text-white leading-none tracking-tighter">
          Dr. {String(doctorInfo.name || "Especialista")}
        </h2>
        <div className="absolute -bottom-10 -right-10 opacity-10"><SpineLogo className="w-48 h-48" /></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-6 rounded-[30px] border border-white/5 shadow-inner">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Pacientes</p>
          <p className="text-3xl font-black text-white">{String(patients.length)}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[30px] border border-white/5 shadow-inner">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Citas Hoy</p>
          <p className="text-3xl font-black text-white">{String(todays.length)}</p>
        </div>
      </div>

      <div className="bg-indigo-950/20 p-6 rounded-[40px] border border-indigo-500/20 shadow-xl">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-xl font-black uppercase italic text-white">Agenda del Día</h3>
          <button onClick={onAddAppointment} className="p-3 bg-cyan-400 text-black rounded-2xl active:scale-90 transition shadow-lg"><Plus className="w-5 h-5" /></button>
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
                <p className="text-white font-black uppercase italic">{String(patients.find(p => p.id === app.patientId)?.name || 'Paciente')}</p>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">{String(app.time)}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo-800" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PatientProfile = ({ patient, onBack, onAddHistory, onDelete }) => {
  const [sum, setSum] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  
  const generateAI = async () => {
    if (!patient.histories?.length) return;
    setLoadingIA(true);
    const text = patient.histories.map(h => `${h.date}: Dolor ${h.painLevel}. ${h.notes}`).join(' | ');
    const res = await fetchGeminiWithRetry(`Resume la evolución clínica: ${text}`);
    setSum(res);
    setLoadingIA(false);
  };
  
  const bmi = (patient.weight && patient.height) ? (parseFloat(patient.weight) / ((parseFloat(patient.height)/100)**2)).toFixed(1) : '--';

  return (
    <div className="animate-fade-in text-left pb-10">
      <div className="flex items-center gap-4 mb-8 sticky top-0 bg-slate-950/80 backdrop-blur-md py-4 z-20">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl active:scale-90 transition"><ChevronRight className="rotate-180" /></button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black uppercase italic truncate text-white">{String(patient.name)}</h2>
          <p className="text-[9px] font-black uppercase text-cyan-400 tracking-widest">{String(patient.phone)}</p>
        </div>
        <button onClick={onDelete} className="p-3 text-rose-500 bg-rose-500/10 rounded-2xl active:scale-90 transition"><Trash2 className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-900 p-4 rounded-3xl border border-white/5 text-center shadow-lg">
          <Weight className="w-4 h-4 mx-auto mb-2 text-indigo-500" /><p className="text-[10px] font-black text-indigo-400 uppercase">{String(patient.weight || '--')}kg</p>
        </div>
        <div className="bg-slate-900 p-4 rounded-3xl border border-white/5 text-center shadow-lg">
          <Ruler className="w-4 h-4 mx-auto mb-2 text-indigo-500" /><p className="text-[10px] font-black text-indigo-400 uppercase">{String(patient.height || '--')}cm</p>
        </div>
        <div className="bg-indigo-900/20 p-4 rounded-3xl border border-cyan-400/20 text-center shadow-lg">
          <Activity className="w-4 h-4 mx-auto mb-2 text-cyan-400" /><p className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter">IMC {String(bmi)}</p>
        </div>
      </div>

      <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-6 mb-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2"><HeartPulse className="w-4 h-4 text-rose-500" /><h4 className="text-[10px] font-black text-white uppercase tracking-widest">Información Clínica Completa</h4></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-white/5 pb-6">
          <div className="space-y-4">
             <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Presión Arterial</h5><p className="text-sm font-bold text-indigo-100">{String(patient.pressure || "No registrada")}</p></div>
             <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Diagnóstico Quiropráctico</h5><p className="text-sm font-bold text-cyan-300">{String(patient.mainDiagnosis || "Pendiente")}</p></div>
             <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Patológicos (Cirugías/Alergias)</h5><p className="text-xs text-indigo-200/70 italic leading-relaxed">{String(patient.pathological || "Ninguno reportado")}</p></div>
          </div>
          <div className="space-y-4">
             <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Medicamentos Actuales</h5><p className="text-xs text-indigo-200/70 italic leading-relaxed">{String(patient.medications || "Ninguno")}</p></div>
             <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Heredofamiliares</h5><p className="text-xs text-indigo-200/70 italic leading-relaxed">{String(patient.hereditary || "Ninguno reportado")}</p></div>
             <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Evaluación Postural</h5><p className="text-xs text-indigo-200/70 italic leading-relaxed">{String(patient.postural || "Sin evaluar")}</p></div>
          </div>
        </div>
        <div>
          <h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Subluxaciones Detectadas</h5>
          <p className="text-xs text-indigo-100 italic">{String(patient.subluxations || "Sin registro detallado")}</p>
        </div>
      </div>

      <div className="bg-indigo-900/20 p-6 rounded-[40px] border border-cyan-400/20 mb-8 shadow-inner">
        <div className="flex justify-between items-center mb-4 text-left">
          <h3 className="text-xs font-black uppercase text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" /> Bio-Log Inteligencia Artificial</h3>
          {!sum && <button onClick={generateAI} disabled={loadingIA} className="text-[8px] font-black uppercase bg-cyan-400 text-black px-4 py-1.5 rounded-full shadow-lg active:scale-95 transition">{loadingIA ? "..." : "Generar Evolución"}</button>}
        </div>
        <p className="text-xs italic text-indigo-200 leading-relaxed">{String(sum || "Analiza los ajustes clínicos para resumir el progreso.")}</p>
      </div>

      <div className="flex justify-between items-center mb-6 px-2">
        <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-500" /> Historial de Sesiones</h3>
        <button onClick={onAddHistory} className="bg-white text-black p-3 rounded-2xl active:scale-90 transition shadow-2xl"><Plus className="w-5 h-5" /></button>
      </div>

      <div className="space-y-4">
        {(!patient.histories || patient.histories.length === 0) ? (
          <div className="py-12 text-center opacity-20 border-2 border-dashed border-white/10 rounded-[40px]">
            <p className="text-xs font-black uppercase">Sin ajustes registrados</p>
          </div>
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
  );
};

// --- MODALES CON CIERRE INSTANTÁNEO ---

const NewPatientModal = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ 
    name: '', phone: '', age: '', weight: '', height: '', bloodType: 'O+', pressure: '',
    mainDiagnosis: '', postural: '', subluxations: '', pathological: '', hereditary: '', medications: '', histories: []
  });
  
  const diagnosysOptions = ["Subluxación Vertebral", "Cervicalgia", "Lumbalgia", "Ciática", "Escoliosis", "Hernia Discal", "Otro"];

  const handleNext = () => { if(form.name && form.phone) setStep(step + 1); };
  
  const handleSaveClick = () => {
    // Fire and forget: Mandamos la orden de guardar y cerramos inmediatamente.
    onSave(form);
    if (onClose) onClose(); 
  };

  return (
    <Modal title={step === 1 ? "Identidad" : step === 2 ? "Vitales" : step === 3 ? "Antecedentes" : "Diagnóstico"} onClose={onClose}>
      <div className="space-y-4">
        {step === 1 && (<div className="space-y-4 animate-fade-in text-left">
          <label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-1 block">Datos de Identidad</label>
          <input type="text" placeholder="Nombre completo" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input type="tel" placeholder="WhatsApp / Teléfono" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Edad" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none" value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
            <select className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none" value={form.bloodType} onChange={e => setForm({...form, bloodType: e.target.value})}>
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>)}
        
        {step === 2 && (<div className="space-y-4 animate-fade-in text-left">
          <label className="text-[10px] font-black uppercase text-cyan-400 ml-4 mb-1 block">Signos Vitales</label>
          <input type="text" placeholder="Presión Arterial (Ej: 120/80)" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none" value={form.pressure} onChange={e => setForm({...form, pressure: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Peso (kg)" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
            <input type="number" placeholder="Altura (cm)" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none" value={form.height} onChange={e => setForm({...form, height: e.target.value})} />
          </div>
        </div>)}
        
        {step === 3 && (<div className="space-y-4 animate-fade-in text-left">
          <label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-1 block">Antecedentes Médicos</label>
          <textarea placeholder="Patológicos (Cirugías, fracturas, alergias)..." className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white min-h-[80px] outline-none focus:border-cyan-500" value={form.pathological} onChange={e => setForm({...form, pathological: e.target.value})} />
          <textarea placeholder="Medicamentos que toma actualmente..." className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white min-h-[80px] outline-none focus:border-cyan-500" value={form.medications} onChange={e => setForm({...form, medications: e.target.value})} />
        </div>)}
        
        {step === 4 && (<div className="space-y-4 animate-fade-in text-left">
          <label className="text-[10px] font-black uppercase text-cyan-400 ml-4 mb-1 block">Diagnóstico Inicial</label>
          <select className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none" value={form.mainDiagnosis} onChange={e => setForm({...form, mainDiagnosis: e.target.value})}>
            <option value="">Seleccionar Diagnóstico...</option>
            {diagnosysOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <textarea placeholder="Subluxaciones y observaciones posturales..." className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white min-h-[100px] outline-none focus:border-cyan-500" value={form.subluxations} onChange={e => setForm({...form, subluxations: e.target.value})} />
        </div>)}
        
        <div className="flex gap-4 pt-6">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 bg-white/5 py-5 rounded-3xl font-black uppercase text-xs active:scale-95 transition">Atrás</button>}
          {step < 4 ? (<button onClick={handleNext} className="flex-[2] bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase text-xs active:scale-95 transition shadow-lg border-b-4 border-cyan-700">Siguiente</button>) 
          : (
            <button onClick={handleSaveClick} className="flex-[2] bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase text-xs border-b-8 border-cyan-700 flex justify-center items-center gap-2 active:scale-95 transition">
              Guardar Expediente
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

const NewHistoryModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], painLevel: 5, areas: [], notes: '' });
  const areas = ['Cervical', 'Dorsal', 'Lumbar', 'Sacro', 'Hombros', 'Caderas', 'Rodillas'];

  const handleSaveClick = () => {
    // Fire and forget: Cierra de inmediato
    onSave(form);
    if (onClose) onClose(); 
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
          {areas.map(a => (<button key={a} onClick={() => setForm({...form, areas: form.areas.includes(a) ? form.areas.filter(x => x !== a) : [...form.areas, a]})} className={`px-4 py-2 rounded-2xl text-[10px] font-black border transition-all ${form.areas.includes(a) ? 'bg-cyan-400 border-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-slate-900 border-white/10 text-indigo-400 hover:bg-slate-800'}`}>{a}</button>))}
        </div>
        
        <textarea placeholder="Notas clínicas del ajuste y técnica aplicada..." className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 min-h-[120px] text-white outline-none focus:border-cyan-500" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        
        <button onClick={handleSaveClick} className="w-full bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase italic border-b-8 border-cyan-700 shadow-xl active:scale-95 transition flex justify-center items-center gap-2">
          Guardar Ajuste
        </button>
      </div>
    </Modal>
  );
};

// --- COMPONENTES DE LOGIN ---

const SubscriptionBlockedScreen = ({ onLogout }) => (
  <div className="fixed inset-0 bg-[#020617] z-[200] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
    <div className="bg-rose-500/10 p-8 rounded-[50px] border border-rose-500/30 mb-8 relative shadow-2xl max-w-sm w-full">
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-500 p-3 rounded-2xl shadow-lg"><Lock className="w-8 h-8 text-white" /></div>
      <h2 className="text-4xl font-black uppercase italic text-white mt-4 mb-4 tracking-tighter">Acceso <span className="text-rose-500">Bloqueado</span></h2>
      <p className="text-indigo-200 text-sm leading-relaxed mb-6">Tu prueba gratuita de 3 días ha finalizado. Para seguir utilizando <strong>QuiroApp Pro</strong> y recuperar tus datos, adquiere una licencia.</p>
      <button onClick={() => openWhatsApp("521234567890", "Hola, mi prueba venció. Me interesa QuiroApp Pro.")} className="w-full bg-cyan-400 text-black font-black uppercase italic py-5 rounded-[25px] flex items-center justify-center gap-3 border-b-8 border-cyan-700 active:scale-95 transition mb-4 shadow-xl"><CreditCard className="w-6 h-6" /> Comprar Licencia</button>
      <button onClick={onLogout} className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition">Salir de la cuenta</button>
    </div>
  </div>
);

const AuthScreen = ({ onGoogleLogin, onPhoneSubmit, onOTPVerify, onStartTrial, inProcess, error, step, setStep }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#020617] p-6 text-center relative overflow-hidden text-white italic">
      <SpineWatermark /><div id="recaptcha-container"></div>
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
                <div className="flex items-center gap-4 py-2 opacity-30"><div className="flex-1 h-[1px] bg-white"></div><span className="text-[10px] font-black uppercase tracking-widest italic">O vincular cuenta</span><div className="flex-1 h-[1px] bg-white"></div></div>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={onGoogleLogin} className="bg-white/10 p-4 rounded-[25px] border border-white/10 flex items-center justify-center gap-2 hover:bg-white/20 transition active:scale-95"><Globe className="w-4 h-4 text-cyan-400" /><span className="text-[10px] font-black uppercase">Google</span></button>
                   <button onClick={() => setStep('phone')} className="bg-white/10 p-4 rounded-[25px] border border-white/10 flex items-center justify-center gap-2 hover:bg-white/20 transition active:scale-95"><Phone className="w-4 h-4 text-cyan-400" /><span className="text-[10px] font-black uppercase">Teléfono</span></button>
                </div></>
            )}
            {step === 'phone' && (
              <div className="bg-indigo-950/40 p-1 rounded-[35px] border border-white/10 backdrop-blur-sm">
                <div className="flex items-center bg-slate-900 rounded-[30px] p-2 border border-indigo-500/30">
                   <div className="pl-4 pr-2 text-indigo-400"><Phone className="w-4 h-4" /></div>
                   <input type="tel" placeholder="+52..." className="bg-transparent flex-1 p-3 outline-none text-white font-bold text-sm" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                   <button onClick={() => onPhoneSubmit(phoneNumber)} className="bg-cyan-500 text-black px-5 py-3 rounded-full font-black text-[10px] uppercase border-b-4 border-cyan-700 active:scale-95 transition">SMS</button>
                </div>
                <button onClick={() => setStep('initial')} className="mt-2 text-[8px] font-black uppercase text-indigo-500 p-2">Cancelar</button>
              </div>
            )}
            {step === 'otp' && (
              <div className="bg-indigo-900/20 p-8 rounded-[40px] border border-cyan-400/30"><h3 className="text-lg font-black uppercase mb-4 tracking-widest text-center">Código SMS</h3>
                <input type="number" placeholder="------" autoFocus className="w-full bg-slate-950 p-5 rounded-[25px] text-center text-3xl font-black text-cyan-400 outline-none border-2 border-indigo-800 focus:border-cyan-500 mb-4" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <div className="flex gap-2"><button onClick={() => setStep('phone')} className="flex-1 bg-white/5 py-4 rounded-[20px] text-[10px] font-black uppercase text-indigo-400">Atrás</button><button onClick={() => onOTPVerify(otp)} className="flex-[2] bg-cyan-400 text-black py-4 rounded-[20px] text-[10px] font-black uppercase border-b-4 border-cyan-700">Verificar</button></div>
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
  const [doctorInfo, setDoctorInfo] = useState({ name: '', clinic: '', trialStartedAt: null, isPremium: false });
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [trialTimeLeft, setTrialTimeLeft] = useState({ days: 0, hours: 0, expired: false });
  const [modals, setModals] = useState({ patient: false, history: false });

  const [authInProcess, setAuthInProcess] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authStep, setAuthStep] = useState('initial');
  const [confirmationResult, setConfirmationResult] = useState(null);

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
        const snap = await getDoc(docRef);
        let profileData = snap.exists() ? snap.data() : { name: '', clinic: '', trialStartedAt: Date.now(), isPremium: false };
        if (!snap.exists()) await setDoc(docRef, profileData);
        else if (!profileData.trialStartedAt) { profileData.trialStartedAt = Date.now(); await updateDoc(docRef, { trialStartedAt: profileData.trialStartedAt }); }
        setDoctorInfo(profileData);
        const calculate = () => {
          if (profileData.isPremium) return setTrialTimeLeft({ expired: false, isPremium: true });
          const start = profileData.trialStartedAt; const now = Date.now();
          const diffMs = (TRIAL_DAYS * 24 * 60 * 60 * 1000) - (now - start);
          if (diffMs <= 0) setTrialTimeLeft({ days: 0, hours: 0, expired: true });
          else setTrialTimeLeft({ days: Math.floor(diffMs / 86400000), hours: Math.floor((diffMs % 86400000) / 3600000), expired: false });
        };
        calculate(); 
      } catch (e) { console.warn("Modo offline."); } finally { setLoading(false); }
    };
    checkTrialAndSync();
    
    const unsubPat = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'patients'), (snap) => setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubApp = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), (snap) => setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => { unsubPat(); unsubApp(); };
  }, [user]);

  // FUNCIONES DE GUARDADO RÁPIDO (Fire and Forget)
  const handleUpdateProfile = async (newData) => { try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), { ...doctorInfo, ...newData }); setDoctorInfo({ ...doctorInfo, ...newData }); } catch(e) {} };
  
  const handleAddPatient = (data) => { 
    // Manda la orden a Firebase sin pausar la app
    addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'patients'), { ...data, createdAt: new Date().toISOString() })
      .catch(e => console.error("Error al registrar", e));
    
    // Cierra la ventana instantáneamente
    setModals(prev => ({ ...prev, patient: false }));
  };
  
  const handleAddHistory = (history) => { 
    if (!selectedPatientId) return;
    const pat = patients.find(p => p.id === selectedPatientId); 
    
    // Manda la orden sin pausar la app
    updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', selectedPatientId), { histories: [history, ...(pat.histories || [])] })
      .catch(e => console.error("Error al registrar", e));
      
    // Cierra la ventana instantáneamente
    setModals(prev => ({ ...prev, history: false }));
  };
  
  const handleDeletePatient = async (id) => { if (window.confirm("¿Eliminar expediente?")) { try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', id)); setSelectedPatientId(null); } catch(e) {} } };

  if (loading) return <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-cyan-400 font-black animate-pulse uppercase tracking-[1em] italic text-center"><Loader2 className="w-12 h-12 mb-4 animate-spin mx-auto"/>Iniciando Bio-Nube...</div>;
  if (!user) return <AuthScreen onGoogleLogin={() => signInWithPopup(auth, new GoogleAuthProvider())} onPhoneSubmit={async (p) => { setAuthInProcess(true); try { const v = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' }); setConfirmationResult(await signInWithPhoneNumber(auth, p, v)); setAuthStep('otp'); setAuthInProcess(false); } catch(e){ setAuthError("Error SMS"); setAuthInProcess(false); } }} onOTPVerify={async (c) => { setAuthInProcess(true); try { await confirmationResult.confirm(c); } catch(e){ setAuthError("Error OTP"); setAuthInProcess(false); } }} onStartTrial={async () => { setAuthInProcess(true); try { await signInAnonymously(auth); } catch (e) { setAuthError("Error prueba."); setAuthInProcess(false); } }} inProcess={authInProcess} error={authError} step={authStep} setStep={setAuthStep} />;
  
  if (trialTimeLeft.expired && !doctorInfo.isPremium) return <SubscriptionBlockedScreen onLogout={() => signOut(auth)} />;

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col italic overflow-hidden">
      <SpineWatermark />
      <header className="p-6 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center z-50">
        <div className="flex items-center gap-3"><div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-400/30"><SpineLogo className="w-7 h-7 text-cyan-400" /></div><h1 className="text-xl font-black uppercase tracking-tighter">Quiro<span className="text-cyan-400">App</span></h1></div>
        <div className={`px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[7px] font-black uppercase flex items-center gap-1 shadow-sm ${isOnline ? 'text-cyan-400' : 'text-rose-500'}`}>
          {isOnline ? <Cloud className="w-2 h-2" /> : <WifiOff className="w-2 h-2" />} {isOnline ? 'Sync Activo' : 'Offline'}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 z-10 pb-32">
        {selectedPatientId ? (
          <PatientProfile patient={patients.find(p => p.id === selectedPatientId)} onBack={() => setSelectedPatientId(null)} onAddHistory={() => setModals(m => ({...m, history: true}))} onDelete={() => handleDeletePatient(selectedPatientId)} />
        ) : (
          <>{activeTab === 'home' && <HomeTab appointments={appointments} patients={patients} doctorInfo={doctorInfo} onAddAppointment={() => setActiveTab('patients')} />}
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
                <button onClick={() => setModals(m => ({...m, patient: true}))} className="fixed bottom-32 right-6 w-16 h-16 bg-cyan-400 text-black rounded-[25px] shadow-2xl flex items-center justify-center active:scale-90 transition z-20 border-b-4 border-cyan-700 shadow-cyan-900/50"><Plus className="w-8 h-8" /></button>
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
              <div className="animate-fade-in space-y-6 text-left">
                <h2 className="text-3xl font-black uppercase italic mb-6 underline decoration-cyan-500 decoration-4 underline-offset-8">Ajustes</h2>
                <div className="bg-indigo-900/20 p-8 rounded-[40px] border border-cyan-400/20 space-y-6 shadow-xl">
                  <div><label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-4 mb-2 flex items-center gap-2"><User className="w-3 h-3" /> Especialista</label>
                    <input type="text" placeholder="Tu Nombre" className="w-full bg-slate-950 p-5 rounded-[25px] border border-white/10 text-white font-bold outline-none focus:border-cyan-400" value={String(doctorInfo.name)} onChange={(e) => handleUpdateProfile({ name: e.target.value })} /></div>
                  <div><label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-4 mb-2 flex items-center gap-2"><Building className="w-3 h-3" /> Clínica</label>
                    <input type="text" placeholder="Nombre Clínica" className="w-full bg-slate-950 p-5 rounded-[25px] border border-white/10 text-white font-bold outline-none focus:border-cyan-400" value={String(doctorInfo.clinic)} onChange={(e) => handleUpdateProfile({ clinic: e.target.value })} /></div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[40px] border border-white/5 text-center">
                  <UserCircle className="w-12 h-12 mx-auto mb-4 text-indigo-500" />
                  <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Cuenta actual</p>
                  <p className="text-xs font-bold text-white mb-6 break-all">{String(user.email || user.phoneNumber || "Usuario Trial")}</p>
                  <button onClick={() => signOut(auth)} className="w-full bg-rose-500/10 border-2 border-rose-500/20 py-5 rounded-[25px] flex items-center justify-center gap-3 text-rose-500 font-black uppercase italic active:scale-95 transition"><LogOut className="w-5 h-5" /> Cerrar Sesión</button>
                </div>
              </div>
            )}</>
        )}
      </main>

      {!doctorInfo.isPremium && <div className="fixed bottom-24 w-full px-6 z-40 pointer-events-none"><div className="bg-indigo-600/90 backdrop-blur-md p-3 rounded-full flex items-center justify-center gap-3 border border-white/20 shadow-xl"><Clock className="w-4 h-4 text-cyan-300 animate-pulse" /><span className="text-[9px] font-black uppercase tracking-widest text-white">Prueba: <span className="text-cyan-300">{trialTimeLeft.days}d {trialTimeLeft.hours}h restantes</span></span></div></div>}

      <nav className="fixed bottom-0 w-full p-5 pb-8 bg-slate-900/90 backdrop-blur-3xl border-t border-indigo-400/20 flex justify-around items-center z-50 shadow-2xl">
        <button onClick={() => {setActiveTab('home'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' && !selectedPatientId ? 'text-cyan-400 scale-110' : 'text-slate-500 opacity-50'}`}><Home className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Inicio</span></button>
        <button onClick={() => {setActiveTab('patients'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'patients' || selectedPatientId ? 'text-cyan-400 scale-110' : 'text-slate-500 opacity-50'}`}><Users className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Pacientes</span></button>
        <button onClick={() => {setActiveTab('marketing'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'marketing' ? 'text-cyan-400 scale-110' : 'text-slate-500 opacity-50'}`}><Megaphone className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Marketing</span></button>
        <button onClick={() => {setActiveTab('settings'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-cyan-400 scale-110' : 'text-slate-500 opacity-50'}`}><Settings className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Ajustes</span></button>
      </nav>

      {modals.patient && <NewPatientModal onClose={() => setModals(m => ({...m, patient: false}))} onSave={handleAddPatient} />}
      {modals.history && <NewHistoryModal onClose={() => setModals(m => ({...m, history: false}))} onSave={handleAddHistory} />}
      
      <style dangerouslySetInnerHTML={{__html: `@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-slide-up { animation: slideUp 0.4s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }`}} />
    </div>
  );
}
