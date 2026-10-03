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
    status: 'LOBBY', // 'LOBBY' | 'SECRET_INPUT' | 'PLAYING' | 'ROUND_OVER'
    settings: {
      mode: 'preset', // 'preset' | 'custom'
      deckId: 'naruto',
      maxStreaks: 3,
      turnTimer: 60
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
        notes: '',
        score: 0
      }
    ],
    currentTurnIndex: 0,
    turnStartedAt: null,
    votes: {}, // { [playerId]: 'YES' | 'NO' | 'MAYBE' }
    winner: null,
    history: []
  };

  rooms.set(roomCode, room);
  return room;
}

export function joinRoom(roomCode, socketId, playerName) {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return { error: 'Room tidak ditemukan!' };
  if (room.status !== 'LOBBY' && room.status !== 'ROUND_OVER') {
    // Check if player is reconnecting
    const existingPlayer = room.players.find(p => p.name.toLowerCase() === playerName.trim().toLowerCase());
    if (existingPlayer) {
      existingPlayer.id = socketId;
      existingPlayer.isConnected = true;
      return { room };
    }
    return { error: 'Permainan sedang berlangsung. Tunggu ronde berikutnya ya!' };
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
    notes: '',
    score: 0
  };

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
  // submissions: [{ authorId, cardName, hint }]
  const n = submissions.length;
  if (n <= 1) return submissions;

  let shuffled = [...submissions];
  let isValid = false;
  let attempts = 0;

  while (!isValid && attempts < 200) {
    attempts++;
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Check if any item matches its original index / author
    isValid = submissions.every((orig, idx) => orig.authorId !== shuffled[idx].authorId);
  }

  // Fallback cyclic shift if random derangement didn't converge
  if (!isValid) {
    shuffled = [...submissions.slice(1), submissions[0]];
  }

  return shuffled;
}

export function startGame(room) {
  if (room.players.length < 2) {
    return { error: 'Minimal 2 pemain untuk memulai permainan!' };
  }

  // Reset player game states
  room.players.forEach(p => {
    p.isGuessed = false;
    p.notes = '';
    p.submittedCard = null;
    p.assignedCard = null;
  });
  room.votes = {};
  room.winner = null;
  room.currentTurnIndex = 0;

  if (room.settings.mode === 'custom') {
    room.status = 'SECRET_INPUT';
    return { room };
  }

  // Mode: PRESET (Naruto or other deck)
  const deck = loadDeck(room.settings.deckId);
  // Shuffle deck
  const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);

  room.players.forEach((player, idx) => {
    const cardData = shuffledDeck[idx % shuffledDeck.length];
    player.assignedCard = {
      name: cardData.name,
      tag: cardData.tag || 'Shinobi',
      hint: cardData.hint || ''
    };
  });

  room.status = 'PLAYING';
  room.turnStartedAt = Date.now();
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

  // Check if all connected players have submitted
  const connectedPlayers = room.players.filter(p => p.isConnected);
  const allSubmitted = connectedPlayers.every(p => p.submittedCard !== null);

  if (allSubmitted) {
    // Perform derangement shuffle
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
    });

    room.status = 'PLAYING';
    room.turnStartedAt = Date.now();
  }

  return { room, allSubmitted };
}

export function nextTurn(room) {
  const activePlayers = room.players.filter(p => p.isConnected && !p.isGuessed);
  if (activePlayers.length <= 1) {
    // Game is over, all or all but 1 have guessed
    room.status = 'ROUND_OVER';
    return room;
  }

  // Find next player who hasn't guessed yet
  let nextIndex = (room.currentTurnIndex + 1) % room.players.length;
  let loops = 0;
  while ((!room.players[nextIndex].isConnected || room.players[nextIndex].isGuessed) && loops < room.players.length) {
    nextIndex = (nextIndex + 1) % room.players.length;
    loops++;
  }

  room.currentTurnIndex = nextIndex;
  room.votes = {};
  room.turnStartedAt = Date.now();
  return room;
}

export function voteAnswer(room, voterSocketId, voteType) {
  // voteType: 'YES' | 'NO' | 'MAYBE'
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

  // Smart matching: exact match or contains name (e.g. "Naruto" matches "Naruto Uzumaki")
  const isMatch = cleanTarget.includes(cleanGuess) || cleanGuess.includes(cleanTarget.split(' ')[0]);

  if (isMatch) {
    player.isGuessed = true;
    player.score += 100;
    if (!room.winner) {
      room.winner = player.name;
    }

    // Check if game should end
    const remainingUnguessed = room.players.filter(p => p.isConnected && !p.isGuessed);
    if (remainingUnguessed.length <= 1) {
      room.status = 'ROUND_OVER';
    } else {
      nextTurn(room);
    }

    return { correct: true, player, isGameOver: room.status === 'ROUND_OVER' };
  } else {
    // Wrong guess: next turn
    nextTurn(room);
    return { correct: false, player, isGameOver: false };
  }
}

// Data Masking (Anti-Cheat): Each player gets a tailored view of the room state
export function getMaskedRoomState(room, requestingSocketId) {
  const isRoundOver = room.status === 'ROUND_OVER';

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    settings: room.settings,
    currentTurnIndex: room.currentTurnIndex,
    currentTurnPlayerId: room.players[room.currentTurnIndex]?.id || null,
    votes: room.votes,
    winner: room.winner,
    players: room.players.map(p => {
      const isSelf = p.id === requestingSocketId;
      let visibleCard = null;

      if (isRoundOver || p.isGuessed) {
        // Revealed when round is over or when player guessed correctly
        visibleCard = p.assignedCard;
      } else if (!isSelf) {
        // Can see everyone else's card
        visibleCard = p.assignedCard;
      } else {
        // Cannot see your own card while playing!
        visibleCard = null;
      }

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
        isConnected: p.isConnected,
        isGuessed: p.isGuessed,
        score: p.score,
        // Only indicate if player has submitted in SECRET_INPUT mode, don't leak the content
        hasSubmitted: !!p.submittedCard,
        assignedCard: visibleCard,
        // Only return notes to self
        notes: isSelf ? p.notes : undefined
      };
    })
  };
}
