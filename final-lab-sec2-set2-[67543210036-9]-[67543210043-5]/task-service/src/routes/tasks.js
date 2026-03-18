// เพิ่ม Helper นี้ไว้ด้านบนไฟล์
async function logActivity({ userId, username, eventType, entityId, summary, meta }) {
  const ACTIVITY_URL = process.env.ACTIVITY_SERVICE_URL || 'http://activity-service:3003';
  fetch(`${ACTIVITY_URL}/api/activity/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId, username, event_type: eventType,
      entity_type: 'task', entity_id: entityId,
      summary, meta
    })
  }).catch(() => {}); // fire-and-forget
}

// ในส่วน POST /
// หลังจากบันทึก Task ลง DB สำเร็จ ให้เรียก:
logActivity({
  userId: req.user.sub, username: req.user.username,
  eventType: 'TASK_CREATED', entityId: newTask.id,
  summary: `${req.user.username} สร้างงานใหม่: ${title}`
});