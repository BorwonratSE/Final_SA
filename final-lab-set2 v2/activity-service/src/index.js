const express = require('express');
const app     = express();

app.use(express.json());

// ✅ แก้ไขให้ตรงกับที่เรียก: ใช้ /api/activity (ไม่มี s)
app.use('/api/activity', require('./routes/activity'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`activity-service running on port ${PORT}`));