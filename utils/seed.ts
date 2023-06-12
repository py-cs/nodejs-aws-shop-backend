import { readFile, writeFile } from "fs/promises";
import { Product, Stock } from "../types";
import path from "path";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const randomInRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const fillTables = async () => {
  const dataPath = path.resolve(__dirname, "..", "data");

  const products = (await readFile(
    path.resolve(dataPath, "products.json"),
    "utf8"
  ).then(JSON.parse)) as Product[];

  const dynamoClient = new DynamoDBClient({
    region: "eu-north-1",
  });

  products.forEach((p) => {
    const productBatch = new PutItemCommand({
      TableName: "products",
      Item: {
        id: { S: p.id },
        title: { S: p.title },
        description: { S: p.description },
        price: { N: p.price.toString() },
      },
    });

    dynamoClient.send(productBatch);

    const stockBatch = new PutItemCommand({
      TableName: "stocks",
      Item: {
        product_id: { S: p.id },
        count: { N: randomInRange(1, 10).toString() },
      },
    });

    dynamoClient.send(stockBatch);
  });
};

fillTables();
