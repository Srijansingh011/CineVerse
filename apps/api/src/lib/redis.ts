import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

redis.on('connect', () => {
  console.log('Connected to Redis successfully');
});

redis.on('error', (err: any) => {
  console.error('Redis connection error:', err);
});
