import React from 'react';
import { Sparkles, BookOpen, PenTool, Shield, Check } from 'lucide-react';

const LEVEL_CONFIG = [
  { id: 'genin', name: 'Genin (Easy)', count: 30, desc: 'Karakter Paling Populer', icon: '🟢' },
  { id: 'chunin', name: 'Chunin (Medium)', count: 32, desc: 'Karakter Inti & Akatsuki', icon: '🟡' },
  { id: 'jonin', name: 'Jonin (Hard)', count: 32, desc: 'Arc Besar & Jonin Konoha', icon: '🟠' },
  { id: 'kage', name: 'Kage (Hardcore)', count: 32, desc: '7 Pendekar & Lore Mendalam', icon: '🔴' }
];

const ALL_LEVEL_IDS = ['genin', 'chunin', 'jonin', 'kage'];

export default function GameSettings({
  mode,
  difficulty,
  isHost,
  onUpdateMode,
  onUpdateDifficulty
}) {
  const getSelectedLevels = () => {
    if (Array.isArray(difficulty)) {
      return difficulty.length > 0 ? difficulty : ALL_LEVEL_IDS;
    }
    if (typeof difficulty === 'string' && difficulty !== 'all') {
      return [difficulty];
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
      onUpdateDifficulty(['genin']); // fallback to genin if unselected all
    } else {
      onUpdateDifficulty(ALL_LEVEL_IDS);
    }
  };

  const getSummaryText = () => {
    if (isAllSelected) return 'Semua Level (126 Karakter)';
    const names = selectedLevels.map(id => {
      const item = LEVEL_CONFIG.find(l => l.id === id);
      return item ? item.icon + ' ' + item.name.split(' ')[0] : id;
    });
    return `${names.join(' + ')} (${totalCards} Karakter)`;
  };

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
            126 karakter canon lengkap. Bisa pilih satu atau gabungkan beberapa level kesulitan sekaligus!
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

      {/* Multi-Select Difficulty Level Selector (When in Preset Mode) */}
      {mode === 'preset' && (
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              Pilih Level (Bisa Pilih Beberapa):
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-orange-400 font-semibold bg-orange-500/10 px-2.5 py-0.5 rounded-md border border-orange-500/20">
                {getSummaryText()}
              </span>

              {isHost && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-0.5 rounded-md border border-slate-700 transition-all cursor-pointer"
                >
                  {isAllSelected ? 'Reset' : 'Pilih Semua'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {LEVEL_CONFIG.map((lvl) => {
              const isSelected = selectedLevels.includes(lvl.id);
              return (
                <button
                  key={lvl.id}
                  type="button"
                  disabled={!isHost}
                  onClick={() => handleToggleLevel(lvl.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-orange-500/15 border-orange-500/60 text-white shadow-md shadow-orange-500/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 opacity-60 hover:opacity-80'
                  } ${isHost ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox indicator */}
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-orange-500 border-orange-400 text-slate-950'
                        : 'bg-slate-900 border-slate-700 text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>

                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5 text-slate-100">
                        <span>{lvl.icon}</span>
                        <span>{lvl.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{lvl.desc}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    isSelected
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {lvl.count} Karakter
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
