import React, { useState } from 'react';
import { HelpCircle, X, Check, AlertCircle } from 'lucide-react';
import { socket } from '../utils/socket';
import { sfx } from '../utils/sfx';

export default function GuessModal({ isOpen, onClose }) {
  const [guess, setGuess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleSubmitGuess = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;

    setSubmitting(true);
    socket.emit('guess_identity', { guessName: guess.trim() }, (res) => {
      setSubmitting(false);
      if (res.success) {
        if (res.correct) {
          setFeedback({ type: 'success', msg: 'TEBAKANMU BENAR! 🎉 Kamu berhasil mengungkap identitasmu!' });
          sfx.playWin();
          setTimeout(() => {
            onClose();
            setFeedback(null);
            setGuess('');
          }, 2000);
        } else {
          setFeedback({ type: 'error', msg: 'SALAH! 😢 Identitasmu bukan itu. Giliranmu berakhir!' });
          sfx.playNo();
          setTimeout(() => {
            onClose();
            setFeedback(null);
            setGuess('');
          }, 2000);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Tebak Siapa Kamu</h3>
            <p className="text-xs text-slate-400">Ketik nama karakter yang menurutmu adalah dirimu</p>
          </div>
        </div>

        {feedback ? (
          <div
            className={`p-4 rounded-2xl text-center font-bold text-sm my-4 border ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {feedback.msg}
          </div>
        ) : (
          <form onSubmit={handleSubmitGuess} className="space-y-4">
            <div>
              <input
                type="text"
                autoFocus
                maxLength={40}
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Contoh: Kakashi Hatake / Naruto"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-base transition-all"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || !guess.trim()}
                className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-extrabold text-slate-950 text-xs shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Kunci Tebakan!</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
