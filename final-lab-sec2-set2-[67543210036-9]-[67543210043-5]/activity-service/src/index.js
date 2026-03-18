require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try { req.user = jwt.verify(token, JWT_SECRET); next(); } catch { res.sendStatus(401); }
};

app.post('/api/activity/internal', async (req, res) => {
  const { user_id, username, event_type, summary, meta } = req.body;
  await pool.query(
    'INSERT INTO activities (user_id, username, event_type, summary, meta) VALUES ($1,$2,$3,$4,$5)',
    [user_id, username, event_type, summary, meta]
  );
  res.status(201).json({ ok: true });
});

app.get('/api/activity/me', authenticate, async (req, res) => {
  const result = await pool.query('SELECT * FROM activities WHERE user_id = $1 ORDER BY created_at DESC', [req.user.sub]);
  res.json({ activities: result.rows });
});

app.listen(3003, () => console.log('Activity Service running on 3003'));