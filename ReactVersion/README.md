# MyFavMovies React

A modern React implementation of the MyFavMovies PHP application.

## Project Structure

- **client**: React frontend (TypeScript)
- **server**: Node.js/Express API (TypeScript)

## Setup Instructions

### Prerequisites

- Node.js (v14 or newer)
- npm
- MySQL database

### Server Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   
   Update the `.env` file with your database credentials and other settings:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   API_URL=http://localhost:5000
   CLIENT_URL=http://localhost:3000
   ```

4. Start the server in development mode:
   ```
   npm run dev
   ```

### Client Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Features

- User authentication with JWT
- Email verification
- Password reset functionality
- Movie search and browsing
- Add movies to your collection
- Rate and review movies
- View top movies and active users
- User profiles

## Technologies Used

- **Frontend**:
  - React
  - TypeScript
  - React Router
  - Axios
  - CSS

- **Backend**:
  - Node.js
  - Express
  - MySQL
  - JWT
  - Bcrypt

## Improvements from PHP Version

1. Modern single-page application architecture
2. Enhanced security with JWT and bcrypt
3. Improved code organization
4. Type safety with TypeScript
5. Better separation of concerns between frontend and backend

## Database Schema

The application uses the same database schema as the PHP version:

```sql
-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  Usernames VARCHAR(255) NOT NULL,
  Emails VARCHAR(255) NOT NULL UNIQUE,
  Passwords VARCHAR(255) NOT NULL,
  ProfilePic VARCHAR(255) DEFAULT 'default.jpg',
  email_verified_at DATETIME DEFAULT NULL,
  verification_token VARCHAR(255) DEFAULT NULL,
  reset_token VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movies table
CREATE TABLE movies (
  MovieID INT PRIMARY KEY,
  Title VARCHAR(255) NOT NULL,
  PosterPath VARCHAR(255),
  Overview TEXT
);

-- User movies table
CREATE TABLE user_movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL,
  MovieID INT NOT NULL,
  FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (MovieID) REFERENCES movies(MovieID) ON DELETE CASCADE,
  UNIQUE KEY user_movie (UserID, MovieID)
);

-- Movie ratings table
CREATE TABLE movie_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL,
  MovieID INT NOT NULL,
  Rating INT NOT NULL,
  FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (MovieID) REFERENCES movies(MovieID) ON DELETE CASCADE,
  UNIQUE KEY user_movie_rating (UserID, MovieID)
);
```