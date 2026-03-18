const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3003;

// เชื่อมต่อ Database-per-Service (ก้อนของตัวเอง)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(cors());
app.use(express.json());

// API สำหรับรับ Activity จาก Service อื่น (Inter-service Communication)
app.post('/api/activity/internal', async (req, res) => {
  const { user_id, username, event_type, entity_type, entity_id, summary, meta } = req.body;
  try {
    await pool.query(
      'INSERT INTO activities (user_id, username, event_type, entity_type, entity_id, summary, meta) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [user_id, username, event_type, entity_type, entity_id, summary, JSON.stringify(meta)]
    );
    res.status(201).json({ status: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// API สำหรับดึงไปโชว์ที่หน้า Timeline (Frontend)
app.get('/api/activity', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM activities ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`[activity-service] Running on port ${PORT}`);
});