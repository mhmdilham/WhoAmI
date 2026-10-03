import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
  rooms,
  generateRoomCode,
  createRoom,
  joinRoom,
  removePlayer,
  startGame,
  submitSecretCard,
  dealCards,
  nextTurn,
  evaluateGuess,
  getMaskedRoomState
} from './gameLogic.js';
import { getAvailableDecks } from './decks/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Production static file serving
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('WhoAmI API Server is running. Frontend is in development mode.');
  });
}

// Broadcast masked state to each player in the room
function broadcastRoom(room) {
  for (const player of room.players) {
    if (player.isConnected) {
      const masked = getMaskedRoomState(room, player.id);
      io.to(player.id).emit('room_update', masked);
    }
  }
}

io.on('connection', (socket) => {
  let currentRoomCode = null;

  // 1. Create Room
  socket.on('create_room', ({ hostName }, callback) => {
    const code = generateRoomCode();
    const room = createRoom(code, socket.id, hostName);
    currentRoomCode = code;
    socket.join(code);

    if (callback) callback({ success: true, roomCode: code });
    broadcastRoom(room);
  });

  // 2. Join Room
  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    const result = joinRoom(roomCode, socket.id, playerName);
    if (result.error) {
      if (callback) callback({ success: false, error: result.error });
      return;
    }

    currentRoomCode = roomCode.toUpperCase();
    socket.join(currentRoomCode);

    if (callback) callback({ success: true, roomCode: currentRoomCode });
    broadcastRoom(result.room);
  });

  // 3. Update Settings (Host Only)
  socket.on('update_settings', ({ settings }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;

    room.settings = { ...room.settings, ...settings };
    broadcastRoom(room);
  });

  // 4. Start Game (Host Only)
  socket.on('start_game', (data, callback) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;

    const result = startGame(room);
    if (result.error) {
      if (callback) callback({ success: false, error: result.error });
      return;
    }

    if (callback) callback({ success: true });
    broadcastRoom(room);
  });

  // 5. Submit Secret Card (Custom Mode)
  socket.on('submit_secret_card', ({ cardName, hint }, callback) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const result = submitSecretCard(room, socket.id, cardName, hint);
    if (result.error) {
      if (callback) callback({ success: false, error: result.error });
      return;
    }

    if (callback) callback({ success: true });
    broadcastRoom(room);
  });

  // 6. End / Pass Turn
  socket.on('end_turn', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    nextTurn(room);
    broadcastRoom(room);
  });

  // 7. Guess Identity (by player input or host confirmation)
  socket.on('guess_identity', ({ guessName }, callback) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const result = evaluateGuess(room, socket.id, guessName);
    if (result.error) {
      if (callback) callback({ success: false, error: result.error });
      return;
    }

    if (callback) callback({ success: true, correct: result.correct });
    broadcastRoom(room);
  });

  // 8. Manual Confirm Guess (By Host when friend guesses verbally in Discord voice)
  socket.on('manual_confirm_guess', ({ targetPlayerId, isCorrect }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;

    const targetPlayer = room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return;

    if (isCorrect) {
      targetPlayer.isGuessed = true;
      nextTurn(room);
    } else {
      nextTurn(room);
    }

    broadcastRoom(room);
  });

  // 9. Save Personal Scratchpad Notes
  socket.on('save_notes', ({ notes }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.notes = notes;
    }
  });

  // 10. Host Action: Bagi Kartu Baru / Acak Ulang Langsung
  socket.on('reshuffle_cards', (callback) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || (!player.isHost && room.hostId !== socket.id)) {
      if (callback) callback({ success: false, error: 'Hanya host yang bisa mengacak kartu!' });
      return;
    }

    if (room.settings.mode === 'custom') {
      room.status = 'SECRET_INPUT';
      room.players.forEach(p => {
        p.submittedCard = null;
        p.assignedCard = null;
        p.isGuessed = false;
        p.notes = '';
      });
    } else {
      dealCards(room);
      room.status = 'PLAYING';
    }

    broadcastRoom(room);
    if (callback) callback({ success: true });
  });

  // 11. Host Action: Kembali ke Lobby
  socket.on('back_to_lobby', (callback) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || (!player.isHost && room.hostId !== socket.id)) return;

    room.status = 'LOBBY';
    room.players.forEach(p => {
      p.isGuessed = false;
      p.assignedCard = null;
      p.submittedCard = null;
      p.notes = '';
    });

    broadcastRoom(room);
    if (callback) callback({ success: true });
  });

  // 13. Disconnect
  socket.on('disconnect', () => {
    if (currentRoomCode) {
      const result = removePlayer(socket.id);
      if (result && result.room) {
        broadcastRoom(result.room);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🍥 WhoAmI server running on http://localhost:${PORT}`);
});
