import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  real,
  integer,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: varchar("description", { length: 256 }).default(""),
  price: real("price").notNull(),
});

export const productRelations = relations(products, ({ one }) => ({
  stocks: one(stocks, {
    fields: [products.id],
    references: [stocks.product_id],
  }),
}));

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id")
    .notNull()
    .references(() => products.id),
  count: integer("count").notNull(),
});
