import React from 'react';
import { Copy, Check, RotateCcw, Home, LogOut } from 'lucide-react';

export default function GameHeader({
  roomCode,
  copiedCode,
  onCopyCode,
  difficulty,
  isPresetMode,
  isHost,
  reshuffling,
  onReshuffle,
  onBackToLobby,
  onLeave
}) {
  const getDifficultyLabel = () => {
    if (!difficulty) return '🌀 Semua Level';
    if (difficulty === 'all') return '🌀 Semua Level';

    const levels = Array.isArray(difficulty) ? difficulty : [difficulty];
    if (levels.length === 4) return '🌀 Semua Level';

    const labelMap = {
      genin: '🟢 Genin',
      chunin: '🟡 Chunin',
      jonin: '🟠 Jonin',
      kage: '🔴 Kage'
    };

    return levels.map(l => labelMap[l] || l).join(' + ');
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl px-4 py-3 mb-4 shadow-lg">
      <div className="flex items-center gap-3">
        {/* Copy Room Code Button */}
        <button
          onClick={onCopyCode}
          className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all group"
          title="Klik untuk salin kode room"
        >
          <span className="text-[11px] text-orange-400 font-semibold uppercase">ROOM:</span>
          <span className="font-mono text-base font-black text-orange-400 tracking-wider">{roomCode}</span>
          {copiedCode ? (
            <span className="text-[11px] font-bold text-green-400 flex items-center gap-0.5">
              <Check className="w-3.5 h-3.5" /> Tersalin!
            </span>
          ) : (
            <Copy className="w-3.5 h-3.5 text-orange-400/70 group-hover:text-orange-400" />
          )}
        </button>

        {/* Difficulty Badge */}
        {isPresetMode && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-bold text-slate-300">
            {getDifficultyLabel()}
          </span>
        )}
      </div>

      {/* Host Controls & Leave */}
      <div className="flex items-center gap-2 flex-wrap">
        {isHost && (
          <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={onReshuffle}
              disabled={reshuffling}
              className="px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Bagi kartu karakter baru langsung"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${reshuffling ? 'animate-spin' : ''}`} />
              <span>Bagi Kartu Baru</span>
            </button>

            <button
              onClick={onBackToLobby}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Kembali ke Lobby"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Lobby</span>
            </button>
          </div>
        )}

        <button
          onClick={onLeave}
          className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
          title="Keluar Permainan"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
