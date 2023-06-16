import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { config } from "dotenv";

config();

export const env = createEnv({
  server: {
    IMPORT_AWS_REGION: z.string().min(1),
    BUCKET_NAME: z.string().min(1),
  },
  runtimeEnv: process.env,
});
