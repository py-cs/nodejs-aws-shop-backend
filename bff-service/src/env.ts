import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import { config } from 'dotenv';

config();

export const env = createEnv({
  server: {
    PORT: z
      .string()
      .default('3000')
      .transform((s) => parseInt(s, 10))
      .pipe(z.number()),
    CACHE_TIME: z
      .string()
      .default('2')
      .transform((s) => parseInt(s, 10))
      .pipe(z.number()),
    product: z.string().url(),
    cart: z.string().url(),
  },
  runtimeEnv: process.env,
  // skipValidation: true,
});
