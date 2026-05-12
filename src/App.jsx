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
  query
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
  Bone
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
const apiKey = ""; // Pega aquí tu API Key de Gemini

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

// --- UTILIDADES ---
const openWhatsApp = (phone, message = "") => {
  if (!phone) return;
  const cleanPhone = String(phone).replace(/\D/g, '');
  window.open(`https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`, '_blank');
};

const safeFormatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch (e) { return dateStr; }
};

// --- PANTALLA DE ACCESO ---
const AuthScreen = ({ onGoogleLogin, onPhoneSubmit, onOTPVerify, inProcess, error, step, setStep }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#020617] p-6 text-center relative overflow-hidden text-white italic">
      <SpineWatermark />
      <div id="recaptcha-container"></div>
      
      <div className="mb-8 z-10 animate-fade-in">
        <div className="bg-gradient-to-tr from-cyan-400 to-indigo-700 p-8 rounded-[40px] inline-block mb-6 shadow-2xl border border-white/20">
          <SpineLogo className="w-14 h-14 text-white" />
        </div>
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 leading-none text-white">Quiro<span className="text-cyan-400 font-bold">App</span></h2>
        <p className="text-indigo-400 font-black tracking-[0.4em] uppercase text-[9px] opacity-60">Sincronización Clínica Global</p>
      </div>

      <div className="w-full max-w-sm space-y-4 z-10 relative">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 p-4 rounded-2xl text-rose-400 text-[10px] mb-4 text-left animate-pulse">
            <ShieldAlert className="w-4 h-4 inline mr-2" /> {error}
          </div>
        )}

        {inProcess ? (
          <div className="p-10 bg-white/5 rounded-[45px] border border-white/10 backdrop-blur-md flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
            <p className="text-cyan-200 font-black tracking-widest text-[10px] uppercase">Enlazando Bio-Datos...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up">
            {step === 'initial' && (
              <div className="flex flex-col gap-3">
                <button onClick={onGoogleLogin} className="w-full bg-white text-black py-4 rounded-[25px] font-black flex items-center justify-center gap-3 transition border-b-[6px] border-gray-300 uppercase shadow-xl active:scale-95 text-xs sm:text-sm">
                  <Globe className="w-5 h-5" /> Vincular con Google
                </button>
                
                <div className="flex items-center gap-4 py-2 opacity-30">
                  <div className="flex-1 h-[1px] bg-white"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">O</span>
                  <div className="flex-1 h-[1px] bg-white"></div>
                </div>

                <div className="bg-indigo-950/40 p-1 rounded-[35px] border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center bg-slate-900 rounded-[30px] p-2 border border-indigo-500/30">
                     <div className="pl-4 pr-2 text-indigo-400"><Phone className="w-4 h-4" /></div>
                     <input 
                      type="tel" 
                      placeholder="+52..." 
                      className="bg-transparent flex-1 p-3 outline-none text-white font-bold text-sm"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                     />
                     <button 
                      onClick={() => onPhoneSubmit(phoneNumber)}
                      className="bg-cyan-500 text-black px-5 py-3 rounded-full font-black text-[10px] uppercase border-b-4 border-cyan-700 active:scale-95 transition"
                     >
                        SMS
                     </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'otp' && (
              <div className="bg-indigo-900/20 p-8 rounded-[40px] border border-cyan-400/30">
                <h3 className="text-lg font-black uppercase mb-4 tracking-widest">Código SMS</h3>
                <input 
                  type="number" 
                  placeholder="------" 
                  autoFocus
                  className="w-full bg-slate-950 p-5 rounded-[25px] text-center text-3xl font-black text-cyan-400 outline-none border-2 border-indigo-800 focus:border-cyan-500 mb-4"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={() => setStep('initial')} className="flex-1 bg-white/5 py-4 rounded-[20px] text-[10px] font-black uppercase text-indigo-400">Atrás</button>
                  <button onClick={() => onOTPVerify(otp)} className="flex-[2] bg-cyan-400 text-black py-4 rounded-[20px] text-[10px] font-black uppercase border-b-4 border-cyan-700">Verificar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTES DE PESTAÑAS ---

const HomeTab = ({ appointments, patients, doctorName, onAddAppointment }) => {
  const today = new Date().toISOString().split('T')[0];
  const todays = appointments.filter(a => a.date === today);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="bg-gradient-to-br from-indigo-700 to-black p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden">
        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-2">Bienvenido Especialista</p>
        <h2 className="text-4xl font-black italic text-white leading-none">Dr. {doctorName}</h2>
        <div className="absolute -bottom-10 -right-10 opacity-10"><SpineLogo className="w-48 h-48" /></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-6 rounded-[30px] border border-white/5">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Pacientes</p>
          <p className="text-3xl font-black text-white">{patients.length}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[30px] border border-white/5">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Citas Hoy</p>
          <p className="text-3xl font-black text-white">{todays.length}</p>
        </div>
      </div>

      <div className="bg-indigo-950/20 p-6 rounded-[40px] border border-indigo-500/20">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black uppercase italic text-white">Agenda de Hoy</h3>
          <button onClick={onAddAppointment} className="p-2 bg-cyan-400 text-black rounded-full active:scale-90 transition"><Plus className="w-5 h-5" /></button>
        </div>
        {todays.length === 0 ? (
          <p className="text-center py-8 text-indigo-500 font-bold text-xs uppercase italic tracking-widest">Sin citas programadas</p>
        ) : (
          todays.map(app => (
            <div key={app.id} className="bg-slate-900/50 p-4 rounded-3xl border border-white/5 mb-3 flex items-center justify-between">
              <div>
                <p className="text-white font-black uppercase italic">{patients.find(p => p.id === app.patientId)?.name || 'Cargando...'}</p>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">{app.time}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo-800" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState({ name: 'Especialista', clinic: 'QuiroClínica Pro' });
  
  const [authInProcess, setAuthInProcess] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authStep, setAuthStep] = useState('initial');
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setAuthInProcess(false);
    });
    return () => unsubscribe();
  }, []);

  // Carga de datos real de Firestore vinculada al userId
  useEffect(() => {
    if (!user) return;

    // Escuchar Pacientes
    const unsubPat = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'patients'), (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error Firestore Pacientes:", err));

    // Escuchar Citas
    const unsubApp = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error Firestore Citas:", err));

    return () => { unsubPat(); unsubApp(); };
  }, [user]);

  const handleGoogleLogin = async () => {
    setAuthInProcess(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setAuthError("No se pudo conectar con Google. Verifica el dominio.");
      setAuthInProcess(false);
    }
  };

  const handlePhoneSubmit = async (phone) => {
    if (!phone) return setAuthError("Ingresa tu número.");
    setAuthInProcess(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const confirmation = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setAuthStep('otp');
      setAuthInProcess(false);
    } catch (err) {
      setAuthError("Fallo al enviar SMS.");
      setAuthInProcess(false);
    }
  };

  const handleOTPVerify = async (code) => {
    setAuthInProcess(true);
    try {
      await confirmationResult.confirm(code);
    } catch (err) {
      setAuthError("Código incorrecto.");
      setAuthInProcess(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-cyan-400">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[1em]">Iniciando Bio-Nube</p>
    </div>
  );

  if (!user) {
    return <AuthScreen onGoogleLogin={handleGoogleLogin} onPhoneSubmit={handlePhoneSubmit} onOTPVerify={handleOTPVerify} inProcess={authInProcess} error={authError} step={authStep} setStep={setAuthStep} />;
  }

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col italic overflow-hidden">
      <SpineWatermark />
      
      <header className="p-6 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <SpineLogo className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          <h1 className="text-xl font-black uppercase tracking-tighter">Quiro<span className="text-cyan-400">App</span></h1>
        </div>
        <button onClick={() => signOut(auth)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition"><LogOut className="w-5 h-5" /></button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 z-10 pb-24">
        {activeTab === 'home' && <HomeTab appointments={appointments} patients={patients} doctorName={doctorInfo.name} onAddAppointment={() => setActiveTab('appointments')} />}
        {activeTab === 'patients' && (
          <div className="animate-fade-in space-y-4">
            <h2 className="text-3xl font-black uppercase italic mb-6 underline decoration-cyan-500 decoration-4 underline-offset-8">Pacientes</h2>
            {patients.map(p => (
              <div key={p.id} className="bg-slate-900/50 p-5 rounded-[30px] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-black text-white uppercase italic text-lg">{p.name}</p>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{p.phone}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-cyan-400" />
              </div>
            ))}
            <button className="fixed bottom-24 right-6 w-16 h-16 bg-cyan-400 text-black rounded-[25px] shadow-2xl flex items-center justify-center active:scale-90 transition"><Plus className="w-8 h-8" /></button>
          </div>
        )}
        {activeTab === 'marketing' && (
          <div className="animate-fade-in space-y-6 text-center py-10">
            <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-black uppercase italic text-white">Marketing IA</h2>
            <p className="text-indigo-300 text-sm italic">Generador de contenido clínico listo para usar.</p>
            <div className="bg-slate-900 p-8 rounded-[40px] border border-white/5 text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em]">Configura tu API Key de Gemini para activar</div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 w-full p-5 pb-8 bg-slate-900/90 backdrop-blur-3xl border-t border-indigo-400/20 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-cyan-400 scale-110' : 'text-slate-500 opacity-50'}`}>
          <Home className="w-6 h-6" /><span className="text-[8px] font-black uppercase tracking-tighter">Inicio</span>
        </button>
        <button onClick={() => setActiveTab('patients')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'patients' ? 'text-cyan-400 scale-110' : 'text-slate-500 opacity-50'}`}>
          <Users className="w-6 h-6" /><span className="text-[8px] font-black uppercase tracking-tighter">Pacientes</span>
        </button>
        <button onClick={() => setActiveTab('marketing')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'marketing' ? 'text-cyan-400 scale-110' : 'text-slate-500 opacity-50'}`}>
          <Megaphone className="w-6 h-6" /><span className="text-[8px] font-black uppercase tracking-tighter">Marketing</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500 opacity-50">
          <Settings className="w-6 h-6" /><span className="text-[8px] font-black uppercase tracking-tighter">Perfil</span>
        </button>
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
      `}} />
    </div>
  );
}
