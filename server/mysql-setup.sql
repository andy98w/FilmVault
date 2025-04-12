-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS myfavmovies;

-- Use the database
USE myfavmovies;

-- Create admin user with remote access from any host (%)
CREATE USER IF NOT EXISTS 'admin'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON myfavmovies.* TO 'admin'@'%';

-- Create basic tables
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Usernames VARCHAR(255) NOT NULL,
  Emails VARCHAR(255) UNIQUE NOT NULL,
  Passwords VARCHAR(255) NOT NULL,
  ProfilePic VARCHAR(255) DEFAULT 'default.jpg',
  Biography TEXT NULL,
  FacebookLink VARCHAR(255) NULL,
  InstagramLink VARCHAR(255) NULL,
  YoutubeLink VARCHAR(255) NULL,
  GithubLink VARCHAR(255) NULL,
  email_verified_at TIMESTAMP NULL,
  verification_token VARCHAR(255) NULL,
  reset_token VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tmdb_id INT UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  poster_path VARCHAR(255),
  release_date DATE,
  overview TEXT
);

CREATE TABLE IF NOT EXISTS user_movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  movie_id INT,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS movie_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  movie_id INT,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

-- Flush privileges to apply changes
FLUSH PRIVILEGES;