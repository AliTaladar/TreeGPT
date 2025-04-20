// controllers/conversationController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { OpenAI } = require('openai');


// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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


const createMessage = async (req, res) => {
  const { content } = req.body;
  const conversationId = req.params.id;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const newMessage = new Message({
      conversationId,
      parentId: null,
      type: 'user',
      content,
      timestamp: new Date(),
    });

    await newMessage.save();

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content }],
    });
    const assistantResponse = completion.choices[0].message.content;

    const assistantMessage = new Message({
      conversationId,
      parentId: null,
      type: 'assistant',
      content: assistantResponse,
      timestamp: new Date(),
    });
    await assistantMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    if (error instanceof Error && error.message.includes('OpenAI')) {
      return res.status(500).json({ message: 'Failed to generate AI response' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const getMessages = async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user.id;

  try {
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversationId }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createConversation, getConversations, createMessage, getMessages };