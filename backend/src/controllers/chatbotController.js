import ChatSession from '../models/ChatSession.js';
import Order from '../models/Order.js';
import { getChatbotResponse } from '../services/chatbotService.js';

// @desc    Send a message to the AI support chatbot
// @route   POST /api/chatbot/message
// @access  Private
export const sendMessage = async (req, res, next) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    // 1. Get or create chat session
    let session = await ChatSession.findOne({ userId, escalated: false });
    if (!session) {
      session = await ChatSession.create({
        userId,
        messages: [{ role: 'system', content: 'Support session initialized.' }]
      });
    }

    // 2. Retrieve recent order history context (limit to 3 for size)
    const recentOrders = await Order.find({ customerId: userId })
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .limit(3);

    // 3. Format chat history for context (exclude system messages)
    const chatHistory = session.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    // 4. Get response from Chatbot Service (Gemini API or mock fallback)
    const chatbotResponseRaw = await getChatbotResponse(message, chatHistory, recentOrders);

    // 5. Check if response signals human escalation
    let chatbotResponse = chatbotResponseRaw;
    if (chatbotResponse.includes('[ESCALATE]')) {
      chatbotResponse = chatbotResponse.replace('[ESCALATE]', '').trim();
      session.escalated = true;
    }

    // 6. Update database session messages
    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'model', content: chatbotResponse });
    await session.save();

    res.json({
      success: true,
      data: {
        response: chatbotResponse,
        escalated: session.escalated,
        messages: session.messages.filter(m => m.role !== 'system')
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current chat session messages
// @route   GET /api/chatbot/history
// @access  Private
export const getChatHistory = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({ userId: req.user.id, escalated: false });
    if (!session) {
      return res.json({ success: true, messages: [] });
    }
    const userMessages = session.messages.filter(m => m.role !== 'system');
    res.json({ success: true, messages: userMessages });
  } catch (error) {
    next(error);
  }
};

// @desc    Escalate session manually
// @route   POST /api/chatbot/escalate
// @access  Private
export const escalateSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({ userId: req.user.id, escalated: false });
    if (session) {
      session.escalated = true;
      session.messages.push({
        role: 'system',
        content: 'Session escalated to a human support agent.'
      });
      await session.save();
    }
    res.json({ success: true, message: 'Your support ticket has been escalated. An agent will connect shortly.' });
  } catch (error) {
    next(error);
  }
};
