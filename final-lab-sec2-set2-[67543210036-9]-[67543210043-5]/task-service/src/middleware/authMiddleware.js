const { verifyToken } = require('./jwtUtils');

module.exports = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = verifyToken(token); // เรียกใช้จาก jwtUtils
    next();
  } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
};