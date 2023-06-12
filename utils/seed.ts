import { readFile } from "fs/promises";
import { Product } from "../types";
import path from "path";
import { products, stocks } from "./schema";
import { db } from "./migrate";

const randomInRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const seed = async () => {
  const dataPath = path.resolve(__dirname, "..", "data");

  const productsData = (await readFile(
    path.resolve(dataPath, "products.json"),
    "utf8"
  ).then(JSON.parse)) as Product[];

  const productsToAdd = productsData.map((p) => ({
    title: p.title,
    description: p.description,
    price: p.price,
  }));

  const addedProducts = await db
    .insert(products)
    .values(productsToAdd)
    .returning();

  const ids = addedProducts.map((p) => ({
    product_id: p.id,
    count: randomInRange(1, 10),
  }));

  await db.insert(stocks).values(ids);
};

seed();
