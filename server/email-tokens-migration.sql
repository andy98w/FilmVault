-- Migration script to add token fields for email verification and password reset

USE myfavmovies;

-- Add verification_token column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL;

-- Add reset_token column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) NULL;

-- Now, check what columns were actually added and log them
SELECT 'Added token columns to users table:' as message;
SHOW COLUMNS FROM users WHERE Field IN ('verification_token', 'reset_token');