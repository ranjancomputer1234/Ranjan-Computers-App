import {z} from 'zod';

const emailSchema = z.string().email();
export function normalizeLoginIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function isLoginIdentifier(value: string): boolean {
  if (emailSchema.safeParse(value).success) return true;
  const digits = value.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local);
}

export function loginPhone(value: string): string | undefined {
  if (value.includes('@')) return undefined;
  const digits = value.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : undefined;
}

export const loginSchema = z.object({
  identifier: z.string()
    .transform(normalizeLoginIdentifier)
    .refine(isLoginIdentifier, 'Enter a valid email address or 10-digit mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
