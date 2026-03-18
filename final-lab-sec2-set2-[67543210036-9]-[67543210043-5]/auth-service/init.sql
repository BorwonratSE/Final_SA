CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(10) NOT NULL,
  event VARCHAR(100) NOT NULL,
  user_id INTEGER,
  ip_address VARCHAR(45),
  message TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (username, email, password_hash, role) VALUES
  ('admin', 'admin@lab.local', '$2b$10$ZFSu9jujm16MjmDzk3fIYO36TyW7tNXJl3MGQuDkWBoiaiNJ2iFca', 'admin')
ON CONFLICT DO NOTHING;