import express from 'express';
import { sendMessage, getChatHistory, escalateSession } from '../controllers/chatbotController.js';
import protect from '../middlewares/auth.js';

const router = express.Router();

router.post('/message', protect, sendMessage);
router.get('/history', protect, getChatHistory);
router.post('/escalate', protect, escalateSession);

export default router;
