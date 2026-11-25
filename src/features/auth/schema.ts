import {z} from 'zod';

const emailSchema = z.string().email();
export function normalizeLoginIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function isLoginIdentifier(value: string): boolean {
  return emailSchema.safeParse(value).success;
}

export const loginSchema = z.object({
  identifier: z.string()
    .transform(normalizeLoginIdentifier)
    .refine(isLoginIdentifier, 'Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
