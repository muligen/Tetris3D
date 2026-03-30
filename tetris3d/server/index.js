import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, 'leaderboard.json');
const MAX_ENTRIES = 10;

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from ../dist (production build)
app.use(express.static(join(__dirname, '..', 'dist')));

function readData() {
  if (!existsSync(DATA_FILE)) {
    return { classic: [], challenge: [], marathon: [] };
  }
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { classic: [], challenge: [], marathon: [] };
  }
}

function writeData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/leaderboard?mode=classic
app.get('/api/leaderboard', (req, res) => {
  const mode = req.query.mode || 'classic';
  const data = readData();
  const entries = data[mode] || [];
  res.json(entries);
});

// GET /api/leaderboard/all
app.get('/api/leaderboard/all', (req, res) => {
  const data = readData();
  res.json(data);
});

// POST /api/leaderboard
app.post('/api/leaderboard', (req, res) => {
  const { name, score, level, lines, mode } = req.body;

  if (!name || typeof score !== 'number' || !mode) {
    return res.status(400).json({ error: 'name, score, mode are required' });
  }

  const data = readData();
  const entries = data[mode] || [];

  const newEntry = {
    rank: 0,
    name: name.slice(0, 20), // 限制名字长度
    score,
    level: level || 0,
    lines: lines || 0,
    mode,
    date: new Date().toISOString(),
  };

  entries.push(newEntry);
  entries.sort((a, b) => b.score - a.score);

  // 只保留前10名
  if (entries.length > MAX_ENTRIES) {
    entries.splice(MAX_ENTRIES);
  }

  // 更新排名
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  data[mode] = entries;
  writeData(data);

  // 返回该条目的排名（如果上榜了）
  const saved = entries.find(e => e.date === newEntry.date && e.name === newEntry.name);
  res.json(saved || null);
});

// SPA fallback - 所有非 API 请求返回 index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
