import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const database = process.env.RDS_DB;
const user = process.env.RDS_USER;
const password = process.env.RDS_PASSWORD;
const host = process.env.RDS_HOST;

const connectionString = `postgres://${user}:${password}@${host}:5432/${database}`;
const sql = postgres(connectionString, { max: 1 });
export const db = drizzle(sql);

migrate(db, { migrationsFolder: "drizzle" });
