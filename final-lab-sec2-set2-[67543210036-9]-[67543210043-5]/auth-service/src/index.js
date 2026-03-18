require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// เชื่อมต่อ Routes
app.use('/api/auth', authRoutes);

// Health Check สำหรับ Railway
app.get('/api/auth/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});