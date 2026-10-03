import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getAvailableDecks() {
  return [
    {
      id: 'naruto',
      name: 'Naruto Shippuden 🍥',
      description: '55+ karakter ninja, Kage, Akatsuki, Sannin, dan legenda shinobi',
      count: 55
    }
  ];
}

export function loadDeck(deckId) {
  const filePath = path.join(__dirname, `${deckId}.json`);
  if (!fs.existsSync(filePath)) {
    // Default fallback to naruto if deck not found
    const fallbackPath = path.join(__dirname, 'naruto.json');
    return JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
