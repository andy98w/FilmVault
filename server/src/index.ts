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
const PORT = process.env.PORT || 5001;

// Check OCI configuration
if (ociConfig.isConfigValid()) {
  console.log('OCI configuration loaded successfully');
} else {
  console.warn('OCI configuration is not valid or missing. Using fallback configuration.');
}

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('FilmVault API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});