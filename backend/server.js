// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

const app = express();
const port = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Global middleware
app.use(cors({
  origin: '*',
  methods: '*',
  allowedHeaders: '*',
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('TreeGPT API is running');
});

// Mount routes
app.use('/auth', userRoutes);         // Endpoints: /auth/register, /auth/login
app.use('/conversations', conversationRoutes); // Endpoint: /conversations

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export the app for testing or other imports
module.exports = app;
