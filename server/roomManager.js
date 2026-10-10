import { dealCards, derangementShuffle } from './cardDealer.js';

// In-memory rooms store
export const rooms = new Map();

// Generate readable 4-letter room codes
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
}

// Preset avatars
export const AVATARS = ['🍥', '⚡', '🌸', '🍃', '🔥', '🗡️', '👁️', '🐸', '🦊', '🍙'];

export function createRoom(roomCode, hostSocketId, hostName, playerToken = null) {
  const token = playerToken || Math.random().toString(36).slice(2);
  const room = {
    code: roomCode,
    hostId: hostSocketId,
    status: 'LOBBY', // 'LOBBY' | 'SECRET_INPUT' | 'PLAYING' | 'GAME_OVER'
    settings: {
      mode: 'preset', // 'preset' | 'custom'
      deckId: 'naruto',
      difficulty: ['genin', 'chunin', 'jonin', 'kage'] // array of selected levels
    },
    players: [
      {
        id: hostSocketId,
        token: token,
        name: hostName.trim() || 'Hokage',
        avatar: AVATARS[0],
        isHost: true,
        isConnected: true,
        submittedCard: null,
        assignedCard: null,
        isGuessed: false,
        finishRank: null,
        notes: ''
      }
    ],
    currentTurnIndex: 0,
    history: []
  };

  rooms.set(roomCode, room);
  return { room, playerToken: token };
}

export function joinRoom(roomCode, socketId, playerName, playerToken = null) {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return { error: 'Room tidak ditemukan atau sudah berakhir!' };

  // Reconnection check: match by persistent token or by name
  let existingPlayer = null;
  if (playerToken) {
    existingPlayer = room.players.find(p => p.token === playerToken);
  }
  if (!existingPlayer && playerName) {
    const cleanName = playerName.trim().toLowerCase();
    existingPlayer = room.players.find(p => p.name.trim().toLowerCase() === cleanName && !p.isConnected);
  }

  if (existingPlayer) {
    existingPlayer.id = socketId;
    existingPlayer.isConnected = true;
    if (playerToken && !existingPlayer.token) {
      existingPlayer.token = playerToken;
    }
    return { room, playerToken: existingPlayer.token, isReconnection: true };
  }

  // New player joining
  if (room.status !== 'LOBBY') {
    return { error: 'Permainan sudah dimulai!' };
  }

  if (room.players.length >= 12) {
    return { error: 'Room sudah penuh (maksimal 12 pemain)!' };
  }

  const token = playerToken || Math.random().toString(36).slice(2);
  const avatarIndex = room.players.length % AVATARS.length;
  const newPlayer = {
    id: socketId,
    token: token,
    name: playerName.trim() || `Shinobi ${room.players.length + 1}`,
    avatar: AVATARS[avatarIndex],
    isHost: false,
    isConnected: true,
    submittedCard: null,
    assignedCard: null,
    isGuessed: false,
    finishRank: null,
    notes: ''
  };

  room.players.push(newPlayer);
  return { room, playerToken: token, isReconnection: false };
}

export function removePlayer(socketId, explicitLeave = false) {
  for (const [code, room] of rooms.entries()) {
    const playerIndex = room.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
      const removedPlayer = room.players[playerIndex];

      if (explicitLeave) {
        // Player explicitly clicked "Keluar"
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          rooms.delete(code);
          return null;
        }
        if (removedPlayer.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
          room.hostId = room.players[0].id;
        }
      } else {
        // Temporary disconnect: keep player in room
        removedPlayer.isConnected = false;
      }

      return { room, code };
    }
  }
  return null;
}

export function startGame(room) {
  if (room.players.length < 2) {
    return { error: 'Minimal 2 pemain untuk memulai permainan!' };
  }

  room.players.forEach(p => {
    p.isGuessed = false;
    p.finishRank = null;
    p.notes = '';
    p.submittedCard = null;
    p.assignedCard = null;
  });
  room.currentTurnIndex = 0;

  if (room.settings.mode === 'custom') {
    room.status = 'SECRET_INPUT';
    return { room };
  }

  dealCards(room);
  room.status = 'PLAYING';
  return { room };
}

export function submitSecretCard(room, socketId, cardName, hint = '') {
  if (room.status !== 'SECRET_INPUT') return { error: 'Bukan tahap input kartu!' };

  const player = room.players.find(p => p.id === socketId);
  if (!player) return { error: 'Pemain tidak ditemukan!' };

  player.submittedCard = {
    name: cardName.trim(),
    hint: hint.trim() || 'Karakter Rahasia'
  };

  const connectedPlayers = room.players.filter(p => p.isConnected);
  const allSubmitted = connectedPlayers.every(p => p.submittedCard !== null);

  if (allSubmitted) {
    const pool = connectedPlayers.map(p => ({
      authorId: p.id,
      cardName: p.submittedCard.name,
      hint: p.submittedCard.hint
    }));

    const shuffled = derangementShuffle(pool);

    connectedPlayers.forEach((player, index) => {
      player.assignedCard = {
        name: shuffled[index].cardName,
        tag: 'Karakter Custom',
        hint: shuffled[index].hint
      };
      player.isGuessed = false;
      player.finishRank = null;
      player.notes = '';
    });

    room.status = 'PLAYING';
    room.currentTurnIndex = 0;
  }

  return { room, allSubmitted };
}

export function nextTurn(room) {
  const connectedPlayers = room.players.filter(p => p.isConnected);
  const unguessedPlayers = connectedPlayers.filter(p => !p.isGuessed);

  if (unguessedPlayers.length === 0) {
    room.status = 'GAME_OVER';
    return room;
  }

  let nextIndex = (room.currentTurnIndex + 1) % room.players.length;
  let loops = 0;

  while ((!room.players[nextIndex].isConnected || room.players[nextIndex].isGuessed) && loops < room.players.length * 2) {
    nextIndex = (nextIndex + 1) % room.players.length;
    loops++;
  }

  room.currentTurnIndex = nextIndex;
  return room;
}

export function saveNotes(room, socketId, notes) {
  const player = room.players.find(p => p.id === socketId);
  if (player) {
    player.notes = notes;
    return true;
  }
  return false;
}

export function sanitizeRoomForPlayer(room, socketId) {
  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    settings: room.settings,
    currentTurnIndex: room.currentTurnIndex,
    history: room.history.slice(-15),
    players: room.players.map(p => {
      const isSelf = p.id === socketId;
      let visibleCard;

      if (!isSelf || p.isGuessed || room.status === 'GAME_OVER') {
        visibleCard = p.assignedCard;
      } else {
        visibleCard = null;
      }

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
        isConnected: p.isConnected,
        isGuessed: p.isGuessed,
        finishRank: p.finishRank || null,
        hasSubmitted: !!p.submittedCard,
        assignedCard: visibleCard,
        notes: isSelf ? p.notes : undefined
      };
    })
  };
}

export const getMaskedRoomState = sanitizeRoomForPlayer;

export function kickPlayer(room, hostSocketId, targetSocketId) {
  if (room.hostId !== hostSocketId) return { error: 'Hanya host yang bisa mengeluarkan pemain!' };
  if (hostSocketId === targetSocketId) return { error: 'Host tidak bisa mengeluarkan diri sendiri!' };

  const targetIndex = room.players.findIndex(p => p.id === targetSocketId);
  if (targetIndex === -1) return { error: 'Pemain tidak ditemukan!' };

  const kickedPlayer = room.players[targetIndex];
  room.players.splice(targetIndex, 1);

  if (room.status === 'PLAYING') {
    if (room.currentTurnIndex >= room.players.length) {
      room.currentTurnIndex = 0;
    }
    const connectedPlayers = room.players.filter(p => p.isConnected);
    const allFinished = connectedPlayers.length > 0 && connectedPlayers.every(p => p.isGuessed);
    if (allFinished) {
      room.status = 'GAME_OVER';
    } else {
      nextTurn(room);
    }
  } else if (room.status === 'SECRET_INPUT') {
    const connectedPlayers = room.players.filter(p => p.isConnected);
    const allSubmitted = connectedPlayers.length >= 2 && connectedPlayers.every(p => p.submittedCard !== null);
    if (allSubmitted) {
      const pool = connectedPlayers.map(p => ({
        authorId: p.id,
        cardName: p.submittedCard.name,
        hint: p.submittedCard.hint
      }));
      const shuffled = derangementShuffle(pool);
      connectedPlayers.forEach((player, index) => {
        player.assignedCard = {
          name: shuffled[index].cardName,
          tag: 'Karakter Custom',
          hint: shuffled[index].hint
        };
        player.isGuessed = false;
        player.finishRank = null;
        player.notes = '';
      });
      room.status = 'PLAYING';
      room.currentTurnIndex = 0;
    }
  }

  return { room, kickedPlayer };
}
