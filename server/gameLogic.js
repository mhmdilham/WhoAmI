import { loadDeck } from './decks/index.js';

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

export function createRoom(roomCode, hostSocketId, hostName) {
  const room = {
    code: roomCode,
    hostId: hostSocketId,
    status: 'LOBBY', // 'LOBBY' | 'SECRET_INPUT' | 'PLAYING'
    revealedAll: false,
    settings: {
      mode: 'preset', // 'preset' | 'custom'
      deckId: 'naruto'
    },
    players: [
      {
        id: hostSocketId,
        name: hostName.trim() || 'Hokage',
        avatar: AVATARS[0],
        isHost: true,
        isConnected: true,
        submittedCard: null,
        assignedCard: null,
        isGuessed: false,
        notes: ''
      }
    ],
    currentTurnIndex: 0,
    votes: {}, // { [playerId]: 'YES' | 'NO' | 'MAYBE' }
    history: []
  };

  rooms.set(roomCode, room);
  return room;
}

export function joinRoom(roomCode, socketId, playerName) {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return { error: 'Room tidak ditemukan!' };

  // Check if player is reconnecting
  const existingPlayer = room.players.find(p => p.name.toLowerCase() === playerName.trim().toLowerCase());
  if (existingPlayer) {
    existingPlayer.id = socketId;
    existingPlayer.isConnected = true;
    return { room };
  }

  if (room.players.length >= 12) {
    return { error: 'Room sudah penuh (maksimal 12 pemain)!' };
  }

  // Check unique name in room
  let finalName = playerName.trim() || `Shinobi ${room.players.length + 1}`;
  const isDuplicate = room.players.some(p => p.name.toLowerCase() === finalName.toLowerCase());
  if (isDuplicate) {
    finalName += ` #${Math.floor(Math.random() * 90 + 10)}`;
  }

  const avatar = AVATARS[room.players.length % AVATARS.length];

  const newPlayer = {
    id: socketId,
    name: finalName,
    avatar,
    isHost: false,
    isConnected: true,
    submittedCard: null,
    assignedCard: null,
    isGuessed: false,
    notes: ''
  };

  // If game is currently playing and mode is preset, assign a card so they can join right away
  if (room.status === 'PLAYING' && room.settings.mode === 'preset') {
    const deck = loadDeck(room.settings.deckId);
    const randomCard = deck[Math.floor(Math.random() * deck.length)];
    newPlayer.assignedCard = {
      name: randomCard.name,
      tag: randomCard.tag || 'Shinobi',
      hint: randomCard.hint || ''
    };
  }

  room.players.push(newPlayer);
  return { room };
}

export function removePlayer(socketId) {
  for (const [code, room] of rooms.entries()) {
    const playerIndex = room.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
      const removedPlayer = room.players[playerIndex];

      if (room.status === 'LOBBY') {
        room.players.splice(playerIndex, 1);
      } else {
        removedPlayer.isConnected = false;
      }

      // If room is empty, delete it
      const activePlayers = room.players.filter(p => p.isConnected);
      if (activePlayers.length === 0) {
        rooms.delete(code);
        return null;
      }

      // If host left, reassign host
      if (removedPlayer.isHost && activePlayers.length > 0) {
        removedPlayer.isHost = false;
        activePlayers[0].isHost = true;
        room.hostId = activePlayers[0].id;
      }

      // If current turn player left, advance turn
      if (room.status === 'PLAYING') {
        const currentTurnPlayer = room.players[room.currentTurnIndex];
        if (currentTurnPlayer && currentTurnPlayer.id === socketId) {
          nextTurn(room);
        }
      }

      return { room, code };
    }
  }
  return null;
}

// Derangement shuffle algorithm (no player gets their own card)
export function derangementShuffle(submissions) {
  const n = submissions.length;
  if (n <= 1) return submissions;

  let shuffled = [...submissions];
  let isValid = false;
  let attempts = 0;

  while (!isValid && attempts < 200) {
    attempts++;
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    isValid = submissions.every((orig, idx) => orig.authorId !== shuffled[idx].authorId);
  }

  if (!isValid) {
    shuffled = [...submissions.slice(1), submissions[0]];
  }

  return shuffled;
}

export function dealCards(room) {
  const deck = loadDeck(room.settings.deckId);
  const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);

  room.players.forEach((player, idx) => {
    const cardData = shuffledDeck[idx % shuffledDeck.length];
    player.assignedCard = {
      name: cardData.name,
      tag: cardData.tag || 'Shinobi',
      hint: cardData.hint || ''
    };
    player.isGuessed = false;
    player.notes = '';
  });
  room.revealedAll = false;
  room.votes = {};
  room.currentTurnIndex = 0;
}

export function startGame(room) {
  if (room.players.length < 2) {
    return { error: 'Minimal 2 pemain untuk memulai permainan!' };
  }

  room.players.forEach(p => {
    p.isGuessed = false;
    p.notes = '';
    p.submittedCard = null;
    p.assignedCard = null;
  });
  room.votes = {};
  room.revealedAll = false;
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
    hint: hint.trim() || 'Karakter Rahasia Tongkrongan'
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
      player.notes = '';
    });

    room.status = 'PLAYING';
    room.revealedAll = false;
  }

  return { room, allSubmitted };
}

export function nextTurn(room) {
  const unguessedPlayers = room.players.filter(p => p.isConnected && !p.isGuessed);
  
  // If everyone has guessed, rotate among all connected players
  const targetPool = unguessedPlayers.length > 0 
    ? unguessedPlayers 
    : room.players.filter(p => p.isConnected);

  if (targetPool.length === 0) return room;

  let nextIndex = (room.currentTurnIndex + 1) % room.players.length;
  let loops = 0;
  
  if (unguessedPlayers.length > 0) {
    while ((!room.players[nextIndex].isConnected || room.players[nextIndex].isGuessed) && loops < room.players.length) {
      nextIndex = (nextIndex + 1) % room.players.length;
      loops++;
    }
  } else {
    while (!room.players[nextIndex].isConnected && loops < room.players.length) {
      nextIndex = (nextIndex + 1) % room.players.length;
      loops++;
    }
  }

  room.currentTurnIndex = nextIndex;
  room.votes = {};
  return room;
}

export function voteAnswer(room, voterSocketId, voteType) {
  if (room.status !== 'PLAYING') return null;
  room.votes[voterSocketId] = voteType;
  return room.votes;
}

export function evaluateGuess(room, guesserSocketId, guessName) {
  if (room.status !== 'PLAYING') return { error: 'Permainan tidak aktif!' };

  const player = room.players.find(p => p.id === guesserSocketId);
  if (!player || !player.assignedCard) return { error: 'Pemain atau kartu tidak ditemukan!' };

  const cleanGuess = guessName.trim().toLowerCase();
  const cleanTarget = player.assignedCard.name.toLowerCase();

  const isMatch = cleanTarget.includes(cleanGuess) || cleanGuess.includes(cleanTarget.split(' ')[0]);

  if (isMatch) {
    player.isGuessed = true;
    nextTurn(room);
    return { correct: true, player };
  } else {
    nextTurn(room);
    return { correct: false, player };
  }
}

// Data Masking (Anti-Cheat)
export function getMaskedRoomState(room, requestingSocketId) {
  const allRevealed = room.revealedAll === true;

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    settings: room.settings,
    revealedAll: room.revealedAll,
    allGuessed: room.players.every(p => !p.isConnected || p.isGuessed),
    currentTurnIndex: room.currentTurnIndex,
    currentTurnPlayerId: room.players[room.currentTurnIndex]?.id || null,
    votes: room.votes,
    players: room.players.map(p => {
      const isSelf = p.id === requestingSocketId;
      let visibleCard = null;

      if (allRevealed || p.isGuessed) {
        visibleCard = p.assignedCard;
      } else if (!isSelf) {
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
        hasSubmitted: !!p.submittedCard,
        assignedCard: visibleCard,
        notes: isSelf ? p.notes : undefined
      };
    })
  };
}
