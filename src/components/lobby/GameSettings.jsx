import React from 'react';
import { Sparkles, BookOpen, PenTool, Shield, Check } from 'lucide-react';

const LEVEL_CONFIG = [
  { id: 'easy', name: 'Easy (Mudah)', count: 30, desc: 'Karakter Paling Populer', icon: '🟢' },
  { id: 'medium', name: 'Medium (Sedang)', count: 32, desc: 'Karakter Inti & Terkenal', icon: '🟡' },
  { id: 'hard', name: 'Hard (Sulit)', count: 32, desc: 'Arc Besar & Tokoh Perang', icon: '🟠' },
  { id: 'hardcore', name: 'Hardcore (Ekstrem)', count: 32, desc: '7 Pendekar & Lore Mendalam', icon: '🔴' }
];

const ALL_LEVEL_IDS = ['easy', 'medium', 'hard', 'hardcore'];

export default function GameSettings({
  mode,
  difficulty,
  isHost,
  onUpdateMode,
  onUpdateDifficulty
}) {
  const normalizeId = (id) => {
    if (id === 'genin') return 'easy';
    if (id === 'chunin') return 'medium';
    if (id === 'jonin') return 'hard';
    if (id === 'kage') return 'hardcore';
    return id;
  };

  const getSelectedLevels = () => {
    if (Array.isArray(difficulty)) {
      const normalized = difficulty.map(normalizeId);
      return normalized.length > 0 ? normalized : ALL_LEVEL_IDS;
    }
    if (typeof difficulty === 'string' && difficulty !== 'all') {
      return [normalizeId(difficulty)];
    }
    return ALL_LEVEL_IDS;
  };

  const selectedLevels = getSelectedLevels();
  const isAllSelected = selectedLevels.length === 4;

  const totalCards = selectedLevels.reduce((sum, id) => {
    const item = LEVEL_CONFIG.find(l => l.id === id);
    return sum + (item ? item.count : 0);
  }, 0);

  const handleToggleLevel = (levelId) => {
    if (!isHost) return;
    if (selectedLevels.includes(levelId)) {
      if (selectedLevels.length === 1) {
        // Minimal 1 level harus tetap terpilih
        return;
      }
      onUpdateDifficulty(selectedLevels.filter(id => id !== levelId));
    } else {
      onUpdateDifficulty([...selectedLevels, levelId]);
    }
  };

  const handleToggleSelectAll = () => {
    if (!isHost) return;
    if (isAllSelected) {
      onUpdateDifficulty(['easy']);
    } else {
      onUpdateDifficulty(ALL_LEVEL_IDS);
    }
  };

  const getSummaryListText = () => {
    if (isAllSelected) return 'Semua Level (Acak 126 Shinobi)';
    return selectedLevels
      .map(id => {
        const item = LEVEL_CONFIG.find(l => l.id === id);
        return item ? item.name.split(' ')[0] : id;
      })
      .join(', ');
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl">
      {/* 1. Header Pilihan Mode */}
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

      {/* 2. Grid Dua Mode Utama (Preset vs Custom) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Mode 1: Preset Naruto */}
        <button
          type="button"
          disabled={!isHost}
          onClick={() => onUpdateMode('preset')}
          className={`p-4 rounded-2xl border text-left transition-all min-h-[96px] flex flex-col justify-between ${
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
            126 karakter canon lengkap dengan filter multi-level kesulitan.
          </p>
        </button>

        {/* Mode 2: Custom Secret Input */}
        <button
          type="button"
          disabled={!isHost}
          onClick={() => onUpdateMode('custom')}
          className={`p-4 rounded-2xl border text-left transition-all min-h-[96px] flex flex-col justify-between ${
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
            Tiap pemain menuliskan 1 karakter rahasia untuk temannya. Diacak otomatis!
          </p>
        </button>
      </div>

      {/* 3. Multi-Select Difficulty Level Selector (Zero-Shift Layout) */}
      {mode === 'preset' && (
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          {/* Header Row: Always Single Line, Zero Layout Shift */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Shield className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 truncate">
                Pilih Level:
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-orange-400 font-bold bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20 whitespace-nowrap">
                {totalCards} Karakter Aktif
              </span>

              {isHost && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
                >
                  {isAllSelected ? 'Reset' : 'Pilih Semua'}
                </button>
              )}
            </div>
          </div>

          {/* 4 Level Cards: Exact Uniform Height (66px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {LEVEL_CONFIG.map((lvl) => {
              const isSelected = selectedLevels.includes(lvl.id);
              return (
                <button
                  key={lvl.id}
                  type="button"
                  disabled={!isHost}
                  onClick={() => handleToggleLevel(lvl.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2.5 h-[66px] ${
                    isSelected
                      ? 'bg-orange-500/15 border-orange-500/60 text-white shadow-md shadow-orange-500/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 opacity-60 hover:opacity-80'
                  } ${isHost ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Checkbox indicator */}
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-orange-500 border-orange-400 text-slate-950'
                        : 'bg-slate-900 border-slate-700 text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold flex items-center gap-1.5 text-slate-100 truncate">
                        <span>{lvl.icon}</span>
                        <span className="truncate">{lvl.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{lvl.desc}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    isSelected
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {lvl.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fixed-Height Bottom Summary Bar (No shifting) */}
          <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 h-8">
            <span className="truncate pr-2">
              Kombinasi aktif: <strong className="text-orange-400 font-semibold">{getSummaryListText()}</strong>
            </span>
            <span className="shrink-0 text-slate-500 font-medium whitespace-nowrap">
              {selectedLevels.length} dari 4 level
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
