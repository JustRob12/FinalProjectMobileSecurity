-- Create the database
CREATE DATABASE mobile_app_db;

-- Use the database
USE mobile_app_db;

-- Create users table with necessary fields including Firebase support
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    firebase_uid VARCHAR(128) UNIQUE,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255),  -- Can be NULL for Google Sign-In users
    profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_firebase_uid ON users(firebase_uid); 