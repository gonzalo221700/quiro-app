import React from 'react';
import { BookOpen, Target, ShieldCheck } from 'lucide-react';
import { techniquesData } from '../data/techniques.js';

// Pestaña Guía: se descarga solo cuando el usuario la abre (carga diferida).
export default function TechniquesTab() {
  return (
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
  );
}
