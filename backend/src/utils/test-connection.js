import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing connection to MongoDB URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('SUCCESS: Successfully connected to MongoDB Atlas!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('CONNECTION ERROR:', err.message);
    console.error('FULL ERROR DETAILS:', err);
    process.exit(1);
  });
