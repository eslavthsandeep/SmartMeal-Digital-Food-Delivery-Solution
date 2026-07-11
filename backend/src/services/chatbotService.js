import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (error) {
    console.error('Failed to initialize Gemini AI client:', error.message);
  }
}

const SYSTEM_PROMPT = `
You are a helpful Customer Support Chatbot for the "Food Express" MERN delivery system.
Your sole job is to help users with their food orders, FAQs, refund/cancellation rules, and escalation.
YOU MUST OBSERVE THE FOLLOWING STRICT BOUNDARIES:
- Only answer queries related to:
  1. Order status lookup.
  2. Restaurant / Menu FAQs.
  3. Cancellations & refund policies (orders can be cancelled within 2 minutes of placement; refunds take 5-7 business days).
  4. Escalating to human support.
- DO NOT answer general questions (e.g., writing code, general knowledge, math, creative writing). If a query is outside these topics, say: "I am programmed only to assist with Food Express customer support, order tracking, and FAQ questions. Let me know if you would like me to escalate this chat to a human agent."
- When the user asks to connect to a human agent, connect to support, or escalate, reply with: "I am now escalating your request. A human agent will connect with you shortly." and clearly output "[ESCALATE]" at the end of your response.
- You are provided with the user's recent orders context. Use this context to answer where their order is (e.g., Out for Delivery, Delivered) and mention order items or total pricing naturally.
`;

// Simple rule-based mock AI for when Gemini API key is missing
const generateMockResponse = (userMessage, recentOrders) => {
  const msg = userMessage.toLowerCase();

  // Check for escalation
  if (msg.includes('human') || msg.includes('agent') || msg.includes('support') || msg.includes('escalate') || msg.includes('talk to someone')) {
    return "I am now escalating your request. A human agent will connect with you shortly. [ESCALATE]";
  }

  // Check for order status
  if (msg.includes('order') || msg.includes('status') || msg.includes('where is my')) {
    if (!recentOrders || recentOrders.length === 0) {
      return "I couldn't find any recent orders associated with your account. Please make sure you are logged in and have placed an order.";
    }
    const latest = recentOrders[0];
    const itemNames = latest.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    return `Your latest order #${latest._id.toString().slice(-6)} containing (${itemNames}) is currently in **${latest.status.toUpperCase()}** status. Payment status is **${latest.paymentStatus.toUpperCase()}**. Let me know if you need help with anything else!`;
  }

  // Check for refund or cancellation
  if (msg.includes('cancel') || msg.includes('refund') || msg.includes('money') || msg.includes('return')) {
    return "Under our cancellation policy, you can cancel an order within 2 minutes of placing it for a full refund. After 2 minutes, the restaurant begins preparing the food and refunds cannot be guaranteed. Refunds generally take 5 to 7 business days to process back to your original payment method.";
  }

  // Check for menu/restaurant FAQs
  if (msg.includes('restaurant') || msg.includes('cuisine') || msg.includes('food') || msg.includes('veg') || msg.includes('menu')) {
    return "We offer a wide variety of cuisines including Indian, Chinese, Italian, and fast food from our registered restaurants. You can filter by Vegetarian, ratings, and price directly on our Browse page.";
  }

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hello! I am your Food Express support bot. How can I help you today? You can ask about order status, cancellation policies, FAQs, or ask to connect to a human agent.";
  }

  return "I am programmed only to assist with Food Express customer support, order tracking, and FAQ questions. Let me know if you would like me to escalate this chat to a human agent.";
};

export const getChatbotResponse = async (userMessage, chatHistory, recentOrders) => {
  if (!genAI) {
    // Return mock response immediately if no API key is provided
    return generateMockResponse(userMessage, recentOrders);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Format chat history for Gemini
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Inject system instructions and order status as context into the prompt
    const ordersContextText = recentOrders && recentOrders.length > 0
      ? `User's Recent Orders Context:\n${JSON.stringify(recentOrders.map(o => ({
          id: o._id,
          status: o.status,
          paymentStatus: o.paymentStatus,
          items: o.items.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
          total: o.totalAmount,
          createdAt: o.createdAt
        })), null, 2)}`
      : 'User has no recent orders.';

    const systemPromptAndContext = `${SYSTEM_PROMPT}\n\n${ordersContextText}\n\nUser request: ${userMessage}`;

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 500,
      }
    });

    const result = await chat.sendMessage(systemPromptAndContext);
    const text = result.response.text();
    return text.trim();
  } catch (error) {
    console.error('Gemini API call failed, falling back to mock response:', error.message);
    return generateMockResponse(userMessage, recentOrders);
  }
};
