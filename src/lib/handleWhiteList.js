

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('__dirname:', __dirname);

const jsonPath = path.join(__dirname, '..', 'subscribers', 'whiteList.json');
console.log('jsonPath:', jsonPath);

export async function loadWhiteList() {
  try {
    const raw = await fs.promises.readFile(jsonPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to reload whiteList.json:', err);
    return [];
  }
}

export async function saveWhiteList(list) {
  try {
    await fs.promises.writeFile(jsonPath, JSON.stringify(list, null, 2), 'utf8');
    console.log('✅ Updated whiteList.json');
  } catch (err) {
    console.error('❌ Failed to write whiteList.json:', err);
  }
}
