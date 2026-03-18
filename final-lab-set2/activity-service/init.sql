CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    username VARCHAR(50) NOT NULL, -- เก็บชื่อผู้ใช้ไว้เลย (Denormalization) เพื่อโชว์ในหน้า Timeline
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    summary TEXT,
    meta JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);