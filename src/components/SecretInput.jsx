import React, { useState } from 'react';
import { Lock, Send, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { socket } from '../utils/socket';
import { sfx } from '../utils/sfx';

export default function SecretInput({ room, myPlayerId }) {
  const [cardName, setCardName] = useState('');
  const [hint, setHint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState('');

  const myPlayer = room.players.find(p => p.id === myPlayerId);
  const isAlreadySubmitted = hasSubmitted || myPlayer?.hasSubmitted;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardName.trim()) {
      setError('Masukkan nama karakter rahasia!');
      return;
    }

    setError('');
    setSubmitting(true);
    sfx.playTurn();

    socket.emit(
      'submit_secret_card',
      { cardName: cardName.trim(), hint: hint.trim() },
      (res) => {
        setSubmitting(false);
        if (res.success) {
          setHasSubmitted(true);
          sfx.playYes();
        } else {
          setError(res.error || 'Gagal mengirim kartu rahasia');
        }
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-8 max-w-lg mx-auto">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Lock className="w-3.5 h-3.5" /> Rahasia & Konfidensial
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Tulis 1 Karakter untuk Temanmu
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
          Karakter ini akan diacak ke salah satu temanmu. Kamu dijamin <span className="text-amber-400 font-semibold">TIDAK AKAN</span> mendapatkan karakter yang kamu tulis sendiri!
        </p>
      </div>

      {/* Input or Waiting Card */}
      <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl mb-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {!isAlreadySubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Nama Karakter / Tokoh <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                maxLength={40}
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Contoh: Sasuke Uchiha / Deddy Corbuzier / Teman Tongkrongan"
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-medium text-base transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Petunjuk / Ciri Khas <span className="text-slate-500 text-[10px] font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                maxLength={60}
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Contoh: Pengguna Chidori / Suka makan seblak"
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-medium text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !cardName.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.99] font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              <Send className="w-4 h-4 fill-slate-950" />
              <span>Kirim Karakter Rahasia</span>
            </button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Karakter Rahasiamu Sudah Terkunci!</h3>
            <p className="text-xs text-slate-400">
              Menunggu teman-teman yang lain selesai menulis kartu mereka...
            </p>
          </div>
        )}
      </div>

      {/* Live Submission Status Checklist */}
      <div className="w-full bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>Status Pengumpulan Kartu</span>
          <span className="text-amber-400">
            {room.players.filter(p => p.hasSubmitted).length} / {room.players.length} Siap
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {room.players.map((player) => (
            <div
              key={player.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                player.hasSubmitted
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span>{player.avatar}</span>
                <span className="truncate max-w-[90px] font-medium">{player.name}</span>
              </div>
              {player.hasSubmitted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0 animate-spin" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
