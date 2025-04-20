// controllers/conversationController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const mongoose = require('mongoose');

async function getBranchHistory(parentId, conversationId, remainingSteps) {
  if (!parentId || remainingSteps == 0) return [];

  // Convert parentId to ObjectId if it's a string
  const messageId = new mongoose.Types.ObjectId(parentId);

  const message = await Message.findOne({ _id: messageId, conversationId });
  if (!message) return [];

  let history = [];
  if (message.parentId) {
    history = await getBranchHistory(message.parentId, conversationId, remainingSteps - 1);
  }
  history.push(message);

  // If it's a user message, include its assistant response
  if (message.type === 'user') {
    const assistantMessage = await Message.findOne({ parentId: message._id, type: 'assistant' });
    if (assistantMessage) {
      history.push(assistantMessage);
    }
  }

  return history;
}

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Initialize Anthropic client
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });


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
  const { content, parentId } = req.body;
  const conversationId = req.params.id;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    // Convert IDs to ObjectId using 'new'
    const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
    const parentObjectId = parentId ? new mongoose.Types.ObjectId(parentId) : null;

    const conversation = await Conversation.findOne({ _id: conversationObjectId, userId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (parentId) {
      const parentMessage = await Message.findOne({ _id: parentObjectId, conversationId: conversationObjectId });
      if (!parentMessage) {
        return res.status(400).json({ message: 'Invalid parentId' });
      }
    }

    const newMessage = new Message({
      conversationId: conversationObjectId,
      parentId: parentObjectId || null,
      type: 'user',
      content,
      timestamp: new Date(),
    });
    await newMessage.save();

    // Fetch branch history and append the new message
    const history = parentObjectId ? await getBranchHistory(parentObjectId, conversationObjectId, 10) : [];
    history.push(newMessage);

    // // Format history for OpenAI API
    // const openAIMessages = [
    //   { role: 'system', content: 'You are an assistant who remembers the entire conversation history. Use all provided messages to inform your responses.' },
    //   ...history.map(msg => ({ role: msg.type, content: msg.content }))
    // ];

    // // Call OpenAI with the full branch history
    // const completion = await openai.chat.completions.create({
    //   model: 'gpt-3.5-turbo',
    //   messages: openAIMessages,
    // });

    // const assistantResponse = completion.choices[0].message.content;

    // Format history for Anthropic API
    const anthropicMessages = history.map(msg => ({ role: msg.type === 'user' ? 'user' : 'assistant', content: msg.content }));

    // Add system prompt as a separate parameter
    const systemPrompt = 'You are an assistant who remembers the entire conversation history. Use all provided messages to inform your responses.';

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      messages: anthropicMessages,
      system: systemPrompt,
      max_tokens: 1024
    });
    const assistantResponse = response.content[0].text;

    const assistantMessage = new Message({
      conversationId: conversationObjectId,
      parentId: newMessage._id, // AI response is a child of the user message
      type: 'assistant',
      content: assistantResponse,
      timestamp: new Date(),
    });
    await assistantMessage.save();

    res.status(201).json([newMessage, assistantMessage]);
  } catch (error) {
    console.error('Error in createMessage:', error);
    if (error instanceof Error && error.message.includes('Anthropic')) {
      return res.status(500).json({ message: 'Failed to generate AI response' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
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