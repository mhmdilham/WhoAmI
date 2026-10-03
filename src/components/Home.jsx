import React, { useState, useEffect } from 'react';
import { Sparkles, Users, ArrowRight, Shield, Mic, Gamepad2 } from 'lucide-react';
import { socket } from '../utils/socket';

export default function Home({ onJoinSuccess }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if room code exists in URL query (e.g. ?room=ABCD)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code.toUpperCase());
    }
  }, []);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Masukkan nama atau nickname kamu dulu!');
      return;
    }
    setError('');
    setLoading(true);

    socket.emit('create_room', { hostName: name.trim() }, (response) => {
      setLoading(false);
      if (response.success) {
        sessionStorage.setItem('whoami_session', JSON.stringify({
          roomCode: response.roomCode,
          playerName: name.trim(),
          playerToken: response.playerToken
        }));
        onJoinSuccess({ roomCode: response.roomCode, playerName: name.trim() });
      } else {
        setError(response.error || 'Gagal membuat room!');
      }
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Masukkan nama atau nickname kamu dulu!');
      return;
    }
    if (!roomCode.trim()) {
      setError('Masukkan 4 digit kode room!');
      return;
    }
    setError('');
    setLoading(true);

    socket.emit('join_room', { roomCode: roomCode.trim().toUpperCase(), playerName: name.trim() }, (response) => {
      setLoading(false);
      if (response.success) {
        sessionStorage.setItem('whoami_session', JSON.stringify({
          roomCode: response.roomCode,
          playerName: name.trim(),
          playerToken: response.playerToken
        }));
        onJoinSuccess({ roomCode: response.roomCode, playerName: name.trim() });
      } else {
        setError(response.error || 'Gagal bergabung ke room!');
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-8 max-w-lg mx-auto">
      {/* Title & Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Gamepad2 className="w-4 h-4" /> Party Game Tongkrongan
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent font-bungee">
          WHO AM I?
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
          Tebak karakter di jidatmu! Ngobrol langsung lewat mic Discord atau saat ngumpul santai.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-orange-950/20">
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium animate-shake">
            {error}
          </div>
        )}

        {/* Nickname Input */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            Nama / Nickname Kamu
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={16}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Uzumaki Budi"
              className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium text-base"
            />
          </div>
        </div>

        {/* Action: Create Room */}
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] font-bold text-slate-950 shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-base mb-5"
        >
          <Sparkles className="w-5 h-5 fill-slate-950" />
          <span>Buat Room Baru (Host)</span>
        </button>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-5">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase tracking-widest font-semibold">atau gabung</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Action: Join Room with Code */}
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={4}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="KODE"
            className="w-1/2 bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3 py-3 text-center text-lg font-mono font-bold tracking-widest text-orange-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 uppercase transition-all"
          />
          <button
            onClick={handleJoinRoom}
            disabled={loading}
            className="w-1/2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.99] font-semibold text-slate-100 border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            <span>Gabung</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-2 gap-3 w-full mt-6 text-xs text-slate-400">
        <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
          <Mic className="w-4 h-4 text-orange-400 shrink-0" />
          <span>Tanya jawab langsung di mic Discord</span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Anti-cheat: Kartumu tertutup di layarmu</span>
        </div>
      </div>
    </div>
  );
}
