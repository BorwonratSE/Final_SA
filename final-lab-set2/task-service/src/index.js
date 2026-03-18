require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { pool } = require('./db/db');
const tasksRouter = require('./routes/tasks');

// ฟังก์ชันส่ง Activity แบบ Fire-and-forget (Inter-service Communication)
const logActivity = async (userId, username, action) => {
  try {
    const body = JSON.stringify({ userId, username, action });
    // ยิงไปที่ Service ของเพื่อน (พอร์ต 3003) แบบไม่ต้องรอคำตอบ (Fire-and-forget)
    fetch('http://activity-service:3003/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    }).catch(err => console.log("[Activity Log Error] - อาจเป็นเพราะ Service เพื่อนยังไม่รัน"));
  } catch (e) {
    // ปล่อยผ่านเพื่อให้งานหลัก (Task) ยังทำงานได้ปกติแม้ Log จะพัง
  }
};

// ส่งฟังก์ชันนี้ไปให้ไฟล์อื่นเรียกใช้ได้
app.set('logActivity', logActivity);
// -----------------------------------------------------------------------

const app  = express();
const PORT = process.env.PORT || 3002;

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