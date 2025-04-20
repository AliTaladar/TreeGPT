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
<<<<<<< Updated upstream
  origin: '*',
  methods: '*',
  allowedHeaders: '*',
=======
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
>>>>>>> Stashed changes
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('TreeGPT API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Mount routes
app.use('/auth', userRoutes);         // Endpoints: /auth/register, /auth/login
app.use('/conversations', conversationRoutes); // Endpoint: /conversations

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});