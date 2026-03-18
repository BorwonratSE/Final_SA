CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    user_id INTEGER NOT NULL, -- เก็บ ID ผู้ใช้ไว้สำหรับอ้างอิงเท่านั้น (ไม่มี Foreign Key ข้าม DB)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);