import React from 'react';
import { Crown, Medal, Trophy, UserX, Edit3 } from 'lucide-react';

export default function PlayerCard({
  player,
  isSelf,
  isTurn,
  isCardRevealed,
  isGameOver,
  isHost,
  notes,
  onNotesChange,
  onKickPlayer
}) {
  const getLevelBadge = (level) => {
    switch (level) {
      case 1:
        return <span className="inline-block px-1.5 py-0.5 rounded-md border text-[9px] font-bold bg-emerald-500/15 border-emerald-500/30 text-emerald-400">🟢 Easy</span>;
      case 2:
        return <span className="inline-block px-1.5 py-0.5 rounded-md border text-[9px] font-bold bg-amber-500/15 border-amber-500/30 text-amber-400">🟡 Medium</span>;
      case 3:
        return <span className="inline-block px-1.5 py-0.5 rounded-md border text-[9px] font-bold bg-orange-500/15 border-orange-500/30 text-orange-400">🟠 Hard</span>;
      case 4:
        return <span className="inline-block px-1.5 py-0.5 rounded-md border text-[9px] font-bold bg-purple-500/15 border-purple-500/30 text-purple-400">🔴 Hardcore</span>;
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative rounded-3xl p-4.5 border transition-all flex flex-col justify-between ${
        isSelf
          ? 'bg-slate-900/90 border-orange-500/50 chakra-glow'
          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
      } ${isTurn ? 'ring-2 ring-orange-400/60' : ''}`}
    >
      {/* Player Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl p-1 bg-slate-950 rounded-xl border border-slate-800">
            {player.avatar}
          </span>
          <div>
            <div className="font-bold text-sm text-slate-100 flex items-center gap-1">
              <span className="truncate max-w-[100px]">{player.name}</span>
              {player.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {isSelf ? 'Kartu Kamu' : 'Teman'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {player.isGuessed && (
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${
              player.finishRank === 1
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                : player.finishRank === 2
                ? 'bg-slate-300/20 border-slate-300/40 text-slate-200'
                : player.finishRank === 3
                ? 'bg-amber-600/20 border-amber-600/40 text-amber-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}>
              {player.finishRank ? (
                <>
                  <Medal className="w-3 h-3" />
                  <span>Juara #{player.finishRank}</span>
                </>
              ) : (
                <>
                  <Trophy className="w-3 h-3" />
                  <span>Tertebak!</span>
                </>
              )}
            </span>
          )}

          {isHost && !isSelf && (
            <button
              type="button"
              onClick={() => onKickPlayer(player.id, player.name)}
              className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              title={`Keluarkan ${player.name}`}
            >
              <UserX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Card Body ("Layar Jidat Digital") */}
      <div className="my-2 py-4 px-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[175px]">
        {isSelf && !isCardRevealed ? (
          /* Your Card: Secret Masked */
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900/80 border border-dashed border-orange-500/30 flex items-center justify-center mb-2.5 shadow-inner">
              <span className="text-3xl font-black font-bungee text-orange-400/80 animate-pulse">?</span>
            </div>
            <div className="text-3xl font-black font-bungee text-orange-400 animate-pulse tracking-widest">
              ???
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1">Kartumu di jidat (hanya lawan yang tahu)</span>
          </div>
        ) : (
          /* Visible Card */
          <div className="flex flex-col items-center space-y-1.5 w-full">
            {player.assignedCard?.image && (
              <div className="relative mb-1">
                <img
                  src={player.assignedCard.image}
                  alt={player.assignedCard.name || 'Shinobi'}
                  loading="lazy"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl bg-slate-900/90 border border-slate-700/80 p-1 shadow-md shadow-black/40 transition-transform duration-200 hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="inline-block px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-semibold uppercase">
                {player.assignedCard?.tag || 'Shinobi'}
              </span>
              {player.assignedCard?.level && getLevelBadge(player.assignedCard.level)}
            </div>
            <h4 className="text-base font-extrabold text-white leading-tight">
              {player.assignedCard?.name || 'Karakter Rahasia'}
            </h4>
            {player.assignedCard?.hint && (
              <p className="text-[11px] text-slate-400 italic px-2">
                "{player.assignedCard.hint}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Notes if self, or status if friend */}
      {isSelf && !isGameOver ? (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-semibold">
            <span className="flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-orange-400" />
              Catatan Kamu:
            </span>
          </div>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Tulis clue di sini..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>
      ) : (
        <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Status:</span>
          <span className={player.isGuessed ? 'text-green-400 font-semibold' : 'text-slate-400'}>
            {player.isGuessed ? 'Berhasil Menebak' : isTurn ? 'Sedang Bertanya' : 'Menunggu'}
          </span>
        </div>
      )}
    </div>
  );
}
