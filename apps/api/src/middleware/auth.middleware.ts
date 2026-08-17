import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma, Role } from '@repo/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ status: 'error', message: 'Unauthorized: Missing token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid token format' });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'cineverse_local_development_jwt_access_secret_1289371298'
    ) as {
      id: string;
      email: string;
      role: Role;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      res.status(401).json({ status: 'error', message: 'Unauthorized: User no longer exists' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    res.status(401).json({ status: 'error', message: 'Unauthorized: Token invalid or expired' });
  }
};

export const authorize = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ status: 'error', message: 'Forbidden: You do not have permission to perform this action' });
      return;
    }
    next();
  };
};
