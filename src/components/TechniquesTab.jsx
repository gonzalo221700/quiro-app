import React, { useMemo, useState } from 'react';
import { BookOpen, Target, ShieldCheck, Search, ArrowLeft, ChevronRight } from 'lucide-react';
import { techniquesData } from '../data/techniques.js';

// Pestaña Técnicas (Diseño 2): tarjetas por área con foto real, buscador y ficha completa.
// Se descarga solo cuando el usuario la abre (carga diferida).
const AREAS = {
  quiro: { label: 'Quiropráctica', tag: 'bg-[#eef5f2] text-[#0b5563] border-[#cfe3dc]' },
  fisio: { label: 'Fisioterapia', tag: 'bg-[#fdf6e0] text-[#8a6d2f] border-[#e8d9ac]' },
  masaje: { label: 'Masaje', tag: 'bg-[#fdeef4] text-[#9d2b57] border-[#f3c4d8]' }
};

const PhotoHead = ({ tech, h }) => tech.image ? (
  <img src={tech.image} alt={tech.title} loading="lazy" className={`w-full ${h} object-cover`} />
) : (
  <div className={`w-full ${h} bg-gradient-to-br from-[#0b3b42] to-[#0e5563] flex flex-col items-center justify-center gap-2`}>
    <BookOpen className="w-9 h-9 text-[#d8b878]" />
    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#fff]/70">QuiroApp</span>
  </div>
);

export default function TechniquesTab() {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('todas');
  const [selected, setSelected] = useState(null);

  const counts = useMemo(() => ({
    todas: techniquesData.length,
    quiro: techniquesData.filter(t => t.category === 'quiro').length,
    fisio: techniquesData.filter(t => t.category === 'fisio').length,
    masaje: techniquesData.filter(t => t.category === 'masaje').length
  }), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return techniquesData.filter(t =>
      (area === 'todas' || t.category === area) &&
      (!q || (t.title + ' ' + t.description).toLowerCase().includes(q))
    );
  }, [query, area]);

  if (selected) {
    const steps = (selected.execution || '').split('\n').map(s => s.replace(/^\s*\d+\.\s*/, '').trim()).filter(Boolean);
    return (
      <div className="animate-fade-in text-left pb-10 max-w-3xl mx-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#0b3b42] bg-white border border-slate-300 px-4 py-2.5 rounded-full shadow-sm active:scale-95 transition mb-5">
          <ArrowLeft className="w-4 h-4" /> Volver a Técnicas
        </button>
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-[0_10px_24px_rgba(8,48,57,0.08)] overflow-hidden">
          <PhotoHead tech={selected} h="h-56 sm:h-72" />
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h3 className="text-2xl font-black text-[#0b3b42] leading-tight">{selected.title}</h3>
              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${AREAS[selected.category].tag}`}>{AREAS[selected.category].label}</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-[#0e7c5b] tracking-widest mb-1.5 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Fundamento</p>
              <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
            </div>
            <div className="bg-[#f7faf8] p-5 rounded-3xl border border-[#dfe9e4]">
              <p className="text-[10px] font-black uppercase text-[#b08d3e] tracking-widest mb-3 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Ejecución</p>
              <div className="space-y-3">
                {steps.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex-none w-6 h-6 rounded-full bg-[#0b3b42] text-[#fff] text-[11px] font-black flex items-center justify-center">{i + 1}</span>
                    <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{s}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200">
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1.5 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Para casa</p>
              <p className="text-sm text-emerald-900/80 leading-relaxed">{selected.help}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chip = (id, label) => (
    <button key={id} onClick={() => setArea(id)} className={`text-[11px] font-extrabold px-4 py-2.5 rounded-full border transition active:scale-95 ${area === id ? 'bg-[#0b3b42] border-[#0b3b42] text-[#fff]' : 'bg-white border-slate-300 text-slate-500 hover:border-[#0b3b42]'}`}>
      {label} · {counts[id]}
    </button>
  );

  return (
    <div className="animate-fade-in text-left pb-10">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Biblioteca clínica</p>
      <h2 className="text-3xl font-black text-[#0b3b42] mt-1">Técnicas</h2>
      <p className="text-sm text-slate-400 mt-1 mb-6">{counts.todas} técnicas de quiropráctica, fisioterapia y masaje, con su guía paso a paso.</p>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="flex items-center gap-2.5 bg-white border-[1.5px] border-[#cfe0da] rounded-2xl px-4 py-3 flex-1">
          <Search className="w-4 h-4 text-slate-400 flex-none" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar técnica…" className="bg-transparent outline-none text-sm font-semibold text-slate-700 w-full placeholder:text-slate-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {chip('todas', 'Todas')}
          {chip('quiro', 'Quiropráctica')}
          {chip('fisio', 'Fisioterapia')}
          {chip('masaje', 'Masaje')}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-[28px] p-10 text-center">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-400">Ninguna técnica coincide con tu búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tech, idx) => (
            <button key={idx} onClick={() => setSelected(tech)} className="bg-white rounded-[24px] border border-slate-200 shadow-[0_6px_16px_rgba(8,48,57,0.06)] overflow-hidden text-left hover:shadow-[0_12px_26px_rgba(8,48,57,0.12)] hover:-translate-y-0.5 transition active:scale-[0.98]">
              <PhotoHead tech={tech} h="h-44" />
              <div className="p-5">
                <h3 className="font-black text-[#0b3b42] text-[15px] leading-snug min-h-[40px]">{tech.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed mt-1.5 max-h-[63px] overflow-hidden">{tech.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${AREAS[tech.category].tag}`}>{AREAS[tech.category].label}</span>
                  <span className="text-[11px] font-black text-[#b08d3e] flex items-center gap-0.5">Ver guía <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
