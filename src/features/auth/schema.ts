import {z} from 'zod';

const emailSchema = z.string().email();
export function normalizeLoginIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export const loginSchema = z.object({
  identifier: z.string()
    .transform(normalizeLoginIdentifier)
    .refine(
      value => emailSchema.safeParse(value).success,
      'Enter a valid email address',
    ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
