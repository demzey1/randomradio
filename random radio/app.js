const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

// MOCK DATABASE (Stored in your RAM for this preview)
let mockSongs = [
  { 
    title: "Example Chill Beat", 
    uploader: "BMAD_Bot", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
  }
];

// API: Save Song
app.post('/api/songs', (req, res) => {
  mockSongs.push(req.body);
  res.json({ success: true });
});

// API: Get Random Song
app.get('/api/random', (req, res) => {
  if (mockSongs.length === 0) {
    return res.status(404).json({ error: 'No songs found' });
  }
  const randomSong = mockSongs[Math.floor(Math.random() * mockSongs.length)];
  res.json(randomSong);
});

// THE UI (HTML)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Live Preview</title>
      <style>
        body { font-family: sans-serif; background: #121212; color: white; display: flex; justify-content: center; padding: 50px; }
        .player { background: #1e1e1e; padding: 30px; border-radius: 20px; width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .btn { background: #1DB954; color: white; border: none; padding: 15px; border-radius: 30px; width: 100%; cursor: pointer; font-weight: bold; margin-top: 20px; }
        input { width: 100%; padding: 10px; margin: 10px 0; border-radius: 5px; border: none; }
        audio { width: 100%; margin: 20px 0; }
        .upload-section { margin-top: 40px; border-top: 1px solid #333; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="player">
        <h1 style="color: #1DB954">Radio Random</h1>
        <div id="display">
          <h2 id="t">Loading...</h2>
          <p id="u"></p>
        </div>
        <audio id="player" controls></audio>
        <button class="btn" onclick="next()">NEXT RANDOM SONG</button>

        <div class="upload-section">
          <h3>Upload Simulation</h3>
          <input id="title" placeholder="Song Title">
          <input id="name" placeholder="Artist Name">
          <p style="font-size: 12px; color: #888;">(File upload simulated for preview)</p>
          <button class="btn" style="background: #555" onclick="upload()">UPLOAD TRACK</button>
        </div>
      </div>

      <script>
        async function next() {
          const res = await fetch('/api/random');
          const song = await res.json();
          document.getElementById('t').innerText = song.title;
          document.getElementById('u').innerText = "By: " + song.uploader;
          document.getElementById('player').src = song.audioUrl;
          document.getElementById('player').play();
        }

        async function upload() {
          const title = document.getElementById('title').value;
          const uploader = document.getElementById('name').value;
          if (!title || !uploader) {
            alert("Please fill in all fields!");
            return;
          }
          await fetch('/api/songs', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ title, uploader, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' })
          });
          document.getElementById('title').value = '';
          document.getElementById('name').value = '';
          alert("Song added to temporary list!");
        }
        next();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`View Live here: http://localhost:${PORT}`));
