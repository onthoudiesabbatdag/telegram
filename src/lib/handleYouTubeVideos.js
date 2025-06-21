import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

const result = {
  videos: [],
  shorts: [],
  playlists: []
};

function parseDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  const minutes = parseInt(match?.[1] || '0');
  const seconds = parseInt(match?.[2] || '0');
  return minutes * 60 + seconds;
}

async function fetchPaginatedResults(baseUrl) {
  let allItems = [];
  let nextPageToken = '';

  do {
    const url = `${baseUrl}&pageToken=${nextPageToken}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
    const data = await res.json();
    allItems = allItems.concat(data.items || []);
    nextPageToken = data.nextPageToken || '';
  } while (nextPageToken);

  return allItems;
}

async function fetchPlaylists() {
  const baseUrl = `https://www.googleapis.com/youtube/v3/playlists?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&maxResults=50`;
  const items = await fetchPaginatedResults(baseUrl);

  items.forEach(item => {
    result.playlists.push({
      title: item.snippet.title,
      link: `https://www.youtube.com/playlist?list=${item.id}`
    });
  });
}

async function fetchVideosAndShorts() {
  const baseUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=50`;
  const items = await fetchPaginatedResults(baseUrl);

  const videoIds = items
    .filter(item => item.id.videoId)
    .map(item => item.id.videoId);

  // Batch in chunks of 50
  for (let i = 0; i < videoIds.length; i += 50) {
    const batchIds = videoIds.slice(i, i + 50).join(',');
    const url = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${batchIds}&part=snippet,contentDetails`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch video details: ${res.statusText}`);
    const data = await res.json();

    data.items?.forEach(video => {
      const title = video.snippet.title;
      const videoId = video.id;
      const duration = parseDuration(video.contentDetails.duration);
      const videoObj = {
        title,
        link: duration <= 60
          ? `https://www.youtube.com/shorts/${videoId}`
          : `https://www.youtube.com/watch?v=${videoId}`
      };

      if (duration <= 60) {
        result.shorts.push(videoObj);
      } else {
        result.videos.push(videoObj);
      }
    });
  }
}

export default async function handleYouTubeVideos() {
  try {
    await fetchPlaylists();
    await fetchVideosAndShorts();

    const outputDir = path.join(__dirname, '../videos');
    const outputFile = path.join(outputDir, 'youTubeVideoList.json');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    function dedupe(arr) {
      const seen = new Set();
      return arr.filter(item => {
        const key = `${item.title}|${item.link}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

result.videos = dedupe(result.videos);
result.shorts = dedupe(result.shorts);
result.playlists = dedupe(result.playlists);

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`✅ Saved to ${outputFile}`);
  } catch (err) {
    console.error('❌ Error during processing:', err.message);
  }
}
