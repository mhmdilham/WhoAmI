import narutoDeck from './naruto.json';

export function getAvailableDecks() {
  return [
    {
      id: 'naruto',
      name: 'Naruto Shippuden 🍥',
      description: '55+ karakter ninja, Kage, Akatsuki, Sannin, dan legenda shinobi',
      count: narutoDeck.length
    }
  ];
}

export function loadDeck(deckId) {
  if (deckId === 'naruto') {
    return narutoDeck;
  }
  return narutoDeck;
}
