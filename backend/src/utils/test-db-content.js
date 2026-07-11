import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ChatSession from '../models/ChatSession.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const sessions = await ChatSession.find({});
    console.log('\n--- CHAT SESSIONS ---');
    console.log(JSON.stringify(sessions, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
