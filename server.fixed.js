// This file is intentionally left as an inert placeholder.
// The active server implementation is in `server.js`.
// You may safely delete this file from the project root.

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const q = await db.collection('users').where('username', '==', username).limit(1).get();
    if (!q.empty) return res.status(409).json({ error: 'username exists' });
    const hash = await bcrypt.hash(password, 10);
    await db.collection('users').add({ username, passwordHash: hash, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const q = await db.collection('users').where('username', '==', username).limit(1).get();
    if (q.empty) return res.status(401).json({ error: 'invalid creds' });
    const doc = q.docs[0];
    const data = doc.data();
    const ok = await bcrypt.compare(password, data.passwordHash || '');
    if (!ok) return res.status(401).json({ error: 'invalid creds' });
    const token = jwt.sign({ uid: doc.id, username }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Create song metadata (protected)
app.post('/api/songs', authMiddleware, async (req, res) => {
  try {
    const { title, audioUrl } = req.body;
    if (!title || !audioUrl) return res.status(400).json({ error: 'title and audioUrl required' });
    const uploader = req.user && req.user.username ? req.user.username : 'anonymous';
    const doc = await db.collection('songs').add({ title, audioUrl, uploader, createdAt: admin.firestore.FieldValue.serverTimestamp(), randomIndex: Math.random() });
    return res.status(201).json({ id: doc.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Public list (exhibition)
app.get('/api/songs', async (req, res) => {
  try {
    let limit = parseInt(req.query.limit || '20', 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    const q = await db.collection('songs').orderBy('createdAt', 'desc').limit(limit).get();
    const items = q.docs.map(d => ({ id: d.id, ...(d.data()) }));
    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Random song
app.get('/api/random', async (req, res) => {
  try {
    const r = Math.random();
    let q = await db.collection('songs').where('randomIndex', '>=', r).limit(1).get();
    if (q.empty) q = await db.collection('songs').where('randomIndex', '<', r).limit(1).get();
    if (q.empty) return res.status(404).json({ error: 'no songs' });
    const d = q.docs[0].data();
    return res.json({ id: q.docs[0].id, ...d });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Serve static frontend file (index.html must exist in project root)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// start server
app.listen(PORT, () => {
  console.log('------------------------------------------------');
  console.log(`🚀 Radio App running at http://localhost:${PORT}`);
  console.log('------------------------------------------------');
});
