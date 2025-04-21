import express from 'express';

const app = express();
const PORT = 3002;

// Log all requests with detailed path information
app.use((req, res, next) => {
  console.log('----------------------------------------');
  console.log(`Request: ${req.method} ${req.originalUrl}`);
  console.log(`Path parts: ${req.path} | ${req.baseUrl}`);
  console.log('Headers:', JSON.stringify(req.headers));
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Test app root' });
});

// Without /api prefix
app.get('/ping', (req, res) => {
  res.json({ message: 'pong - no prefix' });
});

// With /api prefix
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong - with /api prefix' });
});

// Test all combinations
app.get('/api/test', (req, res) => {
  res.json({ message: 'test with /api prefix' });
});

app.get('/test', (req, res) => {
  res.json({ message: 'test without /api prefix' });
});

// Route with /api prefix using router
const apiRouter = express.Router();
apiRouter.get('/router-test', (req, res) => {
  res.json({ message: 'router test' });
});
app.use('/api', apiRouter);

// Catch all route for unmatched paths
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found in test app',
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    registeredRoutes: [
      '/',
      '/ping',
      '/api/ping',
      '/api/test',
      '/test',
      '/api/router-test'
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});

export default app;