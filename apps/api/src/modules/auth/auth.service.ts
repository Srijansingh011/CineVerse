import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma, Role } from '@repo/database';
import { redis } from '../../lib/redis.js';
import { SignupInput, LoginInput } from '@repo/shared';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'cineverse_local_development_jwt_access_secret_1289371298';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'cineverse_local_development_jwt_refresh_secret_98127391823';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const REFRESH_TOKEN_EXPIRY_SEC = 7 * 24 * 60 * 60; // 7 days in sec

export class AuthService {
  static async signup(input: SignupInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role || Role.USER,
      },
    });

    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token in Redis for session management and revoking
    const redisKey = `refresh_token:${user.id}:${refreshToken}`;
    await redis.set(redisKey, 'true', 'EX', REFRESH_TOKEN_EXPIRY_SEC);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  static async logout(userId: string, refreshToken: string) {
    const redisKey = `refresh_token:${userId}:${refreshToken}`;
    await redis.del(redisKey);
  }

  static async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as {
        id: string;
        email: string;
        role: Role;
      };

      // Verify the token exists in Redis
      const redisKey = `refresh_token:${decoded.id}:${token}`;
      const exists = await redis.get(redisKey);

      if (!exists) {
        throw new Error('Invalid or expired session');
      }

      // Generate a new access token
      const accessToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      return {
        accessToken,
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        },
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
