import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public', 'characters');
const DECK_PATH_SRC = path.resolve('src', 'game', 'decks', 'naruto.json');
const DECK_PATH_SERVER = path.resolve('server', 'decks', 'naruto.json');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const normalize = (str) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const customOverrides = {
  'kurama (kyubi)': 'https://static.wikia.nocookie.net/naruto/images/7/7b/Kurama2.png/revision/latest/scale-to-width-down/250?cb=20140818171718',
  'chiyo (nenek chiyo)': 'https://static.wikia.nocookie.net/naruto/images/7/73/Chiyo.png/revision/latest/scale-to-width-down/250?cb=20160113171702',
  'pain / nagato': 'nagato',
  'zetsu hitam & putih': 'black zetsu',
  'kiba inuzuka & akamaru': 'kiba inuzuka',
  'kinkaku & ginkaku': 'kinkaku',
  'danzo shimura': 'danzo shimura',
  'hiashi hyuga': 'hiashi hyuga',
  'hizashi hyuga': 'hizashi hyuga',
  'ebizo': 'ebizo'
};

async function downloadImage(url, dest) {
  let res;
  // If wikia URL and doesn't have scale parameter, append scale-to-width-down/250
  let targetUrl = url;
  if (url.includes('static.wikia.nocookie.net') && !url.includes('scale-to-width-down')) {
    targetUrl = url.split('/revision/')[0] + '/revision/latest/scale-to-width-down/250';
  }

  try {
    res = await fetch(targetUrl);
    if (!res.ok) {
      // Fallback to original url
      res = await fetch(url);
    }
  } catch (err) {
    res = await fetch(url);
  }

  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(arrayBuffer));
  return arrayBuffer.byteLength;
}

async function main() {
  console.log('Fetching Dattebayo characters database...');
  const res = await fetch(
    'https://raw.githubusercontent.com/viniciusschuelter/dattebayo-api/main/src/data/characters.json'
  );
  const apiChars = await res.json();

  const apiMap = new Map();
  apiChars.forEach((c) => {
    apiMap.set(normalize(c.name), c);
  });

  const deck = JSON.parse(fs.readFileSync(DECK_PATH_SRC, 'utf8'));
  console.log(`Processing ${deck.length} characters in deck...`);

  let totalBytes = 0;
  let successCount = 0;

  for (let i = 0; i < deck.length; i++) {
    const item = deck[i];
    const rawLower = item.name.toLowerCase().trim();
    let imgUrl = null;

    if (customOverrides[rawLower] && customOverrides[rawLower].startsWith('http')) {
      imgUrl = customOverrides[rawLower];
    } else {
      let lookupKey = normalize(customOverrides[rawLower] || item.name);
      let hit = apiMap.get(lookupKey);

      if (!hit) {
        const parts = item.name.split(/[\(\)\/&]/).map((s) => s.trim()).filter(Boolean);
        for (const p of parts) {
          hit = apiMap.get(normalize(p));
          if (hit) break;
        }
      }

      if (!hit) {
        for (const [k, v] of apiMap.entries()) {
          if (k.includes(lookupKey) || lookupKey.includes(k)) {
            hit = v;
            break;
          }
        }
      }

      if (hit && hit.images && hit.images.length > 0) {
        imgUrl = hit.images[0];
      }
    }

    if (!imgUrl) {
      console.warn(`[WARN] No image found for: ${item.name}`);
      continue;
    }

    const slug = slugify(item.name);
    const fileName = `${slug}.png`;
    const destPath = path.join(PUBLIC_DIR, fileName);

    try {
      const bytes = await downloadImage(imgUrl, destPath);
      totalBytes += bytes;
      successCount++;
      item.image = `/characters/${fileName}`;
      if ((i + 1) % 20 === 0 || i === deck.length - 1) {
        console.log(`[${i + 1}/${deck.length}] Processed: ${item.name} (${(bytes / 1024).toFixed(1)} KB)`);
      }
    } catch (err) {
      console.error(`Error downloading ${item.name}:`, err.message);
    }
  }

  console.log(`\nDownload complete!`);
  console.log(`Successfully saved ${successCount}/${deck.length} images.`);
  console.log(`Total download size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);

  // Write updated decks
  fs.writeFileSync(DECK_PATH_SRC, JSON.stringify(deck, null, 2), 'utf8');
  fs.writeFileSync(DECK_PATH_SERVER, JSON.stringify(deck, null, 2), 'utf8');
  console.log(`Updated naruto.json in src and server!`);
}

main().catch(console.error);
