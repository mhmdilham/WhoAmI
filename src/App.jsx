import React, { useState, useEffect, lazy, Suspense } from 'react';
import { socket } from './utils/socket';
import Home from './components/Home';

const Lobby = lazy(() => import('./components/Lobby'));
const SecretInput = lazy(() => import('./components/SecretInput'));
const GameBoard = lazy(() => import('./components/GameBoard'));

export default function App() {
  const [room, setRoom] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(() => {
    return !!sessionStorage.getItem('whoami_session');
  });

  useEffect(() => {
    const attemptReconnect = () => {
      try {
        const raw = sessionStorage.getItem('whoami_session');
        if (raw) {
          const session = JSON.parse(raw);
          if (session.roomCode && session.playerName) {
            socket.emit('join_room', session, (res) => {
              setIsReconnecting(false);
              if (!res.success) {
                // Room expired or not found
                sessionStorage.removeItem('whoami_session');
                setRoom(null);
              }
            });
            return;
          }
        }
      } catch (err) {
        sessionStorage.removeItem('whoami_session');
      }
      setIsReconnecting(false);
    };

    socket.on('connect', () => {
      setMyPlayerId(socket.id);
      attemptReconnect();
    });

    socket.on('room_update', (updatedRoom) => {
      setRoom(updatedRoom);
      setMyPlayerId(socket.id);
      setIsReconnecting(false);
    });

    socket.on('kicked', (reason) => {
      alert(reason || 'Kamu telah dikeluarkan dari room oleh Host.');
      sessionStorage.removeItem('whoami_session');
      setRoom(null);
      window.history.replaceState({}, document.title, window.location.pathname);
    });

    if (socket.connected) {
      setMyPlayerId(socket.id);
      attemptReconnect();
    }

    return () => {
      socket.off('connect');
      socket.off('room_update');
      socket.off('kicked');
    };
  }, []);

  const handleLeaveRoom = () => {
    sessionStorage.removeItem('whoami_session');
    socket.emit('leave_room');
    setRoom(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      <main className="flex-1">
        {isReconnecting && !room && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Menyambungkan kembali ke game...</span>
          </div>
        )}

        {!isReconnecting && !room && (
          <Home
            onJoinSuccess={() => {}}
          />
        )}

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Memuat ruangan...</span>
          </div>
        }>
          {room && room.status === 'LOBBY' && (
            <Lobby
              room={room}
              myPlayerId={myPlayerId}
              onLeave={handleLeaveRoom}
            />
          )}

          {room && room.status === 'SECRET_INPUT' && (
            <SecretInput
              room={room}
              myPlayerId={myPlayerId}
            />
          )}

          {room && (room.status === 'PLAYING' || room.status === 'ROUND_OVER' || room.status === 'GAME_OVER') && (
            <GameBoard
              room={room}
              myPlayerId={myPlayerId}
              onLeave={handleLeaveRoom}
            />
          )}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-900 flex flex-col items-center justify-center gap-1.5 px-4">
        <p>WhoAmI? • Minigame Tongkrongan & Discord Voice</p>
        <p className="flex items-center justify-center gap-1.5 flex-wrap text-[11px] text-slate-400">
          <span>Dibuat oleh</span>
          <a
            href="https://github.com/mhmdilham"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold transition-colors underline underline-offset-2"
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>mhmdilham (Muhammad Ilham Abdu Sholeh)</span>
          </a>
        </p>
      </footer>
    </div>
  );
}
