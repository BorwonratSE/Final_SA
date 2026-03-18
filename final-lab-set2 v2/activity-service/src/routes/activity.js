const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Middleware ตรวจสอบ Token ──
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    // ใช้ JWT_SECRET จาก environment variable
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── GET /api/activity/me ──
// ดึงกิจกรรมที่เกิดขึ้นโดย user คนที่กำลัง login
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM activities WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id] // ใช้ id จาก token ที่ถอดรหัสแล้ว
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('[getActivitiesMe]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/activity/internal ──
// สำหรับรับข้อมูลจาก service อื่น (เช่น Task Service)
router.post('/internal', async (req, res) => {
  const { service, event_type, user_id, entity_type, entity_id, metadata } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO activities (service, event_type, user_id, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [service, event_type, user_id, entity_type, entity_id, metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;