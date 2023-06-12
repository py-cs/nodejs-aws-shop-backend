CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" varchar(256) DEFAULT '',
	"price" real NOT NULL
);

CREATE TABLE IF NOT EXISTS "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"count" integer NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "stocks" ADD CONSTRAINT "stocks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
