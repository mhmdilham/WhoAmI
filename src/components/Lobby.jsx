import React, { useState } from 'react';
import { Copy, Check, Play, Crown, Users, Sparkles, BookOpen, PenTool, LogOut, Link2, UserX } from 'lucide-react';
import { socket } from '../utils/socket';
import { copyToClipboard } from '../utils/clipboard';

export default function Lobby({ room, myPlayerId, onLeave }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [starting, setStarting] = useState(false);

  const isHost = room.hostId === myPlayerId;
  const myPlayer = room.players.find(p => p.id === myPlayerId);

  const handleKickPlayer = (targetId, targetName) => {
    if (!isHost) return;
    if (window.confirm(`Keluarkan ${targetName} dari room?`)) {
      socket.emit('kick_player', { targetPlayerId: targetId });
    }
  };

  const handleCopyCode = () => {
    copyToClipboard(room.code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/?room=${room.code}`;
    copyToClipboard(inviteUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleUpdateMode = (mode) => {
    if (!isHost) return;
    socket.emit('update_settings', { settings: { mode } });
  };

  const handleStartGame = () => {
    if (!isHost || room.players.length < 2) return;
    setStarting(true);
    socket.emit('start_game', {}, (res) => {
      setStarting(false);
    });
  };

  return (
    <div className="flex flex-col max-w-xl mx-auto px-4 py-6 min-h-[90vh]">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Salin Kode Room Saja */}
          <button
            onClick={handleCopyCode}
            className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer group"
            title="Klik untuk salin 4 huruf kode saja"
          >
            <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider">ROOM:</span>
            <span className="font-mono text-lg font-black text-orange-400 tracking-widest">{room.code}</span>
            {copiedCode ? (
              <span className="text-[11px] font-bold text-green-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Tersalin!
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5 text-orange-400/70 group-hover:text-orange-400 transition-colors" />
            )}
          </button>

          {/* 2. Salin Link Undangan Lengkap */}
          <button
            onClick={handleCopyLink}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Salin link undangan lengkap"
          >
            {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copiedLink ? 'Link Tersalin!' : 'Salin Link'}</span>
          </button>
        </div>

        <button
          onClick={onLeave}
          className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="space-y-5">
        {/* Game Mode Selector Card */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode 1: Preset Naruto */}
            <button
              type="button"
              disabled={!isHost}
              onClick={() => handleUpdateMode('preset')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                room.settings.mode === 'preset'
                  ? 'bg-orange-500/15 border-orange-500/60 text-white shadow-lg shadow-orange-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              } ${isHost ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm flex items-center gap-2 text-slate-100">
                  <BookOpen className="w-4 h-4 text-orange-400" />
                  Koleksi Naruto 🍥
                </span>
                {room.settings.mode === 'preset' && (
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                55+ kartu karakter ninja dari Konoha, Akatsuki, hingga Sannin diacak otomatis oleh sistem.
              </p>
            </button>

            {/* Mode 2: Custom Secret Input */}
            <button
              type="button"
              disabled={!isHost}
              onClick={() => handleUpdateMode('custom')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                room.settings.mode === 'custom'
                  ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              } ${isHost ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm flex items-center gap-2 text-slate-100">
                  <PenTool className="w-4 h-4 text-amber-400" />
                  Tulis Karakter Sendiri ✍️
                </span>
                {room.settings.mode === 'custom' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tiap pemain menuliskan 1 karakter rahasia untuk temannya. Diacak tanpa ada yang dapat kartu sendiri!
              </p>
            </button>
          </div>
        </div>

        {/* Players List Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Pemain yang Bergabung ({room.players.length}/12)
            </span>
            <span className="text-xs text-slate-500">Min. 2 Pemain</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {room.players.map((player) => {
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
                    <span className="text-2xl p-1 bg-slate-900 rounded-xl border border-slate-800">
                      {player.avatar}
                    </span>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        <span className="truncate max-w-[130px]">{player.name}</span>
                        {player.isHost && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Host Room" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {isMe ? 'Kamu' : 'Shinobi'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Online"></span>
                    {isHost && !isMe && (
                      <button
                        type="button"
                        onClick={() => handleKickPlayer(player.id, player.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        title={`Keluarkan ${player.name}`}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={starting || room.players.length < 2}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] font-extrabold text-slate-950 shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-base"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>
              {room.players.length < 2
                ? 'Menunggu Teman Join (Min. 2 Orang)...'
                : 'Mulai Permainan 🚀'}
            </span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
            <span>Menunggu Host ({room.players.find(p => p.isHost)?.name || 'Host'}) memulai permainan...</span>
          </div>
        )}
      </div>
    </div>
  );
}
