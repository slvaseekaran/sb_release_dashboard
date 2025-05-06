require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const routes = require('./src/routes/api');


// Initialize app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORTANT: Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', routes);

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create required directories if they don't exist
const dirs = ['data', 'temp', 'uploads'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Release Notes API running at http://localhost:${port}`);
});
