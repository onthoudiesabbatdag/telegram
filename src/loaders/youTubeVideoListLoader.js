

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../videos/youTubeVideoList.json');
// console.log("📄 Loading from:", jsonPath);

let videoList = [];
let shortsList = [];
let playList = [];

if (!fs.existsSync(jsonPath)) {
  console.error('❌ youTubeVideoList.json does not exist.');
} else {
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);

    // ✅ Proper nested arrays like [['Title', 'URL'], ...]
    videoList = Array.isArray(data.videos)
      ? data.videos.map(item => [item.title, item.link])
      : [];

    shortsList = Array.isArray(data.shorts)
      ? data.shorts.map(item => [item.title, item.link])
      : [];

    playList = Array.isArray(data.playlists)
      ? data.playlists.map(item => [item.title, item.link])
      : [];

    // console.log('✅ Parsed all lists as nested arrays');
  } catch (err) {
    console.error('❌ Failed to parse youTubeVideoList.json:', err.message);
  }
}

export { videoList, shortsList, playList };
