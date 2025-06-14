import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../subscribers/whiteList.json');
console.log("jsonPath in whiteListLoader:", jsonPath)

if (!fs.existsSync(jsonPath)) {
  fs.writeFileSync(jsonPath, JSON.stringify([], null, 2), 'utf8');
  console.log('📁 Created whiteList.json with empty array');
}

let whiteList = [];

try {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  whiteList = JSON.parse(raw);
  console.log('Loaded whiteList from JSON:', whiteList);
} catch (err) {
  console.error('Failed to load whiteList.json:', err.message);
}

export default whiteList;
