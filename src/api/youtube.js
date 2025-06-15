

import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

async function listVideos() {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=10`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items) {
      data.items.forEach(item => {
        if (item.id.videoId) {
          console.log(`https://www.youtube.com/watch?v=${item.id.videoId}`);
        }
      });
    } else {
      console.error("No video items found:", data);
    }
  } catch (err) {
    console.error("Error fetching videos:", err);
  }
}
function parseDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  const minutes = parseInt(match?.[1] || '0');
  const seconds = parseInt(match?.[2] || '0');
  return minutes * 60 + seconds;
}

async function listPlaylists() {
  const url = `https://www.googleapis.com/youtube/v3/playlists?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&maxResults=25`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.items) {
    console.log('\n📂 Playlists:\n');
    data.items.forEach(item => {
      console.log(`${item.snippet.title}\n  https://www.youtube.com/playlist?list=${item.id}\n`);
    });
  } else {
    console.log('No playlists found.');
  }
}

async function listShorts() {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=25`;
  const res = await fetch(searchUrl);
  const data = await res.json();

  const shorts = [];

  for (const item of data.items) {
    if (item.id.videoId) {
      const videoId = item.id.videoId;
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoId}&part=snippet,contentDetails`;
      const detailRes = await fetch(detailsUrl);
      const detailData = await detailRes.json();
      const video = detailData.items?.[0];

      if (video) {
        const duration = parseDuration(video.contentDetails.duration);
        const title = video.snippet.title;

        if (duration <= 60) {
          shorts.push({
            title,
            url: `https://www.youtube.com/shorts/${videoId}`
          });
        }
      }
    }
  }

  console.log('\n🎬 Shorts:\n');
  shorts.forEach(s => {
    console.log(`${s.title}\n  ${s.url}\n`);
  });
}

(async () => {
  await listPlaylists();
  await listShorts();
})();





export {listVideos, listPlaylists, listShorts}