import { InferModel } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import postgres from "postgres";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: varchar("description", { length: 256 }).default(""),
  price: numeric("price").notNull(),
});

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id")
    .notNull()
    .references(() => products.id),
  count: numeric("count").notNull(),
});

export type Product = InferModel<typeof products>;
export type NewProduct = InferModel<typeof products, "insert">;
//  & Pick<NewStock, "count">;

export type Stock = InferModel<typeof stocks>;
export type NewStock = InferModel<typeof stocks, "insert">;

const client = postgres({
  db: process.env.RDS_DB,
  host: process.env.RDS_HOST,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
});

export const db: NodePgDatabase = drizzle(client);
