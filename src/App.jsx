import React, { useState, useEffect, useMemo, lazy, Suspense, useRef } from 'react';
import './index.css';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signInWithRedirect, getRedirectResult, EmailAuthProvider, linkWithCredential, linkWithPopup } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocFromServer, onSnapshot, addDoc, updateDoc, deleteDoc, runTransaction, getDocs } from 'firebase/firestore';
import { Home, Calendar as CalendarIcon, Users, Plus, X, ChevronRight, Search, Sparkles, Loader2, Settings, MessageSquare, LogOut, Globe, ClipboardList, BookOpen, Target, Cloud, Trash2, Lock, Activity, ShieldAlert, ShieldCheck, Mail, CheckCircle2, Ruler, Weight, UserCircle, Building, User, CreditCard, Clock, PlayCircle, WifiOff, HeartPulse, CalendarPlus, AlertTriangle, KeyRound, Copy, TerminalSquare, Upload, ImagePlus, Image as ImageIcon, Download, AlertOctagon, FileText, Stethoscope, Palette, ChevronDown, Pencil, Smartphone, Monitor, Tag, MessageCircle, Phone } from 'lucide-react';
import { auth, db, appId, TRIAL_DAYS, MAX_TRIAL_PATIENTS } from './lib/firebase.js';
import { openWhatsApp, generateSecureCode, authErrorMessage, safeFormatDate, calculateAge, generateClinicalHTML, CLINIC_THEMES, RED_FLAGS, CHIRO_TECHNIQUES, POSTURAL_DEVIATIONS, MOTIVOS_CONSULTA, LIST_IRRADIACION, LIST_EMPEORA, LIST_MEJORA, LIST_PREVIOS, LIST_PATOLOGICOS, LIST_MEDICAMENTOS, LIST_DIAGNOSTICOS, LIST_OBJETIVOS, LIST_FRECUENCIAS, LIST_RECOMENDACIONES, LIST_PRUEBAS, LIST_PALPACION, BONE_NOTE_SUGGESTIONS, LIST_HALLAZGOS, LIST_VISITA, LIST_RESPUESTA, LIST_PROXIMA } from './lib/utils.js';

// ===== Parte 8: planes por dispositivos =====
const PLANS = { duo: { name: 'Dúo', pc: 1, mobile: 1 }, equipo: { name: 'Equipo', pc: 3, mobile: 3 }, full: { name: 'Full Pack', pc: 10, mobile: 10 } };
// Parte 9: el WhatsApp de ventas vive en el perfil (Ajustes); si no hay, se usa el número original
const salesPhoneOf = (info) => ((info && info.salesWhatsApp) || '').replace(/\D/g, '') || '529996180031';
const getDeviceId = () => { try { let id = localStorage.getItem('quiroDeviceId'); if (!id) { id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)); localStorage.setItem('quiroDeviceId', id); } return id; } catch (e) { return 'dev-' + Date.now(); } };
const detectDevice = () => { const ua = navigator.userAgent || ''; const mobile = /iPad|iPhone|iPod|Android|Mobile/i.test(ua); const os = /Windows/i.test(ua) ? 'Windows' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Mac/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Web'; return { type: mobile ? 'mobile' : 'pc', label: (mobile ? 'Móvil' : 'Computadora') + ' · ' + os }; };


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
    <div className="bg-slate-950 w-full sm:max-w-3xl sm:w-[95%] rounded-t-[40px] sm:rounded-[50px] max-h-[95vh] overflow-y-auto shadow-2xl p-6 sm:p-10 border-t-4 border-[#b08d3e] text-white animate-slide-up relative scrollbar-hide">
      <div className="flex justify-between items-center mb-8 relative z-10">
        <h3 className="text-2xl font-black uppercase text-[#0b3b42] tracking-tight">{String(title)}</h3>
        <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 active:scale-90 transition"><X className="w-5 h-5" /></button>
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

const PremiumTab = ({ onActivateCode, salesPhone = "529996180031" }) => {
  const [code, setCode] = useState('');
  const [activating, setActivating] = useState(false);
  const handleActivate = async () => { if (!code) return; setActivating(true); await onActivateCode(code); setActivating(false); };
  return (
    <div className="animate-fade-in space-y-6 text-center py-6 px-2">
      <div className="bg-gradient-to-tr from-amber-400 to-orange-600 p-6 rounded-[35px] inline-block mb-2 shadow-[0_0_40px_rgba(251,191,36,0.3)]"><CreditCard className="w-12 h-12 text-black" /></div>
      <h2 className="text-3xl font-black uppercase italic text-white mb-2">Desbloquea <span className="text-amber-400">PRO</span></h2>
      <p className="text-indigo-200 text-sm leading-relaxed mb-8">Adquiere licencia para sincronizar tu cuenta en PC.</p>
      <button onClick={() => openWhatsApp(salesPhone, "Hola, me interesa adquirir QuiroApp PRO.")} className="w-full bg-amber-400 text-black font-black uppercase italic py-5 rounded-[25px] flex items-center justify-center gap-3 border-b-8 border-amber-600 active:scale-95 transition shadow-2xl mb-8"><MessageSquare className="w-6 h-6" /> WhatsApp</button>
      <div className="grid grid-cols-3 gap-2.5 mb-8 text-left">
        {Object.entries(PLANS).map(([id, p]) => (
          <div key={id} className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">
            <p className="text-[13px] font-black text-[#0b3b42]">{p.name}</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">{p.pc} PC / laptop<br />{p.mobile} móviles</p>
          </div>
        ))}
      </div>
      <div className="bg-slate-900/80 p-8 rounded-[40px] border border-cyan-400/20 text-left space-y-5 shadow-xl">
        <h4 className="text-cyan-400 font-black uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><KeyRound className="w-4 h-4"/> Tengo un código</h4>
        <input type="text" placeholder="Ej: PRO-X7Y8Z9" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="w-full bg-slate-950 p-5 rounded-3xl border border-white/10 text-white font-bold outline-none focus:border-cyan-400 tracking-[0.2em] uppercase text-center" />
        <button onClick={handleActivate} disabled={activating || !code} className="w-full bg-cyan-400 text-black py-4 rounded-3xl font-black uppercase italic border-b-4 border-cyan-700 active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50">{activating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activar Código'}</button>
      </div>
    </div>
  );
};

const AdminTab = ({ codes, onGenerateCodes, onGenerateUpgrade, onDeleteCode, onAssignBuyer }) => {
  const [duration, setDuration] = useState('Mensual');
  const [plan, setPlan] = useState('duo');
  const [qty, setQty] = useState(1);
  const [upgPlan, setUpgPlan] = useState('equipo');
  const [generating, setGenerating] = useState(false);
  const [lastBatch, setLastBatch] = useState(null);
  const [filter, setFilter] = useState('todos');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [assignFor, setAssignFor] = useState(null);
  const [assignText, setAssignText] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const sorted = useMemo(() => [...codes].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))), [codes]);
  const disp = sorted.filter(c => !c.used);
  const usados = sorted.filter(c => c.used);
  const nowD = new Date();
  const canjesMes = usados.filter(c => { if (!c.usedAt) return false; const d = new Date(c.usedAt); return d.getMonth() === nowD.getMonth() && d.getFullYear() === nowD.getFullYear(); }).length;
  const tasa = codes.length ? Math.round((usados.length / codes.length) * 100) : 0;
  const stockMes = disp.filter(c => c.kind !== 'upgrade' && c.type === 'Mensual').length;
  const stockAnu = disp.filter(c => c.kind !== 'upgrade' && c.type === 'Anual').length;
  const stockBajo = codes.length > 0 && (stockMes <= 1 || stockAnu <= 1);
  const filtered = sorted.filter(c => {
    if (filter === 'disp' && c.used) return false;
    if (filter === 'usados' && !c.used) return false;
    if (query) { const q = query.toLowerCase(); if (!(String(c.id).toLowerCase().includes(q) || String(c.buyerName || '').toLowerCase().includes(q) || String(c.usedByEmail || '').toLowerCase().includes(q))) return false; }
    return true;
  });
  const copyCode = (id) => { navigator.clipboard.writeText(id); setCopiedId(id); setTimeout(() => setCopiedId(null), 1600); };
  const waLink = (c) => {
    const planName = c.plan ? (PLANS[c.plan]?.name || '') : '';
    const msg = c.kind === 'upgrade'
      ? `Hola 👋 Tu código de MEJORA de plan para QuiroApp es: ${c.id}${planName ? ` (subes al plan ${planName})` : ''}. Canjéalo dentro de la app, en la sección Premium: https://quiro-app.vercel.app/`
      : `Hola 👋 Tu código de acceso PRO para QuiroApp es: ${c.id}${planName ? ` (Plan ${planName} · ${c.type})` : ` (${c.type})`}. Abre la app: https://quiro-app.vercel.app/ y actívalo en la sección Premium.`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };
  const handleGen = async () => { setGenerating(true); const out = await onGenerateCodes({ type: duration, days: duration === 'Mensual' ? 30 : 365, plan, qty }); setGenerating(false); if (out && out.length) setLastBatch({ codes: out, label: `${duration} · Plan ${PLANS[plan].name}` }); };
  const handleUpg = async () => { setGenerating(true); const code = await onGenerateUpgrade(upgPlan); setGenerating(false); if (code) setLastBatch({ codes: [code], label: `Mejora al plan ${PLANS[upgPlan].name} (sin tiempo extra)` }); };
  const fmtD = (iso) => iso ? safeFormatDate(String(iso).split('T')[0]) : '';
  const pill = "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border";
  const toggleCls = (on) => `px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide border transition active:scale-95 ${on ? 'bg-[#0b3b42] border-[#0b3b42] text-[#fff]' : 'bg-white border-slate-300 text-slate-500'}`;

  return (
    <div className="animate-fade-in space-y-5 text-left pb-10">
      <div className="flex items-center gap-3">
        <div className="p-3.5 bg-[#0b3b42] rounded-2xl shadow"><TerminalSquare className="w-7 h-7 text-[#d8b878]" /></div>
        <div>
          <h2 className="text-2xl font-black text-[#0b3b42] leading-none">Panel Admin</h2>
          <p className="text-xs text-slate-400 mt-1.5 font-semibold">Control maestro de licencias y planes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[['Disponibles', disp.length], ['Usados', usados.length], ['Canjes este mes', canjesMes], ['Tasa de canje', tasa + '%']].map(([l, v]) => (
          <div key={l} className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm"><p className="text-[22px] font-black text-[#0b3b42] leading-none">{v}</p><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1.5">{l}</p></div>
        ))}
      </div>

      {stockBajo && (
        <div className="bg-[#fdf6e0] border border-[#e8d9ac] text-[#7a5f1e] rounded-2xl px-4 py-3 text-[12.5px] font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-none" /> Te queda poco stock: {stockMes} Mensual(es) y {stockAnu} Anual(es) disponibles. Genera más para no quedarte sin códigos a mitad de una venta.
        </div>
      )}

      <div className="bg-white rounded-[28px] border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#0e7c5b]">Generar códigos</p>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setDuration('Mensual')} className={toggleCls(duration === 'Mensual')}>Mensual · 30 días</button>
          <button onClick={() => setDuration('Anual')} className={toggleCls(duration === 'Anual')}>Anual · 365 días</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(PLANS).map(([id, p]) => (
            <button key={id} onClick={() => setPlan(id)} className={toggleCls(plan === id)}>{p.name} · {p.pc} PC + {p.mobile} móvil</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {[1, 5, 10].map(n => <button key={n} onClick={() => setQty(n)} className={toggleCls(qty === n)}>×{n}</button>)}
          </div>
          <button onClick={handleGen} disabled={generating} className="flex-1 min-w-[180px] bg-[#0b3b42] text-[#fff] py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition shadow disabled:opacity-50 flex items-center justify-center gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#d8b878]" />} Generar {qty} código{qty > 1 ? 's' : ''}
          </button>
        </div>
        <div className="border-t border-dashed border-slate-200 pt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#b08d3e] mb-2.5">Mejora de plan (sube el cupo, sin tiempo extra)</p>
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(PLANS).map(([id, p]) => (
              <button key={id} onClick={() => setUpgPlan(id)} className={toggleCls(upgPlan === id)}>{p.name}</button>
            ))}
            <button onClick={handleUpg} disabled={generating} className="bg-[#b08d3e] text-[#fff] px-5 py-2.5 rounded-xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition disabled:opacity-50">Generar mejora</button>
          </div>
        </div>
        {lastBatch && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">✓ Generado · {lastBatch.label}</p>
            <div className="flex flex-wrap gap-2">
              {lastBatch.codes.map(cd => (
                <button key={cd} onClick={() => copyCode(cd)} className="font-mono font-black text-[13px] bg-white border border-emerald-300 text-[#0b3b42] px-3 py-1.5 rounded-xl active:scale-95 transition">{copiedId === cd ? '✓ Copiado' : cd}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2.5 bg-white border-[1.5px] border-[#cfe0da] rounded-2xl px-4 py-3 flex-1">
          <Search className="w-4 h-4 text-slate-400 flex-none" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar código, comprador o correo…" className="bg-transparent outline-none text-sm font-semibold text-slate-700 w-full placeholder:text-slate-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['todos', `Todos (${codes.length})`], ['disp', `Disponibles (${disp.length})`], ['usados', `Usados (${usados.length})`]].map(([id, l]) => (
            <button key={id} onClick={() => setFilter(id)} className={toggleCls(filter === id)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.map(c => (
          <div key={c.id} className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[17px] font-black text-[#0b3b42]">{String(c.id)}</span>
                  {c.kind === 'upgrade' ? <span className={`${pill} bg-[#fdf6e0] text-[#8a6d2f] border-[#e8d9ac]`}>Mejora</span> : <span className={`${pill} bg-[#eef5f2] text-[#0b5563] border-[#cfe3dc]`}>{String(c.type || '')}</span>}
                  {c.plan && PLANS[c.plan] && <span className={`${pill} bg-[#eef5f2] text-[#0b5563] border-[#cfe3dc]`}>Plan {PLANS[c.plan].name}</span>}
                  <span className={`${pill} ${c.used ? 'bg-[#fdeef4] text-[#9d2b57] border-[#f3c4d8]' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{c.used ? 'Usado' : 'Disponible'}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold mt-1.5">
                  Creado {fmtD(c.createdAt)}{c.used && c.usedAt ? ` · Canjeado ${fmtD(c.usedAt)}` : ''}{c.used && c.usedByEmail ? ` · ${String(c.usedByEmail)}` : ''}{c.buyerName ? ` · Para: ${String(c.buyerName)}` : ''}
                </p>
              </div>
              {!c.used && (
                <div className="flex gap-1.5 flex-none">
                  <button onClick={() => copyCode(c.id)} title="Copiar" className="p-2.5 bg-[#eef5f2] border border-[#cfe3dc] rounded-xl text-[#0b3b42] active:scale-90 transition">{copiedId === c.id ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}</button>
                  <a href={waLink(c)} target="_blank" rel="noreferrer" title="Enviar por WhatsApp" className="p-2.5 bg-[#e7f8ee] border border-[#bbe7cc] rounded-xl text-[#15803d] active:scale-90 transition inline-flex"><MessageCircle className="w-4 h-4" /></a>
                  <button onClick={() => { setAssignFor(assignFor === c.id ? null : c.id); setAssignText(String(c.buyerName || '')); }} title="Asignar comprador" className="p-2.5 bg-[#fdf6e0] border border-[#e8d9ac] rounded-xl text-[#8a6d2f] active:scale-90 transition"><Tag className="w-4 h-4" /></button>
                  {confirmDel === c.id ? (
                    <span className="flex gap-1 items-center">
                      <button onClick={() => { onDeleteCode(c.id); setConfirmDel(null); }} className="px-3 py-2.5 bg-rose-500 text-[#fff] rounded-xl text-[10px] font-black uppercase active:scale-90 transition">Borrar</button>
                      <button onClick={() => setConfirmDel(null)} className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 active:scale-90 transition">No</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDel(c.id)} title="Borrar código" className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-500 active:scale-90 transition"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              )}
            </div>
            {assignFor === c.id && !c.used && (
              <div className="flex gap-2 mt-3">
                <input value={assignText} onChange={e => setAssignText(e.target.value)} placeholder="Nombre del comprador (tu control)…" className="flex-1 bg-[#f7faf8] border-[1.5px] border-[#cfe0da] rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-slate-700 outline-none" />
                <button onClick={() => { onAssignBuyer(c.id, assignText.trim()); setAssignFor(null); }} className="bg-[#0b3b42] text-[#fff] px-4 rounded-xl text-[11px] font-black uppercase active:scale-95 transition">Guardar</button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center text-sm font-bold text-slate-400">Ningún código coincide con el filtro o la búsqueda.</div>}
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
  const totalSessions = patients.reduce((n, p) => n + (Array.isArray(p.histories) ? p.histories.length : 0), 0);
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

const PainChart = ({ histories }) => {
  const chrono = [...histories].reverse().filter(h => typeof h.painLevel === 'number');
  if (chrono.length < 2) return null;
  const W = 320, H = 96, PL = 10, PR = 22, PT = 14, PB = 10;
  const xs = (i) => PL + (i * (W - PL - PR)) / (chrono.length - 1);
  const ys = (v) => PT + (10 - v) * ((H - PT - PB) / 10);
  const pts = chrono.map((h, i) => `${xs(i)},${ys(h.painLevel)}`).join(' ');
  const band = (v) => v <= 3 ? '#059669' : v <= 6 ? '#d97706' : '#e11d48';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24">
      {[0, 5, 10].map(g => (<g key={g}><line x1={PL} x2={W - PR} y1={ys(g)} y2={ys(g)} stroke="#e2e8f0" strokeDasharray="3 4" strokeWidth="1" /><text x={W - 2} y={ys(g) + 2.5} fontSize="7.5" fill="#94a3b8" fontWeight="700">{g}</text></g>))}
      <polyline points={pts} fill="none" stroke="#0b5563" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {chrono.map((h, i) => (<circle key={i} cx={xs(i)} cy={ys(h.painLevel)} r="4" fill={band(h.painLevel)} stroke="#ffffff" strokeWidth="1.5" />))}
    </svg>
  );
};

const PlanesSection = ({ patient, onSavePlanes }) => {
  const [planes, setPlanes] = useState(patient.planes || null);
  useEffect(() => { setPlanes(patient.planes || null); }, [patient.id, patient.planes]);
  const dirty = JSON.stringify(planes || {}) !== JSON.stringify(patient.planes || {});
  return (
    <div className="bg-white p-5 rounded-[32px] border border-slate-300 shadow-[0_8px_22px_rgba(8,48,57,0.08)] animate-fade-in">
      <h4 className="text-[11px] font-black text-[#0b3b42] uppercase tracking-widest mb-1">Planos Anatómicos · Rayos X</h4>
      <p className="text-[11px] text-slate-400 mb-4">Marca los huesos desde las opciones de abajo; se encienden en dorado en la imagen.</p>
      <XRayPlanes value={planes} onChange={setPlanes} />
      {dirty && <button onClick={() => onSavePlanes(planes)} className="w-full mt-4 bg-[#0b3b42] text-[#fff] py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition shadow">Guardar Planos</button>}
    </div>
  );
};

const PatientProfile = ({ patient, doctorInfo, onBack, onAddHistory, onDelete, onSchedule, onEdit, onEditHistory, onDeleteHistory, onSavePlanes }) => {
  const [activeSection, setActiveSection] = useState('historial');
  const edadMostrar = patient.birthDate ? calculateAge(patient.birthDate) : patient.age;
  const bmi = (patient.weight && patient.height) ? (parseFloat(patient.weight) / ((parseFloat(patient.height)/100)**2)).toFixed(1) : '--';
  const historyEntries = patient.histories || [];
  const chronoHist = [...historyEntries].reverse();
  const painDelta = chronoHist.length >= 2 ? (chronoHist[chronoHist.length - 1].painLevel ?? 0) - (chronoHist[0].painLevel ?? 0) : 0;
  const [confirmDelete, setConfirmDelete] = useState(null);
  const ci = patient.currentIllness || {};
  const life = patient.lifestyle || {};
  const ex = patient.exploration || {};
  const darkChip = "text-[9px] bg-white/5 border border-white/10 text-indigo-100 px-2.5 py-1 rounded-lg font-extrabold uppercase";
  const darkLbl = "text-[8px] text-indigo-400 uppercase font-black tracking-widest";

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
      
      {activeSection === 'identidad' && (<div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4 animate-fade-in"><div className="grid grid-cols-2 gap-4"><div><p className="text-[8px] text-indigo-400 uppercase font-black">Sexo</p><p className="text-sm font-bold text-white">{patient.gender || '--'}</p></div><div><p className="text-[8px] text-indigo-400 uppercase font-black">Edad</p><p className="text-sm font-bold text-white">{edadMostrar ? `${edadMostrar} años` : '--'}</p></div><div className="col-span-2"><p className="text-[8px] text-indigo-400 uppercase font-black">Dirección</p><p className="text-sm font-bold text-white">{patient.address || '--'}</p></div>{patient.occupation && (<div><p className={darkLbl}>Ocupación</p><p className="text-sm font-bold text-white">{patient.occupation}</p></div>)}{(patient.origin && patient.origin.length > 0) && (<div><p className={darkLbl}>¿Cómo nos conoció?</p><p className="text-sm font-bold text-white">{patient.origin.join(', ')}</p></div>)}{patient.emergencyName && (<div className="col-span-2"><p className={darkLbl}>Contacto de emergencia</p><p className="text-sm font-bold text-white">{patient.emergencyName}{patient.emergencyPhone ? ' · ' + patient.emergencyPhone : ''}</p></div>)}{(patient.allergies && patient.allergies.length > 0) && (<div className="col-span-2"><p className={darkLbl}>Alergias</p><p className="text-sm font-bold text-white">{patient.allergies.join(', ')}</p></div>)}</div></div>)}
      {activeSection === 'historial' && (<div className="space-y-4 animate-fade-in">
        <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
          <div><h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Motivo Consulta</h4><p className="text-sm italic text-indigo-100 bg-slate-950 p-4 rounded-2xl">{patient.consultationReason || "--"}</p></div>
          {(ci.tiempoUnidad || ci.inicio || (ci.irradiacion && ci.irradiacion.length > 0) || (ci.empeora && ci.empeora.length > 0) || (ci.mejora && ci.mejora.length > 0) || (ci.previos && ci.previos.length > 0)) && (
            <div className="grid grid-cols-2 gap-4">
              {ci.tiempoUnidad && (<div><p className={darkLbl}>Evolución</p><p className="text-sm font-bold text-white">{[ci.tiempoValor, ci.tiempoUnidad].filter(Boolean).join(' ')}</p></div>)}
              {ci.inicio && (<div><p className={darkLbl}>Inicio</p><p className="text-sm font-bold text-white">{ci.inicio}</p></div>)}
              {(ci.irradiacion && ci.irradiacion.length > 0) && (<div className="col-span-2"><p className={darkLbl}>Irradiación</p><p className="text-sm font-bold text-white">{ci.irradiacion.join(', ')}</p></div>)}
              {(ci.empeora && ci.empeora.length > 0) && (<div className="col-span-2"><p className={darkLbl}>Empeora con</p><p className="text-sm font-bold text-white">{ci.empeora.join(', ')}</p></div>)}
              {(ci.mejora && ci.mejora.length > 0) && (<div className="col-span-2"><p className={darkLbl}>Mejora con</p><p className="text-sm font-bold text-white">{ci.mejora.join(', ')}</p></div>)}
              {(ci.previos && ci.previos.length > 0) && (<div className="col-span-2"><p className={darkLbl}>Tratamientos previos</p><p className="text-sm font-bold text-white">{ci.previos.join(', ')}</p></div>)}
            </div>
          )}
        </div>
        {((patient.pathologicalList && patient.pathologicalList.length > 0) || (patient.medications && patient.medications.length > 0) || patient.pathological) && (
          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Antecedentes</h4>
            {(patient.pathologicalList && patient.pathologicalList.length > 0) && (<div className="flex flex-wrap gap-1.5">{patient.pathologicalList.map(x => <span key={x} className={darkChip}>{x}</span>)}</div>)}
            {(patient.medications && patient.medications.length > 0) && (<div><p className={darkLbl}>Medicamentos actuales</p><p className="text-sm font-bold text-white">{patient.medications.join(', ')}</p></div>)}
            {patient.pathological && (<p className="text-sm text-indigo-100">{patient.pathological}</p>)}
          </div>
        )}
        {(life.actividad || life.trabajo || life.tabaco || life.alcohol || life.sueno || life.estres || patient.nonPathological) && (
          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-3">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Estilo de vida</h4>
            <div className="grid grid-cols-2 gap-4">
              {life.actividad && (<div><p className={darkLbl}>Actividad física</p><p className="text-sm font-bold text-white">{life.actividad}</p></div>)}
              {life.trabajo && (<div><p className={darkLbl}>Trabajo</p><p className="text-sm font-bold text-white">{life.trabajo}</p></div>)}
              {life.tabaco && (<div><p className={darkLbl}>Tabaco</p><p className="text-sm font-bold text-white">{life.tabaco}</p></div>)}
              {life.alcohol && (<div><p className={darkLbl}>Alcohol</p><p className="text-sm font-bold text-white">{life.alcohol}</p></div>)}
              {life.sueno && (<div><p className={darkLbl}>Sueño</p><p className="text-sm font-bold text-white">{life.sueno}</p></div>)}
              {life.estres && (<div><p className={darkLbl}>Estrés</p><p className="text-sm font-bold text-white">{life.estres}</p></div>)}
            </div>
            {patient.nonPathological && (<p className="text-sm text-indigo-100">{patient.nonPathological}</p>)}
          </div>
        )}
        {(patient.redFlags && patient.redFlags.length > 0) && (
          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-3">
            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Banderas Rojas</h4>
            <div className="flex flex-wrap gap-1.5">{patient.redFlags.map(f => <span key={f} className="text-[9px] bg-rose-500/15 border border-rose-400/30 text-rose-300 px-2.5 py-1 rounded-lg font-extrabold uppercase">{f}</span>)}</div>
          </div>
        )}
      </div>)}
      {activeSection === 'evaluacion' && (<div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="bg-slate-900 p-3 rounded-2xl border border-white/5 text-center"><p className="text-[8px] font-black text-indigo-400 uppercase">Peso</p><p className="text-xs font-bold text-white">{patient.weight || '-'}kg</p></div>
          <div className="bg-slate-900 p-3 rounded-2xl border border-white/5 text-center"><p className="text-[8px] font-black text-indigo-400 uppercase">Altura</p><p className="text-xs font-bold text-white">{patient.height || '-'}cm</p></div>
          <div className="bg-indigo-900/40 p-3 rounded-2xl border border-cyan-400/20 text-center"><p className="text-[8px] font-black text-cyan-400 uppercase">IMC</p><p className="text-xs font-bold text-cyan-400">{bmi}</p></div>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
          <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Dx Quiropráctico</h5><p className="text-sm font-bold text-cyan-300">{patient.chiropracticDiagnosis || "--"}</p></div>
        </div>
        {((ex.tests && ex.tests.length > 0) || (ex.palpation && ex.palpation.length > 0) || Object.values(ex.rom || {}).some(Boolean) || ex.detail) && (
          <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Exploración Física</h4>
            {Object.values(ex.rom || {}).some(Boolean) && (<div className="space-y-1.5">{Object.entries(ex.rom || {}).filter(([, v]) => v).map(([k, v]) => <p key={k} className="text-sm text-indigo-100"><span className="font-bold text-white">{k}:</span> {v}</p>)}</div>)}
            {(ex.tests && ex.tests.length > 0) && (<div className="flex flex-wrap gap-1.5">{ex.tests.map(t => <span key={t.name} className={`text-[9px] px-2.5 py-1 rounded-lg font-extrabold uppercase border ${t.result === '+' ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300' : 'bg-rose-500/15 border-rose-400/30 text-rose-300'}`}>{t.name} {t.result}</span>)}</div>)}
            {(ex.palpation && ex.palpation.length > 0) && (<div><p className={darkLbl}>Palpación</p><p className="text-sm font-bold text-white">{ex.palpation.join(', ')}</p></div>)}
            {ex.detail && (<p className="text-sm italic text-indigo-100">{ex.detail}</p>)}
          </div>
        )}
        {patient.consent && patient.consent.accepted && (<div className="bg-emerald-500/10 border border-emerald-400/25 p-4 rounded-3xl flex items-center gap-2.5"><ShieldCheck className="w-4 h-4 text-emerald-400 flex-none" /><p className="text-[11px] font-bold text-emerald-300">Consentimiento informado aceptado · {safeFormatDate((patient.consent.date || '').split('T')[0])}</p></div>)}
      </div>)}
      {activeSection === 'anatomia' && (<div className="space-y-4 animate-fade-in">
        <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5"><h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Postura Anterior</h4><p className="text-sm text-indigo-100 mb-4">{patient.postureAnterior || "--"}</p><h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Postura Lateral</h4><p className="text-sm text-indigo-100 mb-4">{patient.postureLateral || "--"}</p><h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Postura Posterior</h4><p className="text-sm text-indigo-100">{patient.posturePosterior || "--"}</p></div>
        <PlanesSection patient={patient} onSavePlanes={onSavePlanes} />
      </div>)}
      {activeSection === 'tratamiento' && (<div className="space-y-4 animate-fade-in">
        <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 space-y-4 animate-fade-in">
          <div><h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Plan</h5><p className="text-sm text-indigo-100">{patient.treatmentPlan || "--"}</p></div>
          {(patient.objectives && patient.objectives.length > 0) && (<div><p className={darkLbl}>Objetivos</p><div className="flex flex-wrap gap-1.5 mt-1">{patient.objectives.map(o => <span key={o} className={darkChip}>{o}</span>)}</div></div>)}
          {(patient.frequency || patient.estimatedSessions) && (<div className="grid grid-cols-2 gap-4">{patient.frequency && (<div><p className={darkLbl}>Frecuencia</p><p className="text-sm font-bold text-white">{patient.frequency}</p></div>)}{patient.estimatedSessions && (<div><p className={darkLbl}>Sesiones estimadas</p><p className="text-sm font-bold text-white">{patient.estimatedSessions}</p></div>)}</div>)}
          {(patient.homeRecommendations && patient.homeRecommendations.length > 0) && (<div><p className={darkLbl}>Recomendaciones en casa</p><div className="flex flex-wrap gap-1.5 mt-1">{patient.homeRecommendations.map(r => <span key={r} className={darkChip}>{r}</span>)}</div></div>)}
        </div>
      </div>)}
      {activeSection === 'sesiones' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-5 mt-2 gap-3 flex-wrap">
            <h3 className="text-lg font-extrabold text-[#0b2b31] flex items-center gap-2"><ClipboardList className="w-5 h-5 text-[#0b5563]" /> Historial de Sesiones <span className="text-xs font-bold text-slate-400">({historyEntries.length})</span></h3>
            <button onClick={onAddHistory} className="bg-[#0b3b42] text-[#fff] px-4 py-2.5 rounded-xl active:scale-95 transition shadow font-extrabold uppercase text-[10px] flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Ajuste</button>
          </div>

          {historyEntries.length >= 2 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-300 shadow-[0_8px_22px_rgba(8,48,57,0.09)] mb-5">
              <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.16em]">Evolución del dolor (EVA)</p>
                {painDelta < 0 ? <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full">▼ {Math.abs(painDelta)} · Mejorando</span> : painDelta > 0 ? <span className="text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-full">▲ {painDelta} · A vigilar</span> : <span className="text-[10px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full">Sin cambio</span>}
              </div>
              <PainChart histories={historyEntries} />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1"><span>Inicio: {String(chronoHist[0]?.painLevel ?? 0)}/10 · {safeFormatDate(chronoHist[0]?.date)}</span><span>Última: {String(chronoHist[chronoHist.length - 1]?.painLevel ?? 0)}/10 · {safeFormatDate(chronoHist[chronoHist.length - 1]?.date)}</span></div>
            </div>
          )}

          {historyEntries.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-white/60">
              <Stethoscope className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin registros clínicos</p>
              <p className="text-[11px] text-slate-400 mt-2">Registra el primer ajuste con el botón «Nuevo Ajuste».</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyEntries.map((h, i) => {
                const hasRedFlags = h.redFlags && h.redFlags.length > 0;
                const hasPosture = h.postureAnterior || h.postureLateral || h.posturePosterior;
                return (
                  <div key={h.id || i} className="bg-white p-5 rounded-3xl border border-slate-300 shadow-[0_8px_22px_rgba(8,48,57,0.07)] text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="mr-auto">
                        <p className="font-extrabold text-[#0b2b31] text-sm">Sesión {historyEntries.length - i}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{safeFormatDate(h.date)}</p>
                      </div>
                      <span className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-xl border ${h.painLevel <= 3 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : h.painLevel <= 6 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>Dolor {String(h.painLevel ?? 0)}/10</span>
                      {h.painOut !== null && h.painOut !== undefined && (<span className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-xl border ${h.painOut <= 3 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : h.painOut <= 6 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>Sale {String(h.painOut)}/10</span>)}
                      <button onClick={() => onEditHistory(h, i)} className="p-2 text-slate-400 hover:text-[#0b3b42] bg-slate-50 border border-slate-200 rounded-lg active:scale-90 transition" title="Editar sesión"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDelete(confirmDelete === i ? null : i)} className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50 border border-rose-100 rounded-lg active:scale-90 transition" title="Borrar sesión"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    {confirmDelete === i && (
                      <div className="mt-3.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-rose-600">¿Borrar esta sesión? No se puede deshacer.</span>
                        <button onClick={() => { onDeleteHistory(i); setConfirmDelete(null); }} className="ml-auto bg-rose-500 text-[#fff] text-[10px] font-black uppercase px-3 py-1.5 rounded-lg active:scale-95 transition">Sí, borrar</button>
                        <button onClick={() => setConfirmDelete(null)} className="bg-white border border-slate-300 text-slate-500 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg active:scale-95 transition">Cancelar</button>
                      </div>
                    )}

                    {hasRedFlags && (
                      <div className="flex flex-wrap gap-1.5 mt-3.5">
                        {h.redFlags.map(f => <span key={f} className="text-[9px] bg-rose-50 border border-rose-200 text-rose-500 px-2.5 py-1 rounded-lg font-extrabold uppercase flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> {String(f)}</span>)}
                      </div>
                    )}

                    {h.notes && <p className="text-[13px] italic text-slate-600 bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 mt-3.5 leading-relaxed">“{String(h.notes)}”</p>}

                    {(h.areas?.length > 0 || h.techniques?.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 mt-3.5">
                        {h.areas?.map(a => <span key={a} className="text-[9px] bg-[#eef5f2] px-2.5 py-1.5 rounded-lg border border-[#cfe3dc] text-[#0b5563] font-extrabold uppercase tracking-wide flex items-center gap-1"><Target className="w-3 h-3" /> {String(a)}</span>)}
                        {h.techniques?.map(t => <span key={t} className="text-[9px] bg-[#fdf6e0] px-2.5 py-1.5 rounded-lg border border-[#e8d9ac] text-[#8a6d2f] font-extrabold uppercase tracking-wide flex items-center gap-1"><BookOpen className="w-3 h-3" /> {String(t)}</span>)}
                      </div>
                    )}

                    {(h.visitReason || h.response || h.nextVisit || (h.recommendations && h.recommendations.length > 0)) && (
                      <div className="flex flex-wrap gap-1.5 mt-3.5">
                        {h.visitReason && <span className="text-[9px] bg-[#eef5f2] px-2.5 py-1.5 rounded-lg border border-[#cfe3dc] text-[#0b5563] font-extrabold uppercase tracking-wide">{String(h.visitReason)}</span>}
                        {h.response && <span className="text-[9px] bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 font-extrabold uppercase tracking-wide">{String(h.response)}</span>}
                        {h.recommendations?.map(r => <span key={r} className="text-[9px] bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 font-extrabold uppercase tracking-wide">{String(r)}</span>)}
                        {h.nextVisit && <span className="text-[9px] bg-[#fdf6e0] px-2.5 py-1.5 rounded-lg border border-[#e8d9ac] text-[#8a6d2f] font-extrabold uppercase tracking-wide">Próx: {String(h.nextVisit)}</span>}
                      </div>
                    )}

                    {hasPosture && (
                      <div className="mt-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-1.5">
                        {[['Anterior', h.postureAnterior], ['Lateral', h.postureLateral], ['Posterior', h.posturePosterior]].filter(([, v]) => v).map(([k, v]) => (
                          <p key={k} className="text-[11px] text-slate-500 leading-relaxed"><span className="font-extrabold text-[#0b3b42] uppercase text-[9px] tracking-wider mr-1.5">{k}:</span>{String(v)}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProfileTab = ({ user, doctorInfo, patients, onUpdateInfo, onLogout, onLinkGoogle, onLinkEmail, onUpgrade, onBackup, visualMode, setVisualMode, devices = [], currentDeviceId, onReleaseDevice }) => {
  const planDef = PLANS[doctorInfo.plan] || null;
  const salesPhone = salesPhoneOf(doctorInfo);
  const pcUsed = devices.filter(d => d.type === 'pc').length;
  const mobUsed = devices.filter(d => d.type !== 'pc').length;
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

  // ===== Parte 9: Ajustes Diseño 2 (lista iOS) + mejoras =====
  const [openDevices, setOpenDevices] = useState(false);
  const [openHelp, setOpenHelp] = useState(null);
  const [isEditingOffice, setIsEditingOffice] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState(doctorInfo.licenseNumber || '');
  const [officeAddress, setOfficeAddress] = useState(doctorInfo.officeAddress || '');
  const [officePhone, setOfficePhone] = useState(doctorInfo.officePhone || '');
  const [salesWhatsApp, setSalesWhatsApp] = useState(doctorInfo.salesWhatsApp || '');
  const [officeSaved, setOfficeSaved] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [lastBackup, setLastBackup] = useState(() => { try { const v = localStorage.getItem('quiroLastBackup'); return v ? parseInt(v) : null; } catch (e) { return null; } });

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

  const handleSaveOffice = async () => {
    if (isLocked) return;
    setIsSaving(true);
    await onUpdateInfo({ licenseNumber, officeAddress, officePhone, salesWhatsApp });
    setIsSaving(false);
    setOfficeSaved(true);
    setTimeout(() => { setOfficeSaved(false); setIsEditingOffice(false); }, 1500);
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

  const isEmailUser = !!(user.providerData || []).some(p => p.providerId === 'password');
  const handleChangePassword = async () => {
    if (user.isAnonymous) { setPassMsg('Tu cuenta es temporal: vincúlala con Google o correo (botón de arriba) para poder protegerla con contraseña.'); return; }
    if (!isEmailUser) { setPassMsg('Tu cuenta entra con Google: la contraseña se gestiona desde tu cuenta de Google.'); return; }
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPassMsg('Te enviamos el enlace para cambiar tu contraseña a ' + user.email + '. Revisa también la carpeta de spam; el enlace dura 1 hora.');
    } catch (e) { setPassMsg(authErrorMessage(e)); }
  };

  const handleBackupClick = () => {
    onBackup();
    const now = Date.now();
    try { localStorage.setItem('quiroLastBackup', String(now)); } catch (e) {}
    setLastBackup(now);
  };
  const backupStale = !lastBackup || (Date.now() - lastBackup > 60 * 86400000);
  const lastBackupText = lastBackup ? safeFormatDate(new Date(lastBackup).toISOString().split('T')[0]) : null;

  const currentTheme = CLINIC_THEMES[doctorInfo.theme] || CLINIC_THEMES['azul'];
  const inputClass = "w-full bg-[#f7faf8] border-[1.5px] border-[#cfe0da] rounded-2xl px-4 py-3.5 text-[13.5px] font-semibold text-[#22332d] outline-none focus:border-[#0b3b42] transition disabled:opacity-50";
  const remainingDays = getProRemainingDays();

  const Group = ({ label, children }) => (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-2 mb-2">{label}</p>
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_5px_16px_rgba(8,48,57,0.05)] px-4 sm:px-5 overflow-hidden">{children}</div>
    </div>
  );
  const Row = ({ icon: Icon, iconCls = 'bg-[#eef5f2] border-[#cfe3dc] text-[#0b3b42]', title, sub, value, onClick, last = false }) => (
    <div onClick={onClick} className={`flex items-center gap-3 py-3.5 ${last ? '' : 'border-b border-[#eef3f0]'} ${onClick ? 'cursor-pointer active:bg-[#f7faf8] transition rounded-xl px-1 -mx-1' : ''}`}>
      <span className={`w-[34px] h-[34px] flex-none rounded-[10px] border flex items-center justify-center ${iconCls}`}><Icon className="w-4 h-4" /></span>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold text-[#23423c] leading-snug">{title}</p>
        {sub && <p className="text-[11px] font-semibold text-slate-400 leading-snug mt-0.5">{sub}</p>}
      </div>
      {value && <span className="text-[12px] font-semibold text-slate-400 text-right truncate max-w-[45%]">{value}</span>}
      {onClick && <ChevronRight className="w-4 h-4 text-[#b6c8c1] flex-none" />}
    </div>
  );

  return (
    <div className="animate-fade-in text-left max-w-[680px] mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-start gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Configuración</p>
          <h2 className="text-[26px] font-black text-[#0b3b42] mt-0.5">Ajustes</h2>
        </div>
        <div className="relative z-50">
          <button
            onClick={() => isLocked ? onUpgrade() : setShowProDetails(!showProDetails)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-wider shadow-sm transition-all border ${isLocked ? 'bg-[#fdf6e0] text-[#8a6d2f] border-[#e8d9ac]' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5"/> : <ShieldCheck className="w-3.5 h-3.5"/>}
            {isLocked ? 'Activar PRO' : 'Sincronización PRO'}
          </button>
          {showProDetails && !isLocked && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-slate-200 p-5 rounded-3xl shadow-2xl z-50 animate-slide-up text-left">
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-5 h-5 text-[#0b3b42]"/>
                <p className="text-[10px] font-black uppercase text-[#0b3b42] tracking-widest">Licencia en Nube</p>
              </div>
              <p className="text-xs text-slate-500 mb-4 uppercase font-bold">Tiempo restante: <br/><span className="text-xl text-emerald-500 font-black">{remainingDays} días</span></p>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[9px] text-slate-400 uppercase mb-3 font-bold tracking-widest">Sincronización de Cuenta</p>
                {user.isAnonymous ? (
                  <div className="space-y-2">
                    <button onClick={onLinkGoogle} className="w-full bg-white text-black text-[9px] font-black uppercase py-3 rounded-xl flex items-center justify-center gap-2 shadow border border-slate-200"><Globe className="w-4 h-4"/> Google</button>
                    <button onClick={() => setShowEmailForm(!showEmailForm)} className="w-full bg-[#0b3b42] text-[#fff] text-[9px] font-black uppercase py-3 rounded-xl flex items-center justify-center gap-2 shadow"><Mail className="w-4 h-4"/> Correo</button>
                    {showEmailForm && (
                      <div className="mt-2 space-y-2">
                        <input type="email" placeholder="Correo" value={emailLink} onChange={e => setEmailLink(e.target.value)} className="w-full bg-[#f7faf8] border border-[#cfe0da] p-3 rounded-lg text-slate-700 text-[11px] outline-none" />
                        <input type="password" placeholder="Contraseña" value={passLink} onChange={e => setPassLink(e.target.value)} className="w-full bg-[#f7faf8] border border-[#cfe0da] p-3 rounded-lg text-slate-700 text-[11px] outline-none" />
                        <button onClick={() => onLinkEmail(emailLink, passLink)} className="w-full bg-[#b08d3e] text-[#fff] py-2.5 rounded-lg text-[9px] font-black uppercase shadow">Guardar</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 py-3 rounded-xl flex justify-center items-center gap-2 font-black text-[10px] uppercase"><CheckCircle2 className="w-4 h-4"/> Cuenta Vinculada</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta de identidad (toca para editar) */}
      <div>
        <button onClick={() => setIsEditing(!isEditing)} className="w-full bg-white rounded-[26px] border border-slate-200 shadow-[0_5px_16px_rgba(8,48,57,0.05)] overflow-hidden text-left active:scale-[0.99] transition">
          <div className={`h-2.5 ${currentTheme.bg}`}></div>
          <div className="p-5 flex items-center gap-4">
            <div className="w-[62px] h-[62px] flex-none rounded-[18px] border border-slate-200 bg-white flex items-center justify-center overflow-hidden">
              {doctorInfo.logo ? <img src={doctorInfo.logo} className="w-full h-full object-cover" alt="Logo"/> : <User className="w-7 h-7 text-[#0b3b42]/40"/>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-[#0b3b42] text-[16px] truncate">{doctorInfo.name || 'Tu Nombre'}</p>
              <p className="text-[11.5px] text-slate-400 font-semibold truncate">{doctorInfo.title || 'Especialista'} · {doctorInfo.clinic || 'Tu Clínica'}</p>
              <p className="mt-1.5 flex flex-wrap gap-1.5">
                {doctorInfo.isPremium
                  ? <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full">Licencia PRO · Activa</span>
                  : <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-500 border border-rose-200 px-2.5 py-1 rounded-full">Sin licencia PRO</span>}
                {planDef
                  ? <span className="text-[9px] font-black uppercase tracking-wider bg-[#fdf6e0] text-[#8a6d2f] border border-[#e8d9ac] px-2.5 py-1 rounded-full">Plan {planDef.name}</span>
                  : <span className="text-[9px] font-black uppercase tracking-wider bg-[#fdf6e0] text-[#8a6d2f] border border-[#e8d9ac] px-2.5 py-1 rounded-full">Legado · sin límite</span>}
                {remainingDays != null && doctorInfo.isPremium && <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full">{remainingDays} días restantes</span>}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#b6c8c1] flex-none" />
          </div>
        </button>
        <p className="text-[11px] text-slate-400 font-semibold ml-2 mt-1.5">Toca tu tarjeta para editar tu perfil.</p>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-[26px] border border-slate-200 shadow-sm animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[12px] font-black uppercase text-[#0b3b42] tracking-widest flex items-center gap-2"><Settings className="w-4 h-4"/> Editar Perfil</h3>
            <button onClick={() => setIsEditing(false)} className="text-[10px] font-black uppercase text-slate-400 px-3 py-2 bg-slate-50 border border-slate-200 rounded-full flex items-center gap-1"><X className="w-3 h-3"/> Cancelar</button>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#0b5563] tracking-widest flex items-center gap-1.5 mb-2"><ImagePlus className="w-3.5 h-3.5"/> Logo de la clínica</label>
            <div className="flex items-center gap-4">
              <div className="w-[70px] h-[70px] shrink-0 rounded-[18px] flex items-center justify-center border-2 border-dashed border-[#cfe0da] bg-[#f7faf8] overflow-hidden">
                {doctorInfo.logo ? <img src={doctorInfo.logo} alt="Logo" className="w-full h-full object-cover" /> : <ImagePlus className="w-7 h-7 text-[#0b3b42]/30" />}
              </div>
              <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} disabled={isLocked} />
              <label htmlFor="logo-upload" className={`flex-1 py-3.5 px-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border transition ${isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-[#eef5f2] text-[#0b3b42] border-[#cfe3dc] cursor-pointer active:scale-95'}`}><Upload className="w-4 h-4" /> Subir Logo</label>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[#0b5563] tracking-widest block mb-2">Título Profesional</label>
            <select className={`${inputClass} appearance-none cursor-pointer`} value={PRO_TITLES.includes(title) ? title : (title ? 'Otro' : '')} onChange={(e) => {setTitle(e.target.value); if(e.target.value !== 'Otro') setCustomTitle('');}} disabled={isLocked}>
              <option value="">Selecciona tu profesión...</option>
              {PRO_TITLES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
            </select>
            {((!PRO_TITLES.includes(title) && title !== '') || title === 'Otro') && (
              <input type="text" placeholder="Escribe tu título..." className={`${inputClass} mt-3`} value={title === 'Otro' ? customTitle : title} onChange={(e) => {setTitle('Otro'); setCustomTitle(e.target.value);}} disabled={isLocked} />
            )}
          </div>
          <div><label className="text-[10px] font-black uppercase text-[#0b5563] tracking-widest block mb-2">Tu Nombre</label><input type="text" placeholder="Ej. Juan Pérez" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} disabled={isLocked} /></div>
          <div><label className="text-[10px] font-black uppercase text-[#0b5563] tracking-widest block mb-2">Clínica</label><input type="text" placeholder="Nombre de tu Clínica" className={inputClass} value={clinic} onChange={(e) => setClinic(e.target.value)} disabled={isLocked} /></div>
          <button onClick={handleSave} disabled={isSaving || saved || isLocked} className="w-full bg-[#0b3b42] text-[#fff] py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow active:scale-95 transition flex justify-center items-center gap-2 disabled:opacity-40">
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin"/> Guardando...</> : saved ? <><CheckCircle2 className="w-4 h-4"/> ¡Guardado!</> : <><CheckCircle2 className="w-4 h-4"/> Guardar Cambios</>}
          </button>
          {isLocked && <p className="text-[11px] text-amber-600 font-bold">Activa tu licencia PRO para editar tu perfil.</p>}
        </div>
      )}

      {/* Cuenta y licencia */}
      <Group label="Cuenta y licencia">
        <Row icon={Mail} title="Correo" sub="Tu acceso principal" value={user.isAnonymous ? "Perfil temporal (no guardado)" : String(user.email || user.phoneNumber || '')} />
        <Row icon={Smartphone} iconCls="bg-[#fdf6e0] border-[#e8d9ac] text-[#8a6d2f]" title="Plan y dispositivos"
          sub={planDef ? `Plan ${planDef.name}${doctorInfo.premiumExpiresAt ? ' · Vence el ' + safeFormatDate(new Date(doctorInfo.premiumExpiresAt).toISOString().split('T')[0]) : ''}` : 'Sin límite de dispositivos (legado)'}
          value={`${devices.length} aparato${devices.length === 1 ? '' : 's'}`}
          onClick={() => setOpenDevices(!openDevices)} />
        {openDevices && (
          <div className="pb-4 animate-fade-in">
            {!planDef && <p className="text-[12.5px] text-slate-500 leading-relaxed bg-[#f7faf8] border border-[#dfe9e4] rounded-2xl p-3.5">Tu cuenta no tiene límite de dispositivos (plan legado). Los planes nuevos (Dúo, Equipo y Full Pack) controlan en cuántos aparatos se puede entrar a la vez.</p>}
            {planDef && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#f7faf8] border border-[#dfe9e4] rounded-2xl p-3.5 text-center">
                  <Monitor className="w-5 h-5 mx-auto text-[#0b3b42]" />
                  <p className="text-sm font-black text-[#0b3b42] mt-1.5">{pcUsed} / {planDef.pc}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Computadoras</p>
                </div>
                <div className="bg-[#f7faf8] border border-[#dfe9e4] rounded-2xl p-3.5 text-center">
                  <Smartphone className="w-5 h-5 mx-auto text-[#0b3b42]" />
                  <p className="text-sm font-black text-[#0b3b42] mt-1.5">{mobUsed} / {planDef.mobile}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Móviles</p>
                </div>
              </div>
            )}
            <div className="space-y-2 mt-3">
              {devices.map(d => (
                <div key={d.id} className="flex items-center gap-3 bg-[#f7faf8] border border-[#dfe9e4] rounded-2xl px-4 py-3">
                  {d.type === 'pc' ? <Monitor className="w-4 h-4 text-[#0b3b42] flex-none" /> : <Smartphone className="w-4 h-4 text-[#0b3b42] flex-none" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#0b3b42] truncate">{String(d.label || 'Dispositivo')}</p>
                    <p className="text-[10.5px] text-slate-400 font-semibold">Registrado el {d.firstSeen ? safeFormatDate(String(d.firstSeen).split('T')[0]) : '—'}</p>
                  </div>
                  {d.id === currentDeviceId
                    ? <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1.5 rounded-full flex-none">Este dispositivo</span>
                    : <button onClick={() => onReleaseDevice(d.id)} className="text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-500 border border-rose-200 px-2.5 py-1.5 rounded-full flex-none active:scale-90 transition">Liberar</button>}
                </div>
              ))}
              {devices.length === 0 && <p className="text-[12px] text-slate-400 font-semibold">Aún no hay dispositivos registrados en tu cuenta.</p>}
            </div>
            {planDef && (
              <button onClick={() => openWhatsApp(salesPhone, `Hola, quiero ampliar mi plan ${planDef.name} de QuiroApp.`)} className="w-full mt-4 bg-[#b08d3e] text-[#fff] py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" /> Ampliar mi plan
              </button>
            )}
          </div>
        )}
        <Row icon={KeyRound} title="Cambiar contraseña" sub="Te enviamos el enlace seguro a tu correo" onClick={handleChangePassword} last />
        {passMsg && <p className="text-[12px] font-bold text-[#0b3b42] bg-[#eef5f2] border border-[#cfe3dc] rounded-2xl px-4 py-3 mb-4 leading-relaxed">{passMsg}</p>}
      </Group>

      {/* Ayuda rápida */}
      <Group label="Ayuda rápida">
        <Row icon={KeyRound} title="¿Cómo activo un código?" sub="Códigos MES-, ANU- y UPG-" onClick={() => setOpenHelp(openHelp === 'code' ? null : 'code')} />
        {openHelp === 'code' && <p className="text-[12.5px] text-slate-500 leading-relaxed bg-[#f7faf8] border border-[#dfe9e4] rounded-2xl p-3.5 mb-2 animate-fade-in">Ve a la sección <b className="text-[#0b3b42]">Premium</b>, escribe tu código tal cual (ej. ANU-XXXXXX) en el campo «Código de activación» y toca <b className="text-[#0b3b42]">Activar Código</b>. El tiempo se suma a tu licencia al instante.</p>}
        <Row icon={Sparkles} iconCls="bg-[#fdf6e0] border-[#e8d9ac] text-[#8a6d2f]" title="¿Cómo amplío mi plan?" sub="Más dispositivos sin perder tu tiempo" onClick={() => setOpenHelp(openHelp === 'plan' ? null : 'plan')} />
        {openHelp === 'plan' && <p className="text-[12.5px] text-slate-500 leading-relaxed bg-[#f7faf8] border border-[#dfe9e4] rounded-2xl p-3.5 mb-2 animate-fade-in">Pide un <b className="text-[#0b3b42]">código de mejora UPG-</b> por WhatsApp y canjéalo igual que un código normal: tu cupo de dispositivos sube al instante y <b className="text-[#0b3b42]">el tiempo que ya pagaste se conserva</b>.</p>}
        <Row icon={MessageCircle} iconCls="bg-emerald-50 border-emerald-200 text-emerald-600" title="Soporte por WhatsApp" sub="Respuesta del equipo de QuiroApp" onClick={() => openWhatsApp(salesPhone, "Hola, necesito soporte con QuiroApp.")} last />
      </Group>

      {/* Consultorio y documentos */}
      <Group label="Consultorio y documentos">
        <Row icon={ShieldCheck} title="Cédula profesional" value={doctorInfo.licenseNumber || 'Sin registrar'} onClick={() => setIsEditingOffice(true)} />
        <Row icon={Building} title="Dirección" value={doctorInfo.officeAddress || 'Sin registrar'} onClick={() => setIsEditingOffice(true)} />
        <Row icon={Phone} title="Teléfono del consultorio" value={doctorInfo.officePhone || 'Sin registrar'} onClick={() => setIsEditingOffice(true)} />
        <Row icon={MessageCircle} iconCls="bg-emerald-50 border-emerald-200 text-emerald-600" title="WhatsApp de ventas" sub="Se usa en toda la app: PRO, ampliar plan y soporte" value={doctorInfo.salesWhatsApp || '+52 999 618 0031'} onClick={() => setIsEditingOffice(true)} last />
      </Group>
      {isEditingOffice && (
        <div className="bg-white p-6 rounded-[26px] border border-slate-200 shadow-sm animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[12px] font-black uppercase text-[#0b3b42] tracking-widest flex items-center gap-2"><Building className="w-4 h-4"/> Datos del consultorio</h3>
            <button onClick={() => setIsEditingOffice(false)} className="text-[10px] font-black uppercase text-slate-400 px-3 py-2 bg-slate-50 border border-slate-200 rounded-full flex items-center gap-1"><X className="w-3 h-3"/> Cancelar</button>
          </div>
          <p className="text-[11.5px] text-slate-400 font-semibold leading-relaxed">La cédula, dirección y teléfono salen en el expediente PDF/Word de tus pacientes. El WhatsApp se usa en los botones de venta y soporte de toda la app.</p>
          <div><label className="text-[10px] font-black uppercase text-[#0b5563] tracking-widest block mb-2">Cédula profesional</label><input type="text" placeholder="Ej. 12345678" className={inputClass} value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} disabled={isLocked} /></div>
          <div><label className="text-[10px] font-black uppercase text-[#0b5563] tracking-widest block mb-2">Dirección del consultorio</label><input type="text" placeholder="Calle, colonia, ciudad…" className={inputClass} value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} disabled={isLocked} /></div>
          <div><label className="text-[10px] font-black uppercase text-[#0b5563] tracking-widest block mb-2">Teléfono del consultorio</label><input type="tel" placeholder="Para tus documentos" className={inputClass} value={officePhone} onChange={(e) => setOfficePhone(e.target.value)} disabled={isLocked} /></div>
          <div><label className="text-[10px] font-black uppercase text-[#0b5563] tracking-widest block mb-2">WhatsApp de ventas y soporte</label><input type="tel" placeholder="Ej. +52 999 000 0000" className={inputClass} value={salesWhatsApp} onChange={(e) => setSalesWhatsApp(e.target.value)} disabled={isLocked} /></div>
          <button onClick={handleSaveOffice} disabled={isSaving || officeSaved || isLocked} className="w-full bg-[#0b3b42] text-[#fff] py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow active:scale-95 transition flex justify-center items-center gap-2 disabled:opacity-40">
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin"/> Guardando...</> : officeSaved ? <><CheckCircle2 className="w-4 h-4"/> ¡Guardado!</> : <><CheckCircle2 className="w-4 h-4"/> Guardar datos</>}
          </button>
          {isLocked && <p className="text-[11px] text-amber-600 font-bold">Activa tu licencia PRO para editar estos datos.</p>}
        </div>
      )}

      {/* Apariencia */}
      <Group label="Apariencia">
        <div className="flex items-center gap-3 py-3.5 border-b border-[#eef3f0]">
          <span className="w-[34px] h-[34px] flex-none rounded-[10px] border bg-[#eef5f2] border-[#cfe3dc] text-[#0b3b42] flex items-center justify-center"><Palette className="w-4 h-4" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-bold text-[#23423c]">Modo</p>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">El claro es el diseño oficial de la app</p>
          </div>
          <div className="flex bg-[#eef3f0] rounded-xl p-[3px] gap-[3px] flex-none">
            <button onClick={() => setVisualMode('claro')} className={`px-3.5 py-2 rounded-[9px] text-[11.5px] font-extrabold transition ${visualMode === 'claro' ? 'bg-[#0b3b42] text-[#fff] shadow' : 'text-slate-500'}`}>☀️ Claro</button>
            <button onClick={() => setVisualMode('oscuro')} className={`px-3.5 py-2 rounded-[9px] text-[11.5px] font-extrabold transition ${visualMode === 'oscuro' ? 'bg-[#0b3b42] text-[#fff] shadow' : 'text-slate-500'}`}>🌙 Oscuro</button>
          </div>
        </div>
        <div className="flex items-center gap-3 py-3.5">
          <span className="w-[34px] h-[34px] flex-none rounded-[10px] border bg-[#eef5f2] border-[#cfe3dc] text-[#0b3b42] flex items-center justify-center"><Sparkles className="w-4 h-4" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-bold text-[#23423c]">Color de acento</p>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{currentTheme.name}</p>
          </div>
          <div className="flex gap-2 flex-none">
            {Object.entries(CLINIC_THEMES).map(([key, t]) => (
              <button key={key} title={t.name} onClick={() => { setTheme(key); if (!isLocked) onUpdateInfo({ theme: key }); }} className={`w-6 h-6 rounded-full border-[3px] transition ${theme === key ? 'border-[#0b3b42] scale-110' : 'border-transparent'} ${t.bg}`}></button>
            ))}
          </div>
        </div>
      </Group>

      {/* Respaldo y datos */}
      <Group label="Respaldo y datos">
        <Row icon={Download} title="Descargar respaldo" last
          sub={lastBackup ? `Último respaldo: ${lastBackupText}${backupStale ? ' · Ya pasaron más de 60 días, descarga uno nuevo' : ''}` : 'Último respaldo: nunca · Descarga una copia de tus pacientes y citas'}
          onClick={handleBackupClick} />
      </Group>

      {/* Cerrar sesión */}
      <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_5px_16px_rgba(8,48,57,0.05)] overflow-hidden">
        <button onClick={onLogout} className="w-full py-4 flex items-center justify-center gap-2 text-[13.5px] font-black text-[#9d2b57] active:bg-rose-50 transition"><LogOut className="w-4 h-4" /> Cerrar sesión</button>
      </div>
    </div>
  );
};

// ===== Parte 6: campos con sugerencias + escritura manual =====
const evaZone = (v) => {
  if (v <= 0) return { bg: '#f1f5f9', tx: '#64748b', bd: '#cbd5e1', name: 'Sin dolor' };
  if (v <= 3) return { bg: '#dcfce7', tx: '#15803d', bd: '#86efac', name: 'Leve' };
  if (v <= 6) return { bg: '#ffedd5', tx: '#c2410c', bd: '#fdba74', name: 'Moderado' };
  if (v <= 9) return { bg: '#fee2e2', tx: '#b91c1c', bd: '#fca5a5', name: 'Severo' };
  return { bg: '#fee2e2', tx: '#b91c1c', bd: '#fca5a5', name: 'Insoportable' };
};

const EvaSlider = ({ label, value, onChange }) => {
  const v = value ?? 0;
  const z = evaZone(v);
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-end mb-4 gap-2">
        <label className="text-[10px] font-black uppercase text-[#0b5563] tracking-widest">{label}</label>
        <div className="text-right">
          <span className="inline-block px-3 py-1 rounded-xl text-lg font-black border" style={{ background: z.bg, color: z.tx, borderColor: z.bd }}>{v} <span className="text-[10px]">/ 10</span></span>
          <p className="text-[9px] font-black uppercase tracking-widest mt-1" style={{ color: z.tx }}>{z.name}</p>
        </div>
      </div>
      <input type="range" min="0" max="10" className="eva-range" value={v} onChange={e => onChange(parseInt(e.target.value))} />
      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 mt-2.5"><span>0 · Sin dolor</span><span>10 · Insoportable</span></div>
    </div>
  );
};

const ChipField = ({ label, items, value = [], onChange, danger = false, gold = false, single = false, icon: Icon }) => {
  const [otro, setOtro] = useState('');
  const all = [...items, ...value.filter(v => !items.includes(v))];
  const onCls = danger ? 'bg-rose-500 text-[#fff] border-rose-500 shadow' : gold ? 'bg-[#b08d3e] text-[#fff] border-[#b08d3e] shadow' : 'bg-[#0b3b42] text-[#fff] border-[#0b3b42] shadow';
  const toggle = (item) => { if (single) onChange(value.includes(item) ? [] : [item]); else onChange(value.includes(item) ? value.filter(i => i !== item) : [...value, item]); };
  const addOtro = () => { const v = otro.trim(); if (!v) return; if (!value.includes(v)) onChange(single ? [v] : [...value, v]); setOtro(''); };
  return (
    <div>
      {label && <label className="text-[10px] font-black uppercase text-[#0b5563] ml-1 mb-2 flex items-center gap-1 tracking-widest">{Icon && <Icon className="w-3 h-3" />}{label}</label>}
      <div className="flex flex-wrap gap-2 items-center">
        {all.map(item => { const on = value.includes(item); return <button key={item} type="button" onClick={() => toggle(item)} className={`px-3 py-2 rounded-xl border text-[10px] font-extrabold uppercase tracking-wide active:scale-95 transition ${on ? onCls : 'bg-white text-slate-500 border-slate-300 hover:border-[#0b5563]'}`}>{item}</button>; })}
        <span className="inline-flex gap-1.5 items-center">
          <input type="text" value={otro} onChange={e => setOtro(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOtro(); } }} placeholder="Otro ✎" className="w-24 bg-white px-2.5 py-2 rounded-xl border border-dashed border-[#b08d3e] text-[11px] font-bold text-slate-700 outline-none focus:border-[#b08d3e]" />
          <button type="button" onClick={addOtro} className="w-8 h-8 rounded-lg bg-[#fdf6e0] border border-[#e8d9ac] text-[#8a6d2f] font-black active:scale-90 transition">+</button>
        </span>
      </div>
    </div>
  );
};

const PhraseArea = ({ label, phrases = [], value, onChange, placeholder, minH = 'min-h-[90px]', icon: Icon }) => (
  <div>
    {label && <label className="text-[10px] font-black uppercase text-[#0b5563] ml-1 mb-2 flex items-center gap-1 tracking-widest">{Icon && <Icon className="w-3 h-3" />}{label}</label>}
    {phrases.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mb-2">
        {phrases.map(p => <button key={p} type="button" onClick={() => onChange((value ? value.replace(/\s+$/, '') + ' ' : '') + p)} className="px-2.5 py-1.5 rounded-full border border-dashed border-[#0b5563]/50 bg-[#eef5f2] text-[#0b5563] text-[9px] font-extrabold uppercase tracking-wide active:scale-95 transition">{p}</button>)}
      </div>
    )}
    <textarea className={`w-full bg-white p-4 rounded-2xl border border-slate-300 text-slate-800 outline-none focus:border-[#0b5563] text-sm shadow-sm transition-all ${minH}`} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const FormSection = ({ n, title, children }) => (
  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-5 text-left">
    <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#b08d3e]">Sección {n}</p><h4 className="text-[15px] font-black text-[#0b3b42]">{title}</h4></div>
    {children}
  </div>
);

// ===== Parte 6: Planos anatómicos tipo rayos X =====
const PLANES_VERTS = {"frontal": [["C1", 500, 192], ["C2", 500, 199], ["C3", 500, 205], ["C4", 500, 212], ["C5", 500, 218], ["C6", 500, 225], ["C7", 500, 232], ["T1", 500, 242], ["T2", 500, 252], ["T3", 500, 262], ["T4", 500, 272], ["T5", 500, 282], ["T6", 500, 292], ["T7", 500, 302], ["T8", 500, 312], ["T9", 500, 322], ["T10", 500, 332], ["T11", 500, 342], ["T12", 500, 352], ["L1", 500, 366], ["L2", 500, 380], ["L3", 500, 394], ["L4", 500, 408], ["L5", 500, 421]], "ap": [["C1", 500, 192], ["C2", 500, 199], ["C3", 500, 205], ["C4", 500, 212], ["C5", 500, 218], ["C6", 500, 225], ["C7", 500, 232], ["T1", 500, 242], ["T2", 500, 252], ["T3", 500, 262], ["T4", 500, 272], ["T5", 500, 282], ["T6", 500, 292], ["T7", 500, 302], ["T8", 500, 312], ["T9", 500, 322], ["T10", 500, 332], ["T11", 500, 342], ["T12", 500, 352], ["L1", 500, 366], ["L2", 500, 380], ["L3", 500, 394], ["L4", 500, 408], ["L5", 500, 421]], "lateral": [["C1", 515, 152], ["C2", 516, 158], ["C3", 516, 165], ["C4", 517, 171], ["C5", 517, 177], ["C6", 518, 184], ["C7", 518, 190], ["T1", 519, 202], ["T2", 520, 214], ["T3", 521, 225], ["T4", 522, 237], ["T5", 523, 249], ["T6", 524, 261], ["T7", 525, 273], ["T8", 526, 285], ["T9", 527, 296], ["T10", 528, 308], ["T11", 530, 320], ["T12", 531, 332], ["L1", 532, 348], ["L2", 534, 366], ["L3", 535, 383], ["L4", 536, 400], ["L5", 538, 416]]};
const PLANES_ZONES = {"frontal": {"Cráneo": [500, 108], "Mandíbula": [500, 168], "Clavícula Der.": [425, 232], "Clavícula Izq.": [575, 232], "Esternón": [500, 300], "Costillas Der.": [415, 320], "Costillas Izq.": [585, 320], "Húmero Der.": [375, 330], "Húmero Izq.": [625, 330], "Radio Der.": [385, 445], "Radio Izq.": [615, 445], "Cúbito Der.": [408, 445], "Cúbito Izq.": [592, 445], "Mano Der.": [332, 520], "Mano Izq.": [668, 520], "Sacro": [500, 452], "Cóccix": [500, 480], "Pelvis Der.": [428, 448], "Pelvis Izq.": [572, 448], "Fémur Der.": [452, 565], "Fémur Izq.": [548, 565], "Rótula Der.": [447, 678], "Rótula Izq.": [553, 678], "Tibia Der.": [450, 772], "Tibia Izq.": [550, 772], "Peroné Der.": [430, 772], "Peroné Izq.": [570, 772], "Pie Der.": [455, 928], "Pie Izq.": [545, 928]}, "ap": {"Cráneo": [500, 108], "Escápula Der.": [415, 275], "Escápula Izq.": [585, 275], "Costillas Der.": [415, 320], "Costillas Izq.": [585, 320], "Húmero Der.": [375, 330], "Húmero Izq.": [625, 330], "Radio Der.": [385, 445], "Radio Izq.": [615, 445], "Cúbito Der.": [408, 445], "Cúbito Izq.": [592, 445], "Mano Der.": [332, 520], "Mano Izq.": [668, 520], "Sacro": [500, 452], "Cóccix": [500, 480], "Pelvis Der.": [428, 448], "Pelvis Izq.": [572, 448], "Fémur Der.": [452, 565], "Fémur Izq.": [548, 565], "Tibia Der.": [450, 772], "Tibia Izq.": [550, 772], "Peroné Der.": [430, 772], "Peroné Izq.": [570, 772], "Pie Der.": [455, 928], "Pie Izq.": [545, 928]}, "lateral": {"Cráneo": [518, 86], "Mandíbula": [492, 122], "Esternón": [478, 300], "Costillas": [508, 332], "Húmero": [476, 332], "Radio": [466, 445], "Cúbito": [486, 445], "Mano": [458, 525], "Sacro": [540, 452], "Pelvis": [556, 458], "Fémur": [530, 565], "Rótula": [510, 678], "Tibia": [528, 772], "Peroné": [546, 772], "Pie": [518, 922]}};
const PLANES_GROUPS = {"frontal": [["Cráneo y tórax", ["Cráneo", "Mandíbula", "Clavícula Der.", "Clavícula Izq.", "Esternón", "Costillas Der.", "Costillas Izq."]], ["Brazos", ["Húmero Der.", "Húmero Izq.", "Radio Der.", "Radio Izq.", "Cúbito Der.", "Cúbito Izq.", "Mano Der.", "Mano Izq."]], ["Pelvis y piernas", ["Sacro", "Cóccix", "Pelvis Der.", "Pelvis Izq.", "Fémur Der.", "Fémur Izq.", "Rótula Der.", "Rótula Izq.", "Tibia Der.", "Tibia Izq.", "Peroné Der.", "Peroné Izq.", "Pie Der.", "Pie Izq."]]], "ap": [["Cráneo y tórax", ["Cráneo", "Escápula Der.", "Escápula Izq.", "Costillas Der.", "Costillas Izq."]], ["Brazos", ["Húmero Der.", "Húmero Izq.", "Radio Der.", "Radio Izq.", "Cúbito Der.", "Cúbito Izq.", "Mano Der.", "Mano Izq."]], ["Pelvis y piernas", ["Sacro", "Cóccix", "Pelvis Der.", "Pelvis Izq.", "Fémur Der.", "Fémur Izq.", "Tibia Der.", "Tibia Izq.", "Peroné Der.", "Peroné Izq.", "Pie Der.", "Pie Izq."]]], "lateral": [["Cráneo y tórax", ["Cráneo", "Mandíbula", "Esternón", "Costillas"]], ["Brazo", ["Húmero", "Radio", "Cúbito", "Mano"]], ["Pelvis y pierna", ["Sacro", "Pelvis", "Fémur", "Rótula", "Tibia", "Peroné", "Pie"]]]};
const SAGITAL_OPTS = ['Rectificación cervical','Rectificación lumbar','Hiperlordosis lumbar','Hipercifosis dorsal'];

const PLANES_IMGS = { frontal: '/planos/frontal.jpg', ap: '/planos/posterior.jpg', lateral: '/planos/lateral.jpg' };
const VERTEBRA_NAMES = [...Array(7)].map((_, i) => 'C' + (i + 1)).concat([...Array(12)].map((_, i) => 'T' + (i + 1)), [...Array(5)].map((_, i) => 'L' + (i + 1)));
const emptyPlanes = () => ({ marks: {}, curve: { type: 'none', conv: 1, from: 'T6', to: 'L3', cobb: '' }, sagittal: [] });

const XRayPlanes = ({ value, onChange }) => {
  const planes = value && value.marks ? value : emptyPlanes();
  const [view, setView] = useState('frontal');
  const [activeBone, setActiveBone] = useState(null);
  const marks = planes.marks || {};
  const curve = planes.curve || { type: 'none', conv: 1, from: 'T6', to: 'L3', cobb: '' };
  const sagittal = planes.sagittal || [];
  const setPlanes = (patch) => onChange({ ...planes, ...patch });
  const toggleBone = (bone) => {
    const next = { ...marks };
    if (next[bone]) { delete next[bone]; if (activeBone === bone) setActiveBone(null); }
    else { next[bone] = { s: [], t: '' }; setActiveBone(bone); }
    setPlanes({ marks: next });
  };
  const toggleSegAll = (names) => {
    const all = names.every(n => marks[n]);
    const next = { ...marks };
    names.forEach(n => { if (all) delete next[n]; else if (!next[n]) next[n] = { s: [], t: '' }; });
    setPlanes({ marks: next });
  };
  const coff = (y) => {
    if (curve.type === 'none' || view === 'lateral') return 0;
    const t = (y - 192) / (421 - 192);
    return curve.type === 'C' ? curve.conv * 60 * Math.sin(Math.PI * t) : curve.conv * 52 * Math.sin(2 * Math.PI * t);
  };
  const curvePath = (curve.type !== 'none' && view !== 'lateral') ? 'M' + PLANES_VERTS[view].map(p => `${(p[1] + coff(p[2])).toFixed(0)} ${p[2]}`).join(' L') : '';
  const noteOf = (b) => { const n = marks[b]; if (!n) return ''; return [...(n.s || []), n.t || ''].filter(Boolean).join(' · '); };
  const setNote = (bone, patch) => setPlanes({ marks: { ...marks, [bone]: { ...(marks[bone] || { s: [], t: '' }), ...patch } } });
  const segGroups = [['Cervical', [...Array(7)].map((_, i) => 'C' + (i + 1))], ['Dorsal', [...Array(12)].map((_, i) => 'T' + (i + 1))], ['Lumbar', [...Array(5)].map((_, i) => 'L' + (i + 1))]];
  const dotCls = (on, zone) => `absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer z-[3] p-0 ${zone ? 'w-[17px] h-[17px]' : 'w-[10px] h-[10px]'} ${on ? '!bg-[#d8b878] border-2 !border-[#ffe9b0] shadow-[0_0_11px_rgba(216,184,120,0.95)]' : zone ? 'bg-sky-200/15 border border-dashed border-sky-100/60' : 'bg-sky-200/30 border border-sky-100/80'}`;
  return (
    <div className="text-left">
      <div className="flex gap-2 mb-3">
        {[['frontal', 'Frontal'], ['ap', 'AP · Posterior'], ['lateral', 'Lateral']].map(([v, lbl]) => (
          <button key={v} type="button" onClick={() => setView(v)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border active:scale-95 transition ${view === v ? 'bg-[#0b3b42] text-[#fff] border-[#0b3b42]' : 'bg-[#eef4f2] text-[#0b3b42] border-slate-300'}`}>{lbl}</button>
        ))}
      </div>
      <div className="relative w-full max-w-[330px] mx-auto leading-none">
        <img src={PLANES_IMGS[view]} alt={`Plano ${view}`} className="w-full block rounded-2xl shadow-[0_14px_32px_rgba(4,30,44,0.35)]" />
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none"><path d={curvePath} fill="none" stroke="#d8b878" strokeWidth="3.4" strokeDasharray="9 6" strokeLinecap="round" /></svg>
        {PLANES_VERTS[view].map(p => <button key={p[0]} type="button" title={p[0]} onClick={() => toggleBone(p[0])} className={dotCls(!!marks[p[0]], false)} style={{ left: ((p[1] + coff(p[2])) / 10) + '%', top: (p[2] / 10) + '%' }} />)}
        {Object.entries(PLANES_ZONES[view]).map(([name, pos]) => <button key={name} type="button" title={name} onClick={() => toggleBone(name)} className={dotCls(!!marks[name], true)} style={{ left: (pos[0] / 10) + '%', top: (pos[1] / 10) + '%' }} />)}
      </div>
      <p className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-[#0b3b42] mt-2">Vista {view === 'ap' ? 'AP · Posterior' : view}</p>

      <div className="mt-4 border-t border-dashed border-slate-300 pt-3.5">
        <p className="text-[9.5px] font-black uppercase tracking-[0.14em] text-slate-400 mb-2">Columna vertebral</p>
        {segGroups.map(([segName, names]) => (
          <div key={segName} className="flex items-center gap-2 mb-2">
            <span className="text-[10.5px] font-black text-[#0b3b42] w-[58px] flex-none">{segName}</span>
            <div className="flex flex-wrap gap-1 flex-1">
              {names.map(n => <button key={n} type="button" onClick={() => toggleBone(n)} className={`min-w-[31px] py-1.5 rounded-lg border text-[10.5px] font-extrabold active:scale-95 transition ${marks[n] ? 'bg-[#b08d3e] border-[#b08d3e] text-[#fff]' : 'bg-white border-slate-300 text-slate-600'}`}>{n}</button>)}
            </div>
            <button type="button" onClick={() => toggleSegAll(names)} className="flex-none text-[9.5px] font-extrabold px-2.5 py-1.5 rounded-full border border-[#0b3b42] text-[#0b3b42] bg-white active:scale-95 transition">Toda</button>
          </div>
        ))}
        {PLANES_GROUPS[view].map(([gname, bones]) => (
          <div key={gname}>
            <p className="text-[9.5px] font-black uppercase tracking-[0.14em] text-slate-400 mt-3.5 mb-2">{gname}</p>
            <div className="flex flex-wrap gap-1.5">
              {bones.map(b => <button key={b} type="button" onClick={() => toggleBone(b)} className={`px-3 py-2 rounded-xl border text-[10px] font-extrabold uppercase tracking-wide active:scale-95 transition ${marks[b] ? 'bg-[#b08d3e] text-[#fff] border-[#b08d3e] shadow' : 'bg-white text-slate-500 border-slate-300'}`}>{b}</button>)}
            </div>
          </div>
        ))}
      </div>

      {view !== 'lateral' ? (
        <div className="bg-[#f4f8f7] border border-[#d7e2df] rounded-2xl p-3.5 mt-4">
          <p className="text-[9.5px] font-black uppercase tracking-[0.14em] text-slate-400 mb-2">Escoliosis (plano frontal / AP)</p>
          <div className="flex flex-wrap gap-1.5 items-center mb-2.5">
            {[['none', 'Sin curva'], ['C', 'Curva en C'], ['S', 'Curva en S']].map(([t, lbl]) => <button key={t} type="button" onClick={() => setPlanes({ curve: { ...curve, type: t } })} className={`px-3 py-2 rounded-full border text-[10.5px] font-extrabold active:scale-95 transition ${curve.type === t ? 'bg-[#b08d3e] border-[#b08d3e] text-[#fff]' : 'bg-white border-slate-300 text-slate-600'}`}>{lbl}</button>)}
            <span className="text-[10.5px] font-bold text-slate-400 ml-1">Convexidad:</span>
            {[[1, 'Derecha'], [-1, 'Izquierda']].map(([c, lbl]) => <button key={lbl} type="button" onClick={() => setPlanes({ curve: { ...curve, conv: c } })} className={`px-3 py-2 rounded-full border text-[10.5px] font-extrabold active:scale-95 transition ${curve.conv === c ? 'bg-[#0b3b42] border-[#0b3b42] text-[#fff]' : 'bg-white border-slate-300 text-slate-600'}`}>{lbl}</button>)}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10.5px] font-bold text-slate-400">Desde</span>
            <select value={curve.from} onChange={e => setPlanes({ curve: { ...curve, from: e.target.value } })} className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-[11.5px] font-bold outline-none">{VERTEBRA_NAMES.map(n => <option key={n} value={n}>{n}</option>)}</select>
            <span className="text-[10.5px] font-bold text-slate-400">Hasta</span>
            <select value={curve.to} onChange={e => setPlanes({ curve: { ...curve, to: e.target.value } })} className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-[11.5px] font-bold outline-none">{VERTEBRA_NAMES.map(n => <option key={n} value={n}>{n}</option>)}</select>
            <span className="text-[10.5px] font-bold text-slate-400">Cobb</span>
            <input type="number" min="0" max="90" value={curve.cobb} onChange={e => setPlanes({ curve: { ...curve, cobb: e.target.value } })} className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-[11.5px] font-bold outline-none" />
            <span className="text-[11px] font-bold text-slate-400">°</span>
          </div>
        </div>
      ) : (
        <div className="bg-[#f4f8f7] border border-[#d7e2df] rounded-2xl p-3.5 mt-4">
          <p className="text-[9.5px] font-black uppercase tracking-[0.14em] text-slate-400 mb-2">Curvas sagitales (lateral)</p>
          <div className="flex flex-wrap gap-1.5">
            {SAGITAL_OPTS.map(s => { const on = sagittal.includes(s); return <button key={s} type="button" onClick={() => setPlanes({ sagittal: on ? sagittal.filter(x => x !== s) : [...sagittal, s] })} className={`px-3 py-2 rounded-xl border text-[10px] font-extrabold uppercase tracking-wide active:scale-95 transition ${on ? 'bg-[#0b3b42] text-[#fff] border-[#0b3b42]' : 'bg-white text-slate-500 border-slate-300'}`}>{s}</button>; })}
          </div>
        </div>
      )}

      <p className="text-[9.5px] font-black uppercase tracking-[0.14em] text-slate-400 mt-4 mb-2">Resumen de marcas</p>
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(marks).length === 0 && sagittal.length === 0 && <span className="text-[11.5px] text-slate-400">Sin marcas todavía — elige huesos en las opciones.</span>}
        {Object.keys(marks).map(b => <button key={b} type="button" onClick={() => setActiveBone(activeBone === b ? null : b)} className={`px-2.5 py-1.5 rounded-full border text-[10px] font-extrabold bg-[#fdf6e0] border-[#e8d9ac] text-[#8a6d2f] ${activeBone === b ? 'ring-2 ring-[#b08d3e]' : ''}`}>{b}{noteOf(b) ? ' — ' + noteOf(b) : ''}</button>)}
        {sagittal.map(s => <span key={s} className="px-2.5 py-1.5 rounded-full border text-[10px] font-extrabold bg-[#eef5f2] border-[#cfe3dc] text-[#0b5563]">{s}</span>)}
        {curve.type !== 'none' && <span className="px-2.5 py-1.5 rounded-full border text-[10px] font-extrabold bg-[#0b3b42] border-[#0b3b42] text-[#fff]">Escoliosis en {curve.type} · {curve.from}–{curve.to}{curve.cobb ? ' · Cobb ' + curve.cobb + '°' : ''}</span>}
      </div>

      {activeBone && marks[activeBone] && (
        <div className="mt-3 bg-[#fdfbf5] border border-[#e8d9ac] rounded-2xl p-3.5">
          <p className="text-[12.5px] font-black text-[#0b3b42] mb-2">Nota para: {activeBone}</p>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {BONE_NOTE_SUGGESTIONS.map(s => { const on = (marks[activeBone].s || []).includes(s); return <button key={s} type="button" onClick={() => setNote(activeBone, { s: on ? marks[activeBone].s.filter(x => x !== s) : [...(marks[activeBone].s || []), s] })} className={`px-2.5 py-1.5 rounded-full border text-[10px] font-extrabold active:scale-95 transition ${on ? 'bg-[#b08d3e] border-[#b08d3e] text-[#fff]' : 'bg-white border-[#d8c690] text-[#8a6d2f]'}`}>{s}</button>; })}
          </div>
          <input type="text" value={marks[activeBone].t || ''} onChange={e => setNote(activeBone, { t: e.target.value })} placeholder="O escríbelo manualmente…" className="w-full bg-white px-3 py-2.5 rounded-xl border border-slate-300 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#b08d3e]" />
        </div>
      )}
    </div>
  );
};

const NewPatientModal = ({ onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', gender: '', birthDate: '', address: '',
    occupation: '', emergencyName: '', emergencyPhone: '', origin: [], allergies: [],
    motivos: [], tiempoValor: '', tiempoUnidad: '', inicio: '', irradiacion: [], empeora: [], mejora: [], previos: [], descripcion: '',
    patologicos: [], medicamentos: [], antecedentesDetalle: '',
    actividad: '', trabajo: '', tabaco: '', alcohol: '', sueno: '', estres: '',
    redFlags: [],
    rom: {}, pruebas: [], palpacion: [], exploracionDetalle: '',
    diagnosticos: [], objetivos: [], frecuencia: '', sesiones: '', recomendaciones: [], planTexto: '',
    weight: '', height: '', tecnicas: [],
    painLevel: 0, painOut: '', desviaciones: [], posturaAnt: '', posturaLat: '', posturaPos: '',
    planes: null, notas: '', recomSesion: [], proxima: '', consent: false
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const togglePrueba = (name) => {
    setForm(prev => {
      const cur = prev.pruebas.find(p => p.name === name);
      let next;
      if (!cur) next = [...prev.pruebas, { name, result: '+' }];
      else if (cur.result === '+') next = prev.pruebas.map(p => p.name === name ? { ...p, result: '−' } : p);
      else next = prev.pruebas.filter(p => p.name !== name);
      return { ...prev, pruebas: next };
    });
  };
  const inputClass = "w-full bg-white p-4 rounded-2xl border border-slate-300 text-slate-800 outline-none focus:border-[#0b5563] text-sm shadow-sm transition-all";
  const labelClass = "text-[10px] font-black uppercase text-[#0b5563] ml-1 mb-2 flex items-center gap-1 tracking-widest";
  const romOpts = ['Normal', 'Disminuido', 'Doloroso', 'Muy limitado'];

  const handleSaveClick = () => {
    if (isSaving || !form.name.trim()) return;
    setIsSaving(true);
    const joinClean = (arr) => arr.filter(Boolean).join(' · ');
    const lifestyle = { actividad: form.actividad, trabajo: form.trabajo, tabaco: form.tabaco, alcohol: form.alcohol, sueno: form.sueno, estres: form.estres };
    const lifeStr = joinClean([
      form.actividad && 'Actividad física: ' + form.actividad,
      form.trabajo && 'Trabajo: ' + form.trabajo,
      form.tabaco && 'Tabaco: ' + form.tabaco,
      form.alcohol && 'Alcohol: ' + form.alcohol,
      form.sueno && 'Sueño: ' + form.sueno,
      form.estres && 'Estrés: ' + form.estres
    ]);
    const currentIllness = { motivos: form.motivos, tiempoValor: form.tiempoValor, tiempoUnidad: form.tiempoUnidad, inicio: form.inicio, irradiacion: form.irradiacion, empeora: form.empeora, mejora: form.mejora, previos: form.previos, descripcion: form.descripcion };
    const finalPatient = {
      name: form.name, phone: form.phone, gender: form.gender, birthDate: form.birthDate,
      age: form.birthDate ? calculateAge(form.birthDate) : '',
      address: form.address, occupation: form.occupation,
      emergencyName: form.emergencyName, emergencyPhone: form.emergencyPhone,
      origin: form.origin, allergies: form.allergies,
      consultationReason: form.descripcion || form.motivos.join(', '),
      currentIllness,
      pathological: joinClean([form.patologicos.join(', '), form.medicamentos.length ? 'Medicamentos: ' + form.medicamentos.join(', ') : '', form.antecedentesDetalle]),
      pathologicalList: form.patologicos, medications: form.medicamentos, antecedentesDetalle: form.antecedentesDetalle,
      nonPathological: lifeStr, lifestyle,
      redFlags: form.redFlags,
      exploration: { rom: form.rom, tests: form.pruebas, palpation: form.palpacion, detail: form.exploracionDetalle },
      chiropracticDiagnosis: form.diagnosticos.join(', '), diagnosisList: form.diagnosticos,
      treatmentPlan: joinClean([form.planTexto, form.frecuencia && 'Frecuencia: ' + form.frecuencia, form.sesiones && 'Sesiones estimadas: ' + form.sesiones, form.objetivos.length ? 'Objetivos: ' + form.objetivos.join(', ') : '', form.recomendaciones.length ? 'En casa: ' + form.recomendaciones.join(', ') : '']),
      objectives: form.objetivos, frequency: form.frecuencia, estimatedSessions: form.sesiones, homeRecommendations: form.recomendaciones,
      weight: form.weight, height: form.height,
      chiropracticTechniques: form.tecnicas,
      posturalDeviations: form.desviaciones,
      postureAnterior: form.posturaAnt, postureLateral: form.posturaLat, posturePosterior: form.posturaPos,
      planes: form.planes,
      consent: form.consent ? { accepted: true, date: new Date().toISOString() } : null,
      histories: []
    };
    if (form.painLevel > 0 || form.painOut !== '' || form.notas || form.redFlags.length > 0) {
      finalPatient.histories = [{
        id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'h' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        painLevel: form.painLevel,
        painOut: form.painOut === '' ? null : form.painOut,
        visitReason: 'Primera vez', response: '',
        areas: [], redFlags: form.redFlags, techniques: form.tecnicas,
        notes: form.notas, recommendations: form.recomSesion, nextVisit: form.proxima,
        postureAnterior: form.posturaAnt, postureLateral: form.posturaLat, posturePosterior: form.posturaPos
      }];
    }
    onSave(finalPatient);
  };

  return (
    <Modal title="Crear Expediente · Historia Clínica" onClose={onClose}>
      <div className="space-y-5 text-left pb-4 bg-[#f7faf8] rounded-[30px] p-4 sm:p-6 border border-slate-200">

        <FormSection n="1" title="Identificación ampliada">
          <div><label className={labelClass}>Nombre completo *</label><input type="text" placeholder="Ej. Juan Pérez" className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Teléfono / WhatsApp</label><input type="tel" placeholder="10 dígitos" className={inputClass} value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className={labelClass}>Sexo</label><select className={`${inputClass} appearance-none cursor-pointer`} value={form.gender} onChange={e => set('gender', e.target.value)}><option value="">Selecciona...</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Fecha de nacimiento</label><input type="date" className={inputClass} value={form.birthDate} onChange={e => set('birthDate', e.target.value)} /></div>
            <div><label className={labelClass}>Edad</label><input type="text" className={`${inputClass} opacity-60`} readOnly value={form.birthDate ? calculateAge(form.birthDate) + ' años' : ''} placeholder="Automática" /></div>
          </div>
          <div><label className={labelClass}>Dirección completa</label><input type="text" placeholder="Calle, colonia, ciudad" className={inputClass} value={form.address} onChange={e => set('address', e.target.value)} /></div>
          <ChipField label="Ocupación" items={['Oficina', 'Conducción', 'Comercio', 'Salud', 'Construcción', 'Hogar', 'Estudiante', 'Deportista']} value={form.occupation ? [form.occupation] : []} onChange={v => set('occupation', v[0] || '')} single />
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Contacto de emergencia</label><input type="text" placeholder="Nombre" className={inputClass} value={form.emergencyName} onChange={e => set('emergencyName', e.target.value)} /></div>
            <div><label className={labelClass}>Tel. de emergencia</label><input type="tel" placeholder="Teléfono" className={inputClass} value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} /></div>
          </div>
          <ChipField label="¿Cómo nos conoció?" items={['Recomendación', 'Facebook', 'Instagram', 'Google', 'Pasaba por la zona']} value={form.origin} onChange={v => set('origin', v)} />
          <ChipField label="Alergias" items={['Ninguna conocida', 'Medicamentos', 'Látex', 'Alimentos']} value={form.allergies} onChange={v => set('allergies', v)} />
        </FormSection>

        <FormSection n="2" title="Motivo y padecimiento actual">
          <ChipField label="Motivo(s) de consulta" items={MOTIVOS_CONSULTA} value={form.motivos} onChange={v => set('motivos', v)} />
          <div className="grid grid-cols-2 gap-3">
            <ChipField label="Tiempo de evolución" items={['Hoy', 'Días', 'Semanas', 'Meses', 'Años']} value={form.tiempoUnidad ? [form.tiempoUnidad] : []} onChange={v => set('tiempoUnidad', v[0] || '')} single />
            <div><label className={labelClass}>¿Cuánto? (número)</label><input type="number" placeholder="Ej. 3" className={inputClass} value={form.tiempoValor} onChange={e => set('tiempoValor', e.target.value)} /></div>
          </div>
          <ChipField label="Inicio" items={['Brusco / Traumatismo', 'Gradual', 'Sin causa aparente', 'Después de un esfuerzo', 'Accidente']} value={form.inicio ? [form.inicio] : []} onChange={v => set('inicio', v[0] || '')} single />
          <ChipField label="Irradiación" items={LIST_IRRADIACION} value={form.irradiacion} onChange={v => set('irradiacion', v)} />
          <ChipField label="Empeora con" items={LIST_EMPEORA} value={form.empeora} onChange={v => set('empeora', v)} />
          <ChipField label="Mejora con" items={LIST_MEJORA} value={form.mejora} onChange={v => set('mejora', v)} />
          <ChipField label="Tratamientos previos" items={LIST_PREVIOS} value={form.previos} onChange={v => set('previos', v)} />
          <PhraseArea label="Descripción libre del padecimiento" phrases={['Inició después de cargar peso', 'Dolor punzante', 'Se acompaña de hormigueo', 'Limita sus actividades diarias']} value={form.descripcion} onChange={v => set('descripcion', v)} placeholder="Escribe con tus palabras…" />
        </FormSection>

        <FormSection n="3" title="Antecedentes y estilo de vida">
          <ChipField label="Antecedentes patológicos" items={LIST_PATOLOGICOS} value={form.patologicos} onChange={v => set('patologicos', v)} />
          <ChipField label="Medicamentos actuales" items={LIST_MEDICAMENTOS} value={form.medicamentos} onChange={v => set('medicamentos', v)} />
          <PhraseArea label="Detalle de antecedentes (manual)" phrases={[]} value={form.antecedentesDetalle} onChange={v => set('antecedentesDetalle', v)} placeholder="Cirugías, fechas, detalles…" minH="min-h-[70px]" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            <ChipField label="Actividad física" items={['Sedentario', '1–2 veces/semana', '3+ veces/semana', 'Deportista']} value={form.actividad ? [form.actividad] : []} onChange={v => set('actividad', v[0] || '')} single />
            <ChipField label="Tipo de trabajo" items={['Sentado +6 h', 'De pie', 'Esfuerzo físico', 'Mixto']} value={form.trabajo ? [form.trabajo] : []} onChange={v => set('trabajo', v[0] || '')} single />
            <ChipField label="Tabaco" items={['No', 'Ocasional', 'Habitual']} value={form.tabaco ? [form.tabaco] : []} onChange={v => set('tabaco', v[0] || '')} single />
            <ChipField label="Alcohol" items={['No', 'Ocasional', 'Habitual']} value={form.alcohol ? [form.alcohol] : []} onChange={v => set('alcohol', v[0] || '')} single />
            <ChipField label="Sueño" items={['Bueno', 'Irregular', 'Insomnio']} value={form.sueno ? [form.sueno] : []} onChange={v => set('sueno', v[0] || '')} single />
            <ChipField label="Estrés percibido" items={['Bajo', 'Medio', 'Alto']} value={form.estres ? [form.estres] : []} onChange={v => set('estres', v[0] || '')} single />
          </div>
          <ChipField label="Banderas rojas" icon={ShieldAlert} items={RED_FLAGS} value={form.redFlags} onChange={v => set('redFlags', v)} danger />
        </FormSection>

        <FormSection n="4 · Nueva" title="Exploración física">
          <div>
            <label className={labelClass}>Rangos de movimiento</label>
            <div className="space-y-2">
              {['Cervical', 'Dorsal', 'Lumbar', 'Hombros', 'Cadera'].map(seg => (
                <div key={seg} className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black text-[#0b3b42] w-16 flex-none">{seg}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {romOpts.map(o => <button key={o} type="button" onClick={() => set('rom', { ...form.rom, [seg]: form.rom[seg] === o ? '' : o })} className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-extrabold active:scale-95 transition ${form.rom[seg] === o ? 'bg-[#0b3b42] border-[#0b3b42] text-[#fff]' : 'bg-white border-slate-300 text-slate-500'}`}>{o}</button>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Pruebas especiales (toca: + , otra vez: −)</label>
            <div className="flex flex-wrap gap-2">
              {[...LIST_PRUEBAS, ...form.pruebas.map(p => p.name).filter(n => !LIST_PRUEBAS.includes(n))].map(name => {
                const cur = form.pruebas.find(p => p.name === name);
                const cls = cur ? (cur.result === '+' ? 'bg-emerald-600 border-emerald-600 text-[#fff]' : 'bg-rose-500 border-rose-500 text-[#fff]') : 'bg-white text-slate-500 border-slate-300';
                return <button key={name} type="button" onClick={() => togglePrueba(name)} className={`px-3 py-2 rounded-xl border text-[10px] font-extrabold uppercase tracking-wide active:scale-95 transition ${cls}`}>{name}{cur ? ' ' + cur.result : ''}</button>;
              })}
            </div>
          </div>
          <ChipField label="Palpación" items={LIST_PALPACION} value={form.palpacion} onChange={v => set('palpacion', v)} />
          <PhraseArea label="Detalle de la exploración (manual)" phrases={[]} value={form.exploracionDetalle} onChange={v => set('exploracionDetalle', v)} placeholder="Hallazgos propios…" minH="min-h-[70px]" />
        </FormSection>

        <FormSection n="5" title="Diagnóstico y plan">
          <ChipField label="Diagnóstico(s)" items={LIST_DIAGNOSTICOS} value={form.diagnosticos} onChange={v => set('diagnosticos', v)} gold />
          <ChipField label="Objetivos" items={LIST_OBJETIVOS} value={form.objetivos} onChange={v => set('objetivos', v)} />
          <div className="grid grid-cols-1 gap-5">
            <ChipField label="Frecuencia sugerida" items={LIST_FRECUENCIAS} value={form.frecuencia ? [form.frecuencia] : []} onChange={v => set('frecuencia', v[0] || '')} single />
            <ChipField label="Sesiones estimadas" items={['4', '6', '8', '10', '12', 'Indefinido']} value={form.sesiones ? [form.sesiones] : []} onChange={v => set('sesiones', v[0] || '')} single />
          </div>
          <ChipField label="Recomendaciones en casa" items={LIST_RECOMENDACIONES} value={form.recomendaciones} onChange={v => set('recomendaciones', v)} />
          <PhraseArea label="Plan de tratamiento (manual)" phrases={['Ajuste + terapia miofascial', 'Revalorar en 4 sesiones', 'Iniciar con movilización suave']} value={form.planTexto} onChange={v => set('planTexto', v)} placeholder="El plan con tus palabras…" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Peso</label><select className={`${inputClass} appearance-none cursor-pointer`} value={form.weight} onChange={e => set('weight', e.target.value)}><option value="">Selecciona...</option>{Array.from({ length: 161 }, (_, i) => i + 30).map(n => <option key={n} value={n}>{n} kg</option>)}</select></div>
            <div><label className={labelClass}>Altura</label><select className={`${inputClass} appearance-none cursor-pointer`} value={form.height} onChange={e => set('height', e.target.value)}><option value="">Selecciona...</option>{Array.from({ length: 121 }, (_, i) => i + 100).map(n => <option key={n} value={n}>{n} cm</option>)}</select></div>
          </div>
          <ChipField label="Técnicas sugeridas" icon={BookOpen} items={CHIRO_TECHNIQUES} value={form.tecnicas} onChange={v => set('tecnicas', v)} />
        </FormSection>

        <FormSection n="6" title="Evaluación inicial">
          <EvaSlider label="Dolor inicial (EVA)" value={form.painLevel} onChange={v => set('painLevel', v)} />
          <ChipField label="Desviaciones posturales" icon={Activity} items={POSTURAL_DEVIATIONS} value={form.desviaciones} onChange={v => set('desviaciones', v)} />
          <PhraseArea label="Postura — Vista anterior" phrases={['Hombros nivelados', 'Sin hallazgos', 'Cabeza centrada']} value={form.posturaAnt} onChange={v => set('posturaAnt', v)} placeholder="Escribe la vista anterior…" minH="min-h-[70px]" />
          <PhraseArea label="Postura — Vista lateral" phrases={['Cabeza adelantada', 'Pelvis en anteversión', 'Sin hallazgos']} value={form.posturaLat} onChange={v => set('posturaLat', v)} placeholder="Escribe la vista lateral…" minH="min-h-[70px]" />
          <PhraseArea label="Postura — Vista posterior" phrases={['Escápulas niveladas', 'Sin hallazgos', 'Desviación pélvica']} value={form.posturaPos} onChange={v => set('posturaPos', v)} placeholder="Escribe la vista posterior…" minH="min-h-[70px]" />
          <div>
            <label className={labelClass}><Target className="w-3 h-3" /> Planos anatómicos (rayos X)</label>
            <div className="bg-[#f4f8f7] border border-[#d7e2df] rounded-3xl p-4">
              <XRayPlanes value={form.planes} onChange={v => set('planes', v)} />
            </div>
          </div>
          <label className="flex gap-2.5 items-start bg-[#f4f8f7] border border-[#d7e2df] rounded-2xl p-3.5 cursor-pointer">
            <input type="checkbox" checked={form.consent} onChange={e => set('consent', e.target.checked)} className="w-[17px] h-[17px] mt-0.5 accent-[#0b3b42]" />
            <span className="text-[12px] leading-relaxed text-slate-600">El paciente fue informado sobre el tratamiento y <b>acepta su aplicación</b>. Queda registrado con fecha en el expediente.</span>
          </label>
        </FormSection>

        <FormSection n="7" title="Primera sesión">
          <div>
            <label className={labelClass}>Dolor al salir (EVA)</label>
            {form.painOut === '' ? (
              <button type="button" onClick={() => set('painOut', form.painLevel)} className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#b08d3e]/60 text-[#8a6d2f] text-[11px] font-black uppercase tracking-widest active:scale-95 transition">+ Registrar dolor al salir</button>
            ) : (
              <div className="space-y-2">
                <EvaSlider label="Dolor al salir (EVA)" value={form.painOut} onChange={v => set('painOut', v)} />
                <button type="button" onClick={() => set('painOut', '')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 underline">Quitar EVA al salir</button>
              </div>
            )}
          </div>
          <PhraseArea label="Hallazgos de hoy / Notas" icon={FileText} phrases={LIST_HALLAZGOS} value={form.notas} onChange={v => set('notas', v)} placeholder="La evolución con tus palabras…" />
          <ChipField label="Recomendaciones dadas" items={LIST_RECOMENDACIONES} value={form.recomSesion} onChange={v => set('recomSesion', v)} />
          <ChipField label="Próxima cita sugerida" items={LIST_PROXIMA} value={form.proxima ? [form.proxima] : []} onChange={v => set('proxima', v[0] || '')} single />
        </FormSection>

        <button onClick={handleSaveClick} disabled={isSaving || !form.name.trim()} className="w-full bg-[#0b3b42] text-[#fff] py-4 rounded-2xl font-black uppercase border-b-4 border-[#062227] shadow-lg active:scale-95 flex justify-center items-center gap-2 disabled:opacity-60 tracking-widest text-sm">
          {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : <><CheckCircle2 className="w-5 h-5" /> Crear Expediente</>}
        </button>
        {!form.name.trim() && <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">El nombre es lo único obligatorio — todo lo demás es opcional</p>}
      </div>
    </Modal>
  );
};

const NewHistoryModal = ({ onClose, onSave, initial }) => {
  const [form, setForm] = useState(initial ? {
    date: initial.date || new Date().toISOString().split('T')[0], painLevel: initial.painLevel ?? 0,
    painOut: (initial.painOut === undefined ? null : initial.painOut),
    visitReason: initial.visitReason || '', response: initial.response || '',
    areas: initial.areas || [], redFlags: initial.redFlags || [], notes: initial.notes || '',
    postureAnterior: initial.postureAnterior || '', postureLateral: initial.postureLateral || '', posturePosterior: initial.posturePosterior || '',
    techniques: initial.techniques || [], recommendations: initial.recommendations || [], nextVisit: initial.nextVisit || '',
    id: initial.id || null
  } : {
    date: new Date().toISOString().split('T')[0], painLevel: 0, painOut: null,
    visitReason: '', response: '', areas: [], redFlags: [], notes: '',
    postureAnterior: '', postureLateral: '', posturePosterior: '',
    techniques: [], recommendations: [], nextVisit: '', id: null
  });
  const [isSaving, setIsSaving] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const handleSaveClick = () => { if (isSaving) return; setIsSaving(true); onSave({ ...form, id: form.id || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'h' + Date.now()) }); };
  const toggleArea = (area) => setForm(prev => ({ ...prev, areas: prev.areas.includes(area) ? prev.areas.filter(a => a !== area) : [...prev.areas, area] }));
  const toggleArrayItem = (field, item) => setForm(prev => { const arr = prev[field] || []; return { ...prev, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] }; });
  const inputClass = "w-full bg-white p-4 rounded-2xl border border-slate-300 text-slate-800 outline-none focus:border-[#0b5563] text-sm shadow-sm transition-all";
  const labelClass = "text-[10px] font-black uppercase text-[#0b5563] ml-1 mb-2 flex items-center gap-1 tracking-widest";

  return (
    <Modal title={initial ? "Editar Registro Clínico" : "Nuevo Registro Clínico"} onClose={onClose}>
      <div className="space-y-7 text-left pb-4 bg-[#f7faf8] rounded-[30px] p-5 sm:p-7 border border-slate-200">

        <div><label className={labelClass}>Fecha del Ajuste</label><input type="date" className={inputClass} value={form.date} onChange={e => set('date', e.target.value)} /></div>

        <ChipField label="Motivo de la visita" items={LIST_VISITA} value={form.visitReason ? [form.visitReason] : []} onChange={v => set('visitReason', v[0] || '')} single />
        <ChipField label="Respuesta al tratamiento anterior" items={LIST_RESPUESTA} value={form.response ? [form.response] : []} onChange={v => set('response', v[0] || '')} single />

        <MultiSelectDropdown title="Banderas Rojas (Precauciones)" icon={ShieldAlert} items={RED_FLAGS} selectedItems={form.redFlags} toggleItem={(i) => toggleArrayItem('redFlags', i)} isDanger={true} />

        <EvaSlider label="Dolor al llegar (EVA)" value={form.painLevel} onChange={v => set('painLevel', v)} />
        <div>
          {form.painOut === null ? (
            <button type="button" onClick={() => set('painOut', form.painLevel)} className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#b08d3e]/60 text-[#8a6d2f] text-[11px] font-black uppercase tracking-widest active:scale-95 transition bg-white">+ Registrar dolor al salir (EVA)</button>
          ) : (
            <div className="space-y-2">
              <EvaSlider label="Dolor al salir (EVA)" value={form.painOut} onChange={v => set('painOut', v)} />
              <button type="button" onClick={() => set('painOut', null)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 underline">Quitar EVA al salir</button>
            </div>
          )}
        </div>

        <AnatomyMap selectedAreas={form.areas} toggleArea={toggleArea} />

        <div>
          <label className={labelClass}><BookOpen className="w-3 h-3" /> Técnicas Aplicadas en la Sesión</label>
          <div className="flex flex-wrap gap-2">
            {CHIRO_TECHNIQUES.map(t => {
              const on = form.techniques.includes(t);
              return <button key={t} type="button" onClick={() => toggleArrayItem('techniques', t)} className={`px-3 py-2 rounded-xl border text-[10px] font-extrabold uppercase tracking-wide active:scale-95 transition ${on ? 'bg-[#0b3b42] text-[#fff] border-[#0b3b42] shadow' : 'bg-white text-slate-500 border-slate-300 hover:border-[#0b5563]'}`}>{t}</button>;
            })}
          </div>
        </div>

        <div className="space-y-5">
          <PhraseArea label="Vista Anterior" phrases={['Hombros nivelados', 'Sin hallazgos', 'Cabeza centrada']} value={form.postureAnterior} onChange={v => set('postureAnterior', v)} placeholder="Hallazgos..." minH="min-h-[70px]" />
          <PhraseArea label="Vista Lateral" phrases={['Cabeza adelantada', 'Pelvis en anteversión', 'Sin hallazgos']} value={form.postureLateral} onChange={v => set('postureLateral', v)} placeholder="Hallazgos..." minH="min-h-[70px]" />
          <PhraseArea label="Vista Posterior" phrases={['Escápulas niveladas', 'Sin hallazgos', 'Desviación pélvica']} value={form.posturePosterior} onChange={v => set('posturePosterior', v)} placeholder="Hallazgos..." minH="min-h-[70px]" />
        </div>

        <PhraseArea label="Hallazgos / Notas de Evolución" icon={FileText} phrases={LIST_HALLAZGOS} value={form.notes} onChange={v => set('notes', v)} placeholder="Ej. Hubo cavitación en C2..." minH="min-h-[110px]" />

        <ChipField label="Recomendaciones dadas" items={LIST_RECOMENDACIONES} value={form.recommendations} onChange={v => set('recommendations', v)} />
        <ChipField label="Próxima cita sugerida" items={LIST_PROXIMA} value={form.nextVisit ? [form.nextVisit] : []} onChange={v => set('nextVisit', v[0] || '')} single />

        <button onClick={handleSaveClick} disabled={isSaving} className="w-full bg-[#0b3b42] text-[#fff] py-4 rounded-2xl font-black uppercase border-b-4 border-[#062227] shadow-lg active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 tracking-widest text-sm">
          {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : <><CheckCircle2 className="w-5 h-5" /> {initial ? 'Guardar Cambios' : 'Guardar Ajuste Clínico'}</>}
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
    <div className="bg-rose-500/10 p-8 rounded-[50px] border border-rose-500/30 mb-8 relative shadow-2xl max-w-sm w-full"><div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-500 p-3 rounded-2xl shadow-lg"><Lock className="w-8 h-8 text-white" /></div><h2 className="text-4xl font-black uppercase italic text-white mt-4 mb-4 tracking-tighter">Acceso <span className="text-rose-500">Bloqueado</span></h2><p className="text-indigo-200 text-sm leading-relaxed mb-6">Tu prueba gratuita ha finalizado. Adquiere una licencia PRO.</p><button onClick={() => openWhatsApp(salesPhoneOf(doctorInfo), "Hola, mi prueba venció. Me interesa QuiroApp Pro.")} className="w-full bg-cyan-400 text-black font-black uppercase italic py-5 rounded-[25px] flex items-center justify-center gap-3 border-b-8 border-cyan-700 active:scale-95 mb-4 shadow-xl"><CreditCard className="w-6 h-6" /> Comprar Licencia</button><button onClick={onLogout} className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition">Salir de la cuenta</button></div>
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

const DeviceLimitScreen = ({ info, onActivate, onRetry, onLogout }) => {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const handleAct = async () => { if (!code) return; setBusy(true); await onActivate(code); setBusy(false); };
  return (
    <div className="min-h-screen bg-[#e9efec] flex items-center justify-center p-5">
      <div className="bg-white w-full max-w-md rounded-[36px] border border-slate-200 shadow-[0_20px_50px_rgba(8,48,57,0.15)] p-8 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-[#0b3b42] flex items-center justify-center mb-5">
          {info.type === 'pc' ? <Monitor className="w-8 h-8 text-[#d8b878]" /> : <Smartphone className="w-8 h-8 text-[#d8b878]" />}
        </div>
        <h2 className="text-[22px] font-black text-[#0b3b42] leading-tight">Límite de dispositivos alcanzado</h2>
        <p className="text-sm text-slate-500 leading-relaxed mt-3">
          Tu plan <b className="text-[#0b3b42]">{info.planName}</b> permite {info.limit} {info.typeLabel} y ya están en uso. Este aparato todavía no puede entrar.
        </p>
        <div className="bg-[#f7faf8] border border-[#dfe9e4] rounded-3xl p-5 mt-6 text-left space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0e7c5b] flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> ¿Tienes un código de mejora?</p>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ej: UPG-X7Y8Z9" className="w-full bg-white border-[1.5px] border-[#cfe0da] rounded-2xl px-4 py-3.5 text-center font-black tracking-[0.15em] uppercase text-[#0b3b42] outline-none placeholder:text-slate-300" />
          <button onClick={handleAct} disabled={busy || !code} className="w-full bg-[#0b3b42] text-[#fff] py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Canjear y ampliar mi plan'}
          </button>
        </div>
        <button onClick={() => openWhatsApp(salesPhoneOf(info), `Hola, quiero ampliar mi plan ${info.planName} de QuiroApp para usar más dispositivos.`)} className="w-full mt-3 bg-[#22c55e] text-[#fff] py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4" /> Ampliar por WhatsApp
        </button>
        <button onClick={onRetry} className="w-full mt-3 bg-white border-[1.5px] border-[#cfe0da] text-[#0b3b42] py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition">
          Ya liberé un dispositivo · Reintentar
        </button>
        <button onClick={onLogout} className="mt-5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition">Cerrar sesión</button>
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
  const [patientSearch, setPatientSearch] = useState('');
  const [previewPatientId, setPreviewPatientId] = useState(null);
  const [editingHistory, setEditingHistory] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [trialTimeLeft, setTrialTimeLeft] = useState({ days: 0, hours: 0, expired: false });
  const [adminCodes, setAdminCodes] = useState([]);
  const [myDevices, setMyDevices] = useState([]);
  const [deviceBlock, setDeviceBlock] = useState(null);
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
        const prof = profileSnap.exists() ? profileSnap.data() : {};
        tx.update(codeRef, { used: true, usedBy: user.uid, usedByEmail: user.email || '', usedAt: new Date().toISOString() });
        if (codeData.kind === 'upgrade') {
          tx.update(profileRef, { plan: codeData.plan || 'equipo' });
          return { kind: 'upgrade', plan: codeData.plan || 'equipo', newExpiresAt: prof.premiumExpiresAt || 0 };
        }
        const currentExpiry = prof.premiumExpiresAt || 0;
        const base = Math.max(currentExpiry, Date.now());
        const newExpiresAt = base + ((codeData.durationDays || 30) * 86400000);
        const profUpdate = { isPremium: true, premiumActivatedAt: Date.now(), premiumExpiresAt: newExpiresAt };
        if (codeData.plan) profUpdate.plan = codeData.plan;
        tx.update(profileRef, profUpdate);
        return { kind: 'time', days: codeData.durationDays || 30, plan: codeData.plan || null, newExpiresAt };
      });
      setDoctorInfo(p => ({ ...p, isPremium: result.kind === 'time' ? true : p.isPremium, premiumExpiresAt: result.newExpiresAt || p.premiumExpiresAt, plan: result.plan || p.plan }));
      if (result.kind === 'upgrade') alert(`¡Plan actualizado a ${PLANS[result.plan]?.name || 'superior'}! Tu tiempo se conserva tal cual.`);
      else alert(`¡PRO activado por ${result.days} días!${result.plan ? ` Plan ${PLANS[result.plan]?.name || ''}.` : ''}`);
      setActiveTab('settings');
    } catch (e) {
      if (e.message === 'CODIGO_NO_EXISTE') alert("Ese código no existe. Revisa que esté bien escrito.");
      else if (e.message === 'CODIGO_USADO') alert("Ese código ya fue usado.");
      else if (e.code === 'permission-denied') alert("Permiso denegado por el servidor. Inténtalo de nuevo.");
      else alert("No se pudo activar el código. Revisa tu conexión e inténtalo de nuevo.");
    }
  };

  const deviceCheckedFor = useRef(null);
  const ensureDevice = async (force = false) => {
    if (!user) return;
    const myId = getDeviceId();
    const info = detectDevice();
    const ref = doc(db, 'artifacts', appId, 'users', user.uid, 'devices', myId);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) { updateDoc(ref, { lastSeen: new Date().toISOString() }).catch(() => {}); setDeviceBlock(null); return; }
      const planDef = PLANS[doctorInfo.plan];
      const premiumActive = doctorInfo.isPremium && (doctorInfo.premiumExpiresAt || 0) > Date.now();
      if (!doctorInfo.isAdmin && premiumActive && planDef) {
        const all = await getDocs(collection(db, 'artifacts', appId, 'users', user.uid, 'devices'));
        const count = all.docs.filter(d => (d.data().type || 'pc') === info.type).length;
        const limit = info.type === 'pc' ? planDef.pc : planDef.mobile;
        if (count >= limit) { setDeviceBlock({ planName: planDef.name, type: info.type, typeLabel: info.type === 'pc' ? 'computadoras' : 'dispositivos móviles', limit }); return; }
      }
      await setDoc(ref, { type: info.type, label: info.label, firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString() });
      setDeviceBlock(null);
    } catch (e) { setDeviceBlock(null); }
  };
  useEffect(() => { if (user && !loading && deviceCheckedFor.current !== user.uid) { deviceCheckedFor.current = user.uid; ensureDevice(); } }, [user, loading]);
  useEffect(() => { if (user && deviceBlock) ensureDevice(true); }, [doctorInfo.plan]);
  useEffect(() => { if (!user) { setMyDevices([]); return; } const unsub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'devices'), (snap) => setMyDevices(snap.docs.map(d => ({ id: d.id, ...d.data() })))); return () => unsub(); }, [user]);
  const handleReleaseDevice = async (deviceId) => { if (!user) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'devices', deviceId)); } catch (e) {} };

  const createAdminCode = async (prefix, fields) => {
    for (let intento = 0; intento < 5; intento++) {
      const candidato = generateSecureCode(prefix);
      const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'codes', candidato));
      if (!snap.exists()) { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'codes', candidato), fields); return candidato; }
    }
    return null;
  };
  const handleGenerateCodes = async ({ type, days, plan, qty }) => {
    const out = [];
    try {
      for (let n = 0; n < qty; n++) {
        const code = await createAdminCode(type === 'Mensual' ? 'MES-' : 'ANU-', { used: false, type, durationDays: days, plan, createdAt: new Date().toISOString(), createdBy: user?.uid });
        if (code) out.push(code);
      }
    } catch (e) { alert("No se pudieron generar todos los códigos. Revisa tu conexión e inténtalo de nuevo."); }
    return out;
  };
  const handleGenerateUpgrade = async (plan) => {
    try { return await createAdminCode('UPG-', { used: false, kind: 'upgrade', type: 'Mejora', durationDays: 0, plan, createdAt: new Date().toISOString(), createdBy: user?.uid }); }
    catch (e) { alert("No se pudo generar el código de mejora. Revisa tu conexión."); return null; }
  };
  const handleDeleteAdminCode = async (codeId) => { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'codes', codeId)); } catch (e) { alert("No se pudo borrar el código. Verifica que las reglas nuevas de la Parte 8 estén publicadas en Firebase."); } };
  const handleAssignBuyer = async (codeId, name) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'codes', codeId), { buyerName: name }); } catch (e) {} };

  const handleUpgradeRequest = () => { openWhatsApp(salesPhoneOf(doctorInfo), "Hola, me interesa adquirir la versión PRO."); setActiveTab('premium'); };
  const handleUpdateProfile = async (newData) => { setDoctorInfo(prev => ({ ...prev, ...newData })); await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), { ...doctorInfo, ...newData }, { merge: true }); };
  const handleAddPatient = (data) => { setModals(prev => ({ ...prev, patient: false })); addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'patients'), { ...data, createdAt: new Date().toISOString() }); };
  const handleAddHistory = (history) => { if (!selectedPatientId) return; const pat = patients.find(p => p.id === selectedPatientId); setModals(prev => ({ ...prev, history: false })); if(pat) updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', selectedPatientId), { histories: [history, ...(pat.histories || [])] }); };
  const handleEditHistory = (data) => { if (!selectedPatientId || !editingHistory) return; const pat = patients.find(p => p.id === selectedPatientId); const idx = editingHistory.index; setEditingHistory(null); if (pat) { const next = [...(pat.histories || [])]; next[idx] = { ...data, id: data.id || next[idx]?.id || ('h' + Date.now()) }; updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', selectedPatientId), { histories: next }); } };
  const handleDeleteHistory = (index) => { if (!selectedPatientId) return; const pat = patients.find(p => p.id === selectedPatientId); if (pat) updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', selectedPatientId), { histories: (pat.histories || []).filter((_, i) => i !== index) }); };
  const handleAddAppointment = (appData) => { if (!selectedPatientId) return; setModals(prev => ({ ...prev, appointment: false })); addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), { ...appData, patientId: selectedPatientId, createdAt: new Date().toISOString() }); };
  const handleDeletePatient = (id) => { if (window.confirm("¿Eliminar expediente?")) { setSelectedPatientId(null); deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', id)); } };
  const handleEditPatient = (data) => { if (!selectedPatientId) return; setModals(prev => ({ ...prev, editPatient: false })); updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', selectedPatientId), data); };
  const handleSavePlanes = (planes) => { if (!selectedPatientId) return; updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'patients', selectedPatientId), { planes }); };
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
  const previewPatient = patients.find(p => p.id === previewPatientId) || patients[0] || null;
  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: 'linear-gradient(180deg, #fbfdfc 0%, #eef3f0 100%)' }}>
      <img src="/logo-quiroapp.png" alt="QuiroApp" className="w-[104px] h-[104px] rounded-[28px] object-cover bg-white shadow-[0_0_0_3px_rgba(216,184,120,0.55),0_16px_30px_rgba(8,48,57,0.16)] animate-[splashPulse_1.8s_ease-in-out_infinite]" />
      <h1 className="mt-5 text-2xl font-extrabold text-[#0b2b31]">QuiroApp</h1>
      <p className="mt-1.5 text-[10px] font-extrabold tracking-[0.24em] text-[#b08d3e] uppercase">Gestión Clínica</p>
      <div className="mt-7 w-[132px] h-1 rounded-full bg-[#dde7e2] overflow-hidden"><div className="h-full w-[45%] rounded-full animate-[splashSlide_1.3s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, #0b5563, #d8b878)' }}></div></div>
      <p className="mt-3 text-[11px] font-semibold text-slate-500">Cargando tu consultorio…</p>
      <style dangerouslySetInnerHTML={{__html: `@keyframes splashPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.045); } } @keyframes splashSlide { 0% { transform: translateX(-110%); } 100% { transform: translateX(300%); } }`}} />
    </div>
  );
  if (!user) return <AuthScreen onGoogleLogin={handleGoogleLogin} onEmailAuth={handleEmailAuth} onStartTrial={handleTrialLogin} onResetPassword={handleResetPassword} inProcess={authInProcess} error={authError} notice={authNotice} step={authStep} setStep={setAuthStep} />;
  if (trialTimeLeft.expired && !doctorInfo.isPremium && !doctorInfo.isAdmin) return <SubscriptionBlockedScreen onLogout={() => signOut(auth)} />;
  if (deviceBlock) return <DeviceLimitScreen info={deviceBlock} onActivate={handleActivateCode} onRetry={() => ensureDevice(true)} onLogout={() => signOut(auth)} />;

  const initialsOf = (name) => (String(name || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('') || '?').toUpperCase();
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
              <PatientProfile patient={patients.find(p => p.id === selectedPatientId)} doctorInfo={doctorInfo} onBack={() => setSelectedPatientId(null)} onAddHistory={() => setModals(m => ({...m, history: true}))} onSchedule={() => setModals(m => ({...m, appointment: true}))} onDelete={() => handleDeletePatient(selectedPatientId)} onEdit={() => setModals(m => ({...m, editPatient: true}))} onEditHistory={(entry, index) => setEditingHistory({ entry, index })} onDeleteHistory={handleDeleteHistory} onSavePlanes={handleSavePlanes} />
            ) : (
              <>
                {activeTab === 'home' && <HomeTab appointments={appointments} patients={patients} doctorInfo={doctorInfo} onAddAppointment={() => setActiveTab('patients')} onOpenCalendar={() => setModals(m => ({...m, calendar: true}))} onUpgrade={handleUpgradeRequest} onNewPatient={handleOpenNewPatient} onBackup={handleBackup} onGoTechniques={() => { setActiveTab('techniques'); setSelectedPatientId(null); }} />}
                {activeTab === 'patients' && (
                  <div className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="bg-[#fdf6e0] border border-[#e8d9ac] text-[#8a6d2f] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full">{patients.length} {patients.length === 1 ? 'paciente' : 'pacientes'}{!doctorInfo.isPremium && ` · de ${MAX_TRIAL_PATIENTS} en prueba`}</span>
                      <button onClick={handleOpenNewPatient} className="ml-auto bg-[#0b3b42] text-[#fff] px-4 py-2.5 rounded-xl font-extrabold uppercase text-[10px] flex items-center gap-2 active:scale-95 transition shadow"><Plus className="w-4 h-4" /> Nuevo paciente</button>
                    </div>
                    {patients.length === 0 ? (
                      <div className="bg-white border border-slate-300 rounded-3xl shadow-[0_8px_22px_rgba(8,48,57,0.09)] py-16 text-center px-6">
                        <ClipboardList className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="font-extrabold text-[#0b2b31]">Aún no tienes pacientes</p>
                        <p className="text-slate-400 text-xs mt-1.5 mb-5">Registra el primero con el botón «Nuevo paciente».</p>
                        <button onClick={handleOpenNewPatient} className="bg-[#0b3b42] text-[#fff] px-4 py-2.5 rounded-xl font-extrabold uppercase text-[10px] active:scale-95 transition">Registrar paciente</button>
                      </div>
                    ) : (
                      <div className="grid lg:grid-cols-[370px_1fr] gap-6 items-start">
                        <div>
                          <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder="Buscar por nombre, teléfono o motivo…" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} className="w-full bg-white p-3.5 pl-11 rounded-2xl border border-slate-300 text-slate-800 font-semibold text-sm outline-none focus:border-[#0b5563] transition-all shadow-sm" />
                          </div>
                          <div className="space-y-2.5">
                            {filteredPatients.length === 0 ? (
                              <div className="bg-white border border-slate-300 rounded-3xl py-12 text-center px-6"><Search className="w-9 h-9 mx-auto mb-3 text-slate-300" /><p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Sin resultados para tu búsqueda</p></div>
                            ) : filteredPatients.map(p => {
                              const isSel = previewPatient && previewPatient.id === p.id;
                              return (
                                <button key={p.id} onClick={() => { if (window.innerWidth >= 1024) setPreviewPatientId(p.id); else setSelectedPatientId(p.id); }} className={`w-full text-left flex items-center gap-3 p-3.5 rounded-2xl border transition active:scale-[0.99] ${isSel ? 'bg-[#fdf9ec] border-[#e8d9ac] shadow-[0_8px_22px_rgba(8,48,57,0.09)]' : 'bg-white border-slate-300 shadow-sm hover:border-[#0b5563]/50'}`}>
                                  <span className="w-10 h-10 rounded-full bg-[#dcebe7] text-[#0b3b42] font-extrabold text-xs flex items-center justify-center flex-none">{initialsOf(p.name)}</span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block font-bold text-slate-800 text-sm truncate">{String(p.name)}</span>
                                    <span className="block text-[11px] text-slate-400 font-semibold mt-0.5 truncate">{p.phone ? String(p.phone) : 'Sin teléfono'} · {(p.histories || []).length} {(p.histories || []).length === 1 ? 'sesión' : 'sesiones'}</span>
                                  </span>
                                  <ChevronRight className="w-5 h-5 text-slate-300 flex-none lg:hidden" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="hidden lg:block">
                          {previewPatient ? (() => {
                            const p = previewPatient;
                            const edadP = p.birthDate ? calculateAge(p.birthDate) : p.age;
                            const nextApp = appointments.filter(a => a.patientId === p.id && String(a.date) >= todayStr).sort((a, b) => (String(a.date) + String(a.time || '')).localeCompare(String(b.date) + String(b.time || '')))[0];
                            const lastHist = (p.histories || [])[0];
                            const kvL = "text-[9px] font-black text-slate-400 uppercase tracking-[0.14em]";
                            const kvV = "text-[13px] font-bold text-[#16323a] mt-1";
                            return (
                              <div className="bg-white border border-slate-300 rounded-3xl shadow-[0_8px_22px_rgba(8,48,57,0.09)] p-6">
                                <div className="flex items-start gap-4">
                                  <span className="w-14 h-14 rounded-full bg-[#dcebe7] text-[#0b3b42] font-extrabold text-base flex items-center justify-center flex-none shadow-[0_0_0_3px_rgba(216,184,120,0.45)]">{initialsOf(p.name)}</span>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-xl font-extrabold text-[#0b2b31] leading-tight truncate">{String(p.name)}</h3>
                                    <p className="text-xs text-slate-400 font-semibold mt-1">{p.phone ? String(p.phone) : 'Sin teléfono'}{edadP ? ` · ${edadP} años` : ''}</p>
                                  </div>
                                  {nextApp && <span className="bg-[#fdf6e0] border border-[#e8d9ac] text-[#8a6d2f] text-[10px] font-extrabold px-3 py-1.5 rounded-full flex-none">Próx: {safeFormatDate(nextApp.date)} · {String(nextApp.time)}</span>}
                                </div>
                                <div className="grid grid-cols-3 gap-x-4 gap-y-5 mt-6">
                                  <div><p className={kvL}>Motivo principal</p><p className={kvV}>{p.consultationReason ? String(p.consultationReason) : '—'}</p></div>
                                  <div><p className={kvL}>Diagnóstico</p><p className={kvV}>{p.chiropracticDiagnosis ? String(p.chiropracticDiagnosis) : '—'}</p></div>
                                  <div><p className={kvL}>Sesiones</p><p className={kvV}>{(p.histories || []).length} registradas</p></div>
                                  <div><p className={kvL}>Última sesión</p><p className={kvV}>{lastHist ? safeFormatDate(lastHist.date) : '—'}</p></div>
                                  <div><p className={kvL}>Paciente desde</p><p className={kvV}>{p.createdAt ? safeFormatDate(String(p.createdAt).split('T')[0]) : '—'}</p></div>
                                  <div><p className={kvL}>Teléfono</p><p className={kvV}>{p.phone ? String(p.phone) : '—'}</p></div>
                                </div>
                                {(p.histories || []).length > 0 && (
                                  <div className="mt-6">
                                    <p className={kvL}>Últimas sesiones</p>
                                    <div className="mt-2 space-y-2">
                                      {(p.histories || []).slice(0, 2).map((h, i) => (
                                        <div key={h.id || i} className="flex items-center gap-3 bg-slate-50 border border-slate-200/70 rounded-2xl px-3.5 py-2.5">
                                          <span className="text-[11px] font-extrabold text-[#0b3b42] flex-none">{safeFormatDate(h.date)}</span>
                                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-none ${h.painLevel <= 3 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : h.painLevel <= 6 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>Dolor {String(h.painLevel ?? 0)}/10</span>
                                          <span className="text-[11px] text-slate-500 truncate">{h.notes ? String(h.notes) : 'Sin notas'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="flex gap-2.5 mt-6">
                                  <button onClick={() => setSelectedPatientId(p.id)} className="flex-1 bg-[#0b3b42] text-[#fff] py-3 rounded-xl font-extrabold uppercase text-[11px] active:scale-95 transition shadow">Abrir expediente</button>
                                  <button onClick={() => { setSelectedPatientId(p.id); setModals(m => ({...m, appointment: true})); }} className="flex-1 bg-white border border-slate-300 text-[#16323a] py-3 rounded-xl font-extrabold uppercase text-[11px] active:scale-95 transition">Agendar cita</button>
                                  {p.phone && <button onClick={() => openWhatsApp(p.phone, `Hola ${String(p.name).split(' ')[0]}, te escribimos de ${doctorInfo.clinic || 'la clínica'}.`)} className="w-11 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl flex items-center justify-center active:scale-95 transition" title="WhatsApp"><MessageSquare className="w-4 h-4" /></button>}
                                </div>
                              </div>
                            );
                          })() : (
                            <div className="bg-white border border-slate-300 rounded-3xl py-16 text-center text-slate-400 text-sm font-semibold">Selecciona un paciente de la lista</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'techniques' && (<Suspense fallback={<div className="py-20 text-center text-cyan-400 font-black uppercase tracking-widest text-xs">Cargando guía...</div>}><TechniquesTab /></Suspense>)}
                {activeTab === 'settings' && <ProfileTab user={user} doctorInfo={doctorInfo} patients={patients} onUpdateInfo={handleUpdateProfile} onLogout={() => signOut(auth)} onLinkGoogle={handleLinkGoogle} onLinkEmail={handleLinkEmail} onUpgrade={handleUpgradeRequest} onBackup={handleBackup} visualMode={visualMode} setVisualMode={setVisualMode} devices={myDevices} currentDeviceId={getDeviceId()} onReleaseDevice={handleReleaseDevice} />}
                {activeTab === 'premium' && <PremiumTab onActivateCode={handleActivateCode} salesPhone={salesPhoneOf(doctorInfo)} />}
                {activeTab === 'admin' && doctorInfo.isAdmin && <AdminTab codes={adminCodes} onGenerateCodes={handleGenerateCodes} onGenerateUpgrade={handleGenerateUpgrade} onDeleteCode={handleDeleteAdminCode} onAssignBuyer={handleAssignBuyer} />}
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
      {editingHistory && <NewHistoryModal initial={editingHistory.entry} onClose={() => setEditingHistory(null)} onSave={handleEditHistory} />}
      {modals.appointment && <NewAppointmentModal onClose={() => setModals(m => ({...m, appointment: false}))} onSave={handleAddAppointment} />}
      {modals.calendar && <CalendarModal appointments={appointments} patients={patients} onClose={() => setModals(m => ({...m, calendar: false}))} onEditAppointment={(app) => setEditingAppointment(app)} onDeleteAppointment={handleDeleteAppointment} />}
      {modals.upsell && <UpsellModal onClose={() => setModals(m => ({...m, upsell: false}))} onUpgrade={() => { setModals(m => ({...m, upsell: false})); handleUpgradeRequest(); }} />}
      {modals.editPatient && selectedPatientId && <EditPatientModal patient={patients.find(p => p.id === selectedPatientId)} onClose={() => setModals(m => ({...m, editPatient: false}))} onSave={handleEditPatient} />}
      {editingAppointment && <NewAppointmentModal initial={editingAppointment} onClose={() => setEditingAppointment(null)} onSave={handleEditAppointment} />}
      
      <style dangerouslySetInnerHTML={{__html: `@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-slide-up { animation: slideUp 0.4s ease-out forwards; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
}
