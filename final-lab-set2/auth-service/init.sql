CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed users สำหรับทดสอบ
INSERT INTO users (username, password, role) VALUES 
('alice', 'password123', 'member'),
('admin', 'admin123', 'admin')
ON CONFLICT (username) DO NOTHING;