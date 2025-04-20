// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

const app = express();
const port = 5000;


// Connect to MongoDB
connectDB();

// Global middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Mount routes
app.use('/auth', userRoutes);         // Endpoints: /auth/register, /auth/login
app.use('/conversations', conversationRoutes); // Endpoint: /conversations

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});