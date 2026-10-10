import React, { useState } from 'react';
import { Copy, Check, Play, LogOut, Link2 } from 'lucide-react';
import { socket } from '../utils/socket';
import { copyToClipboard } from '../utils/clipboard';

import GameSettings from './lobby/GameSettings';
import PlayerList from './lobby/PlayerList';

export default function Lobby({ room, myPlayerId, onLeave }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [starting, setStarting] = useState(false);

  const isHost = room.hostId === myPlayerId;

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

  const handleUpdateDifficulty = (difficulty) => {
    if (!isHost) return;
    socket.emit('update_settings', { settings: { difficulty } });
  };

  const handleStartGame = () => {
    if (!isHost || room.players.length < 2) return;
    setStarting(true);
    socket.emit('start_game', {}, () => {
      setStarting(false);
    });
  };

  return (
    <div className="flex flex-col max-w-xl mx-auto px-4 py-6 min-h-[90vh]">
      {/* 1. Top Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Salin Kode Room Saja */}
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

          {/* Salin Link Undangan Lengkap */}
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

      {/* 2. Main Content Cards */}
      <div className="space-y-5">
        {/* Game Mode & Difficulty Settings */}
        <GameSettings
          mode={room.settings.mode}
          difficulty={room.settings.difficulty}
          isHost={isHost}
          onUpdateMode={handleUpdateMode}
          onUpdateDifficulty={handleUpdateDifficulty}
        />

        {/* Players List */}
        <PlayerList
          players={room.players}
          myPlayerId={myPlayerId}
          isHost={isHost}
          onKickPlayer={handleKickPlayer}
        />

        {/* 3. Action Button (Host Start OR Guest Waiting) */}
        <div className="pt-2">
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={room.players.length < 2 || starting}
              className={`w-full py-4 rounded-2xl font-black text-slate-950 text-base shadow-xl flex items-center justify-center gap-2 transition-all ${
                room.players.length >= 2 && !starting
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25 active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
              }`}
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>
                {starting
                  ? 'Memulai...'
                  : room.players.length < 2
                  ? 'Menunggu Pemain Lain (Min. 2)...'
                  : 'Mulai Permainan 🚀'}
              </span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center flex items-center justify-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping"></span>
              <span className="text-xs font-semibold text-slate-400">
                Menunggu Host memulai permainan...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
