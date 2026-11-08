import React, { useState, useEffect, lazy, Suspense } from 'react';
import './index.css';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signInWithRedirect, getRedirectResult, EmailAuthProvider, linkWithCredential, linkWithPopup } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocFromServer, onSnapshot, addDoc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { Home, Calendar as CalendarIcon, Users, Plus, X, ChevronRight, Search, Sparkles, Loader2, Settings, MessageSquare, LogOut, Globe, ClipboardList, BookOpen, Target, Cloud, Trash2, Lock, Activity, ShieldAlert, ShieldCheck, Mail, CheckCircle2, Ruler, Weight, UserCircle, Building, User, CreditCard, Clock, PlayCircle, WifiOff, HeartPulse, CalendarPlus, AlertTriangle, KeyRound, Copy, TerminalSquare, Upload, ImagePlus, Image as ImageIcon, Download, AlertOctagon, FileText, Stethoscope, Palette, ChevronDown, Pencil } from 'lucide-react';
import { auth, db, appId, TRIAL_DAYS, MAX_TRIAL_PATIENTS } from './lib/firebase.js';
import { openWhatsApp, generateSecureCode, authErrorMessage, safeFormatDate, calculateAge, generateClinicalHTML, CLINIC_THEMES, RED_FLAGS, CHIRO_TECHNIQUES, POSTURAL_DEVIATIONS } from './lib/utils.js';

const TechniquesTab = lazy(() => import('./components/TechniquesTab.jsx'));



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

const MultiSelectDropdown = ({ title, icon: Icon, items, selectedItems, toggleItem, isDanger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeStyle = isDanger 
    ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-105' 
    : 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105';
  
  return (
    <div className="bg-slate-900/50 rounded-[25px] border border-white/5 overflow-hidden transition-all">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-5 flex justify-between items-center text-left hover:bg-slate-800/50 transition">
        <span className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-2 tracking-widest">
          {Icon && <Icon className="w-4 h-4"/>} {title} {selectedItems.length > 0 && <span className={isDanger ? 'text-rose-400' : 'text-cyan-400'}>({selectedItems.length})</span>}
        </span>
        <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 pt-0 flex flex-wrap gap-2 border-t border-white/5 mt-4">
          {items.map(item => (
            <button type="button" key={item} onClick={() => toggleItem(item)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all ${selectedItems.includes(item) ? activeStyle : 'bg-slate-950 text-slate-400 border-white/5 hover:bg-slate-800'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AnatomyMap = ({ selectedAreas, toggleArea }) => {
  const isSelected = (area) => selectedAreas.includes(area);
  const getFill = (area) => isSelected(area) ? "rgba(34, 211, 238, 0.4)" : "rgba(15, 23, 42, 0.1)"; 
  const getStroke = (area) => isSelected(area) ? "#06b6d4" : "#64748b";
  const getTextColor = (area) => isSelected(area) ? "#06b6d4" : "#64748b";

  return (
    <div className="flex flex-col items-center w-full overflow-hidden my-6">
       <h4 className="text-[12px] font-black uppercase text-indigo-500 mb-6 tracking-widest w-full text-center sm:text-left flex justify-center sm:justify-start items-center gap-2"><Target className="w-4 h-4"/> Mapa Clínico Anatómico</h4>
       
       <div className="w-full overflow-x-auto pb-6 scrollbar-hide">
         <div className="min-w-[650px] mx-auto">
           <svg viewBox="0 0 900 600" className="w-full h-[400px]">
             
             {/* ANTERIOR */}
             <text x="150" y="580" textAnchor="middle" fill="#64748b" fontSize="16" fontWeight="900" letterSpacing="2">ANTERIOR</text>
             <circle cx="150" cy="80" r="35" fill="none" stroke="#64748b" strokeWidth="4" />
             <path d="M 135 115 L 165 115 L 165 140 L 135 140 Z" fill="none" stroke="#64748b" strokeWidth="4" />

             <g onClick={() => toggleArea('Hombro Der.')} className="cursor-pointer hover:opacity-80 transition-all">
               <circle cx="85" cy="150" r="25" fill={getFill('Hombro Der.')} stroke={getStroke('Hombro Der.')} strokeWidth="4" />
               <text x="85" y="155" textAnchor="middle" fontSize="11" fill={getTextColor('Hombro Der.')} fontWeight="bold">H. DER</text>
             </g>

             <g onClick={() => toggleArea('Hombro Izq.')} className="cursor-pointer hover:opacity-80 transition-all">
               <circle cx="215" cy="150" r="25" fill={getFill('Hombro Izq.')} stroke={getStroke('Hombro Izq.')} strokeWidth="4" />
               <text x="215" y="155" textAnchor="middle" fontSize="11" fill={getTextColor('Hombro Izq.')} fontWeight="bold">H. IZQ</text>
             </g>

             <g onClick={() => toggleArea('Brazo Der.')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="65" y="180" width="40" height="120" rx="20" fill={getFill('Brazo Der.')} stroke={getStroke('Brazo Der.')} strokeWidth="4" />
               <text x="85" y="245" textAnchor="middle" fontSize="11" fill={getTextColor('Brazo Der.')} fontWeight="bold" transform="rotate(-90 85 245)">BRAZO D.</text>
             </g>

             <g onClick={() => toggleArea('Brazo Izq.')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="195" y="180" width="40" height="120" rx="20" fill={getFill('Brazo Izq.')} stroke={getStroke('Brazo Izq.')} strokeWidth="4" />
               <text x="215" y="245" textAnchor="middle" fontSize="11" fill={getTextColor('Brazo Izq.')} fontWeight="bold" transform="rotate(90 215 245)">BRAZO I.</text>
             </g>

             <g onClick={() => toggleArea('Mano Der.')} className="cursor-pointer hover:opacity-80 transition-all">
               <circle cx="85" cy="325" r="20" fill={getFill('Mano Der.')} stroke={getStroke('Mano Der.')} strokeWidth="4" />
               <text x="85" y="330" textAnchor="middle" fontSize="10" fill={getTextColor('Mano Der.')} fontWeight="bold">MANO</text>
             </g>

             <g onClick={() => toggleArea('Mano Izq.')} className="cursor-pointer hover:opacity-80 transition-all">
               <circle cx="215" cy="325" r="20" fill={getFill('Mano Izq.')} stroke={getStroke('Mano Izq.')} strokeWidth="4" />
               <text x="215" y="330" textAnchor="middle" fontSize="10" fill={getTextColor('Mano Izq.')} fontWeight="bold">MANO</text>
             </g>

             <path d="M 105 140 L 195 140 L 180 300 L 120 300 Z" fill="none" stroke="#64748b" strokeWidth="4" />

             <g onClick={() => toggleArea('Pelvis')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 115 300 L 185 300 L 195 340 L 150 370 L 105 340 Z" fill={getFill('Pelvis')} stroke={getStroke('Pelvis')} strokeWidth="4" strokeLinejoin="round" />
               <text x="150" y="330" textAnchor="middle" fontSize="12" fill={getTextColor('Pelvis')} fontWeight="bold">PELVIS</text>
             </g>

             <g onClick={() => toggleArea('Pierna Der.')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="105" y="350" width="35" height="150" rx="17" fill={getFill('Pierna Der.')} stroke={getStroke('Pierna Der.')} strokeWidth="4" />
               <text x="122" y="430" textAnchor="middle" fontSize="11" fill={getTextColor('Pierna Der.')} fontWeight="bold" transform="rotate(-90 122 430)">PIERNA D.</text>
             </g>

             <g onClick={() => toggleArea('Pierna Izq.')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="160" y="350" width="35" height="150" rx="17" fill={getFill('Pierna Izq.')} stroke={getStroke('Pierna Izq.')} strokeWidth="4" />
               <text x="177" y="430" textAnchor="middle" fontSize="11" fill={getTextColor('Pierna Izq.')} fontWeight="bold" transform="rotate(90 177 430)">PIERNA I.</text>
             </g>

             <g onClick={() => toggleArea('Pie Der.')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 100 500 L 140 500 L 145 525 L 95 525 Z" fill={getFill('Pie Der.')} stroke={getStroke('Pie Der.')} strokeWidth="4" strokeLinejoin="round" />
               <text x="120" y="518" textAnchor="middle" fontSize="10" fill={getTextColor('Pie Der.')} fontWeight="bold">PIE</text>
             </g>

             <g onClick={() => toggleArea('Pie Izq.')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 160 500 L 200 500 L 205 525 L 155 525 Z" fill={getFill('Pie Izq.')} stroke={getStroke('Pie Izq.')} strokeWidth="4" strokeLinejoin="round" />
               <text x="180" y="518" textAnchor="middle" fontSize="10" fill={getTextColor('Pie Izq.')} fontWeight="bold">PIE</text>
             </g>

             {/* LATERAL */}
             <text x="450" y="580" textAnchor="middle" fill="#64748b" fontSize="16" fontWeight="900" letterSpacing="2">LATERAL</text>
             <ellipse cx="460" cy="80" rx="30" ry="35" fill="none" stroke="#64748b" strokeWidth="4" />
             
             <g onClick={() => toggleArea('Cervical')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 445 110 L 470 110 L 475 140 L 440 140 Z" fill={getFill('Cervical')} stroke={getStroke('Cervical')} strokeWidth="4" strokeLinejoin="round" />
               <text x="485" y="130" textAnchor="start" fontSize="12" fill={getTextColor('Cervical')} fontWeight="bold">CERV.</text>
             </g>

             <path d="M 430 140 L 485 140 L 495 240 L 420 240 Z" fill="none" stroke="#64748b" strokeWidth="4" strokeLinejoin="round" />

             <g onClick={() => toggleArea('Lumbar')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 420 240 L 495 240 L 490 300 L 425 300 Z" fill={getFill('Lumbar')} stroke={getStroke('Lumbar')} strokeWidth="4" strokeLinejoin="round" />
               <text x="505" y="275" textAnchor="start" fontSize="12" fill={getTextColor('Lumbar')} fontWeight="bold">LUMB.</text>
             </g>

             <g onClick={() => toggleArea('Pelvis')} className="cursor-pointer hover:opacity-80 transition-all">
               <ellipse cx="455" cy="320" rx="40" ry="30" fill={getFill('Pelvis')} stroke={getStroke('Pelvis')} strokeWidth="4" />
               <text x="455" y="325" textAnchor="middle" fontSize="12" fill={getTextColor('Pelvis')} fontWeight="bold">PELVIS</text>
             </g>

             <rect x="435" y="350" width="40" height="150" rx="20" fill="none" stroke="#64748b" strokeWidth="4" />
             <path d="M 435 500 L 475 500 L 495 525 L 430 525 Z" fill="none" stroke="#64748b" strokeWidth="4" strokeLinejoin="round" />
             <rect x="440" y="150" width="30" height="110" rx="15" fill="none" stroke="#64748b" strokeWidth="4" />
             <circle cx="455" cy="275" r="15" fill="none" stroke="#64748b" strokeWidth="4" />

             {/* POSTERIOR */}
             <text x="750" y="580" textAnchor="middle" fill="#64748b" fontSize="16" fontWeight="900" letterSpacing="2">POSTERIOR</text>
             <circle cx="750" cy="80" r="35" fill="none" stroke="#64748b" strokeWidth="4" />

             <g onClick={() => toggleArea('Cervical')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="730" y="115" width="40" height="30" rx="8" fill={getFill('Cervical')} stroke={getStroke('Cervical')} strokeWidth="4" />
               <text x="750" y="135" textAnchor="middle" fontSize="11" fill={getTextColor('Cervical')} fontWeight="bold">CERV</text>
             </g>

             <circle cx="685" cy="150" r="25" fill="none" stroke="#64748b" strokeWidth="4" />
             <circle cx="815" cy="150" r="25" fill="none" stroke="#64748b" strokeWidth="4" />
             <rect x="665" y="180" width="40" height="120" rx="20" fill="none" stroke="#64748b" strokeWidth="4" />
             <rect x="795" y="180" width="40" height="120" rx="20" fill="none" stroke="#64748b" strokeWidth="4" />
             <circle cx="685" cy="325" r="20" fill="none" stroke="#64748b" strokeWidth="4" />
             <circle cx="815" cy="325" r="20" fill="none" stroke="#64748b" strokeWidth="4" />

             <g onClick={() => toggleArea('Dorsal')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="710" y="150" width="80" height="90" rx="15" fill={getFill('Dorsal')} stroke={getStroke('Dorsal')} strokeWidth="4" />
               <text x="750" y="200" textAnchor="middle" fontSize="14" fill={getTextColor('Dorsal')} fontWeight="bold">DORSAL</text>
             </g>

             <g onClick={() => toggleArea('Lumbar')} className="cursor-pointer hover:opacity-80 transition-all">
               <rect x="720" y="245" width="60" height="60" rx="12" fill={getFill('Lumbar')} stroke={getStroke('Lumbar')} strokeWidth="4" />
               <text x="750" y="280" textAnchor="middle" fontSize="12" fill={getTextColor('Lumbar')} fontWeight="bold">LUMBAR</text>
             </g>

             <g onClick={() => toggleArea('Pelvis')} className="cursor-pointer hover:opacity-80 transition-all">
               <path d="M 710 310 L 790 310 L 750 360 Z" fill={getFill('Pelvis')} stroke={getStroke('Pelvis')} strokeWidth="4" strokeLinejoin="round" />
               <text x="750" y="330" textAnchor="middle" fontSize="10" fill={getTextColor('Pelvis')} fontWeight="bold">SACRO</text>
             </g>

             <rect x="705" y="350" width="35" height="150" rx="17" fill="none" stroke="#64748b" strokeWidth="4" />
             <rect x="760" y="350" width="35" height="150" rx="17" fill="none" stroke="#64748b" strokeWidth="4" />
             <path d="M 700 500 L 740 500 L 745 525 L 695 525 Z" fill="none" stroke="#64748b" strokeWidth="4" strokeLinejoin="round" />
             <path d="M 760 500 L 800 500 L 805 525 L 755 525 Z" fill="none" stroke="#64748b" strokeWidth="4" strokeLinejoin="round" />

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

const HomeTab = ({ appointments, patients, doctorInfo, onAddAppointment, onOpenCalendar, onUpgrade, onNewPatient, onBackup, onGoTechniques }) => {
  const today = new Date().toISOString().split('T')[0];
  const todays = appointments.filter(a => String(a.date) === today).sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
  const nowTime = new Date().toTimeString().slice(0, 5);
  const nextToday = todays.find(a => String(a.time || '') >= nowTime) || todays[0];
  const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const monday = new Date(); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const weekCount = appointments.filter(a => String(a.date) >= isoLocal(monday) && String(a.date) <= isoLocal(sunday)).length;
  const totalSessions = patients.reduce((n, p) => n + (Array.isArray(p.history) ? p.history.length : 0), 0);
  const upcoming = appointments.filter(a => String(a.date) > today).sort((a, b) => (String(a.date) + String(a.time || '')).localeCompare(String(b.date) + String(b.time || ''))).slice(0, 3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = String(doctorInfo.name || 'Especialista').split(' ')[0];
  const dateLong = (() => { const s = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }); return s.charAt(0).toUpperCase() + s.slice(1); })();
  const fmtUpcoming = (ds) => { const s = new Date(ds + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }); return s.charAt(0).toUpperCase() + s.slice(1); };
  const kpiCard = "bg-white rounded-2xl border border-slate-300 shadow-[0_8px_22px_rgba(8,48,57,0.09)] p-5";
  const kpiLabel = "text-[10px] font-black text-slate-400 uppercase tracking-[0.14em] mb-1.5";
  const kpiNum = "text-[28px] leading-none font-extrabold text-[#0b2b31]";
  const qaBtn = "flex items-center gap-2.5 bg-[#f2f6f4] hover:bg-[#e9f1ee] border border-slate-200/70 rounded-xl px-3 py-3 transition active:scale-[0.98] text-left";
  const qaIcon = "w-8 h-8 rounded-lg bg-[#dcebe7] text-[#0b3b42] flex items-center justify-center flex-none";

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <p className="text-[#b08d3e] text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">{String(doctorInfo.clinic || (doctorInfo.isPremium ? "QuiroClínica Pro" : "QuiroClínica (Prueba)"))}</p>
        <h2 className="text-[32px] font-extrabold text-[#0b2b31] leading-none tracking-tight">{greeting}, {firstName}</h2>
        <p className="text-slate-500 text-sm mt-2">{dateLong} · Esto es lo que pasa hoy en tu consultorio</p>
      </div>

      {!doctorInfo.isPremium && (<div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center justify-between shadow-sm gap-4"><div><h4 className="text-amber-700 font-black uppercase text-sm flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Prueba Activa</h4><p className="text-[10px] text-amber-600/80 mt-1 uppercase tracking-widest font-bold">Activa PRO y libera todo el potencial</p></div><button onClick={onUpgrade} className="bg-amber-500 text-[#fff] px-4 py-3 rounded-xl font-black uppercase text-[10px] active:scale-95 transition shadow flex-none">Obtener PRO</button></div>)}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={kpiCard}><p className={kpiLabel}>Pacientes</p><p className={kpiNum}>{String(patients.length)}{!doctorInfo.isPremium && <span className="text-xs text-amber-500 font-bold"> / {MAX_TRIAL_PATIENTS}</span>}</p><p className="text-[11px] text-slate-400 font-semibold mt-1.5">expedientes activos</p></div>
        <div className={kpiCard}><p className={kpiLabel}>Citas Hoy</p><p className={kpiNum}>{String(todays.length)}</p><p className="text-[11px] text-slate-400 font-semibold mt-1.5">{nextToday ? `siguiente: ${String(nextToday.time)}` : 'sin más por hoy'}</p></div>
        <div className={kpiCard}><p className={kpiLabel}>Esta Semana</p><p className={kpiNum}>{String(weekCount)}</p><p className="text-[11px] text-slate-400 font-semibold mt-1.5">citas agendadas</p></div>
        <div className={kpiCard}><p className={kpiLabel}>Sesiones</p><p className={kpiNum}>{String(totalSessions)}</p><p className="text-[11px] text-slate-400 font-semibold mt-1.5">registradas en expedientes</p></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-300 shadow-[0_8px_22px_rgba(8,48,57,0.09)] p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-extrabold text-[#0b2b31]">Agenda del Día</h3>
            <div className="flex gap-2">
              <button onClick={onOpenCalendar} className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-[#0b3b42] rounded-xl active:scale-95 transition text-[11px] font-black uppercase"><CalendarIcon className="w-4 h-4" /> <span className="hidden sm:inline">Calendario</span></button>
              <button onClick={onAddAppointment} className="flex items-center gap-2 px-3.5 py-2.5 bg-[#0b3b42] text-[#fff] rounded-xl active:scale-95 transition text-[11px] font-black uppercase shadow"><Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva Cita</span></button>
            </div>
          </div>
          {todays.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList className="w-11 h-11 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-extrabold text-sm">Sin citas para hoy</p>
              <p className="text-slate-400 text-xs mt-1.5 mb-5">Agenda la primera desde el expediente de un paciente.</p>
              <button onClick={onAddAppointment} className="px-4 py-2.5 bg-[#0b3b42] text-[#fff] rounded-xl text-[11px] font-black uppercase active:scale-95 transition">Ir a Pacientes</button>
            </div>
          ) : (todays.map(app => {
            const pInfo = patients.find(p => p.id === app.patientId);
            const pName = pInfo?.name || 'Desconocido';
            const pPhone = pInfo?.phone;
            return (
              <div key={app.id} className="py-3.5 border-b border-slate-100 last:border-none flex items-center gap-4">
                <span className="bg-[#eef5f2] text-[#0b3b42] font-extrabold text-xs rounded-lg px-2.5 py-1.5 w-[64px] text-center flex-none">{String(app.time)}</span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{pName}</p>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{pPhone ? String(pPhone) : 'Cita programada'}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-auto flex-none">
                  {pPhone && (
                    <button onClick={(e) => { e.stopPropagation(); openWhatsApp(pPhone, `Hola ${pName}, te escribimos de ${doctorInfo.clinic || 'la clínica'} para recordarte tu ajuste quiropráctico programado para hoy a las ${app.time}. ¡Te esperamos!`); }} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 active:scale-90 transition border border-emerald-100" title="Recordatorio por WhatsApp">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            );
          }))}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-300 shadow-[0_8px_22px_rgba(8,48,57,0.09)] p-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.16em] mb-3.5">Accesos Rápidos</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={onNewPatient} className={qaBtn}><span className={qaIcon}><Users className="w-4 h-4" /></span><span className="text-[11px] font-extrabold text-[#16323a] leading-tight">Nuevo paciente</span></button>
              <button onClick={onOpenCalendar} className={qaBtn}><span className={qaIcon}><CalendarIcon className="w-4 h-4" /></span><span className="text-[11px] font-extrabold text-[#16323a] leading-tight">Calendario</span></button>
              <button onClick={onGoTechniques} className={qaBtn}><span className={qaIcon}><BookOpen className="w-4 h-4" /></span><span className="text-[11px] font-extrabold text-[#16323a] leading-tight">Técnicas</span></button>
              <button onClick={onBackup} className={qaBtn}><span className={qaIcon}><Download className="w-4 h-4" /></span><span className="text-[11px] font-extrabold text-[#16323a] leading-tight">Respaldo</span></button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-300 shadow-[0_8px_22px_rgba(8,48,57,0.09)] p-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.16em] mb-2">Próximas Citas</h3>
            {upcoming.length === 0 ? (
              <p className="text-slate-400 text-xs font-semibold py-3">Sin citas próximas agendadas.</p>
            ) : (upcoming.map(app => {
              const pInfo = patients.find(p => p.id === app.patientId);
              return (
                <div key={app.id} className="py-3 border-b border-slate-100 last:border-none flex items-center gap-3.5">
                  <div className="bg-[#fdf6e0] border border-[#e8d9ac] rounded-xl px-2.5 py-1.5 text-center flex-none min-w-[74px]">
                    <p className="text-[10px] font-extrabold text-[#8a6d2f] leading-tight">{fmtUpcoming(String(app.date))}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-[13px] truncate">{pInfo?.name || 'Desconocido'}</p>
                    <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {String(app.time)}</p>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientProfile = ({ patient, doctorInfo, onBack, onAddHistory, onDelete, onSchedule, onEdit }) => {
  const [activeSection, setActiveSection] = useState('historial');
  const edadMostrar = patient.birthDate ? calculateAge(patient.birthDate) : patient.age;
  const bmi = (patient.weight && patient.height) ? (parseFloat(patient.weight) / ((parseFloat(patient.height)/100)**2)).toFixed(1) : '--';

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateClinicalHTML(patient, doctorInfo));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const handleExportWord = () => {
    const html = generateClinicalHTML(patient, doctorInfo);
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Expediente_${patient.name.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in text-left pb-10">
      <div className="flex items-center gap-4 mb-4 sticky top-0 bg-slate-950/80 backdrop-blur-md py-4 z-20"><button onClick={onBack} className="p-3 bg-white/5 rounded-2xl active:scale-90"><ChevronRight className="rotate-180"/></button><div className="flex-1 min-w-0"><h2 className="text-2xl font-black uppercase italic truncate text-white">{String(patient.name)}</h2><p className="text-[9px] font-black uppercase text-cyan-400 tracking-widest">{String(patient.phone || 'Sin Teléfono')}</p></div><button onClick={onDelete} className="p-3 text-rose-500 bg-rose-500/10 rounded-2xl active:scale-90"><Trash2 className="w-5 h-5"/></button></div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <button onClick={() => openWhatsApp(patient.phone, "Hola desde la clínica.")} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 shadow-lg"><MessageSquare className="w-4 h-4"/> WhatsApp</button>
        <button onClick={onSchedule} className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 shadow-lg"><CalendarPlus className="w-4 h-4"/> Agendar</button>
        <button onClick={handleExportPDF} className="bg-rose-500/10 border border-rose-500/30 text-rose-400 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 shadow-lg"><FileText className="w-4 h-4"/> PDF</button>
        <button onClick={handleExportWord} className="bg-blue-500/10 border border-blue-500/30 text-blue-400 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 shadow-lg"><Download className="w-4 h-4"/> Word</button>
        <button onClick={onEdit} className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase active:scale-95 shadow-lg"><Pencil className="w-4 h-4"/> Editar</button>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-4 mb-2 scrollbar-hide">{['identidad', 'historial', 'evaluacion', 'anatomia', 'tratamiento', 'sesiones'].map(sec => (<button key={sec} onClick={() => setActiveSection(sec)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeSection === sec ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>{sec}</button>))}</div>
      
      {activeSection === 'identidad' && (<div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4 animate-fade-in"><div className="grid grid-cols-2 gap-4"><div><p className="text-[8px] text-indigo-400 uppercase font-black">Sexo</p><p className="text-sm font-bold text-white">{patient.gender || '--'}</p></div><div><p className="text-[8px] text-indigo-400 uppercase font-black">Edad</p><p className="text-sm font-bold text-white">{edadMostrar ? `${edadMostrar} años` : '--'}</p></div><div className="col-span-2"><p className="text-[8px] text-indigo-400 uppercase font-black">Dirección</p><p className="text-sm font-bold text-white">{patient.address || '--'}</p></div></div></div>)}
      {activeSection === 'historial' && (<div className="space-y-4 animate-fade-in"><div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4"><div><h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Motivo Consulta</h4><p className="text-sm italic text-indigo-100 bg-slate-950 p-4 rounded-2xl">{patient.consultationReason || "--"}</p></div></div></div>)}
      {activeSection === 'evaluacion' && (<div className="space-y-4 animate-fade-in"><div className="grid grid-cols-4 gap-2 mb-2"><div className="bg-slate-900 p-3 rounded-2xl border border-white/5 text-center"><p className="text-[8px] font-black text-indigo-400 uppercase">Peso</p><p className="text-xs font-bold text-white">{patient.weight || '-'}kg</p></div><div className="bg-indigo-900/40 p-3 rounded-2xl border border-cyan-400/20 text-center"><p className="text-[8px] font-black text-cyan-400 uppercase">IMC</p><p className="text-xs font-bold text-cyan-400">{bmi}</p></div></div><div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4"><div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Dx Quiropráctico</h5><p className="text-sm font-bold text-cyan-300">{patient.chiropracticDiagnosis || "--"}</p></div></div></div>)}
      {activeSection === 'anatomia' && (<div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 animate-fade-in"><h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Postura Anterior</h4><p className="text-sm text-indigo-100 mb-4">{patient.postureAnterior || "--"}</p><h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Postura Lateral</h4><p className="text-sm text-indigo-100 mb-4">{patient.postureLateral || "--"}</p><h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Postura Posterior</h4><p className="text-sm text-indigo-100">{patient.posturePosterior || "--"}</p></div>)}
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

const ProfileTab = ({ user, doctorInfo, patients, onUpdateInfo, onLogout, onLinkGoogle, onLinkEmail, onUpgrade, onBackup, visualMode, setVisualMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(doctorInfo.title || '');
  const [customTitle, setCustomTitle] = useState('');
  const [name, setName] = useState(doctorInfo.name || '');
  const [clinic, setClinic] = useState(doctorInfo.clinic || '');
  const [theme, setTheme] = useState(doctorInfo.theme || 'azul'); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
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
        <UserCircle className="w-12 h-12 mx-auto mb-4 text-indigo-500"/>
        <p className="text-[9px] font-black uppercase text-indigo-400 mb-1 tracking-widest">Cuenta Activa</p>
        <p className="text-xs font-bold text-white mb-6 break-all">{user.isAnonymous ? "Perfil Temporal (No Guardado)" : String(user.email || user.phoneNumber)}</p>
        <button onClick={onBackup} className="w-full mb-3 bg-cyan-500/10 py-5 rounded-[25px] flex items-center justify-center gap-3 text-cyan-400 font-black uppercase italic shadow-lg active:scale-95 transition-all border border-cyan-500/20">
          <Download className="w-5 h-5"/> Descargar Respaldo
        </button>
        <button onClick={onLogout} className="w-full bg-rose-500/10 py-5 rounded-[25px] flex items-center justify-center gap-3 text-rose-500 font-black uppercase italic shadow-lg active:scale-95 transition-all border border-rose-500/20">
          <LogOut className="w-5 h-5"/> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

const NewPatientModal = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', age: '', gender: '', address: '', consultationReason: '', pathological: '', nonPathological: '', redFlags: [], chiropracticDiagnosis: '', treatmentPlan: '', weight: '', height: '', chiropracticTechniques: [], posturalDeviations: [], postureAnterior: '', posturePosterior: '', postureLateral: '', histories: [], painLevel: 0, areas: [], notes: '' });
  
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
    <Modal title={`Crear Expediente (${step}/6)`} onClose={onClose}>
      <div className="space-y-6">
        
        {step === 1 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">1. Identidad del Paciente</h4>
          <div><label className={labelClass}>Nombre completo *</label><input type="text" placeholder="Ej. Juan Pérez" className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          
          <div className="space-y-6">
            <div><label className={labelClass}>Teléfono</label><input type="tel" placeholder="Ej. 555 123 4567" className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div><label className={labelClass}>Sexo</label><select className={`${inputClass} appearance-none cursor-pointer`} value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}><option value="">Selecciona...</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option></select></div>
          </div>
          
          <div className="space-y-6">
            <div><label className={labelClass}>Fecha de Nacimiento</label><input type="date" className={inputClass} value={form.birthDate} onChange={e => { const newDob = e.target.value; setForm({...form, birthDate: newDob, age: calculateAge(newDob)}); }} /></div>
            <div>
              <label className={labelClass}>Edad</label>
              <input type="text" className={`${inputClass} opacity-50 cursor-not-allowed`} value={form.age !== '' ? `${form.age} años` : ''} readOnly placeholder="Se calcula automáticamente" />
            </div>
          </div>
          <div><label className={labelClass}>Dirección Completa</label><input type="text" placeholder="Ej. Av. Reforma 123" className={inputClass} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
        </div>)}

        {step === 2 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">2. Motivo y Antecedentes</h4>
          <div><label className={labelClass}>Motivo de Consulta *</label><textarea placeholder="Ej. Dolor lumbar irradiado a pierna derecha..." className={`${inputClass} min-h-[100px]`} value={form.consultationReason} onChange={e => setForm({...form, consultationReason: e.target.value})} /></div>
          <div className="space-y-6">
            <div><label className={labelClass}>Ant. Patológicos</label><textarea placeholder="Enfermedades previas" className={`${inputClass} min-h-[120px]`} value={form.pathological} onChange={e => setForm({...form, pathological: e.target.value})} /></div>
            <div><label className={labelClass}>Ant. No Patológicos</label><textarea placeholder="Hábitos, ejercicio, tabaco" className={`${inputClass} min-h-[120px]`} value={form.nonPathological} onChange={e => setForm({...form, nonPathological: e.target.value})} /></div>
          </div>
        </div>)}

        {step === 3 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">3. Precauciones y Diagnóstico</h4>
          <MultiSelectDropdown title="Banderas Rojas (Precauciones)" icon={ShieldAlert} items={RED_FLAGS} selectedItems={form.redFlags} toggleItem={(i) => toggleArrayItem('redFlags', i)} isDanger={true} />
          <div><label className={labelClass}>Diagnóstico Quiropráctico</label><input type="text" placeholder="Ej. Subluxación L4-L5" className={inputClass} value={form.chiropracticDiagnosis} onChange={e => setForm({...form, chiropracticDiagnosis: e.target.value})} /></div>
        </div>)}

        {step === 4 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">4. Físico y Plan</h4>
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Peso Físico</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.weight} onChange={e => setForm({...form, weight: e.target.value})}>
                <option value="">Selecciona...</option>
                {Array.from({length: 161}, (_, i) => i + 30).map(n => <option key={n} value={n}>{n} kg</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Altura Total</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.height} onChange={e => setForm({...form, height: e.target.value})}>
                <option value="">Selecciona...</option>
                {Array.from({length: 121}, (_, i) => i + 100).map(n => <option key={n} value={n}>{n} cm</option>)}
              </select>
            </div>
          </div>
          <div><label className={labelClass}>Plan de Tratamiento</label><textarea placeholder="Ej. 2 sesiones por semana..." className={`${inputClass} min-h-[140px]`} value={form.treatmentPlan} onChange={e => setForm({...form, treatmentPlan: e.target.value})} /></div>
        </div>)}

        {step === 5 && (<div className="space-y-6 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-white mb-4 border-b border-white/10 pb-4">5. Técnicas Clínicas</h4>
          <MultiSelectDropdown title="Técnicas Sugeridas" icon={BookOpen} items={CHIRO_TECHNIQUES} selectedItems={form.chiropracticTechniques} toggleItem={(i) => toggleArrayItem('chiropracticTechniques', i)} />
        </div>)}

        {step === 6 && (<div className="space-y-8 animate-fade-in text-left">
          <h4 className="text-[12px] font-black uppercase text-cyan-400 mb-4 border-b border-white/10 pb-4 flex items-center gap-2"><Target className="w-4 h-4"/> 6. Evaluación Inicial (Primer Ajuste)</h4>
          
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

          <MultiSelectDropdown title="Desviaciones Posturales" icon={Activity} items={POSTURAL_DEVIATIONS} selectedItems={form.posturalDeviations} toggleItem={(i) => toggleArrayItem('posturalDeviations', i)} />

          <AnatomyMap selectedAreas={form.areas} toggleArea={toggleArea} />

          <div className="space-y-6">
            <div><label className={labelClass}>Vista Anterior</label><textarea placeholder="Hallazgos frontales..." className={`${inputClass} min-h-[100px]`} value={form.postureAnterior} onChange={e => setForm({...form, postureAnterior: e.target.value})} /></div>
            <div><label className={labelClass}>Vista Lateral</label><textarea placeholder="Hallazgos de perfil..." className={`${inputClass} min-h-[100px]`} value={form.postureLateral} onChange={e => setForm({...form, postureLateral: e.target.value})} /></div>
            <div><label className={labelClass}>Vista Posterior</label><textarea placeholder="Hallazgos de espalda..." className={`${inputClass} min-h-[100px]`} value={form.posturePosterior} onChange={e => setForm({...form, posturePosterior: e.target.value})} /></div>
          </div>

          <div><label className={labelClass}>Notas de la Sesión Inicial</label><textarea placeholder="Ej. Ajuste exitoso..." className={`${inputClass} min-h-[120px]`} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
        </div>)}

        <div className="flex gap-4 pt-8">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 bg-slate-900 py-5 rounded-3xl font-black uppercase text-[11px] active:scale-95 transition tracking-widest hover:bg-slate-800 border border-white/10">Atrás</button>}
          {step < 6 ? (<button onClick={handleNext} disabled={!form.name} className="flex-[2] bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase text-[11px] active:scale-95 transition shadow-[0_10px_20px_rgba(34,211,238,0.2)] border-b-8 border-cyan-700 disabled:opacity-50 tracking-widest">Siguiente Paso</button>) : (<button onClick={handleSaveClick} disabled={isSaving} className="flex-[2] bg-emerald-400 text-black py-5 rounded-3xl font-black uppercase text-[11px] border-b-8 border-emerald-700 flex justify-center items-center gap-2 active:scale-95 transition disabled:opacity-70 shadow-[0_10px_20px_rgba(52,211,153,0.3)] tracking-widest">{isSaving ? 'Guardando...' : 'Crear Expediente'}</button>)}
        </div>
      </div>
    </Modal>
  );
};

const NewHistoryModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], painLevel: 0, areas: [], redFlags: [], notes: '', postureAnterior: '', postureLateral: '', posturePosterior: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = () => { if (isSaving) return; setIsSaving(true); onSave(form); };
  const toggleArea = (area) => setForm(prev => ({ ...prev, areas: prev.areas.includes(area) ? prev.areas.filter(a => a !== area) : [...prev.areas, area] }));
  const toggleArrayItem = (field, item) => { setForm(prev => { const arr = prev[field] || []; return { ...prev, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] }; }); };

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
        
        <div><label className={labelClass}>Fecha del Ajuste</label><input type="date" className={inputClass} value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>

        <MultiSelectDropdown title="Banderas Rojas (Precauciones)" icon={ShieldAlert} items={RED_FLAGS} selectedItems={form.redFlags} toggleItem={(i) => toggleArrayItem('redFlags', i)} isDanger={true} />

        <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 shadow-inner">
          <div className="flex justify-between items-end mb-6">
            <label className={labelClass} style={{marginLeft: 0}}>Escala de Dolor (EVA)</label>
            <div className="text-right">
              <span className={`text-3xl font-black ${getPainColor(form.painLevel).split(' ')[1]}`}>{form.painLevel} <span className="text-sm text-slate-500">/ 10</span></span>
              <p className={`text-[10px] font-black uppercase tracking-widest ${getPainColor(form.painLevel).split(' ')[1]}`}>{getPainLabel(form.painLevel)}</p>
            </div>
          </div>
          <input type="range" min="0" max="10" className={`w-full h-3 bg-slate-950 rounded-full appearance-none outline-none transition-all duration-300 ${getPainColor(form.painLevel).split(' ')[0]}`} value={form.painLevel} onChange={e => setForm({...form, painLevel: parseInt(e.target.value)})} />
          <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 mt-3"><span>0 (Sin Dolor)</span><span>10 (Insoportable)</span></div>
        </div>

        <AnatomyMap selectedAreas={form.areas} toggleArea={toggleArea} />

        <div className="space-y-6">
          <div><label className={labelClass}>Vista Anterior</label><textarea placeholder="Hallazgos..." className={`${inputClass} min-h-[100px]`} value={form.postureAnterior} onChange={e => setForm({...form, postureAnterior: e.target.value})} /></div>
          <div><label className={labelClass}>Vista Lateral</label><textarea placeholder="Hallazgos..." className={`${inputClass} min-h-[100px]`} value={form.postureLateral} onChange={e => setForm({...form, postureLateral: e.target.value})} /></div>
          <div><label className={labelClass}>Vista Posterior</label><textarea placeholder="Hallazgos..." className={`${inputClass} min-h-[100px]`} value={form.posturePosterior} onChange={e => setForm({...form, posturePosterior: e.target.value})} /></div>
        </div>

        <div><label className={labelClass}><FileText className="w-3 h-3"/> Notas de Evolución</label><textarea placeholder="Ej. Hubo cavitación en C2..." className={`${inputClass} min-h-[120px]`} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>

        <button onClick={handleSaveClick} disabled={isSaving} className="w-full bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase italic border-b-8 border-cyan-700 shadow-[0_10px_20px_rgba(34,211,238,0.2)] active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 mt-6 tracking-widest">
          {isSaving ? <><Loader2 className="w-5 h-5 animate-spin"/> Guardando...</> : <><CheckCircle2 className="w-5 h-5"/> Guardar Ajuste Clínico</>}
        </button>
      </div>
    </Modal>
  );
};

const EditPatientModal = ({ patient, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: patient.name || '', phone: patient.phone || '', gender: patient.gender || '',
    birthDate: patient.birthDate || '', address: patient.address || '',
    consultationReason: patient.consultationReason || '', pathological: patient.pathological || '',
    nonPathological: patient.nonPathological || '', weight: patient.weight || '', height: patient.height || '',
    chiropracticDiagnosis: patient.chiropracticDiagnosis || '', treatmentPlan: patient.treatmentPlan || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const inputClass = "w-full bg-slate-900 p-4 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-cyan-500 transition-all";
  const labelClass = "text-[10px] font-black uppercase text-indigo-400 ml-2 mb-2 block tracking-widest";
  const handleSaveClick = () => {
    if (isSaving || !form.name.trim()) return;
    setIsSaving(true);
    onSave({ ...form, age: form.birthDate ? calculateAge(form.birthDate) : (patient.age || '') });
  };
  return (
    <Modal title="Editar Paciente" onClose={onClose}>
      <div className="space-y-4 text-left max-h-[65vh] overflow-y-auto pr-1 scrollbar-hide">
        <div><label className={labelClass}>Nombre completo</label><input type="text" className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Teléfono / WhatsApp</label><input type="tel" className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div><label className={labelClass}>Sexo</label><select className={`${inputClass} appearance-none cursor-pointer`} value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}><option value="">Selecciona...</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option></select></div>
        </div>
        <div><label className={labelClass}>Fecha de nacimiento</label><input type="date" className={inputClass} value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} /></div>
        <div><label className={labelClass}>Dirección</label><input type="text" className={inputClass} value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
        <div><label className={labelClass}>Motivo de consulta</label><textarea rows={2} className={inputClass} value={form.consultationReason} onChange={e => setForm({...form, consultationReason: e.target.value})} /></div>
        <div><label className={labelClass}>Antecedentes patológicos</label><textarea rows={2} className={inputClass} value={form.pathological} onChange={e => setForm({...form, pathological: e.target.value})} /></div>
        <div><label className={labelClass}>Antecedentes no patológicos</label><textarea rows={2} className={inputClass} value={form.nonPathological} onChange={e => setForm({...form, nonPathological: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Peso (kg)</label><input type="text" inputMode="decimal" className={inputClass} value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} /></div>
          <div><label className={labelClass}>Altura (cm)</label><input type="text" inputMode="decimal" className={inputClass} value={form.height} onChange={e => setForm({...form, height: e.target.value})} /></div>
        </div>
        <div><label className={labelClass}>Diagnóstico quiropráctico</label><textarea rows={2} className={inputClass} value={form.chiropracticDiagnosis} onChange={e => setForm({...form, chiropracticDiagnosis: e.target.value})} /></div>
        <div><label className={labelClass}>Plan de tratamiento</label><textarea rows={2} className={inputClass} value={form.treatmentPlan} onChange={e => setForm({...form, treatmentPlan: e.target.value})} /></div>
        <button onClick={handleSaveClick} disabled={isSaving || !form.name.trim()} className="w-full bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase italic border-b-8 border-cyan-700 shadow-xl active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 tracking-widest">{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button>
      </div>
    </Modal>
  );
};

const NewAppointmentModal = ({ onClose, onSave, initial }) => {
  const [form, setForm] = useState(initial ? { date: initial.date || new Date().toISOString().split('T')[0], time: initial.time || '10:00' } : { date: new Date().toISOString().split('T')[0], time: '10:00' });
  const [isSaving, setIsSaving] = useState(false);
  const handleSaveClick = () => { if (isSaving || !form.date || !form.time) return; setIsSaving(true); onSave(form); };
  return (
    <Modal title={initial ? "Editar Cita" : "Agendar Cita"} onClose={onClose}>
      <div className="space-y-6 text-left">
        <div><label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-2 flex items-center gap-1 tracking-widest">Fecha</label><input type="date" className="w-full bg-slate-900 p-5 rounded-[20px] border border-white/10 text-white outline-none focus:border-cyan-500 shadow-inner" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
        <div><label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-2 flex items-center gap-1 tracking-widest">Hora</label><input type="time" className="w-full bg-slate-900 p-5 rounded-[20px] border border-white/10 text-white outline-none focus:border-cyan-500 shadow-inner" value={form.time} onChange={e => setForm({...form, time: e.target.value})} /></div>
        <button onClick={handleSaveClick} disabled={isSaving} className="w-full bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase italic border-b-8 border-cyan-700 shadow-[0_10px_20px_rgba(34,211,238,0.2)] active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 tracking-widest mt-6">{isSaving ? 'Guardando...' : (initial ? 'Guardar Cambios' : 'Confirmar Cita')}</button>
      </div>
    </Modal>
  );
};

const UpsellModal = ({ onClose, onUpgrade }) => (
  <Modal title="Límite Alcanzado" onClose={onClose}>
    <div className="text-center space-y-6 pb-4">
      <div className="bg-amber-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-amber-500/30"><Lock className="w-12 h-12 text-amber-400" /></div>
      <h3 className="text-2xl font-black uppercase italic text-white">Prueba Limitada</h3>
      <p className="text-indigo-200 text-sm leading-relaxed px-4">Solo puedes registrar hasta <strong>{MAX_TRIAL_PATIENTS} pacientes</strong>. Adquiere PRO para continuar ilimitadamente.</p>
      <button onClick={() => { onClose(); onUpgrade(); }} className="w-full bg-amber-400 text-black py-5 rounded-3xl font-black uppercase italic border-b-8 border-amber-600 shadow-xl active:scale-95 flex justify-center items-center gap-2"><Sparkles className="w-5 h-5" /> Obtener PRO</button>
    </div>
  </Modal>
);

const CalendarModal = ({ appointments, patients, onClose, onEditAppointment, onDeleteAppointment }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const dayAppointments = appointments.filter(a => String(a.date) === selectedDate).sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
  return (
    <Modal title="Calendario" onClose={onClose}>
      <div className="space-y-6 text-left">
        <div><label className="text-[10px] font-black uppercase text-indigo-400 ml-4 mb-2 block tracking-widest">Seleccionar Fecha</label><input type="date" className="w-full bg-slate-900 p-5 rounded-3xl border border-white/10 text-white outline-none focus:border-cyan-500 font-bold" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /></div>
        <div className="bg-slate-900/50 p-6 rounded-[30px] border border-white/5 min-h-[300px]">
          {dayAppointments.length === 0 ? (<div className="py-12 text-center opacity-40"><CalendarIcon className="w-12 h-12 mx-auto mb-3 text-indigo-400" /><p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.2em]">Libre</p></div>) : (dayAppointments.map(app => (<div key={app.id} className="bg-slate-950 p-4 rounded-3xl border border-white/5 mb-3 flex items-center justify-between shadow-lg"><div><p className="text-white font-black uppercase italic text-sm">{String(patients.find(p => p.id === app.patientId)?.name || 'Desconocido')}</p><p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {String(app.time)}</p></div><div className="flex gap-2 shrink-0"><button onClick={() => onEditAppointment(app)} className="p-2.5 text-cyan-400 bg-cyan-500/10 rounded-xl active:scale-90 border border-cyan-500/20"><Pencil className="w-4 h-4" /></button><button onClick={() => onDeleteAppointment(app)} className="p-2.5 text-rose-500 bg-rose-500/10 rounded-xl active:scale-90 border border-rose-500/20"><Trash2 className="w-4 h-4" /></button></div></div>)))}
        </div>
      </div>
    </Modal>
  );
};

const SubscriptionBlockedScreen = ({ onLogout }) => (
  <div className="fixed inset-0 bg-[#020617] z-[200] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
    <div className="bg-rose-500/10 p-8 rounded-[50px] border border-rose-500/30 mb-8 relative shadow-2xl max-w-sm w-full"><div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-500 p-3 rounded-2xl shadow-lg"><Lock className="w-8 h-8 text-white" /></div><h2 className="text-4xl font-black uppercase italic text-white mt-4 mb-4 tracking-tighter">Acceso <span className="text-rose-500">Bloqueado</span></h2><p className="text-indigo-200 text-sm leading-relaxed mb-6">Tu prueba gratuita ha finalizado. Adquiere una licencia PRO.</p><button onClick={() => openWhatsApp("529996180031", "Hola, mi prueba venció. Me interesa QuiroApp Pro.")} className="w-full bg-cyan-400 text-black font-black uppercase italic py-5 rounded-[25px] flex items-center justify-center gap-3 border-b-8 border-cyan-700 active:scale-95 mb-4 shadow-xl"><CreditCard className="w-6 h-6" /> Comprar Licencia</button><button onClick={onLogout} className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition">Salir de la cuenta</button></div>
  </div>
);

const AuthScreen = ({ onGoogleLogin, onEmailAuth, onStartTrial, onResetPassword, inProcess, error, notice, step, setStep }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="min-h-screen flex bg-[#f4f6f4] text-slate-800">
      <aside className="hidden lg:flex w-[44%] max-w-[580px] flex-col bg-gradient-to-br from-[#0b3b42] via-[#083039] to-[#0a2e26] text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full border border-[#d8b878]/20"></div>
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full border border-white/10"></div>
        <div className="relative flex items-center gap-3">
          <img src="/logo-quiroapp.png" alt="QuiroApp" className="w-12 h-12 rounded-2xl shadow-lg" />
          <div>
            <p className="font-black text-lg leading-none">QuiroApp</p>
            <p className="text-[#d8b878] font-bold tracking-[0.22em] uppercase text-[9px] mt-1">Gestión Clínica</p>
          </div>
        </div>
        <div className="relative my-auto py-14">
          <h1 className="text-4xl xl:text-[44px] font-black leading-[1.08] tracking-tight">Tu consultorio,<br />bajo <span className="text-[#d8b878]">control total</span>.</h1>
          <p className="text-white/70 text-sm leading-relaxed mt-5 max-w-sm">El CRM pensado para quiroprácticos, fisioterapeutas y masajistas: pacientes, agenda y licencias en un solo lugar.</p>
          <ul className="mt-9 space-y-4 text-sm font-semibold">
            <li className="flex items-center gap-3"><span className="w-6 h-6 rounded-full border border-[#d8b878]/60 bg-[#d8b878]/15 flex items-center justify-center flex-none"><CheckCircle2 className="w-3.5 h-3.5 text-[#d8b878]" /></span>Expedientes y sesiones clínicas</li>
            <li className="flex items-center gap-3"><span className="w-6 h-6 rounded-full border border-[#d8b878]/60 bg-[#d8b878]/15 flex items-center justify-center flex-none"><CheckCircle2 className="w-3.5 h-3.5 text-[#d8b878]" /></span>Agenda con avisos por WhatsApp</li>
            <li className="flex items-center gap-3"><span className="w-6 h-6 rounded-full border border-[#d8b878]/60 bg-[#d8b878]/15 flex items-center justify-center flex-none"><CheckCircle2 className="w-3.5 h-3.5 text-[#d8b878]" /></span>Funciona sin internet y sincroniza solo</li>
          </ul>
        </div>
        <div className="relative flex gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-[9px] font-black tracking-[0.14em] uppercase border border-white/30 text-white/90 px-3 py-1.5 rounded-full"><ShieldCheck className="w-3.5 h-3.5" /> Datos cifrados</span>
          <span className="flex items-center gap-1.5 text-[9px] font-black tracking-[0.14em] uppercase border border-white/30 text-white/90 px-3 py-1.5 rounded-full"><Cloud className="w-3.5 h-3.5" /> Respaldo incluido</span>
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex flex-col items-center text-center mb-7">
            <img src="/logo-quiroapp.png" alt="QuiroApp" className="w-20 h-20 rounded-full shadow-xl" />
            <h1 className="text-2xl font-black text-[#0b2b31] mt-4">QuiroApp</h1>
            <p className="text-[#b08d3e] font-bold tracking-[0.24em] uppercase text-[9px] mt-1">Gestión Clínica Profesional</p>
          </div>

          <div className="bg-white rounded-[28px] shadow-[0_24px_60px_rgba(8,48,57,0.14)] border border-slate-100 p-8 sm:p-10">
            {step === 'initial' && (
              <div className="mb-7">
                <p className="text-[#b08d3e] font-black tracking-[0.2em] uppercase text-[9px]">Acceso profesional</p>
                <h2 className="text-[26px] font-black text-[#0b2b31] mt-2 leading-tight">Bienvenido de nuevo</h2>
                <p className="text-slate-500 text-xs mt-1.5">Ingresa a tu panel clínico</p>
              </div>
            )}
            {step === 'email' && (
              <div className="mb-7">
                <p className="text-[#b08d3e] font-black tracking-[0.2em] uppercase text-[9px]">Acceso con correo</p>
                <h2 className="text-[26px] font-black text-[#0b2b31] mt-2 leading-tight">{isLoginView ? 'Ingresa a tu cuenta' : 'Crea tu cuenta'}</h2>
                <p className="text-slate-500 text-xs mt-1.5">{isLoginView ? 'Qué bueno verte de nuevo' : 'Empieza a gestionar tu consultorio'}</p>
              </div>
            )}

            {error && <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-600 text-[11px] font-semibold mb-4 text-left animate-pulse"><ShieldAlert className="w-4 h-4 inline mr-2" /> {String(error)}</div>}
            {notice && <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-700 text-[11px] font-semibold mb-4 text-left"><CheckCircle2 className="w-4 h-4 inline mr-2" /> {String(notice)}</div>}

            {inProcess ? (
              <div className="py-10 flex flex-col items-center"><Loader2 className="w-10 h-10 text-[#0b5563] animate-spin mb-4" /><p className="text-[#0b5563] font-black tracking-widest text-[10px] uppercase">Preparando Entorno...</p></div>
            ) : (
              <div className="animate-slide-up">
                {step === 'initial' && (
                  <>
                    <button onClick={onStartTrial} className="w-full bg-gradient-to-r from-[#0b5563] to-[#0b3b42] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2.5 transition uppercase shadow-lg shadow-[#0b3b42]/25 active:scale-[0.98] text-xs tracking-wide"><PlayCircle className="w-5 h-5" /> Iniciar Prueba Gratis</button>
                    <div className="flex items-center gap-4 py-5"><div className="flex-1 h-[1px] bg-slate-200"></div><span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">O ingresa con</span><div className="flex-1 h-[1px] bg-slate-200"></div></div>
                    <div className="space-y-3">
                      <button onClick={onGoogleLogin} className="w-full bg-white border border-slate-200 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 hover:bg-slate-50 transition active:scale-[0.98] text-slate-700 shadow-sm"><svg className="w-[18px] h-[18px]" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-9z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z"/><path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z"/><path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c.9-2.8 3.6-4.9 6.8-4.9z"/></svg><span className="text-xs font-bold">Continuar con Google</span></button>
                      <button onClick={() => setStep('email')} className="w-full bg-white border-[1.5px] border-[#0b3b42] py-3.5 rounded-2xl flex items-center justify-center gap-2.5 hover:bg-[#0b3b42]/5 transition active:scale-[0.98] text-[#0b3b42]"><Mail className="w-4 h-4" /><span className="text-xs font-bold">Ingresar con Correo</span></button>
                    </div>
                  </>
                )}
                {step === 'email' && (
                  <div className="text-left">
                    <div className="space-y-4 mb-6">
                      <div><label className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 mb-1.5">Correo electrónico</label><input type="email" placeholder="tucorreo@ejemplo.com" className="w-full bg-slate-50 p-3.5 rounded-xl border border-slate-200 outline-none text-slate-800 text-sm focus:border-[#0b5563] focus:bg-white focus:ring-4 focus:ring-[#0b5563]/10 transition-all placeholder:text-slate-400" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                      <div><label className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 mb-1.5">Contraseña</label><input type="password" placeholder="••••••••" className="w-full bg-slate-50 p-3.5 rounded-xl border border-slate-200 outline-none text-slate-800 text-sm focus:border-[#0b5563] focus:bg-white focus:ring-4 focus:ring-[#0b5563]/10 transition-all placeholder:text-slate-400" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                    </div>
                    <div className="flex gap-2"><button onClick={() => setStep('initial')} className="flex-1 bg-white py-3.5 rounded-xl text-[11px] font-black uppercase text-slate-500 border border-slate-200 active:scale-[0.98] transition">Volver</button><button onClick={() => onEmailAuth(email, password, isLoginView)} className="flex-[2] bg-gradient-to-r from-[#0b5563] to-[#0b3b42] text-white py-3.5 rounded-xl text-[11px] font-black uppercase active:scale-[0.98] transition shadow-lg shadow-[#0b3b42]/25">{isLoginView ? 'Ingresar' : 'Registrarse'}</button></div>
                    {isLoginView ? (<p className="text-center mt-5"><button onClick={() => onResetPassword(email)} className="text-[10px] text-[#b08d3e] font-black uppercase underline">¿Olvidaste tu contraseña?</button></p>) : (<p className="text-center mt-5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-2.5 text-[10px] uppercase font-bold tracking-wider">Usa un correo real: ahí te llegará la recuperación de tu contraseña</p>)}
                    <p className="text-center mt-6 text-[10px] text-slate-500 font-semibold">{isLoginView ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'} <button onClick={() => setIsLoginView(!isLoginView)} className="ml-1 text-[#0b5563] font-black uppercase underline">{isLoginView ? 'Regístrate' : 'Inicia Sesión'}</button></p>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-6 leading-relaxed">Al continuar aceptas los Términos y la Política de Privacidad.</p>
        </div>
      </main>
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
  const [patientSearch, setPatientSearch] = useState('');
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [trialTimeLeft, setTrialTimeLeft] = useState({ days: 0, hours: 0, expired: false });
  const [adminCodes, setAdminCodes] = useState([]);
  const [modals, setModals] = useState({});
  const [authInProcess, setAuthInProcess] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authStep, setAuthStep] = useState('initial');

  const [visualMode, setVisualMode] = useState(localStorage.getItem('quiroTheme') || 'oscuro');

  useEffect(() => {
    localStorage.setItem('quiroTheme', visualMode);
  }, [visualMode]);

  useEffect(() => { if (!localStorage.getItem('quiroDisenoV2')) { setVisualMode('claro'); localStorage.setItem('quiroDisenoV2', '1'); } }, []);

  useEffect(() => { getRedirectResult(auth).catch((err) => { if (err) setAuthError(authErrorMessage(err)); }); }, []);

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

  const handleGoogleLogin = async () => { setAuthInProcess(true); setAuthError(""); setAuthNotice(""); try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') { try { await signInWithRedirect(auth, new GoogleAuthProvider()); return; } catch (e2) { setAuthError(authErrorMessage(e2)); setAuthInProcess(false); return; } } if (err.code !== 'auth/popup-closed-by-user') setAuthError(authErrorMessage(err)); setAuthInProcess(false); } };
  const handleTrialLogin = async () => { setAuthInProcess(true); setAuthError(""); try { await signInAnonymously(auth); } catch (e) { setAuthError(authErrorMessage(e)); setAuthInProcess(false); } };
  const handleResetPassword = async (email) => {
    const clean = (email || '').trim();
    setAuthError(""); setAuthNotice("");
    if (!clean) return setAuthError("Escribe tu correo en el campo de arriba y luego toca «¿Olvidaste tu contraseña?»." );
    try {
      await sendPasswordResetEmail(auth, clean);
      setAuthNotice(`Listo: te enviamos un correo a ${clean} con el enlace para crear una contraseña nueva. Revisa también tu carpeta de spam. El enlace vence en 1 hora.`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') setAuthError("No hay ninguna cuenta registrada con ese correo.");
      else setAuthError(authErrorMessage(err));
    }
  };

  const handleEmailAuth = async (e, p, login) => { if (!e || !p) return setAuthError("Rellena todos los campos."); setAuthInProcess(true); setAuthError(""); try { if (login) await signInWithEmailAndPassword(auth, e, p); else { await createUserWithEmailAndPassword(auth, e, p); try { await sendEmailVerification(auth.currentUser); } catch (e2) {} } } catch (err) { setAuthError(authErrorMessage(err)); setAuthInProcess(false); } };
  const handleLinkGoogle = async () => { try { await linkWithPopup(auth.currentUser, new GoogleAuthProvider()); alert("¡Cuenta vinculada!"); } catch (err) { alert(authErrorMessage(err)); } };
  const handleLinkEmail = async (e, p) => { if(!e || !p) return alert("Completa los datos."); try { await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(e, p)); alert("¡Cuenta vinculada!"); } catch (err) { alert(authErrorMessage(err)); } };

  const handleActivateCode = async (codeStr) => {
    if (!codeStr || !codeStr.trim()) return alert("Ingresa un código.");
    const codeRef = doc(db, 'artifacts', appId, 'public', 'data', 'codes', codeStr.trim().toUpperCase());
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    try {
      // Transacción: leer el código y marcarlo usado es UNA sola operación.
      // Si dos canjes llegan al mismo tiempo, el segundo rebota: no hay doble canje.
      const result = await runTransaction(db, async (tx) => {
        const codeSnap = await tx.get(codeRef);
        if (!codeSnap.exists()) throw new Error('CODIGO_NO_EXISTE');
        const codeData = codeSnap.data();
        if (codeData.used) throw new Error('CODIGO_USADO');
        const profileSnap = await tx.get(profileRef);
        const currentExpiry = profileSnap.exists() ? (profileSnap.data().premiumExpiresAt || 0) : 0;
        const base = Math.max(currentExpiry, Date.now());
        const newExpiresAt = base + ((codeData.durationDays || 30) * 86400000);
        tx.update(codeRef, { used: true, usedBy: user.uid, usedAt: new Date().toISOString() });
        tx.update(profileRef, { isPremium: true, premiumActivatedAt: Date.now(), premiumExpiresAt: newExpiresAt });
        return { days: codeData.durationDays || 30, newExpiresAt };
      });
      setDoctorInfo(p => ({...p, isPremium: true, premiumExpiresAt: result.newExpiresAt}));
      alert(`¡PRO activado por ${result.days} días!`);
      setActiveTab('settings');
    } catch (e) {
      if (e.message === 'CODIGO_NO_EXISTE') alert("Ese código no existe. Revisa que esté bien escrito.");
      else if (e.message === 'CODIGO_USADO') alert("Ese código ya fue usado.");
      else if (e.code === 'permission-denied') alert("Permiso denegado por el servidor. Inténtalo de nuevo.");
      else alert("No se pudo activar el código. Revisa tu conexión e inténtalo de nuevo.");
    }
  };

  const handleGenerateAdminCode = async (type, durationDays) => {
    try {
      const prefix = type === 'Mensual' ? 'MES-' : 'ANU-';
      let newCode = null;
      // Si el código ya existiera (casi imposible), se genera otro: jamás se sobrescribe uno.
      for (let intento = 0; intento < 5 && !newCode; intento++) {
        const candidato = generateSecureCode(prefix);
        const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'codes', candidato));
        if (!snap.exists()) newCode = candidato;
      }
      if (!newCode) return alert("No se pudo generar un código único. Inténtalo de nuevo.");
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'codes', newCode), { used: false, type, durationDays, createdAt: new Date().toISOString(), createdBy: user?.uid });
      alert(`Código generado: ${newCode}`);
    } catch (e) { alert("No se pudo generar el código. Revisa tu conexión e inténtalo de nuevo."); }
  };

  const handleUpgradeRequest = () => { openWhatsApp("529996180031", "Hola, me interesa adquirir la versión PRO."); setActiveTab('premium'); };
  const handleUpdateProfile = async (newData) => { setDoctorInfo(prev => ({ ...prev, ...newData })); await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), { ...doctorInfo, ...newData }, { merge: true }); };
  const handleAddPatient = (data) => { setModals(prev => ({ ...prev, patient: false })); addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'patients'), { ...data, createdAt: new Date().toISOString() }); };
  const handleAddHistory = (history) => { if (!selectedPatientId) return; const pat = patients.find(p => p.id === selectedPatientId); setModals(prev => ({ ...prev, history: false })); if(pat) updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', selectedPatientId), { histories: [history, ...(pat.histories || [])] }); };
  const handleAddAppointment = (appData) => { if (!selectedPatientId) return; setModals(prev => ({ ...prev, appointment: false })); addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), { ...appData, patientId: selectedPatientId, createdAt: new Date().toISOString() }); };
  const handleDeletePatient = (id) => { if (window.confirm("¿Eliminar expediente?")) { setSelectedPatientId(null); deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', id)); } };
  const handleEditPatient = (data) => { if (!selectedPatientId) return; setModals(prev => ({ ...prev, editPatient: false })); updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', selectedPatientId), data); };
  const handleEditAppointment = (form) => { if (!editingAppointment) return; const id = editingAppointment.id; setEditingAppointment(null); setModals(prev => ({ ...prev, calendar: false })); updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appointments', id), { date: form.date, time: form.time }); };
  const handleDeleteAppointment = (app) => { if (window.confirm("¿Eliminar esta cita?")) deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'appointments', app.id)); };
  const handleResendVerification = async () => { try { await sendEmailVerification(auth.currentUser); alert(`Correo de verificación enviado a ${user.email}. Revisa tu bandeja y el spam, y abre el enlace para confirmar.`); } catch (e) { alert(authErrorMessage(e)); } };
  const handleVerifiedReload = () => { window.location.reload(); };
  const handleBackup = () => {
    const respaldo = { app: 'QuiroApp', version: 1, exportedAt: new Date().toISOString(), cuenta: user?.email || user?.uid || '', perfil: doctorInfo, pacientes: patients, citas: appointments, ...(doctorInfo.isAdmin ? { codigos: adminCodes } : {}) };
    const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respaldo-quiroapp-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert("Respaldo descargado. Guárdalo en un lugar seguro: contiene tus pacientes, citas y códigos.");
  };

  const handleOpenNewPatient = () => { if (!doctorInfo.isPremium && patients.length >= MAX_TRIAL_PATIENTS) setModals(m => ({ ...m, upsell: true })); else setModals(m => ({ ...m, patient: true })); };

  const showVerifyBanner = !!user && !user.isAnonymous && !user.emailVerified && (user.providerData || []).some(p => p.providerId === 'password');
  const filteredPatients = patients.filter(p => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return true;
    const qDigits = q.replace(/\D/g, '');
    return String(p.name || '').toLowerCase().includes(q)
      || (qDigits && String(p.phone || '').replace(/\D/g, '').includes(qDigits))
      || String(p.consultationReason || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-cyan-400 font-black animate-pulse uppercase tracking-[1em] italic text-center"><Loader2 className="w-12 h-12 mb-4 animate-spin mx-auto"/>Iniciando Nube...</div>;
  if (!user) return <AuthScreen onGoogleLogin={handleGoogleLogin} onEmailAuth={handleEmailAuth} onStartTrial={handleTrialLogin} onResetPassword={handleResetPassword} inProcess={authInProcess} error={authError} notice={authNotice} step={authStep} setStep={setAuthStep} />;
  if (trialTimeLeft.expired && !doctorInfo.isPremium && !doctorInfo.isAdmin) return <SubscriptionBlockedScreen onLogout={() => signOut(auth)} />;

  const premiumDaysLeft = doctorInfo.premiumExpiresAt ? Math.max(0, Math.ceil((doctorInfo.premiumExpiresAt - Date.now()) / 86400000)) : null;
  const sectionTitle = selectedPatientId ? 'Expediente' : ({ home: 'Inicio', patients: 'Pacientes', techniques: 'Técnicas', admin: 'Admin', settings: 'Ajustes', premium: 'QuiroApp PRO' }[activeTab] || 'Inicio');
  const todayLong = (() => { const s = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); })();
  const navItemCls = (active) => `flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition active:scale-[0.98] ${active ? 'bg-white/10 text-[#fff] border border-[#d8b878]/40' : 'text-[#b9d2d8] hover:bg-white/5 hover:text-white border border-transparent'}`;

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-500 ${visualMode === 'claro' ? 'theme-light bg-[#e9efec] text-slate-900' : 'bg-[#020617] text-white'}`}>
      <aside className="hidden lg:flex w-[250px] flex-none flex-col bg-gradient-to-b from-[#0b3b42] via-[#083039] to-[#07272d] text-[#fff] z-40">
        <div className="flex items-center gap-3 px-5 pt-6 pb-5">
          <img src={doctorInfo.logo || '/logo-quiroapp.png'} alt="Logo" className="w-11 h-11 rounded-2xl object-cover bg-white shadow-lg flex-none" />
          <div>
            <p className="font-extrabold text-[17px] leading-none">QuiroApp</p>
            <p className="text-[#d8b878] font-bold tracking-[0.2em] uppercase text-[8.5px] mt-1.5">Gestión Clínica</p>
          </div>
        </div>
        <nav className="px-3.5 space-y-1.5 mt-1">
          <button onClick={() => {setActiveTab('home'); setSelectedPatientId(null);}} className={navItemCls(activeTab === 'home' && !selectedPatientId)}><Home className="w-5 h-5" />Inicio</button>
          <button onClick={() => {setActiveTab('patients'); setSelectedPatientId(null);}} className={navItemCls(activeTab === 'patients' || !!selectedPatientId)}><Users className="w-5 h-5" />Pacientes</button>
          <button onClick={() => {setActiveTab('techniques'); setSelectedPatientId(null);}} className={navItemCls(activeTab === 'techniques')}><BookOpen className="w-5 h-5" />Técnicas</button>
          {doctorInfo.isAdmin && (<button onClick={() => {setActiveTab('admin'); setSelectedPatientId(null);}} className={navItemCls(activeTab === 'admin')}><TerminalSquare className="w-5 h-5" />Admin</button>)}
          <button onClick={() => {setActiveTab('settings'); setSelectedPatientId(null);}} className={navItemCls(activeTab === 'settings' || activeTab === 'premium')}><Settings className="w-5 h-5" />Ajustes</button>
        </nav>
        <div className="mt-auto px-4 pb-5 space-y-4">
          <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-4">
            {doctorInfo.isPremium ? (
              <><p className="text-[#d8b878] text-[9px] font-black tracking-[0.18em] uppercase">Licencia PRO</p><p className="text-[13px] font-bold mt-1.5 leading-snug">{premiumDaysLeft !== null ? `Activa · vence en ${premiumDaysLeft} días` : 'Activa'}</p></>
            ) : doctorInfo.isAdmin ? (
              <><p className="text-[#d8b878] text-[9px] font-black tracking-[0.18em] uppercase">Cuenta Admin</p><p className="text-[13px] font-bold mt-1.5 leading-snug">Acceso total</p></>
            ) : (
              <><p className="text-amber-300 text-[9px] font-black tracking-[0.18em] uppercase">Prueba Gratis</p><p className="text-[13px] font-bold mt-1.5 leading-snug">Te quedan {trialTimeLeft.days} días</p><button onClick={handleUpgradeRequest} className="mt-3 w-full bg-gradient-to-r from-[#d8b878] to-[#b08d3e] text-[#231a05] py-2.5 rounded-xl text-[10px] font-black uppercase active:scale-95 transition shadow">Obtener PRO</button></>
            )}
          </div>
          <div className="flex items-center gap-3 px-1">
            <span className="w-9 h-9 rounded-full bg-[#d8b878]/20 border border-[#d8b878]/50 text-[#d8b878] flex items-center justify-center font-extrabold text-sm flex-none">{String(doctorInfo.name || 'Q').charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold truncate">{String(doctorInfo.name || 'Especialista')}</p>
              <p className="text-[10px] text-[#9fc0c7] truncate">{String(doctorInfo.clinic || 'Mi consultorio')}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="lg:hidden p-6 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center z-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-400/30 overflow-hidden flex items-center justify-center">
              {doctorInfo.logo ? <img src={doctorInfo.logo} alt="Logo" className="w-7 h-7 object-cover" /> : <SpineLogo className="w-7 h-7 text-cyan-400" />}
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-[#fff]">Quiro<span className="text-cyan-400">App</span></h1>
          </div>
          <div className={`px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[7px] font-black uppercase flex items-center gap-1 shadow-sm ${isOnline ? 'text-cyan-400' : 'text-rose-500'}`}>{isOnline ? 'Sync Activo' : 'Offline'}</div>
        </header>

        <div className="hidden lg:flex items-center justify-between px-8 py-[18px] border-b border-slate-200/70 bg-white/70 backdrop-blur z-40">
          <h2 className="text-xl font-extrabold text-[#0b2b31]">{sectionTitle}</h2>
          <div className="flex items-center gap-3.5">
            <span className="text-xs font-semibold text-slate-500">{todayLong}</span>
            <span className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase flex items-center gap-1.5 ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}><span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>{isOnline ? 'Sync Activo' : 'Offline'}</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto z-10">
          <div className="max-w-[1180px] mx-auto w-full p-6 lg:px-8 lg:py-7 pb-36 lg:pb-12">
            {showVerifyBanner && (<div className="mb-6 bg-amber-50 border border-amber-300 rounded-3xl p-5 text-left shadow-sm animate-fade-in"><p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Verifica tu correo</p><p className="text-xs text-amber-800/80 mb-4 leading-relaxed">Tu cuenta aún no confirma <strong>{String(user.email)}</strong>. Te enviamos un enlace de confirmación al registrarte. Sin verificar tu correo, si un día pierdes tu contraseña no podrás recuperarla.</p><div className="flex gap-2"><button onClick={handleResendVerification} className="flex-1 bg-amber-500 text-[#fff] py-3 rounded-2xl font-black uppercase text-[10px] active:scale-95 shadow">Reenviar correo</button><button onClick={handleVerifiedReload} className="flex-1 bg-white text-amber-700 py-3 rounded-2xl font-black uppercase text-[10px] border border-amber-300 active:scale-95">Ya lo verifiqué</button></div></div>)}
            {selectedPatientId ? (
              <PatientProfile patient={patients.find(p => p.id === selectedPatientId)} doctorInfo={doctorInfo} onBack={() => setSelectedPatientId(null)} onAddHistory={() => setModals(m => ({...m, history: true}))} onSchedule={() => setModals(m => ({...m, appointment: true}))} onDelete={() => handleDeletePatient(selectedPatientId)} onEdit={() => setModals(m => ({...m, editPatient: true}))} />
            ) : (
              <>
                {activeTab === 'home' && <HomeTab appointments={appointments} patients={patients} doctorInfo={doctorInfo} onAddAppointment={() => setActiveTab('patients')} onOpenCalendar={() => setModals(m => ({...m, calendar: true}))} onUpgrade={handleUpgradeRequest} onNewPatient={handleOpenNewPatient} onBackup={handleBackup} onGoTechniques={() => { setActiveTab('techniques'); setSelectedPatientId(null); }} />}
                {activeTab === 'patients' && (
                  <div className="animate-fade-in space-y-4"><h2 className="text-3xl font-black uppercase italic mb-6 underline decoration-cyan-500 decoration-4 underline-offset-8">Pacientes</h2>
                    <div className="relative mb-6"><Search className="absolute left-4 top-4 text-indigo-500 w-5 h-5" /><input type="text" placeholder="Buscar expediente..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="w-full bg-slate-900 p-4 pl-12 rounded-3xl border border-white/10 text-white font-bold outline-none focus:border-cyan-500 transition-all" /></div>
                    {patients.length === 0 ? <div className="py-20 text-center opacity-30"><ClipboardList className="w-12 h-12 mx-auto mb-4" /><p className="text-xs font-black uppercase">Sin registros</p></div> : filteredPatients.length === 0 ? <div className="py-20 text-center opacity-30"><Search className="w-12 h-12 mx-auto mb-4" /><p className="text-xs font-black uppercase">Sin resultados para tu búsqueda</p></div> : filteredPatients.map(p => (
                      <div key={p.id} onClick={() => setSelectedPatientId(p.id)} className="bg-slate-900/50 p-5 rounded-[30px] border border-white/5 flex items-center justify-between active:scale-95 transition cursor-pointer hover:bg-slate-900">
                        <div><p className="font-black text-white uppercase italic text-lg">{String(p.name)}</p><p className="text-[10px] text-indigo-400 font-bold uppercase">{String(p.phone)}</p></div><ChevronRight className="w-6 h-6 text-cyan-400" />
                      </div>
                    ))}
                    <button onClick={handleOpenNewPatient} className="fixed bottom-36 right-6 lg:bottom-10 lg:right-10 w-16 h-16 bg-cyan-400 text-black rounded-[25px] shadow-2xl flex items-center justify-center active:scale-90 transition z-20 border-b-4 border-cyan-700 shadow-cyan-900/50"><Plus className="w-8 h-8" /></button>
                  </div>
                )}
                {activeTab === 'techniques' && (<Suspense fallback={<div className="py-20 text-center text-cyan-400 font-black uppercase tracking-widest text-xs">Cargando guía...</div>}><TechniquesTab /></Suspense>)}
                {activeTab === 'settings' && <ProfileTab user={user} doctorInfo={doctorInfo} patients={patients} onUpdateInfo={handleUpdateProfile} onLogout={() => signOut(auth)} onLinkGoogle={handleLinkGoogle} onLinkEmail={handleLinkEmail} onUpgrade={handleUpgradeRequest} onBackup={handleBackup} visualMode={visualMode} setVisualMode={setVisualMode} />}
                {activeTab === 'premium' && <PremiumTab onActivateCode={handleActivateCode} />}
                {activeTab === 'admin' && doctorInfo.isAdmin && <AdminTab codes={adminCodes} onGenerateCode={handleGenerateAdminCode} />}
              </>
            )}
          </div>
        </main>
      </div>

      {!doctorInfo.isPremium && <div className="lg:hidden fixed bottom-28 w-full px-6 z-40 pointer-events-none"><div className="bg-indigo-600/90 backdrop-blur-md p-3 rounded-full flex items-center justify-center gap-3 border border-white/20 shadow-xl mx-auto max-w-[200px]"><Clock className="w-4 h-4 text-cyan-300 animate-pulse" /><span className="text-[9px] font-black uppercase tracking-widest text-white">Prueba: <span className="text-cyan-300">{trialTimeLeft.days}d restantes</span></span></div></div>}

      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[500px] bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[35px] py-3 px-2 flex justify-around items-center z-50 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
        <button onClick={() => {setActiveTab('home'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' && !selectedPatientId ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-400 opacity-60 hover:text-white'}`}><Home className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Inicio</span></button>
        <button onClick={() => {setActiveTab('patients'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'patients' || selectedPatientId ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-400 opacity-60 hover:text-white'}`}><Users className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Pacientes</span></button>
        <button onClick={() => {setActiveTab('techniques'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'techniques' ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-400 opacity-60 hover:text-white'}`}><BookOpen className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Técnicas</span></button>
        {doctorInfo.isAdmin && (<button onClick={() => {setActiveTab('admin'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'admin' ? 'text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-slate-400 opacity-60 hover:text-white'}`}><TerminalSquare className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Admin</span></button>)}
        <button onClick={() => {setActiveTab('settings'); setSelectedPatientId(null);}} className={`flex flex-col items-center gap-1 transition-all ${(activeTab === 'settings' || activeTab === 'premium') ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-slate-400 opacity-60 hover:text-white'}`}><Settings className="w-6 h-6" /><span className="text-[8px] font-black uppercase">Ajustes</span></button>
      </nav>


      {modals.patient && <NewPatientModal onClose={() => setModals(m => ({...m, patient: false}))} onSave={handleAddPatient} />}
      {modals.history && <NewHistoryModal onClose={() => setModals(m => ({...m, history: false}))} onSave={handleAddHistory} />}
      {modals.appointment && <NewAppointmentModal onClose={() => setModals(m => ({...m, appointment: false}))} onSave={handleAddAppointment} />}
      {modals.calendar && <CalendarModal appointments={appointments} patients={patients} onClose={() => setModals(m => ({...m, calendar: false}))} onEditAppointment={(app) => setEditingAppointment(app)} onDeleteAppointment={handleDeleteAppointment} />}
      {modals.upsell && <UpsellModal onClose={() => setModals(m => ({...m, upsell: false}))} onUpgrade={() => { setModals(m => ({...m, upsell: false})); handleUpgradeRequest(); }} />}
      {modals.editPatient && selectedPatientId && <EditPatientModal patient={patients.find(p => p.id === selectedPatientId)} onClose={() => setModals(m => ({...m, editPatient: false}))} onSave={handleEditPatient} />}
      {editingAppointment && <NewAppointmentModal initial={editingAppointment} onClose={() => setEditingAppointment(null)} onSave={handleEditAppointment} />}
      
      <style dangerouslySetInnerHTML={{__html: `@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-slide-up { animation: slideUp 0.4s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}
