import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  LogOut,
  HelpCircle,
  SkipForward,
  CheckCircle,
  XCircle,
  HelpCircle as MaybeCircle,
  Edit3,
  Crown,
  Sparkles,
  Trophy,
  RotateCcw,
  Eye,
  EyeOff,
  Home
} from 'lucide-react';
import { socket } from '../utils/socket';
import { sfx } from '../utils/sfx';
import GuessModal from './GuessModal';

export default function GameBoard({ room, myPlayerId, onLeave }) {
  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [muted, setMuted] = useState(false);

  const isHost = room.hostId === myPlayerId;
  const myPlayer = room.players.find(p => p.id === myPlayerId);
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

  const handleVote = (voteType) => {
    socket.emit('vote_answer', { voteType });
  };

  const handleEndTurn = () => {
    socket.emit('end_turn');
    sfx.playTurn();
  };

  const handleToggleMute = () => {
    const isMuted = sfx.toggleMute();
    setMuted(isMuted);
  };

  const handleHostConfirmGuess = (targetPlayerId, isCorrect) => {
    if (!isHost) return;
    socket.emit('manual_confirm_guess', { targetPlayerId, isCorrect });
  };

  const handleReshuffleCards = () => {
    if (!isHost) return;
    socket.emit('reshuffle_cards');
    sfx.playStart();
  };

  const handleToggleReveal = () => {
    if (!isHost) return;
    socket.emit('reveal_all_cards');
    sfx.playTurn();
  };

  const handleBackToLobby = () => {
    if (!isHost) return;
    socket.emit('back_to_lobby');
    sfx.playTurn();
  };

  // Vote counts
  const voteList = Object.values(room.votes || {});
  const yesCount = voteList.filter(v => v === 'YES').length;
  const noCount = voteList.filter(v => v === 'NO').length;
  const maybeCount = voteList.filter(v => v === 'MAYBE').length;

  return (
    <div className="flex flex-col max-w-5xl mx-auto px-4 py-4 min-h-[95vh]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl px-4 py-3 mb-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-xl flex items-center gap-2">
            <span className="text-[11px] text-orange-400 font-semibold uppercase">ROOM</span>
            <span className="font-mono text-base font-black text-orange-400 tracking-wider">{room.code}</span>
          </div>

          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Mode Santai Tongkrongan ☕
          </span>
        </div>

        {/* Host Controls & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isHost && (
            <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              <button
                onClick={handleReshuffleCards}
                className="px-2.5 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Bagi kartu karakter baru langsung tanpa ke lobby"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Bagi Kartu Baru</span>
              </button>

              <button
                onClick={handleToggleReveal}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  room.revealedAll
                    ? 'bg-amber-500/25 text-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={room.revealedAll ? 'Sembunyikan kartu' : 'Buka semua kartu'}
              >
                {room.revealedAll ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{room.revealedAll ? 'Tutup Kartu' : 'Buka Semua'}</span>
              </button>

              <button
                onClick={handleBackToLobby}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Kembali ke Lobby"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Lobby</span>
              </button>
            </div>
          )}

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            title={muted ? 'Nyalakan Suara' : 'Matikan Suara'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onLeave}
            className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
            title="Keluar Permainan"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Turn Banner (Center Stage) */}
      <div className={`mb-6 p-4 sm:p-5 rounded-3xl border transition-all ${
        isMyTurn
          ? 'bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-yellow-500/20 border-orange-500/50 shadow-xl shadow-orange-500/10'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <span className="text-3xl p-2 bg-slate-800/80 rounded-2xl border border-slate-700 shrink-0">
              {currentTurnPlayer?.avatar}
            </span>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  {isMyTurn ? '🌟 Giliran Kamu Bertanya!' : '🎙️ Sedang Bertanya di Voice:'}
                </span>
                <span className="font-extrabold text-base text-white">
                  {isMyTurn ? 'Kamu' : currentTurnPlayer?.name}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isMyTurn
                  ? 'Nyalakan mic di Discord dan tanyakan pertanyaan sepuasnya (contoh: "Apakah aku ninja Konoha?")'
                  : 'Dengarkan di Voice/Discord, lalu tekan tombol respon di samping!'}
              </p>
            </div>
          </div>

          {/* Action buttons on Turn Banner */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {isMyTurn ? (
              <>
                <button
                  onClick={() => setIsGuessModalOpen(true)}
                  className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] font-bold text-slate-950 text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Tebak Identitas Saya!</span>
                </button>
                <button
                  onClick={handleEndTurn}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] font-semibold text-slate-300 text-xs border border-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-all"
                  title="Oper giliran ke pemain berikutnya"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Oper Giliran ⏭️</span>
                </button>
              </>
            ) : (
              /* Buzzer buttons for friends */
              <div className="flex items-center gap-2 w-full justify-center sm:justify-end">
                <button
                  onClick={() => handleVote('YES')}
                  className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>YA ({yesCount})</span>
                </button>
                <button
                  onClick={() => handleVote('NO')}
                  className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <XCircle className="w-4 h-4" />
                  <span>TIDAK ({noCount})</span>
                </button>
                <button
                  onClick={() => handleVote('MAYBE')}
                  className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <MaybeCircle className="w-4 h-4" />
                  <span>RAGU ({maybeCount})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Host Quick Confirm if Player guessed verbally on Discord voice */}
        {isHost && !isMyTurn && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Kontrol Host (Jika {currentTurnPlayer?.name} menebak langsung di voice):</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleHostConfirmGuess(currentTurnPlayer?.id, true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold cursor-pointer transition-all"
              >
                ✓ Tebakan Benar
              </button>
              <button
                onClick={() => handleHostConfirmGuess(currentTurnPlayer?.id, false)}
                className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold cursor-pointer transition-all"
              >
                ✕ Tebakan Salah (Oper)
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
          const isCardRevealed = room.revealedAll || player.isGuessed;

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
              <div className="my-2 py-6 px-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[140px]">
                {isSelf && !isCardRevealed ? (
                  /* Your Card: Secret Masked */
                  <div className="space-y-2">
                    <div className="text-3xl font-black font-bungee text-orange-400 animate-pulse tracking-widest">
                      ???
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Tanyakan clue ke temanmu di Discord!
                    </p>
                  </div>
                ) : (
                  /* Visible Card */
                  <div className="space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-semibold uppercase">
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
                      Catatan Clue Kamu:
                    </span>
                    <span className="text-[9px] text-slate-500">Auto-save</span>
                  </div>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Contoh: Bukan manusia, rambut kuning, jurus angin..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Status:</span>
                  <span className="font-semibold text-slate-300">
                    {player.isGuessed ? 'Sudah Tertebak 🎉' : isTurn ? 'Sedang Bicara 🎙️' : 'Menyimak 👀'}
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
