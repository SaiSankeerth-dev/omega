import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // Owner
  OWNER_EMAIL: z.string().email('OWNER_EMAIL must be a valid email'),

  // App
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3001),

  // Frontend URL (for CORS)
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    console.error('\n❌ Invalid environment variables:\n');
    console.error(errors);
    console.error(
      '\nPlease check your .env file and ensure all required variables are set.\n',
    );

    // Crash immediately on invalid envs in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    throw new Error(`Invalid environment variables:\n${errors}`);
  }

  cachedEnv = result.data;
  return result.data;
}

// Validate env at import time in production
if (process.env.NODE_ENV === 'production') {
  getEnv();
}
