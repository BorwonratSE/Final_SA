const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// ฟังก์ชันสำหรับสร้าง Token (ใช้ใน Auth Service)
function generateToken(payload) {
  // ตาม docker-compose อาจารย์ตั้งให้หมดอายุใน 1h
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); 
}

// ฟังก์ชันสำหรับตรวจ Token (ใช้ใน Task Service)
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };