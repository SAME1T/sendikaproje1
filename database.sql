-- Veritabanını oluştur
CREATE DATABASE sendika_db;

-- Veritabanına bağlan
\c sendika_db

-- Kullanıcılar tablosu
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) NOT NULL, -- 'sendika' veya 'isci'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Örnek kullanıcılar (şifreleri düz metin olarak eklenmiştir, gerçek uygulamada hash'lenmiş olmalıdır)
INSERT INTO users (email, password, full_name, user_type) VALUES
('sendika@example.com', 'sendika123', 'Sendika Yöneticisi', 'sendika'),
('isci1@example.com', 'isci123', 'Ahmet Yılmaz', 'isci'),
('isci2@example.com', 'isci123', 'Mehmet Demir', 'isci');

-- İletiler tablosu
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    privacy VARCHAR(20) NOT NULL DEFAULT 'public',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0
);

-- İndeksler
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_privacy ON messages(privacy);
CREATE INDEX idx_messages_user_id ON messages(user_id);

-- Trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 