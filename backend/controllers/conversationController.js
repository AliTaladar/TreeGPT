// controllers/conversationController.js
const Conversation = require('../models/Conversation');

const createConversation = async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const newConversation = new Conversation({
      userId: req.user.id, // From JWT payload
      title,
    });
    await newConversation.save();
    res.status(201).json(newConversation);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user.id });
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createConversation, getConversations };