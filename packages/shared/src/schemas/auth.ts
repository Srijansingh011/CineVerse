import { z } from 'zod';

export const SignupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  role: z.enum(['USER', 'THEATRE_OWNER', 'ADMIN', 'SUPER_ADMIN']).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Token is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
