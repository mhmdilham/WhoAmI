import React from 'react';
import { Users, Crown, UserX } from 'lucide-react';

export default function PlayerList({
  players,
  myPlayerId,
  isHost,
  onKickPlayer
}) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          Pemain yang Bergabung ({players.length}/12)
        </span>
        <span className="text-xs text-slate-500">Min. 2 Pemain</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {players.map((player) => {
          const isMe = player.id === myPlayerId;
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                isMe
                  ? 'bg-orange-500/10 border-orange-500/40 text-white'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {player.avatar}
                </span>
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <span className="truncate max-w-[130px]">{player.name}</span>
                    {player.isHost && (
                      <span title="Host Room">
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    {isMe && <span className="text-orange-400 font-medium">Kamu • </span>}
                    {player.isHost ? 'Host' : 'Pemain'}
                  </div>
                </div>
              </div>

              {/* Host kick player button */}
              {isHost && !isMe && (
                <button
                  type="button"
                  onClick={() => onKickPlayer(player.id, player.name)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  title={`Keluarkan ${player.name}`}
                >
                  <UserX className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
