import { readFile } from "fs/promises";
import { Product } from "../types";
import path from "path";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { env } from "../env";

const randomInRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const seed = async () => {
  const dataPath = path.resolve(__dirname, "..", "data");

  const products = (await readFile(
    path.resolve(dataPath, "products.json"),
    "utf8"
  ).then(JSON.parse)) as Product[];

  const dynamoClient = new DynamoDBClient({ region: env.PRODUCTS_AWS_REGION });

  products.forEach((p) => {
    const productBatch = new PutItemCommand({
      TableName: env.DYNAMODB_PRODUCTS_TABLE,
      Item: {
        id: { S: p.id },
        title: { S: p.title },
        description: { S: p.description },
        price: { N: p.price.toString() },
      },
    });

    dynamoClient.send(productBatch);

    const stockBatch = new PutItemCommand({
      TableName: env.DYNAMODB_STOCKS_TABLE,
      Item: {
        product_id: { S: p.id },
        count: { N: randomInRange(1, 10).toString() },
      },
    });

    dynamoClient.send(stockBatch);
  });
};

seed();
