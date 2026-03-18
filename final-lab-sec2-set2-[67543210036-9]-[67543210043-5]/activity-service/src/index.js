require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-shared-secret';

app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware: ตรวจสอบ JWT
function requireAuth(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch (e) { res.status(401).json({ error: 'Invalid token' }); }
}

// Internal API: รับ Event (ไม่ต้องมี JWT เพราะเรียกภายใน network)
app.post('/api/activity/internal', async (req, res) => {
  const { user_id, username, event_type, entity_type, entity_id, summary, meta } = req.body;
  try {
    await pool.query(
      `INSERT INTO activities (user_id, username, event_type, entity_type, entity_id, summary, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [user_id, username, event_type, entity_type, entity_id, summary, meta ? JSON.stringify(meta) : null]
    );
    res.status(201).json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'DB error' }); }
});

// ดูกิจกรรมของตัวเอง
app.get('/api/activity/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM activities WHERE user_id = $1 ORDER BY created_at DESC', [req.user.sub]
    );
    res.json({ activities: result.rows });
  } catch (err) { res.status(500).json({ error: 'DB error' }); }
});

app.get('/api/activity/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// สร้าง Table อัตโนมัติถ้ายังไม่มี (ช่วยให้รันง่ายขึ้น)
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, username VARCHAR(50),
        event_type VARCHAR(50) NOT NULL, entity_type VARCHAR(20), entity_id INTEGER,
        summary TEXT, meta JSONB, created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    app.listen(PORT, () => console.log(`Activity Service on :${PORT}`));
  } catch (e) { console.error(e); setTimeout(initDB, 5000); }
}
initDB();