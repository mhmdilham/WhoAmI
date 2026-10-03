import React, { useState, useEffect } from 'react';
import { socket } from './utils/socket';
import Home from './components/Home';
import Lobby from './components/Lobby';
import SecretInput from './components/SecretInput';
import GameBoard from './components/GameBoard';

export default function App() {
  const [room, setRoom] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      setMyPlayerId(socket.id);
    });

    socket.on('room_update', (updatedRoom) => {
      setRoom(updatedRoom);
      setMyPlayerId(socket.id);
    });

    return () => {
      socket.off('connect');
      socket.off('room_update');
    };
  }, []);

  const handleLeaveRoom = () => {
    socket.disconnect();
    socket.connect();
    setRoom(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      <main className="flex-1">
        {!room && (
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

        {room && (room.status === 'PLAYING' || room.status === 'ROUND_OVER') && (
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
