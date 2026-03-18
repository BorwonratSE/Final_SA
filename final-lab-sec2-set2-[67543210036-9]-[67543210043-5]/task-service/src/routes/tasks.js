const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const auth = require('../middleware/authMiddleware'); // ใช้ตัวเดิมจาก Set 1

// ── Helper: บันทึก log ลง task-db (ภายใน service ตัวเอง) ────────────────
async function logToDB({ level, event, userId, message, meta }) {
  try {
    await pool.query(
      `INSERT INTO logs (level, event, user_id, message, meta) VALUES ($1,$2,$3,$4,$5)`,
      [level, event, userId || null, message || null,
       meta ? JSON.stringify(meta) : null]
    );
  } catch (e) { console.error('[task-log]', e.message); }
}

// ── Helper: ส่ง activity event ไปหา Activity Service (fire-and-forget) ──
// Pattern นี้ทำให้ถ้า Activity Service ล่ม Task Service ยังทำงานต่อได้
async function logActivity({ userId, username, eventType, entityId, summary, meta }) {
  const ACTIVITY_URL = process.env.ACTIVITY_SERVICE_URL || 'http://activity-service:3003';
  
  fetch(`${ACTIVITY_URL}/api/activity/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId, 
      username, 
      event_type: eventType,
      entity_type: 'task', 
      entity_id: entityId || null,
      summary, 
      meta: meta || null
    })
  }).catch(() => {
    // ถ้าล่ม ให้แสดงแค่ warning แต่ไม่หยุดการทำงาน (Graceful Degradation)
    console.warn('[task] activity-service unreachable — skipping event log');
  });
}

// ── GET /api/tasks (ดูรายการ Task ทั้งหมด) ──────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── POST /api/tasks (สร้าง Task ใหม่) ──────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { title, description, priority } = req.body;
  const userId = req.user.sub;
  const username = req.user.username;

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, priority) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, title, description, priority || 'medium']
    );
    const task = result.rows[0];

    // บันทึกลง Log ของตัวเอง
    await logToDB({ level: 'INFO', event: 'TASK_CREATED', userId, message: `Task "${title}" created` });

    // ส่ง Event ไป Activity Service (Fire-and-forget)
    logActivity({
      userId, username,
      eventType: 'TASK_CREATED', 
      entityId: task.id,
      summary: `${username} สร้าง task "${title}"`,
      meta: { task_id: task.id, title, priority }
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/tasks/:id (แก้ไข Task / เปลี่ยนสถานะ) ──────────────────────
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority } = req.body;
  const userId = req.user.sub;
  const username = req.user.username;

  try {
    const check = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const oldStatus = check.rows[0].status;

    const result = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, status=$3, priority=$4, updated_at=NOW() 
       WHERE id=$5 RETURNING *`,
      [title || check.rows[0].title, description || check.rows[0].description, 
       status || check.rows[0].status, priority || check.rows[0].priority, id]
    );
    
    const updatedTask = result.rows[0];

    // ถ้ามีการเปลี่ยนสถานะ ให้ส่ง activity event
    if (status && status !== oldStatus) {
      logActivity({
        userId, username,
        eventType: 'TASK_STATUS_CHANGED', 
        entityId: parseInt(id),
        summary: `${username} เปลี่ยนสถานะ task #${id} เป็น ${status}`,
        meta: { task_id: parseInt(id), old_status: oldStatus, new_status: status }
      });
    }

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/tasks/:id (ลบ Task) ────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;
  const username = req.user.username;

  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    // ส่ง Event ไป Activity Service
    logActivity({
      userId, username,
      eventType: 'TASK_DELETED', 
      entityId: parseInt(id),
      summary: `${username} ลบ task #${id}`,
      meta: { task_id: parseInt(id) }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;