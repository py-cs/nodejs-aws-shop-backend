import type { Config } from "drizzle-kit";

export default {
  schema: "./utils/db.ts",
  database: process.env.RDS_DB,
  host: process.env.RDS_HOST,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  out: "./drizzle/",
} satisfies Config;
