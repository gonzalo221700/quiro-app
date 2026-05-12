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
  Fingerprint
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
const apiKey = ""; // Pega aquí tu API Key de Gemini para activar la IA

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
  <div className="fixed inset-0 pointer-events-none flex justify-center items-center opacity-[0.04] z-0 overflow-hidden">
    <svg viewBox="0 0 200 800" className="h-[120%] w-auto text-cyan-400">
      <path d="M100,50 Q120,50 120,70 T100,90 T80,110 T100,130 T120,150 T100,170 T80,190 T100,210 T120,230 T100,250 T80,270 T100,290 T120,310 T100,330 T80,350 T100,370 T120,390 T100,410 T80,430 T100,450 T120,470 T100,490 T80,510 T100,530 T120,550 T100,570 T80,590 T100,610 T120,630 T100,650 T80,670 T100,690 T120,710 T100,730 T80,750" stroke="currentColor" strokeWidth="12" fill="none" />
    </svg>
  </div>
);

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
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 leading-none">Quiro<span className="text-cyan-400 font-bold">App</span></h2>
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
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.02 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Vincular con Google
                </button>
                
                <div className="flex items-center gap-4 py-2 opacity-30">
                  <div className="flex-1 h-[1px] bg-white"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">O</span>
                  <div className="flex-1 h-[1px] bg-white"></div>
                </div>

                <div className="bg-indigo-950/40 p-1 rounded-[35px] border border-white/10 backdrop-blur-sm shadow-inner">
                  <div className="flex items-center bg-slate-900 rounded-[30px] p-2 border border-indigo-500/30">
                     <div className="pl-4 pr-2 text-indigo-400"><Phone className="w-4 h-4" /></div>
                     <input 
                      type="tel" 
                      placeholder="+52 123 456 7890" 
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
                <p className="text-[8px] text-indigo-500 uppercase tracking-tighter mt-2 font-bold">Registro por número telefónico.</p>
              </div>
            )}

            {step === 'otp' && (
              <div className="bg-indigo-900/20 p-8 rounded-[40px] border border-cyan-400/30">
                <CheckCircle2 className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-lg font-black uppercase mb-4 tracking-widest">Código SMS</h3>
                <input 
                  type="number" 
                  placeholder="------" 
                  autoFocus
                  className="w-full bg-slate-950 p-5 rounded-[25px] text-center text-3xl font-black tracking-[0.5em] text-cyan-400 outline-none border-2 border-indigo-800 focus:border-cyan-500 transition-all mb-4"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={() => setStep('initial')} className="flex-1 bg-white/5 py-4 rounded-[20px] text-[10px] font-black uppercase text-indigo-400 active:scale-95">Atrás</button>
                  <button onClick={() => onOTPVerify(otp)} className="flex-[2] bg-cyan-400 text-black py-4 rounded-[20px] text-[10px] font-black uppercase border-b-4 border-cyan-700 active:scale-95">Verificar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="fixed bottom-10 text-indigo-700 text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Multi-Device Cloud Sync v3.0</p>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInProcess, setAuthInProcess] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authStep, setAuthStep] = useState('initial');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState({ name: 'Especialista', clinic: 'QuiroClínica Pro' });

  // Escuchar estado de usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setAuthInProcess(false);
    });
    return () => unsubscribe();
  }, []);

  // Login Google
  const handleGoogleLogin = async () => {
    setAuthInProcess(true);
    setAuthError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError("Dominio no autorizado. Debes agregar esta URL en la consola de Firebase.");
      } else {
        setAuthError("Fallo en la conexión con Google.");
      }
      setAuthInProcess(false);
    }
  };

  // Login Teléfono: Paso 1
  const handlePhoneSubmit = async (phone) => {
    if (!phone || phone.length < 10) return setAuthError("Ingresa un número válido con código de país (Ej: +52...)");
    setAuthInProcess(true);
    setAuthError("");
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
      }
      const confirmation = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setAuthStep('otp');
      setAuthInProcess(false);
    } catch (err) {
      console.error(err);
      setAuthError("No se pudo enviar el SMS. Intenta de nuevo en un minuto.");
      setAuthInProcess(false);
    }
  };

  // Login Teléfono: Paso 2
  const handleOTPVerify = async (code) => {
    if (!code || code.length < 6) return setAuthError("Ingresa el código completo.");
    setAuthInProcess(true);
    setAuthError("");
    try {
      await confirmationResult.confirm(code);
    } catch (err) {
      setAuthError("Código incorrecto o expirado.");
      setAuthInProcess(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-cyan-400">
      <Loader2 className="w-12 h-12 animate-spin mb-4 opacity-50" />
      <div className="font-black text-[10px] tracking-[1em] uppercase animate-pulse">Sincronizando Bio-Nube...</div>
    </div>
  );

  if (!user) {
    return (
      <AuthScreen 
        onGoogleLogin={handleGoogleLogin} 
        onPhoneSubmit={handlePhoneSubmit}
        onOTPVerify={handleOTPVerify}
        inProcess={authInProcess} 
        error={authError}
        step={authStep}
        setStep={setAuthStep}
      />
    );
  }

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col italic overflow-hidden">
      <SpineWatermark />
      
      <header className="p-6 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <SpineLogo className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Quiro<span className="text-cyan-400">App</span></h1>
        </div>
        <button onClick={handleLogout} className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl active:scale-90 transition border border-rose-500/20"><LogOut className="w-5 h-5" /></button>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center z-10 animate-fade-in">
         <div className="bg-indigo-900/20 p-12 rounded-[50px] border border-cyan-400/20 shadow-[0_0_60px_rgba(34,211,238,0.1)] relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-20 transition-opacity"><SpineLogo className="w-64 h-64" /></div>
            <ShieldCheck className="w-24 h-24 text-cyan-400 mx-auto mb-8 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)]" />
            <h2 className="text-4xl font-black uppercase italic mb-2 tracking-tighter">Sesión <span className="text-cyan-400">Activa</span></h2>
            <p className="text-indigo-300 text-sm mb-8 font-medium">Conectado mediante: <br/>
              <span className="text-white font-black text-lg underline decoration-cyan-500 underline-offset-4">
                {user.email || user.phoneNumber || "Perfil Local"}
              </span>
            </p>
            <div className="bg-slate-950/60 p-5 rounded-[25px] text-[9px] text-indigo-500 font-mono break-all border border-indigo-900/50">BIO-ID: {user.uid}</div>
         </div>
         <div className="mt-12 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Cloud className="w-4 h-4 text-cyan-400 animate-bounce" />
              <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em]">Sincronización en Tiempo Real</p>
            </div>
            <div className="flex gap-2 justify-center opacity-40">
               <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase">Windows</span>
               <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase">iPhone</span>
               <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase">Web</span>
            </div>
         </div>
      </main>

      <nav className="p-5 pb-8 bg-slate-900/90 backdrop-blur-3xl border-t border-indigo-400/20 flex justify-around items-center z-50">
        <button className="flex flex-col items-center gap-1.5 text-cyan-400"><div className="p-3 bg-cyan-400/10 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.2)] border border-cyan-400/20"><Home className="w-6 h-6" /></div><span className="text-[9px] font-black uppercase tracking-tighter">Inicio</span></button>
        <button className="flex flex-col items-center gap-1.5 text-slate-500 opacity-50"><div className="p-3"><Users className="w-6 h-6" /></div><span className="text-[9px] font-black uppercase tracking-tighter">Pacientes</span></button>
        <button className="flex flex-col items-center gap-1.5 text-slate-500 opacity-50"><div className="p-3"><CalendarIcon className="w-6 h-6" /></div><span className="text-[9px] font-black uppercase tracking-tighter">Agenda</span></button>
        <button className="flex flex-col items-center gap-1.5 text-slate-500 opacity-50"><div className="p-3"><Settings className="w-6 h-6" /></div><span className="text-[9px] font-black uppercase tracking-tighter">Perfil</span></button>
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
      `}} />
    </div>
  );
}
