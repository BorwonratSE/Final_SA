const { Pool } = require('pg');

const pool = new Pool({
  // ใช้ DATABASE_URL จาก Environment Variable (หัวข้อ 3.7 และ 4)
  connectionString: process.env.DATABASE_URL || 'postgres://admin:secret123@auth-db:5432/authdb'
});

module.exports = pool;