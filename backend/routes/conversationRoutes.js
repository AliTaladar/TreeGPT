const express = require('express');
const router = express.Router();
const { createConversation, getConversations, createMessage, getMessages } = require('../controllers/conversationController');
const jwtMiddleware = require('../middleware/auth');

router.post('/', jwtMiddleware, createConversation);
router.get('/', jwtMiddleware, getConversations);
router.post('/:id/messages', jwtMiddleware, createMessage);
router.get('/:id/messages', jwtMiddleware, getMessages);

module.exports = router;