import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Min 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Min 8 characters').max(72, 'Max 72 characters'),
  full_name: z.string().min(2, 'Enter your name').max(80),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Min 8 characters').max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
