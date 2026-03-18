const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-shared-secret';

module.exports = (req, res, next) => {
  // ดึง Token จาก Header "Authorization: Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' }); //
  }

  try {
    // ตรวจสอบความถูกต้องของ Token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // เก็บข้อมูล user ไว้ใน req เพื่อให้ routes อื่นๆ เอาไปใช้ต่อ (เช่น req.user.sub)
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' }); //
  }
};