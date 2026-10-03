import React, { useState, useEffect } from 'react';
import { socket } from './utils/socket';
import { sfx } from './utils/sfx';
import Home from './components/Home';
import Lobby from './components/Lobby';
import SecretInput from './components/SecretInput';
import GameBoard from './components/GameBoard';
import RoundOver from './components/RoundOver';

export default function App() {
  const [room, setRoom] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);

  useEffect(() => {
    // Save socket ID
    socket.on('connect', () => {
      setMyPlayerId(socket.id);
    });

    // Listen to room updates
    socket.on('room_update', (updatedRoom) => {
      setRoom(updatedRoom);
      setMyPlayerId(socket.id);
    });

    // Listen to sound effect events broadcast by server
    socket.on('sfx_trigger', (data) => {
      switch (data.type) {
        case 'YES':
          sfx.playYes();
          break;
        case 'NO':
        case 'WRONG_GUESS':
          sfx.playNo();
          break;
        case 'MAYBE':
          sfx.playMaybe();
          break;
        case 'WINNER':
          sfx.playWin();
          break;
        case 'GAME_START':
        case 'ALL_SUBMITTED':
          sfx.playStart();
          break;
        case 'NEXT_TURN':
        case 'RESTART':
          sfx.playTurn();
          break;
        default:
          break;
      }
    });

    return () => {
      socket.off('connect');
      socket.off('room_update');
      socket.off('sfx_trigger');
    };
  }, []);

  const handleLeaveRoom = () => {
    socket.disconnect();
    socket.connect();
    setRoom(null);
    // Clean URL query
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      <main className="flex-1">
        {!room && (
          <Home
            onJoinSuccess={({ roomCode }) => {
              // Socket already joined via callback
            }}
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

        {room && room.status === 'PLAYING' && (
          <GameBoard
            room={room}
            myPlayerId={myPlayerId}
            onLeave={handleLeaveRoom}
          />
        )}

        {room && room.status === 'ROUND_OVER' && (
          <RoundOver
            room={room}
            myPlayerId={myPlayerId}
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
