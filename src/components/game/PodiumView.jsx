import React from 'react';
import { Trophy, Crown, RotateCcw, Home } from 'lucide-react';

export default function PodiumView({
  players,
  isHost,
  reshuffling,
  onReshuffle,
  onBackToLobby
}) {
  const rankedPlayers = [...players].sort((a, b) => {
    if (a.finishRank && b.finishRank) return a.finishRank - b.finishRank;
    if (a.finishRank) return -1;
    if (b.finishRank) return 1;
    return 0;
  });

  const firstPlace = rankedPlayers[0] || null;
  const secondPlace = rankedPlayers[1] || null;
  const thirdPlace = rankedPlayers[2] || null;
  const runnersUp = rankedPlayers.slice(3);

  return (
    <div className="mb-8 p-6 rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950 border border-amber-500/30 shadow-2xl shadow-amber-950/20 text-center animate-fade-in">
      {/* Podium Header */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
        <Trophy className="w-4 h-4" /> Ronde Selesai • Semua Tertebak!
      </div>
      <h2 className="text-2xl sm:text-3xl font-black text-white font-bungee tracking-tight mb-6">
        Papan Peringkat Juara
      </h2>

      {/* Podium Pillars */}
      <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-xl mx-auto mb-6 px-2">
        {/* 2nd Place (Silver) */}
        {secondPlace && (
          <div className="flex-1 flex flex-col items-center">
            <div className="text-center mb-2">
              <div className="text-2xl sm:text-3xl p-2 bg-slate-800/90 rounded-2xl border-2 border-slate-300 shadow-lg shadow-slate-500/20 mb-1 inline-block">
                {secondPlace.avatar}
              </div>
              <div className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[90px] sm:max-w-[120px]">
                {secondPlace.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[90px] sm:max-w-[120px]">
                {secondPlace.assignedCard?.name}
              </div>
            </div>
            {/* 2nd Pillar */}
            <div className="w-full h-24 sm:h-32 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl border-t-4 border-slate-300 flex flex-col items-center justify-center shadow-lg">
              <span className="text-xl sm:text-2xl font-black text-slate-200">2</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Silver</span>
            </div>
          </div>
        )}

        {/* 1st Place (Gold - Highest) */}
        {firstPlace && (
          <div className="flex-1 flex flex-col items-center -mt-6">
            <div className="text-center mb-2 relative">
              <Crown className="w-6 h-6 text-yellow-400 mx-auto -mb-1 animate-bounce" />
              <div className="text-3xl sm:text-4xl p-2.5 bg-yellow-500/20 rounded-2xl border-2 border-yellow-400 shadow-xl shadow-yellow-500/30 mb-1 inline-block ring-4 ring-yellow-400/20">
                {firstPlace.avatar}
              </div>
              <div className="font-extrabold text-sm sm:text-base text-yellow-300 truncate max-w-[100px] sm:max-w-[140px]">
                {firstPlace.name}
              </div>
              <div className="text-[11px] text-yellow-400/80 font-medium truncate max-w-[100px] sm:max-w-[140px]">
                {firstPlace.assignedCard?.name}
              </div>
            </div>
            {/* 1st Pillar */}
            <div className="w-full h-32 sm:h-44 bg-gradient-to-t from-yellow-700/60 via-amber-600/40 to-yellow-500/30 rounded-t-2xl border-t-4 border-yellow-400 flex flex-col items-center justify-center shadow-2xl shadow-yellow-500/20">
              <span className="text-2xl sm:text-3xl font-black text-yellow-300 font-bungee">1</span>
              <span className="text-[11px] uppercase tracking-wider text-yellow-400 font-black">Champion 🥇</span>
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {thirdPlace && (
          <div className="flex-1 flex flex-col items-center">
            <div className="text-center mb-2">
              <div className="text-2xl sm:text-3xl p-2 bg-slate-800/90 rounded-2xl border-2 border-amber-600 shadow-lg shadow-amber-700/20 mb-1 inline-block">
                {thirdPlace.avatar}
              </div>
              <div className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[90px] sm:max-w-[120px]">
                {thirdPlace.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[90px] sm:max-w-[120px]">
                {thirdPlace.assignedCard?.name}
              </div>
            </div>
            {/* 3rd Pillar */}
            <div className="w-full h-18 sm:h-24 bg-gradient-to-t from-amber-950 to-amber-900/70 rounded-t-2xl border-t-4 border-amber-600 flex flex-col items-center justify-center shadow-lg">
              <span className="text-xl sm:text-2xl font-black text-amber-500">3</span>
              <span className="text-[10px] uppercase tracking-wider text-amber-500 font-bold">Bronze</span>
            </div>
          </div>
        )}
      </div>

      {/* Runners Up List (Rank 4+) */}
      {runnersUp.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-lg mx-auto">
          {runnersUp.map((player, idx) => (
            <div
              key={player.id}
              className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2 text-xs"
            >
              <span className="font-bold text-slate-400">#{idx + 4}</span>
              <span>{player.avatar}</span>
              <span className="font-semibold text-slate-200">{player.name}</span>
              <span className="text-slate-500">({player.assignedCard?.name})</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons for Game Over */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {isHost ? (
          <>
            <button
              onClick={onReshuffle}
              disabled={reshuffling}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] font-black text-slate-950 shadow-xl shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${reshuffling ? 'animate-spin' : ''}`} />
              <span>Bagi Kartu Baru (Main Lagi) 🔄</span>
            </button>
            <button
              onClick={onBackToLobby}
              className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] font-bold text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer text-sm"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Lobby</span>
            </button>
          </>
        ) : (
          <div className="px-5 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
            <span>Menunggu Host membagikan kartu baru untuk main lagi...</span>
          </div>
        )}
      </div>
    </div>
  );
}
