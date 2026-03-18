const { generateToken } = require('../middleware/jwtUtils');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function logToDB({ level, event, userId, ip, message, meta }) {
  try {
    await pool.query(
      `INSERT INTO logs (level, event, user_id, ip_address, message, meta) VALUES ($1,$2,$3,$4,$5,$6)`,
      [level, event, userId || null, ip || null, message || null, meta ? JSON.stringify(meta) : null]
    );
  } catch (e) { console.error('[auth-log]', e.message); }
}

async function logActivity({ userId, username, eventType, entityType, entityId, summary, meta }) {
  const ACTIVITY_URL = process.env.ACTIVITY_SERVICE_URL || 'http://activity-service:3003';
  fetch(`${ACTIVITY_URL}/api/activity/internal`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, username, event_type: eventType, entity_type: entityType || null, entity_id: entityId || null, summary, meta: meta || null })
  }).catch(() => console.warn('[auth] activity-service unreachable'));
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.ip;
  if (!username || !email || !password) return res.status(400).json({ error: 'required' });
  if (password.length < 6) return res.status(400).json({ error: 'password >= 6 chars' });

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email.toLowerCase().trim(), username.trim()]);
    if (exists.rows.length > 0) return res.status(409).json({ error: 'Email or Username exists' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role) VALUES ($1,$2,$3,'member') RETURNING id, username, email, role, created_at`,
      [username.trim(), email.toLowerCase().trim(), hash]
    );
    const user = result.rows[0];

    await logToDB({ level: 'INFO', event: 'REGISTER_SUCCESS', userId: user.id, ip, message: `New user: ${user.username}` });
    logActivity({ userId: user.id, username: user.username, eventType: 'USER_REGISTERED', entityType: 'user', entityId: user.id, summary: `${user.username} สมัครสมาชิกใหม่` });
    res.status(201).json({ message: 'Success', user });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid' });
    
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid' });

    const token = generateToken({ sub: user.id, username: user.username, email: user.email, role: user.role });
    
    logActivity({ userId: user.id, username: user.username, eventType: 'USER_LOGIN', entityType: 'user', entityId: user.id, summary: `${user.username} เข้าสู่ระบบ` });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/verify', (req, res) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.json({ valid: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch { res.json({ valid: false }); }
});

module.exports = router;