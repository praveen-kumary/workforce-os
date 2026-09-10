import Redis from 'ioredis';
import { env, isTest } from './env';
import { logger } from './logger';

const redisLogger = logger.child({ module: 'redis' });

let redisAvailable = false;

function createRedisClient(): Redis {
  // Use mock in test environment
  if (isTest) {
    const RedisMock = require('ioredis-mock');
    redisLogger.info('Using Redis mock for test environment');
    redisAvailable = true;
    return new RedisMock();
  }

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    lazyConnect: true, // Don't connect automatically
    retryStrategy(times: number) {
      if (times > 3) {
        redisLogger.warn('Redis unavailable after 3 attempts — running without Redis (background jobs disabled)');
        return null; // Stop reconnecting
      }
      const delay = Math.min(times * 500, 2000);
      return delay;
    },
  });

  client.on('connect', () => {
    redisAvailable = true;
    redisLogger.info('Redis connected');
  });

  client.on('ready', () => {
    redisLogger.info('Redis ready');
  });

  client.on('error', () => {
    // Suppress noisy Redis errors — retryStrategy handles logging
  });

  client.on('close', () => {
    redisAvailable = false;
  });

  // Attempt connection without blocking startup
  client.connect().catch(() => {
    redisLogger.info('Redis not available — server running without it');
  });

  return client;
}

export const redisClient = createRedisClient();
export const isRedisAvailable = () => redisAvailable;

export async function disconnectRedis(): Promise<void> {
  if (redisAvailable) {
    await redisClient.quit();
    redisLogger.info('Redis disconnected');
  }
}
