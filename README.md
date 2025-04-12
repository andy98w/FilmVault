# FilmVault

A web application for tracking and rating your favorite movies.

## Project Structure

- `/client` - React frontend application
- `/server` - Node.js/Express backend API
- `/Images` - Static image assets

## Environment Setup

This project requires several environment variables to run correctly. Refer to the [Environment Variables Setup Guide](ENV-SETUP.md) for detailed instructions.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MySQL database
- TMDB API key

### Server Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create and configure the `.env` file using the template in `.env.example`.

4. Run the environment setup script to generate config files:
   ```
   npm run setup-env
   ```

5. Start the server:
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

3. Create and configure the `.env` file using the template in `.env.example`.

4. Start the client application:
   ```
   npm start
   ```

## Features

- Search and browse movies from TMDB
- Create an account and save your favorite movies
- Rate movies and see your collection
- View top-rated movies and popular actors
- Admin features for user management

## Admin Setup

See [Admin README](server/README-admin.md) for details on setting up and using admin features.

## Deployment

See [OCI Deployment Guide](client/oci-deployment-guide.md) for information on deploying to Oracle Cloud Infrastructure.