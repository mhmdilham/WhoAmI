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
  nextTurn,
  voteAnswer,
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
    io.to(currentRoomCode).emit('sfx_trigger', { type: 'GAME_START' });
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

    if (result.allSubmitted) {
      io.to(currentRoomCode).emit('sfx_trigger', { type: 'ALL_SUBMITTED' });
    }
  });

  // 6. Vote / Answer (YES / NO / MAYBE)
  socket.on('vote_answer', ({ voteType }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    voteAnswer(room, socket.id, voteType);
    broadcastRoom(room);

    // Broadcast sound effect to everyone in room!
    io.to(currentRoomCode).emit('sfx_trigger', { type: voteType, senderId: socket.id });
  });

  // 7. End / Pass Turn
  socket.on('end_turn', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    nextTurn(room);
    broadcastRoom(room);
    io.to(currentRoomCode).emit('sfx_trigger', { type: 'NEXT_TURN' });
  });

  // 8. Guess Identity (by player input or host confirmation)
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

    if (result.correct) {
      io.to(currentRoomCode).emit('sfx_trigger', { type: 'WINNER', playerName: result.player.name });
    } else {
      io.to(currentRoomCode).emit('sfx_trigger', { type: 'WRONG_GUESS', playerName: result.player.name });
    }
  });

  // 9. Manual Confirm Guess (By Host or verbal confirmation in Discord)
  socket.on('manual_confirm_guess', ({ targetPlayerId, isCorrect }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;

    const targetPlayer = room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return;

    if (isCorrect) {
      targetPlayer.isGuessed = true;
      targetPlayer.score += 100;
      if (!room.winner) room.winner = targetPlayer.name;

      const remaining = room.players.filter(p => p.isConnected && !p.isGuessed);
      if (remaining.length <= 1) {
        room.status = 'ROUND_OVER';
      } else {
        nextTurn(room);
      }
      io.to(currentRoomCode).emit('sfx_trigger', { type: 'WINNER', playerName: targetPlayer.name });
    } else {
      nextTurn(room);
      io.to(currentRoomCode).emit('sfx_trigger', { type: 'WRONG_GUESS', playerName: targetPlayer.name });
    }

    broadcastRoom(room);
  });

  // 10. Save Personal Scratchpad Notes
  socket.on('save_notes', ({ notes }) => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.notes = notes;
    }
  });

  // 11. Restart Game / Play Again
  socket.on('restart_game', () => {
    if (!currentRoomCode) return;
    const room = rooms.get(currentRoomCode);
    if (!room || room.hostId !== socket.id) return;

    room.status = 'LOBBY';
    room.winner = null;
    room.votes = {};
    room.players.forEach(p => {
      p.isGuessed = false;
      p.assignedCard = null;
      p.submittedCard = null;
      p.notes = '';
    });

    broadcastRoom(room);
    io.to(currentRoomCode).emit('sfx_trigger', { type: 'RESTART' });
  });

  // 12. Disconnect
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
