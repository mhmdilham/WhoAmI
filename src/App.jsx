import React, { useState, useEffect } from 'react';
import { socket } from './utils/socket';
import Home from './components/Home';
import Lobby from './components/Lobby';
import SecretInput from './components/SecretInput';
import GameBoard from './components/GameBoard';

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
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        <p>WhoAmI? • Minigame Tongkrongan & Discord Voice</p>
      </footer>
    </div>
  );
}
