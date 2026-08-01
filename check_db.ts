import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from './src/models.js';
dotenv.config();
async function check() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const count = await UserModel.countDocuments();
  console.log('User count:', count);
  process.exit(0);
}
check();
