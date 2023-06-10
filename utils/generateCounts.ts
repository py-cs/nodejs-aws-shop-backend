import { readFile, writeFile } from "fs/promises";
import { Stock } from "../types";
import path from "path";

const randomInRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateCounts = async () => {
  const dataPath = path.resolve(__dirname, "..", "data");

  const products = await readFile(
    path.resolve(dataPath, "bikes.json"),
    "utf8"
  ).then(JSON.parse);

  if (
    !Array.isArray(products) ||
    products.some((product) => product.id === undefined)
  )
    throw new Error("products are not an array of objects with id");

  const stocks: Stock[] = products.map(({ id }) => ({
    product_id: id,
    count: randomInRange(1, 10),
  }));

  const fileName = path.resolve(dataPath, "stocks.json");
  await writeFile(fileName, JSON.stringify(stocks, null, 2));
  console.log("generated stocks", stocks);
};

generateCounts();
