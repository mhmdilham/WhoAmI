import React, { useState, useEffect } from 'react';
import {
  LogOut,
  SkipForward,
  Edit3,
  Crown,
  Sparkles,
  Trophy,
  RotateCcw,
  Home,
  Copy,
  Check
} from 'lucide-react';
import { socket } from '../utils/socket';
import { copyToClipboard } from '../utils/clipboard';
import GuessModal from './GuessModal';

export default function GameBoard({ room, myPlayerId, onLeave }) {
  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [reshuffling, setReshuffling] = useState(false);

  const myPlayer = room.players.find(p => p.id === myPlayerId);
  const isHost = myPlayer?.isHost || room.hostId === myPlayerId;
  const currentTurnPlayer = room.players[room.currentTurnIndex] || room.players[0];
  const isMyTurn = currentTurnPlayer?.id === myPlayerId;

  // Initialize personal notes from server state
  useEffect(() => {
    if (myPlayer?.notes) {
      setNotes(myPlayer.notes);
    }
  }, [myPlayer?.notes]);

  const handleNotesChange = (val) => {
    setNotes(val);
    socket.emit('save_notes', { notes: val });
  };

  const handleEndTurn = () => {
    socket.emit('end_turn');
  };

  const handleHostConfirmGuess = (targetPlayerId, isCorrect) => {
    if (!isHost) return;
    socket.emit('manual_confirm_guess', { targetPlayerId, isCorrect });
  };

  const handleReshuffleCards = () => {
    if (!isHost) return;
    setReshuffling(true);
    socket.emit('reshuffle_cards', () => {
      setReshuffling(false);
    });
  };

  const handleBackToLobby = () => {
    if (!isHost) return;
    socket.emit('back_to_lobby');
  };

  const handleCopyCode = () => {
    copyToClipboard(room.code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  return (
    <div className="flex flex-col max-w-5xl mx-auto px-4 py-4 min-h-[95vh]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl px-4 py-3 mb-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all group"
            title="Klik untuk salin kode room"
          >
            <span className="text-[11px] text-orange-400 font-semibold uppercase">ROOM:</span>
            <span className="font-mono text-base font-black text-orange-400 tracking-wider">{room.code}</span>
            {copiedCode ? (
              <span className="text-[11px] font-bold text-green-400 flex items-center gap-0.5">
                <Check className="w-3.5 h-3.5" /> Tersalin!
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5 text-orange-400/70 group-hover:text-orange-400" />
            )}
          </button>
        </div>

        {/* Host Controls & Leave */}
        <div className="flex items-center gap-2 flex-wrap">
          {isHost && (
            <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              <button
                onClick={handleReshuffleCards}
                disabled={reshuffling}
                className="px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Bagi kartu karakter baru langsung"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${reshuffling ? 'animate-spin' : ''}`} />
                <span>Bagi Kartu Baru</span>
              </button>

              <button
                onClick={handleBackToLobby}
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

      {/* Turn Banner (Clean & Minimal) */}
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
                onClick={() => setIsGuessModalOpen(true)}
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] font-bold text-slate-950 text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Tebak Identitas</span>
              </button>
              <button
                onClick={handleEndTurn}
                className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] font-semibold text-slate-300 text-xs border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                title="Oper giliran ke pemain berikutnya"
              >
                <SkipForward className="w-4 h-4" />
                <span>Oper Giliran</span>
              </button>
            </div>
          )}
        </div>

        {/* Host Quick Confirm if Player guessed verbally on Discord voice */}
        {isHost && !isMyTurn && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Konfirmasi jika {currentTurnPlayer?.name} menebak di voice:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleHostConfirmGuess(currentTurnPlayer?.id, true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold cursor-pointer transition-all"
              >
                ✓ Benar
              </button>
              <button
                onClick={() => handleHostConfirmGuess(currentTurnPlayer?.id, false)}
                className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold cursor-pointer transition-all"
              >
                ✕ Salah
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cards Board Grid ("Layar Jidat Digital") */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {room.players.map((player) => {
          const isSelf = player.id === myPlayerId;
          const isTurn = player.id === currentTurnPlayer?.id;
          const isCardRevealed = player.isGuessed;

          return (
            <div
              key={player.id}
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

                {player.isGuessed && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Tertebak!
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="my-2 py-6 px-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[130px]">
                {isSelf && !isCardRevealed ? (
                  /* Your Card: Secret Masked */
                  <div className="text-4xl font-black font-bungee text-orange-400 animate-pulse tracking-widest">
                    ???
                  </div>
                ) : (
                  /* Visible Card */
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-semibold uppercase">
                      {player.assignedCard?.tag || 'Shinobi'}
                    </span>
                    <h4 className="text-base font-extrabold text-white leading-tight">
                      {player.assignedCard?.name || 'Karakter Rahasia'}
                    </h4>
                    {player.assignedCard?.hint && (
                      <p className="text-[11px] text-slate-400 italic">
                        "{player.assignedCard.hint}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Notes if self, or status if friend */}
              {isSelf ? (
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
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Tulis clue di sini..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Status:</span>
                  <span className="font-semibold text-slate-300">
                    {player.isGuessed ? 'Tertebak 🎉' : isTurn ? 'Sedang Bertanya 🎙️' : 'Menyimak 👀'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Guess */}
      <GuessModal
        isOpen={isGuessModalOpen}
        onClose={() => setIsGuessModalOpen(false)}
      />
    </div>
  );
}
