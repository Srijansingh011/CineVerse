import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { AuthRequest } from '../../middleware/auth.middleware.js';

const COOKIE_NAME = 'refreshToken';

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.signup(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Registration successful',
        data: { user },
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Registration failed',
      });
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, accessToken, refreshToken } = await AuthService.login(req.body);

      // Set HTTP-only cookie for refresh token
      res.cookie(COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      });

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          accessToken,
          user,
        },
      });
    } catch (error: any) {
      res.status(401).json({
        status: 'error',
        message: error.message || 'Login failed',
      });
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies[COOKIE_NAME] || req.body.refreshToken;
      const userId = req.user!.id;

      if (userId && refreshToken) {
        await AuthService.logout(userId, refreshToken);
      }

      res.clearCookie(COOKIE_NAME);
      res.status(200).json({
        status: 'success',
        message: 'Logout successful',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Logout failed',
      });
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies[COOKIE_NAME] || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          status: 'error',
          message: 'Refresh token is required',
        });
        return;
      }

      const { accessToken, user } = await AuthService.refresh(refreshToken);

      res.status(200).json({
        status: 'success',
        data: {
          accessToken,
          user,
        },
      });
    } catch (error: any) {
      res.status(401).json({
        status: 'error',
        message: error.message || 'Session expired, please login again',
      });
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        status: 'success',
        data: {
          user: req.user,
        },
      });
    } catch (error: any) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
    }
  }
}
