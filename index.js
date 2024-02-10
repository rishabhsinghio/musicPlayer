const express = require('express');
const ytdl = require('ytdl-core');
const app = express();
const path = require('path');
const search = require('yt-search');

const PORT = 3000;

app.get('/playMP3', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).send('Missing video URL parameter');
  }

  try {
    // Get video info
    const videoInfo = await ytdl.getInfo(videoUrl);

    // Choose the highest quality audio format
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, { quality: 'highestaudio' });

    // Check if audioFormat is undefined
    if (!audioFormat) {
      return res.status(400).send('No available audio formats');
    }

    // Set response header for streaming
    res.header('Content-Type', 'audio/mpeg');

    // Stream the audio directly to the response
    ytdl(videoUrl, { format: audioFormat })
      .pipe(res);
  } catch (error) {
    console.error('Error streaming MP3:', error.message);
    res.status(500).send('Internal Server Error');
  }
});
let currentValue = '';

app.use(express.static('public'));
app.use(express.json()); // Parse JSON data

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/main.html'));
});

app.post('/update', async (req, res) => {
  const { value } = req.body;

  if (!value) {
    return res.status(400).json({ message: 'Missing value parameter' });
  }

  currentValue = value;

  try {
    // Fetch the first video link
    const url = await fetchFirstVideoLink();

    if (url) {
      const videoInfo = await getVideoInfo(url);
      console.log('Video Information:', videoInfo);
      res.json({ message: 'Form submitted successfully!', videoInfo });
    } else {
      console.log('Failed to fetch video link.');
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } catch (error) {
    console.error('Error processing request:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
async function fetchFirstVideoLink() {
  try {
    const result = await search(currentValue);

    if (result.videos.length === 0) {
      console.log('No videos found for the given search term.');
      return null;
    }

    const firstVideo = result.videos[0];
    return firstVideo.url;
  } catch (error) {
    console.error('Error fetching video:', error.message);
    return null;
  }
}
// ... (your existing code)

async function getVideoInfo(videoUrl) {
  try {
    const videoInfo = await ytdl.getInfo(videoUrl);

    // Choose a higher quality thumbnail
    const thumbnail = videoInfo.videoDetails.thumbnails[videoInfo.videoDetails.thumbnails.length - 1].url;

    return {
      title: videoInfo.videoDetails.title,
      author: videoInfo.videoDetails.author.name,
      thumbnail: thumbnail,
      audioUrl: `https://62bedea9-ad89-47e3-bc52-2a4ec341c8c7-00-1f2fcehxk8v8g.riker.replit.dev/playMP3?url=${videoUrl}`,
    };
  } catch (error) {
    console.error('Error fetching video information:', error.message);
    throw error;
  }
}


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

