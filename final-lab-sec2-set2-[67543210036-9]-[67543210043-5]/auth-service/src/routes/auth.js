const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Fire-and-forget helper
async function logActivity({ userId, username, eventType, entityType, entityId, summary, meta }) {
  const ACTIVITY_URL = process.env.ACTIVITY_SERVICE_URL || 'http://activity-service:3003';
  fetch(`${ACTIVITY_URL}/api/activity/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId, username, event_type: eventType,
      entity_type: entityType, entity_id: entityId,
      summary, meta
    })
  }).catch(() => console.warn('[auth] activity-service unreachable'));
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role',
      [username, email.toLowerCase(), hash]
    );
    const user = result.rows[0];

    logActivity({
      userId: user.id, username: user.username,
      eventType: 'USER_REGISTERED', entityType: 'user', entityId: user.id,
      summary: `${user.username} สมัครสมาชิกใหม่`
    });

    res.status(201).json({ message: 'Success', user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid' });
    
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid' });

    const token = jwt.sign({ sub: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET);
    
    logActivity({
      userId: user.id, username: user.username,
      eventType: 'USER_LOGIN', entityType: 'user', entityId: user.id,
      summary: `${user.username} เข้าสู่ระบบ`
    });

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;