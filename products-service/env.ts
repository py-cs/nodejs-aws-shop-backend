import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { config } from "dotenv";

config();

export const env = createEnv({
  server: {
    PRODUCTS_AWS_REGION: z.string().min(1),
    DYNAMODB_PRODUCTS_TABLE: z.string().min(1),
    DYNAMODB_STOCKS_TABLE: z.string().min(1),
    IMPORT_BATCH_SIZE: z
      .string()
      .transform((s) => parseInt(s, 10))
      .pipe(z.number()),
  },
  runtimeEnv: process.env,
});
