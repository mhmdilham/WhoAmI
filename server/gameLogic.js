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

export function createRoom(roomCode, hostSocketId, hostName, playerToken = null) {
  const token = playerToken || Math.random().toString(36).slice(2);
  const room = {
    code: roomCode,
    hostId: hostSocketId,
    status: 'LOBBY', // 'LOBBY' | 'SECRET_INPUT' | 'PLAYING' | 'GAME_OVER'
    settings: {
      mode: 'preset', // 'preset' | 'custom'
      deckId: 'naruto'
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
    existingPlayer = room.players.find(p => p.name.toLowerCase() === playerName.trim().toLowerCase());
  }

  if (existingPlayer) {
    existingPlayer.id = socketId;
    existingPlayer.isConnected = true;
    if (existingPlayer.isHost) {
      room.hostId = socketId;
    }
    return { room, playerToken: existingPlayer.token };
  }

  if (room.players.length >= 12) {
    return { error: 'Room sudah penuh (maksimal 12 pemain)!' };
  }

  let finalName = playerName.trim() || `Shinobi ${room.players.length + 1}`;
  const isDuplicate = room.players.some(p => p.name.toLowerCase() === finalName.toLowerCase());
  if (isDuplicate) {
    finalName += ` #${Math.floor(Math.random() * 90 + 10)}`;
  }

  const avatar = AVATARS[room.players.length % AVATARS.length];
  const token = playerToken || Math.random().toString(36).slice(2);

  const newPlayer = {
    id: socketId,
    token: token,
    name: finalName,
    avatar,
    isHost: false,
    isConnected: true,
    submittedCard: null,
    assignedCard: null,
    isGuessed: false,
    finishRank: null,
    notes: ''
  };

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
  return { room, playerToken: token };
}

export function removePlayer(socketId, explicitLeave = false) {
  for (const [code, room] of rooms.entries()) {
    const playerIndex = room.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
      const removedPlayer = room.players[playerIndex];

      if (explicitLeave) {
        // Player clicked "Keluar"
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
        // Refresh or temporary disconnect: keep player in room
        removedPlayer.isConnected = false;
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
  const shuffledDeck = [...deck];
  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
  }

  room.players.forEach((player, idx) => {
    const cardData = shuffledDeck[idx % shuffledDeck.length];
    player.assignedCard = {
      name: cardData.name,
      tag: cardData.tag || 'Shinobi',
      hint: cardData.hint || ''
    };
    player.isGuessed = false;
    player.finishRank = null;
    player.notes = '';
  });
  room.currentTurnIndex = 0;
  room.status = 'PLAYING';
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
  
  // Advance turn to the next player who has NOT yet guessed their card
  while ((!room.players[nextIndex].isConnected || room.players[nextIndex].isGuessed) && loops < room.players.length * 2) {
    nextIndex = (nextIndex + 1) % room.players.length;
    loops++;
  }

  room.currentTurnIndex = nextIndex;
  return room;
}

export const DISALLOWED_CLAN_STANDALONES = new Set([
  'hyuga', 'hyuuga', 'uchiha', 'uzumaki', 'sarutobi', 'senju',
  'haruno', 'hatake', 'nara', 'yamanaka', 'akimichi', 'inuzuka',
  'aburame', 'namikaze', 'hoshigaki', 'momochi', 'yakushi',
  'otsutsuki', 'ootsutsuki', 'shimura', 'umino', 'hozuki', 'houzuki', 'terumi'
]);

export function cleanText(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeVariants(str) {
  return str
    .replace(/hyuuga/g, 'hyuga')
    .replace(/ootsutsuki/g, 'otsutsuki')
    .replace(/houzuki/g, 'hozuki');
}

export function getValidAnswers(cardName) {
  const answers = new Set();
  const cleanFull = cleanText(cardName);
  if (cleanFull) {
    answers.add(cleanFull);
    answers.add(normalizeVariants(cleanFull));
  }

  const chunks = cardName.split(/[/&()]/).map(c => c.trim()).filter(Boolean);

  for (const chunk of chunks) {
    const cleanChunk = cleanText(chunk);
    if (!cleanChunk) continue;
    answers.add(cleanChunk);
    answers.add(normalizeVariants(cleanChunk));
    answers.add(cleanChunk.replace(/\s+/g, ''));

    const words = cleanChunk.split(' ');
    if (words.length > 1) {
      const firstName = words[0];
      if (firstName.length >= 2) {
        answers.add(firstName);
      }
      if (cleanChunk === 'rock lee') answers.add('lee');
      if (cleanChunk === 'might guy') answers.add('guy');
      if (cleanChunk === 'killer bee') answers.add('bee');
    }
  }

  for (const clan of DISALLOWED_CLAN_STANDALONES) {
    answers.delete(clan);
  }

  return Array.from(answers);
}

export function checkGuessMatch(cardName, rawGuess) {
  const cleanGuess = cleanText(rawGuess);
  if (!cleanGuess) return { isMatch: false, isClanOnly: false };

  const normGuess = normalizeVariants(cleanGuess);
  const noSpaceGuess = cleanGuess.replace(/\s+/g, '');

  if (
    DISALLOWED_CLAN_STANDALONES.has(cleanGuess) ||
    DISALLOWED_CLAN_STANDALONES.has(normGuess) ||
    DISALLOWED_CLAN_STANDALONES.has(noSpaceGuess)
  ) {
    return { isMatch: false, isClanOnly: true };
  }

  const validAnswers = getValidAnswers(cardName);
  for (const ans of validAnswers) {
    if (cleanGuess === ans || normGuess === ans || noSpaceGuess === ans.replace(/\s+/g, '')) {
      return { isMatch: true, isClanOnly: false };
    }
  }

  return { isMatch: false, isClanOnly: false };
}

export function evaluateGuess(room, guesserSocketId, guessName) {
  if (room.status !== 'PLAYING') return { error: 'Permainan tidak aktif!' };

  const player = room.players.find(p => p.id === guesserSocketId);
  if (!player || !player.assignedCard) return { error: 'Pemain atau kartu tidak ditemukan!' };

  const { isMatch, isClanOnly } = checkGuessMatch(player.assignedCard.name, guessName);

  if (isMatch) {
    player.isGuessed = true;
    
    // Assign finishRank
    const alreadyRanked = room.players.filter(p => p.finishRank);
    player.finishRank = alreadyRanked.length + 1;

    // Check if ALL active connected players are now guessed
    const connectedPlayers = room.players.filter(p => p.isConnected);
    const allFinished = connectedPlayers.length > 0 && connectedPlayers.every(p => p.isGuessed);

    if (allFinished) {
      room.status = 'GAME_OVER';
      return { correct: true, player, allFinished: true };
    }

    nextTurn(room);
    return { correct: true, player, allFinished: false };
  } else {
    nextTurn(room);
    return { correct: false, player, isClanOnly, allFinished: false };
  }
}

// Data Masking (Anti-Cheat)
export function getMaskedRoomState(room, requestingSocketId) {
  const connectedPlayers = room.players.filter(p => p.isConnected);
  const allGuessed = connectedPlayers.length > 0 && connectedPlayers.every(p => p.isGuessed);
  const isGameOver = room.status === 'GAME_OVER' || allGuessed;

  return {
    code: room.code,
    hostId: room.hostId,
    status: isGameOver ? 'GAME_OVER' : room.status,
    settings: room.settings,
    allGuessed: allGuessed,
    currentTurnIndex: room.currentTurnIndex,
    currentTurnPlayerId: room.players[room.currentTurnIndex]?.id || null,
    players: room.players.map(p => {
      const isSelf = p.id === requestingSocketId;
      let visibleCard = null;

      // Reveal all cards once game is over, or when player has successfully guessed
      if (isGameOver || p.isGuessed) {
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
        finishRank: p.finishRank || null,
        hasSubmitted: !!p.submittedCard,
        assignedCard: visibleCard,
        notes: isSelf ? p.notes : undefined
      };
    })
  };
}

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
