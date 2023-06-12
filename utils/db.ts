import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const database = process.env.RDS_DB;
const user = process.env.RDS_USER;
const password = process.env.RDS_PASSWORD;
const host = process.env.RDS_HOST;

const connectionString = `postgres://${user}:${password}@${host}:5432/${database}`;
const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });
