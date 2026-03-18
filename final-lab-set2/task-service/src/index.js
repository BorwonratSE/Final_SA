require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { pool } = require('./db/db');
const tasksRouter = require('./routes/tasks');

// 1. ต้องสร้าง app ก่อนบรรทัดอื่นๆ!
const app  = express(); 
const PORT = process.env.PORT || 3002;

// 2. ฟังก์ชัน logActivity วางตรงนี้
const logActivity = async (userId, username, action) => {
  try {
    const body = JSON.stringify({ userId, username, action });
    fetch('http://activity-service:3003/api/activity/internal', { // แก้ URL ให้ตรงตาม API ที่เราสร้าง
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    }).catch(err => console.log("[Activity Log Error]"));
  } catch (e) {}
};

// 3. เรียกใช้ app.set หลังจากที่มีการประกาศ const app ไปแล้ว
app.set('logActivity', logActivity); 

// ส่วนที่เหลือเหมือนเดิมครับ
app.use(cors());
app.use(express.json());
app.use('/api/tasks', tasksRouter);

async function start() {
  let retries = 10;
  while (retries > 0) {
    try { await pool.query('SELECT 1'); break; }
    catch (e) {
      console.log(`[task] Waiting DB... (${retries} left)`);
      retries--;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, () => console.log(`[task-service] Running on :${PORT}`));
}
start();