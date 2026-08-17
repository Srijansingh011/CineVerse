import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { SignupSchema, LoginSchema } from '@repo/shared';

const router: Router = Router();

router.post('/signup', validate(SignupSchema), AuthController.signup);
router.post('/login', validate(LoginSchema), AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post('/refresh', AuthController.refresh);
router.get('/me', authenticate, AuthController.me);

// Google OAuth 2.0 Placeholder Routes
router.get('/google', (req, res) => {
  res.json({
    status: 'success',
    message: 'Redirect to Google OAuth consent screen (mock)',
    url: 'https://accounts.google.com/o/oauth2/v2/auth?...'
  });
});

router.get('/google/callback', (req, res) => {
  res.json({
    status: 'success',
    message: 'Google OAuth callback handled successfully (mock)',
  });
});

export default router;
