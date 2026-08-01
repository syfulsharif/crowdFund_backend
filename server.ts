import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/db.js';
import apiRouter from './src/routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize DB Connection
connectDB().catch(err => console.error('Failed to connect to MongoDB:', err));

app.use(cors({
  origin: ['http://localhost:5173', 'https://crowd-fund-client.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API Router
app.use('/api', apiRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.send('CrowdFund API is running.');
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`CrowdFund Express Server running on port ${PORT}`);
  });
}

export default app;
