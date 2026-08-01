import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from './src/db.js';

dotenv.config();

async function forceSeed() {
  try {
    // 1. Connect temporarily to clear collections
    await mongoose.connect(process.env.MONGODB_URI!);
    const collections = await mongoose.connection.db?.collections() || [];
    for (let collection of collections) {
      try {
        await collection.drop();
      } catch(e) {
        // ignore drop errors
      }
    }
    console.log('Cleared all existing collections in the database.');
    await mongoose.disconnect();

    // 2. Run the main connectDB, which will seed now that it's empty
    await connectDB();
    console.log('Successfully re-seeded the database with fresh dummy data.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed:', err);
    process.exit(1);
  }
}

forceSeed();
