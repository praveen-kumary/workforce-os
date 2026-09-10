import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import { redisClient, isRedisAvailable } from '../../config/redis';
import { logger } from '../../config/logger';

export interface TokenPayload {
  employeeId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_BLACKLIST_PREFIX = 'token:blacklist:';
const REFRESH_TOKEN_PREFIX = 'token:refresh:';

// In-memory fallback when Redis is not available
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function memorySet(key: string, ttl: number, value: string) {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

function memoryGet(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memoryDel(key: string) {
  memoryStore.delete(key);
}

class TokenService {
  /**
   * Generate access + refresh token pair.
   */
  generateTokenPair(payload: TokenPayload): TokenPair {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
      jwtid: randomUUID(),
    });

    const refreshSecret = env.JWT_REFRESH_SECRET || env.JWT_SECRET + ':refresh';
    const refreshToken = jwt.sign(
      { employeeId: payload.employeeId, type: 'refresh' },
      refreshSecret,
      {
        expiresIn: env.JWT_REFRESH_EXPIRY as any,
        jwtid: randomUUID(),
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify an access token and return the decoded payload.
   */
  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  }

  /**
   * Verify a refresh token and return the decoded payload.
   */
  verifyRefreshToken(token: string): { employeeId: string; type: string } {
    const refreshSecret = env.JWT_REFRESH_SECRET || env.JWT_SECRET + ':refresh';
    return jwt.verify(token, refreshSecret) as { employeeId: string; type: string };
  }

  /**
   * Blacklist a token (on logout). Stored in Redis until the token's natural expiry.
   * Falls back to in-memory store when Redis is unavailable.
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload | null;
      if (!decoded?.jti || !decoded?.exp) return;

      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        if (isRedisAvailable()) {
          await redisClient.setex(`${TOKEN_BLACKLIST_PREFIX}${decoded.jti}`, ttl, '1');
        } else {
          memorySet(`${TOKEN_BLACKLIST_PREFIX}${decoded.jti}`, ttl, '1');
        }
        logger.info('Token blacklisted', { jti: decoded.jti, ttl });
      }
    } catch (err) {
      logger.error('Error blacklisting token', { error: err });
    }
  }

  /**
   * Check if a token is blacklisted.
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload | null;
      if (!decoded?.jti) return false;

      const key = `${TOKEN_BLACKLIST_PREFIX}${decoded.jti}`;
      if (isRedisAvailable()) {
        const result = await redisClient.get(key);
        return result === '1';
      }
      return memoryGet(key) === '1';
    } catch {
      return false;
    }
  }

  /**
   * Store a refresh token association for a user (for revocation).
   * Falls back to in-memory when Redis is unavailable.
   */
  async storeRefreshToken(employeeId: string, refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.decode(refreshToken) as jwt.JwtPayload | null;
      if (!decoded?.exp) return;

      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        if (isRedisAvailable()) {
          await redisClient.setex(`${REFRESH_TOKEN_PREFIX}${employeeId}`, ttl, refreshToken);
        } else {
          memorySet(`${REFRESH_TOKEN_PREFIX}${employeeId}`, ttl, refreshToken);
        }
      }
    } catch (err) {
      logger.warn('Failed to store refresh token (non-critical)', { error: err });
    }
  }

  /**
   * Revoke all refresh tokens for a user (force logout everywhere).
   */
  async revokeAllTokens(employeeId: string): Promise<void> {
    try {
      const key = `${REFRESH_TOKEN_PREFIX}${employeeId}`;
      if (isRedisAvailable()) {
        await redisClient.del(key);
      } else {
        memoryDel(key);
      }
      logger.info('All tokens revoked for user', { employeeId });
    } catch (err) {
      logger.warn('Failed to revoke tokens (non-critical)', { error: err });
    }
  }
}

export const tokenService = new TokenService();
