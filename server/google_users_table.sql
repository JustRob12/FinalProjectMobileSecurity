-- Use the database
USE mobile_app_db;

-- Create a new table for Google sign-in users without foreign key constraint
CREATE TABLE google_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    firebase_uid VARCHAR(128) NOT NULL,
    google_id VARCHAR(128),
    display_name VARCHAR(100),
    email VARCHAR(100) NOT NULL UNIQUE,
    photo_url TEXT,
    last_sign_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (firebase_uid)
);

-- Create indexes for faster lookups
CREATE INDEX idx_google_firebase_uid ON google_users(firebase_uid);
CREATE INDEX idx_google_email ON google_users(email); 