const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const auth = require('../middleware/authMiddleware');

async function logToDB({ level, event, userId, message, meta }) {
  try {
    await pool.query(
      `INSERT INTO logs (level, event, user_id, message, meta) VALUES ($1,$2,$3,$4,$5)`,
      [level, event, userId || null, message || null, meta ? JSON.stringify(meta) : null]
    );
  } catch (e) { console.error('[task-log]', e.message); }
}

async function logActivity({ userId, username, eventType, entityId, summary, meta }) {
  const ACTIVITY_URL = process.env.ACTIVITY_SERVICE_URL || 'http://activity-service:3003';
  fetch(`${ACTIVITY_URL}/api/activity/internal`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, username, event_type: eventType, entity_type: 'task', entity_id: entityId || null, summary, meta: meta || null })
  }).catch(() => console.warn('[task] activity-service unreachable'));
}

// GET all tasks for user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [req.user.sub]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

// CREATE task
router.post('/', auth, async (req, res) => {
  const { title, description, priority } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, priority) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.sub, title, description || '', priority || 'medium']
    );
    const task = result.rows[0];

    await logToDB({ level: 'INFO', event: 'TASK_CREATED', userId: req.user.sub, message: `Created task ${task.id}` });
    logActivity({ userId: req.user.sub, username: req.user.username, eventType: 'TASK_CREATED', entityId: task.id, summary: `${req.user.username} สร้าง task "${title}"`, meta: { task_id: task.id, title, priority } });

    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// UPDATE task
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority } = req.body;
  try {
    const check = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.sub]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const oldStatus = check.rows[0].status;
    const result = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, status=$3, priority=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [title || check.rows[0].title, description || check.rows[0].description, status || oldStatus, priority || check.rows[0].priority, id]
    );
    
    if (status && status !== oldStatus) {
      logActivity({ userId: req.user.sub, username: req.user.username, eventType: 'TASK_STATUS_CHANGED', entityId: parseInt(id), summary: `${req.user.username} เปลี่ยนสถานะ task #${id} เป็น ${status}`, meta: { task_id: parseInt(id), old_status: oldStatus, new_status: status } });
    }
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE task
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.sub]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    logActivity({ userId: req.user.sub, username: req.user.username, eventType: 'TASK_DELETED', entityId: parseInt(id), summary: `${req.user.username} ลบ task #${id}`, meta: { task_id: parseInt(id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;