import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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
  Check,
  Medal
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

  const connectedPlayers = room.players.filter(p => p.isConnected);
  const isGameOver = room.status === 'GAME_OVER' || (connectedPlayers.length > 0 && connectedPlayers.every(p => p.isGuessed));

  // Trigger celebration confetti on game over
  useEffect(() => {
    if (isGameOver) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 }
      });
      const timer = setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { y: 0.4 }
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isGameOver]);

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

  const handleReshuffleCards = () => {
    if (!isHost) return;
    setReshuffling(true);
    socket.emit('reshuffle_cards', {}, () => {
      setReshuffling(false);
    });
    setTimeout(() => setReshuffling(false), 800);
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

  // Rank sorting for podium
  const rankedPlayers = [...room.players].sort((a, b) => {
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

      {/* GAME OVER PODIUM VIEW */}
      {isGameOver ? (
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
                  onClick={handleReshuffleCards}
                  disabled={reshuffling}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] font-black text-slate-950 shadow-xl shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${reshuffling ? 'animate-spin' : ''}`} />
                  <span>Bagi Kartu Baru (Main Lagi) 🔄</span>
                </button>
                <button
                  onClick={handleBackToLobby}
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
      ) : (
        /* ACTIVE TURN BANNER */
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
        </div>
      )}

      {/* Cards Board Grid ("Layar Jidat Digital") */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {room.players.map((player) => {
          const isSelf = player.id === myPlayerId;
          const isTurn = !isGameOver && player.id === currentTurnPlayer?.id;
          const isCardRevealed = isGameOver || player.isGuessed;

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
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Tulis clue di sini..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Status:</span>
                  <span className="font-semibold text-slate-300">
                    {player.isGuessed ? (
                      player.finishRank ? `Juara #${player.finishRank} 🏆` : 'Tertebak 🎉'
                    ) : isTurn ? (
                      'Sedang Bertanya 🎙️'
                    ) : (
                      'Menyimak 👀'
                    )}
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
