

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

async function fetchPlaylists() {
  const url = `https://www.googleapis.com/youtube/v3/playlists?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&maxResults=50`;
  const res = await fetch(url);
  const data = await res.json();

  data.items?.forEach(item => {
    result.playlists.push({
      title: item.snippet.title,
      link: `https://www.youtube.com/playlist?list=${item.id}`
    });
  });
}

async function fetchVideosAndShorts() {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=50`;
  const res = await fetch(url);
  const data = await res.json();

  for (const item of data.items) {
    if (item.id.videoId) {
      const videoId = item.id.videoId;
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoId}&part=snippet,contentDetails`;
      const detailRes = await fetch(detailsUrl);
      const detailData = await detailRes.json();
      const video = detailData.items?.[0];

      if (video) {
        const title = video.snippet.title;
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
      }
    }
  }
}

export default async function handleYouTubeVideos() {
  await fetchPlaylists();
  await fetchVideosAndShorts();

  const outputDir = path.join(__dirname, '../videos');
  const outputFile = path.join(outputDir, 'youTubeVideoList.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  try{

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`Saved to ${outputFile}`);

  } catch (e){

    console.error(`Could  NOT save to ${outputFile}`);

  }
  
}

// run();

// export { fetchPlaylists, fetchVideosAndShorts }
