import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Crown, Users, Sparkles } from 'lucide-react';
import { socket } from '../utils/socket';
import { sfx } from '../utils/sfx';

export default function RoundOver({ room, myPlayerId }) {
  const isHost = room.hostId === myPlayerId;

  useEffect(() => {
    sfx.playWin();
    // Fire festive confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const handleRestart = () => {
    if (!isHost) return;
    socket.emit('restart_game');
    sfx.playTurn();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-8 max-w-3xl mx-auto">
      {/* Winner Spotlight */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/10 animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Ronde Selesai!
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 font-bungee">
          {room.winner ? `${room.winner} Menang!` : 'Permainan Selesai!'}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Semua kartu karakter telah diungkap. Lihat siapa yang jadi siapa!
        </p>
      </div>

      {/* Revealed Cards Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 w-full mb-8">
        {room.players.map((player) => (
          <div
            key={player.id}
            className={`p-4 rounded-2xl border transition-all text-center ${
              player.isGuessed
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl p-1 bg-slate-950 rounded-xl border border-slate-800">
                {player.avatar}
              </span>
              <span className="font-bold text-sm text-slate-200 truncate max-w-[120px]">
                {player.name}
              </span>
            </div>

            <div className="py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center">
              {player.assignedCard?.image && (
                <img
                  src={player.assignedCard.image}
                  alt={player.assignedCard.name || 'Shinobi'}
                  className="w-14 h-14 object-contain rounded-xl bg-slate-900 border border-slate-800 p-0.5 mb-1.5 shadow-md"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <span className="text-[10px] text-orange-400 font-semibold uppercase block mb-0.5">
                {player.assignedCard?.tag || 'Karakter'}
              </span>
              <div className="font-extrabold text-base text-white">
                {player.assignedCard?.name || '???'}
              </div>
              {player.assignedCard?.hint && (
                <div className="text-[11px] text-slate-400 italic mt-0.5">
                  "{player.assignedCard.hint}"
                </div>
              )}
            </div>

            <div className="mt-2 text-[11px] font-semibold">
              {player.isGuessed ? (
                <span className="text-emerald-400">✓ Berhasil Menebak</span>
              ) : (
                <span className="text-slate-500">Belum Tertebak</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Host Action: Play Again */}
      {isHost ? (
        <button
          onClick={handleRestart}
          className="w-full sm:w-auto min-w-[240px] py-4 px-8 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] font-black text-slate-950 shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
        >
          <RotateCcw className="w-5 h-5 fill-slate-950" />
          <span>Main Ronde Baru 🔄</span>
        </button>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-400 text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
          <span>Menunggu Host memulai ronde baru...</span>
        </div>
      )}
    </div>
  );
}
