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
  const difficulty = room.settings.difficulty || 'all';

  let filteredDeck = fullDeck;
  if (difficulty && difficulty !== 'all') {
    const levelMap = {
      genin: 1,
      chunin: 2,
      jonin: 3,
      kage: 4,
      1: 1,
      2: 2,
      3: 3,
      4: 4
    };
    const targetLevel = levelMap[difficulty];
    if (targetLevel) {
      const matched = fullDeck.filter(card => card.level === targetLevel);
      if (matched.length >= room.players.length) {
        filteredDeck = matched;
      }
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
      level: cardData.level || 1
    };
    player.isGuessed = false;
    player.finishRank = null;
    player.notes = '';
  });
  room.currentTurnIndex = 0;
  room.status = 'PLAYING';
}
