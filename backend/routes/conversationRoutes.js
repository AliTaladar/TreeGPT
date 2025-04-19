const express = require('express');
const router = express.Router();
const { createConversation } = require('../controllers/conversationController');
const { getConversations } = require('../controllers/conversationController');
const jwtMiddleware = require('../middleware/auth');

router.post('/', jwtMiddleware, createConversation);
router.get('/', jwtMiddleware, getConversations);

module.exports = router;