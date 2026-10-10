import React from 'react';
import { Sparkles, BookOpen, PenTool, Shield } from 'lucide-react';

const DIFFICULTY_OPTIONS = [
  { id: 'genin', name: 'Genin (Easy)', desc: '30 Karakter Paling Populer', icon: '🟢' },
  { id: 'chunin', name: 'Chunin (Medium)', desc: '32 Karakter Inti & Akatsuki', icon: '🟡' },
  { id: 'jonin', name: 'Jonin (Hard)', desc: '32 Karakter Arc Besar & Kage', icon: '🟠' },
  { id: 'kage', name: 'Kage (Hardcore)', desc: '32 Pendekar & Lore Mendalam', icon: '🔴' },
  { id: 'all', name: 'Semua Level (Random)', desc: 'Acak dari 126 Karakter', icon: '🌀' }
];

export default function GameSettings({
  mode,
  difficulty,
  isHost,
  onUpdateMode,
  onUpdateDifficulty
}) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-400" />
          Pilihan Mode Permainan
        </span>
        {isHost ? (
          <span className="text-[11px] text-orange-400 font-medium bg-orange-500/10 px-2 py-0.5 rounded-md">
            Host Bisa Mengubah
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">Ditentukan oleh Host</span>
        )}
      </div>

      {/* Mode Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Mode 1: Preset Naruto */}
        <button
          type="button"
          disabled={!isHost}
          onClick={() => onUpdateMode('preset')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            mode === 'preset'
              ? 'bg-orange-500/15 border-orange-500/60 text-white shadow-lg shadow-orange-500/10'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
          } ${isHost ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-sm flex items-center gap-2 text-slate-100">
              <BookOpen className="w-4 h-4 text-orange-400" />
              Koleksi Naruto 🍥
            </span>
            {mode === 'preset' && (
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            126 karakter canon lengkap dengan 4 level kesulitan atau acak semua level.
          </p>
        </button>

        {/* Mode 2: Custom Secret Input */}
        <button
          type="button"
          disabled={!isHost}
          onClick={() => onUpdateMode('custom')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            mode === 'custom'
              ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-lg shadow-amber-500/10'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
          } ${isHost ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-sm flex items-center gap-2 text-slate-100">
              <PenTool className="w-4 h-4 text-amber-400" />
              Tulis Karakter Sendiri ✍️
            </span>
            {mode === 'custom' && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tiap pemain menuliskan 1 karakter rahasia untuk temannya. Diacak tanpa ada yang dapat kartu sendiri!
          </p>
        </button>
      </div>

      {/* Difficulty Level Selector (When in Preset Mode) */}
      {mode === 'preset' && (
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              Tingkat Kesulitan Karakter:
            </span>
            <span className="text-[11px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-md">
              {difficulty === 'genin' ? '🟢 Genin (Easy)' :
               difficulty === 'chunin' ? '🟡 Chunin (Medium)' :
               difficulty === 'jonin' ? '🟠 Jonin (Hard)' :
               difficulty === 'kage' ? '🔴 Kage (Hardcore)' : '🌀 Semua Level (Random)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => {
              const isSelected = (difficulty || 'all') === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!isHost}
                  onClick={() => onUpdateDifficulty(opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-orange-500/15 border-orange-500/60 text-white shadow-md shadow-orange-500/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  } ${isHost ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'} ${
                    opt.id === 'all' ? 'col-span-2 sm:col-span-1' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-slate-200">
                      <span>{opt.icon}</span>
                      <span className="truncate">{opt.name}</span>
                    </span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse shrink-0"></span>}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
