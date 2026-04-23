import { z } from 'zod';
import { emailSchema, passwordSchema } from './common.validators';

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters')
    .trim(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z
    .string()
    .length(6, 'Two-factor code must be 6 digits')
    .regex(/^\d+$/, 'Two-factor code must be numeric')
    .optional(),
});

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .max(100)
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1)
    .max(100)
    .trim()
    .optional(),
  phone: z
    .string()
    .max(20)
    .optional()
    .nullable(),
  avatarUrl: z
    .string()
    .url('Invalid avatar URL')
    .optional()
    .nullable(),
  experience: z
    .string()
    .max(500)
    .optional()
    .nullable(),
  targetRoles: z
    .array(z.string().min(1).max(100))
    .max(10, 'Maximum 10 target roles allowed')
    .optional(),
});

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.boolean().optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().max(50).optional(),
  lastSelectedRole: z.string().max(100).optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
