import { loadDeck } from './decks/index.js';

// Derangement shuffle algorithm (no player gets their own card in custom mode)
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
  const fullDeck = loadDeck(room.settings.deckId);
  const difficulty = room.settings.difficulty;

  const levelMap = {
    easy: 1,
    medium: 2,
    hard: 3,
    hardcore: 4,
    genin: 1,
    chunin: 2,
    jonin: 3,
    kage: 4,
    1: 1,
    2: 2,
    3: 3,
    4: 4
  };

  let targetLevels = [];
  if (Array.isArray(difficulty)) {
    targetLevels = difficulty.map(d => levelMap[d]).filter(Boolean);
  } else if (typeof difficulty === 'string' && difficulty !== 'all') {
    if (levelMap[difficulty]) targetLevels = [levelMap[difficulty]];
  }

  let filteredDeck = fullDeck;
  if (targetLevels.length > 0 && targetLevels.length < 4) {
    const matched = fullDeck.filter(card => targetLevels.includes(card.level));
    if (matched.length >= room.players.length) {
      filteredDeck = matched;
    }
  }

  const shuffledDeck = [...filteredDeck];
  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
  }

  room.players.forEach((player, idx) => {
    const cardData = shuffledDeck[idx % shuffledDeck.length];
    player.assignedCard = {
      name: cardData.name,
      tag: cardData.tag || 'Shinobi',
      hint: cardData.hint || '',
      level: cardData.level || 1,
      image: cardData.image || null
    };
    player.isGuessed = false;
    player.finishRank = null;
    player.notes = '';
  });
  room.currentTurnIndex = 0;
  room.status = 'PLAYING';
}
