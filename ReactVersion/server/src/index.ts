import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import authRoutes from './routes/auth';
import movieRoutes from './routes/movies';
import userRoutes from './routes/users';
import './config/db'; // Initialize database connection
import { ociConfig } from './config/oci'; // Import OCI configuration

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Check OCI configuration
if (ociConfig.isConfigValid()) {
  console.log('OCI configuration loaded successfully');
} else {
  console.warn('OCI configuration is not valid or missing. Using fallback configuration.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('MyFavMovies API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});