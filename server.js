// Clean server implementation
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'demas-c0d1d-firebase-adminsdk-fbsvc-21ce59eb28.json');

// Initialize firebase-admin. Accept either a local service account file or
// a JSON string passed via the FIREBASE_SA environment variable.
async function initFirebase() {
  try {
    if (process.env.FIREBASE_SA) {
      try {
        const sa = JSON.parse(process.env.FIREBASE_SA);
        admin.initializeApp({ credential: admin.credential.cert(sa) });
        console.log('✓ Firebase admin initialized from env FIREBASE_SA');
        return;
      } catch (parseErr) {
        console.error('✗ FIREBASE_SA JSON parse failed:', parseErr.message);
        throw parseErr;
      }
    }
  } catch (e) {
    console.warn('FIREBASE_SA env var not usable, trying local file...');
  }

  try {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('✓ Firebase admin initialized from local service account file');
  } catch (err) {
    console.error('✗ Firebase admin init failed:', err.message);
    console.warn('Attempting fallback initialization...');
    try { admin.initializeApp(); } catch (e) { console.error('Fallback also failed:', e.message); }
  }
}

initFirebase();

let db = null;
try { db = admin.firestore ? admin.firestore() : null; } catch (e) { 
  console.error('Firestore instance creation failed:', e.message);
  db = null; 
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const JWT_SECRET = process.env.RR_JWT_SECRET || 'dev-secret-change-me';

// Serve static files (index.html) from project root
app.use(express.static(__dirname));

function makeToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' });
}

async function findUser(username) {
  if (!db) return null;
  const q = await db.collection('users').doc(username).get();
  return q.exists ? q.data() : null;
}

app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (typeof username !== 'string' || username.trim().length === 0) return res.status(400).json({ error: 'invalid username' });
  const uname = username.trim();
  try {
    if (!db) return res.status(500).json({ error: 'database not initialized' });
    const userDoc = db.collection('users').doc(uname);
    const snap = await userDoc.get();
    if (snap.exists) return res.status(409).json({ error: 'username taken' });
    const hash = await bcrypt.hash(password, 10);
    await userDoc.set({ passwordHash: hash, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.status(201).json({ ok: true });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'server error' }); }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    if (!db) return res.status(500).json({ error: 'database not initialized' });
    const doc = await db.collection('users').doc(username).get();
    if (!doc.exists) return res.status(401).json({ error: 'invalid credentials' });
    const data = doc.data();
    const ok = await bcrypt.compare(password, data.passwordHash || '');
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = makeToken(username);
    return res.json({ token });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'server error' }); }
});

// Auth middleware
function authMiddleware(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'missing token' });
  try {
    const payload = jwt.verify(m[1], JWT_SECRET);
    req.user = payload.username;
    next();
  } catch (err) { return res.status(401).json({ error: 'invalid token' }); }
}

app.post('/api/songs', authMiddleware, async (req, res) => {
  const { title, audioUrl } = req.body || {};
  if (!title || !audioUrl) return res.status(400).json({ error: 'title and audioUrl required' });
  try {
    if (!db) return res.status(500).json({ error: 'database not initialized' });
    const docRef = db.collection('songs').doc();
    await docRef.set({ title, audioUrl, uploader: req.user, createdAt: admin.firestore.FieldValue.serverTimestamp(), randomIndex: Math.random() });
    return res.status(201).json({ ok: true });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'server error' }); }
});

app.get('/api/songs', async (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit || '20', 10) || 20);
  try {
    if (!db) return res.status(500).json({ error: 'database not initialized' });
    const snaps = await db.collection('songs').orderBy('createdAt', 'desc').limit(limit).get();
    const items = snaps.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
    return res.json(items);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'server error' }); }
});

app.get('/api/random', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'database not initialized' });
    const r = Math.random();
    let q = db.collection('songs').where('randomIndex', '>=', r).orderBy('randomIndex').limit(1);
    let snap = await q.get();
    if (snap.empty) {
      q = db.collection('songs').where('randomIndex', '<', r).orderBy('randomIndex').limit(1);
      snap = await q.get();
    }
    if (snap.empty) return res.status(404).json({ error: 'no songs' });
    const song = snap.docs[0].data();
    return res.json(song);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'server error' }); }
});

app.get('/health', (req, res) => res.json({ ok: true }));

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('------------------------------------------------');
  console.log(`🚀 Radio App running at http://localhost:${PORT}`);
  console.log('------------------------------------------------');
});