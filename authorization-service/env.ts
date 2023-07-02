import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { config } from "dotenv";

config();

export const env = createEnv({
  server: {
    py_cs: z.string().min(1),
  },
  runtimeEnv: process.env,
});
