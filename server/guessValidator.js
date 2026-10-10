import { nextTurn } from './roomManager.js';

export const DISALLOWED_CLAN_STANDALONES = new Set([
  'hyuga', 'hyuuga', 'uchiha', 'uzumaki', 'sarutobi', 'senju',
  'haruno', 'hatake', 'nara', 'yamanaka', 'akimichi', 'inuzuka',
  'aburame', 'namikaze', 'hoshigaki', 'momochi', 'yakushi',
  'otsutsuki', 'ootsutsuki', 'shimura', 'umino', 'hozuki', 'houzuki', 'terumi',
  'kato', 'morino', 'mitarashi', 'yuhi', 'gekko', 'uzuki', 'nohara',
  'hagane', 'kamizuki', 'shiranui', 'kuriarare', 'munashi', 'ringo',
  'akebino', 'suikazan', 'karatachi', 'nii', 'might'
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
    answers.add(cleanFull.replace(/\s+/g, ''));
  }

  const chunks = cardName.split(/[/&()]/).map(c => c.trim()).filter(Boolean);

  for (const chunk of chunks) {
    const cleanChunk = cleanText(chunk);
    if (!cleanChunk) continue;
    answers.add(cleanChunk);
    answers.add(normalizeVariants(cleanChunk));
    answers.add(cleanChunk.replace(/\s+/g, ''));

    const words = cleanChunk.split(' ');
    // Allow reversed order for 2-word names (e.g. "uchiha sasuke" <-> "sasuke uchiha")
    if (words.length === 2) {
      const reversed = `${words[1]} ${words[0]}`;
      answers.add(reversed);
      answers.add(normalizeVariants(reversed));
      answers.add(reversed.replace(/\s+/g, ''));
    }

    if (words.length > 1) {
      const firstName = words[0];
      if (firstName.length >= 2 && !['nenek', 'kakek', 'paman', 'bibi', 'taring', 'ekor', 'raikage', 'kazekage', 'tsuchikage', 'mizukage', 'hokage'].includes(firstName)) {
        answers.add(firstName);
      }
      if (cleanChunk === 'rock lee') answers.add('lee');
      if (cleanChunk === 'might guy') answers.add('guy');
      if (cleanChunk === 'might duy') answers.add('duy');
      if (cleanChunk === 'killer bee') answers.add('bee');
      if (cleanChunk === 'nenek chiyo' || cleanChunk.includes('chiyo')) answers.add('chiyo');
      if (cleanChunk === 'hanzo si salamander') answers.add('hanzo');
    }
  }

  for (const clan of DISALLOWED_CLAN_STANDALONES) {
    answers.delete(clan);
    answers.delete(normalizeVariants(clan));
  }
  const disallowedWords = ['nenek', 'kakek', 'paman', 'bibi', 'taring', 'ekor', 'raikage', 'kazekage', 'tsuchikage', 'mizukage', 'hokage'];
  for (const dw of disallowedWords) {
    answers.delete(dw);
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

  if (isClanOnly) {
    return {
      success: true,
      correct: false,
      isClanOnly: true,
      message: 'Nama klan tidak bisa berdiri sendiri! Sebutkan nama karakternya.'
    };
  }

  if (isMatch) {
    player.isGuessed = true;

    // Calculate finishRank (1st, 2nd, 3rd place, etc.)
    const finishedCount = room.players.filter(p => p.isGuessed && p.finishRank !== null).length;
    player.finishRank = finishedCount + 1;

    room.history.push({
      type: 'GUESS_CORRECT',
      playerId: guesserSocketId,
      playerName: player.name,
      cardName: player.assignedCard.name,
      rank: player.finishRank,
      timestamp: Date.now()
    });

    // Check if all connected players have guessed
    const connectedPlayers = room.players.filter(p => p.isConnected);
    const unguessed = connectedPlayers.filter(p => !p.isGuessed);

    if (unguessed.length === 0) {
      room.status = 'GAME_OVER';
    } else {
      nextTurn(room);
    }

    return { success: true, correct: true, isClanOnly: false, rank: player.finishRank };
  } else {
    room.history.push({
      type: 'GUESS_WRONG',
      playerId: guesserSocketId,
      playerName: player.name,
      guess: guessName.trim(),
      timestamp: Date.now()
    });

    nextTurn(room);
    return { success: true, correct: false, isClanOnly: false };
  }
}
