-- Migration script to add new profile fields to existing databases

USE myfavmovies;

-- Add Biography column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS Biography TEXT NULL;

-- Add social media link columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS FacebookLink VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS InstagramLink VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS YoutubeLink VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS GithubLink VARCHAR(255) NULL;

-- Now, check what columns were actually added and log them
SELECT 'Added new columns to users table:' as message;
SHOW COLUMNS FROM users WHERE Field IN ('Biography', 'FacebookLink', 'InstagramLink', 'YoutubeLink', 'GithubLink');