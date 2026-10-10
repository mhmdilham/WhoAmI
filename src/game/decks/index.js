import narutoDeck from './naruto.json';

export function getAvailableDecks() {
  return [
    {
      id: 'naruto',
      name: 'Naruto Shippuden 🍥',
      description: '120+ karakter ninja canon, Kage, Akatsuki, Bijuu, Sannin, dan legenda shinobi',
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
