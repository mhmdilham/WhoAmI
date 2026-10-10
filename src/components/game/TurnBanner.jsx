import React from 'react';
import { Sparkles, SkipForward } from 'lucide-react';

export default function TurnBanner({
  currentTurnPlayer,
  isMyTurn,
  onOpenGuessModal,
  onPassTurn
}) {
  return (
    <div className={`mb-6 p-4 rounded-3xl border transition-all ${
      isMyTurn
        ? 'bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-yellow-500/20 border-orange-500/50 shadow-xl shadow-orange-500/10'
        : 'bg-slate-900/80 border-slate-800'
    }`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl p-2 bg-slate-800/80 rounded-2xl border border-slate-700 shrink-0">
            {currentTurnPlayer?.avatar}
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 block">
              {isMyTurn ? 'Giliranmu' : 'Giliran Bertanya'}
            </span>
            <span className="font-extrabold text-base text-white">
              {isMyTurn ? 'Kamu' : currentTurnPlayer?.name}
            </span>
          </div>
        </div>

        {/* Action buttons on Turn Banner */}
        {isMyTurn && (
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={onOpenGuessModal}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] font-bold text-slate-950 text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Tebak Identitas</span>
            </button>
            <button
              onClick={onPassTurn}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] font-semibold text-slate-300 text-xs border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              title="Oper giliran ke pemain berikutnya"
            >
              <SkipForward className="w-4 h-4" />
              <span>Oper Giliran</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
